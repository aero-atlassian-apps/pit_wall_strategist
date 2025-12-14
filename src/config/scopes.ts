export const REQUESTED_SCOPES = [
  'read:jira-work',
  'write:jira-work',
  'read:jira-user',
  'manage:jira-project',
  'read:project:jira',
  'read:board-scope:jira-software',
  'read:sprint:jira-software',
  'read:board-scope.admin:jira-software',
  'read:issue:jira',
  'read:issue:jira-software',
  'read:filter:jira',
  'storage:app'
]

export function getScopes(): string[] { return REQUESTED_SCOPES.slice() }

export function validateScopes(scopes: string[] = REQUESTED_SCOPES) {
  const essential = ['read:jira-work','read:issue:jira','read:issue:jira-software']
  const missingEssentials = essential.filter(s => !scopes.includes(s))
  const duplicates = scopes.filter((s, i) => scopes.indexOf(s) !== i)
  return { ok: missingEssentials.length === 0, missingEssentials, duplicates }
}

