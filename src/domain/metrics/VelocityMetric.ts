import { MetricCalculator, MetricInput, MetricResult } from './MetricTypes';
import { JiraIssue } from '../../types/jira';

export class VelocityMetric implements MetricCalculator {

  async calculate(input: MetricInput): Promise<MetricResult> {
    const { issues } = input;

    // Logic ported from old MetricCalculator.ts
    // This implements a "Pseudo-Velocity" based on recent history
    // since we don't have Sprints passed in this simple UseCase yet.

    const doneIssues = issues.filter(i =>
        i.fields.status?.statusCategory?.key === 'done' ||
        i.fields.status?.statusCategory?.name?.toLowerCase() === 'done'
    );

    if (doneIssues.length === 0) {
         return {
             status: 'computed',
             value: 0,
             explanation: "No completed issues found in recent history.",
             source: 'historical:resolutiondate',
             window: 'normalized to 14 days'
         };
    }

    // Determine time window of these issues
    const dates = doneIssues.map(i => i.fields.resolutiondate ? new Date(i.fields.resolutiondate).getTime() : new Date(i.fields.updated!).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    let diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

    // If diffDays is small (e.g., 1 day), projecting to 14 days might be huge. Cap minimum window to 7 days for calculation.
    if (diffDays < 7) diffDays = 7;

    const totalPoints = doneIssues.length; // Default to Issue Count if points not available

    // Normalize to 14 days
    const velocity = Math.round((totalPoints / diffDays) * 14);

    return {
        status: 'computed',
        value: velocity,
        explanation: `Estimated issues per 2 weeks (Pseudo-Velocity).`,
        source: 'historical:resolutiondate',
        window: 'normalized to 14 days'
    };
  }
}
