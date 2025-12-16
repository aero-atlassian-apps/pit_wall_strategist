import api, { route } from '@forge/api';
import { JiraIssue, JiraSearchResult } from '../../types/jira';
import { recordFetchStatus } from '../fetchStatus';
import { Sprint } from '../../types/telemetry';

/**
 * Jira Data Service
 * Handles data fetching from Jira REST APIs.
 *
 * AUTHENTICATION POLICY:
 * - Most read operations use `asUser()` to respect the current user's permissions.
 * - `asApp()` is used only when system-level access is required and user context is insufficient (rare in this app).
 * - All API calls must link to their official REST v3 documentation.
 */
export class JiraDataService {

  /**
   * Search issues using JQL (asUser)
   * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post
   * Scope: read:issue:jira
   */
  async searchJqlUserOnly(jql: string, fields: string[], limit = 100, expand?: string | string[]): Promise<{ ok: boolean, issues: JiraIssue[], status?: number }> {
    const body: any = { jql, maxResults: limit, fields };
    if (expand) {
        body.expand = Array.isArray(expand) ? expand.join(',') : expand;
    }
    const resp = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!resp.ok) {
        const text = await resp.text();
        console.log(`[Telemetry] JQL POST Error: ${resp.status} ${text}`);
        recordFetchStatus({ endpoint: '/rest/api/3/search/jql (POST asUser)', ok: false, status: resp.status });
        return { ok: false, issues: [], status: resp.status };
    }

