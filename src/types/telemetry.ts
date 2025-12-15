import type { StatusCategoryKey, JiraIssue } from './jira'

export interface TelemetryConfig {
  wipLimit: number
  assigneeCapacity: number
  stalledThresholdHours: number
  stalledThresholdHoursByType?: Record<string, number>
  storyPointsFieldName: string
  statusCategories: { todo: StatusCategoryKey; inProgress: StatusCategoryKey; done: StatusCategoryKey }
  includeBoardIssuesWhenSprintEmpty?: boolean
  locale?: string
}

export type BoardType = 'scrum' | 'kanban' | 'business'

export interface Sprint {
  id: number
  name: string
  state: string
  startDate?: string
  endDate?: string
  completeDate?: string // Added for closed sprints
  goal?: string
}

export interface BoardContext {
  boardType: BoardType
  boardId: number | null
  boardName: string
  sprint?: Sprint
}

export interface BoardData extends BoardContext {
  issues: JiraIssue[] // Current board issues
  closedSprints?: Sprint[] // Last X closed sprints for velocity
  historicalIssues?: JiraIssue[] // Issues from past sprints or time window for flow metrics
}

// Deprecated: Alias for backward compatibility during refactor, but we should move to BoardData
export type SprintData = BoardData

export interface TelemetryData {
  boardType: BoardType
  // Generic "Health" metric instead of Sprint Status
  healthStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL'
  // Replaces sprintStatus for backward compatibility (calculated from healthStatus)
  sprintStatus?: 'OPTIMAL' | 'WARNING' | 'CRITICAL'

  velocity?: number // Average velocity (Scrum)
  velocityDelta?: number // Only relevant for Scrum
  velocityExplanation?: string // Why is velocity 0 or missing?

  throughput?: number // Items per week/sprint
  throughputExplanation?: string

  cycleTime?: number // Average cycle time in hours
  cycleTimeExplanation?: string

  wipLoad: number
  wipLimit: number
  wipCurrent: number
  wipExplanation?: string
  wipConsistency?: number // New: Stability of WIP (lower is better, or just standard deviation)
  wipConsistencyExplanation?: string

  teamBurnout: Record<string, number>
  issuesByStatus: { todo: number; inProgress: number; done: number }
  completion?: number // Percentage complete (for Scrum/Business)
}

export interface StalledTicket { key: string; summary?: string; assignee: string; status?: string; statusCategory: StatusCategoryKey; hoursSinceUpdate: number; priority?: string; reason?: string }
export interface CategorizedIssue { key: string; summary?: string; status?: string; statusCategory: StatusCategoryKey; assignee: string; updated?: string; priority?: string; isStalled: boolean; column?: string }

export interface TrendPoint { date?: string; dayLabel: string; value: number }
export interface TrendData { data: TrendPoint[]; direction: 'up' | 'down' | 'stable'; change?: number; averagePerDay?: number; total?: number }
export interface LeadTimeByAssignee { [name: string]: { average: number; best?: number; count: number } }
export interface LeadTimeResult { average: number; min: number; max: number; count: number; byAssignee: LeadTimeByAssignee }
export interface SectorTime { name: string; category: StatusCategoryKey; avgHours: number; status: 'optimal' | 'warning' | 'critical' }
export interface SectorTimes { [key: string]: SectorTime }
export interface DevOpsStatus { enabled: boolean; source: string | null; sampleIssue?: string }
export interface DevActivity { available: boolean; commits?: number; pullRequests?: number; branches?: number; lastActivity?: string | null; reason?: string }
