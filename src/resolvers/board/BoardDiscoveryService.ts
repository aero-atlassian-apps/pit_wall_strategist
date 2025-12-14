import api, { route } from '@forge/api';
import { BoardContext } from '../../types/telemetry';

export class BoardDiscoveryService {
  async detectBoardType(projectKey: string): Promise<BoardContext> {
    // First check if it's a business project (no agile boards)
    const projectType = await this.detectProjectType(projectKey);
    if (projectType === 'business') {
      return { boardType: 'business', boardId: null, boardName: 'Work Items' };
    }

    // Try to get agile boards
    const response = await api.asApp().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      console.log(`[Telemetry] Agile API failed for ${projectKey}, falling back to business mode`);
      return { boardType: 'business', boardId: null, boardName: 'Work Items' };
    }

    const boards = await response.json();
    if (!boards.values?.length) {
      console.log(`[Telemetry] No agile boards for ${projectKey}, using JQL mode`);
      return { boardType: 'business', boardId: null, boardName: 'Work Items' };
    }

    // TODO: Logic to select the "current" board if multiple exist. Currently defaults to the first one.
    const board = boards.values[0];
    console.log(`Detected board: ${board.name} (${board.id}) for project ${projectKey}`);
    return { boardType: (board.type || 'scrum') as 'scrum' | 'kanban', boardId: board.id as number, boardName: board.name as string };
  }

  private async detectProjectType(projectKey: string): Promise<'software' | 'business'> {
    try {
      const resp = await api.asApp().requestJira(route`/rest/api/3/project/${projectKey}`, { headers: { Accept: 'application/json' } });
      if (!resp.ok) return 'software'; // Default to software if can't detect
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
