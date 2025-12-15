import api, { route } from '@forge/api'
import type { TrendData } from '../types/telemetry'

const STATUS_CATEGORIES = { TODO: 'new', IN_PROGRESS: 'indeterminate', DONE: 'done' }

export async function calculateWipTrend(projectKey: string): Promise<TrendData> {
  const issues = await getRecentIssuesWithChangelog(projectKey)
  const now = new Date()
  const points: { dayLabel: string; date?: string; value: number }[] = []
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const at = new Date(now)
    at.setDate(at.getDate() - daysAgo)
    at.setHours(23, 59, 59, 999)
    const count = countInProgressAtTime(issues, at)
    points.push({ date: at.toISOString().split('T')[0], dayLabel: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yest' : `D-${daysAgo}`, value: count })
  }
  const firstHalf = points.slice(0, 3).reduce((sum, d) => sum + d.value, 0) / 3
  const secondHalf = points.slice(4).reduce((sum, d) => sum + d.value, 0) / 3
  return { data: points, direction: secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'stable', change: Math.round(((secondHalf - firstHalf) / (firstHalf || 1)) * 100) }
}

async function getRecentIssuesWithChangelog(projectKey: string) {
  const jql = `project = "${projectKey}" AND updated >= -30d`
  const url = route`/rest/api/3/search/jql`
  const body = { jql, maxResults: 500, fields: ['status','created','updated','resolutiondate'], expand: ['changelog'] }
  const resp = await api.asApp().requestJira(url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!resp.ok) return []
  const data = await resp.json()
  return data.issues || []
}

function countInProgressAtTime(issues: any[], at: Date): number {
  let count = 0
  const cutoff = at.getTime()
  for (const issue of issues) {
    const created = new Date(issue.fields.created).getTime()
    if (created > cutoff) continue
    const histories = issue.changelog?.histories || []
    let lastCat: 'new'|'indeterminate'|'done' = 'new'
    // initial from current status at creation
    histories.sort((a: any,b: any)=> new Date(a.created).getTime() - new Date(b.created).getTime())
    for (const h of histories) {
      const t = new Date(h.created).getTime()
      if (t > cutoff) break
      const statusChange = (h.items||[]).find((it: any)=> it.field === 'status')
      if (statusChange) {
        const name = (statusChange.toString||'').toLowerCase()
        if (name.includes('done') || name.includes('closed') || name.includes('resolved')) lastCat = 'done'
        else if (name.includes('to do') || name.includes('todo') || name.includes('open') || name.includes('backlog') || name.includes('new')) lastCat = 'new'
        else lastCat = 'indeterminate'
      }
    }
    if (lastCat === 'indeterminate') count++
  }
  return count
}

export async function calculateVelocityTrend(projectKey: string): Promise<TrendData> {
  const now = new Date(); const trend: any[] = []
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) { const date = new Date(now); date.setDate(date.getDate() - daysAgo); const count = await getCompletedOnDate(projectKey, date); trend.push({ date: date.toISOString().split('T')[0], dayLabel: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yest' : `D-${daysAgo}`, value: count }) }
  const avgVelocity = trend.reduce((sum, d) => sum + d.value, 0) / trend.length
  return { data: trend, averagePerDay: Math.round(avgVelocity * 10) / 10, total: trend.reduce((sum, d) => sum + d.value, 0), direction: 'stable' }
}

async function getCompletedOnDate(projectKey: string, date: Date) {
  try {
    const dateStr = date.toISOString().split('T')[0]
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const nextStr = nextDate.toISOString().split('T')[0]
    const jql = `project = "${projectKey}" AND resolutiondate >= "${dateStr}" AND resolutiondate < "${nextStr}"`
    const response = await api.asApp().requestJira(route`/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=0`, { headers: { Accept: 'application/json' } })
    const result = await response.json()
    return result.total || 0
  } catch (error) { return 0 }
}

export { STATUS_CATEGORIES }
