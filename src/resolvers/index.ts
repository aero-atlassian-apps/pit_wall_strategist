import Resolver from '@forge/resolver'
import api, { storage, route } from '@forge/api'
import { fetchBoardData, calculateTelemetry, detectStalledTickets, categorizeIssues, discoverCustomFields, detectBoardType, DEFAULT_CONFIG, getFieldCacheSnapshot } from './telemetryUtils'
import { getProjectStatusMap } from './statusMap'
import { getScopes } from '../config/scopes'
import { calculateLeadTime, calculateCycleTime, evaluateSectorPerformance, getIssueStatusCategoryTimes, getBoardColumns, mapStatusToColumn } from './timingMetrics'
import { cacheGet, cacheSet } from './cache'
import { calculateWipTrend, calculateVelocityTrend } from './trendMetrics'
import { checkProjectDevOpsStatus, detectNoCommitIssues, getMockDevOpsData } from './devOpsDetection'
import type { TelemetryConfig, TelemetryData, CategorizedIssue, BoardData, SectorTimes, LeadTimeResult, TrendData, StalledTicket } from '../types/telemetry'
import { getFetchStatuses } from './fetchStatus'
import { mockTelemetry, mockIssues, mockTiming, mockTrends, mockDevOps } from './mocks'
import { splitTicket, reassignTicket, deferTicket, handleAction } from './rovoActions'
import { getProjectContext, getContextSummary, type ProjectContext } from './contextEngine'
import { getAdvancedAnalytics, calculateSprintHealth, detectPreStallWarnings, analyzeWIPAging, detectBottleneck, analyzeTeamCapacity, detectScopeCreep } from './advancedAnalytics'
import { calculateAllFlowMetrics, FlowMetrics, FLOW_CATEGORY_F1_NAMES } from './flowTypeHeuristics'
import { SecurityGuard } from './security/SecurityGuard'

const resolver = new Resolver()
const PLATFORM = process.env.PLATFORM || 'atlassian'
let userConfig: TelemetryConfig = { ...DEFAULT_CONFIG }

resolver.define('getConfig', async ({ context }: any) => {
  try {
    const accountId = context?.accountId || context?.userAccountId || context?.cloudId || 'anon'
    const projectKey = context?.extension?.project?.key || 'global'
    const projectScopedKey = `telemetryConfig:${accountId}:${projectKey}`
    const legacyKey = `telemetryConfig:${accountId}`
    let stored = await storage.get(projectScopedKey)
    if (!stored) { stored = await storage.get(legacyKey) }
    userConfig = stored ? { ...DEFAULT_CONFIG, ...stored } : { ...DEFAULT_CONFIG }
    return { success: true, config: userConfig }
  } catch (e: any) {
    return { success: true, config: { ...DEFAULT_CONFIG } }
  }
})
resolver.define('setConfig', async ({ payload, context }: { payload: Partial<TelemetryConfig>; context: any }) => {
  try {
    const accountId = context?.accountId || context?.userAccountId || context?.cloudId || 'anon'
    const projectKey = context?.extension?.project?.key || 'global'
    const projectScopedKey = `telemetryConfig:${accountId}:${projectKey}`
    userConfig = { ...DEFAULT_CONFIG, ...payload }
    await storage.set(projectScopedKey, userConfig)
    return { success: true, config: userConfig }
  } catch (e: any) {
    return { success: false, error: e?.message || 'failed to save' }
  }
})

// === View Mode Persistence (Hybrid Role-Based Views) ===
resolver.define('getViewMode', async ({ context }: any) => {
  try {
    const accountId = context?.accountId || context?.userAccountId || 'anon'
    const key = `viewMode:${accountId}`
    const stored = await storage.get(key)
    return { success: true, viewMode: stored || 'all' }
  } catch (e: any) {
    return { success: true, viewMode: 'all' }
  }
})

resolver.define('setViewMode', async ({ payload, context }: { payload: { viewMode: string }; context: any }) => {
  try {
    const accountId = context?.accountId || context?.userAccountId || 'anon'
    const key = `viewMode:${accountId}`
    await storage.set(key, payload.viewMode)
    return { success: true, viewMode: payload.viewMode }
  } catch (e: any) {
    return { success: false, error: e?.message || 'failed to save view mode' }
  }
})

// === Theme Mode Persistence ===
resolver.define('getThemeMode', async ({ context }: any) => {
  try {
    const accountId = context?.accountId || context?.userAccountId || 'anon'
    const stored = await storage.get(`themeMode:${accountId}`)
    return { success: true, mode: stored || 'dark' }
  } catch { return { success: true, mode: 'dark' } }
})

resolver.define('setThemeMode', async ({ payload, context }: { payload: { mode: string }; context: any }) => {
  try {
    const accountId = context?.accountId || context?.userAccountId || 'anon'
    await storage.set(`themeMode:${accountId}`, payload.mode)
    return { success: true, mode: payload.mode }
  } catch (e: any) { return { success: false, error: e?.message } }
})

// === Multi-Board Support ===
resolver.define('getProjectBoards', async ({ context }: any) => {
  try {
    if (PLATFORM === 'local') {
      return {
        success: true, boards: [
          { id: 1, name: 'Main Board', type: 'scrum' },
          { id: 2, name: 'Kanban Flow', type: 'kanban' }
        ]
      }
    }
    const projectKey = context.extension.project.key as string
    const resp = await api.asApp().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, { headers: { Accept: 'application/json' } })
    if (!resp.ok) return { success: true, boards: [] }
    const data = await resp.json()
    const boards = (data.values || []).map((b: any) => ({ id: b.id, name: b.name, type: b.type?.toLowerCase() || 'scrum' }))
    return { success: true, boards }
  } catch (e: any) { return { success: false, boards: [], error: e?.message } }
})


