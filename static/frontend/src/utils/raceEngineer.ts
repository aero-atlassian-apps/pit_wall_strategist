import { detectIssueSignal, IssueAnalysisInput } from '../domain/issue/IssueAnalyzer';
import { getF1ThemedAnalysis, getDefaultThemedAnalysis } from '../presentation/StrategyTheme';
import { STRATEGY_DEFINITIONS } from '../domain/strategy/StrategyDefinitions';

/**
 * @deprecated Use domain/issue/IssueAnalyzer and presentation/StrategyTheme directly.
 */
export function analyzeTicket(ticket: any) {
    if (!ticket) return getDefaultThemedAnalysis();

    // Adapt 'ticket' to IssueAnalysisInput
    const input: IssueAnalysisInput = {
        summary: ticket.summary,
        latestComment: ticket.latestComment
    };

    const signal = detectIssueSignal(input);

    if (signal === 'NONE') {
         // Original logic: If no keywords matched, return the "Stalled Progress" message.
         // Wait, getDefaultThemedAnalysis is for !ticket.
         // If ticket exists but no keywords, original returned:
         // { message: 'Pace has dropped below delta...', recommendation: 'reassign', reason: 'Stalled Progress' }
         return getF1ThemedAnalysis('NONE');
    }

    return getF1ThemedAnalysis(signal);
}

export const STRATEGIES = STRATEGY_DEFINITIONS;
