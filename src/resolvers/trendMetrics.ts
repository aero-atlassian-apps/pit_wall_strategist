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
            // C-001 FIX: Fallback with warning for chameleon compliance
            const name = (statusChange.toString || '').toLowerCase()
            if (name.includes('done') || name.includes('closed') || name.includes('resolved') || name.includes('complete')) {
              lastCat = 'done'
              console.warn(`[Chameleon] countInProgressAtTime: Using name heuristic for "${statusChange.toString}" -> done`)
            } else if (name.includes('to do') || name.includes('todo') || name.includes('open') || name.includes('backlog') || name.includes('new')) {
              lastCat = 'new'
              console.warn(`[Chameleon] countInProgressAtTime: Using name heuristic for "${statusChange.toString}" -> new`)
            } else {
              lastCat = 'indeterminate'
            }
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

  // B-002 FIX: Fetch statusMap for chameleon-compliant done detection
  const statusMap = await getProjectStatusMap(projectKey).catch(() => null)

  // 1. Fetch Issues with Changelog (reusing the helper from WIP Trend)
  // We get last 30 days to be safe for a 7-day trend
  const issues = await getRecentIssuesWithChangelog(projectKey);

  // DIAGNOSTIC: Log issue completion stats
  const withResolutionDate = issues.filter((i: any) => i.fields.resolutiondate).length;
  const doneCategory = issues.filter((i: any) => i.fields.status?.statusCategory?.key === 'done').length;
  console.log(`[Velocity Trend] Fetched ${issues.length} issues for ${projectKey} (${withResolutionDate} resolved, ${doneCategory} done)`);

  const now = new Date()
  const trend: any[] = []

  // 2. Bucketing Logic
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    const dayStr = date.toISOString().split('T')[0]

    // Define Day Boundaries (Local time approximation or UTC? Using simple ISO date match)
    // Better: Count items that were "Completed" on this specific day.

    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    // B-002 FIX: Pass statusMap for accurate done detection
    const count = countCompletedOnDay(issues, startOfDay, endOfDay, statusMap);

    trend.push({
      date: dayStr,
      dayLabel: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yest' : `D-${daysAgo}`,
      value: count
    })
  }

  console.log(`[Velocity Trend] Points: ${JSON.stringify(trend.map(d => d.value))}`)

  const total = trend.reduce((sum, d) => sum + d.value, 0)
  const avgVelocity = total / trend.length

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

/**
 * B-002 FIX: Count completed items on a specific day.
 * CHAMELEON COMPLIANT: Uses status category API for done detection.
 * 
 * @param issues - Issues with changelog
 * @param start - Start of day
 * @param end - End of day  
 * @param statusMap - Pre-fetched status map for accurate category detection
 */
function countCompletedOnDay(issues: any[], start: Date, end: Date, statusMap?: any): number {
  let count = 0;
  const startTime = start.getTime();
  const endTime = end.getTime();

  for (const issue of issues) {
    // STRATEGY:
    // 1. Check if 'resolutiondate' falls in range (Most reliable if populated)
    // 2. Check if status CHANGED to 'Done' category in range (Changelog)

    if (issue.fields.resolutiondate) {
      const resTime = new Date(issue.fields.resolutiondate).getTime();
      if (resTime >= startTime && resTime <= endTime) {
        count++;
        continue; // Counted
      }
    }

    // If no resolution date match, check changelog for transition into Done
    // This handles cases where Resolution isn't set but status is Done
    const histories = issue.changelog?.histories || [];
    if (histories.length > 0) {
      // Sort history descending to find latest 'Done' entry
      histories.sort((a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime());

      for (const h of histories) {
        const item = h.items.find((i: any) => i.field === 'status');
        if (item) {
          // B-002 FIX: Chameleon-compliant done detection
          let isDone = false

          // Priority 1: Check if changelog item includes statusCategory
          const toCategoryKey = (item as any).toStatusCategory?.key
          if (toCategoryKey) {
            isDone = toCategoryKey === 'done'
          }
          // Priority 2: Use statusMap lookup by ID
          else if (statusMap && item.to) {
            const resolvedCat = resolveCategoryFromId(statusMap, item.to)
            if (resolvedCat) {
              isDone = resolvedCat === 'done'
            }
          }
          // Priority 3: Fallback to name heuristics (legacy, with warning)
          else {
            const toStr = (item.toString || '').toLowerCase();
            isDone = toStr.includes('done') || toStr.includes('closed') ||
              toStr.includes('resolved') || toStr.includes('complete');

            if (isDone) {
              console.warn(`[Chameleon] countCompletedOnDay: Using name heuristic for status "${item.toString}" (no statusMap). Consider passing statusMap for accuracy.`)
            }
          }

          if (isDone) {
            const time = new Date(h.created).getTime();
            if (time >= startTime && time <= endTime) {
              count++;
              break;
            }
          }
        }
      }
    }
  }
  return count;
}

export { STATUS_CATEGORIES }
