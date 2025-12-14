import { describe, it, expect, vi } from 'vitest'
// dynamic import after mocking forge api

describe('status map', () => {
  it('builds map from project statuses and resolves categories', async () => {
    vi.doMock('@forge/api', () => ({
      storage: { get: async () => null, set: async () => {} },
      default: { asApp: () => ({ requestJira: async (path: any) => ({ ok: true, json: async () => ([{ statuses: [{ id: '1', name: 'Open', statusCategory: { key: 'new' } }, { id: '2', name: 'In Development', statusCategory: { key: 'indeterminate' } }, { id: '3', name: 'Released', statusCategory: { key: 'done' } }] }]) }) }) },
      route: (s: TemplateStringsArray, ...v: any[]) => String.raw({ raw: s }, ...v)
    }))
    const mod = await import('../../src/resolvers/statusMap')
    const map = await mod.getProjectStatusMap('TEST')
    expect(mod.resolveCategoryFromName(map, 'Open')).toBe('new')
    expect(mod.resolveCategoryFromName(map, 'In Development')).toBe('indeterminate')
    expect(mod.resolveCategoryFromName(map, 'Released')).toBe('done')
  })
})
