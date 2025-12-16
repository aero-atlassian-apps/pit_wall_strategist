import api, { route } from '@forge/api';

/**
 * Security Status Interface
 * Represents the "Truth" of what the app can do in the current context.
 */
export interface SecurityStatus {
  canReadProject: boolean;
  canReadIssues: boolean;
  canReadSprints: boolean;
  permissions: {
    userBrowse: boolean;
    appBrowse: boolean;
  };
  messages: string[];
}

/**
 * Security Guard
 * Enforces the "Diagnostics Drives Execution" rule.
 * Request-scoped instance to prevent data leakage.
 */
export class SecurityGuard {
  private cache: Record<string, SecurityStatus> = {};

  /**
   * Validates the current execution context against required permissions and scopes.
   * This is the GATEKEEPER.
   */
  async validateContext(projectKey: string): Promise<SecurityStatus> {
    if (this.cache[projectKey]) {
      return this.cache[projectKey];
    }

    const messages: string[] = [];

    // 1. Check App Permissions (App Browse Scope)
    // Checks if the App User has BROWSE_PROJECTS permission AND 'read:issue:jira' scope.
    let appBrowse = false;
    try {
      const resp = await api.asApp().requestJira(
        route`/rest/api/3/search?jql=${encodeURIComponent(`project = "${projectKey}"`)}&maxResults=0`,
        { headers: { Accept: 'application/json' } }
      );
      appBrowse = resp.ok;
      if (!resp.ok) {
         messages.push(`[Security] App Browse Denied: ${resp.status}`);
      }
    } catch (e: any) {
      messages.push(`[Security] App Browse Check Failed: ${e.message}`);
    }

    // 2. Check User Permissions (User Browse Scope)
    // Checks if the Current User has BROWSE_PROJECTS permission.
    let userBrowse = false;
    try {
       const resp = await api.asUser().requestJira(
         route`/rest/api/3/mypermissions?projectKey=${projectKey}&permissions=BROWSE_PROJECTS`,
         { headers: { Accept: 'application/json' } }
       );
       if (resp.ok) {
         const data = await resp.json();
         userBrowse = data.permissions?.BROWSE_PROJECTS?.havePermission === true;
       }
       if (!userBrowse) messages.push('[Security] User Browse Denied');
    } catch (e: any) {
       messages.push(`[Security] User Browse Check Failed: ${e.message}`);
    }

    // 3. Construct Truth

    const status: SecurityStatus = {
      canReadProject: userBrowse || appBrowse, // Capability (Physical)
      canReadIssues: userBrowse && appBrowse, // Ideal
      canReadSprints: userBrowse, // Agile operations depend on user context
      permissions: {
        userBrowse,
        appBrowse
      },
      messages
    };

    this.cache[projectKey] = status;
    return status;
  }
}
