/**
 * Represents the normalized status standard keys from Jira Cloud API.
 * The API uses 'new' for To Do, 'indeterminate' for In Progress, and 'done' for Done.
 */
export type JiraStatusCategoryKey = 'new' | 'indeterminate' | 'done';

export class JiraStatusCategory {

    private constructor(public readonly key: JiraStatusCategoryKey, public readonly name: string) { }

    static readonly TO_DO = new JiraStatusCategory('new', 'To Do');
    static readonly IN_PROGRESS = new JiraStatusCategory('indeterminate', 'In Progress');
    static readonly DONE = new JiraStatusCategory('done', 'Done');
    static readonly UNKNOWN = new JiraStatusCategory('indeterminate', 'Unknown'); // Fallback safe default

    static fromKey(key: string): JiraStatusCategory {
        switch (key?.toLowerCase()) {
            case 'new': return JiraStatusCategory.TO_DO;
            case 'indeterminate': return JiraStatusCategory.IN_PROGRESS;
            case 'done': return JiraStatusCategory.DONE;
            default: return JiraStatusCategory.UNKNOWN;
        }
    }

    get isToDo(): boolean { return this.key === 'new'; }
    get isInProgress(): boolean { return this.key === 'indeterminate'; }
    get isDone(): boolean { return this.key === 'done'; }
}
