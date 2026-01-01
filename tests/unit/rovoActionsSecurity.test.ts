import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 1. Mock @forge/api
const requestJiraMock = vi.fn();
const asUserMock = vi.fn().mockReturnValue({ requestJira: requestJiraMock });
const asAppMock = vi.fn().mockReturnValue({ requestJira: requestJiraMock });

vi.mock('@forge/api', () => {
  return {
    default: {
      asUser: asUserMock,
      asApp: asAppMock,
    },
    route: (strings: TemplateStringsArray, ...values: any[]) => {
      // Simple tag function to return a string for testing
      return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
    },
  };
});

// Mock dependencies
vi.mock('../../src/resolvers/contextEngine', () => ({
  getProjectContext: vi.fn().mockResolvedValue({
    issueTypes: [{ name: 'Sub-task', subtask: true }]
  })
}));

vi.mock('../../src/infrastructure/services/TelemetryService', () => ({
  TelemetryService: {
    discoverCustomFields: vi.fn().mockResolvedValue({})
  }
}));

describe('rovoActions Security Policy', () => {
  let Actions: any;
  const originalPlatform = process.env.PLATFORM;

  beforeEach(async () => {
    process.env.PLATFORM = 'atlassian';
    vi.clearAllMocks();

    // Default successful responses
    requestJiraMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        key: 'TEST-123',
        fields: {
          project: { key: 'TEST' },
          assignee: { accountId: 'user-1' }
        }
      }),
    });

    Actions = await import('../../src/resolvers/rovoActions');
  });

  afterEach(() => {
    process.env.PLATFORM = originalPlatform;
    vi.resetModules();
  });

  it('splitTicket should use asUser() for write operations', async () => {
    await Actions.splitTicket({ issueKey: 'TEST-1' });

    // EXPECTATION: asUser should be called for permissions
    // CURRENT REALITY: asApp is called (so this test should fail if I enforce asUser)

    // The test fails if asApp is used.
    // However, since I'm trying to PROVE it's broken, I'll assert what SHOULD happen.
    expect(asUserMock).toHaveBeenCalled();
    expect(asAppMock).not.toHaveBeenCalled();
  });

  it('reassignTicket should use asUser()', async () => {
    await Actions.reassignTicket({ issueKey: 'TEST-1', newAssignee: 'user-2' });
    expect(asUserMock).toHaveBeenCalled();
    expect(asAppMock).not.toHaveBeenCalled();
  });
});
