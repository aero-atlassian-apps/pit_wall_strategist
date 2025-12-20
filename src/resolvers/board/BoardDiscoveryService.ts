import api, { route } from '@forge/api';
import { BoardContext } from '../../types/telemetry';

/**
 * Board Discovery Service
 * Detects the board type and configuration for a given project.
 *
 * AUTHENTICATION POLICY:
 * - Uses `asUser()` to ensure the user can only see boards they have access to.
 */
export class BoardDiscoveryService {

  /**
   * Detect Board Type
   * Docs: https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-agile-1-0-board-get
   * Scope: read:board-scope:jira-software
   */
  async detectBoardType(projectKey: string): Promise<BoardContext> {
    // First check if it's a business project (no agile boards)
    const projectType = await this.detectProjectType(projectKey);
    if (projectType === 'business') {
      return { boardType: 'business', boardId: null, boardName: 'Work Items' };
    }

    // Try to get agile boards
    // Changed to asUser()
    let response = await api.asUser().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      response = await api.asApp().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) {
        return { boardType: 'business', boardId: null, boardName: 'Work Items' };
      }
    }

    const boards = await response.json();
    if (!boards.values?.length) {
      console.log(`[Telemetry] No agile boards for ${projectKey}, using JQL mode`);
      return { boardType: 'business', boardId: null, boardName: 'Work Items' };
    }

    const list = Array.isArray(boards.values) ? boards.values : [];
    let candidates = list.filter((b: any) => (b?.location?.projectKey || '').toString().toUpperCase() === projectKey.toUpperCase());
    if (!candidates.length) candidates = list;

    let selected = candidates[0];
    try {
      const scrumCandidates = candidates.filter((b: any) => (b?.type || '').toLowerCase() === 'scrum');
      for (const b of scrumCandidates) {
        let sresp = await api.asUser().requestJira(route`/rest/agile/1.0/board/${b.id}/sprint?state=active`, { headers: { Accept: 'application/json' } });
        if (!sresp.ok) {
          sresp = await api.asApp().requestJira(route`/rest/agile/1.0/board/${b.id}/sprint?state=active`, { headers: { Accept: 'application/json' } });
        }
        if (sresp.ok) {
          const sjson = await sresp.json();
          if (sjson?.values?.length) { selected = b; break; }
        }
      }
    } catch {}

    const board = selected;
    console.log(`Detected board: ${board.name} (${board.id}) for project ${projectKey}`);
    return { boardType: (board.type || 'scrum') as 'scrum' | 'kanban', boardId: board.id as number, boardName: board.name as string };
  }

  /**
   * Detect Project Type
   * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-projects/#api-rest-api-3-project-projectkeyorid-get
   * Scope: read:project:jira
   */
  private async detectProjectType(projectKey: string): Promise<'software' | 'business'> {
    try {
      let resp = await api.asUser().requestJira(route`/rest/api/3/project/${projectKey}`, { headers: { Accept: 'application/json' } });
      if (!resp.ok) {
        resp = await api.asApp().requestJira(route`/rest/api/3/project/${projectKey}`, { headers: { Accept: 'application/json' } });
        if (!resp.ok) return 'software';
      }
      const project = await resp.json();
      // Business projects have projectTypeKey = 'business' or style = 'next-gen'/'basic' without boards
      if (project.projectTypeKey === 'business') {
        console.log(`[Telemetry] Detected Business/JWM project: ${projectKey}`);
        return 'business';
      }
      return 'software';
    } catch (e) {
      console.warn('[Telemetry] Project type detection failed, defaulting to software', e);
      return 'software';
    }
  }
}
