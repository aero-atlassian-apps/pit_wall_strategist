import { describe, it, expect, vi } from 'vitest'

describe('searchJqlUserOnly uses POST /rest/api/3/search', async () => {
  it('posts correct body and returns issues', async () => {
    const captured: any = { path: null, options: null }
    const route = (strings: any, ...values: any[]) => {
      let s = ''
      for (let i = 0; i < strings.length; i++) s += strings[i] + (values[i] ?? '')
      return s
    }
    const api = {
      asUser: () => ({
        requestJira: async (path: string, options: any) => {
          captured.path = path
          captured.options = options
          return {
            ok: true,
            status: 200,
            json: async () => ({ issues: [{ key: 'ISSUE-1', fields: { summary: 'Test' } }] })
          }
        }
      }),
      asApp: () => ({ requestJira: async () => ({ ok: true, status: 200, json: async () => ({}) }) })
    }
    vi.resetModules()
    vi.doMock('@forge/api', () => ({ default: api as any, route }))
    const { JiraDataService } = await import('../../src/infrastructure/jira/JiraDataService')
    const dataService = new JiraDataService()
    const res = await (dataService as any).searchJqlUserOnly('project = "TO"', ['summary'], 10)
    expect(captured.path).toBe('/rest/api/3/search/jql')
    expect(captured.options?.method).toBe('POST')
    const body = JSON.parse(captured.options?.body || '{}')
    expect(body.jql).toContain('project = "TO"')
    expect(Array.isArray(body.fields)).toBe(true)
    expect(res.ok).toBe(true)
    expect(Array.isArray(res.issues)).toBe(true)
    expect(res.issues.length).toBe(1)
  })
})
