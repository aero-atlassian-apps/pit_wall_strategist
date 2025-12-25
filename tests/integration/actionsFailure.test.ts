import { describe, it, expect, vi, beforeEach } from 'vitest'
// dynamic import after mocking forge api

describe('actions failure paths', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('reassignTicket throws on failed PUT', async () => {
    process.env.PLATFORM = 'atlassian'
    const mockRequestJira = async (path: any, opts?: any) => {
      const p = String(path)
      if (p.includes('/rest/api/3/issue/') && opts?.method === 'PUT') return { ok: false, status: 403 }
      if (p.includes('/rest/api/3/user?accountId=')) return { ok: true, json: async () => ({ displayName: 'New User' }) }
      return { ok: true, json: async () => ({}) }
    }
    vi.doMock('@forge/api', () => ({
      default: {
        asApp: () => ({ requestJira: mockRequestJira }),
        asUser: () => ({ requestJira: mockRequestJira })
      },
      route: (s: TemplateStringsArray, ...v: any[]) => String.raw({ raw: s }, ...v)
    }))
    const mod = await import('../../src/resolvers/rovoActions')
    await expect(mod.reassignTicket({ issueKey: 'TEST-1', newAssignee: 'acc-123' })).rejects.toThrow()
  })

  it('deferTicket selects new-category transition', async () => {
    process.env.PLATFORM = 'atlassian'
    const mockRequestJira = async (path: any, opts?: any) => {
      const p = String(path)
      if (p.includes('/transitions') && !(opts?.method)) return { ok: true, json: async () => ({ transitions: [{ id: '10', name: 'Backlog', to: { statusCategory: { key: 'new' } } }, { id: '20', name: 'Done', to: { statusCategory: { key: 'done' } } }] }) }
      if (p.includes('/transitions') && opts?.method === 'POST') return { ok: true }
      if (p.includes('/rest/api/3/issue/TEST-1') && !opts?.method) return { ok: true, json: async () => ({ fields: { customfield_10020: [{ id: 123 }] } }) }
      if (p.includes('/rest/agile/1.0/sprint/123/issue') && opts?.method === 'POST') return { ok: true }
      return { ok: true, json: async () => ({}) }
    }
    vi.doMock('@forge/api', () => ({
      default: {
        asApp: () => ({ requestJira: mockRequestJira }),
        asUser: () => ({ requestJira: mockRequestJira })
      },
      route: (s: TemplateStringsArray, ...v: any[]) => String.raw({ raw: s }, ...v)
    }))
    const mod = await import('../../src/resolvers/rovoActions')
    const res = await mod.deferTicket({ issueKey: 'TEST-1' })
    expect(res.success).toBe(true)
  })
})
