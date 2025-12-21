/**
 * Flow Type Heuristics - Auto-detection for SAFe Flow Metrics
 * Maps Jira issue types to SAFe flow categories using smart heuristics
 */

export type FlowCategory = 'features' | 'defects' | 'risks' | 'debt' | 'other'

// Heuristic patterns for auto-detecting flow categories from Jira issue type names
const FLOW_TYPE_PATTERNS: Record<FlowCategory, RegExp[]> = {
    features: [
        /story/i,
        /epic/i,
        /feature/i,
        /enhancement/i,
        /requirement/i,
        /user.?story/i,
        /capability/i,
        /initiative/i,
        /objective/i
    ],
    defects: [
        /bug/i,
        /defect/i,
        /incident/i,
        /problem/i,
        /error/i,
        /fault/i,
        /issue/i,
        /regression/i
    ],
    risks: [
        /risk/i,
        /spike/i,
        /research/i,
        /investigation/i,
        /poc/i,
        /prototype/i,
        /experiment/i,
        /exploration/i,
        /technical.?discovery/i
    ],
    debt: [
        /tech.?debt/i,
        /technical.?debt/i,
        /debt/i,
        /refactor/i,
        /improvement/i,
        /chore/i,
        /maintenance/i,
        /cleanup/i,
        /deprecation/i,
        /upgrade/i
    ],
    other: [] // Catch-all, no patterns
}

// F1 Theme names for each flow category
export const FLOW_CATEGORY_F1_NAMES: Record<FlowCategory, { name: string; color: string }> = {
    features: { name: 'New Aero', color: '#39FF14' },       // Green - power
    defects: { name: 'Repairs', color: '#FF0033' },         // Red - problems
    risks: { name: 'R&D', color: '#BF5AF2' },               // Purple - research
    debt: { name: 'Maintenance', color: '#F4D03F' },        // Yellow - caution
    other: { name: 'Support', color: '#888888' }            // Gray - neutral
}

/**
 * Detect flow category from issue type name using heuristics
 */
export function detectFlowCategory(issueTypeName: string): FlowCategory {
    const normalized = (issueTypeName || '').toLowerCase().trim()

    // Check each category's patterns
    for (const [category, patterns] of Object.entries(FLOW_TYPE_PATTERNS) as [FlowCategory, RegExp[]][]) {
        if (category === 'other') continue // Skip other, it's the fallback
        if (patterns.some(pattern => pattern.test(normalized))) {
            return category
        }
    }

    // Default: If it's a Task, classify as feature (common pattern)
    if (/task/i.test(normalized)) {
        return 'features'
    }

    return 'other'
}

/**
 * Build a mapping of all issue types in a set of issues to their flow categories
 */
export function buildFlowTypeMapping(issues: Array<{ issueType?: string; fields?: { issuetype?: { name: string } } }>): Record<string, FlowCategory> {
    const mapping: Record<string, FlowCategory> = {}

    for (const issue of issues) {
        const typeName = issue.issueType || issue.fields?.issuetype?.name || 'Unknown'
        if (!mapping[typeName]) {
            mapping[typeName] = detectFlowCategory(typeName)
        }
    }

    return mapping
}

/**
 * Get flow category for a specific issue
 */
export function getIssueFlowCategory(issue: any, typeMapping?: Record<string, FlowCategory>): FlowCategory {
    const typeName = issue.issueType || issue.fields?.issuetype?.name || 'Unknown'

    if (typeMapping && typeMapping[typeName]) {
        return typeMapping[typeName]
    }

    return detectFlowCategory(typeName)
}

/**
 * Calculate Flow Distribution - percentage of each flow category
 */
export interface FlowDistribution {
    features: { count: number; percentage: number }
    defects: { count: number; percentage: number }
    risks: { count: number; percentage: number }
    debt: { count: number; percentage: number }
    other: { count: number; percentage: number }
    total: number
}

export function calculateFlowDistribution(issues: any[], typeMapping?: Record<string, FlowCategory>): FlowDistribution {
    const counts: Record<FlowCategory, number> = {
        features: 0,
        defects: 0,
        risks: 0,
        debt: 0,
        other: 0
    }

    for (const issue of issues) {
        const category = getIssueFlowCategory(issue, typeMapping)
        counts[category]++
    }

    const total = issues.length || 1 // Avoid division by zero

    return {
        features: { count: counts.features, percentage: Math.round((counts.features / total) * 100) },
        defects: { count: counts.defects, percentage: Math.round((counts.defects / total) * 100) },
        risks: { count: counts.risks, percentage: Math.round((counts.risks / total) * 100) },
        debt: { count: counts.debt, percentage: Math.round((counts.debt / total) * 100) },
        other: { count: counts.other, percentage: Math.round((counts.other / total) * 100) },
        total
    }
}

