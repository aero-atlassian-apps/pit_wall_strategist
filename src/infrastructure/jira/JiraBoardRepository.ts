import type { BoardData, TelemetryConfig, BoardContext } from '../../types/telemetry';
import type { JiraIssue } from '../../types/jira';
import { BoardDiscoveryService } from '../services/BoardDiscoveryService';
import { JiraDataService } from '../jira/JiraDataService';
import { SecurityGuard } from '../services/SecurityGuard';
import { issueSearchService } from '../services/IssueSearchService';
import { fieldDiscoveryService } from '../services/FieldDiscoveryService';
import { DEFAULT_CONFIG } from '../services/LegacyTelemetryAdapter';

const discoveryService = new BoardDiscoveryService();
const dataService = new JiraDataService();

export class JiraBoardRepository {

    async detectBoardType(projectKey: string): Promise<BoardContext> {
        return discoveryService.detectBoardType(projectKey);
    }

    async getBoardData(projectKey: string, config: TelemetryConfig = DEFAULT_CONFIG, context?: any): Promise<BoardData> {
        // SECURITY GUARD: Enforce permissions
        let security = context?.security;
        if (!security) {
            const guard = new SecurityGuard();
            security = await guard.validateContext(projectKey);
        }

        if (!security.permissions.userBrowse && !security.permissions.appBrowse) {
            console.warn(`[Telemetry] Access Denied for ${projectKey}.`);
            return this.createRestrictedBoardData(true);
        }

        const boardInfo = await this.detectBoardType(projectKey);

        if (!security.permissions.userBrowse && boardInfo.boardType !== 'business') {
            console.warn(`[Telemetry] Falling back to Business/JQL mode due to missing Agile permissions.`);
            if (!security.permissions.userBrowse && !security.permissions.appBrowse) {
                return this.createRestrictedBoardData(false, 'No Access');
            }
            return this.fetchBusinessProjectData(projectKey, config);
        }

        if (boardInfo.boardType === 'business') {
            return this.fetchBusinessProjectData(projectKey, config);
        }

        if (boardInfo.boardType === 'kanban') {
            return this.fetchKanbanData(boardInfo, config);
        }

        return this.fetchScrumData(boardInfo, config, projectKey);
    }

    private createRestrictedBoardData(isRestricted: boolean, name = 'Restricted Access'): BoardData {
        return {
            boardType: 'business',
            boardId: null,
            boardName: name,
            issues: [],
            historicalIssues: [],
            isRestricted
        };
    }

