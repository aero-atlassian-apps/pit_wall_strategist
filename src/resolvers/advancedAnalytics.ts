/**
 * Advanced Analytics Engine
 * 
 * Implements predictive intelligence and Lean/Agile best practices:
 * - Sprint Health Predictor
 * - Pre-Stall Warning System
 * - WIP Aging Alert (Kanban)
 * - Bottleneck Detector (Theory of Constraints)
 * - Smart Capacity Analysis
 */

import type { JiraIssue } from '../types/jira'
import { resolveCategoryFromId } from './statusMap'
import { MetricValidity, DEFAULT_METRIC_VALIDITY } from '../domain/types/Context'

// ============================================================================
// TYPES
// ============================================================================

export interface SprintHealthPrediction {
    score: number // 0-100
    status: 'GREEN_FLAG' | 'YELLOW_FLAG' | 'RED_FLAG' | 'NOT_APPLICABLE'
    message: string
    factors: {
        velocityFactor: number
        timeFactor: number
        stalledFactor: number
        scopeFactor: number
    }
    recommendation: string
}

export interface PreStallWarning {
    issueKey: string
    summary: string
    assignee: string | null
    hoursInStatus: number
    threshold: number
    percentToStall: number
    riskLevel: 'WATCH' | 'WARNING' | 'CRITICAL'
    recommendation: string
}

export interface WIPAgingItem {
    issueKey: string
    summary: string
    assignee: string | null
    daysInProgress: number
    cycleTimeP85: number
    agingRatio: number // >1 means overdue
    riskLevel: 'NORMAL' | 'AGING' | 'CRITICAL'
}

export interface BottleneckAnalysis {
    bottleneckStatus: string
    avgHoursInBottleneck: number
    issuesInBottleneck: number
    percentOfFlow: number
    impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    recommendation: string
    f1Metaphor: string
}

export interface TeamCapacity {
    accountId: string
    displayName: string
    currentWIP: number
    wipLimit: number
    averageCycleTimeDays: number
    availability: 'AVAILABLE' | 'AT_CAPACITY' | 'OVERLOADED'
    recommendation: string
}

export interface AdvancedAnalytics {
    sprintHealth: SprintHealthPrediction
    preStallWarnings: PreStallWarning[]
    wipAging: WIPAgingItem[]
    bottleneck: BottleneckAnalysis | null
    teamCapacity: TeamCapacity[]
    scopeCreep: {
        detected: boolean
        addedCount: number
        addedPoints: number
        message: string
        notApplicable?: boolean
    }
}

// ============================================================================
// SPRINT HEALTH PREDICTOR
// ============================================================================

