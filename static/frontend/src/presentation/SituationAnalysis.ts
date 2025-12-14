import { BoardContext, IssueContext } from '../domain/strategy/StrategyTypes';

export function getSituationAnalysis(
    issue: IssueContext,
    board: BoardContext
): string {
    const insights: string[] = [];

    // Board type specific opening
    if (board.boardType === 'scrum') {
        if (board.sprintDaysRemaining && board.sprintDaysRemaining <= 3) {
            insights.push(`Sprint ending in ${board.sprintDaysRemaining} days - time is critical.`);
        }
    } else if (board.boardType === 'kanban') {
        if (board.wipLimit && board.wipCurrent && board.wipCurrent > board.wipLimit) {
            insights.push(`WIP at ${board.wipCurrent}/${board.wipLimit} - flow is restricted.`);
        }
    }

    // Issue-specific analysis
    if (issue.isBlocked) {
        insights.push('🚩 RED FLAG: This issue is blocked.');
    } else if (issue.isStalled) {
        insights.push(`⚠️ HIGH DRAG: No movement for ${issue.daysInStatus} days.`);
    }

    if (issue.statusCategory === 'indeterminate' && issue.daysInStatus > 5) {
        insights.push('Tire degradation is high. Consider a strategy change.');
    }

    if (!issue.storyPoints && board.boardType === 'scrum') {
        insights.push('Missing fuel load estimate. Calibration needed.');
    }

    if (issue.hasSubtasks) {
        insights.push('Subtasks in progress - check crew status.');
    }

    if (insights.length === 0) {
        insights.push('All systems nominal. Standard strategy applies.');
    }

    return insights.join(' ');
}
