import type { BoardData, TelemetryConfig, TelemetryData, BoardContext } from '../types/telemetry';
import type { JiraIssue } from '../types/jira';
import { BoardDiscoveryService } from './board/BoardDiscoveryService';
import { JiraDataService } from './data/JiraDataService';
import { issueSearchService } from './data/IssueSearchService';
import { IssueCategorizer } from './issue/IssueCategorizer';
import { MetricCalculator } from './metrics/MetricCalculator';
import { fieldDiscoveryService } from './data/FieldDiscoveryService';
import { SecurityGuard } from './security/SecurityGuard';

const DEFAULT_CONFIG: TelemetryConfig = {
  wipLimit: 8,
  assigneeCapacity: 3,
  stalledThresholdHours: 24,
  stalledThresholdHoursByType: {},
  storyPointsFieldName: 'Story Points',
  statusCategories: { todo: 'new', inProgress: 'indeterminate', done: 'done' },
  includeBoardIssuesWhenSprintEmpty: true,
  locale: 'en'
};

const discoveryService = new BoardDiscoveryService();
const dataService = new JiraDataService();

export async function detectBoardType(projectKey: string): Promise<BoardContext> {
    return discoveryService.detectBoardType(projectKey);
}

export async function fetchBoardData(projectKey: string, config: TelemetryConfig = DEFAULT_CONFIG, context?: any): Promise<BoardData> {
    // SECURITY GUARD: Enforce permissions before attempting fetch
    let security = context?.security;
    if (!security) {
        const guard = new SecurityGuard();
        security = await guard.validateContext(projectKey);
    }

    // STRICT CHECK: The app primarily uses asUser() for data fetching.
    // If the user lacks BROWSE_PROJECTS, we cannot fetch data even if the App has permission.
    if (!security.canReadProject || !security.permissions.userBrowse) {
        console.warn(`[Telemetry] Access Denied for ${projectKey} (User Browse: ${security.permissions.userBrowse})`);
        return {
            boardType: 'business',
            boardId: null,
            boardName: 'Restricted Access',
            issues: [],
            historicalIssues: []
        };
    }

    const boardInfo = await detectBoardType(projectKey);

    // If sprints are restricted (User lacks Agile permissions), force business mode (JQL only)
    // This prevents 401 errors from agile endpoints
    if (!security.canReadSprints && boardInfo.boardType !== 'business') {
         console.warn(`[Telemetry] User lacks Agile permissions for ${projectKey}, falling back to Business/JQL mode.`);
         // If user cannot browse, even business fetch might fail if it uses asUser.
         // But we let it try or it will return empty if we add check inside fetchBusiness.
         if (!security.permissions.userBrowse) {
             return { boardType: 'business', boardId: null, boardName: 'No Access', issues: [], historicalIssues: [] };
         }
         return fetchBusinessProjectData(projectKey, config);
    }

    if (boardInfo.boardType === 'business') {
        return fetchBusinessProjectData(projectKey, config);
    }

    if (boardInfo.boardType === 'kanban') {
        return fetchKanbanData(boardInfo, config);
    }

    return fetchScrumData(boardInfo, config, projectKey);
}

async function fetchBusinessProjectData(projectKey: string, config?: TelemetryConfig): Promise<BoardData> {
    const jql = `project = "${projectKey}" ORDER BY updated DESC`;
    // Fetch generic issues for display
    const result = await dataService.searchJqlUserOnly(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100);

    // Fetch historical data for flow metrics (last 30 days completed)
    const customFields = await fieldDiscoveryService.discoverCustomFields();
    const storyPointsField = customFields.storyPoints || null;

    const fields = ['status', 'created', 'resolutiondate', 'updated'];
    if (storyPointsField) fields.push(storyPointsField);

    const historyJql = `project = "${projectKey}" AND statusCategory = Done AND updated >= -30d`;
    const historyResult = await dataService.searchJqlUserOnly(historyJql, fields, 200, ['changelog']);

    return {
        boardType: 'business',
        boardId: null,
        boardName: 'Work Items',
        issues: result.ok ? result.issues : [],
        historicalIssues: historyResult.ok ? historyResult.issues : []
    };
}

