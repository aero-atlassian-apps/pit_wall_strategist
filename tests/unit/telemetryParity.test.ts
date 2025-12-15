import { describe, it, expect, vi } from 'vitest'
import { IssueCategorizer } from '../../src/resolvers/issue/IssueCategorizer'
import { calculateCycleTime, STATUS_CATEGORIES } from '../../src/resolvers/timingMetrics'

const route = (strings: any, ...values: any[]) => { let s = ''; for (let i = 0; i < strings.length; i++) s += strings[i] + (values[i] ?? ''); return s }
const mkOk = (payload: any) => ({ ok: true, status: 200, json: async () => payload })

describe('telemetry parity and correctness', () => {
  it('WIP trend uses changelog snapshots without synthetic defaults', async () => {
    const issuesPayload = {
      issues: [
        {
          key: 'X-1',
          fields: { created: new Date(Date.now() - 3*24*3600000).toISOString(), updated: new Date().toISOString() },
          changelog: { histories: [
            { created: new Date(Date.now() - 2*24*3600000).toISOString(), items: [{ field: 'status', fromString: 'To Do', toString: 'In Progress' }] },
            { created: new Date(Date.now() - 1*24*3600000).toISOString(), items: [{ field: 'status', fromString: 'In Progress', toString: 'Done' }] }
          ] }
        }
      ]
    }
    const requester = async (url: string, options?: any) => {
      if (url === '/rest/api/3/search/jql') return mkOk(issuesPayload)
      return mkOk({})
    }
    vi.resetModules()
    vi.doMock('@forge/api', () => ({ default: { asApp: () => ({ requestJira: requester }) }, route }))
    const { calculateWipTrend } = await import('../../src/resolvers/trendMetrics')
    const trend = await calculateWipTrend('ABC')
    expect(trend.data.length).toBe(7)
    expect(typeof trend.data[0].value).toBe('number')
  })

  it('Velocity aggregation uses sprint issues per sprint', async () => {
    const sprintIssues = { issues: [ { fields: { status: { statusCategory: { key: 'done' } }, resolutiondate: new Date().toISOString(), customfield_10016: 3 } } ] }
    const requester = async (url: string, options?: any) => {
      if (url.startsWith('/rest/agile/1.0/sprint/')) return mkOk(sprintIssues)
      return mkOk({})
    }
    vi.resetModules()
    vi.doMock('@forge/api', () => ({ default: { asApp: () => ({ requestJira: requester }) }, route }))
    vi.doMock('../../src/resolvers/data/JiraDataService', () => ({ JiraDataService: class { async getSprintIssues(){ return sprintIssues.issues } }}))
    const { MetricCalculator } = await import('../../src/resolvers/metrics/MetricCalculator')
    const calc = new MetricCalculator(new IssueCategorizer(), { statusCategories: { todo: 'new', inProgress: 'indeterminate', done: 'done' }, wipLimit: 8, assigneeCapacity: 3, stalledThresholdHours: 24, storyPointsFieldName: 'Story Points' } as any)
    const res = await (calc as any).calculateVelocity([{ id: 1, name: 'Sprint 1', startDate: new Date(Date.now()-14*24*3600000).toISOString(), endDate: new Date().toISOString(), state: 'closed' }], [], 'customfield_10016', 'scrum')
    expect(res.velocity).toBeGreaterThanOrEqual(1)
    expect(res.source).toBe('agile:sprintIssues')
    expect(res.window).toContain('closed sprints')
  })

  it('Default cycle time returns empty sectors', async () => {
    const sectors = await calculateCycleTime([], {})
    expect(Object.keys(sectors).length).toBe(0)
  })
})
