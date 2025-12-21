import { DomainIssue } from '../issue/DomainIssue';
import { JiraStatusCategory } from '../issue/JiraStatusCategory';

export interface VelocityResult {
    value: number;
    explanation: string;
    source: string;
    window: string;
}

export class VelocityCalculator {

    /**
     * Calculates velocity based on closed sprints.
     */
    public calculateFromSprints(
        closedSprints: { id: number; name: string; completeDate?: string; startDate?: string; endDate?: string }[],
        sprintIssuesMap: Map<number, DomainIssue[]>, // Issues per sprint
        usePoints: boolean
    ): VelocityResult {
        const periodCount = closedSprints.length;
        if (periodCount === 0) {
            return { value: 0, explanation: 'exp:noClosedSprints', source: 'none', window: 'none' };
        }

        let validSprintsWithPoints = 0;
        let totalCompleted = 0;

        for (const sprint of closedSprints) {
            const issues = sprintIssuesMap.get(sprint.id) || [];

            // Filter issues completed within the sprint
            // Logic from original MetricCalculator:
            // If resolutiondate exists, it must be between start and end (if available).
            // Otherwise if it's Done, we count it.

            let sprintTotal = 0;
            const start = sprint.startDate ? new Date(sprint.startDate).getTime() : 0;
            const end = (sprint.completeDate || sprint.endDate) ? new Date(sprint.completeDate || sprint.endDate!).getTime() : Number.MAX_SAFE_INTEGER;

            for (const issue of issues) {
                if (!issue.statusCategory.isDone) continue;

                const resolvedTime = issue.resolved?.getTime() || 0;
                // If we have strict start/end, enforce them. Else just count it.
                if (start && end && resolvedTime > 0) {
                    if (resolvedTime >= start && resolvedTime <= end) {
                        sprintTotal += (usePoints ? (issue.storyPoints || 1) : 1);
                    }
                } else {
                    sprintTotal += (usePoints ? (issue.storyPoints || 1) : 1);
                }
            }

            // Only average sprints that actually had values? Or all closed sprints?
            // Original logic: "valid.reduce...", seems to filter valid numbers.
            // But let's stick to "Closed sprints count".
            totalCompleted += sprintTotal;
        }

        const value = Math.round(totalCompleted / periodCount);

        return {
            value,
            explanation: `exp:velocityAvgSprints:unit=${usePoints ? 'points' : 'issues'}:count=${periodCount}`,
            source: 'agile:sprintIssues', // Simplified source key
            window: `${periodCount} closed sprints`
        };
    }

    /**
     * Calculates Pseudo-Velocity (Time-based normalization) for Kanban/Business boards.
     */
    public calculatePseudoVelocity(
        completedIssues: DomainIssue[],
        usePoints: boolean
    ): VelocityResult {
        if (completedIssues.length === 0) {
            return { value: 0, explanation: 'exp:noCompletedIssuesRecent', source: 'historical:resolutiondate', window: 'normalized to 14 days' };
        }

        const dates = completedIssues.map(i => i.resolved?.getTime() || i.updated?.getTime() || 0).filter(t => t > 0);
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);

        let diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) diffDays = 7; // Cap min window

        const totalWork = completedIssues.reduce((sum, i) => sum + (usePoints ? (i.storyPoints || 1) : 1), 0);

        // Normalize to 14 days (Sprint length proxy)
        const value = Math.round((totalWork / diffDays) * 14);

        return {
            value,
            explanation: `exp:pseudoVelocity:unit=${usePoints ? 'points' : 'issues'}`,
            source: 'historical:resolutiondate',
            window: 'normalized to 14 days'
        };
    }
}
