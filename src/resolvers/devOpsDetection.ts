import api, { route } from '@forge/api'
import type { JiraIssue } from '../types/jira'

export async function checkDevOpsEnabled(issueKey: string) {
  try {
    const issueRes = await safeRequestJira(() => api.asUser(), route`/rest/api/3/issue/${issueKey}?fields=id`)
    const issue = await issueRes.json()
    const issueId = issue.id
    const response = await api.asApp().requestJira(route`/rest/dev-status/latest/issue/detail?issueId=${issueId}&applicationType=stash&dataType=repository`, { headers: { Accept: 'application/json' } })
    if (response.ok) return { enabled: true, source: 'bitbucket' }
    const githubResponse = await api.asApp().requestJira(route`/rest/dev-status/latest/issue/detail?issueId=${issueId}&applicationType=github&dataType=repository`, { headers: { Accept: 'application/json' } })
    if (githubResponse.ok) return { enabled: true, source: 'github' }
    return { enabled: false, source: null }
  } catch (error: any) { return { enabled: false, source: null, error: error.message } }
}

export async function getDevActivity(issueKey: string) {
  try { const issueRes = await safeRequestJira(() => api.asUser(), route`/rest/api/3/issue/${issueKey}?fields=id`); const issue = await issueRes.json(); const issueId = issue.id; const summaryResponse = await api.asApp().requestJira(route`/rest/dev-status/latest/issue/summary?issueId=${issueId}`, { headers: { Accept: 'application/json' } }); if (!summaryResponse.ok) return { available: false, reason: 'DevOps not connected' }; const summary = await summaryResponse.json(); return { available: true, commits: summary.summary?.commit?.count || 0, pullRequests: summary.summary?.pullRequest?.count || 0, branches: summary.summary?.branch?.count || 0, lastActivity: summary.summary?.lastUpdated || null } } catch (error: any) { return { available: false, reason: error.message } }
}

export async function detectNoCommitIssues(issues: JiraIssue[], config: any = {}) {
  const { thresholdHours = 48 } = config
  const noCommitIssues: any[] = []
  const inProgressIssues = issues.filter(issue => issue.fields?.status?.statusCategory?.key === 'indeterminate')
  for (const issue of inProgressIssues.slice(0, 10)) {
    try {
      const devActivity = await getDevActivity(issue.key)
      if (!devActivity.available) continue
      const lastActivity = devActivity.lastActivity ? new Date(devActivity.lastActivity) : null
      const hoursSinceActivity = lastActivity ? (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60) : Infinity
      const hasNoRecentCommits = (devActivity.commits || 0) === 0 || hoursSinceActivity > thresholdHours
      const hasNoPRs = (devActivity.pullRequests || 0) === 0
      if (hasNoRecentCommits && hasNoPRs) { noCommitIssues.push({ key: issue.key, summary: issue.fields.summary, assignee: issue.fields.assignee?.displayName || 'Unassigned', status: issue.fields.status?.name, devActivity, hoursSinceActivity: Math.round(hoursSinceActivity), reason: (devActivity.commits || 0) === 0 ? 'No commits linked to ticket' : `No activity for ${Math.round(hoursSinceActivity)}h` }) }
    } catch (error: any) { }
  }
  return noCommitIssues
}

export async function checkProjectDevOpsStatus(projectKey: string, context?: any) {
  console.log(`[Telemetry] Checking DevOps Status for Project: ${projectKey}`)
  try {
    const requester = () => (context?.accountId ? api.asUser() : api.asApp())
    const response = await safeRequestJira(requester, route`/rest/api/3/search?jql=${encodeURIComponent(`project = "${projectKey}"`)}&maxResults=1`)
    const result = await response.json();
    if (!result.issues || result.issues.length === 0) {
      console.log('[Telemetry] DevOps check: No issues found to test against.')
      return { enabled: false, reason: 'No issues in project' };
    }
    const sampleIssue = result.issues[0];
    console.log(`[Telemetry] DevOps check using sample issue: ${sampleIssue.key}`)
    const devStatus = await checkDevOpsEnabled(sampleIssue.key);
    console.log(`[Telemetry] DevOps Status: ${devStatus.enabled ? 'Enabled (' + devStatus.source + ')' : 'Disabled'}`)
    return { enabled: devStatus.enabled, source: devStatus.source, sampleIssue: sampleIssue.key }
  } catch (error: any) {
    console.error('[Telemetry] checkProjectDevOpsStatus failed:', error)
    return { enabled: false, reason: error.message }
  }
}

export function getMockDevOpsData() { return { devOpsEnabled: true, source: 'github', noCommitIssues: [{ key: 'TICKET-422', summary: 'Implement OAuth2 Backend', assignee: 'Sarah', hoursSinceActivity: 52, reason: 'No commits for 52h' }], stats: { totalCommits: 47, totalPRs: 12, openPRs: 2, activeBranches: 5 } } }
async function safeRequestJira(getRequester: () => any, path: any) { try { return await getRequester().requestJira(path, { headers: { Accept: 'application/json' } }) } catch (err: any) { try { const isAuthErr = (err?.status === 401 && err?.serviceKey === 'atlassian-token-service-key') || (typeof err?.message === 'string' && err.message.includes('NEEDS_AUTHENTICATION_ERR')); if (isAuthErr) { console.warn('[DevOps] asUser failed - falling back to asApp()'); return await api.asApp().requestJira(path, { headers: { Accept: 'application/json' } }) } } catch {} throw err } }