async function fetchScrumData(boardCtx: BoardContext, config: TelemetryConfig, projectKey?: string): Promise<BoardData> {
    const boardId = boardCtx.boardId!;
    let activeSprint = await dataService.getBoardActiveSprint(boardId);

    // Fetch Closed Sprints for Velocity Calculation
    const closedSprints = await dataService.getClosedSprints(boardId, 5);

    // Fetch Historical Issues (Issues from Closed Sprints)
    // We need this to calculate accurate velocity based on what was actually in those sprints
    let historicalIssues: JiraIssue[] = [];
    if (closedSprints.length > 0) {
        const sprintIds = closedSprints.map(s => s.id).join(',');
        const historyJql = `sprint in (${sprintIds})`;

        // Discover story points field to fetch it
        const customFields = await fieldDiscoveryService.discoverCustomFields();
        const storyPointsField = customFields.storyPoints || null;

        const fieldsToFetch = ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels', 'resolutiondate'];
        if (storyPointsField) {
            fieldsToFetch.push(storyPointsField);
        }

        // We fetch changelog for Cycle Time calculation
        const historyRes = await issueSearchService.search(historyJql, fieldsToFetch, false);
        historicalIssues = historyRes.ok ? historyRes.issues : [];
    }

    if (!activeSprint) {
        activeSprint = await dataService.getBoardFutureSprints(boardId);
    }

    if (!activeSprint && projectKey) {
        const jql = `project = "${projectKey}" AND sprint in openSprints()`;
        const result = await dataService.searchJqlUserOnly(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100);

        if (result.ok && result.issues.length > 0) {
            return {
                ...boardCtx,
                sprint: { id: -1, name: 'Active Sprint (JQL Detected)', state: 'active' },
                issues: result.issues,
                closedSprints,
                historicalIssues
            };
        }
    }

    if (!activeSprint) {
         if (config?.includeBoardIssuesWhenSprintEmpty !== false) {
             const issues = await fetchAllBoardIssues(boardId, projectKey);
             return { ...boardCtx, issues, sprint: undefined, closedSprints, historicalIssues };
         }
         // Graceful fallback instead of error
         console.warn(`[Telemetry] No sprints found for board ${boardId}. Returning empty state.`);
         return { ...boardCtx, issues: [], sprint: undefined, closedSprints, historicalIssues };
    }

    const initialJql = `sprint = ${activeSprint.id}`;
    const initialJqlRes = await issueSearchService.search(initialJql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], false);

    const sprintObj = {
        id: activeSprint.id,
        name: activeSprint.name,
        state: activeSprint.state,
        startDate: activeSprint.startDate,
        endDate: activeSprint.endDate,
        goal: activeSprint.goal
    };

    if (initialJqlRes.ok && initialJqlRes.issues.length > 0) {
        return { ...boardCtx, sprint: sprintObj, issues: initialJqlRes.issues, closedSprints, historicalIssues };
    }

    const issues = await fetchAllBoardIssues(boardId, projectKey, activeSprint.id);
    return { ...boardCtx, sprint: sprintObj, issues, closedSprints, historicalIssues };
}

