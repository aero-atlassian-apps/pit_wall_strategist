import { describe, it, expect, vi } from 'vitest'

describe('fetchSprintData fallbacks', () => {
  it('uses JQL fallback when no active sprint', async () => {
    vi.doMock('@forge/api', () => {
      const json = (x: any) => ({ ok: true, json: async () => x })
      const notOk = (status = 404, body = '') => ({ ok: false, status, text: async () => body })
      return {
        default: {
          asApp: () => ({
            requestJira: async (path: any) => {
              const p = String(path)
              if (p.includes('/rest/agile/1.0/board?projectKeyOrId=')) return json({ values: [{ id: 1, name: 'Board', type: 'scrum' }] })
              if (p.includes('/rest/agile/1.0/board/1/sprint?state=active')) return json({ values: [] })
              if (p.includes('/rest/agile/1.0/board/1/sprint?state=future')) return json({ values: [{ id: 99, name: 'Sprint 99', state: 'future' }] })
              if (p.includes('/configuration')) return json({ filter: { id: 123 } })
              if (p.includes('/rest/api/3/search?jql=')) return notOk(400, 'bad request')
              return notOk(404)
            }
          }),
          asUser: () => ({
            requestJira: async (path: any, opts: any) => {
              const p = String(path)
              if (p.includes('/rest/api/3/search/jql') && opts?.method === 'POST') {
                return { ok: true, json: async () => ({ issues: [{ key: 'T-1', fields: { status: { statusCategory: { key: 'new' } }, summary: 'X' } }] }) }
              }
              return notOk(404)
            }
          })
        },
        route: (s: TemplateStringsArray, ...v: any[]) => String.raw({ raw: s }, ...v)
      }
    })

    const telemetry = await import('../../src/resolvers/telemetryUtils')
    vi.spyOn(telemetry, 'detectBoardType').mockResolvedValue({ type: 'scrum', boardId: 1, boardName: 'Board' } as any)

    const data = await telemetry.fetchSprintData('TEST')
    expect(data.boardType).toBe('scrum')
    expect((data.issues || []).length).toBeGreaterThan(0)
    expect(String(data.sprintName)).toContain('Sprint')
  })
})

