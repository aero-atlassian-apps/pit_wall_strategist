
export type PermissionStatus = 'GRANTED' | 'DENIED' | 'RESTRICTED';

export interface PermissionEvaluationResult {
  status: PermissionStatus;
  userCanBrowse: boolean;
  appCanBrowse: boolean;
  reasons: string[];
}

export interface PermissionScanner {
  evaluateProjectAccess(projectKey: string): Promise<PermissionEvaluationResult>;
}
