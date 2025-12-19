import { MetricExecutionPermissionGate } from '../../domain/permissions/MetricExecutionPermissionGate';
import { IssueGateway } from '../../domain/gateways/IssueGateway';
import { VelocityMetric } from '../../domain/metrics/VelocityMetric';
import { MetricResult } from '../../domain/metrics/MetricTypes';
import { InputValidation } from '../../domain/validation/InputValidation';

export class CalculateVelocityUseCase {
    constructor(
        private permissionGate: MetricExecutionPermissionGate,
        private issueGateway: IssueGateway,
        private metricCalculator: VelocityMetric
    ) {}

    async execute(projectKey: string): Promise<MetricResult> {
        // 0. Input Validation
        try {
            InputValidation.validateProjectKey(projectKey);
        } catch (error) {
            return {
                status: 'error',
                reason: `Security Validation Failed: ${error instanceof Error ? error.message : 'Invalid Input'}`
            };
        }

        // 1. Permission Check
        const perm = await this.permissionGate.evaluate(projectKey);
        if (perm.status === 'DENIED') {
            return {
                status: 'disabled',
                reason: perm.reasons[0] || 'Access Denied'
            };
        }

        // 2. Fetch Data (Infrastructure)
        const issues = await this.issueGateway.search(`project = "${projectKey}" AND statusCategory = Done AND updated >= -30d`);

        // 3. Domain Calculation
        return this.metricCalculator.calculate({ issues });
    }
}
