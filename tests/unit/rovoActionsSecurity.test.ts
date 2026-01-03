import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist mocks to ensure they are available before imports
const requestJiraMock = vi.hoisted(() => vi.fn());
const asAppMock = vi.hoisted(() => vi.fn(() => ({ requestJira: requestJiraMock })));
const asUserMock = vi.hoisted(() => vi.fn(() => ({ requestJira: requestJiraMock })));

vi.mock('@forge/api', async () => {
  const actual = await vi.importActual('@forge/api');
  return {
    ...actual,
    default: {
      asApp: asAppMock,
      asUser: asUserMock,
    },
    route: (strings: any, ...values: any) => strings[0] // Simple mock for route template tag
  };
});

// Mock dependencies
vi.mock('../../src/infrastructure/services/TelemetryService', () => ({
  TelemetryService: {
    discoverCustomFields: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('../../src/resolvers/contextEngine', () => ({
  getProjectContext: vi.fn().mockResolvedValue({
    issueTypes: [{ name: 'Sub-task', subtask: true }]
  })
}));

// Import after mocking
import { splitTicket, reassignTicket, deferTicket } from '../../src/resolvers/rovoActions';

describe('Rovo Actions Security', () => {
  const originalPlatform = process.env.PLATFORM;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLATFORM = 'atlassian'; // Ensure we are not in local mode

    // Default success response
    requestJiraMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        fields: { project: { key: 'TEST' }, assignee: { accountId: 'user123' }, labels: [] },
        transitions: [{ id: '1', name: 'Backlog', to: { statusCategory: { key: 'new' } } }],
        key: 'TEST-123'
      })
    });
  });

  afterEach(() => {
    process.env.PLATFORM = originalPlatform;
  });

  it('splitTicket should use asUser() for write operations', async () => {
    await splitTicket({ issueKey: 'TEST-1' });

    expect(asUserMock).toHaveBeenCalled();
    expect(asAppMock).not.toHaveBeenCalled();
  });

  it('reassignTicket should use asUser() for write operations', async () => {
    await reassignTicket({ issueKey: 'TEST-1', newAssignee: 'user2' });

    expect(asUserMock).toHaveBeenCalled();
    expect(asAppMock).not.toHaveBeenCalled();
  });

  it('deferTicket should use asUser() for write operations', async () => {
    await deferTicket({ issueKey: 'TEST-1' });

    expect(asUserMock).toHaveBeenCalled();
    expect(asAppMock).not.toHaveBeenCalled();
  });
});
