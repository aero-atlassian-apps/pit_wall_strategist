/**
 * Strategy Intelligence Engine
 * 
 * Analyzes the context (board type, issue state, workflow status, alert type)
 * and recommends only the relevant pit strategies.
 */

export interface IssueContext {
    key: string
    summary: string
    status: string
    statusCategory: 'new' | 'indeterminate' | 'done' // TODO, IN_PROGRESS, DONE
    issueType: string // Bug, Story, Task, Epic, Subtask
    isStalled: boolean
    isBlocked: boolean
    hasSubtasks: boolean
    storyPoints?: number
    assignee?: string
    priority: string
    daysInStatus: number
    linkedIssues?: number
}

export interface BoardContext {
    boardType: 'scrum' | 'kanban' | 'unknown'
    sprintActive: boolean
    sprintDaysRemaining?: number
    wipLimit?: number
    wipCurrent?: number
    columns?: string[]
}

export interface ActionRecommendation {
    id: string
    name: string
    description: string
    icon: string
    action: string
    relevance: 'critical' | 'recommended' | 'available' | 'hidden'
    reason?: string
}

// All available actions
const ALL_ACTIONS = [
    { id: 'undercut', name: 'The Undercut', description: 'Split ticket into smaller subtasks for faster sector times.', icon: '✂️', action: 'split-ticket', category: 'decomposition' },
    { id: 'team-orders', name: 'Team Orders', description: 'Reassign to driver with more capacity.', icon: '👥', action: 'reassign-ticket', category: 'assignment' },
    { id: 'retire', name: 'Retire Car', description: 'Move to backlog. Save engine for next race.', icon: '🏁', action: 'defer-ticket', category: 'triage' },
    { id: 'blue-flag', name: 'Blue Flag', description: 'Escalate priority to clear the track.', icon: '🔵', action: 'change-priority', category: 'priority' },
    { id: 'push-limit', name: 'Push to Limit', description: 'Transition to next workflow status.', icon: '⚡', action: 'transition-issue', category: 'workflow' },
    { id: 'red-flag', name: 'Red Flag', description: 'Mark as blocked. Stop and address.', icon: '🚩', action: 'add-blocker-flag', category: 'blocker' },
    { id: 'slipstream', name: 'Slipstream', description: 'Link related issues for coordinated flow.', icon: '🔗', action: 'link-issues', category: 'coordination' },
    { id: 'fuel-adjust', name: 'Fuel Adjustment', description: 'Update story points or time estimate.', icon: '⛽', action: 'update-estimate', category: 'estimation' },
    { id: 'radio', name: 'Radio Message', description: 'Broadcast strategic comment to team.', icon: '📻', action: 'add-radio-message', category: 'communication' },
    { id: 'pit-crew', name: 'Pit Crew Task', description: 'Create a specific subtask for team member.', icon: '🔧', action: 'create-subtask', category: 'decomposition' }
]

/**
 * Main intelligence function - analyzes context and returns prioritized actions
 */
export function getRecommendedActions(
    issue: IssueContext,
    board: BoardContext,
    alertType?: 'stalled' | 'overdue' | 'blocked' | 'capacity' | 'general'
): ActionRecommendation[] {
    const recommendations: ActionRecommendation[] = []

    for (const action of ALL_ACTIONS) {
        const analysis = analyzeActionRelevance(action, issue, board, alertType)
        recommendations.push({
            ...action,
            ...analysis
        })
    }

    // Sort by relevance: critical > recommended > available > hidden
    const order = { critical: 0, recommended: 1, available: 2, hidden: 3 }
    recommendations.sort((a, b) => order[a.relevance] - order[b.relevance])

    // Filter out hidden and limit to top 6 for better UX
    return recommendations.filter(r => r.relevance !== 'hidden').slice(0, 6)
}

/**
 * Analyze how relevant a specific action is for the current context
 */