export function calculateSprintHealth(
    issues: JiraIssue[],
    sprintStartDate: Date | null,
    sprintEndDate: Date | null,
    validity: MetricValidity = DEFAULT_METRIC_VALIDITY,
    historicalVelocity: number = 20,
    storyPointsFields: string[] = [],
    boardType: string = 'scrum',
    stalledThresholdHours: number = 24
): SprintHealthPrediction {
    // STRICT CHECK: If sprintHealth is hidden, return early
    if (validity.sprintHealth === 'hidden') {
        return {
            score: 0,
            status: 'NOT_APPLICABLE',
            message: 'Sprint health not applicable to this context.',
            factors: { velocityFactor: 0, timeFactor: 0, stalledFactor: 0, scopeFactor: 0 },
            recommendation: ''
        };
    }

    const now = new Date()

    // Context-aware Terminology
    const isScrum = boardType === 'scrum'

    // Calculate completion metrics
    const doneIssues = issues.filter(i => i.fields.status?.statusCategory?.key === 'done')
    const totalIssues = issues.length
    const inProgressIssues = issues.filter(i => i.fields.status?.statusCategory?.key === 'indeterminate')
    const stalledCount = issues.filter(i => isStalled(i, stalledThresholdHours)).length

    // Story points calculation
    const getPoints = (issue: JiraIssue) => {
        if (!storyPointsFields || storyPointsFields.length === 0) return 0;
        for (const f of storyPointsFields) {
            const v = (issue.fields as any)[f];
            if (typeof v === 'number') return v;
        }
        return 0;
    };

    const isPointsMode = storyPointsFields && storyPointsFields.length > 0;
    const completedPoints = doneIssues.reduce((sum, i) => sum + getPoints(i), 0);
    const totalPoints = issues.reduce((sum, i) => sum + getPoints(i), 0);

    // Progress metrics - fallback to counts only if explicitly no points found and it's not a restricted project
    const usePoints = isPointsMode && totalPoints > 0;
    const actualProgress = usePoints ? (completedPoints / totalPoints) : (doneIssues.length / (totalIssues || 1));

    // Time factor
    let timeFactor = 1.0;
    if (sprintStartDate && sprintEndDate) {
        const sprintDuration = sprintEndDate.getTime() - sprintStartDate.getTime();
        const elapsed = now.getTime() - sprintStartDate.getTime();

        // Expected progress based on time elapsed
        const expectedProgress = Math.min(1, Math.max(0, elapsed / sprintDuration));

        // timeFactor > 1 means ahead of schedule, < 1 means behind
        // We use a safe floor for expectedProgress to avoid division by zero
        timeFactor = actualProgress / (expectedProgress || 0.1);

        // Cap timeFactor to reasonable range for scoring (0.0 to 2.0)
        timeFactor = Math.min(2.0, timeFactor);
    }

    // Velocity / Pace factor (normalized to historical or commitment)
    let velocityFactor = 1.0;
    if (sprintStartDate && sprintEndDate && historicalVelocity > 0) {
        const sprintDuration = sprintEndDate.getTime() - sprintStartDate.getTime();
        const elapsed = now.getTime() - sprintStartDate.getTime();
        const expectedProgress = Math.min(1, Math.max(0, elapsed / sprintDuration));

        const targetNow = historicalVelocity * expectedProgress;
        velocityFactor = targetNow > 0 ? (completedPoints || doneIssues.length) / targetNow : 1.0;
    } else if (historicalVelocity > 0) {
        velocityFactor = (completedPoints || doneIssues.length) / historicalVelocity;
    }
    velocityFactor = Math.min(1.5, Math.max(0, velocityFactor));

    // Stalled factor (inverse - more stalled = lower score)
    const stalledRatio = totalIssues > 0 ? stalledCount / totalIssues : 0;
    const stalledFactor = Math.max(0, 1 - (stalledRatio * 2)); // Aggressive penalty for stalled items

    // Scope factor (Commitment vs Capacity)
    // Also penalize extreme WIP
    const wipRatio = totalIssues > 0 ? inProgressIssues.length / totalIssues : 0;
    const wipPenalty = wipRatio > 0.5 ? (wipRatio - 0.5) : 0; // Penalty starts after 50% WIP
    const scopeFactor = Math.max(0, 1 - wipPenalty);

    // Combined score (Weighted)
    const rawScore = (
        (timeFactor * 0.35) +
        (velocityFactor * 0.25) +
        (stalledFactor * 0.25) +
        (scopeFactor * 0.15)
    ) * 100;

    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    // Determine status and message
    let status: SprintHealthPrediction['status']
    let message: string
    let recommendation: string

    if (score >= 80) {
        status = 'GREEN_FLAG'
        message = isScrum
            ? 'Sprint on track for podium finish! Maintain current pace.'
            : 'Flow stable. Green flag conditions.'
        recommendation = 'Keep pushing. No intervention needed.'
    } else if (score >= 50) {
        status = 'YELLOW_FLAG'
        message = isScrum
            ? 'Pace dropping. Tire degradation detected.'
            : 'Throughput degradation detected. Pace dropping.'
        recommendation = stalledCount > 0
            ? `Address ${stalledCount} stalled issue(s) immediately.`
            : 'Review WIP and consider pairing on complex items.'
    } else {
        status = 'RED_FLAG'
        message = isScrum
            ? 'Sprint at risk. Immediate intervention required.'
            : 'Process stalled. Immediate intervention required.'
        recommendation = stalledCount > 2
            ? 'Critical: Triage stalled items. Consider scope reduction.'
            : 'Escalate blockers and redistribute workload.'
    }

    return {
        score,
        status,
        message,
        factors: {
            velocityFactor: Math.round(velocityFactor * 100) / 100,
            timeFactor: Math.round(timeFactor * 100) / 100,
            stalledFactor: Math.round(stalledFactor * 100) / 100,
            scopeFactor: Math.round(scopeFactor * 100) / 100
        },
        recommendation
    }
}

