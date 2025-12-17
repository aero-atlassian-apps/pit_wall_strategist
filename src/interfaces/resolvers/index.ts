import Resolver from '@forge/resolver';
import { ForgePermissionScanner } from '../../infrastructure/forge/ForgePermissionScanner';
import { MetricExecutionPermissionGate } from '../../domain/permissions/MetricExecutionPermissionGate';
import { JiraIssueSearchGateway } from '../../infrastructure/jira/JiraIssueSearchGateway';
import { VelocityMetric } from '../../domain/metrics/VelocityMetric';
import { SprintHealthMetric } from '../../domain/metrics/SprintHealthMetric';
import { CalculateVelocityUseCase } from '../../application/metrics/CalculateVelocityUseCase';
import { BuildMetricDiagnosticsUseCase } from '../../application/diagnostics/BuildMetricDiagnosticsUseCase';

const resolver = new Resolver();

resolver.define('getVelocityMetric', async (req) => {
    const { projectKey } = req.payload;

    // Wire up dependencies
    const scanner = new ForgePermissionScanner();
    const gate = new MetricExecutionPermissionGate(scanner);
    const gateway = new JiraIssueSearchGateway();
    const metric = new VelocityMetric();

    const useCase = new CalculateVelocityUseCase(gate, gateway, metric);
    return await useCase.execute(projectKey);
});

resolver.define('getSprintHealth', async (req) => {
    const { issues, context } = req.payload;
    const metric = new SprintHealthMetric();
    return await metric.calculate({ issues, context });
});

resolver.define('getDiagnostics', async (req) => {
    const { projectKey } = req.payload;

    const scanner = new ForgePermissionScanner();
    const gate = new MetricExecutionPermissionGate(scanner);
    const useCase = new BuildMetricDiagnosticsUseCase(gate);

    return await useCase.execute(projectKey);
});

export const handler = resolver.getDefinitions();
