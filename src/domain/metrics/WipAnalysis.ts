import { DomainIssue } from '../issue/DomainIssue';
import { JiraStatusCategory } from '../issue/JiraStatusCategory';

export interface WipConsistencyResult {
    consistency: number;
    explanation: string;
}

export class WipAnalysis {

    /**
     * Calculates the stability of WIP over the last few weeks.
     * Lower consistency score = more variance (bad).
     */
    public calculateDeviation(historicalIssues: DomainIssue[], currentWip: number, statusResolver: (statusName: string) => JiraStatusCategory): WipConsistencyResult {
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

            // Accurate Historical WIP Reconstruction:
            // For each issue, determine its status category at 'time'
            let count = 0;
            for (const issue of historicalIssues) {
                const category = this.getCategoryAtTime(issue, time, statusResolver);
                if (category.isInProgress) {
                    count++;
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

    public getCategoryAtTime(issue: DomainIssue, time: number, statusResolver: (statusName: string) => JiraStatusCategory): JiraStatusCategory {
        // If not created yet, category is essentially 'null' or 'new'
        if (issue.created.getTime() > time) return JiraStatusCategory.TO_DO;

        // Determine category at 'time'
        let category: JiraStatusCategory = JiraStatusCategory.TO_DO; // Default starting assumptions

        if (issue.changelog && issue.changelog.histories) {
            // Start from the status it was created with (approximate from first history)
            const histories = [...issue.changelog.histories].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

            if (histories.length > 0 && histories[0].items.find(i => i.field === 'status')?.fromString) {
                category = statusResolver(histories[0].items.find(i => i.field === 'status')!.fromString);
            }

            for (const h of histories) {
                const hTime = new Date(h.created).getTime();
                if (hTime > time) break; // This transition happened AFTER the time we are checking

                const statusChange = h.items.find(it => it.field === 'status');
                if (statusChange) {
                    category = statusResolver(statusChange.toString);
                }
            }
        } else {
            // No changelog: Fallback to Lead Time proxy
            const resolved = issue.resolved?.getTime() || null;
            const created = issue.created.getTime();

            if (time >= created && (!resolved || time < resolved)) {
                // If we don't have a changelog, we can only guess based on current status
                // But this is the "Changelog Blindness" we are fixing.
                // For the sake of consistency, if no changelog, we assume current category if it hasn't been resolved yet
                return issue.statusCategory;
            }
        }

        return category;
    }
}