// ============================================================================
// PRE-STALL WARNING SYSTEM
// ============================================================================

export function detectPreStallWarnings(
    issues: JiraIssue[],
    stalledThresholdHours: number = 24
): PreStallWarning[] {
    const warnings: PreStallWarning[] = []
    const warningThreshold = stalledThresholdHours * 0.7 // 70% of stall threshold
    const watchThreshold = stalledThresholdHours * 0.5 // 50% of stall threshold

    const inProgressIssues = issues.filter(i =>
        i.fields.status?.statusCategory?.key === 'indeterminate'
    )

    for (const issue of inProgressIssues) {
        const hoursInStatus = getHoursInCurrentStatus(issue)

        if (hoursInStatus >= watchThreshold && hoursInStatus < stalledThresholdHours) {
            const percentToStall = (hoursInStatus / stalledThresholdHours) * 100

            let riskLevel: PreStallWarning['riskLevel']
            let recommendation: string

            if (percentToStall >= 85) {
                riskLevel = 'CRITICAL'
                recommendation = 'Immediate action required. Check for blockers or reassign.'
            } else if (percentToStall >= 70) {
                riskLevel = 'WARNING'
                recommendation = 'Review progress. Consider breaking down or getting help.'
            } else {
                riskLevel = 'WATCH'
                recommendation = 'Monitor closely. Ensure no hidden blockers.'
            }

            warnings.push({
                issueKey: issue.key,
                summary: issue.fields.summary || '',
                assignee: issue.fields.assignee?.displayName || null,
                hoursInStatus: Math.round(hoursInStatus),
                threshold: stalledThresholdHours,
                percentToStall: Math.round(percentToStall),
                riskLevel,
                recommendation
            })
        }
    }

    // Sort by risk level (critical first)
    return warnings.sort((a, b) => {
        const order = { CRITICAL: 0, WARNING: 1, WATCH: 2 }
        return order[a.riskLevel] - order[b.riskLevel]
    })
}

// ============================================================================
// WIP AGING ALERT (Kanban)
// ============================================================================

export function analyzeWIPAging(
    issues: JiraIssue[],
    allHistoricalIssues?: JiraIssue[]
): WIPAgingItem[] {
    const inProgressIssues = issues.filter(i =>
        i.fields.status?.statusCategory?.key === 'indeterminate'
    )

    // Calculate 85th percentile cycle time
    const cycleTimes = (allHistoricalIssues || issues)
        .filter(i => i.fields.status?.statusCategory?.key === 'done')
        .map(i => getDaysToComplete(i))
        .filter(d => d > 0)
        .sort((a, b) => a - b)

    const cycleTimeP85 = cycleTimes.length > 0
        ? cycleTimes[Math.floor(cycleTimes.length * 0.85)] || 7
        : 7 // Default 7 days

    const agingItems: WIPAgingItem[] = []

    for (const issue of inProgressIssues) {
        const daysInProgress = getDaysInProgress(issue)
        const agingRatio = daysInProgress / cycleTimeP85

        let riskLevel: WIPAgingItem['riskLevel']
        if (agingRatio > 1.5) {
            riskLevel = 'CRITICAL'
        } else if (agingRatio > 1) {
            riskLevel = 'AGING'
        } else {
            riskLevel = 'NORMAL'
        }

        if (riskLevel !== 'NORMAL') {
            agingItems.push({
                issueKey: issue.key,
                summary: issue.fields.summary || '',
                assignee: issue.fields.assignee?.displayName || null,
                daysInProgress: Math.round(daysInProgress * 10) / 10,
                cycleTimeP85: Math.round(cycleTimeP85 * 10) / 10,
                agingRatio: Math.round(agingRatio * 100) / 100,
                riskLevel
            })
        }
    }

    return agingItems.sort((a, b) => b.agingRatio - a.agingRatio)
}

