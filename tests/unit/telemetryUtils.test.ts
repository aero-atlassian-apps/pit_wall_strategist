import { describe, it, expect, vi } from 'vitest'
import { LegacyTelemetryAdapter, DEFAULT_CONFIG } from '../../src/infrastructure/services/LegacyTelemetryAdapter'

const detectStalledTickets = LegacyTelemetryAdapter.detectStalledTickets.bind(LegacyTelemetryAdapter)
const calculateTelemetry = LegacyTelemetryAdapter.calculateTelemetry.bind(LegacyTelemetryAdapter)
import { mockIssues, mockTelemetry } from '../../src/resolvers/mocks'

const mkIssue = (overrides: any = {}) => ({ key: 'ISSUE-1', fields: { summary: 'Implement API', assignee: { displayName: 'Sarah' }, updated: new Date(Date.now() - 25 * 3600000).toISOString(), priority: { name: 'High' }, status: { name: 'In Progress', statusCategory: { key: 'indeterminate' } }, ...overrides } })

describe('telemetryUtils', () => {
  it('detects stalled tickets over threshold in progress and high priority', () => {
    const issues = [mkIssue(), mkIssue({ updated: new Date(Date.now() - 5 * 3600000).toISOString() })]
    const stalled = detectStalledTickets(issues as any, DEFAULT_CONFIG)
    expect(stalled.length).toBe(1)
    expect(stalled[0].key).toBe('ISSUE-1')
  })

  it('calculates telemetry with status categories', async () => {
    const sprintData: any = { boardType: 'scrum', sprintName: 'Sprint', issues: [mkIssue(), mkIssue({ status: { statusCategory: { key: 'new' } } }), mkIssue({ status: { statusCategory: { key: 'done' } } })] }
    const telemetry = await calculateTelemetry(sprintData, DEFAULT_CONFIG)
    expect(telemetry.wipCurrent).toBe(1)
    expect(telemetry.issuesByStatus?.inProgress).toBe(1)
    expect(['OPTIMAL', 'WARNING', 'CRITICAL']).toContain(telemetry.sprintStatus)
  })

  it('mock helpers return consistent shapes', () => {
    const issues = mockIssues()
    expect(Array.isArray(issues)).toBe(true)
    const telem = mockTelemetry()
    expect(telem.feed?.length).toBeGreaterThan(0)
  })

  it('falls back to board issues when sprint has none', async () => {
    const origDefaultConfig = { ...DEFAULT_CONFIG }
    const route = (strings: any, ...values: any[]) => { let s = ''; for (let i = 0; i < strings.length; i++) s += strings[i] + (values[i] ?? ''); return s }
    const mkOk = (payload: any) => ({ ok: true, status: 200, json: async () => payload })
    const mkErr = (status = 403) => ({ ok: false, status, json: async () => ({}) })
    const responses: Record<string, any> = {
      '/rest/api/3/project/TO': mkOk({ projectTypeKey: 'software' }),
      '/rest/agile/1.0/board?projectKeyOrId=TO': mkOk({ values: [{ id: 34, name: 'TO board', type: 'scrum' }] }),
      '/rest/agile/1.0/board/34/sprint?state=active': mkOk({ values: [{ id: 888, name: 'Sprint 1', state: 'active' }] }),
      '/rest/agile/1.0/sprint/888/issue?maxResults=100': mkOk({ issues: [] }),
      '/rest/agile/1.0/board/34/configuration': mkOk({ filter: { id: 123 } }),
      '/rest/api/3/search?jql=filter%20%3D%20123&maxResults=100&fields=summary,status,assignee,priority,issuetype,updated,created,labels': mkOk({ issues: [mkIssue()] })
    }
    const requester = async (url: string, options?: any) => {
      // Handle POST requests (JQL search)
      if (options?.method === 'POST' && url === '/rest/api/3/search/jql') return mkOk({ issues: [mkIssue()] })
      // Handle mypermissions for SecurityGuard
      if (url.includes('/rest/api/3/mypermissions')) return mkOk({ permissions: { BROWSE_PROJECTS: { havePermission: true } } })
      return responses[url] || mkErr(404)
    }
    const api = { asApp: () => ({ requestJira: requester }), asUser: () => ({ requestJira: requester }) }
    vi.resetModules()
    vi.doMock('@forge/api', () => ({ default: api, route }))
    const { JiraBoardRepository } = await import('../../src/infrastructure/jira/JiraBoardRepository')
    const boardRepo = new JiraBoardRepository()
    const data: any = await boardRepo.getBoardData('TO', { ...origDefaultConfig, includeBoardIssuesWhenSprintEmpty: true })
    expect(data.boardType).toBe('scrum')
    expect(data.sprint?.id).toBe(888)
    expect(Array.isArray(data.issues)).toBe(true)
    expect(data.issues.length).toBeGreaterThan(0)
  })

  it('falls back to project issues when sprint and board fallbacks fail', async () => {
    const origDefaultConfig = { ...DEFAULT_CONFIG }
    const route = (strings: any, ...values: any[]) => { let s = ''; for (let i = 0; i < strings.length; i++) s += strings[i] + (values[i] ?? ''); return s }
    const mkOk = (payload: any) => ({ ok: true, status: 200, json: async () => payload })
    const mkErr = (status = 401) => ({ ok: false, status, json: async () => ({}) })
    const responses: Record<string, any> = {
      '/rest/api/3/project/TO': mkOk({ projectTypeKey: 'software' }),
      '/rest/agile/1.0/board?projectKeyOrId=TO': mkOk({ values: [{ id: 34, name: 'TO board', type: 'scrum' }] }),
      '/rest/agile/1.0/board/34/sprint?state=active': mkOk({ values: [{ id: 777, name: 'Sprint X', state: 'active' }] }),
      '/rest/agile/1.0/sprint/777/issue?maxResults=100': mkOk({ issues: [] }),
      '/rest/api/3/search?jql=sprint%20%3D%20777&maxResults=100&fields=summary,status,assignee,priority,issuetype,updated,created,labels': mkOk({ issues: [] }),
      '/rest/agile/1.0/board/34/configuration': mkOk({ filter: { id: 999 } }),
      '/rest/api/3/search?jql=filter%20%3D%20999&maxResults=100&fields=summary,status,assignee,priority,issuetype,updated,created,labels': mkOk({ issues: [] }),
      '/rest/agile/1.0/board/34/issue?maxResults=100': mkOk({ issues: [] }),
      '/rest/api/3/search?jql=project%20%3D%20%22TO%22%20ORDER%20BY%20updated%20DESC&maxResults=100&fields=summary,status,assignee,priority,issuetype,updated,created,labels': mkOk({ issues: [mkIssue()] })
    }
    const requester2 = async (url: string, options?: any) => {
      // Handle POST requests (JQL search)
      if (options?.method === 'POST' && url === '/rest/api/3/search/jql') return mkOk({ issues: [mkIssue()] })
      // Handle mypermissions for SecurityGuard 
      if (url.includes('/rest/api/3/mypermissions')) return mkOk({ permissions: { BROWSE_PROJECTS: { havePermission: true } } })
      return responses[url] || mkErr(404)
    }
    const api = { asApp: () => ({ requestJira: requester2 }), asUser: () => ({ requestJira: requester2 }) }
    vi.resetModules()
    vi.doMock('@forge/api', () => ({ default: api, route }))
    const { JiraBoardRepository } = await import('../../src/infrastructure/jira/JiraBoardRepository')
    const boardRepo2 = new JiraBoardRepository()
    const data: any = await boardRepo2.getBoardData('TO', { ...origDefaultConfig, includeBoardIssuesWhenSprintEmpty: true })
    expect(data.boardType).toBe('scrum')
    expect(data.sprint?.id).toBe(777)
    expect(Array.isArray(data.issues)).toBe(true)
    expect(data.issues.length).toBeGreaterThan(0)
  })
})
