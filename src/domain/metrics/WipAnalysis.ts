import { DomainIssue } from '../issue/DomainIssue';

export interface WipConsistencyResult {
    consistency: number;
    explanation: string;
}

export class WipAnalysis {

    /**
     * Calculates the stability of WIP over the last few weeks.
     * Lower consistency score = more variance (bad).
     * Wait, typical "Consistency" score logic:
     * Original code returns "stdDev". High StdDev = Low Consistency?
     * "wipConsistencyResult.consistency" is assigned "stdDev".
     * So it's confusing naming. "WIP Deviation" is better.
     * But I must stick to "Consistency" if that's what the UI expects, OR rename it properly in Domain and map it in DTO.
     * UI uses `wipConsistency`.
     * I will name the method `calculateDeviation` and the result `consistency` to match DTO for now, but document it.
     */
    public calculateDeviation(historicalIssues: DomainIssue[], currentWip: number): WipConsistencyResult {
        // Metric: Standard Deviation of WIP over time.

        // Issues with history are needed to reconstruct past states
        const issuesWithHistory = historicalIssues.filter(i => i.changelog && i.changelog.histories && i.changelog.histories.length > 0);

        if (issuesWithHistory.length === 0 && currentWip === 0) {
            return { consistency: 0, explanation: 'exp:insufficientHistoryWip' };
        }

        const now = Date.now();
        const week = 7 * 24 * 60 * 60 * 1000;
        const samples = [now, now - week, now - 2 * week, now - 3 * week];

        const wipCounts = samples.map((time, index) => {
            // Index 0 is Now
            if (index === 0) return currentWip;

            // Reconstruct typical "Done" issues state
            // This logic is imperfect but preserved from original:
            // Count issues that were Created <= Time AND (Not Resolved OR Resolved > Time)

            let count = 0;
            for (const issue of historicalIssues) {
                const created = issue.created.getTime();
                const resolved = issue.resolved?.getTime() || null;

                if (created <= time) {
                    if (!resolved || resolved > time) {
                        count++;
                    }
                }
            }
            return count;
        });

        const mean = wipCounts.reduce((a, b) => a + b, 0) / wipCounts.length;
        if (mean === 0) return { consistency: 0, explanation: 'exp:wipZero' };

        const variance = wipCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wipCounts.length;
        const stdDev = Math.sqrt(variance);

        const val = Math.round(stdDev * 10) / 10;
        const avg = Math.round(mean);

        return {
            consistency: val,
            explanation: `exp:wipDeviation:deviation=${val}:avg=${avg}`
        };
    }
}
