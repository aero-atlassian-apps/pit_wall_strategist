import { DomainIssue } from '../issue/DomainIssue';
import { JiraStatusCategory } from '../issue/JiraStatusCategory';

export interface CycleTimeResult {
    avgHours: number;
    medianHours: number;
    p85Hours: number;
    minHours: number;
    maxHours: number;
    explanation: string;
    window: string;
}

export type StatusCategoryResolver = (statusName: string) => JiraStatusCategory;

export class CycleTimeCalculator {

    public calculate(completedIssues: DomainIssue[], statusResolver: StatusCategoryResolver): CycleTimeResult {
        if (completedIssues.length === 0) {
            return { avgHours: 0, medianHours: 0, p85Hours: 0, minHours: 0, maxHours: 0, explanation: 'exp:noCompletedIssues', window: 'none' };
        }

        const durationsMs: number[] = [];
        let method = 'Resolution';

        // Method 1: Changelog
        const issuesWithHistory = completedIssues.filter(i => i.changelog && i.changelog.histories && i.changelog.histories.length > 0);

        if (issuesWithHistory.length > 0) {
            for (const issue of issuesWithHistory) {
                if (!issue.statusCategory.isDone) continue;

                const histories = [...(issue.changelog!.histories)];
                histories.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

                const resolvedTime = issue.resolved?.getTime() || issue.updated?.getTime() || 0;
                let totalIndeterminateMs = 0;
                let currentCat = statusResolver(issue.statusName || ''); // Current status is done

                // We need to know the initial status. Usually 'ToDo' but we check first history.
                // Or we can just iterate histories.

                // Let's track intervals of 'Indeterminate'
                let lastStatusTime = issue.created.getTime();
                let lastCat = JiraStatusCategory.TO_DO; // Assume starting at ToDo

                // Find initial status from first history entry if possible
                if (histories.length > 0) {
                    const firstStatusChange = histories[0].items.find(it => it.field === 'status');
                    if (firstStatusChange && firstStatusChange.fromString) {
                        lastCat = statusResolver(firstStatusChange.fromString);
                    }
                }

                for (const h of histories) {
                    const statusChange = h.items.find(it => it.field === 'status');
                    if (!statusChange) continue;

                    const changeTime = new Date(h.created).getTime();
                    const toCat = statusResolver(statusChange.toString || '');

                    // If we were in Indeterminate, we just finished an interval
                    if (lastCat.isInProgress) {
                        totalIndeterminateMs += (changeTime - lastStatusTime);
                    }

                    lastCat = toCat;
                    lastStatusTime = changeTime;
                }

                // If the final status (after all histories) is still Indeterminate (shouldn't happen for CompletedIssues but let's be safe),
                // or if the transition to Done happened at resolvedTime.
                // Usually the last history entry is the transition to Done.
                if (lastCat.isInProgress && resolvedTime > lastStatusTime) {
                    totalIndeterminateMs += (resolvedTime - lastStatusTime);
                }

                if (totalIndeterminateMs > 0) {
                    durationsMs.push(totalIndeterminateMs);
                }
            }
        }

        // Method 2: Fallback to Lead Time
        if (durationsMs.length === 0) {
            for (const issue of completedIssues) {
                const created = issue.created.getTime();
                const resolved = issue.resolved?.getTime() || issue.updated?.getTime() || 0;
                if (resolved > created) {
                    durationsMs.push(resolved - created);
                }
            }
            method = 'Resolution';
        } else {
            method = 'Changelog';
        }

        if (durationsMs.length === 0) {
            return { avgHours: 0, medianHours: 0, p85Hours: 0, minHours: 0, maxHours: 0, explanation: 'exp:insufficientData', window: 'none' };
        }

        durationsMs.sort((a, b) => a - b);
        const count = durationsMs.length;

        const avgMs = durationsMs.reduce((a, b) => a + b, 0) / count;
        const hours = (ms: number) => Math.round(ms / (1000 * 60 * 60));

        const p50Index = Math.floor(count * 0.5);
        const p85Index = Math.floor(count * 0.85);

        const avg = hours(avgMs);
        const median = hours(durationsMs[p50Index]);
        const p85 = hours(durationsMs[p85Index]);
        const min = hours(durationsMs[0]);
        const max = hours(durationsMs[count - 1]);

        const avgDays = Math.round(avg / 24 * 10) / 10;
        // C-005 FIX: Clearly indicate when fallback to Lead Time is used
        const explanation = method === 'Changelog'
            ? `exp:cycleTimeChangelog:count=${count}:days=${avgDays}`
            : `exp:cycleTimeLeadTimeFallback:count=${count}:days=${avgDays}`;

        return {
            avgHours: avg,
            medianHours: median,
            p85Hours: p85,
            minHours: min,
            maxHours: max,
            explanation,
            window: `${count} completed issues`
        };
    }
}