/**
 * Calculate Flow Velocity - completed items per period
 */
export interface FlowVelocity {
    completed: number
    period: string
    trend: 'up' | 'down' | 'stable'
    changePercent: number
}

export function calculateFlowVelocity(
    currentPeriodIssues: any[],
    previousPeriodIssues: any[],
    periodName: string = 'Sprint'
): FlowVelocity {
    const current = currentPeriodIssues.filter(i =>
        i.statusCategory === 'done' || i.fields?.status?.statusCategory?.key === 'done'
    ).length

    const previous = previousPeriodIssues.filter(i =>
        i.statusCategory === 'done' || i.fields?.status?.statusCategory?.key === 'done'
    ).length

    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
    const trend: 'up' | 'down' | 'stable' =
        change > 5 ? 'up' :
            change < -5 ? 'down' :
                'stable'

    return {
        completed: current,
        period: periodName,
        trend,
        changePercent: Math.round(Math.abs(change))
    }
}

/**
 * Calculate Flow Time (Lead Time) statistics
 */
export interface FlowTime {
    avgHours: number
    medianHours: number
    p85Hours: number  // 85th percentile
    minHours: number
    maxHours: number
}

export function calculateFlowTime(issues: any[]): FlowTime {
    const leadTimes: number[] = []

    for (const issue of issues) {
        const created = issue.fields?.created || issue.created
        const resolved = issue.fields?.resolutiondate || issue.resolved

        if (created && resolved) {
            const createdDate = new Date(created).getTime()
            const resolvedDate = new Date(resolved).getTime()
            const hours = (resolvedDate - createdDate) / (1000 * 60 * 60)
            if (hours > 0) leadTimes.push(hours)
        }
    }

    if (leadTimes.length === 0) {
        return { avgHours: 0, medianHours: 0, p85Hours: 0, minHours: 0, maxHours: 0 }
    }

    leadTimes.sort((a, b) => a - b)

    const sum = leadTimes.reduce((a, b) => a + b, 0)
    const avg = sum / leadTimes.length
    const median = leadTimes[Math.floor(leadTimes.length / 2)]
    const p85Index = Math.floor(leadTimes.length * 0.85)
    const p85 = leadTimes[p85Index] || leadTimes[leadTimes.length - 1]

    return {
        avgHours: Math.round(avg),
        medianHours: Math.round(median),
        p85Hours: Math.round(p85),
        minHours: Math.round(leadTimes[0]),
        maxHours: Math.round(leadTimes[leadTimes.length - 1])
    }
}

/**
 * Calculate Flow Load (WIP) - already exists, but adding categorized version
 */
export interface FlowLoad {
    total: number
    byCategory: Record<FlowCategory, number>
    limit: number
    loadPercent: number
}

export function calculateFlowLoad(
    issues: any[],
    wipLimit: number = 10,
    typeMapping?: Record<string, FlowCategory>
): FlowLoad {
    const inProgress = issues.filter(i =>
        i.statusCategory === 'indeterminate' || i.fields?.status?.statusCategory?.key === 'indeterminate'
    )

    const byCategory: Record<FlowCategory, number> = {
        features: 0,
        defects: 0,
        risks: 0,
        debt: 0,
        other: 0
    }

    for (const issue of inProgress) {
        const category = getIssueFlowCategory(issue, typeMapping)
        byCategory[category]++
    }

    return {
        total: inProgress.length,
        byCategory,
        limit: wipLimit,
        loadPercent: Math.round((inProgress.length / wipLimit) * 100)
    }
}

/**
 * Complete Flow Metrics calculation
 */
export interface FlowMetrics {
    distribution: FlowDistribution
    velocity: FlowVelocity
    flowTime: FlowTime
    flowLoad: FlowLoad
    typeMapping: Record<string, FlowCategory>
    detectedTypes: string[]
}

export function calculateAllFlowMetrics(
    currentIssues: any[],
    previousIssues: any[] = [],
    sprintName: string = 'Current Sprint',
    wipLimit: number = 10
): FlowMetrics {
    const typeMapping = buildFlowTypeMapping(currentIssues)

    return {
        distribution: calculateFlowDistribution(currentIssues, typeMapping),
        velocity: calculateFlowVelocity(currentIssues, previousIssues, sprintName),
        flowTime: calculateFlowTime(currentIssues.filter(i =>
            i.statusCategory === 'done' || i.fields?.status?.statusCategory?.key === 'done'
        )),
        flowLoad: calculateFlowLoad(currentIssues, wipLimit, typeMapping),
        typeMapping,
        detectedTypes: Object.keys(typeMapping)
    }
}
