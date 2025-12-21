import { describe, it, expect, vi } from 'vitest'
// dynamic import after mocking forge api

describe('board selection', () => {
  it('detectBoardType selects first board when multiple exist', async () => {
    const mkOk = (payload: any) => ({ ok: true, json: async () => payload })
    vi.doMock('@forge/api', () => ({
      default: {
        asUser: () => ({
          requestJira: async (path: any) => {
            const p = String(path)
            if (p.includes('/rest/api/3/project/')) return mkOk({ projectTypeKey: 'software' })
            if (p.includes('/rest/agile/1.0/board?projectKeyOrId=')) return mkOk({ values: [{ id: 11, name: 'A Board', type: 'scrum' }, { id: 22, name: 'B Board', type: 'kanban' }] })
            return { ok: false, status: 404 }
          }
        }),
        asApp: () => ({ requestJira: async () => ({ ok: true, json: async () => ({ values: [{ id: 11, name: 'A Board', type: 'scrum' }, { id: 22, name: 'B Board', type: 'kanban' }] }) }) })
      },
      route: (s: TemplateStringsArray, ...v: any[]) => String.raw({ raw: s }, ...v)
    }))
    const mod = await import('../../src/infrastructure/jira/JiraBoardRepository')
    const boardRepo = new mod.JiraBoardRepository()
    const info = await boardRepo.detectBoardType('TEST')
    expect(info.boardId).toBe(11)
    expect(info.boardName).toBe('A Board')
    expect(info.boardType).toBe('scrum')
  })
})

