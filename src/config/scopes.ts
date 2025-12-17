export const REQUESTED_SCOPES = [
  'read:project:jira',
  'read:issue:jira',
  'write:issue:jira',
  'write:comment:jira',
  'read:user:jira',
  'read:board-scope:jira-software',
  'read:sprint:jira-software',
  'read:board-scope.admin:jira-software',
  'storage:app'
]

export function getScopes(): string[] { return REQUESTED_SCOPES.slice() }

export function validateScopes(scopes: string[] = REQUESTED_SCOPES) {
  const essential = ['read:issue:jira']
  const missingEssentials = essential.filter(s => !scopes.includes(s))
  const duplicates = scopes.filter((s, i) => scopes.indexOf(s) !== i)
  return { ok: missingEssentials.length === 0, missingEssentials, duplicates }
}

