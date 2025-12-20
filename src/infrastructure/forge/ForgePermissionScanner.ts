import api, { route } from '@forge/api';
import { PermissionScanner, PermissionEvaluationResult } from '../../domain/permissions/PermissionTypes';

/**
 * ForgePermissionScanner
 *
 * Infrastructure implementation using hybrid strategy:
 * - Read access: Checked via asApp() (app scopes)
 * - Write access: Checked via asUser() (user permissions)
 */
export class ForgePermissionScanner implements PermissionScanner {

  async evaluateProjectAccess(projectKey: string): Promise<PermissionEvaluationResult> {
    const reasons: string[] = [];

    // 1. Check Read Access via asApp() - uses app scopes from manifest
    // CRITICAL: Use POST /search/jql (the GET /search endpoint is deprecated and causes 401 errors)
    let canRead = false;
    try {
      const resp = await api.asApp().requestJira(
        route`/rest/api/3/search/jql`,
        {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ jql: `project = "${projectKey}"`, maxResults: 1, fields: [] })
        }
      );
      canRead = resp.ok;
      if (!resp.ok) {
        const body = await resp.text();
        console.warn(`[PermissionScanner] asApp() READ blocked. Status: ${resp.status}, Body: ${body}`);
        reasons.push(`[READ] App cannot access project. Status: ${resp.status} Body: ${body}`);
      }
    } catch (e: any) {
      console.warn(`[PermissionScanner] asApp() exception: ${e.message}`);
      reasons.push(`[READ] Access check failed: ${e.message}`);
    }

    // 2. Check Write Access via asUser() - checks user's Jira permissions
    let userCanWrite = false;
    try {
      const resp = await api.asUser().requestJira(
        route`/rest/api/3/mypermissions?projectKey=${projectKey}&permissions=EDIT_ISSUES,CREATE_ISSUES,TRANSITION_ISSUES`,
        { headers: { Accept: 'application/json' } }
      );
      if (resp.ok) {
        const data = await resp.json();
        // User can write if they have at least EDIT_ISSUES permission
        userCanWrite = data.permissions?.EDIT_ISSUES?.havePermission === true;
      }
      if (!userCanWrite) {
        reasons.push('[WRITE] User lacks EDIT_ISSUES permission - actions will be disabled');
      }
    } catch (e: any) {
      // User consent not granted or other error - actions disabled
      reasons.push(`[WRITE] Permission check failed: ${e.message}`);
    }

    const status = canRead ? 'GRANTED' : 'DENIED';

    return {
      status,
      userCanWrite,
      reasons
    };
  }
}
