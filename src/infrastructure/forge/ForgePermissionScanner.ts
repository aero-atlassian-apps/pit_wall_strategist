import api, { route } from '@forge/api';
import { PermissionScanner, PermissionEvaluationResult } from '../../domain/permissions/PermissionTypes';

/**
 * ForgePermissionScanner
 *
 * Infrastructure implementation of PermissionScanner using Forge API.
 * Replaces the old SecurityGuard with a cleaner, stateless implementation.
 */
export class ForgePermissionScanner implements PermissionScanner {

  async evaluateProjectAccess(projectKey: string): Promise<PermissionEvaluationResult> {
    const reasons: string[] = [];

    // 1. Check App Permissions (App Browse Scope)
    let appCanBrowse = false;
    try {
      const resp = await api.asApp().requestJira(
        route`/rest/api/3/search?jql=${encodeURIComponent(`project = "${projectKey}"`)}&maxResults=0`,
        { headers: { Accept: 'application/json' } }
      );
      appCanBrowse = resp.ok;
      if (!resp.ok) {
         reasons.push(`[App] Access denied. Status: ${resp.status}`);
      }
    } catch (e: any) {
      reasons.push(`[App] Access check failed: ${e.message}`);
    }

    // 2. Check User Permissions (User Browse Scope)
    let userCanBrowse = false;
    try {
       const resp = await api.asUser().requestJira(
         route`/rest/api/3/mypermissions?projectKey=${projectKey}&permissions=BROWSE_PROJECTS`,
         { headers: { Accept: 'application/json' } }
       );
       if (resp.ok) {
         const data = await resp.json();
         userCanBrowse = data.permissions?.BROWSE_PROJECTS?.havePermission === true;
       }
       if (!userCanBrowse) reasons.push('[User] BROWSE_PROJECTS permission missing');
    } catch (e: any) {
       reasons.push(`[User] Permission check failed: ${e.message}`);
    }

    let status: 'GRANTED' | 'DENIED' | 'RESTRICTED' = 'DENIED';

    if (userCanBrowse && appCanBrowse) {
      status = 'GRANTED';
    } else if (!userCanBrowse && appCanBrowse) {
      status = 'RESTRICTED'; // App can read, but User cannot -> Limit data
    } else {
      status = 'DENIED';
    }

    return {
      status,
      userCanBrowse,
      appCanBrowse,
      reasons
    };
  }
}
