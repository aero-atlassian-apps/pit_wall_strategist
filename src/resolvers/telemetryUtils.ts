import api, { route } from '@forge/api'
import type { JiraIssue, StatusCategoryKey } from '../types/jira'
import type { TelemetryConfig, BoardData, TelemetryData, CategorizedIssue, BoardType, BoardContext } from '../types/telemetry'
import { resolveCategoryForIssue } from './statusMap'

const DEFAULT_CONFIG: TelemetryConfig = { wipLimit: 8, assigneeCapacity: 3, stalledThresholdHours: 24, stalledThresholdHoursByType: {}, storyPointsFieldName: 'Story Points', statusCategories: { todo: 'new', inProgress: 'indeterminate', done: 'done' }, includeBoardIssuesWhenSprintEmpty: true, locale: 'en' }
let fieldCache: { storyPoints: string | null; sprint: string | null; epicLink?: string | null; flagged?: string | null } | null = null

export async function discoverCustomFields() {
  if (fieldCache) return fieldCache
  try { const response = await api.asApp().requestJira(route`/rest/api/3/field`, { headers: { Accept: 'application/json' } }); const fields = await response.json(); fieldCache = { storyPoints: findFieldByName(fields, ['Story Points', 'Story point estimate', 'Estimation']), sprint: findFieldByName(fields, ['Sprint']), epicLink: findFieldByName(fields, ['Epic Link', 'Parent Link']), flagged: findFieldByName(fields, ['Flagged', 'Flag']) }; return fieldCache } catch (error) { return { storyPoints: 'customfield_10016', sprint: 'customfield_10020', flagged: 'customfield_10021' } }
}

function findFieldByName(fields: any[], patterns: string[]) { for (const pattern of patterns) { const field = fields.find(f => f.name?.toLowerCase() === pattern.toLowerCase() || f.name?.toLowerCase().includes(pattern.toLowerCase())); if (field) return field.id as string } return null }

// Detect if project is Jira Software or Jira Work Management (Business)
async function detectProjectType(projectKey: string): Promise<'software' | 'business'> {
  try {
    const resp = await api.asApp().requestJira(route`/rest/api/3/project/${projectKey}`, { headers: { Accept: 'application/json' } })
    if (!resp.ok) return 'software' // Default to software if can't detect
    const project = await resp.json()
    // Business projects have projectTypeKey = 'business' or style = 'next-gen'/'basic' without boards
    if (project.projectTypeKey === 'business') {
      console.log(`[Telemetry] Detected Business/JWM project: ${projectKey}`)
      return 'business'
    }
    return 'software'
  } catch (e) {
    console.warn('[Telemetry] Project type detection failed, defaulting to software', e)
    return 'software'
  }
}

export async function detectBoardType(projectKey: string): Promise<BoardContext> {
  // First check if it's a business project (no agile boards)
  const projectType = await detectProjectType(projectKey)
  if (projectType === 'business') {
    return { boardType: 'business', boardId: null, boardName: 'Work Items' }
  }

  // Try to get agile boards
  const response = await api.asApp().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    // If agile API fails, fall back to business mode
    console.log(`[Telemetry] Agile API failed for ${projectKey}, falling back to business mode`)
    return { boardType: 'business', boardId: null, boardName: 'Work Items' }
  }
  const boards = await response.json()
  if (!boards.values?.length) {
    // No boards found, use business mode with JQL
    console.log(`[Telemetry] No agile boards for ${projectKey}, using JQL mode`)
    return { boardType: 'business', boardId: null, boardName: 'Work Items' }
  }
  // TODO: Logic to select the "current" board if multiple exist. Currently defaults to the first one.
  const board = boards.values[0]
  console.log(`Detected board: ${board.name} (${board.id}) for project ${projectKey}`)
  return { boardType: (board.type || 'scrum') as 'scrum' | 'kanban', boardId: board.id as number, boardName: board.name as string }
}

// Deprecated alias for backward compatibility
export const fetchSprintData = fetchBoardData