// ============================================================================
// BOTTLENECK DETECTOR (Theory of Constraints)
// ============================================================================

export async function detectBottleneck(
    issues: JiraIssue[],
    projectKey: string
): Promise<BottleneckAnalysis | null> {
    // Group issues by current status
    const statusGroups: Record<string, { count: number; totalHours: number; issues: JiraIssue[] }> = {}

    const inProgressIssues = issues.filter(i =>
        i.fields.status?.statusCategory?.key === 'indeterminate'
    )

    for (const issue of inProgressIssues) {
        const statusName = issue.fields.status?.name || 'Unknown'
        if (!statusGroups[statusName]) {
            statusGroups[statusName] = { count: 0, totalHours: 0, issues: [] }
        }
        statusGroups[statusName].count++
        statusGroups[statusName].totalHours += getHoursInCurrentStatus(issue)
        statusGroups[statusName].issues.push(issue)
    }

    // Find bottleneck (status with most issues OR highest avg time)
    let bottleneck: { name: string; avgHours: number; count: number } | null = null

    for (const [statusName, data] of Object.entries(statusGroups)) {
        const avgHours = data.count > 0 ? data.totalHours / data.count : 0

        if (!bottleneck || data.count > bottleneck.count) {
            bottleneck = { name: statusName, avgHours, count: data.count }
        }
    }

    if (!bottleneck || bottleneck.count < 2) {
        return null // No significant bottleneck
    }

    const totalInProgress = inProgressIssues.length
    const percentOfFlow = (bottleneck.count / totalInProgress) * 100

    // Determine impact
    let impact: BottleneckAnalysis['impact']
    if (percentOfFlow > 60) {
        impact = 'CRITICAL'
    } else if (percentOfFlow > 40) {
        impact = 'HIGH'
    } else if (percentOfFlow > 25) {
        impact = 'MEDIUM'
    } else {
        impact = 'LOW'
    }

    // Generate recommendations based on common bottleneck patterns
    let recommendation: string
    let f1Metaphor: string
    const statusLower = bottleneck.name.toLowerCase()

    if (statusLower.includes('review') || statusLower.includes('pr')) {
        recommendation = 'Add reviewers or implement async code review. Consider pair programming to reduce review queue.'
        f1Metaphor = 'Pit lane congestion! Too many cars waiting for tire change. Add pit crew members.'
    } else if (statusLower.includes('test') || statusLower.includes('qa')) {
        recommendation = 'Automate test cases or add QA capacity. Consider shifting testing left.'
        f1Metaphor = 'Scrutineering delay! Cars stuck in technical inspection. Streamline the process.'
    } else if (statusLower.includes('deploy') || statusLower.includes('release')) {
        recommendation = 'Automate deployment pipeline. Consider smaller, more frequent releases.'
        f1Metaphor = 'Cars backed up at pit exit! Clear the lane with faster releases.'
    } else if (statusLower.includes('blocked') || statusLower.includes('waiting')) {
        recommendation = 'Escalate dependencies immediately. Identify and remove external blockers.'
        f1Metaphor = 'Safety car on track! External dependencies holding up the race.'
    } else {
        recommendation = `Review "${bottleneck.name}" process for optimization opportunities.`
        f1Metaphor = `Traffic jam in sector "${bottleneck.name}". Clear the track!`
    }

    return {
        bottleneckStatus: bottleneck.name,
        avgHoursInBottleneck: Math.round(bottleneck.avgHours),
        issuesInBottleneck: bottleneck.count,
        percentOfFlow: Math.round(percentOfFlow),
        impact,
        recommendation,
        f1Metaphor
    }
}

