import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Define mocks
const mockAsUser = {
  requestJira: vi.fn(),
};

const mockAsApp = {
  requestJira: vi.fn(),
};

// Mock @forge/api
vi.mock('@forge/api', () => {
  return {
    default: {
      asUser: () => mockAsUser,
      asApp: () => {
        // Track calls to asApp, but we also want it to throw or be inspectable
        return mockAsApp;
      },
    },
    route: (strings: TemplateStringsArray, ...values: any[]) => {
      return strings.reduce((result, str, i) => result + str + (values[i] || ''), '');
    },
  };
});

// Mock TelemetryService because it is used in rovoActions
vi.mock('../../src/infrastructure/services/TelemetryService', () => ({
  TelemetryService: {
    discoverCustomFields: vi.fn().mockResolvedValue({}),
  },
}));

// Mock contextEngine because it uses api.asApp() internally (which is allowed for context fetching,
// but we need to mock it so it doesn't crash during our test of rovoActions).
// We'll return a mock context.
vi.mock('../../src/resolvers/contextEngine', () => ({
  getProjectContext: vi.fn().mockResolvedValue({
    projectKey: 'TEST',
    issueTypes: [{ name: 'Sub-task', subtask: true }],
  }),
}));

describe('rovoActions Security Compliance', () => {
  let Actions: any;
  const originalPlatform = process.env.PLATFORM;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.PLATFORM = 'atlassian'; // Ensure we are NOT in local mode

    // Reset mocks default implementations
    mockAsUser.requestJira.mockResolvedValue({
        ok: true,
        json: async () => ({ key: 'TEST-123', transitions: [], fields: { project: { key: 'TEST' }, assignee: null, labels: [] } }),
    });

    mockAsApp.requestJira.mockImplementation(() => {
        throw new Error('SECURITY VIOLATION: asApp() usage detected in write operation');
    });

    // Re-import module to apply env var change
    vi.resetModules();
    Actions = await import('../../src/resolvers/rovoActions');
  });

  afterEach(() => {
    process.env.PLATFORM = originalPlatform;
  });

  it('splitTicket should use asUser() and NOT asApp()', async () => {
    // We expect this to fail if the code uses asApp() because mockAsApp throws
    try {
        await Actions.splitTicket({ issueKey: 'TEST-1' });
    } catch (e: any) {
        expect(e.message).not.toContain('SECURITY VIOLATION');
    }

    expect(mockAsUser.requestJira).toHaveBeenCalled();
  });

  it('reassignTicket should use asUser() and NOT asApp()', async () => {
     try {
        await Actions.reassignTicket({ issueKey: 'TEST-1', newAssignee: 'user-123' });
    } catch (e: any) {
        expect(e.message).not.toContain('SECURITY VIOLATION');
    }
    expect(mockAsUser.requestJira).toHaveBeenCalled();
  });

  it('deferTicket should use asUser() and NOT asApp()', async () => {
     try {
        await Actions.deferTicket({ issueKey: 'TEST-1' });
    } catch (e: any) {
         expect(e.message).not.toContain('SECURITY VIOLATION');
    }
    expect(mockAsUser.requestJira).toHaveBeenCalled();
  });

  it('changePriority should use asUser() and NOT asApp()', async () => {
      try {
        await Actions.changePriority({ issueKey: 'TEST-1', priority: 'High' });
      } catch (e: any) {
         expect(e.message).not.toContain('SECURITY VIOLATION');
      }
      expect(mockAsUser.requestJira).toHaveBeenCalled();
  });

  it('transitionIssue should use asUser() and NOT asApp()', async () => {
      try {
        await Actions.transitionIssue({ issueKey: 'TEST-1', transitionName: 'Done' });
      } catch (e: any) {
         expect(e.message).not.toContain('SECURITY VIOLATION');
      }
      expect(mockAsUser.requestJira).toHaveBeenCalled();
  });

  it('addBlockerFlag should use asUser() and NOT asApp()', async () => {
      try {
        await Actions.addBlockerFlag({ issueKey: 'TEST-1', reason: 'Blocked' });
      } catch (e: any) {
         expect(e.message).not.toContain('SECURITY VIOLATION');
      }
      expect(mockAsUser.requestJira).toHaveBeenCalled();
  });

  it('linkIssues should use asUser() and NOT asApp()', async () => {
      try {
        await Actions.linkIssues({ issueKey: 'TEST-1', linkedIssueKey: 'TEST-2' });
      } catch (e: any) {
         expect(e.message).not.toContain('SECURITY VIOLATION');
      }
      expect(mockAsUser.requestJira).toHaveBeenCalled();
  });

  it('updateEstimate should use asUser() and NOT asApp()', async () => {
      try {
        await Actions.updateEstimate({ issueKey: 'TEST-1', storyPoints: 5 });
      } catch (e: any) {
         expect(e.message).not.toContain('SECURITY VIOLATION');
      }
      expect(mockAsUser.requestJira).toHaveBeenCalled();
  });

  it('addRadioMessage should use asUser() and NOT asApp()', async () => {
      try {
        await Actions.addRadioMessage({ issueKey: 'TEST-1', message: 'Hello' });
      } catch (e: any) {
         expect(e.message).not.toContain('SECURITY VIOLATION');
      }
      expect(mockAsUser.requestJira).toHaveBeenCalled();
  });

  it('createSubtask should use asUser() and NOT asApp()', async () => {
      try {
        await Actions.createSubtask({ issueKey: 'TEST-1', summary: 'Subtask' });
      } catch (e: any) {
         expect(e.message).not.toContain('SECURITY VIOLATION');
      }
      expect(mockAsUser.requestJira).toHaveBeenCalled();
  });
});
