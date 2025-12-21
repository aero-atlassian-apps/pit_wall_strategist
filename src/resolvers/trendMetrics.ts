import api, { route } from '@forge/api'
import type { TrendData } from '../types/telemetry'
import { getProjectStatusMap, resolveCategoryFromId } from './statusMap'

const STATUS_CATEGORIES = { TODO: 'new', IN_PROGRESS: 'indeterminate', DONE: 'done' }

export async function calculateWipTrend(projectKey: string): Promise<TrendData> {
  // Fetch status map for proper category resolution (workflow-agnostic)
  const statusMap = await getProjectStatusMap(projectKey).catch(() => null)

  const issues = await getRecentIssuesWithChangelog(projectKey)
  console.log(`[WIP Trend] Fetched ${issues.length} issues for ${projectKey}`)
  const now = new Date()
  const points: { dayLabel: string; date?: string; value: number }[] = []
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const at = new Date(now)
    at.setDate(at.getDate() - daysAgo)
    at.setHours(23, 59, 59, 999)
    const count = countInProgressAtTime(issues, at, statusMap)
    points.push({ date: at.toISOString().split('T')[0], dayLabel: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yest' : `D-${daysAgo}`, value: count })
  }
  console.log(`[WIP Trend] Points:`, JSON.stringify(points.map(p => p.value)))
  // Compare first 3 days (D-6, D-5, D-4) vs last 3 days (D-2, D-1, Today)
  // Skip middle day (D-3 at index 3) for symmetric comparison
  const firstHalf = points.slice(0, 3).reduce((sum, d) => sum + d.value, 0) / 3
  const secondHalf = points.slice(-3).reduce((sum, d) => sum + d.value, 0) / 3
  return { data: points, direction: secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'stable', change: Math.round(((secondHalf - firstHalf) / (firstHalf || 1)) * 100) }
}

async function getRecentIssuesWithChangelog(projectKey: string) {
  const jql = `project = "${projectKey}" AND updated >= -30d`
  const url = route`/rest/api/3/search/jql`
  // expand must be a comma-separated string, not an array
  const body = { jql, maxResults: 100, fields: ['status', 'created', 'updated', 'resolutiondate'], expand: 'changelog' }
  const resp = await api.asApp().requestJira(url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!resp.ok) {
    const errText = await resp.text().catch(() => 'unknown')
    console.warn(`[WIP Trend] Failed to fetch issues: ${resp.status} - ${errText}`)
    return []
  }
  const data = await resp.json()
  return data.issues || []
}

function countInProgressAtTime(issues: any[], at: Date, statusMap: any): number {
  let count = 0
  const cutoff = at.getTime()
  for (const issue of issues) {
    const created = new Date(issue.fields.created).getTime()
    if (created > cutoff) continue

    const histories = issue.changelog?.histories || []

    // Start with 'new' as default initial category
    let lastCat: 'new' | 'indeterminate' | 'done' = 'new'

    // If issue has no changelog, use current status category from API (most reliable)
    if (histories.length === 0) {
      const currentCat = issue.fields.status?.statusCategory?.key
      if (currentCat === 'done') lastCat = 'done'
      else if (currentCat === 'new') lastCat = 'new'
      else if (currentCat === 'indeterminate') lastCat = 'indeterminate'
    } else {
      // Sort and replay status changes up to cutoff
      histories.sort((a: any, b: any) => new Date(a.created).getTime() - new Date(b.created).getTime())
      for (const h of histories) {
        const t = new Date(h.created).getTime()
        if (t > cutoff) break
        const statusChange = (h.items || []).find((it: any) => it.field === 'status')
        if (statusChange) {
          // Primary: Use statusMap with status ID (most accurate for custom workflows)
          const resolvedCat = resolveCategoryFromId(statusMap, statusChange.to)
          if (resolvedCat) {
            lastCat = resolvedCat
          } else {
            // Fallback: String matching for status name (legacy compatibility)
            const name = (statusChange.toString || '').toLowerCase()
            if (name.includes('done') || name.includes('closed') || name.includes('resolved') || name.includes('complete')) lastCat = 'done'
            else if (name.includes('to do') || name.includes('todo') || name.includes('open') || name.includes('backlog') || name.includes('new')) lastCat = 'new'
            else lastCat = 'indeterminate'
          }
        }
      }
    }
    if (lastCat === 'indeterminate') count++
  }
  return count
}

export async function calculateVelocityTrend(projectKey: string): Promise<TrendData> {
  console.log(`[Velocity Trend] Starting calculation for ${projectKey}`)
  const now = new Date()
  const trend: any[] = []

  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    const count = await getCompletedOnDate(projectKey, date)
    trend.push({
      date: date.toISOString().split('T')[0],
      dayLabel: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yest' : `D-${daysAgo}`,
      value: count
    })
  }

  console.log(`[Velocity Trend] Points: ${JSON.stringify(trend.map(d => d.value))}`)

  const total = trend.reduce((sum, d) => sum + d.value, 0)
  const avgVelocity = total / trend.length

  // Calculate direction similar to WIP: compare first half to second half
  // Compare first 3 days vs last 3 days, skip middle day for symmetric comparison
  const firstHalf = trend.slice(0, 3).reduce((sum, d) => sum + d.value, 0) / 3
  const secondHalf = trend.slice(-3).reduce((sum, d) => sum + d.value, 0) / 3
  const change = Math.round(((secondHalf - firstHalf) / (firstHalf || 1)) * 100)
  const direction = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'stable'

  return {
    data: trend,
    averagePerDay: Math.round(avgVelocity * 10) / 10,
    total,
    direction,
    change
  }
}

async function getCompletedOnDate(projectKey: string, date: Date) {
  try {
    const dateStr = date.toISOString().split('T')[0]
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const nextStr = nextDate.toISOString().split('T')[0]
    const jql = `project = "${projectKey}" AND resolutiondate >= "${dateStr}" AND resolutiondate < "${nextStr}"`
    const response = await api.asApp().requestJira(
      route`/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ jql, maxResults: 1, fields: [] })
      }
    )
    if (!response.ok) {
      const errText = await response.text().catch(() => 'unknown')
      console.warn(`[Velocity] getCompletedOnDate ${dateStr} failed: ${response.status} - ${errText}`)
      return 0
    }
    const result = await response.json()
    return result.total || 0
  } catch (error) {
    console.error('[Velocity] getCompletedOnDate exception:', error)
    return 0
  }
}

export { STATUS_CATEGORIES }
