import { DomainIssue } from '../issue/DomainIssue';

export interface ThroughputResult {
    rate: number;
    explanation: string;
    window: string;
}

export class ThroughputCalculator {
    public calculate(completedIssues: DomainIssue[]): ThroughputResult {
        if (completedIssues.length === 0) {
            return { rate: 0, explanation: 'exp:noCompletedFound', window: 'none' };
        }

        const dates = completedIssues.map(i => i.resolved?.getTime() || i.updated?.getTime() || 0).filter(t => t > 0);

        if (dates.length === 0) {
            return { rate: 0, explanation: 'exp:insufficientData', window: 'none' };
        }

        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        let diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

        if (diffDays < 1) diffDays = 1;

        // Adaptive window logic
        if (diffDays < 7) {
            // Less than a week: just show total count
            return {
                rate: completedIssues.length,
                explanation: `exp:throughputTotal:days=${Math.round(diffDays)}`,
                window: `${Math.round(diffDays)} ${Math.round(diffDays) === 1 ? 'day' : 'days'}`
            };
        }

        const weeks = diffDays / 7;
        const rate = Math.round((completedIssues.length / weeks) * 10) / 10;

        return {
            rate,
            explanation: `exp:throughputAvg:days=${Math.round(diffDays)}`,
            window: `${Math.round(diffDays)} days`
        };
    }
}