function analyzeActionRelevance(
    action: typeof ALL_ACTIONS[0],
    issue: IssueContext,
    board: BoardContext,
    alertType?: string
): { relevance: ActionRecommendation['relevance']; reason?: string } {

    const { id } = action
    const { isStalled, isBlocked, statusCategory, issueType, hasSubtasks, daysInStatus, storyPoints, priority } = issue
    const { boardType, sprintActive, sprintDaysRemaining, wipCurrent, wipLimit } = board

    // ===== THE UNDERCUT (Split) =====
    if (id === 'undercut') {
        // Critical if: Large issue (high points) that is stalled, no subtasks
        if (isStalled && !hasSubtasks && (storyPoints || 0) >= 5) {
            return { relevance: 'critical', reason: 'Large stalled ticket - break it down!' }
        }
        // Recommended if: Issue is stalled or in progress too long without subtasks
        if ((isStalled || daysInStatus > 3) && !hasSubtasks) {
            return { relevance: 'recommended', reason: 'No subtasks - consider breaking down' }
        }
        // Hide for subtasks (can't split further easily)
        if (issueType.toLowerCase() === 'subtask') {
            return { relevance: 'hidden' }
        }
        // Hide if already has subtasks
        if (hasSubtasks) {
            return { relevance: 'available', reason: 'Already has subtasks' }
        }
        return { relevance: 'available' }
    }

    // ===== TEAM ORDERS (Reassign) =====
    if (id === 'team-orders') {
        // Critical if: Stalled with assignee (they may be overloaded)
        if (isStalled && issue.assignee) {
            return { relevance: 'critical', reason: 'Driver may be overloaded' }
        }
        // Recommended if: High priority stuck in progress
        if (statusCategory === 'indeterminate' && daysInStatus > 2 && priority === 'High') {
            return { relevance: 'recommended', reason: 'High priority stuck - redistribute' }
        }
        // Hide if no assignee (can't reassign from nobody)
        if (!issue.assignee) {
            return { relevance: 'available', reason: 'No current assignee' }
        }
        return { relevance: 'available' }
    }

    // ===== RETIRE CAR (Defer) =====
    if (id === 'retire') {
        // Critical if: Low priority item blocking sprint completion AND sprint ending soon
        if (sprintActive && (sprintDaysRemaining || 99) <= 3 && priority !== 'High' && statusCategory !== 'done') {
            return { relevance: 'critical', reason: 'Sprint ending - preserve velocity' }
        }
        // Recommended if: Kanban with WIP over limit
        if (boardType === 'kanban' && wipLimit && wipCurrent && wipCurrent > wipLimit && priority !== 'High') {
            return { relevance: 'recommended', reason: 'WIP over limit - reduce load' }
        }
        // Hidden for high priority items
        if (priority === 'High' || priority === 'Highest') {
            return { relevance: 'hidden' }
        }
        // Hidden for subtasks (defer parent instead)
        if (issueType.toLowerCase() === 'subtask') {
            return { relevance: 'hidden' }
        }
        return { relevance: 'available' }
    }

    // ===== BLUE FLAG (Priority) =====
    if (id === 'blue-flag') {
        // Critical if: Blocked/stalled but is actually important (has dependents)
        if ((isBlocked || isStalled) && (issue.linkedIssues || 0) > 0) {
            return { relevance: 'critical', reason: 'Other issues depend on this' }
        }
        // Hide if already high priority
        if (priority === 'High' || priority === 'Highest') {
            return { relevance: 'hidden' }
        }
        // Recommended if stalled - maybe it needs attention
        if (isStalled) {
            return { relevance: 'recommended', reason: 'Stalled - may need priority boost' }
        }
        return { relevance: 'available' }
    }

    // ===== PUSH TO LIMIT (Transition) =====
    if (id === 'push-limit') {
        // Critical if: In review/testing too long (needs push)
        if (statusCategory === 'indeterminate' && daysInStatus > 3) {
            return { relevance: 'recommended', reason: 'Push to next stage' }
        }
        // Hide if done
        if (statusCategory === 'done') {
            return { relevance: 'hidden' }
        }
        return { relevance: 'available' }
    }

    // ===== RED FLAG (Blocker) =====
    if (id === 'red-flag') {
        // Critical if: Stalled but not yet flagged as blocked
        if (isStalled && !isBlocked) {
            return { relevance: 'critical', reason: 'Flag impediment to trigger resolution' }
        }
        // Hide if already blocked or done
        if (isBlocked || statusCategory === 'done') {
            return { relevance: 'hidden' }
        }
        return { relevance: 'available' }
    }

    // ===== SLIPSTREAM (Link) =====
    if (id === 'slipstream') {
        // Recommended if: Issue mentions other tickets in description (simplified check)
        // In real implementation, we'd analyze description for ticket patterns
        if ((issue.linkedIssues || 0) === 0) {
            return { relevance: 'available', reason: 'Check for related work' }
        }
        return { relevance: 'available' }
    }

    // ===== FUEL ADJUSTMENT (Estimate) =====
    if (id === 'fuel-adjust') {
        // Critical if: Stalled with no story points (needs estimation)
        if (isStalled && !storyPoints && boardType === 'scrum') {
            return { relevance: 'critical', reason: 'Missing estimate - calibrate!' }
        }
        // Recommended if: Large item stalled (estimate may be wrong)
        if (isStalled && (storyPoints || 0) >= 8) {
            return { relevance: 'recommended', reason: 'Large item stalled - verify estimate' }
        }
        // Hide for Kanban if not tracking points
        if (boardType === 'kanban') {
            return { relevance: 'available' }
        }
        return { relevance: 'available' }
    }

    // ===== RADIO MESSAGE (Comment) =====
    if (id === 'radio') {
        // Always available - communication is always relevant
        if (isStalled || isBlocked) {
            return { relevance: 'recommended', reason: 'Document the situation' }
        }
        return { relevance: 'available' }
    }

    // ===== PIT CREW TASK (Subtask) =====
    if (id === 'pit-crew') {
        // Hide for subtasks
        if (issueType.toLowerCase() === 'subtask') {
            return { relevance: 'hidden' }
        }
        // Recommended if: Issue needs specific work carved out
        if (isStalled && !hasSubtasks) {
            return { relevance: 'recommended', reason: 'Create targeted action item' }
        }
        return { relevance: 'available' }
    }

    return { relevance: 'available' }
}

