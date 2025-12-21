/**
 * Action Policies for Strategy Assistant
 * Deterministic rules to evaluate action relevance based on board/issue context.
 */
import { ActionDefinition, ActionRecommendation, BoardContext, IssueContext } from './StrategyTypes';

type RelevanceResult = { relevance: ActionRecommendation['relevance']; reason?: string };

export function analyzeActionRelevance(
    action: ActionDefinition,
    issue: IssueContext,
    board: BoardContext
): RelevanceResult {
    switch (action.id) {
        case 'undercut': return analyzeUndercut(issue);
        case 'team-orders': return analyzeTeamOrders(issue);
        case 'retire': return analyzeRetire(issue, board);
        case 'blue-flag': return analyzeBlueFlag(issue);
        case 'push-limit': return analyzePushLimit(issue);
        case 'red-flag': return analyzeRedFlag(issue);
        case 'slipstream': return analyzeSlipstream(issue);
        case 'fuel-adjust': return analyzeFuelAdjust(issue, board);
        case 'radio': return analyzeRadio(issue);
        case 'pit-crew': return analyzePitCrew(issue);
        default: return { relevance: 'available' };
    }
}

function analyzeUndercut(issue: IssueContext): RelevanceResult {
    const { isStalled, hasSubtasks, storyPoints, issueType, daysInStatus, priority } = issue;

    // Critical: Large stalled ticket (>5pts) or stalled for >5 days
    if (isStalled && (storyPoints || 0) >= 5 && !hasSubtasks) {
        return { relevance: 'critical', reason: 'Large stalled ticket - break it down!' };
    }
    if (isStalled && daysInStatus > 5 && priority !== 'Low') {
        return { relevance: 'critical', reason: 'Stuck for >5 days - needs surgical intervention' };
    }

    // Recommended
    if ((isStalled || daysInStatus > 3) && !hasSubtasks) {
        return { relevance: 'recommended', reason: 'No subtasks - consider breaking down' };
    }

    // Hidden/Available
    if (issueType.toLowerCase() === 'subtask') {
        return { relevance: 'hidden' };
    }
    if (hasSubtasks) {
        return { relevance: 'available', reason: 'Already has subtasks' };
    }
    return { relevance: 'available' };
}

function analyzeTeamOrders(issue: IssueContext): RelevanceResult {
    const { isStalled, assignee, statusCategory, daysInStatus, priority } = issue;

    // Critical: Stalled high priority items with assignee
    if (isStalled && assignee && (priority === 'High' || priority === 'Highest')) {
        return { relevance: 'critical', reason: 'Driver overloaded with high priority work' };
    }

    // Recommended
    if (isStalled && assignee) {
        return { relevance: 'recommended', reason: 'Driver may be overloaded' };
    }
    if (statusCategory === 'indeterminate' && daysInStatus > 2 && priority === 'High') {
        return { relevance: 'recommended', reason: 'High priority stuck - redistribute' };
    }

    if (!assignee) {
        return { relevance: 'available', reason: 'No current assignee' };
    }
    return { relevance: 'available' };
}

function analyzeRetire(issue: IssueContext, board: BoardContext): RelevanceResult {
    const { sprintActive, sprintDaysRemaining, boardType, wipLimit, wipCurrent } = board;
    const { priority, statusCategory, issueType, daysInStatus } = issue;

    // Critical: Sprint ending or specific low value items stuck for long
    if (sprintActive && (sprintDaysRemaining || 99) <= 3 && priority !== 'High' && statusCategory !== 'done') {
        return { relevance: 'critical', reason: 'Sprint ending - preserve velocity' };
    }
    // New: If stuck > 10 days and Low priority -> Suggest retire
    if (daysInStatus > 10 && priority === 'Low') {
        return { relevance: 'critical', reason: 'Stuck > 10 days - clear the garage' };
    }

    // Recommended
    if (boardType === 'kanban' && wipLimit && wipCurrent && wipCurrent > wipLimit && priority !== 'High') {
        return { relevance: 'recommended', reason: 'WIP over limit - reduce load' };
    }

    // Hidden
    if (priority === 'High' || priority === 'Highest') {
        return { relevance: 'hidden' };
    }
    if (issueType.toLowerCase() === 'subtask') {
        return { relevance: 'hidden' };
    }
    return { relevance: 'available' };
}

function analyzeBlueFlag(issue: IssueContext): RelevanceResult {
    const { isBlocked, isStalled, linkedIssues, priority } = issue;
    if ((isBlocked || isStalled) && (linkedIssues || 0) > 0) {
        return { relevance: 'critical', reason: 'Other issues depend on this' };
    }
    if (priority === 'High' || priority === 'Highest') {
        return { relevance: 'hidden' };
    }
    if (isStalled) {
        return { relevance: 'recommended', reason: 'Stalled - may need priority boost' };
    }
    return { relevance: 'available' };
}

function analyzePushLimit(issue: IssueContext): RelevanceResult {
    const { statusCategory, daysInStatus } = issue;
    if (statusCategory === 'indeterminate' && daysInStatus > 3) {
        return { relevance: 'recommended', reason: 'Push to next stage' };
    }
    if (statusCategory === 'done') {
        return { relevance: 'hidden' };
    }
    return { relevance: 'available' };
}

function analyzeRedFlag(issue: IssueContext): RelevanceResult {
    const { isStalled, isBlocked, statusCategory, daysInStatus } = issue;

    // Critical: Stalled > 5 days is effectively blocked
    if (isStalled && daysInStatus > 5 && !isBlocked) {
        return { relevance: 'critical', reason: 'Stalled > 5 days - Force visual blocker' };
    }
    if (isStalled && !isBlocked) {
        return { relevance: 'critical', reason: 'Flag impediment to trigger resolution' };
    }

    if (isBlocked || statusCategory === 'done') {
        return { relevance: 'hidden' };
    }
    return { relevance: 'available' };
}

function analyzeSlipstream(issue: IssueContext): RelevanceResult {
    if ((issue.linkedIssues || 0) === 0) {
        return { relevance: 'available', reason: 'Check for related work' };
    }
    return { relevance: 'available' };
}

function analyzeFuelAdjust(issue: IssueContext, board: BoardContext): RelevanceResult {
    const { isStalled, storyPoints } = issue;
    const { boardType } = board;
    if (isStalled && !storyPoints && boardType === 'scrum') {
        return { relevance: 'critical', reason: 'Missing estimate - calibrate!' };
    }
    if (isStalled && (storyPoints || 0) >= 8) {
        return { relevance: 'recommended', reason: 'Large item stalled - verify estimate' };
    }
    if (boardType === 'kanban') {
        return { relevance: 'available' };
    }
    return { relevance: 'available' };
}

function analyzeRadio(issue: IssueContext): RelevanceResult {
    const { isStalled, isBlocked } = issue;
    if (isStalled || isBlocked) {
        return { relevance: 'recommended', reason: 'Document the situation' };
    }
    return { relevance: 'available' };
}

function analyzePitCrew(issue: IssueContext): RelevanceResult {
    const { issueType, isStalled, hasSubtasks } = issue;
    if (issueType.toLowerCase() === 'subtask') {
        return { relevance: 'hidden' };
    }
    if (isStalled && !hasSubtasks) {
        return { relevance: 'recommended', reason: 'Create targeted action item' };
    }
    return { relevance: 'available' };
}