    const data = await resp.json() as JiraSearchResult;
    recordFetchStatus({ endpoint: '/rest/api/3/search/jql (POST asUser)', ok: true, status: 200 });
    return { ok: true, issues: data?.issues || [] };
  }

  /**
   * Search issues using JQL (asApp)
   * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post
   * Scope: read:issue:jira
   *
   * @deprecated Prefer searchJqlUserOnly unless system context is explicitly required.
   */
  async searchJqlAsApp(jql: string, fields: string[], limit = 100, expand?: string | string[]): Promise<{ ok: boolean, issues: JiraIssue[], status?: number }> {
    const body: any = { jql, maxResults: limit, fields };
    if (expand) {
        body.expand = Array.isArray(expand) ? expand.join(',') : expand;
    }
    const resp = await api.asApp().requestJira(route`/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!resp.ok) {
        const text = await resp.text();
        console.log(`[Telemetry] JQL POST (asApp) Error: ${resp.status} ${text}`);
        recordFetchStatus({ endpoint: '/rest/api/3/search/jql (POST asApp)', ok: false, status: resp.status });
        return { ok: false, issues: [], status: resp.status };
    }

    const data = await resp.json() as JiraSearchResult;
    recordFetchStatus({ endpoint: '/rest/api/3/search/jql (POST asApp)', ok: true, status: 200 });
    return { ok: true, issues: data?.issues || [] };
  }

  /**
   * Get Active Sprint for Board
   * Docs: https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-agile-1-0-board-boardid-sprint-get
   * Scope: read:sprint:jira-software
   */
  async getBoardActiveSprint(boardId: number): Promise<Sprint | null> {
      // Changed to asUser() to respect user permissions
      const response = await api.asUser().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=active`, { headers: { Accept: 'application/json' } });
      if (response.ok) {
          const data = await response.json();
          if (data.values?.length) return data.values[0];
      }
      if (!response.ok) {
          try { const txt = await response.text(); console.log(`[Telemetry] getBoardActiveSprint Error: ${response.status} ${txt}`) } catch {}
          recordFetchStatus({ endpoint: `/rest/agile/1.0/board/${boardId}/sprint?state=active`, ok: false, status: response.status });
      }
      else { recordFetchStatus({ endpoint: `/rest/agile/1.0/board/${boardId}/sprint?state=active`, ok: true, status: 200 }); }
      return null;
  }

  /**
   * Get Future Sprints for Board
   * Docs: https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-agile-1-0-board-boardid-sprint-get
   * Scope: read:sprint:jira-software
   */
  async getBoardFutureSprints(boardId: number): Promise<Sprint | null> {
      // Changed to asUser() to respect user permissions
      const response = await api.asUser().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=future`, { headers: { Accept: 'application/json' } });
      if (response.ok) {
          const data = await response.json();
          if (data.values?.length) return data.values[0];
      }
      if (!response.ok) {
          try { const txt = await response.text(); console.log(`[Telemetry] getBoardFutureSprints Error: ${response.status} ${txt}`) } catch {}
          recordFetchStatus({ endpoint: `/rest/agile/1.0/board/${boardId}/sprint?state=future`, ok: false, status: response.status });
      }
      else { recordFetchStatus({ endpoint: `/rest/agile/1.0/board/${boardId}/sprint?state=future`, ok: true, status: 200 }); }
      return null;
  }

  /**
   * Get Closed Sprints for Board
   * Docs: https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-agile-1-0-board-boardid-sprint-get
   * Scope: read:sprint:jira-software
   */
  async getClosedSprints(boardId: number, limit: number = 5): Promise<Sprint[]> {
      // Get last N closed sprints
      // Note: orderBy is not supported on this endpoint, results are usually ID sorted (chronological).
      // Changed to asUser()
      const response = await api.asUser().requestJira(
          route`/rest/agile/1.0/board/${boardId}/sprint?state=closed&maxResults=${limit}`,
           { headers: { Accept: 'application/json' } }
      );

      if (response.ok) {
          const data = await response.json();
          // The API returns sprints in order. We want the most recent ones.
          const sprints = data.values || [];
          // If we have more than limit, take the last 'limit' ones (most recent)
          recordFetchStatus({ endpoint: `/rest/agile/1.0/board/${boardId}/sprint?state=closed`, ok: true, status: 200 });
          return sprints.slice(-limit);
      }
      try { const txt = await response.text(); console.log(`[Telemetry] getClosedSprints Error: ${response.status} ${txt}`) } catch {}
      recordFetchStatus({ endpoint: `/rest/agile/1.0/board/${boardId}/sprint?state=closed`, ok: false, status: response.status });
      return [];
  }

  /**
   * Get Issues for Sprint
   * Docs: https://developer.atlassian.com/cloud/jira/software/rest/api-group-sprint/#api-agile-1-0-sprint-sprintid-issue-get
   * Scope: read:issue:jira, read:sprint:jira-software
   */
  async getSprintIssues(sprintId: number, fields: string[] = ['summary','status','assignee','issuetype','updated','created','resolutiondate'], expand?: string[], limit: number = 500): Promise<JiraIssue[]> {
      const params: string[] = [`maxResults=${limit}`]
      if (fields && fields.length) params.push(`fields=${encodeURIComponent(fields.join(','))}`)
      if (expand && expand.length) params.push(`expand=${encodeURIComponent(expand.join(','))}`)
      const url = route`/rest/agile/1.0/sprint/${sprintId}/issue?${params.join('&')}`

      // Changed to asUser()
      const response = await api.asUser().requestJira(url, { headers: { Accept: 'application/json' } })
      if (response.ok) {
          const data = await response.json()
          recordFetchStatus({ endpoint: `/rest/agile/1.0/sprint/${sprintId}/issue`, ok: true, status: 200 });
          return data.issues || []
      }
      try { const txt = await response.text(); console.log(`[Telemetry] getSprintIssues Error: ${response.status} ${txt}`) } catch {}
      recordFetchStatus({ endpoint: `/rest/agile/1.0/sprint/${sprintId}/issue`, ok: false, status: response.status });
      return []
  }

  /**
   * Get Board Configuration
   * Docs: https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-agile-1-0-board-boardid-configuration-get
   * Scope: read:board-scope.admin:jira-software
   */
  async getBoardConfiguration(boardId: number) {
       // Changed to asUser()
       const response = await api.asUser().requestJira(route`/rest/agile/1.0/board/${boardId}/configuration`, { headers: { Accept: 'application/json' } });
       if (response.ok) return await response.json();
       return null;
  }

  /**
   * Get Kanban Board Issues
   * Docs: https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-agile-1-0-board-boardid-issue-get
   * Scope: read:board-scope:jira-software
   */
  async getKanbanBoardIssues(boardId: number): Promise<JiraIssue[]> {
      // Changed to asUser()
      const response = await api.asUser().requestJira(
        route`/rest/agile/1.0/board/${boardId}/issue?maxResults=100`,
       { headers: { Accept: 'application/json' } }
      );
      if (response.ok) {
          const data = await response.json();
          recordFetchStatus({ endpoint: `/rest/agile/1.0/board/${boardId}/issue`, ok: true, status: 200 });
          return data.issues || [];
      }
      recordFetchStatus({ endpoint: `/rest/agile/1.0/board/${boardId}/issue`, ok: false, status: response.status });
      return [];
  }
}
