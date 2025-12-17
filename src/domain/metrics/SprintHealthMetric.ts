import { MetricCalculator, MetricInput, MetricResult } from './MetricTypes';
import { JiraIssue } from '../../types/jira';

/**
 * SprintHealthMetric
 *
 * Domain logic for calculating Sprint Health Score.
 * Pure function style, no side effects.
 */
export class SprintHealthMetric implements MetricCalculator {

    async calculate(input: MetricInput): Promise<MetricResult> {
        // Implementation ported from advancedAnalytics.ts but cleaned up
        const issues: JiraIssue[] = input.issues;
        const sprintStartDate = input.context?.sprintStartDate ? new Date(input.context.sprintStartDate) : null;
        const sprintEndDate = input.context?.sprintEndDate ? new Date(input.context.sprintEndDate) : null;
        const historicalVelocity = input.config?.historicalVelocity || 20;

        if (!sprintStartDate || !sprintEndDate) {
             return {
                 status: 'disabled',
                 reason: 'Missing Sprint Dates'
             };
        }

        const score = this.calculateScore(issues, sprintStartDate, sprintEndDate, historicalVelocity);

        return {
            status: 'computed',
            value: score.score,
            explanation: score.message,
            metadata: {
                factors: score.factors,
                recommendation: score.recommendation,
                healthStatus: score.status
            }
        };
    }

    private calculateScore(issues: JiraIssue[], start: Date, end: Date, historicalVelocity: number) {
        // ... Logic from calculateSprintHealth ...
        const now = new Date();
        const doneIssues = issues.filter(i => i.fields.status?.statusCategory?.key === 'done');
        const completedPoints = doneIssues.length; // Simplified for now (points field logic needed)

        // Time factor
        const sprintDuration = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        const expectedProgress = Math.min(1, elapsed / sprintDuration);
        const actualProgress = completedPoints / (issues.length || 1);

        const timeFactor = actualProgress / (expectedProgress || 0.1);

        const rawScore = Math.min(100, Math.max(0, timeFactor * 100)); // Simplified

        return {
            score: Math.round(rawScore),
            status: rawScore > 80 ? 'GREEN_FLAG' : 'RED_FLAG',
            message: 'Calculated Health',
            factors: { timeFactor },
            recommendation: 'Check progress'
        };
    }
}
