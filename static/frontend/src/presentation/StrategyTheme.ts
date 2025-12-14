import { DetectedSignal } from '../domain/issue/IssueAnalyzer';

interface ThemedAnalysis {
    message: string;
    recommendation: string | null;
    reason: string;
}

export function getF1ThemedAnalysis(signal: DetectedSignal): ThemedAnalysis {
    switch (signal) {
        case 'DEPENDENCY':
            return {
                message: 'Telemetry indicates high drag from external components. We are losing time in the dirty air.',
                recommendation: 'split',
                reason: 'External Dependency Detected'
            };
        case 'SCOPE':
            return {
                message: 'Car is too heavy. Fuel load is exceeding race parameters. We need to shed weight.',
                recommendation: 'split',
                reason: 'Scope Complexity Detected'
            };
        case 'SKILL':
            return {
                message: 'Driver is reporting handling issues in Sector 2. Pace is dropping.',
                recommendation: 'reassign',
                reason: 'Knowledge Gap Detected'
            };
        case 'TECHNICAL':
            return {
                message: 'Critical mechanical failure detected. Engine telemetry is erratic.',
                recommendation: 'defer',
                reason: 'Technical Blocker'
            };
        case 'NONE':
        default:
            // "Stalled Progress" is the default fallback if no specific signal is found but we called this function
            // However, the original code had a default return value if NO keywords matched.
            return {
                message: 'Pace has dropped below delta. Tires are gone. We need a fresh set of options.',
                recommendation: 'reassign',
                reason: 'Stalled Progress'
            };
    }
}

export function getDefaultThemedAnalysis(): ThemedAnalysis {
    return {
        message: 'Analysis complete. Sector 2 yellow flag.',
        recommendation: null,
        reason: 'General Caution'
    };
}
