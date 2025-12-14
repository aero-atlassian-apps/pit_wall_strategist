import { describe, it, expect, vi } from 'vitest'
import { detectStalledTickets } from '../../src/resolvers/telemetryUtils'

describe('stalled detection per issuetype', () => {
  it('applies per-issuetype thresholds', () => {
    const config: any = { stalledThresholdHours: 24, stalledThresholdHoursByType: { bug: 12, story: 36 }, statusCategories: { inProgress: 'indeterminate', todo: 'new', done: 'done' } }
    const now = new Date().toISOString()
    const mkIssue = (type: string, updatedHoursAgo: number) => ({ key: `K-${type}-${updatedHoursAgo}`, fields: { updated: new Date(Date.now() - updatedHoursAgo * 3600000).toISOString(), issuetype: { name: type }, status: { name: 'In Progress', statusCategory: { key: 'indeterminate' } }, priority: { name: 'High' }, assignee: { displayName: 'Dev' } } })
    const issues = [ mkIssue('Bug', 13), mkIssue('Story', 30), mkIssue('Task', 20) ]
    const stalled = detectStalledTickets(issues as any, config)
    const keys = stalled.map(s => s.key)
    expect(keys).toContain('K-Bug-13')
    expect(keys).not.toContain('K-Story-30')
    expect(keys).not.toContain('K-Task-20')
  })
})

