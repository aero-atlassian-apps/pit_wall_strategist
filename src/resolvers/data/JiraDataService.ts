import api, { route } from '@forge/api';
import { JiraIssue } from '../../types/jira';

export class JiraDataService {
  async searchJqlUserOnly(jql: string, fields: string[], limit = 100): Promise<{ ok: boolean, issues: JiraIssue[], status?: number }> {
    const body = JSON.stringify({ jql, maxResults: limit, fields });
    const resp = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body
    });

    if (!resp.ok) {
        const text = await resp.text();
        console.log(`[Telemetry] JQL POST Error: ${resp.status} ${text}`);
        return { ok: false, issues: [], status: resp.status };
    }

    const data = await resp.json();
    return { ok: true, issues: data?.issues || [] };
  }

  async getBoardActiveSprint(boardId: number) {
      const response = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=active`, { headers: { Accept: 'application/json' } });
      if (response.ok) {
          const data = await response.json();
          if (data.values?.length) return data.values[0];
      }
      return null;
  }

  async getBoardFutureSprints(boardId: number) {
      const response = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=future`, { headers: { Accept: 'application/json' } });
      if (response.ok) {
          const data = await response.json();
          if (data.values?.length) return data.values[0];
      }
      return null;
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
