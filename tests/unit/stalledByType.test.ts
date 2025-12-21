import { describe, it, expect, vi } from 'vitest'
import { LegacyTelemetryAdapter } from '../../src/infrastructure/services/LegacyTelemetryAdapter'

describe('stalled detection per issuetype', () => {
  it('applies per-issuetype thresholds', () => {
    const config: any = { stalledThresholdHours: 24, stalledThresholdHoursByType: { bug: 12, story: 36 }, statusCategories: { inProgress: 'indeterminate', todo: 'new', done: 'done' } }
    const now = new Date().toISOString()
    const mkIssue = (type: string, updatedHoursAgo: number) => ({ key: `K-${type}-${updatedHoursAgo}`, fields: { updated: new Date(Date.now() - updatedHoursAgo * 3600000).toISOString(), issuetype: { name: type }, status: { name: 'In Progress', statusCategory: { key: 'indeterminate' } }, priority: { name: 'High' }, assignee: { displayName: 'Dev' } } })
    const issues = [mkIssue('Bug', 13), mkIssue('Story', 30), mkIssue('Task', 20)]
    const stalled = LegacyTelemetryAdapter.detectStalledTickets(issues as any, config)
    const keys = stalled.map(s => s.key)
    // Bug: 13h > 12h threshold = stalled
    expect(keys).toContain('K-Bug-13')
    // Story: 30h < 36h threshold = NOT stalled
    expect(keys).not.toContain('K-Story-30')
    // Task: 20h < 24h default threshold = NOT stalled
    expect(keys).not.toContain('K-Task-20')
  })
})