export async function fetchBoardData(projectKey: string, config: TelemetryConfig = DEFAULT_CONFIG, context?: any): Promise<BoardData> {
  console.log('[fetchBoardData] received context:', context)
  const boardInfo = await detectBoardType(projectKey)

  // Handle Business/JWM projects (no agile boards)
  if (boardInfo.boardType === 'business') {
    return fetchBusinessProjectData(projectKey, config, context)
  }

  if (boardInfo.boardType === 'kanban') {
    return fetchKanbanData(boardInfo, config, context)
  }

  return fetchScrumData(boardInfo, config, projectKey, context)
}

// Fetch data for Jira Work Management (Business) projects using JQL only
async function fetchBusinessProjectData(projectKey: string, config: TelemetryConfig, context?: any): Promise<BoardData> {
  console.log(`[Telemetry] Fetching Business/JWM Data for Project ${projectKey} using JQL`)

  const jql = `project = "${projectKey}" ORDER BY updated DESC`
  const result = await searchJqlUserOnly(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100)

  if (result.ok) {
    console.log(`[Telemetry] Business Project Issues Loaded: ${result.issues?.length || 0}`)
    return {
      boardType: 'business',
      boardId: null,
      boardName: 'Work Items',
      issues: (result.issues || []) as JiraIssue[]
    }
  }

  console.warn(`[Telemetry] Business Project JQL failed: ${result.status}`)
  return {
    boardType: 'business',
    boardId: null,
    boardName: 'Work Items',
    issues: []
  }
}

async function fetchScrumData(boardCtx: BoardContext, config: TelemetryConfig, projectKey?: string, context?: any): Promise<BoardData> {
  const boardId = boardCtx.boardId!
  console.log(`[Telemetry] Fetching Scrum Data for Board ${boardId}, Project ${projectKey}`)
  let activeSprint: any = null

  // Strategy 1: Try Board API for active sprints
  try {
    const sprintResponse = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=active`, { headers: { Accept: 'application/json' } })
    if (sprintResponse.ok) {
      const sprints = await sprintResponse.json()
      console.log(`[Telemetry] Board Active Sprints Found: ${sprints.values?.length || 0}`)
      if (sprints.values?.length) activeSprint = sprints.values[0]
    } else {
      console.log(`[Telemetry] Board Sprint API Error: ${sprintResponse.status}`)
    }
  } catch (e) { console.warn('[Telemetry] Board Sprint API Exception', e) }

  // Strategy 2: If no active sprint, check for future sprints
  if (!activeSprint) {
    try {
      console.log('[Telemetry] Checking future sprints...')
      const futureResponse = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=future`, { headers: { Accept: 'application/json' } })
      if (futureResponse.ok) {
        const futureSprints = await futureResponse.json()
        console.log(`[Telemetry] Future Sprints Found: ${futureSprints.values?.length || 0}`)
        if (futureSprints.values?.length) activeSprint = futureSprints.values[0]
      }
    } catch (e) { console.log('[Telemetry] Future Sprint check failed', e) }
  }

  // Strategy 3: JQL Fallback
  if (!activeSprint && projectKey) {
    const jql = `project = "${projectKey}" AND sprint in openSprints()`
    console.log(`[Telemetry] FALLBACK ACTIVATED. Executing JQL: ${jql}`)

    try {
      const issuesResponse = await api.asApp().requestJira(route`/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,assignee,priority,issuetype,updated,created,labels`, { headers: { Accept: 'application/json' } })

      if (!issuesResponse.ok) {
        const errorText = await issuesResponse.text()
        console.error(`[Telemetry] JQL Fallback API Error: ${issuesResponse.status}`, errorText)
      } else {
        const issuesData = await issuesResponse.json()
        console.log(`[Telemetry] JQL Fallback Issues Found: ${issuesData.issues?.length || 0}`)

        if (issuesData.issues?.length > 0) {
          return {
            ...boardCtx,
            sprint: {
                id: -1,
                name: 'Active Sprint (JQL Detected)',
                state: 'active'
            },
            issues: (issuesData.issues || []) as JiraIssue[]
          }
        }
      }
    } catch (e) {
      console.error('[Telemetry] JQL Fallback Exception:', e)
    }
  }

  if (!activeSprint) {
    // Use fallback to board issues if configured
    if (config?.includeBoardIssuesWhenSprintEmpty !== false) {
       console.log('[Telemetry] No active sprint found, falling back to all board issues')
       const boardIssues = await fetchAllBoardIssues(boardId, projectKey)
       return {
         ...boardCtx,
         // We don't attach a sprint object because there is no active sprint
         issues: boardIssues
       }
    }

    console.error(`[Telemetry] No sprints found via Board ${boardId} or JQL.`)
    throw new Error(`No active or future sprints found on board ${boardId} or via JQL in project.`)
  }

  console.log(`[Telemetry] Using Sprint: ${activeSprint.name} (${activeSprint.id})`)

  // Prefer JQL (POST /rest/api/3/search) to avoid Agile endpoint 401s
  const initialJql = `sprint = ${activeSprint.id}`
  const initialJqlRes = await searchJqlUserOnly(initialJql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100)

  const sprintObj = {
      id: activeSprint.id,
      name: activeSprint.name,
      state: activeSprint.state,
      startDate: activeSprint.startDate,
      endDate: activeSprint.endDate,
      goal: activeSprint.goal
  }

  if (initialJqlRes.ok && (initialJqlRes.issues?.length || 0) > 0) {
    console.log(`[Telemetry] Sprint JQL Primary Loaded: ${initialJqlRes.issues?.length || 0}`)
    return { ...boardCtx, sprint: sprintObj, issues: (initialJqlRes.issues || []) as JiraIssue[] }
  }

  // Fallback to fetching board issues
  const boardIssues = await fetchAllBoardIssues(boardId, projectKey, activeSprint.id)
  return { ...boardCtx, sprint: sprintObj, issues: boardIssues }
}

