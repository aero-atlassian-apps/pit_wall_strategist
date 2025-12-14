import { ActionRecommendation, BoardContext, IssueContext } from './StrategyTypes';
import { ALL_ACTIONS } from './ActionDefinitions';
import { analyzeActionRelevance } from './ActionPolicies';

export function getRecommendedActions(
    issue: IssueContext,
    board: BoardContext,
    alertType?: 'stalled' | 'overdue' | 'blocked' | 'capacity' | 'general'
): ActionRecommendation[] {
    const recommendations: ActionRecommendation[] = [];

    for (const action of ALL_ACTIONS) {
        // alertType is not used in the original analyzeActionRelevance, but it was in the function signature.
        // We can ignore it for now or pass it if policies need it later.
        const analysis = analyzeActionRelevance(action, issue, board);
        recommendations.push({
            ...action,
            ...analysis
        });
    }

    // Sort by relevance: critical > recommended > available > hidden
    const order = { critical: 0, recommended: 1, available: 2, hidden: 3 };
    recommendations.sort((a, b) => order[a.relevance] - order[b.relevance]);

    // Filter out hidden and limit to top 6 for better UX
    return recommendations.filter(r => r.relevance !== 'hidden').slice(0, 6);
}
