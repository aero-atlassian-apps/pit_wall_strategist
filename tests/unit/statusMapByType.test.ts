import { describe, it, expect, vi } from 'vitest'

describe('status map by issuetype', () => {
  it('resolves categories using per-issuetype mapping first', async () => {
    vi.doMock('@forge/api', () => ({
      storage: { get: async () => null, set: async () => {} },
      default: { asApp: () => ({ requestJira: async (path: any) => ({ ok: true, json: async () => ([{ name: 'Bug', statuses: [{ id: '1', name: 'Investigating', statusCategory: { key: 'indeterminate' } }, { id: '3', name: 'Released', statusCategory: { key: 'done' } }] }, { name: 'Story', statuses: [{ id: '2', name: 'Investigating', statusCategory: { key: 'new' } }, { id: '3', name: 'Released', statusCategory: { key: 'done' } }] }]) }) }) },
      route: (s: TemplateStringsArray, ...v: any[]) => String.raw({ raw: s }, ...v)
    }))
    const mod = await import('../../src/resolvers/statusMap')
    const map = await mod.getProjectStatusMap('TEST')
    expect(mod.resolveCategoryForIssue(map, 'Investigating', 'Bug')).toBe('indeterminate')
    expect(mod.resolveCategoryForIssue(map, 'Investigating', 'Story')).toBe('new')
  })
})

