import api, { route } from '@forge/api'
import type { JiraIssue } from '../types/jira'
import type { LeadTimeResult, SectorTimes } from '../types/telemetry'
import { getProjectStatusMap, resolveCategoryForIssue } from './statusMap'
import { detectBoardType } from './telemetryUtils'

const STATUS_CATEGORIES = { TODO: 'new', IN_PROGRESS: 'indeterminate', DONE: 'done' }

export function calculateLeadTime(issues: JiraIssue[]): LeadTimeResult {
  const completedIssues = issues.filter(issue => issue.fields.status?.statusCategory?.key === STATUS_CATEGORIES.DONE)
  if (completedIssues.length === 0) return { average: 0, min: 0, max: 0, count: 0, byAssignee: {} }
  const leadTimes = completedIssues.map(issue => { const created = new Date(issue.fields.created || 0); const resolutionDate = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : new Date(issue.fields.updated || 0); return { key: issue.key, assignee: issue.fields.assignee?.displayName || 'Unassigned', leadTimeHours: (resolutionDate.getTime() - created.getTime()) / (1000 * 60 * 60) } })
  const totalHours = leadTimes.reduce((sum, lt) => sum + lt.leadTimeHours, 0)
  const byAssignee: any = {}
  leadTimes.forEach(lt => { const name = lt.assignee.toLowerCase().split(' ')[0]; if (!byAssignee[name]) byAssignee[name] = { total: 0, count: 0, best: Infinity }; byAssignee[name].total += lt.leadTimeHours; byAssignee[name].count++; byAssignee[name].best = Math.min(byAssignee[name].best, lt.leadTimeHours) })
  Object.keys(byAssignee).forEach(name => { byAssignee[name] = { average: Math.round(byAssignee[name].total / byAssignee[name].count), best: Math.round(byAssignee[name].best), count: byAssignee[name].count } })
  return { average: Math.round(totalHours / leadTimes.length), min: Math.round(Math.min(...leadTimes.map(lt => lt.leadTimeHours))), max: Math.round(Math.max(...leadTimes.map(lt => lt.leadTimeHours))), count: leadTimes.length, byAssignee }
}

export async function calculateCycleTime(issueKeys: string[], context?: any): Promise<SectorTimes> {
  const projectKey = context?.extension?.project?.key
  if (!issueKeys || issueKeys.length === 0) return getDefaultCycleTime()
  let statusMap: any = null
  let columns: Array<{ name: string; statuses: Array<{ name: string }> }> = []
  try { if (projectKey) { statusMap = await getProjectStatusMap(projectKey); const board = await detectBoardType(projectKey); if (board.boardId) { columns = await getBoardColumns(board.boardId) } } } catch { }
  const columnAgg: Record<string, { totalHours: number; count: number; category: 'new' | 'indeterminate' | 'done' }> = {}
  // Initialize categories for columns based on majority of statuses
  try {
    columns.forEach(col => {
      const counts: any = { new: 0, indeterminate: 0, done: 0 }
      col.statuses.forEach(s => { const cat = resolveCategoryForIssue(statusMap, s.name) || 'indeterminate'; counts[cat]++ })
      const cat = (Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'indeterminate') as any
      columnAgg[col.name] = { totalHours: 0, count: 0, category: cat }
    })
  } catch { }
  const sampleKeys = issueKeys.slice(0, 20)
  let totalUnmapped = 0
  for (const issueKey of sampleKeys) {
    try {
      const { perColumn, currentColumn, unmappedHours } = await getIssueColumnTimes(issueKey, context, statusMap, columns)
      Object.entries(perColumn).forEach(([col, hours]: any) => { if (!columnAgg[col]) columnAgg[col] = { totalHours: 0, count: 0, category: 'indeterminate' }; columnAgg[col].totalHours += hours; columnAgg[col].count++ })
      if (unmappedHours && unmappedHours > 0) totalUnmapped += unmappedHours
      if (currentColumn) { /* noop; accounted in perColumn finalization */ }
    } catch { }
  }
  const sectors: SectorTimes = {}
  Object.entries(columnAgg).forEach(([name, agg]) => { const avg = agg.count > 0 ? Math.round(agg.totalHours / agg.count) : 0; sectors[name] = { name, category: agg.category, avgHours: avg, status: 'optimal' } })
  if (totalUnmapped > 0) { const avgUnmapped = Math.round(totalUnmapped / (sampleKeys.length || 1)); sectors['UNMAPPED'] = { name: 'UNMAPPED', category: 'indeterminate', avgHours: avgUnmapped, status: 'warning' } }
  return sectors
}

export async function getIssueStatusCategoryTimes(issueKey: string, context?: any, statusMap?: any) {
  try {
    const requester = () => (context?.accountId ? api.asUser() : api.asApp())
    const response = await safeRequestJira(requester, route`/rest/api/3/issue/${issueKey}?expand=changelog`)
    const issue = await response.json()
    const changelog = issue.changelog?.histories || []
    const transitions: any[] = []
    const created = new Date(issue.fields.created)
    transitions.push({ timestamp: created, toCategory: 'new' })
    changelog.forEach((history: any) => { const statusChange = history.items?.find((item: any) => item.field === 'status'); if (statusChange) transitions.push({ timestamp: new Date(history.created), fromStatus: statusChange.fromString, toStatus: statusChange.toString }) })
    const currentCategory = issue.fields.status?.statusCategory?.key
    const now = new Date()
    const categoryTimes: any = { new: 0, indeterminate: 0, done: 0 }
    let lastCategory: any = 'new'
    let lastTimestamp = created
    const issueTypeName = issue?.fields?.issuetype?.name
    for (let i = 1; i < transitions.length; i++) { const transition = transitions[i]; const duration = (transition.timestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60); if (categoryTimes[lastCategory] !== undefined) categoryTimes[lastCategory] += duration; lastCategory = approximateCategoryFromStatus(transition.toStatus, statusMap, issueTypeName); lastTimestamp = transition.timestamp }
    const finalDuration = (now.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60)
    if (categoryTimes[currentCategory] !== undefined) categoryTimes[currentCategory] += finalDuration
    return categoryTimes
  } catch (error) { return { new: 0, indeterminate: 0, done: 0 } }
}

