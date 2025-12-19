import { describe, it, expect, vi } from 'vitest';
import { CalculateVelocityUseCase } from '../../../src/application/metrics/CalculateVelocityUseCase';
import { MetricExecutionPermissionGate } from '../../../src/domain/permissions/MetricExecutionPermissionGate';
import { IssueGateway } from '../../../src/domain/gateways/IssueGateway';
import { VelocityMetric } from '../../../src/domain/metrics/VelocityMetric';

describe('CalculateVelocityUseCase - Security', () => {
    it('should NOT be vulnerable to JQL injection (validation check)', async () => {
        // Mock dependencies
        const mockPermissionGate = {
            evaluate: vi.fn().mockResolvedValue({ status: 'GRANTED', reasons: [] })
        } as unknown as MetricExecutionPermissionGate;

        const mockIssueGateway = {
            search: vi.fn().mockResolvedValue([])
        } as unknown as IssueGateway;

        const mockMetric = {
            calculate: vi.fn().mockReturnValue({ status: 'success', value: 0 })
        } as unknown as VelocityMetric;

        const useCase = new CalculateVelocityUseCase(mockPermissionGate, mockIssueGateway, mockMetric);

        // Malicious input
        const maliciousProjectKey = 'PROJ" OR assignee = currentUser() --';

        const result = await useCase.execute(maliciousProjectKey);

        // Verify that the search was NOT called
        expect(mockIssueGateway.search).not.toHaveBeenCalled();

        // Verify that we returned an error
        expect(result.status).toBe('error');
        expect(result.reason).toContain('Security Validation Failed');
    });

    it('should accept valid project keys', async () => {
        // Mock dependencies
        const mockPermissionGate = {
            evaluate: vi.fn().mockResolvedValue({ status: 'GRANTED', reasons: [] })
        } as unknown as MetricExecutionPermissionGate;

        const mockIssueGateway = {
            search: vi.fn().mockResolvedValue([])
        } as unknown as IssueGateway;

        const mockMetric = {
            calculate: vi.fn().mockReturnValue({ status: 'success', value: 0 })
        } as unknown as VelocityMetric;

        const useCase = new CalculateVelocityUseCase(mockPermissionGate, mockIssueGateway, mockMetric);

        const validKey = 'PROJ_123';
        await useCase.execute(validKey);

        expect(mockIssueGateway.search).toHaveBeenCalledWith(
            expect.stringContaining(`project = "${validKey}"`)
        );
    });
});
