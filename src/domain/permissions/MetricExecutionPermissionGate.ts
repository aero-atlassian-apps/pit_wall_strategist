import { PermissionScanner, PermissionEvaluationResult, PermissionDeniedError } from './PermissionTypes';

/**
 * MetricExecutionPermissionGate
 *
 * Domain service that acts as the primary gatekeeper for all metric operations.
 * It enforces the "Check Before Act" policy.
 */
export class MetricExecutionPermissionGate {
  constructor(private scanner: PermissionScanner) { }

  async evaluate(projectKey: string): Promise<PermissionEvaluationResult> {
    const result = await this.scanner.evaluateProjectAccess(projectKey);

    if (result.status === 'DENIED') {
      console.warn(`[PermissionGate] ERROR: Access Denied for ${projectKey}. Reasons: ${result.reasons.join(' | ')}`);
      if (result.reasons.some(r => r.includes('Status:'))) {
        console.warn(`[PermissionGate] Diagnostic: Check if 'App' user is added to the project people/roles, or if 'browse projects' permission is restricted.`);
      }
    }

    return result;
  }

  /**
   * Fast fail check. Throws if read access is completely denied.
   */
  async ensureAccess(projectKey: string): Promise<void> {
    const result = await this.evaluate(projectKey);
    if (result.status === 'DENIED') {
      throw new PermissionDeniedError('asApp', result.reasons[0] || 'Access Denied', `project:${projectKey}`);
    }
  }

  /**
   * Check if user can perform write operations.
   * Used by UI to enable/disable action buttons.
   */
  async canUserWrite(projectKey: string): Promise<boolean> {
    const result = await this.evaluate(projectKey);
    return result.userCanWrite;
  }
}
