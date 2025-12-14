/**
 * View Mode Configuration
 * Defines which panels are visible in each role-based view
 */

export type ViewMode = 'all' | 'developer' | 'teamlead' | 'productowner' | 'qa'

export type PanelId =
    | 'trackMap'
    | 'telemetry'
    | 'pitWallEngineer'
    | 'priorityDistribution'
    | 'testingProgress'
    | 'waitingOnMe'
    | 'standupExport'
    | 'flowMetrics'
    | 'sprintHealth'
    | 'predictiveAlerts'

export interface ViewModeConfig {
    id: ViewMode
    name: string
    emoji: string
    description: string
    visiblePanels: PanelId[]
}

// F1-themed view mode definitions
export const VIEW_MODES: Record<ViewMode, ViewModeConfig> = {
    all: {
        id: 'all',
        name: 'Race Control',
        emoji: '🏁',
        description: 'Full visibility - all panels',
        visiblePanels: [
            'trackMap',
            'telemetry',
            'pitWallEngineer',
            'priorityDistribution',
            'testingProgress',
            'waitingOnMe',
            'standupExport',
            'flowMetrics',
            'sprintHealth',
            'predictiveAlerts'
        ]
    },
    developer: {
        id: 'developer',
        name: 'Driver View',
        emoji: '👩‍💻',
        description: 'Focus on your assigned work',
        visiblePanels: [
            'trackMap',
            'telemetry',
            'pitWallEngineer',
            'waitingOnMe',
            'sprintHealth'
        ]
    },
    teamlead: {
        id: 'teamlead',
        name: 'Team Principal',
        emoji: '👨‍💼',
        description: 'Team oversight and coordination',
        visiblePanels: [
            'trackMap',
            'telemetry',
            'pitWallEngineer',
            'standupExport',
            'flowMetrics',
            'sprintHealth',
            'predictiveAlerts'
        ]
    },
    productowner: {
        id: 'productowner',
        name: 'Race Strategist',
        emoji: '📋',
        description: 'Priority and delivery focus',
        visiblePanels: [
            'trackMap',
            'pitWallEngineer',
            'priorityDistribution',
            'flowMetrics',
            'sprintHealth'
        ]
    },
    qa: {
        id: 'qa',
        name: 'Technical Director',
        emoji: '🔧',
        description: 'Quality and testing pipeline',
        visiblePanels: [
            'trackMap',
            'pitWallEngineer',
            'testingProgress',
            'sprintHealth'
        ]
    }
}

// Default view mode
export const DEFAULT_VIEW_MODE: ViewMode = 'all'

// Helper to check if a panel is visible in current mode
export function isPanelVisible(panelId: PanelId, viewMode: ViewMode): boolean {
    const config = VIEW_MODES[viewMode]
    return config?.visiblePanels.includes(panelId) ?? true
}

// Get all view mode options for dropdown
export function getViewModeOptions(): ViewModeConfig[] {
    return Object.values(VIEW_MODES)
}