async function fetchKanbanData(boardCtx: BoardContext, config?: TelemetryConfig): Promise<BoardData> {
    const boardId = boardCtx.boardId!;
    const apiIssues = await dataService.getKanbanBoardIssues(boardId);

    // Fetch historical data for Cycle Time (last 30 days completed)
    let historicalIssues: JiraIssue[] = [];
    if (apiIssues.length > 0) {
         // Infer project from first issue
         const projectKey = apiIssues[0].fields?.project?.key || apiIssues[0].key.split('-')[0];
         if (projectKey) {
            const customFields = await fieldDiscoveryService.discoverCustomFields();
            const storyPointsField = customFields.storyPoints || null;

            const fields = ['status', 'created', 'resolutiondate', 'updated'];
            if (storyPointsField) fields.push(storyPointsField);

             const historyJql = `project = "${projectKey}" AND statusCategory = Done AND updated >= -30d`;
             const historyRes = await dataService.searchJqlUserOnly(historyJql, fields, 200, ['changelog']);
             if (historyRes.ok) historicalIssues = historyRes.issues;
         }
    }

    if (apiIssues.length > 0) return { ...boardCtx, issues: apiIssues, historicalIssues };

    const filterIssues = await fetchAllBoardIssues(boardId);
    if (filterIssues.length > 0) return { ...boardCtx, issues: filterIssues, historicalIssues };

    return { ...boardCtx, issues: [], historicalIssues: [] };
}

async function fetchAllBoardIssues(boardId: number, projectKey?: string, sprintId?: number): Promise<JiraIssue[]> {
    const cfg = await dataService.getBoardConfiguration(boardId);
    const filterId = cfg?.filter?.id;

    if (filterId) {
        let jql = `filter = ${filterId}`;
        if (sprintId) jql += ` AND sprint = ${sprintId}`;
        const res = await dataService.searchJqlUserOnly(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100);
        if (res.ok) return res.issues;
    }

    if (projectKey) {
        const jql = `project = "${projectKey}" ORDER BY updated DESC`;
        const res = await dataService.searchJqlUserOnly(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100);
        if (res.ok) return res.issues;
    }

    return [];
}

export async function calculateTelemetry(boardData: BoardData, config: TelemetryConfig = DEFAULT_CONFIG, statusMap?: any): Promise<TelemetryData> {
    const categorizer = new IssueCategorizer(statusMap);
    const calculator = new MetricCalculator(categorizer, config);
    return calculator.calculate(boardData);
}

export function detectStalledTickets(issues: JiraIssue[], config: TelemetryConfig = DEFAULT_CONFIG, statusMap?: any) {
    const categorizer = new IssueCategorizer(statusMap);
    const now = new Date();
    const { stalledThresholdHours, statusCategories, stalledThresholdHoursByType } = config;

    return issues.filter(issue => {
        const statusCategory = categorizer.getStatusCategory(issue);
        const isInProgress = statusCategory === statusCategories.inProgress;
        const updated = new Date(issue.fields.updated || 0);
        const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
        const priority = issue.fields.priority?.name || 'Medium';
        const isHighPriority = ['Highest', 'High', 'Critical', 'Blocker'].includes(priority);

        const typeName = (issue.fields.issuetype?.name || '').toLowerCase();
        const typeThreshold = stalledThresholdHoursByType?.[typeName] ?? stalledThresholdHours;

        return isInProgress && hoursSinceUpdate > typeThreshold && isHighPriority;
    }).map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        status: issue.fields.status?.name,
        statusCategory: categorizer.getStatusCategory(issue),
        hoursSinceUpdate: Math.round((now.getTime() - new Date(issue.fields.updated || 0).getTime()) / (1000 * 60 * 60)),
        priority: issue.fields.priority?.name,
        reason: categorizer.inferBlockingReason(issue)
    }));
}

export function categorizeIssues(issues: JiraIssue[], statusMap?: any) {
    const categorizer = new IssueCategorizer(statusMap);
    return issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        statusCategory: categorizer.getStatusCategory(issue),
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        updated: issue.fields.updated,
        priority: issue.fields.priority?.name || 'Medium',
        isStalled: false
    }));
}

export const fetchSprintData = fetchBoardData;
export { DEFAULT_CONFIG };

export async function searchJqlUserOnly(jql: string, fields: string[], limit = 100) {
    return dataService.searchJqlUserOnly(jql, fields, limit);
}

// RESTORED: discoverCustomFields for backward compatibility with rovoActions.ts and index.ts
export async function discoverCustomFields() {
    return fieldDiscoveryService.discoverCustomFields();
}

export function getFieldCacheSnapshot() {
    return fieldDiscoveryService.getCacheSnapshot();
}
