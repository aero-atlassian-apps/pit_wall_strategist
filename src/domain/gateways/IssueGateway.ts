import { JiraIssue } from '../../types/jira';

export interface IssueGateway {
    search(jql: string): Promise<JiraIssue[]>;
}
