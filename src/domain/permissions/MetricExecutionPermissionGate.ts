import { PermissionScanner, PermissionEvaluationResult } from './PermissionTypes';

/**
 * MetricExecutionPermissionGate
 *
 * Domain service that acts as the primary gatekeeper for all metric operations.
 * It enforces the "Check Before Act" policy.
 */
export class MetricExecutionPermissionGate {
  constructor(private scanner: PermissionScanner) {}

  async evaluate(projectKey: string): Promise<PermissionEvaluationResult> {
    const result = await this.scanner.evaluateProjectAccess(projectKey);

    if (result.status === 'DENIED') {
      console.warn(`[PermissionGate] Access Denied for ${projectKey}: ${result.reasons.join(', ')}`);
    }

    return result;
  }

  /**
   * Fast fail check. Throws if access is completely denied.
   */
  async ensureAccess(projectKey: string): Promise<void> {
    const result = await this.evaluate(projectKey);
    if (result.status === 'DENIED') {
      throw new Error(`Access Denied: ${result.reasons.join(', ')}`);
    }
  }
}
