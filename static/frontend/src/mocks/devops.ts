export function getMockDevOps() {
  return { enabled: true, source: 'github', noCommitIssues: [{ key: 'TICKET-422', reason: 'No commits for 52h' }] }
}
