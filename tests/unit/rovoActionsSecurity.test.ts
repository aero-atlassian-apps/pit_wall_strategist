import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Use a shared object that is not defined via a variable but is accessible
// Vitest hoisting is tricky. Best to define mocks inline.

const { asUserMock, asAppMock, requestJiraMock } = vi.hoisted(() => {
  return {
    asUserMock: vi.fn(),
    asAppMock: vi.fn(),
    requestJiraMock: vi.fn()
  }
})

vi.mock('@forge/api', () => {
  return {
    default: {
      asUser: asUserMock,
      asApp: asAppMock
    },
    route: (strings: any, ...vals: any[]) => ''
  }
})

// Mock contextEngine
vi.mock('../../src/resolvers/contextEngine', () => ({
  getProjectContext: vi.fn().mockResolvedValue({
    issueTypes: [{ name: 'Sub-task', subtask: true, hierarchyLevel: 2 }]
  })
}))

// Mock TelemetryService
vi.mock('../../src/infrastructure/services/TelemetryService', () => ({
  TelemetryService: {
    discoverCustomFields: vi.fn().mockResolvedValue({ sprint: 'customfield_10020' })
  }
}))

import * as Actions from '../../src/resolvers/rovoActions'

describe('rovoActions Security Compliance', () => {
  const originalPlatform = process.env.PLATFORM

  beforeEach(() => {
    process.env.PLATFORM = 'atlassian'
    vi.clearAllMocks()

    // Wire up the chain
    asUserMock.mockReturnValue({ requestJira: requestJiraMock })
    asAppMock.mockReturnValue({ requestJira: requestJiraMock })

    requestJiraMock.mockResolvedValue({
        ok: true,
        json: async () => ({
            key: 'TEST-123',
            fields: {
                project: { key: 'TEST' },
                assignee: { accountId: 'uuid' },
                customfield_10020: 123
            },
            transitions: [
                { id: '11', name: 'Backlog', to: { statusCategory: { key: 'new' } } }
            ]
        })
    })
  })

  afterEach(() => {
    process.env.PLATFORM = originalPlatform
  })

  it('splitTicket should use asUser() and NEVER asApp()', async () => {
    await Actions.splitTicket({ issueKey: 'TEST-1' })
    expect(asUserMock).toHaveBeenCalled()
    expect(asAppMock).not.toHaveBeenCalled()
  })

  it('reassignTicket should use asUser()', async () => {
    await Actions.reassignTicket({ issueKey: 'TEST-1', newAssignee: 'uuid-2' })
    expect(asUserMock).toHaveBeenCalled()
    expect(asAppMock).not.toHaveBeenCalled()
  })

  it('deferTicket should use asUser()', async () => {
    await Actions.deferTicket({ issueKey: 'TEST-1' })
    expect(asUserMock).toHaveBeenCalled()
    expect(asAppMock).not.toHaveBeenCalled()
  })

  it('changePriority should use asUser()', async () => {
    await Actions.changePriority({ issueKey: 'TEST-1', priority: 'High' })
    expect(asUserMock).toHaveBeenCalled()
    expect(asAppMock).not.toHaveBeenCalled()
  })
})
