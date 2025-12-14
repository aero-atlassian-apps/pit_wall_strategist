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

export interface TelemetryData {
  boardType: 'scrum' | 'kanban' | 'business'
  sprintStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL'
  velocityDelta: number
  wipLoad: number
  wipLimit: number
  wipCurrent: number
  teamBurnout: Record<string, number>
  issuesByStatus: { todo: number; inProgress: number; done: number }
}

export interface StalledTicket { key: string; summary?: string; assignee: string; status?: string; statusCategory: StatusCategoryKey; hoursSinceUpdate: number; priority?: string; reason?: string }
export interface CategorizedIssue { key: string; summary?: string; status?: string; statusCategory: StatusCategoryKey; assignee: string; updated?: string; priority?: string; isStalled: boolean; column?: string }
export interface SprintData { boardType: 'scrum' | 'kanban' | 'business'; sprintId: number | null; sprintName: string; sprintState?: string | null; issues: JiraIssue[] }
export interface TrendPoint { date?: string; dayLabel: string; value: number }
export interface TrendData { data: TrendPoint[]; direction: 'up' | 'down' | 'stable'; change?: number; averagePerDay?: number; total?: number }
export interface LeadTimeByAssignee { [name: string]: { average: number; best?: number; count: number } }
export interface LeadTimeResult { average: number; min: number; max: number; count: number; byAssignee: LeadTimeByAssignee }
export interface SectorTime { name: string; category: StatusCategoryKey; avgHours: number; status: 'optimal' | 'warning' | 'critical' }
export interface SectorTimes { [key: string]: SectorTime }
export interface DevOpsStatus { enabled: boolean; source: string | null; sampleIssue?: string }
export interface DevActivity { available: boolean; commits?: number; pullRequests?: number; branches?: number; lastActivity?: string | null; reason?: string }
