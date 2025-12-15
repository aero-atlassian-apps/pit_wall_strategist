import type { BoardData, TelemetryConfig, TelemetryData, BoardContext } from '../types/telemetry';
import type { JiraIssue } from '../types/jira';
import { BoardDiscoveryService } from './board/BoardDiscoveryService';
import { JiraDataService } from './data/JiraDataService';
import { IssueCategorizer } from './issue/IssueCategorizer';
import { MetricCalculator } from './metrics/MetricCalculator';
import { fieldDiscoveryService } from './data/FieldDiscoveryService';

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
    console.log('[fetchBoardData] received context:', context);
    const boardInfo = await detectBoardType(projectKey);

    if (boardInfo.boardType === 'business') {
        return fetchBusinessProjectData(projectKey);
    }

    if (boardInfo.boardType === 'kanban') {
        return fetchKanbanData(boardInfo);
    }

    return fetchScrumData(boardInfo, config, projectKey);
}

async function fetchBusinessProjectData(projectKey: string): Promise<BoardData> {
    const jql = `project = "${projectKey}" ORDER BY updated DESC`;
    const result = await dataService.searchJqlUserOnly(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100);

    return {
        boardType: 'business',
        boardId: null,
        boardName: 'Work Items',
        issues: result.ok ? result.issues : []
    };
}

async function fetchScrumData(boardCtx: BoardContext, config: TelemetryConfig, projectKey?: string): Promise<BoardData> {
    const boardId = boardCtx.boardId!;
    let activeSprint = await dataService.getBoardActiveSprint(boardId);

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
                issues: result.issues
            };
        }
    }

    if (!activeSprint) {
         if (config?.includeBoardIssuesWhenSprintEmpty !== false) {
             const issues = await fetchAllBoardIssues(boardId, projectKey);
             return { ...boardCtx, issues, sprint: undefined };
         }
         // Graceful fallback instead of error
         console.warn(`[Telemetry] No sprints found for board ${boardId}. Returning empty state.`);
         return { ...boardCtx, issues: [], sprint: undefined };
    }

    const initialJql = `sprint = ${activeSprint.id}`;
    const initialJqlRes = await dataService.searchJqlUserOnly(initialJql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100);

    const sprintObj = {
        id: activeSprint.id,
        name: activeSprint.name,
        state: activeSprint.state,
        startDate: activeSprint.startDate,
        endDate: activeSprint.endDate,
        goal: activeSprint.goal
    };

    if (initialJqlRes.ok && initialJqlRes.issues.length > 0) {
        return { ...boardCtx, sprint: sprintObj, issues: initialJqlRes.issues };
    }

    const issues = await fetchAllBoardIssues(boardId, projectKey, activeSprint.id);
    return { ...boardCtx, sprint: sprintObj, issues };
}

async function fetchKanbanData(boardCtx: BoardContext): Promise<BoardData> {
    const boardId = boardCtx.boardId!;
    const apiIssues = await dataService.getKanbanBoardIssues(boardId);
    if (apiIssues.length > 0) return { ...boardCtx, issues: apiIssues };

    const filterIssues = await fetchAllBoardIssues(boardId);
    if (filterIssues.length > 0) return { ...boardCtx, issues: filterIssues };

    return { ...boardCtx, issues: [] };
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
