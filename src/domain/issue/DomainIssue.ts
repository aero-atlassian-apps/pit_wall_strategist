import { JiraStatusCategory } from './JiraStatusCategory';

/**
 * DomainIssue - Pure domain representation of a Jira issue
 * 
 * This is Forge-agnostic and contains only domain-relevant data.
 * Infrastructure mappers are responsible for transforming Jira API
 * responses into this clean domain model.
 */
export interface DomainIssue {
    /** Issue key (e.g., "PROJ-123") */
    key: string;

    /** Summary/title of the issue */
    summary?: string;

    /** Normalized status category (To Do, In Progress, Done) */
    statusCategory: JiraStatusCategory;

    /** Raw status name from Jira (e.g., "Code Review", "Testing") */
    statusName?: string;

    /** Issue creation date */
    created: Date;

    /** Last update date */
    updated?: Date;

    /** Resolution date (when moved to Done) */
    resolved?: Date;

    /** Story points estimation */
    storyPoints?: number;

    /** Display name of assignee */
    assigneeName?: string;

    /** Account ID of assignee (for API operations) */
    assigneeAccountId?: string;

    /** Issue type name (Story, Bug, Task, etc.) */
    issueType?: string;

    /** Priority name (Highest, High, Medium, Low, Lowest) */
    priority?: string;

    /** Labels attached to the issue */
    labels?: string[];

    /** Parent epic key if linked */
    epicKey?: string;

    /** Whether issue is flagged/blocked */
    isFlagged?: boolean;

    /** Changelog for status transition analysis */
    changelog?: DomainChangelog;
}

/**
 * Domain representation of issue changelog
 */
export interface DomainChangelog {
    histories: DomainChangelogHistory[];
}

export interface DomainChangelogHistory {
    created: string;
    items: DomainChangelogItem[];
}

export interface DomainChangelogItem {
    field: string;
    fromString: string;
    toString: string;
}

