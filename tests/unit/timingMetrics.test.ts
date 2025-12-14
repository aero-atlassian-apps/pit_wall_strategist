import { describe, it, expect } from 'vitest'
import { calculateLeadTime, evaluateSectorPerformance } from '../../src/resolvers/timingMetrics'

describe('timingMetrics', () => {
  it('computes lead time averages', () => {
    const issues: any[] = [
      { key: 'A', fields: { created: new Date(Date.now() - 72 * 3600000).toISOString(), updated: new Date().toISOString(), resolutiondate: new Date().toISOString(), assignee: { displayName: 'Mike' }, status: { statusCategory: { key: 'done' } } } }
    ]
    const res = calculateLeadTime(issues as any)
    expect(res.count).toBe(1)
    expect(res.average).toBeGreaterThan(0)
  })

  it('evaluates sector performance thresholds', () => {
    const sectors: any = { sector1: { name: 'TO DO', category: 'new', avgHours: 30, status: 'optimal' }, sector2: { name: 'IN PROGRESS', category: 'indeterminate', avgHours: 10, status: 'optimal' }, sector3: { name: 'DONE', category: 'done', avgHours: 4, status: 'optimal' } }
    const res = evaluateSectorPerformance(sectors)
    expect(res.sector1.status).toBe('warning')
  })
})
