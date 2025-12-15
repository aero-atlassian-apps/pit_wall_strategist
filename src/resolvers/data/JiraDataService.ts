import api, { route } from '@forge/api';
import { JiraIssue, JiraSearchResult } from '../../types/jira';
import { Sprint } from '../../types/telemetry';

export class JiraDataService {
  async searchJqlUserOnly(jql: string, fields: string[], limit = 100, expand?: string[]): Promise<{ ok: boolean, issues: JiraIssue[], status?: number }> {
    const body: any = { jql, maxResults: limit, fields };
    if (expand) {
        body.expand = expand;
    }
    const resp = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!resp.ok) {
        const text = await resp.text();
        console.log(`[Telemetry] JQL POST Error: ${resp.status} ${text}`);
        return { ok: false, issues: [], status: resp.status };
    }

    const data = await resp.json() as JiraSearchResult;
    return { ok: true, issues: data?.issues || [] };
  }

  async getBoardActiveSprint(boardId: number): Promise<Sprint | null> {
      const response = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=active`, { headers: { Accept: 'application/json' } });
      if (response.ok) {
          const data = await response.json();
          if (data.values?.length) return data.values[0];
      }
      return null;
  }

  async getBoardFutureSprints(boardId: number): Promise<Sprint | null> {
      const response = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=future`, { headers: { Accept: 'application/json' } });
      if (response.ok) {
          const data = await response.json();
          if (data.values?.length) return data.values[0];
      }
      return null;
  }

  async getClosedSprints(boardId: number, limit: number = 5): Promise<Sprint[]> {
      // Get last N closed sprints
      // Note: orderBy is not supported on this endpoint, results are usually ID sorted (chronological).
      const response = await api.asApp().requestJira(
          route`/rest/agile/1.0/board/${boardId}/sprint?state=closed&maxResults=${limit}`,
           { headers: { Accept: 'application/json' } }
      );

      if (response.ok) {
          const data = await response.json();
          // The API returns sprints in order. We want the most recent ones.
          const sprints = data.values || [];
          // If we have more than limit, take the last 'limit' ones (most recent)
          return sprints.slice(-limit);
      }
      return [];
  }

  async getSprintIssues(sprintId: number, fields: string[] = ['summary','status','assignee','issuetype','updated','created','resolutiondate'], expand?: string[], limit: number = 500): Promise<JiraIssue[]> {
      const params: string[] = [`maxResults=${limit}`]
      if (fields && fields.length) params.push(`fields=${encodeURIComponent(fields.join(','))}`)
      if (expand && expand.length) params.push(`expand=${encodeURIComponent(expand.join(','))}`)
      const url = route`/rest/agile/1.0/sprint/${sprintId}/issue?${params.join('&')}`
      const response = await api.asApp().requestJira(url, { headers: { Accept: 'application/json' } })
      if (response.ok) {
          const data = await response.json()
          return data.issues || []
      }
      return []
  }

  async getBoardConfiguration(boardId: number) {
       const response = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/configuration`, { headers: { Accept: 'application/json' } });
       if (response.ok) return await response.json();
       return null;
  }

  async getKanbanBoardIssues(boardId: number): Promise<JiraIssue[]> {
      const response = await api.asApp().requestJira(
        route`/rest/agile/1.0/board/${boardId}/issue?maxResults=100`,
        { headers: { Accept: 'application/json' } }
      );
      if (response.ok) {
          const data = await response.json();
          return data.issues || [];
      }
      return [];
  }
}
