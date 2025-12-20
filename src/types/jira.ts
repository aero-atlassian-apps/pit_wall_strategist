export interface JiraIssue {
    key: string;
    fields: {
        summary: string;
        status: {
            name: string;
            statusCategory: {
                key: string; // 'new' | 'indeterminate' | 'done'
                name: string;
            };
        };
        assignee?: {
            displayName: string;
            accountId: string;
        };
        priority?: {
            name: string;
        };
        issuetype?: {
            name: string;
        };
        created: string;
        updated?: string;
        resolutiondate?: string;
        project: {
            key: string;
            name: string;
        };
        [key: string]: any;
    };
    changelog?: {
        histories: {
            created: string;
            items: {
                field: string;
                fromString: string;
                toString: string;
            }[];
        }[];
    };
}

export type StatusCategoryKey = 'new' | 'indeterminate' | 'done';

export interface JiraSearchResult {
    expand?: string;
    startAt: number;
    maxResults: number;
    total: number;
    issues: JiraIssue[];
}
