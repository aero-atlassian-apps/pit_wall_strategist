import { JiraIssue } from '../../types/jira';
import { DomainIssue } from '../../domain/issue/DomainIssue';
import { JiraStatusCategory } from '../../domain/issue/JiraStatusCategory';

/**
 * IssueMapper - Maps Jira API responses to domain entities
 * 
 * This is the only place where Jira-specific field shapes are interpreted.
 * Domain code never knows about the raw Jira API structure.
 */
export class IssueMapper {
    /**
     * Transform a Jira API issue into a clean domain issue
     */
    static toDomain(issue: JiraIssue, storyPointsField?: string): DomainIssue {
        const fields = issue.fields;

        // Parse Status Category
        const catKey = fields.status?.statusCategory?.key || 'indeterminate';
        const statusCategory = JiraStatusCategory.fromKey(catKey);
        const statusName = fields.status?.name;

        // Parse Dates
        const created = new Date(fields.created || Date.now());
        const updated = fields.updated ? new Date(fields.updated) : undefined;
        const resolved = fields.resolutiondate ? new Date(fields.resolutiondate) : undefined;

        // Parse Story Points
        let storyPoints: number | undefined;
        if (storyPointsField && fields[storyPointsField]) {
            const val = fields[storyPointsField];
            if (typeof val === 'number') storyPoints = val;
        }

        // Parse Assignee
        const assigneeName = fields.assignee?.displayName || 'Unassigned';
        const assigneeAccountId = fields.assignee?.accountId;

        // Parse Issue Type
        const issueType = fields.issuetype?.name || 'Unknown';

        // Parse Priority
        const priority = fields.priority?.name;

        // Parse Labels
        const labels = Array.isArray(fields.labels) ? fields.labels : undefined;

        // Parse Flagged status
        const isFlagged = Array.isArray(fields.labels) && fields.labels.includes('blocked');

        // Parse Epic Link (various field names)
        const epicKey = fields.epic?.key || fields.parent?.key;

        // Parse Changelog
        const changelog = issue.changelog ? {
            histories: (issue.changelog.histories || []).map(h => ({
                created: h.created,
                items: (h.items || []).map(i => ({
                    field: i.field,
                    fromString: i.fromString || '',
                    toString: i.toString || ''
                }))
            }))
        } : undefined;

        return {
            key: issue.key,
            summary: fields.summary,
            statusCategory,
            statusName,
            created,
            updated,
            resolved,
            storyPoints,
            assigneeName,
            assigneeAccountId,
            issueType,
            priority,
            labels,
            epicKey,
            isFlagged,
            changelog
        };
    }

    /**
     * Map an array of Jira issues to domain issues
     */
    static toDomainList(issues: JiraIssue[], storyPointsField?: string): DomainIssue[] {
        return issues.map(issue => this.toDomain(issue, storyPointsField));
    }
}