async function fetchAllBoardIssues(boardId: number, projectKey?: string, sprintId?: number): Promise<JiraIssue[]> {
    try {
      const cfgResponse = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/configuration`, { headers: { Accept: 'application/json' } })
      let filterId: number | null = null
      if (cfgResponse.ok) {
        const cfg = await cfgResponse.json()
        filterId = cfg?.filter?.id || null
      }

      if (filterId) {
        let jql = `filter = ${filterId}`
        // If we know the sprint ID, try to filter by it
        if (sprintId) {
            jql += ` AND sprint = ${sprintId}`
        }

        const boardJqlRes = await searchJqlUserOnly(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100)
        if (boardJqlRes.ok) {
          console.log(`[Telemetry] Fallback: Board Issues Loaded via JQL filter ${filterId}: ${boardJqlRes.issues?.length || 0}`)
          return (boardJqlRes.issues || []) as JiraIssue[]
        }
      }

      // Skip Agile board issues; rely on JQL-only
      if (projectKey) {
        const projJql = `project = "${projectKey}" ORDER BY updated DESC`
        const projRes = await searchJqlUserOnly(projJql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100)
        if (projRes.ok) {
          console.log(`[Telemetry] Fallback: Project Issues Loaded: ${projRes.issues?.length || 0}`)
          return (projRes.issues || []) as JiraIssue[]
        }
      }
    } catch (e) {
      console.log('[Telemetry] Board Issues Fallback Exception', e)
    }
    return []
}

async function fetchKanbanData(boardCtx: BoardContext, config: TelemetryConfig, context?: any): Promise<BoardData> {
  const boardId = boardCtx.boardId!
  console.log(`[Telemetry] Fetching Kanban Data for Board ${boardId}`)

  // Strategy 1: Try Board API endpoint
  try {
    const issuesResponse = await api.asApp().requestJira(
      route`/rest/agile/1.0/board/${boardId}/issue?maxResults=100`,
      { headers: { Accept: 'application/json' } }
    )

    if (issuesResponse.ok) {
      const issuesData = await issuesResponse.json()
      console.log(`[Telemetry] Kanban Board API: ${issuesData.issues?.length || 0} issues found`)
      if (issuesData.issues?.length > 0) {
        return { ...boardCtx, issues: (issuesData.issues || []) as JiraIssue[] }
      }
    } else {
      console.log(`[Telemetry] Kanban Board API Error: ${issuesResponse.status}`)
    }
  } catch (e) {
    console.warn('[Telemetry] Kanban Board API Exception:', e)
  }

  // Strategy 2: JQL Fallback via board filter
  const issuesFromFilter = await fetchAllBoardIssues(boardId)
  if (issuesFromFilter.length > 0) {
      return { ...boardCtx, issues: issuesFromFilter }
  }

  // Strategy 3: Project-based JQL fallback
  try {
    console.log('[Telemetry] Kanban: Trying project-based JQL...')
    const cfgResponse = await api.asApp().requestJira(
      route`/rest/agile/1.0/board/${boardId}/configuration`,
      { headers: { Accept: 'application/json' } }
    )

    if (cfgResponse.ok) {
      const cfg = await cfgResponse.json()
      const projectKeyOrLocation = cfg?.location?.projectKey || cfg?.location?.name

      if (projectKeyOrLocation) {
        const jql = `project = "${projectKeyOrLocation}" ORDER BY updated DESC`
        const jqlRes = await searchJqlUserOnly(jql, ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'created', 'labels'], 100)

        if (jqlRes.ok && (jqlRes.issues?.length || 0) > 0) {
          console.log(`[Telemetry] Kanban Project JQL Fallback: ${jqlRes.issues?.length} issues`)
          return { ...boardCtx, issues: (jqlRes.issues || []) as JiraIssue[] }
        }
      }
    }
  } catch (e) {
    console.warn('[Telemetry] Kanban project JQL fallback exception:', e)
  }

  // Return empty board if all strategies fail
  console.log('[Telemetry] Kanban: All strategies exhausted, returning empty board')
  return { ...boardCtx, issues: [] }
}

export async function calculateTelemetry(boardData: BoardData, config: TelemetryConfig = DEFAULT_CONFIG, statusMap?: any): Promise<TelemetryData> {
  const issues = boardData.issues
  const customFields = await discoverCustomFields()
  const todoIssues = issues.filter(i => getStatusCategory(i, statusMap) === config.statusCategories.todo)
  const inProgressIssues = issues.filter(i => getStatusCategory(i, statusMap) === config.statusCategories.inProgress)
  const doneIssues = issues.filter(i => getStatusCategory(i, statusMap) === config.statusCategories.done)

  const wipCurrent = inProgressIssues.length
  const wipLimit = config.wipLimit

  // WIP Load: In Scrum this is usually relative to team capacity
  // In Kanban, this is relative to WIP Limit
  const wipLoad = wipLimit > 0 ? Math.round((wipCurrent / wipLimit) * 100) : 0

  const assigneeLoad: Record<string, number> = {}
  const assigneeCapacity = config.assigneeCapacity
  inProgressIssues.forEach(issue => { const assignee = issue.fields.assignee?.displayName || 'Unassigned'; assigneeLoad[assignee] = (assigneeLoad[assignee] || 0) + 1 })
  const teamBurnout: Record<string, number> = {}
  Object.entries(assigneeLoad).forEach(([name, count]) => { const firstName = name.toLowerCase().split(' ')[0]; teamBurnout[firstName] = Math.round((count / assigneeCapacity) * 100) })

  const storyPointsField = customFields.storyPoints
  const getPoints = (issue: JiraIssue) => { if (!storyPointsField) return 1; return (issue.fields as any)[storyPointsField] || 0 }
  const totalStoryPoints = issues.reduce((sum, i) => sum + getPoints(i), 0)
  const doneStoryPoints = doneIssues.reduce((sum, i) => sum + getPoints(i), 0)

  const completion = totalStoryPoints > 0 ? Math.round((doneStoryPoints / totalStoryPoints) * 100) : 0

  let velocityDelta = 0
  // Velocity Delta only makes sense if we have a target (e.g. time based in Scrum)
  if (boardData.boardType === 'scrum' && boardData.sprint?.startDate && boardData.sprint?.endDate) {
      const now = new Date()
      const start = new Date(boardData.sprint.startDate)
      const end = new Date(boardData.sprint.endDate)
      const totalDuration = end.getTime() - start.getTime()
      const elapsed = now.getTime() - start.getTime()
      const expectedProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)))
      velocityDelta = completion - expectedProgress
  }

  let healthStatus: TelemetryData['healthStatus'] = 'OPTIMAL'

  if (boardData.boardType === 'scrum') {
      if (velocityDelta < -20 || wipLoad > 100) healthStatus = 'CRITICAL'
      else if (velocityDelta < -10 || wipLoad > 80) healthStatus = 'WARNING'
  } else {
      // Kanban / Business Logic
      if (wipLoad > 100) healthStatus = 'CRITICAL'
      else if (wipLoad > 90) healthStatus = 'WARNING'
  }

  return {
      boardType: boardData.boardType,
      healthStatus,
      sprintStatus: healthStatus, // Backward compat
      velocityDelta,
      wipLoad,
      wipLimit,
      wipCurrent,
      teamBurnout,
      completion,
      issuesByStatus: { todo: todoIssues.length, inProgress: inProgressIssues.length, done: doneIssues.length }
  }
}

function getStatusCategory(issue: JiraIssue, statusMap?: any): StatusCategoryKey {
  // Priority 1: Use Jira's native status category if available
  const cat = issue.fields.status?.statusCategory?.key as StatusCategoryKey | undefined
  if (cat) return cat

  // Priority 2: Try to resolve from project status map
  const name = (issue.fields.status?.name || '').toLowerCase()
  const mapped = resolveCategoryForIssue(statusMap || null, name, issue.fields.issuetype?.name)
  if (mapped) return mapped as StatusCategoryKey

  // Priority 3: Comprehensive pattern matching for ALL Jira templates
  // Work Management, Software (Scrum/Kanban), IT Service Management, etc.

  // IN PROGRESS patterns (most specific first)
  if (
    name.includes('progress') ||
    name.includes('doing') ||
    name.includes('active') ||
    name.includes('implement') ||
    name.includes('review') ||          // Code Review, In Review
    name.includes('testing') ||          // Testing, QA Testing
    name.includes('development') ||      // In Development
    name.includes('work') ||             // Working On, Work Started
    name.includes('building') ||         // Building
    name.includes('designing') ||        // Designing
    name.includes('investigating') ||    // Investigating (ITSM)
    name.includes('responding') ||       // Responding (ITSM)
    name.includes('escalated') ||        // Escalated
    name.includes('pending') ||          // Pending Approval (treated as in-flight)
    name.includes('waiting') ||          // Waiting for Customer (in-flight)
    name.includes('blocked')             // Blocked (still in-flight)
  ) return 'indeterminate'

  // DONE patterns
  if (
    name.includes('done') ||
    name.includes('complete') ||
    name.includes('resolved') ||
    name.includes('closed') ||
    name.includes('released') ||         // Released
    name.includes('deployed') ||         // Deployed
    name.includes('finished') ||         // Finished
    name.includes('delivered') ||        // Delivered
    name.includes('published') ||        // Published
    name.includes('approved') ||         // Approved (final state)
    name.includes('cancelled') ||        // Cancelled/Canceled
    name.includes('declined') ||         // Declined
    name.includes('rejected') ||         // Rejected
    name.includes('won\'t') ||           // Won't Do, Won't Fix
    name.includes('duplicate') ||        // Duplicate
    name.includes('archived')            // Archived
  ) return 'done'

  // Default to NEW for everything else (backlog, open, to do, new, etc.)
  return 'new'
}

export function detectStalledTickets(issues: JiraIssue[], config: TelemetryConfig = DEFAULT_CONFIG, statusMap?: any) {
  const now = new Date()
  const { stalledThresholdHours, statusCategories, stalledThresholdHoursByType } = config
  return issues.filter(issue => { const statusCategory = getStatusCategory(issue, statusMap); const isInProgress = statusCategory === statusCategories.inProgress; const updated = new Date(issue.fields.updated || 0); const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60); const priority = issue.fields.priority?.name || 'Medium'; const isHighPriority = ['Highest', 'High', 'Critical', 'Blocker'].includes(priority); const typeName = (issue.fields.issuetype?.name || '').toLowerCase(); const typeThreshold = stalledThresholdHoursByType?.[typeName] ?? stalledThresholdHours; return isInProgress && hoursSinceUpdate > typeThreshold && isHighPriority }).map(issue => ({ key: issue.key, summary: issue.fields.summary, assignee: issue.fields.assignee?.displayName || 'Unassigned', status: issue.fields.status?.name, statusCategory: getStatusCategory(issue, statusMap), hoursSinceUpdate: Math.round((now.getTime() - new Date(issue.fields.updated || 0).getTime()) / (1000 * 60 * 60)), priority: issue.fields.priority?.name, reason: inferBlockingReason(issue) }))
}

function inferBlockingReason(issue: JiraIssue) { const labels = issue.fields.labels || []; const summary = (issue.fields.summary || '').toLowerCase(); const description = ''; if (labels.some(l => l.toLowerCase().includes('block'))) return 'Explicitly marked as blocked'; if (summary.includes('api') || description.includes('api')) return 'Waiting on API specification'; if (summary.includes('design') || description.includes('design')) return 'Awaiting design approval'; if (summary.includes('depend')) return 'External dependency'; if (labels.some(l => l.toLowerCase().includes('review'))) return 'Stuck in code review'; if (summary.includes('test') || description.includes('test')) return 'Waiting on test environment'; return 'Unknown blocker - needs investigation' }

export function categorizeIssues(issues: JiraIssue[], statusMap?: any): CategorizedIssue[] { return issues.map(issue => ({ key: issue.key, summary: issue.fields.summary, status: issue.fields.status?.name, statusCategory: getStatusCategory(issue, statusMap), assignee: issue.fields.assignee?.displayName || 'Unassigned', updated: issue.fields.updated, priority: issue.fields.priority?.name || 'Medium', isStalled: false })) }

export { DEFAULT_CONFIG }
export { searchJqlUserOnly }
export function getFieldCacheSnapshot() { return fieldCache }
async function safeRequestJira(getRequester: () => any, path: any) {
  try {
    const resp = await getRequester().requestJira(path, { headers: { Accept: 'application/json' } })
    if (resp && resp.status === 401) {
      try { const txt = await resp.text(); if (txt?.toLowerCase().includes('unauthorized') || txt?.toLowerCase().includes('scope')) { return await api.asApp().requestJira(path, { headers: { Accept: 'application/json' } }) } } catch { }
    }
    return resp
  } catch (err: any) {
    try {
      const isAuthErr = (err?.status === 401 && err?.serviceKey === 'atlassian-token-service-key') || (typeof err?.message === 'string' && err.message.includes('NEEDS_AUTHENTICATION_ERR'))
      if (isAuthErr) { console.warn('[Telemetry] asUser failed - falling back to asApp()'); return await api.asApp().requestJira(path, { headers: { Accept: 'application/json' } }) }
    } catch { }
    throw err
  }
}
async function safeRequest(getRequester: () => any, path: any, options?: any) {
  try {
    const resp = await getRequester().requestJira(path, options || { headers: { Accept: 'application/json' } })
    if (resp && resp.status === 401) {
      try { const txt = await resp.text(); if (txt?.toLowerCase().includes('unauthorized') || txt?.toLowerCase().includes('scope')) { return await api.asApp().requestJira(path, options || { headers: { Accept: 'application/json' } }) } } catch { }
    }
    return resp
  } catch (err: any) {
    try {
      const isAuthErr = (err?.status === 401 && err?.serviceKey === 'atlassian-token-service-key') || (typeof err?.message === 'string' && err.message.includes('NEEDS_AUTHENTICATION_ERR'))
      if (isAuthErr) { console.warn('[Telemetry] asUser failed - falling back to asApp()'); return await api.asApp().requestJira(path, options || { headers: { Accept: 'application/json' } }) }
    } catch { }
    throw err
  }
}
async function searchJql(getRequester: () => any, jql: string, fields: string[], limit = 100) {
  const body = JSON.stringify({ jql, maxResults: limit, fields })
  const postResp = await safeRequest(getRequester, route`/rest/api/3/search/jql`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body })
  if (postResp.ok) {
    const data = await postResp.json()
    const issues = data?.issues || []
    return { ok: true, issues }
  }
  const text = await postResp.text().catch(() => '')
  console.log(`[Telemetry] JQL POST Error: ${postResp.status} ${text}`)
  return { ok: false, issues: [], status: postResp.status }
}
async function searchJqlUserOnly(jql: string, fields: string[], limit = 100) {
  const body = JSON.stringify({ jql, maxResults: limit, fields })
  const resp = await api.asUser().requestJira(route`/rest/api/3/search/jql`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body })
  if (!resp.ok) { const text = await resp.text(); console.log(`[Telemetry] JQL POST Error: ${resp.status} ${text}`); return { ok: false, issues: [], status: resp.status } }
  const data = await resp.json()
  return { ok: true, issues: data?.issues || [] }
}
