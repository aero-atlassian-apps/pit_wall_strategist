import { getRecommendedActions as engineGetRecommendedActions } from '../domain/strategy/RecommendationEngine';
import { getSituationAnalysis as engineGetSituationAnalysis } from '../presentation/SituationAnalysis';
import { IssueContext, BoardContext, ActionRecommendation } from '../domain/strategy/StrategyTypes';

// Re-export types for backward compatibility if needed
export type { IssueContext, BoardContext, ActionRecommendation };

/**
 * @deprecated Use domain/strategy/RecommendationEngine and presentation/SituationAnalysis directly.
 */
export function getRecommendedActions(
    issue: IssueContext,
    board: BoardContext,
    alertType?: 'stalled' | 'overdue' | 'blocked' | 'capacity' | 'general'
): ActionRecommendation[] {
    return engineGetRecommendedActions(issue, board, alertType);
}

/**
 * @deprecated Use presentation/SituationAnalysis directly.
 */
export function getSituationAnalysis(
    issue: IssueContext,
    board: BoardContext
): string {
    return engineGetSituationAnalysis(issue, board);
}

export default { getRecommendedActions, getSituationAnalysis };
