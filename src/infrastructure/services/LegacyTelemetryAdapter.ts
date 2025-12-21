import type { BoardData, TelemetryConfig, TelemetryData } from '../../types/telemetry';
import type { JiraIssue } from '../../types/jira';
import { IssueCategorizer } from '../../resolvers/issue/IssueCategorizer';
import { MetricCalculator } from './legacy/MetricCalculator';
import { fieldDiscoveryService } from './FieldDiscoveryService';

export const DEFAULT_CONFIG: TelemetryConfig = {
    wipLimit: 8,
    assigneeCapacity: 3,
    stalledThresholdHours: 24,
    stalledThresholdHoursByType: {},
    storyPointsFieldName: 'Story Points',
    statusCategories: { todo: 'new', inProgress: 'indeterminate', done: 'done' },
    includeBoardIssuesWhenSprintEmpty: true,
    locale: 'en'
};

export class LegacyTelemetryAdapter {
    static async calculateTelemetry(boardData: BoardData, config: TelemetryConfig = DEFAULT_CONFIG, statusMap?: any): Promise<TelemetryData> {
        if (boardData.isRestricted) {
            return {
                status: 'disabled',
                reason: 'USER_AND_APP_BROWSE_DENIED',
                boardType: boardData.boardType
            };
        }
        const categorizer = new IssueCategorizer(statusMap);
        const calculator = new MetricCalculator(categorizer, config);
        return calculator.calculate(boardData);
    }

    static detectStalledTickets(issues: JiraIssue[], config: TelemetryConfig = DEFAULT_CONFIG, statusMap?: any) {
        const categorizer = new IssueCategorizer(statusMap);
        const now = new Date();
        const { stalledThresholdHours, statusCategories, stalledThresholdHoursByType } = config;

        return issues.filter(issue => {
            const statusCategory = categorizer.getStatusCategory(issue);
            const isInProgress = statusCategory === statusCategories.inProgress;
            const updated = new Date(issue.fields.updated || 0);
            const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);

            const typeName = (issue.fields.issuetype?.name || '').toLowerCase();
            const typeThreshold = stalledThresholdHoursByType?.[typeName] ?? stalledThresholdHours;

            return isInProgress && hoursSinceUpdate > typeThreshold;
        }).map(issue => ({
            key: issue.key,
            summary: issue.fields.summary,
            assignee: issue.fields.assignee?.displayName || 'Unassigned',
            status: issue.fields.status?.name,
            statusCategory: categorizer.getStatusCategory(issue),
            hoursSinceUpdate: Math.round((now.getTime() - new Date(issue.fields.updated || 0).getTime()) / (1000 * 60 * 60)),
            priority: issue.fields.priority?.name,
            isHighPriority: ['Highest', 'High', 'Critical', 'Blocker'].includes(issue.fields.priority?.name || 'Medium'),
            reason: categorizer.inferBlockingReason(issue)
        }));
    }

    static categorizeIssues(issues: JiraIssue[], statusMap?: any) {
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

    static async discoverCustomFields() {
        return fieldDiscoveryService.discoverCustomFields();
    }

    static getFieldCacheSnapshot() {
        return fieldDiscoveryService.getCacheSnapshot();
    }
}
