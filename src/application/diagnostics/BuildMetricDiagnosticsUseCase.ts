import { MetricExecutionPermissionGate } from '../../domain/permissions/MetricExecutionPermissionGate';
import { MetricDiagnostics } from '../../domain/diagnostics/MetricDiagnostic';

export class BuildMetricDiagnosticsUseCase {
    constructor(private permissionGate: MetricExecutionPermissionGate) { }

    async execute(projectKey: string): Promise<MetricDiagnostics> {
        const perm = await this.permissionGate.evaluate(projectKey);

        return {
            permissions: {
                canRead: perm.status === 'GRANTED',
                canWrite: perm.userCanWrite
            },
            metrics: [], // Populate with real metric checks if needed
            timestamp: new Date().toISOString()
        };
    }
}
