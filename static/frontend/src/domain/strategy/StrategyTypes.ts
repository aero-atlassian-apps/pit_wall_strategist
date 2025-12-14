export interface IssueContext {
    key: string;
    summary: string;
    status: string;
    statusCategory: 'new' | 'indeterminate' | 'done';
    issueType: string;
    isStalled: boolean;
    isBlocked: boolean;
    hasSubtasks: boolean;
    storyPoints?: number;
    assignee?: string;
    priority: string;
    daysInStatus: number;
    linkedIssues?: number;
}

export interface BoardContext {
    boardType: 'scrum' | 'kanban' | 'unknown';
    sprintActive: boolean;
    sprintDaysRemaining?: number;
    wipLimit?: number;
    wipCurrent?: number;
    columns?: string[];
}

export interface ActionRecommendation {
    id: string;
    name: string;
    description: string;
    icon: string;
    action: string;
    relevance: 'critical' | 'recommended' | 'available' | 'hidden';
    reason?: string;
}

export type ActionCategory =
    | 'decomposition'
    | 'assignment'
    | 'triage'
    | 'priority'
    | 'workflow'
    | 'blocker'
    | 'coordination'
    | 'estimation'
    | 'communication';

export interface ActionDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    action: string;
    category: ActionCategory;
}