resolver.define('getTelemetryData', async ({ context }: any) => {
  try {
    console.log('[ENTRY] getTelemetryData for project:', context?.extension?.project?.key)
    if (PLATFORM === 'local') return { success: true, data: mockTelemetry() }
    const projectKey = context.extension.project.key as string
    await discoverCustomFields()
    const statusMap = await getProjectStatusMap(projectKey)
    const boardData: BoardData = await fetchBoardData(projectKey, userConfig, context)
    const telemetry: TelemetryData = await calculateTelemetry(boardData, userConfig, statusMap)
    const stalledTickets: StalledTicket[] = detectStalledTickets(boardData.issues, userConfig, statusMap)
    console.log(`[Telemetry] Resolver Success. WIP: ${telemetry.wipCurrent}, Stalled: ${stalledTickets.length}`)

    // Determine appropriate display name for the period
    let periodName = boardData.boardName
    if (boardData.boardType === 'scrum' && boardData.sprint) {
      periodName = boardData.sprint.name
    }

    // Resolve locale (server-side i18n) without requiring asUser consent
    const supported = ['en', 'fr', 'es', 'pt'] as const
    let locale: typeof supported[number] = 'en'
    if (userConfig?.locale && (supported as readonly string[]).includes(userConfig.locale)) {
      locale = userConfig.locale as typeof supported[number]
    }

    const fetchStatuses = getFetchStatuses()
    const diagnostics = { velocitySource: telemetry.velocitySource, velocityWindow: telemetry.velocityWindow, fetchStatuses }
    return { success: true, data: { ...telemetry, sprintName: periodName, stalledTickets, diagnostics, feed: generateFeed(telemetry, stalledTickets, boardData.boardType, locale, fetchStatuses), alertActive: stalledTickets.length > 0 } }
  } catch (error: any) {
    console.error('Error fetching telemetry:', error)
    return { success: false, error: error.message || 'Failed to fetch telemetry data' }
  }
})

resolver.define('getSprintIssues', async ({ context }: any) => {
  try {
    console.log('[ENTRY] getSprintIssues for project:', context?.extension?.project?.key)
    if (PLATFORM === 'local') { return { success: true, boardType: 'scrum', sprintName: 'Local Board', issues: mockIssues() } }
    const projectKey = context.extension.project.key as string
    const boardData: BoardData = await fetchBoardData(projectKey, userConfig, context)
    const statusMap = await getProjectStatusMap(projectKey)
    const stalledTickets = detectStalledTickets(boardData.issues, userConfig, statusMap)
    const stalledKeys = new Set(stalledTickets.map(t => t.key))
    let columns: Array<{ name: string; statuses: Array<{ name: string }> }> = []

    // Attempt to get board columns if available
    try {
      if (boardData.boardId) {
        columns = await getBoardColumns(boardData.boardId)
      }
    } catch { }

    // Fallback if no columns found (e.g. failing to fetch board config)
    const useFallback = columns.length === 0
    if (useFallback) {
      columns = [
        { name: 'To Do', statuses: [] },
        { name: 'In Progress', statuses: [] },
        { name: 'Done', statuses: [] }
      ]
    }

    const categorizedIssues: CategorizedIssue[] = categorizeIssues(boardData.issues, statusMap).map(issue => {
      let colName = mapStatusToColumn(issue.status, columns)
      if (!colName && useFallback) {
        if (issue.statusCategory === 'new') colName = 'To Do'
        else if (issue.statusCategory === 'done') colName = 'Done'
        else colName = 'In Progress'
      }
      return {
        ...issue,
        isStalled: stalledKeys.has(issue.key),
        column: colName || undefined
      }
    })
    const columnNames = columns.map(c => c.name)

    let sprintName = boardData.boardName
    if (boardData.boardType === 'scrum' && boardData.sprint) {
      sprintName = boardData.sprint.name
    }

    return { success: true, boardType: boardData.boardType, sprintName, issues: categorizedIssues, columns: columnNames }
  } catch (error: any) { return { success: false, error: error.message } }
})

resolver.define('getBoardInfo', async ({ context }: any) => {
  try { const projectKey = context.extension.project.key as string; const boardInfo = await detectBoardType(projectKey); return { success: true, ...boardInfo } } catch (error: any) { return { success: false, error: error.message } }
})

