import { describe, it, expect, vi } from 'vitest'
// dynamic import after mocking forge api

describe('board selection', () => {
  it('detectBoardType selects first board when multiple exist', async () => {
    vi.doMock('@forge/api', () => ({
      default: {
        asApp: () => ({ requestJira: async () => ({ ok: true, json: async () => ({ values: [ { id: 11, name: 'A Board', type: 'scrum' }, { id: 22, name: 'B Board', type: 'kanban' } ] }) }) })
      },
      route: (s: TemplateStringsArray, ...v: any[]) => String.raw({ raw: s }, ...v)
    }))
    const utils = await import('../../src/resolvers/telemetryUtils')
    const info = await utils.detectBoardType('TEST')
    expect(info.boardId).toBe(11)
    expect(info.boardName).toBe('A Board')
    expect(info.boardType).toBe('scrum')
  })
})

