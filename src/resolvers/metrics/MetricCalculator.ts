import type { BoardData, TelemetryConfig, TelemetryData } from '../../types/telemetry';
import type { JiraIssue } from '../../types/jira';
import { IssueCategorizer } from '../issue/IssueCategorizer';
import { fieldDiscoveryService } from '../data/FieldDiscoveryService';

export class MetricCalculator {
    constructor(private categorizer: IssueCategorizer, private config: TelemetryConfig) {}

    async calculate(boardData: BoardData): Promise<TelemetryData> {
        const issues = boardData.issues;
        const customFields = await fieldDiscoveryService.discoverCustomFields();

        const todoIssues = issues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.todo);
        const inProgressIssues = issues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.inProgress);
        const doneIssues = issues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);

        const wipCurrent = inProgressIssues.length;
        const wipLimit = this.config.wipLimit;
        const wipLoad = wipLimit > 0 ? Math.round((wipCurrent / wipLimit) * 100) : 0;

        const assigneeLoad = this.calculateAssigneeLoad(inProgressIssues);
        const teamBurnout = this.calculateTeamBurnout(assigneeLoad);

        const storyPointsField = customFields.storyPoints;
        const getPoints = (issue: JiraIssue) => { if (!storyPointsField) return 1; return (issue.fields as any)[storyPointsField] || 0 };
        const totalStoryPoints = issues.reduce((sum, i) => sum + getPoints(i), 0);
        const doneStoryPoints = doneIssues.reduce((sum, i) => sum + getPoints(i), 0);
        const completion = totalStoryPoints > 0 ? Math.round((doneStoryPoints / totalStoryPoints) * 100) : 0;

        const velocityDelta = this.calculateVelocityDelta(boardData, completion);
        const healthStatus = this.determineHealthStatus(boardData.boardType, velocityDelta, wipLoad);

        return {
            boardType: boardData.boardType,
            healthStatus,
            sprintStatus: healthStatus,
            velocityDelta,
            wipLoad,
            wipLimit,
            wipCurrent,
            teamBurnout,
            completion,
            issuesByStatus: { todo: todoIssues.length, inProgress: inProgressIssues.length, done: doneIssues.length }
        };
    }

    private calculateAssigneeLoad(issues: JiraIssue[]): Record<string, number> {
        const load: Record<string, number> = {};
        issues.forEach(issue => {
            const assignee = issue.fields.assignee?.displayName || 'Unassigned';
            load[assignee] = (load[assignee] || 0) + 1;
        });
        return load;
    }

    private calculateTeamBurnout(assigneeLoad: Record<string, number>): Record<string, number> {
        const burnout: Record<string, number> = {};
        Object.entries(assigneeLoad).forEach(([name, count]) => {
            const firstName = name.toLowerCase().split(' ')[0];
            burnout[firstName] = Math.round((count / this.config.assigneeCapacity) * 100);
        });
        return burnout;
    }

    private calculateVelocityDelta(boardData: BoardData, completion: number): number {
        if (boardData.boardType === 'scrum' && boardData.sprint?.startDate && boardData.sprint?.endDate) {
            const now = new Date();
            const start = new Date(boardData.sprint.startDate);
            const end = new Date(boardData.sprint.endDate);
            const totalDuration = end.getTime() - start.getTime();
            const elapsed = now.getTime() - start.getTime();
            const expectedProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
            return completion - expectedProgress;
        }
        return 0;
    }

    private determineHealthStatus(boardType: string, velocityDelta: number, wipLoad: number): 'OPTIMAL' | 'WARNING' | 'CRITICAL' {
        if (boardType === 'scrum') {
            if (velocityDelta < -20 || wipLoad > 100) return 'CRITICAL';
            else if (velocityDelta < -10 || wipLoad > 80) return 'WARNING';
        } else {
            if (wipLoad > 100) return 'CRITICAL';
            else if (wipLoad > 90) return 'WARNING';
        }
        return 'OPTIMAL';
    }
}