// ============================================================================
// TEAM CAPACITY ANALYSIS
// ============================================================================

export function analyzeTeamCapacity(
    issues: JiraIssue[],
    wipLimitPerPerson: number = 3
): TeamCapacity[] {
    const assigneeMap: Record<string, {
        accountId: string
        displayName: string
        inProgress: JiraIssue[]
        completed: JiraIssue[]
    }> = {}

    for (const issue of issues) {
        const assignee = issue.fields.assignee
        if (!assignee || !assignee.accountId) continue

        if (!assigneeMap[assignee.accountId]) {
            assigneeMap[assignee.accountId] = {
                accountId: assignee.accountId,
                displayName: assignee.displayName || 'Unknown',
                inProgress: [],
                completed: []
            }
        }

        if (issue.fields.status?.statusCategory?.key === 'indeterminate') {
            assigneeMap[assignee.accountId].inProgress.push(issue)
        } else if (issue.fields.status?.statusCategory?.key === 'done') {
            assigneeMap[assignee.accountId].completed.push(issue)
        }
    }

    const capacities: TeamCapacity[] = []

    for (const data of Object.values(assigneeMap)) {
        const currentWIP = data.inProgress.length

        // Calculate average cycle time for completed issues
        const cycleTimes = data.completed
            .map(i => getDaysToComplete(i))
            .filter(d => d > 0)
        const avgCycleTime = cycleTimes.length > 0
            ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
            : 0

        let availability: TeamCapacity['availability']
        let recommendation: string

        if (currentWIP < wipLimitPerPerson) {
            availability = 'AVAILABLE'
            recommendation = `Has capacity for ${wipLimitPerPerson - currentWIP} more item(s).`
        } else if (currentWIP === wipLimitPerPerson) {
            availability = 'AT_CAPACITY'
            recommendation = 'At WIP limit. Complete current work before taking more.'
        } else {
            availability = 'OVERLOADED'
            recommendation = `Over limit by ${currentWIP - wipLimitPerPerson}. Consider reassigning.`
        }

        capacities.push({
            accountId: data.accountId,
            displayName: data.displayName,
            currentWIP,
            wipLimit: wipLimitPerPerson,
            averageCycleTimeDays: Math.round(avgCycleTime * 10) / 10,
            availability,
            recommendation
        })
    }

    // Sort: available first, then by lowest WIP
    return capacities.sort((a, b) => {
        const availOrder = { AVAILABLE: 0, AT_CAPACITY: 1, OVERLOADED: 2 }
        if (availOrder[a.availability] !== availOrder[b.availability]) {
            return availOrder[a.availability] - availOrder[b.availability]
        }
        return a.currentWIP - b.currentWIP
    })
}

// ============================================================================
// SCOPE CREEP DETECTOR
// ============================================================================

/**
 * M-009 FIX: Detect scope creep by checking both issue creation AND sprint field changes in changelog.
 * An issue added mid-sprint may have been created before the sprint started.
 */
