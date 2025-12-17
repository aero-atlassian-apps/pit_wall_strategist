import api, { route } from '@forge/api';
import { IssueGateway } from '../../domain/gateways/IssueGateway';
import { JiraIssue } from '../../types/jira';

/**
 * JiraIssueSearchGateway
 *
 * Infrastructure wrapper for searching Jira Issues.
 * Returns raw data or typed domain objects.
 */
export class JiraIssueSearchGateway implements IssueGateway {

    async search(jql: string, fields: string[] = ['summary', 'status', 'created', 'updated', 'resolutiondate']): Promise<JiraIssue[]> {
        const body = {
            jql,
            fields,
            maxResults: 100
        };

        const response = await api.asUser().requestJira(route`/rest/api/3/search`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Jira Search Failed: ${response.status}`);
        }

        const data = await response.json();
        return data.issues || [];
    }
}
