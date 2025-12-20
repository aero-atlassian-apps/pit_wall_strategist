import type { JiraIssue, StatusCategoryKey } from '../../types/jira';
import { resolveCategoryForIssue } from '../statusMap';

export class IssueCategorizer {
    constructor(private statusMap?: any) { }

    getStatusCategory(issue: JiraIssue): StatusCategoryKey {
        // Priority 1: Use Jira's native status category if available
        const cat = issue.fields.status?.statusCategory?.key as StatusCategoryKey | undefined;
        if (cat) return cat;

        // Priority 2: Try to resolve from project status map
        const name = (issue.fields.status?.name || '').toLowerCase();
        const mapped = resolveCategoryForIssue(this.statusMap || null, name, issue.fields.issuetype?.name);
        if (mapped) return mapped as StatusCategoryKey;

        // Priority 3: Pattern matching
        return this.inferStatusCategory(name);
    }

    private inferStatusCategory(statusName: string): StatusCategoryKey {
        const name = statusName.toLowerCase();

        // IN PROGRESS patterns
        if (
            name.includes('progress') ||
            name.includes('doing') ||
            name.includes('active') ||
            name.includes('implement') ||
            name.includes('review') ||
            name.includes('testing') ||
            name.includes('development') ||
            name.includes('work') ||
            name.includes('building') ||
            name.includes('designing') ||
            name.includes('investigating') ||
            name.includes('responding') ||
            name.includes('escalated') ||
            name.includes('pending') ||
            name.includes('waiting') ||
            name.includes('blocked')
        ) return 'indeterminate';

        // DONE patterns
        if (
            name.includes('done') ||
            name.includes('complete') ||
            name.includes('resolved') ||
            name.includes('closed') ||
            name.includes('released') ||
            name.includes('deployed') ||
            name.includes('finished') ||
            name.includes('delivered') ||
            name.includes('published') ||
            name.includes('approved') ||
            name.includes('cancelled') ||
            name.includes('declined') ||
            name.includes('rejected') ||
            name.includes('won\'t') ||
            name.includes('duplicate') ||
            name.includes('archived')
        ) return 'done';

        // Default to NEW
        return 'new';
    }

    inferBlockingReason(issue: JiraIssue): string {
        const labels = issue.fields.labels || [];
        const summary = (issue.fields.summary || '').toLowerCase();
        // const description = ''; // Description not always available in summary fetch

        if (labels.some((l: string) => l.toLowerCase().includes('block'))) return 'Explicitly marked as blocked';
        if (summary.includes('api')) return 'Waiting on API specification';
        if (summary.includes('design')) return 'Awaiting design approval';
        if (summary.includes('depend')) return 'External dependency';
        if (labels.some((l: string) => l.toLowerCase().includes('review'))) return 'Stuck in code review';
        if (summary.includes('test')) return 'Waiting on test environment';

        return 'Unknown blocker - needs investigation';
    }
}