export function detectScopeCreep(
    issues: JiraIssue[],
    sprintStartDate: Date | null,
    validity: MetricValidity = DEFAULT_METRIC_VALIDITY,
    storyPointsFields: string[] = []
): { detected: boolean; addedCount: number; addedPoints: number; message: string; addedMidSprint: number; notApplicable?: boolean } {

    // STRICT CHECK: If Scope Creep is hidden (e.g. Kanban/Business), return valid N/A state
    if (validity.scopeCreep === 'hidden') {
        return {
            detected: false,
            addedCount: 0,
            addedPoints: 0,
            message: 'Scope tracking not applicable in this context.',
            addedMidSprint: 0,
            notApplicable: true
        }
    }

    if (!sprintStartDate) {
        return { detected: false, addedCount: 0, addedPoints: 0, message: 'No sprint start date available', addedMidSprint: 0, notApplicable: true }
    }

    const sprintStartTime = sprintStartDate.getTime();
    let addedMidSprint = 0;

    const addedAfterStart = issues.filter(issue => {
        const createdStr = issue.fields.created
        if (!createdStr) return false
        const createdTime = new Date(createdStr).getTime()

        // Case 1: Issue was created after sprint started
        if (createdTime > sprintStartTime) {
            return true
        }

        // Case 2 (M-009): Issue existed before but was ADDED to sprint after start
        // Check changelog for sprint field changes
        if (issue.changelog?.histories) {
            for (const h of issue.changelog.histories) {
                const historyTime = new Date(h.created!).getTime();
                if (historyTime > sprintStartTime) {
                    const sprintChange = h.items?.find((it: any) =>
                        it.field === 'Sprint' || it.field?.toLowerCase().includes('sprint')
                    );
                    if (sprintChange) {
                        addedMidSprint++;
                        return true; // Issue was moved into sprint mid-sprint
                    }
                }
            }
        }

        return false;
    })

    const addedCount = addedAfterStart.length
    const addedPoints = addedAfterStart.reduce((sum, i) => {
        if (!storyPointsFields.length) return sum;
        let v = 0;
        for (const f of storyPointsFields) {
            const val = (i.fields as any)[f];
            if (typeof val === 'number') { v = val; break; }
        }
        return sum + v;
    }, 0);

    const detected = addedCount >= 2 || addedPoints >= 5

    let message: string
    if (!detected) {
        message = 'Scope stable. No significant additions.'
    } else if (addedCount <= 3) {
        message = `Minor scope increase: ${addedCount} issue(s) added${addedMidSprint > 0 ? ` (${addedMidSprint} moved mid-sprint)` : ''}.`
    } else {
        message = `⚠️ Significant scope increase: ${addedCount} issues (${addedPoints} pts) added${addedMidSprint > 0 ? ` (${addedMidSprint} moved mid-sprint)` : ''}!`
    }

    return { detected, addedCount, addedPoints, message, addedMidSprint }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isStalled(issue: JiraIssue, thresholdHours: number = 24): boolean {
    if (issue.fields.status?.statusCategory?.key !== 'indeterminate') return false
    return getHoursInCurrentStatus(issue) > thresholdHours
}

/**
 * B-002 FIX: Use changelog to find when status ACTUALLY changed.
 */
function getHoursInCurrentStatus(issue: JiraIssue): number {
    const histories = issue.changelog?.histories || []

    // Search from most recent to oldest for last status change
    for (let i = histories.length - 1; i >= 0; i--) {
        const h = histories[i]
        const statusChange = (h.items || []).find((it: any) => it.field === 'status')
        if (statusChange && h.created) {
            // Found the last status change - calculate time since then
            const changeTime = new Date(h.created).getTime()
            return (Date.now() - changeTime) / (1000 * 60 * 60)
        }
    }

    // No changelog available: Fallback to created date for new issues,
    const created = issue.fields.created
    if (created) {
        const createdTime = new Date(created).getTime()
        const updatedTime = issue.fields.updated ? new Date(issue.fields.updated).getTime() : createdTime

        // If created and updated are very close, this is likely a new issue
        if (updatedTime - createdTime < 60000) { // Within 1 minute
            return (Date.now() - createdTime) / (1000 * 60 * 60)
        }
    }

    // Final fallback: use updated (less accurate but better than 0)
    const updatedStr = issue.fields.updated
    if (!updatedStr) return 0
    return (Date.now() - new Date(updatedStr).getTime()) / (1000 * 60 * 60)
}

/**
 * B-001 FIX: Use status category from changelog instead of heuristic name matching.
 * CHAMELEON COMPLIANT: No string guessing.
 */
function getDaysInProgress(issue: JiraIssue, statusMap?: any): number {
    const histories = issue.changelog?.histories || []
    let inProgressStart: number | null = null

    // Sort histories chronologically
    const sortedHistories = [...histories].sort(
        (a, b) => new Date(a.created!).getTime() - new Date(b.created!).getTime()
    )

    for (const h of sortedHistories) {
        const statusChange = (h.items || []).find((it: any) => it.field === 'status')
        if (statusChange) {
            const toId = statusChange.to
            const toName = (statusChange.toString || '').toLowerCase()

            // B-001 FIX: Chameleon-compliant status category detection
            let isInProgress = false

            // Priority 1: Check if changelog item includes statusCategory (newer Jira API)
            const toCategoryKey = (statusChange as any).toStatusCategory?.key
            if (toCategoryKey) {
                isInProgress = toCategoryKey === 'indeterminate'
            }
            // Priority 2: Use statusMap lookup by ID
            else if (statusMap && toId) {
                const resolvedCat = resolveCategoryFromId(statusMap, toId)
                if (resolvedCat) {
                    isInProgress = resolvedCat === 'indeterminate'
                }
            }
            // NO HEURISTIC FALLBACKS. If we don't know, we don't guess.

            if (isInProgress) {
                inProgressStart = new Date(h.created!).getTime()
                break // Use first in-progress transition
            }
        }
    }

    // Fallback: if no changelog or no in-progress found, use created date as proxy
    // IF the current status is known to be indeterminate.
    if (!inProgressStart) {
        if (issue.fields.status?.statusCategory?.key === 'indeterminate') {
            const createdStr = issue.fields.created
            if (createdStr) inProgressStart = new Date(createdStr).getTime()
        }
    }

    if (!inProgressStart) return 0; // Not in progress

    return (Date.now() - inProgressStart) / (1000 * 60 * 60 * 24)
}

function getDaysToComplete(issue: JiraIssue): number {
    const createdStr = issue.fields.created
    if (!createdStr) return 0
    const created = new Date(createdStr)
    const resolvedStr = issue.fields.resolutiondate || issue.fields.updated
    if (!resolvedStr) return 0
    const resolved = new Date(resolvedStr)
    return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
}

// ============================================================================
// MAIN ANALYTICS FUNCTION
// ============================================================================

export async function getAdvancedAnalytics(
    issues: JiraIssue[],
    projectKey: string,
    sprintStartDate: Date | null,
    sprintEndDate: Date | null,
    validity: MetricValidity, // NEW REQUIRED ARG
    config: {
        historicalVelocity?: number
        stalledThresholdHours?: number
        wipLimitPerPerson?: number
        storyPointsFields?: string[]
    } = {},
    boardType: string = 'scrum'
): Promise<AdvancedAnalytics> {
    const {
        historicalVelocity = 20,
        stalledThresholdHours = 24,
        wipLimitPerPerson = 3,
        storyPointsFields = []
    } = config

    // Calculate all analytics - C-009 FIX: Pass threshold to sprintHealth
    const sprintHealth = calculateSprintHealth(
        issues, sprintStartDate, sprintEndDate, validity, historicalVelocity, storyPointsFields, boardType, stalledThresholdHours
    )

    const preStallWarnings = detectPreStallWarnings(issues, stalledThresholdHours)

    const wipAging = analyzeWIPAging(issues)

    const bottleneck = await detectBottleneck(issues, projectKey)

    const teamCapacity = analyzeTeamCapacity(issues, wipLimitPerPerson)

    const scopeCreep = detectScopeCreep(issues, sprintStartDate, validity, storyPointsFields)

    return {
        sprintHealth,
        preStallWarnings,
        wipAging,
        bottleneck,
        teamCapacity,
        scopeCreep
    }
}

export default {
    calculateSprintHealth,
    detectPreStallWarnings,
    analyzeWIPAging,
    detectBottleneck,
    analyzeTeamCapacity,
    detectScopeCreep,
    getAdvancedAnalytics
}
