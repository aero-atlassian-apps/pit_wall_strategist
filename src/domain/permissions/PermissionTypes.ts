
export type PermissionStatus = 'GRANTED' | 'DENIED';

export interface PermissionEvaluationResult {
  status: PermissionStatus;
  userCanWrite: boolean;  // Can user perform write operations (create, update, transition)?
  reasons: string[];
}

export interface PermissionScanner {
  evaluateProjectAccess(projectKey: string): Promise<PermissionEvaluationResult>;
}

/**
 * Structured error for permission failures.
 * Thrown when a user attempts an operation they don't have permission for.
 */
export class PermissionDeniedError extends Error {
  constructor(
    public readonly context: 'asApp' | 'asUser',
    public readonly reason: string,
    public readonly operation: string
  ) {
    super(`PermissionDenied [${context}] for ${operation}: ${reason}`);
    this.name = 'PermissionDeniedError';
  }
}