const _colsCache: Record<string, { val: Array<{ name: string; statuses: Array<{ name: string }> }>; exp: number }> = {}
export async function getBoardColumns(boardId: number): Promise<Array<{ name: string; statuses: Array<{ name: string }> }>> {
  const key = String(boardId)
  const hit = _colsCache[key]
  if (hit && Date.now() < hit.exp) return hit.val
  try {
    const resp = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/configuration`, { headers: { Accept: 'application/json' } })
    if (!resp.ok) return []
    const cfg = await resp.json()
    const cols = (cfg?.columnConfig?.columns || []).map((c: any) => ({ name: c.name as string, statuses: (c.statuses || []).map((s: any) => ({ name: s.name as string })) }))
    _colsCache[key] = { val: cols, exp: Date.now() + 60 * 60_000 }
    return cols
  } catch { return [] }
}

async function getIssueColumnTimes(issueKey: string, context?: any, statusMap?: any, columns?: Array<{ name: string; statuses: Array<{ name: string }> }>) {
  try {
    const requester = () => (context?.accountId ? api.asUser() : api.asApp())
    const response = await requester().requestJira(route`/rest/api/3/issue/${issueKey}?expand=changelog`)
    const issue = await response.json()
    const changelog = issue.changelog?.histories || []
    const transitions: any[] = []
    const created = new Date(issue.fields.created)
    transitions.push({ timestamp: created, toStatus: issue.fields.status?.name || 'To Do' })
    changelog.forEach((history: any) => { const statusChange = history.items?.find((item: any) => item.field === 'status'); if (statusChange) transitions.push({ timestamp: new Date(history.created), fromStatus: statusChange.fromString, toStatus: statusChange.toString }) })
    const now = new Date()
    const perColumn: Record<string, number> = {}
    let unmappedHours = 0
    let lastTimestamp = created
    let lastColumn = mapStatusToColumn(transitions[0]?.toStatus, columns || [])
    for (let i = 1; i < transitions.length; i++) {
      const t = transitions[i]
      const duration = (t.timestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60)
      if (lastColumn) perColumn[lastColumn] = (perColumn[lastColumn] || 0) + duration; else unmappedHours += duration
      lastTimestamp = t.timestamp
      lastColumn = mapStatusToColumn(t.toStatus, columns || [])
    }
    const finalDuration = (now.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60)
    if (lastColumn) perColumn[lastColumn] = (perColumn[lastColumn] || 0) + finalDuration; else unmappedHours += finalDuration
    const currentColumn = mapStatusToColumn(issue.fields.status?.name, columns || [])
    return { perColumn, currentColumn, unmappedHours }
  } catch { return { perColumn: {}, currentColumn: null, unmappedHours: 0 } }
}

export function mapStatusToColumn(statusName?: string, columns?: Array<{ name: string; statuses: Array<{ name: string }> }>) {
  const s = (statusName || '').toLowerCase()
  const col = (columns || []).find(c => (c.statuses || []).some(st => (st.name || '').toLowerCase() === s))
  return col?.name || null
}

function approximateCategoryFromStatus(statusName?: string, statusMap?: any, issueTypeName?: string): 'new' | 'indeterminate' | 'done' { if (!statusName) return 'new'; const mapped = resolveCategoryForIssue(statusMap || null, statusName, issueTypeName); if (mapped) return mapped; const name = statusName.toLowerCase(); if (name.includes('done') || name.includes('closed') || name.includes('resolved') || name.includes('complete') || name.includes('finished') || name.includes('released')) return 'done'; if (name.includes('to do') || name.includes('todo') || name.includes('open') || name.includes('backlog') || name.includes('new') || name.includes('created')) return 'new'; return 'indeterminate' }

function getDefaultCycleTime(): SectorTimes { return {} }

export function evaluateSectorPerformance(sectorTimes: SectorTimes, thresholds: any = {}) { const defaultThresholds = { new: { warning: 24, critical: 48 }, indeterminate: { warning: 40, critical: 72 }, done: { warning: 8, critical: 24 } }; const limits = { ...defaultThresholds, ...thresholds }; Object.keys(sectorTimes).forEach((sector: any) => { const data = (sectorTimes as any)[sector]; const limit = limits[data.category]; if (data.avgHours >= limit.critical) data.status = 'critical'; else if (data.avgHours >= limit.warning) data.status = 'warning'; else data.status = 'optimal' }); return sectorTimes }

export { STATUS_CATEGORIES }
async function safeRequestJira(getRequester: () => any, path: any) { try { return await getRequester().requestJira(path, { headers: { Accept: 'application/json' } }) } catch (err: any) { try { const isAuthErr = (err?.status === 401 && err?.serviceKey === 'atlassian-token-service-key') || (typeof err?.message === 'string' && err.message.includes('NEEDS_AUTHENTICATION_ERR')); if (isAuthErr) { console.warn('[Timing] asUser failed - falling back to asApp()'); return await api.asApp().requestJira(path, { headers: { Accept: 'application/json' } }) } } catch { } throw err } }
