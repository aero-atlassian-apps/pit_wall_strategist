export class HealthPolicy {
    static determineStatus(boardType: string, velocityDelta: number, wipLoad: number): 'OPTIMAL' | 'WARNING' | 'CRITICAL' {
        if (boardType === 'scrum') {
            // In Scrum, we care about velocity AND WIP
            // velocityDelta here is Pace (Variance from expected progress)
            // If velocity is significantly behind (-20%), it's critical
            if (velocityDelta < -20 || wipLoad > 120) return 'CRITICAL';
            else if (velocityDelta < -10 || wipLoad > 90) return 'WARNING';
        } else {
            // In Kanban/Business, we purely care about WIP and Flow
            // Strict WIP limits: > 100% is Critical
            if (wipLoad > 100) return 'CRITICAL';
            else if (wipLoad > 85) return 'WARNING';
        }
        return 'OPTIMAL';
    }
}
