import { describe, it, expect, beforeAll, vi } from 'vitest'

vi.mock('@forge/api', () => {
  const api = { asUser: () => ({ requestJira: async () => ({ ok: true, json: async () => ({}) }) }) }
  const route = (_strings: any, ..._vals: any[]) => ''
  return { default: api, route }
})

let Actions: any

describe('rovoActions in local mode', () => {
  beforeAll(async () => { process.env.PLATFORM = 'local'; Actions = await import('../../src/resolvers/rovoActions') })

  it('splitTicket returns mock subtasks without Jira calls', async () => {
    const res = await Actions.splitTicket({ issueKey: 'MOCK-1' })
    expect(res.success).toBe(true)
    expect(res.subtasks.length).toBe(3)
  })

  it('reassignTicket returns mock message', async () => {
    const res = await Actions.reassignTicket({ issueKey: 'MOCK-2', newAssignee: '123' })
    expect(res.success).toBe(true)
    expect(res.message).toContain('Reassigned')
  })

  it('deferTicket returns mock message', async () => {
    const res = await Actions.deferTicket({ issueKey: 'MOCK-3' })
    expect(res.success).toBe(true)
    expect(res.message).toContain('backlog')
  })
})
