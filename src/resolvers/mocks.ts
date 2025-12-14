import type { TelemetryData, CategorizedIssue, SectorTimes } from '../types/telemetry'

export function mockTelemetry(): any {
  return {
    boardType: 'scrum',
    sprintStatus: 'CRITICAL',
    sprintName: 'Sprint 42',
    velocityDelta: -12,
    wipLoad: 110,
    wipLimit: 8,
    wipCurrent: 9,
    teamBurnout: { sarah: 95, mike: 40, jess: 88 },
    issuesByStatus: { todo: 3, inProgress: 5, done: 2 },
    feed: [
      { time: '09:00', msg: 'Green Flag. Sprint Race Started.', type: 'info' },
      { time: '10:30', msg: 'Sector 1 Clear.', type: 'success' },
      { time: '13:45', msg: 'WARN: TICKET-422 High Drag Detected.', type: 'warning' },
      { time: '14:00', msg: 'CRITICAL: TICKET-422 Stalled > 24h.', type: 'critical' }
    ],
    stalledTickets: [{ key: 'TICKET-422', summary: 'Implement OAuth2 Backend', assignee: 'Sarah', status: 'In Progress', statusCategory: 'indeterminate', reason: 'API Spec Undefined' }],
    alertActive: true
  }
}

export function mockIssues(): CategorizedIssue[] {
  return [
    { key: 'TICKET-420', summary: 'Setup Auth Flow', status: 'Done', statusCategory: 'done', assignee: 'Mike', updated: '', priority: 'Medium', isStalled: false },
    { key: 'TICKET-421', summary: 'Create User Model', status: 'In Progress', statusCategory: 'indeterminate', assignee: 'Jess', updated: '', priority: 'Medium', isStalled: false },
    { key: 'TICKET-422', summary: 'Implement OAuth2 Backend', status: 'In Progress', statusCategory: 'indeterminate', assignee: 'Sarah', updated: '', priority: 'High', isStalled: true },
    { key: 'TICKET-423', summary: 'Design Dashboard UI', status: 'To Do', statusCategory: 'new', assignee: 'Mike', updated: '', priority: 'Medium', isStalled: false },
    { key: 'TICKET-424', summary: 'Write API Tests', status: 'In Review', statusCategory: 'indeterminate', assignee: 'Sarah', updated: '', priority: 'Medium', isStalled: false }
  ]
}

export function mockTiming() {
  return {
    success: true,
    leadTime: {
      avgLapTime: 56,
      bestLap: 12,
      worstLap: 120,
      completedLaps: 8,
      driverTimes: {
        sarah: { average: 48, best: 12, count: 4 },
        mike: { average: 72, best: 24, count: 3 },
        jess: { average: 36, best: 18, count: 1 }
      }
    },
    sectorTimes: {
      sector1: { name: 'TO DO', avgHours: 18, status: 'optimal', category: 'new' },
      sector2: { name: 'IN PROGRESS', avgHours: 52, status: 'warning', category: 'indeterminate' },
      sector3: { name: 'DONE', avgHours: 4, status: 'optimal', category: 'done' }
    } as SectorTimes,
    raceStatus: 'caution'
  }
}

export function mockTrends() {
  return {
    success: true,
    wip: { data: [{ dayLabel: 'D-6', value: 5 }, { dayLabel: 'D-5', value: 6 }, { dayLabel: 'D-4', value: 4 }, { dayLabel: 'D-3', value: 7 }, { dayLabel: 'D-2', value: 8 }, { dayLabel: 'Yest', value: 9 }, { dayLabel: 'Today', value: 9 }], direction: 'up', change: 80 },
    velocity: { data: [{ dayLabel: 'D-6', value: 2 }, { dayLabel: 'D-5', value: 1 }, { dayLabel: 'D-4', value: 3 }, { dayLabel: 'D-3', value: 2 }, { dayLabel: 'D-2', value: 1 }, { dayLabel: 'Yest', value: 2 }, { dayLabel: 'Today', value: 1 }], averagePerDay: 1.7, total: 12, direction: 'stable' }
  }
}

export function mockDevOps() {
  return { success: true, enabled: true, source: 'github', noCommitIssues: [{ key: 'TICKET-422', reason: 'No commits for 52h' }] }
}

export function mockActionResult(kind: string) {
  const results: Record<string, any> = {
    split: { success: true, message: 'Split into 3 subtasks (mock)', subtasks: ['MOCK-1', 'MOCK-2', 'MOCK-3'] },
    reassign: { success: true, message: 'Reassigned to MOCK user' },
    defer: { success: true, message: 'Moved to backlog (mock)' },
    priority: { success: true, message: 'Priority changed (mock)' },
    transition: { success: true, message: 'Transitioned (mock)' },
    blocker: { success: true, message: 'Flagged as blocked (mock)' },
    link: { success: true, message: 'Issues linked (mock)' },
    estimate: { success: true, message: 'Estimate updated (mock)' },
    radio: { success: true, message: 'Radio message sent (mock)' },
    subtask: { success: true, message: 'Subtask created (mock)', subtaskKey: 'MOCK-SUB-1' }
  }
  return results[kind] || { success: true, message: `Action ${kind} completed (mock)` }
}