    private async fetchBusinessProjectData(projectKey: string, config?: TelemetryConfig): Promise<BoardData> {
        const jql = `project = "${projectKey}" ORDER BY updated DESC`;
        const result = await issueSearchService.search(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels', 'resolutiondate']);

        const customFields = await fieldDiscoveryService.discoverCustomFields();
        const storyPointsField = customFields.storyPoints || null;
        const fields = ['status', 'created', 'resolutiondate', 'updated'];
        if (storyPointsField) fields.push(storyPointsField);

        const historyJql = `project = "${projectKey}" AND statusCategory = Done AND updated >= -30d`;
        const historyResult = await issueSearchService.search(historyJql, fields, true);

        return {
            boardType: 'business',
            boardId: null,
            boardName: 'Work Items',
            issues: result.ok ? result.issues : [],
            historicalIssues: historyResult.ok ? historyResult.issues : []
        };
    }

    private async fetchScrumData(boardCtx: BoardContext, config: TelemetryConfig, projectKey?: string): Promise<BoardData> {
        const boardId = boardCtx.boardId!;
        let activeSprint = await dataService.getBoardActiveSprint(boardId);

        const closedSprints = await dataService.getClosedSprints(boardId, 5);
        let historicalIssues: JiraIssue[] = [];

        if (closedSprints.length > 0) {
            const sprintIds = closedSprints.map(s => s.id).join(',');
            const historyJql = `sprint in (${sprintIds})`;
            const customFields = await fieldDiscoveryService.discoverCustomFields();
            const storyPointsField = customFields.storyPoints || null;
            const fieldsToFetch = ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels', 'resolutiondate'];
            if (storyPointsField) fieldsToFetch.push(storyPointsField);

            const historyRes = await issueSearchService.search(historyJql, fieldsToFetch, false);
            historicalIssues = historyRes.ok ? historyRes.issues : [];
        }

        if (!activeSprint) {
            activeSprint = await dataService.getBoardFutureSprints(boardId);
        }

        if (!activeSprint && projectKey) {
            const jql = `project = "${projectKey}" AND sprint in openSprints()`;
            try {
                const result = await issueSearchService.search(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels', 'resolutiondate']);
                if (result.ok && result.issues.length > 0) {
                    return {
                        ...boardCtx,
                        sprint: { id: -1, name: 'Active Sprint (JQL Detected)', state: 'active' },
                        issues: result.issues,
                        closedSprints,
                        historicalIssues
                    };
                }
            } catch (e) {
                console.warn(`[Telemetry] Fallback JQL failed for ${projectKey}`, e);
            }
        }

        if (!activeSprint) {
            if (config?.includeBoardIssuesWhenSprintEmpty !== false) {
                const issues = await this.fetchAllBoardIssues(boardId, projectKey);
                return { ...boardCtx, issues, sprint: undefined, closedSprints, historicalIssues };
            }
            console.warn(`[Telemetry] No sprints found for board ${boardId}. Returning empty state.`);
            return { ...boardCtx, issues: [], sprint: undefined, closedSprints, historicalIssues };
        }

        const initialJql = `sprint = ${activeSprint.id}`;
        const initialJqlRes = await issueSearchService.search(initialJql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels', 'resolutiondate'], false);

        const sprintObj = {
            id: activeSprint.id, // Fixed: removed .id.id if that was ever an error
            name: activeSprint.name,
            state: activeSprint.state,
            startDate: activeSprint.startDate,
            endDate: activeSprint.endDate,
            goal: activeSprint.goal
        };

        if (initialJqlRes.ok && initialJqlRes.issues.length > 0) {
            return { ...boardCtx, sprint: sprintObj, issues: initialJqlRes.issues, closedSprints, historicalIssues };
        }

        const issues = await this.fetchAllBoardIssues(boardId, projectKey, activeSprint.id);
        return { ...boardCtx, sprint: sprintObj, issues, closedSprints, historicalIssues };
    }

    private async fetchKanbanData(boardCtx: BoardContext, config?: TelemetryConfig): Promise<BoardData> {
        const boardId = boardCtx.boardId!;
        const apiIssues = await dataService.getKanbanBoardIssues(boardId);
        let historicalIssues: JiraIssue[] = [];

        if (apiIssues.length > 0) {
            const projectKey = apiIssues[0].fields?.project?.key || apiIssues[0].key.split('-')[0];
            if (projectKey) {
                const customFields = await fieldDiscoveryService.discoverCustomFields();
                const storyPointsField = customFields.storyPoints || null;
                const fields = ['status', 'created', 'resolutiondate', 'updated'];
                if (storyPointsField) fields.push(storyPointsField);
                const historyJql = `project = "${projectKey}" AND statusCategory = Done AND updated >= -30d`;
                const historyRes = await issueSearchService.search(historyJql, fields, true);
                if (historyRes.ok) historicalIssues = historyRes.issues;
            }
        }

        if (apiIssues.length > 0) return { ...boardCtx, issues: apiIssues, historicalIssues };

        const filterIssues = await this.fetchAllBoardIssues(boardId);
        if (filterIssues.length > 0) return { ...boardCtx, issues: filterIssues, historicalIssues };

        return { ...boardCtx, issues: [], historicalIssues: [] };
    }

    private async fetchAllBoardIssues(boardId: number, projectKey?: string, sprintId?: number): Promise<JiraIssue[]> {
        const cfg = await dataService.getBoardConfiguration(boardId);
        const filterId = cfg?.filter?.id;

        if (filterId) {
            let jql = `filter = ${filterId}`;
            if (sprintId) jql += ` AND sprint = ${sprintId}`;
            const res = await issueSearchService.search(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels', 'resolutiondate']);
            if (res.ok) return res.issues;
        }

        if (projectKey) {
            const jql = `project = "${projectKey}" ORDER BY updated DESC`;
            const res = await dataService.searchJqlUserOnly(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels', 'resolutiondate'], 100);
            if (res.ok) return res.issues;
        }

        return [];
    }
}