/**
 * Get a Race Engineer-style explanation of the situation
 */
export function getSituationAnalysis(
    issue: IssueContext,
    board: BoardContext
): string {
    const insights: string[] = []

    // Board type specific opening
    if (board.boardType === 'scrum') {
        if (board.sprintDaysRemaining && board.sprintDaysRemaining <= 3) {
            insights.push(`Sprint ending in ${board.sprintDaysRemaining} days - time is critical.`)
        }
    } else if (board.boardType === 'kanban') {
        if (board.wipLimit && board.wipCurrent && board.wipCurrent > board.wipLimit) {
            insights.push(`WIP at ${board.wipCurrent}/${board.wipLimit} - flow is restricted.`)
        }
    }

    // Issue-specific analysis
    if (issue.isBlocked) {
        insights.push('🚩 RED FLAG: This issue is blocked.')
    } else if (issue.isStalled) {
        insights.push(`⚠️ HIGH DRAG: No movement for ${issue.daysInStatus} days.`)
    }

    if (issue.statusCategory === 'indeterminate' && issue.daysInStatus > 5) {
        insights.push('Tire degradation is high. Consider a strategy change.')
    }

    if (!issue.storyPoints && board.boardType === 'scrum') {
        insights.push('Missing fuel load estimate. Calibration needed.')
    }

    if (issue.hasSubtasks) {
        insights.push('Subtasks in progress - check crew status.')
    }

    if (insights.length === 0) {
        insights.push('All systems nominal. Standard strategy applies.')
    }

    return insights.join(' ')
}

export default { getRecommendedActions, getSituationAnalysis }
