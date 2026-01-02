import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist mocks
const mocks = vi.hoisted(() => ({
  requestJira: vi.fn(),
  asApp: vi.fn(),
  asUser: vi.fn(),
  discoverCustomFields: vi.fn().mockResolvedValue({}),
  getProjectContext: vi.fn().mockResolvedValue({
    issueTypes: [{ name: 'Sub-task', subtask: true }]
  })
}));

// Mock Forge API
vi.mock('@forge/api', async () => {
  return {
    default: {
      asApp: mocks.asApp.mockReturnValue({ requestJira: mocks.requestJira }),
      asUser: mocks.asUser.mockReturnValue({ requestJira: mocks.requestJira }),
    },
    route: (strings: any, ...values: any) => strings[0]
  };
});

// Mock dependencies
vi.mock('../../src/infrastructure/services/TelemetryService', () => ({
  TelemetryService: {
    discoverCustomFields: mocks.discoverCustomFields
  }
}));

vi.mock('../../src/resolvers/contextEngine', () => ({
  getProjectContext: mocks.getProjectContext
}));

// Import after mocking
import { splitTicket, reassignTicket, deferTicket } from '../../src/resolvers/rovoActions';

describe('Rovo Actions Security', () => {
  const originalPlatform = process.env.PLATFORM;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLATFORM = 'atlassian'; // Ensure we are not in local mode

    // Default success response
    mocks.requestJira.mockResolvedValue({
      ok: true,
      json: async () => ({
        fields: { project: { key: 'TEST' }, assignee: { accountId: 'user123' }, labels: [] },
        transitions: [{ id: '1', name: 'Backlog', to: { statusCategory: { key: 'new' } } }],
        key: 'TEST-123'
      })
    });

    // Re-setup the mock returns (cleared by clearAllMocks)
    mocks.asApp.mockReturnValue({ requestJira: mocks.requestJira });
    mocks.asUser.mockReturnValue({ requestJira: mocks.requestJira });
  });

  afterEach(() => {
    process.env.PLATFORM = originalPlatform;
  });

  it('splitTicket should use asUser() for write operations', async () => {
    await splitTicket({ issueKey: 'TEST-1' });

    expect(mocks.asUser).toHaveBeenCalled();
    expect(mocks.asApp).not.toHaveBeenCalled();
  });

  it('reassignTicket should use asUser() for write operations', async () => {
    await reassignTicket({ issueKey: 'TEST-1', newAssignee: 'user2' });

    expect(mocks.asUser).toHaveBeenCalled();
    expect(mocks.asApp).not.toHaveBeenCalled();
  });

  it('deferTicket should use asUser() for write operations', async () => {
    await deferTicket({ issueKey: 'TEST-1' });

    expect(mocks.asUser).toHaveBeenCalled();
    expect(mocks.asApp).not.toHaveBeenCalled();
  });
});
