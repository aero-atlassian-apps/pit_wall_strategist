import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JiraDataService } from '../../src/infrastructure/jira/JiraDataService';
import api from '@forge/api';

vi.mock('@forge/api', () => ({
    default: {
        asUser: vi.fn(),
        asApp: vi.fn()
    },
    route: (strings: TemplateStringsArray, ...values: any[]) => {
        let result = "";
        for (let i = 0; i < strings.length; i++) {
            result += strings[i];
            if (i < values.length) {
                result += values[i];
            }
        }
        return result;
    }
}));

vi.mock('../../src/resolvers/fetchStatus', () => ({
    recordFetchStatus: vi.fn()
}));

describe('JiraDataService Security Audit', () => {
    let service: JiraDataService;
    const mockRequestJiraUser = vi.fn();
    const mockRequestJiraApp = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        service = new JiraDataService();
        (api.asUser as any).mockReturnValue({ requestJira: mockRequestJiraUser });
        (api.asApp as any).mockReturnValue({ requestJira: mockRequestJiraApp });
    });

    it('should NOT fallback to asApp when getBoardActiveSprint fails asUser', async () => {
        mockRequestJiraUser.mockResolvedValue({ ok: false, status: 403 });

        await service.getBoardActiveSprint(1);

        expect(mockRequestJiraUser).toHaveBeenCalledTimes(1);
        expect(mockRequestJiraApp).not.toHaveBeenCalled();
    });

    it('should NOT fallback to asApp when getBoardFutureSprints fails asUser', async () => {
        mockRequestJiraUser.mockResolvedValue({ ok: false, status: 403 });

        await service.getBoardFutureSprints(1);

        expect(mockRequestJiraUser).toHaveBeenCalledTimes(1);
        expect(mockRequestJiraApp).not.toHaveBeenCalled();
    });

    it('should NOT fallback to asApp when getClosedSprints fails asUser', async () => {
        mockRequestJiraUser.mockResolvedValue({ ok: false, status: 403 });

        await service.getClosedSprints(1);

        expect(mockRequestJiraUser).toHaveBeenCalledTimes(1);
        expect(mockRequestJiraApp).not.toHaveBeenCalled();
    });

    it('should NOT fallback to asApp when getSprintIssues fails asUser', async () => {
        mockRequestJiraUser.mockResolvedValue({ ok: false, status: 403 });

        await service.getSprintIssues(1);

        expect(mockRequestJiraUser).toHaveBeenCalledTimes(1);
        expect(mockRequestJiraApp).not.toHaveBeenCalled();
    });

    it('should NOT fallback to asApp when getBoardConfiguration fails asUser', async () => {
        mockRequestJiraUser.mockResolvedValue({ ok: false, status: 403 });

        await service.getBoardConfiguration(1);

        expect(mockRequestJiraUser).toHaveBeenCalledTimes(1);
        expect(mockRequestJiraApp).not.toHaveBeenCalled();
    });

    it('should NOT fallback to asApp when getKanbanBoardIssues fails asUser', async () => {
        mockRequestJiraUser.mockRejectedValue(new Error('NEEDS_AUTHENTICATION_ERR'));

        await service.getKanbanBoardIssues(1);

        expect(mockRequestJiraUser).toHaveBeenCalledTimes(1);
        expect(mockRequestJiraApp).not.toHaveBeenCalled();
    });
});