resolver.define('getContext', async ({ context }: any) => {
  try {
    const projectKey = context?.extension?.project?.key as string
    if (!projectKey) return { success: false, error: 'No project context' }
    const ctx = await getProjectContext(projectKey)
    return { success: true, context: ctx, summary: getContextSummary(ctx) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

resolver.define('getTimingMetrics', async ({ context }: any) => {
  try {
    console.log('[ENTRY] getTimingMetrics for project:', context?.extension?.project?.key)
    if (PLATFORM === 'local') { return mockTiming() }
    const projectKey = context.extension.project.key as string
    const boardData: BoardData = await fetchBoardData(projectKey, userConfig, context)
    const leadTime: LeadTimeResult = calculateLeadTime(boardData.issues)
    const issueKeys = boardData.issues.map(i => i.key)
    const cycleTime: SectorTimes = await calculateCycleTime(issueKeys, context)
    const sectorTimes = evaluateSectorPerformance(cycleTime)
    const hasUnmapped = Boolean((cycleTime as any)['UNMAPPED'])
    return { success: true, leadTime: { avgLapTime: leadTime.average, bestLap: leadTime.min, worstLap: leadTime.max, completedLaps: leadTime.count, driverTimes: leadTime.byAssignee }, sectorTimes, raceStatus: leadTime.average > 72 ? 'slow' : leadTime.average > 48 ? 'caution' : 'optimal', hasUnmapped }
  } catch (error: any) {
    console.error('Error fetching timing metrics:', error)
    return { success: false, error: error.message }
  }
})

resolver.define('getTrendData', async ({ context }: any) => {
  try {
    if (PLATFORM === 'local') return mockTrends()
    const projectKey = context.extension.project.key as string
    const wipTrend: TrendData = await calculateWipTrend(projectKey)
    const velocityTrend: TrendData = await calculateVelocityTrend(projectKey)
    return { success: true, wip: wipTrend, velocity: velocityTrend }
  } catch (error: any) {
    console.error('Error fetching trend data:', error)
    return { success: false, error: error.message }
  }
})

resolver.define('getTelemetryDiagnostics', async ({ context }: any) => {
  try {
    if (PLATFORM === 'local') return { success: true, diagnostics: { velocitySource: 'mock', velocityWindow: 'mock', fetchStatuses: [] } }
    const projectKey = context.extension.project.key as string
    const boardData: BoardData = await fetchBoardData(projectKey, userConfig, context)
    const statusMap = await getProjectStatusMap(projectKey)
    const telemetry: TelemetryData = await calculateTelemetry(boardData, userConfig, statusMap)
    const fetchStatuses = getFetchStatuses()
    return {
      success: true,
      diagnostics: {
        velocitySource: telemetry.velocitySource,
        velocityWindow: telemetry.velocityWindow,
        cycleTimeWindow: telemetry.cycleTimeWindow,
        throughputWindow: telemetry.throughputWindow,
        fetchStatuses,
        boardType: boardData.boardType,
        sprintName: boardData.sprint?.name || boardData.boardName
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

resolver.define('getDiagnosticsSummary', async ({ context }: any) => {
  try {
    if (PLATFORM === 'local') return { success: true, summary: { telemetry: {}, trends: {}, permissions: {}, fetchStatuses: [] } }
    const projectKey = context.extension.project.key as string

    // Use Guard for permissions
    const guard = new SecurityGuard();
    const status = await guard.validateContext(projectKey);
    const permissions = { userBrowse: status.permissions.userBrowse, appBrowse: status.permissions.appBrowse };

    // Pass security context to avoid re-fetch
    const enhancedContext = { ...context, security: status };
    const boardData: BoardData = await fetchBoardData(projectKey, userConfig, enhancedContext)
    const statusMap = await getProjectStatusMap(projectKey)
    const telemetry: TelemetryData = await calculateTelemetry(boardData, userConfig, statusMap)
    const wipTrend: TrendData = await calculateWipTrend(projectKey)
    const velocityTrend: TrendData = await calculateVelocityTrend(projectKey)

    const fetchStatuses = getFetchStatuses()
    return {
      success: true,
      summary: {
        telemetry,
        trends: { wip: wipTrend, velocity: velocityTrend },
        permissions,
        fetchStatuses,
        context: { boardType: boardData.boardType, sprintName: boardData.sprint?.name || boardData.boardName }
      }
    }
  } catch (error: any) { return { success: false, error: error.message } }
})

// === SAFe Flow Metrics (F1: Race Strategy Analysis) ===
resolver.define('getFlowMetrics', async ({ context }: any) => {
  try {
    console.log('[ENTRY] getFlowMetrics for project:', context?.extension?.project?.key)

    if (PLATFORM === 'local') {
      // Mock data for local development only
      return {
        success: true,
        distribution: {
          features: { count: 8, percentage: 53 },
          defects: { count: 3, percentage: 20 },
          risks: { count: 2, percentage: 13 },
          debt: { count: 2, percentage: 13 },
          other: { count: 0, percentage: 0 },
          total: 15
        },
        velocity: { completed: 12, period: 'Sprint 5', trend: 'up', changePercent: 15 },
        flowTime: { avgHours: 48, medianHours: 36, p85Hours: 72, minHours: 8, maxHours: 120 },
        flowLoad: { total: 6, byCategory: { features: 4, defects: 1, risks: 1, debt: 0, other: 0 }, limit: 10, loadPercent: 60 },
        typeMapping: { Story: 'features', Bug: 'defects', Spike: 'risks', 'Tech Debt': 'debt' },
        detectedTypes: ['Story', 'Bug', 'Spike', 'Tech Debt'],
        f1Theme: FLOW_CATEGORY_F1_NAMES
      }
    }

    const projectKey = context.extension.project.key as string
    const wipLimit = userConfig.wipLimit || 10

    // Fetch board data with graceful error handling
    let boardData: BoardData
    try {
      boardData = await fetchBoardData(projectKey, userConfig, context)
    } catch (fetchError: any) {
      console.warn('[FlowMetrics] Board data fetch failed, returning empty state:', fetchError.message)
      // Return meaningful empty state rather than error
      return {
        success: true,
        isEmpty: true,
        message: 'No board data available. Create a board with issues to see flow metrics.',
        distribution: { features: { count: 0, percentage: 0 }, defects: { count: 0, percentage: 0 }, risks: { count: 0, percentage: 0 }, debt: { count: 0, percentage: 0 }, other: { count: 0, percentage: 0 }, total: 0 },
        velocity: { completed: 0, period: 'No Active Board', trend: 'stable', changePercent: 0 },
        flowTime: { avgHours: 0, medianHours: 0, p85Hours: 0, minHours: 0, maxHours: 0 },
        flowLoad: { total: 0, byCategory: { features: 0, defects: 0, risks: 0, debt: 0, other: 0 }, limit: wipLimit, loadPercent: 0 },
        typeMapping: {},
        detectedTypes: [],
        f1Theme: FLOW_CATEGORY_F1_NAMES
      }
    }

    // Handle empty issues gracefully
    if (!boardData.issues || boardData.issues.length === 0) {
      console.log('[FlowMetrics] No issues in board, returning empty state')
      return {
        success: true,
        isEmpty: true,
        message: 'No issues in the current board. Add issues to see flow metrics.',
        distribution: { features: { count: 0, percentage: 0 }, defects: { count: 0, percentage: 0 }, risks: { count: 0, percentage: 0 }, debt: { count: 0, percentage: 0 }, other: { count: 0, percentage: 0 }, total: 0 },
        velocity: { completed: 0, period: boardData.sprint?.name || boardData.boardName || 'Current Period', trend: 'stable', changePercent: 0 },
        flowTime: { avgHours: 0, medianHours: 0, p85Hours: 0, minHours: 0, maxHours: 0 },
        flowLoad: { total: 0, byCategory: { features: 0, defects: 0, risks: 0, debt: 0, other: 0 }, limit: wipLimit, loadPercent: 0 },
        typeMapping: {},
        detectedTypes: [],
        f1Theme: FLOW_CATEGORY_F1_NAMES
      }
    }

    // Calculate all flow metrics
    // For Kanban/Business, we use the board name as the period
    const periodName = boardData.sprint?.name || boardData.boardName || 'Current Period'

    const flowMetrics = calculateAllFlowMetrics(
      boardData.issues,
      [], // Previous issues - would need separate fetch for trend comparison
      periodName,
      wipLimit
    )

    return {
      success: true,
      isEmpty: false,
      ...flowMetrics,
      f1Theme: FLOW_CATEGORY_F1_NAMES
    }
  } catch (error: any) {
    console.error('Error fetching flow metrics:', error)
    // Return graceful error state, not failure
    return {
      success: true,
      isEmpty: true,
      error: error.message,
      message: `Unable to calculate flow metrics: ${error.message}`,
      distribution: { features: { count: 0, percentage: 0 }, defects: { count: 0, percentage: 0 }, risks: { count: 0, percentage: 0 }, debt: { count: 0, percentage: 0 }, other: { count: 0, percentage: 0 }, total: 0 },
      velocity: { completed: 0, period: 'Unknown', trend: 'stable', changePercent: 0 },
      flowTime: { avgHours: 0, medianHours: 0, p85Hours: 0, minHours: 0, maxHours: 0 },
      flowLoad: { total: 0, byCategory: { features: 0, defects: 0, risks: 0, debt: 0, other: 0 }, limit: 10, loadPercent: 0 },
      typeMapping: {},
      detectedTypes: [],
      f1Theme: FLOW_CATEGORY_F1_NAMES
    }
  }
})

resolver.define('getDevOpsStatus', async ({ context }: any) => {
  try {
    console.log('[ENTRY] getDevOpsStatus for project:', context?.extension?.project?.key)
    if (PLATFORM === 'local') return mockDevOps()
    const projectKey = context.extension.project.key as string
    const devOpsStatus = await checkProjectDevOpsStatus(projectKey, context)
    if (!devOpsStatus.enabled) return { success: true, enabled: false, source: null, noCommitIssues: [] }
    const boardData: BoardData = await fetchBoardData(projectKey, userConfig)
    const noCommitIssues = await detectNoCommitIssues(boardData.issues)
    return { success: true, enabled: true, source: devOpsStatus.source, noCommitIssues }
  } catch (error: any) {
    console.error('Error fetching DevOps status:', error)
    return { success: false, error: error.message }
  }
})

resolver.define('getPermissionsDiagnostics', async ({ context }: any) => {
  try {
    const projectKey = context.extension.project.key as string
    const guard = new SecurityGuard();
    const status = await guard.validateContext(projectKey);

    return {
      success: true,
      permissions: {
        userBrowse: status.permissions.userBrowse,
        appBrowse: status.permissions.appBrowse,
        hasSprintField: status.canReadSprints // Mapped to canReadSprints for now
      },
      messages: status.messages
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

resolver.define('getPermissions', async ({ context }: any) => {
  try {
    const projectKey = context?.extension?.project?.key as string
    const guard = new SecurityGuard();
    const status = await guard.validateContext(projectKey);
    return {
      success: true,
      canRead: status.canReadProject,
      canWrite: status.permissions.userBrowse // Approximation, refined by specific checks if needed
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

resolver.define('getHealth', async ({ context }: any) => {
  try {
    const projectKey = context?.extension?.project?.key as string
    const guard = new SecurityGuard();
    const status = await guard.validateContext(projectKey);

    let boardInfo: any = null
    if (status.canReadProject) {
      try { boardInfo = await detectBoardType(projectKey) } catch (e: any) { boardInfo = { error: e?.message || 'board detection failed' } }
    } else {
      boardInfo = { error: 'Access Denied' }
    }

    const fields = await discoverCustomFields()
    return {
      success: true,
      platform: PLATFORM,
      projectKey,
      boardInfo,
      fields,
      permissions: { userBrowse: status.permissions.userBrowse, appBrowse: status.permissions.appBrowse },
      messages: status.messages
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

resolver.define('getDiagnosticsDetails', async ({ context }: any) => {
  try {
    const projectKey = context?.extension?.project?.key as string
    const guard = new SecurityGuard();
    const status = await guard.validateContext(projectKey);

    let boardInfo: any = null
    if (status.canReadProject) {
      try { boardInfo = await detectBoardType(projectKey) } catch (e: any) { boardInfo = { error: e?.message || 'board detection failed' } }
    } else {
      boardInfo = { error: 'Access Denied: ' + status.messages.join(', ') }
    }

    let filter: any = null
    try {
      if (boardInfo?.boardId && status.permissions.appBrowse) {
        const apiMod = await import('@forge/api')
        const route = apiMod.route
        const cfgResp = await apiMod.default.asApp().requestJira(route`/rest/agile/1.0/board/${boardInfo.boardId}/configuration`, { headers: { Accept: 'application/json' } })
        const cfg = cfgResp.ok ? await cfgResp.json() : null
        const filterId = cfg?.filter?.id
        if (filterId) {
          const filterResp = await apiMod.default.asApp().requestJira(route`/rest/api/3/filter/${filterId}`, { headers: { Accept: 'application/json' } })
          filter = filterResp.ok ? await filterResp.json() : { id: filterId }
        }
      }
    } catch (e: any) { filter = { error: e?.message } }

    const fieldsSnapshot = getFieldCacheSnapshot() || (await discoverCustomFields())

    let sprint: any = null
    try {
      // fetchBoardData is internally guarded now, so it's safe to call.
      const sd = await fetchBoardData(projectKey, userConfig, context);
      sprint = { id: sd.sprint?.id, name: sd.sprint?.name || sd.boardName, state: sd.sprint?.state, boardType: sd.boardType }
    } catch (e: any) { sprint = { error: e?.message } }

    const scopes = getScopes()
    let statuses: any = null
    if (status.canReadProject) {
      try { statuses = await getProjectStatusMap(projectKey) } catch { }
    }
    return { success: true, boardInfo, filter, fields: fieldsSnapshot, sprint, scopes, statuses, permissions: status.permissions }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

resolver.define('getAccessProbe', async ({ context }: any) => {
  try {
    const projectKey = context?.extension?.project?.key as string
    const apiMod = await import('@forge/api')
    const route = apiMod.route
    const results: Array<{ endpoint: string; ok: boolean; status?: number }> = []

    const push = (label: string, resp: any) => {
      if (!resp) { results.push({ endpoint: label, ok: false, status: undefined }); return }
      results.push({ endpoint: label, ok: !!resp.ok, status: resp.status })
    }

    const pUser = await apiMod.default.asUser().requestJira(route`/rest/api/3/project/${projectKey}`, { headers: { Accept: 'application/json' } })
    push('GET project (asUser)', pUser)
    const pApp = await apiMod.default.asApp().requestJira(route`/rest/api/3/project/${projectKey}`, { headers: { Accept: 'application/json' } })
    push('GET project (asApp)', pApp)

    const bUser = await apiMod.default.asUser().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, { headers: { Accept: 'application/json' } })
    push('GET boards (asUser)', bUser)
    const bApp = await apiMod.default.asApp().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, { headers: { Accept: 'application/json' } })
    push('GET boards (asApp)', bApp)

    const body = { jql: `project = "${projectKey}" ORDER BY updated DESC`, maxResults: 1, fields: ['summary'] }
    const sApp = await apiMod.default.asApp().requestJira(route`/rest/api/3/search/jql`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    push('POST search/jql (asApp)', sApp)
    const sUser = await apiMod.default.asUser().requestJira(route`/rest/api/3/search/jql`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    push('POST search/jql (asUser)', sUser)

    return { success: true, results }
  } catch (error: any) { return { success: false, error: error.message } }
})

// ============================================================================
// ADVANCED ANALYTICS - P0 INTELLIGENCE FEATURES
// ============================================================================

resolver.define('getAdvancedAnalytics', async ({ context }: any) => {
  try {
    console.log('[ENTRY] getAdvancedAnalytics for project:', context?.extension?.project?.key)
    const projectKey = context?.extension?.project?.key as string

    // Fetch board data
    const boardData = await fetchBoardData(projectKey, userConfig, context)
    const issues = boardData.issues || []

    // Determine sprint dates
    let sprintStartDate: Date | null = null
    let sprintEndDate: Date | null = null

    if (boardData.sprint?.startDate) sprintStartDate = new Date(boardData.sprint.startDate)
    if (boardData.sprint?.endDate) sprintEndDate = new Date(boardData.sprint.endDate)

    // Get field cache for story points field name
    const fields = await discoverCustomFields()
    const storyPointsField = fields.storyPoints || 'customfield_10040'

    // Calculate advanced analytics
    const analytics = await getAdvancedAnalytics(
      issues,
      projectKey,
      sprintStartDate,
      sprintEndDate,
      {
        historicalVelocity: userConfig.assigneeCapacity * 5 || 20, // Rough estimate
        stalledThresholdHours: userConfig.stalledThresholdHours || 24,
        wipLimitPerPerson: userConfig.assigneeCapacity || 3,
        storyPointsField
      }
    )

    console.log(`[Analytics] Sprint Health: ${analytics.sprintHealth.status} (${analytics.sprintHealth.score}%)`)
    console.log(`[Analytics] Pre-Stall Warnings: ${analytics.preStallWarnings.length}`)
    console.log(`[Analytics] WIP Aging: ${analytics.wipAging.length}`)
    console.log(`[Analytics] Bottleneck: ${analytics.bottleneck?.bottleneckStatus || 'None'}`)

    return {
      success: true,
      boardType: boardData.boardType,
      sprintName: boardData.sprint?.name || boardData.boardName,
      ...analytics
    }
  } catch (error: any) {
    console.error('Error in getAdvancedAnalytics:', error)
    return { success: false, error: error.message }
  }
})

resolver.define('getCycleHints', async ({ context }: any) => {
  try {
    const projectKey = context?.extension?.project?.key as string
    const statusMap = await getProjectStatusMap(projectKey)
    const boardData: BoardData = await fetchBoardData(projectKey, userConfig, context)
    const boardType = boardData.boardType
    const cacheKey = `cycleHints:${projectKey}:${boardData.boardId || 'na'}`
    const cached = cacheGet<any>(cacheKey)
    if (cached) return cached
    const byType: Record<string, { total: number; count: number }> = {}
    const issues = boardData.issues || []
    if (!issues || issues.length === 0) { const res = { success: false, code: 'NO_DATA', message: 'No issues available for hints' }; cacheSet(cacheKey, res, 5 * 60_000); return res }
    for (const issue of issues.slice(0, 50)) {
      const typeName = (issue.fields.issuetype?.name || '').toLowerCase()
      if (!typeName) continue
      const times = await getIssueStatusCategoryTimes(issue.key, context, statusMap)
      const inProg = times.indeterminate || 0
      if (!byType[typeName]) byType[typeName] = { total: 0, count: 0 }
      byType[typeName].total += inProg
      byType[typeName].count += 1
    }
    const hints: Record<string, { avgInProgressHours: number; recommendedMin: number; recommendedMax: number }> = {}
    const [minFactor, maxFactor] = boardType === 'kanban' ? [0.6, 1.0] : [0.8, 1.2]
    const clamp = (h: number) => Math.max(4, Math.min(168, Math.round(h)))
    Object.entries(byType).forEach(([type, agg]) => {
      const avg = agg.count > 0 ? agg.total / agg.count : 0
      const min = clamp(avg * minFactor)
      const max = clamp(avg * maxFactor)
      hints[type] = { avgInProgressHours: Math.round(avg), recommendedMin: min, recommendedMax: max }
    })
    const res = { success: true, boardType, hints }
    cacheSet(cacheKey, res, 10 * 60_000)
    return res
  } catch (error: any) {
    const msg = (error?.message || '').toLowerCase()
    const code = msg.includes('429') || msg.includes('rate') ? 'RATE_LIMITED' : (msg.includes('permission') || msg.includes('401') || msg.includes('403')) ? 'PERMISSION_DENIED' : 'UNKNOWN'
    return { success: false, code, error: error.message || 'Failed to compute cycle hints' }
  }
})

resolver.define('getRovoAnalysis', async ({ payload }: any) => {
  const { issueKey, summary, reason, statusCategory } = payload
  return { analysis: `Driver is stuck in Sector 2 (${statusCategory || 'In Progress'}). Heavy drag detected on "${summary}". \nRoot cause analysis indicates: ${reason || 'Blocking dependency or unclear requirements'}.\nCurrent lap time is degrading. Immediate strategy call required.`, options: [{ id: 'undercut', name: 'The Undercut', description: 'Split ticket into smaller subtasks for faster sector times', icon: 'scissors', action: 'split-ticket' }, { id: 'team-orders', name: 'Team Orders', description: 'Reassign to senior driver with more track experience', icon: 'users', action: 'reassign-ticket' }, { id: 'retire', name: 'Retire Car', description: 'Move to backlog - save engine for next race', icon: 'flag', action: 'defer-ticket' }] }
})

resolver.define('chatWithRovo', async ({ payload, context }: any) => {
  try {
    const { message } = payload
    // We fetch the *REAL* live context data to power our Expert System
    // This ensures the answers are not "mocked" but "calculated" from live Jira state.

    // 1. Fetch Context
    const projectKey = context?.extension?.project?.key
    let data: any = {}
    if (projectKey && PLATFORM !== 'local') {
      const boardData = await fetchBoardData(projectKey, userConfig, context)
      const statusMap = await getProjectStatusMap(projectKey)
      const telemetry = await calculateTelemetry(boardData, userConfig, statusMap)
      const trends = await calculateWipTrend(projectKey)
      const sprintName = boardData.sprint?.name || boardData.boardName
      data = { telemetry, trends, sprintName, issues: boardData.issues, boardType: boardData.boardType }
    } else {
      data = { telemetry: mockTelemetry(), trends: { direction: 'down', change: 12 }, sprintName: 'Local Sprint', issues: [], boardType: 'scrum' }
    }

    const lowerMsg = (message || '').toLowerCase()
    let response = ''
    const isKanban = data.boardType === 'kanban'

    // === ENHANCED: Per-Assignee Workload Analysis ===
    const getAssigneeStats = (issues: any[]) => {
      const stats: Record<string, { total: number; stalled: number; inProgress: number; issues: any[] }> = {}
      for (const issue of issues || []) {
        const assignee = issue.fields?.assignee?.displayName || issue.assignee || 'Unassigned'
        if (!stats[assignee]) stats[assignee] = { total: 0, stalled: 0, inProgress: 0, issues: [] }
        stats[assignee].total++
        stats[assignee].issues.push(issue)
        if (issue.isStalled) stats[assignee].stalled++
        if (issue.statusCategory === 'indeterminate') stats[assignee].inProgress++
      }
      return stats
    }

    const assigneeStats = getAssigneeStats(data.issues)
    const overloadedDrivers = Object.entries(assigneeStats)
      .filter(([_, s]) => s.total > (userConfig.assigneeCapacity || 3) || s.stalled > 0)
      .sort((a, b) => (b[1].stalled + b[1].total) - (a[1].stalled + a[1].total))

    const findAvailableDriver = () => {
      const available = Object.entries(assigneeStats)
        .filter(([name, s]) => name !== 'Unassigned' && s.total < (userConfig.assigneeCapacity || 3) && s.stalled === 0)
        .sort((a, b) => a[1].total - b[1].total)
      return available.length > 0 ? available[0][0] : null
    }

    // 2. Expert System Logic (Rule-Based AI) - ENHANCED
    const getTrendIcon = (v: number) => v > 0 ? '📈' : '📉'
    const getPaceColor = (load: number) => load > 100 ? 'red' : load > 80 ? 'yellow' : 'green'

    // === NEW: Team/Driver Analysis Commands ===
    if (lowerMsg.includes('team') || lowerMsg.includes('driver') || lowerMsg.includes('who') || lowerMsg.includes('assignee')) {
      const driverReports = Object.entries(assigneeStats)
        .filter(([name]) => name !== 'Unassigned')
        .sort((a, b) => b[1].stalled - a[1].stalled)
        .slice(0, 5)
        .map(([name, s]) => {
          const status = s.stalled > 0 ? '🔴' : s.total > (userConfig.assigneeCapacity || 3) ? '🟡' : '🟢'
          const stalledList = s.stalled > 0 ? ` (${s.issues.filter((i: any) => i.isStalled).map((i: any) => i.key).join(', ')})` : ''
          return `${status} **${name}**: ${s.total} tickets, ${s.inProgress} racing, ${s.stalled} stalled${stalledList}`
        })

      const availableDriver = findAvailableDriver()
      const recommendation = overloadedDrivers.length > 0
        ? `\n\n🎯 **Strategy Recommendation**: ${overloadedDrivers[0][0]} has ${overloadedDrivers[0][1].stalled} stalled ticket(s).${availableDriver ? ` Consider **Team Orders** to ${availableDriver}.` : ' No available drivers—consider deferring lower-priority items.'}`
        : '\n\n✅ All drivers operating within capacity.'

      response = `👥 **Driver Telemetry (Team Workload)**\n\n${driverReports.join('\n')}${recommendation}`

    } else if (lowerMsg.includes('stall') || lowerMsg.includes('stuck') || lowerMsg.includes('problem')) {
      // === NEW: Stalled Issues Deep Dive ===
      const stalledIssues = (data.issues || []).filter((i: any) => i.isStalled)
      if (stalledIssues.length === 0) {
        response = `✅ **All Clear**\n\nNo stalled tickets detected. Track is clear, push to the limit!`
      } else {
        const details = stalledIssues.slice(0, 5).map((issue: any) => {
          const assignee = issue.fields?.assignee?.displayName || issue.assignee || 'Unassigned'
          const hoursSinceUpdate = Math.round((Date.now() - new Date(issue.fields?.updated || Date.now()).getTime()) / (1000 * 60 * 60))
          return `🚨 **${issue.key}** - ${issue.summary?.substring(0, 40) || 'No summary'}...\n   └ Driver: ${assignee} | Stalled: ${hoursSinceUpdate}h | Status: ${issue.status || 'Unknown'}`
        })

        const availableDriver = findAvailableDriver()
        const topStalled = stalledIssues[0]
        const actionRec = availableDriver
          ? `**Recommended Action**: Execute **Team Orders** - Reassign ${topStalled?.key} to ${availableDriver}`
          : `**Recommended Action**: Execute **The Undercut** - Split ${topStalled?.key} into smaller tasks`

        response = `🚩 **Stalled Tickets Report**\n\n${details.join('\n\n')}\n\n---\n${actionRec}`
      }

    } else if (lowerMsg.includes('recommend') || lowerMsg.includes('strategy') || lowerMsg.includes('what should') || lowerMsg.includes('help')) {
      // === NEW: Strategic Recommendations ===
      const stalledCount = (data.issues || []).filter((i: any) => i.isStalled).length
      const wipLoad = data.telemetry?.wipLoad || 0
      const recommendations: string[] = []

      if (stalledCount > 0) {
        const topStalled = (data.issues || []).find((i: any) => i.isStalled)
        const availableDriver = findAvailableDriver()
        if (availableDriver) {
          recommendations.push(`🔄 **Team Orders**: Reassign ${topStalled?.key} to ${availableDriver} (has capacity)`)
        }
        recommendations.push(`✂️ **The Undercut**: Split ${topStalled?.key} into smaller, faster subtasks`)
      }

      if (wipLoad > 100) {
        recommendations.push(`⛽ **Fuel Adjustment**: WIP at ${wipLoad}%. Defer lowest-priority items to next sprint.`)
      }

      if (overloadedDrivers.length > 0) {
        const [name, stats] = overloadedDrivers[0]
        recommendations.push(`👥 **Driver Rotation**: ${name} has ${stats.total} tickets. Consider load balancing.`)
      }

      if (recommendations.length === 0) {
        recommendations.push(`✅ **Green Flag**: All systems nominal. Maintain current pace and push for fastest lap!`)
      }

      response = `🏁 **Strategic Recommendations**\n\nBased on current ${data.sprintName} telemetry:\n\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}`

    } else if (lowerMsg.includes('pace') || lowerMsg.includes('velocity')) {
      const trend = data.trends?.change || 0
      const dir = data.trends?.direction || 'flat'
      const driverInsight = overloadedDrivers.length > 0
        ? `\n\n⚠️ **Driver Alert**: ${overloadedDrivers[0][0]} may be affecting pace (${overloadedDrivers[0][1].stalled} stalled).`
        : ''
      response = `🏎️ **Telemetry Report: Pace Analysis**\n\nCurrent Fuel Load (WIP) is **${data.telemetry.wipLoad}%**.\nVelocity is trending **${dir}** (${trend}% vs last sprint).${driverInsight}\n\n*Engineer's Call*: ${data.telemetry.wipLoad > 100 ? 'We are heavy on fuel. Box for a strategy adjustment.' : 'Pace is good. Push for the fastest lap.'}`
    } else if (lowerMsg.includes('cycle') || lowerMsg.includes('lap time')) {
      const cycleTime = data.timing?.cycleTime?.average || data.timing?.leadTime?.avgLapTime || '-'
      response = `⏱️ **Lap Time Analysis (Cycle Time)**\n\nAverage Lap Time: **${cycleTime}h**\nThis measures how long tickets spend in active work.\n\n*${isKanban ? 'Flow Optimization' : 'Sprint'}*: ${cycleTime > 48 ? 'Lap times are too long. Consider breaking down large items.' : 'Lap times are competitive. Maintain current pace.'}`
    } else if (lowerMsg.includes('throughput') || lowerMsg.includes('flow rate')) {
      const throughput = data.trends?.velocity?.total || 0
      response = `📊 **Throughput Report (Flow Rate)**\n\nCompleted this period: **${throughput}** items.\nAverage per day: **${data.trends?.velocity?.averagePerDay || '-'}**\n\n*Strategy*: ${throughput < 5 ? 'Flow is restricted. Check for blockers in the middle sector.' : 'Good flow. Keep the DRS zone open.'}`
    } else if (lowerMsg.includes('wip') || lowerMsg.includes('aging') || lowerMsg.includes('tire deg')) {
      const stalledIssues = data.issues?.filter((i: any) => i.isStalled) || []
      const aging = stalledIssues.length
      response = `🛞 **Tire Degradation Report (WIP Aging)**\n\n**${aging}** items showing signs of degradation (stalled >24h).\n${stalledIssues.slice(0, 3).map((i: any) => `• ${i.key}: ${i.summary?.substring(0, 30)}...`).join('\n')}\n\n*Strategy*: ${aging > 2 ? '⚠️ HIGH WEAR. Recommend immediate pit stop (Split or Reassign).' : '✅ Tires holding. Continue current stint.'}`
    } else if (lowerMsg.includes('traffic') || lowerMsg.includes('bottle') || lowerMsg.includes('block')) {
      const issues = data.issues || []
      const stalledCount = issues.filter((i: any) => i.isStalled).length
      response = `⚠️ **Track Traffic Report**\n\nI see **${issues.length}** cars on track (Tickets in Sprint).\n**${stalledCount}** cars appear to be stalled or high-drag.\n\n*Strategy*: Clear the middle sector. Focus on finishing active laps before starting new ones.`
    } else if (lowerMsg.includes('health') || lowerMsg.includes('crew')) {
      const burnout = data.telemetry.teamBurnout || {}
      const hot = Object.entries(burnout).filter(([_, v]: any) => v > 80).map(([k]) => k)
      response = `🏥 **Pit Crew Status**\n\n${hot.length > 0 ? `🔥 **Critical**: ${hot.join(', ')} are overheating (>80% load).` : '✅ All systems nominal. Crew is fresh.'}\n\n*Rotation*: ${hot.length > 0 ? 'Suggest immediate pit stop for tired engineers.' : 'Maintain current shift pattern.'}`
    } else if (lowerMsg.includes('predict') || lowerMsg.includes('finish')) {
      response = `🔮 **Race Strategy Prediction**\n\nBased on current **${data.sprintName}** telemetry:\nEstimated laps remaining: **${100 - (data.telemetry.completion || 0)}%**.\n\nTo finish P1, we need to maintain current velocity.`
    } else if (lowerMsg.includes('red flag') || lowerMsg.includes('blocked')) {
      const blocked = data.issues?.filter((i: any) => i.labels?.includes('blocked') || i.isStalled) || []
      response = `🚩 **Red Flag Report**\n\n**${blocked.length}** items currently flagged or blocked.\n${blocked.slice(0, 3).map((i: any) => `• ${i.key}: ${i.status}`).join('\n')}\n\n*Action*: Use RED FLAG action to formally flag blockers.`
    } else {
      // Default: Enhanced help with driver summary
      const stalledCount = (data.issues || []).filter((i: any) => i.isStalled).length
      const statusEmoji = stalledCount > 0 ? '🟡' : '🟢'
      const modeHint = isKanban ? 'Lap Times, Flow Rate, Tire Deg' : 'Pace, Traffic, Predictions'
      response = `🎙️ **Radio Check** ${statusEmoji}\n\nReading telemetry for **${data.sprintName}** (${isKanban ? 'KANBAN' : 'SCRUM'} mode).\n\n📊 **Quick Stats**: ${data.issues?.length || 0} tickets | ${stalledCount} stalled | WIP: ${data.telemetry?.wipLoad || 0}%\n\nAsk me about:\n• **"team"** - Driver workload analysis\n• **"stalled"** - Deep dive on stuck tickets\n• **"recommend"** - Strategic action recommendations\n• **"pace"** - Velocity & trends\n• **"crew"** - Team burnout analysis`
    }

    return { success: true, answer: response }
  } catch (error: any) {
    return { success: false, error: `Radio Interference: ${error.message}` }
  }
})

resolver.define('split-ticket', async ({ payload }: any) => { return splitTicket(payload) })
resolver.define('reassign-ticket', async ({ payload }: any) => { return reassignTicket(payload) })
resolver.define('defer-ticket', async ({ payload }: any) => { return deferTicket(payload) })
resolver.define('change-priority', async ({ payload }: any) => { const { changePriority } = await import('./rovoActions'); return changePriority(payload) })
resolver.define('transition-issue', async ({ payload }: any) => { const { transitionIssue } = await import('./rovoActions'); return transitionIssue(payload) })
resolver.define('add-blocker-flag', async ({ payload }: any) => { const { addBlockerFlag } = await import('./rovoActions'); return addBlockerFlag(payload) })
resolver.define('link-issues', async ({ payload }: any) => { const { linkIssues } = await import('./rovoActions'); return linkIssues(payload) })
resolver.define('update-estimate', async ({ payload }: any) => { const { updateEstimate } = await import('./rovoActions'); return updateEstimate(payload) })
resolver.define('add-radio-message', async ({ payload }: any) => { const { addRadioMessage } = await import('./rovoActions'); return addRadioMessage(payload) })
resolver.define('create-subtask', async ({ payload }: any) => { const { createSubtask } = await import('./rovoActions'); return createSubtask(payload) })

resolver.define('getAssignableUsers', async ({ payload, context }: any) => {
  try {
    if (PLATFORM === 'local') {
      return { success: true, users: [{ accountId: 'mock-sarah', displayName: 'Sarah' }, { accountId: 'mock-mike', displayName: 'Mike' }, { accountId: 'mock-jess', displayName: 'Jess' }] }
    }
    const issueKey = payload?.issueKey || ''
    const response = await (await import('@forge/api')).default.asApp().requestJira((await import('@forge/api')).route`/rest/api/3/user/assignable/search?issueKey=${issueKey}&maxResults=50`, { headers: { Accept: 'application/json' } })
    const users = await response.json()
    const mapped = (users || []).map((u: any) => ({ accountId: u.accountId, displayName: u.displayName }))
    return { success: true, users: mapped }
  } catch (error: any) { return { success: false, error: error.message } }
})

function generateFeed(telemetry: TelemetryData, stalledTickets: StalledTicket[], boardType: 'scrum' | 'kanban' | 'business', locale: 'en' | 'fr' | 'es' | 'pt', fetchStatuses?: Array<{ endpoint: string; ok: boolean; status?: number }>) {
  const FEED_I18N: Record<string, Record<string, string>> = {
    en: { raceStartSprint: 'Sprint Race', raceStartEndurance: 'Endurance Race', greenFlagStarted: 'Green Flag. {race} Started.', sectorClear: 'Sector 1 Clear. Good pace.', fuelWarn: 'WARN: Fuel load approaching limit.', wipCritical: 'CRITICAL: WIP limit exceeded! Reduce fuel load.', dragDetected: '{key} High Drag Detected.', stalledBox: '{key} Stalled > {hours}h. BOX BOX!' },
    fr: { raceStartSprint: 'Course Sprint', raceStartEndurance: "Course d'Endurance", greenFlagStarted: 'Drapeau Vert. {race} démarrée.', sectorClear: 'Secteur 1 dégagé. Bon rythme.', fuelWarn: "ALERTE : Charge de carburant proche de la limite.", wipCritical: 'CRITIQUE : Limite WIP dépassée ! Réduire la charge.', dragDetected: '{key} Traînée élevée détectée.', stalledBox: '{key} En panne > {hours}h. BOX BOX !' },
    es: { raceStartSprint: 'Carrera Sprint', raceStartEndurance: 'Carrera de Resistencia', greenFlagStarted: 'Bandera Verde. {race} iniciada.', sectorClear: 'Sector 1 despejado. Buen ritmo.', fuelWarn: 'ADVERTENCIA: Carga de combustible acercándose al límite.', wipCritical: 'CRÍTICO: ¡Límite de WIP excedido! Reducir carga.', dragDetected: '{key} Alta resistencia detectada.', stalledBox: '{key} Atascado > {hours}h. ¡BOX BOX!' },
    pt: { raceStartSprint: 'Corrida Sprint', raceStartEndurance: 'Corrida de Endurance', greenFlagStarted: 'Bandeira Verde. {race} iniciada.', sectorClear: 'Setor 1 livre. Bom ritmo.', fuelWarn: 'AVISO: Carga de combustível se aproximando do limite.', wipCritical: 'CRÍTICO: Limite de WIP excedido! Reduzir carga.', dragDetected: '{key} Alta resistência detectada.', stalledBox: '{key} Parado > {hours}h. BOX BOX!' }
  }
  const dict = FEED_I18N[locale] || FEED_I18N.en
  const feed: Array<{ time: string; msg: string; type: 'info' | 'success' | 'warning' | 'critical' }> = []
  const now = new Date()
  const raceType = boardType === 'kanban' ? dict.raceStartEndurance : dict.raceStartSprint
  feed.push({ time: formatTime(new Date(now.getTime() - 3600000 * 4), locale), msg: dict.greenFlagStarted.replace('{race}', raceType), type: 'info' })
  if (telemetry.velocitySource || telemetry.velocityWindow) {
    const src = telemetry.velocitySource || 'unknown'
    const win = telemetry.velocityWindow || 'unknown'
    feed.push({ time: formatTime(new Date(now.getTime() - 3600000 * 3.5), locale), msg: `Diagnostics: velocitySource=${src}, window=${win}`, type: 'info' })
  }
  if (fetchStatuses && fetchStatuses.length) {
    const recent = fetchStatuses.slice(-3).map(s => `${s.ok ? 'OK' : 'ERR'} ${s.status ?? ''} ${s.endpoint}`).join(' | ')
    feed.push({ time: formatTime(new Date(now.getTime() - 3600000 * 3.25), locale), msg: `Fetch Status: ${recent}`, type: 'info' })
  }
  const wipLoad = telemetry.wipLoad ?? 0
  if (wipLoad < 80) feed.push({ time: formatTime(new Date(now.getTime() - 3600000 * 2), locale), msg: dict.sectorClear, type: 'success' })
  if (wipLoad >= 80 && wipLoad < 100) feed.push({ time: formatTime(new Date(now.getTime() - 3600000), locale), msg: dict.fuelWarn, type: 'warning' })
  if (wipLoad >= 100) feed.push({ time: formatTime(new Date(now.getTime() - 1800000), locale), msg: dict.wipCritical, type: 'critical' })
  stalledTickets.forEach(ticket => {
    feed.push({ time: formatTime(new Date(now.getTime() - 1800000), locale), msg: dict.dragDetected.replace('{key}', ticket.key), type: 'warning' })
    feed.push({ time: formatTime(now, locale), msg: dict.stalledBox.replace('{key}', ticket.key).replace('{hours}', String(ticket.hoursSinceUpdate)), type: 'critical' })
  })
  return feed
}

function formatTime(date: Date, locale: 'en' | 'fr' | 'es' | 'pt') {
  const locMap: Record<string, string> = { en: 'en-US', fr: 'fr-FR', es: 'es-ES', pt: 'pt-PT' }
  return date.toLocaleTimeString(locMap[locale] || 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function getMockData() {
  return { boardType: 'scrum', sprintStatus: 'CRITICAL', sprintName: 'Sprint 42', velocityDelta: -12, wipLoad: 110, wipLimit: 8, wipCurrent: 9, teamBurnout: { sarah: 95, mike: 40, jess: 88 }, issuesByStatus: { todo: 3, inProgress: 5, done: 2 }, feed: [{ time: '09:00', msg: 'Green Flag. Sprint Race Started.', type: 'info' }, { time: '10:30', msg: 'Sector 1 Clear.', type: 'success' }, { time: '13:45', msg: 'WARN: TICKET-422 High Drag Detected.', type: 'warning' }, { time: '14:00', msg: 'CRITICAL: TICKET-422 Stalled > 24h.', type: 'critical' }], stalledTickets: [{ key: 'TICKET-422', summary: 'Implement OAuth2 Backend', assignee: 'Sarah', status: 'In Progress', statusCategory: 'indeterminate', reason: 'API Spec Undefined' }], alertActive: true }
}

export const handler = resolver.getDefinitions()
export const actionHandler = async (event: any) => { const key = event?.actionKey ?? event?.key; const inputs = event?.inputs ?? event?.payload; return handleAction(key, inputs) }
resolver.define('getLocale', async ({ context }: any) => {
  try {
    const supported = ['en', 'fr', 'es', 'pt']
    let preferred: string | null = null
    try {
      const resp = await (await import('@forge/api')).default.asUser().requestJira((await import('@forge/api')).route`/rest/api/3/myself`, { headers: { Accept: 'application/json' } })
      if (resp.ok) { const me = await resp.json(); const loc = (me?.locale || '').toString().toLowerCase(); const code = loc.slice(0, 2); preferred = supported.includes(code) ? code : null }
    } catch { }
    const current = userConfig?.locale && supported.includes(userConfig.locale) ? userConfig.locale : (preferred || 'en')
    return { success: true, locale: current, supported }
  } catch (error: any) { return { success: false, error: error.message } }
})
