import { describe, it, expect } from 'vitest'
import { mockTelemetry, mockIssues, mockTiming, mockTrends, mockDevOps, mockActionResult } from '../../src/resolvers/mocks'

describe('backend mocks shapes', () => {
  it('mockTelemetry contains feed and stalled', () => {
    const t = mockTelemetry()
    expect(Array.isArray(t.feed)).toBe(true)
    expect(t.stalledTickets?.[0]?.key).toBeDefined()
    expect(typeof t.wipLimit).toBe('number')
  })
  it('mockIssues returns array with isStalled flag', () => {
    const issues = mockIssues()
    expect(Array.isArray(issues)).toBe(true)
    expect(issues.some(i => i.isStalled)).toBe(true)
  })
  it('mockTiming contains leadTime and sectorTimes', () => {
    const m = mockTiming()
    expect(m.success).toBe(true)
    expect(m.leadTime.avgLapTime).toBeGreaterThan(0)
    expect(m.sectorTimes.sector1.name).toBe('TO DO')
  })
  it('mockTrends contains wip and velocity arrays', () => {
    const tr = mockTrends()
    expect(tr.success).toBe(true)
    expect(tr.wip.data.length).toBeGreaterThan(0)
    expect(tr.velocity.data.length).toBeGreaterThan(0)
  })
  it('mockDevOps returns enabled and source', () => {
    const d = mockDevOps()
    expect(d.success).toBe(true)
    expect(d.enabled).toBe(true)
    expect(d.source).toBeDefined()
  })
  it('mockActionResult returns by kind', () => {
    expect(mockActionResult('split').subtasks.length).toBe(3)
    expect(mockActionResult('reassign').message).toContain('Reassigned')
    expect(mockActionResult('defer').message).toContain('backlog')
  })
})
