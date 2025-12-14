import { describe, it, expect } from 'vitest'
import {
    VIEW_MODES,
    DEFAULT_VIEW_MODE,
    isPanelVisible,
    getViewModeOptions,
    type ViewMode,
    type PanelId
} from '../../static/frontend/src/config/viewModeConfig'

describe('viewModeConfig', () => {
    describe('VIEW_MODES', () => {
        it('defines all 5 role-based view modes', () => {
            expect(Object.keys(VIEW_MODES)).toHaveLength(5)
            expect(VIEW_MODES).toHaveProperty('all')
            expect(VIEW_MODES).toHaveProperty('developer')
            expect(VIEW_MODES).toHaveProperty('teamlead')
            expect(VIEW_MODES).toHaveProperty('productowner')
            expect(VIEW_MODES).toHaveProperty('qa')
        })

        it('Race Control (all) shows all panels', () => {
            const allMode = VIEW_MODES.all
            expect(allMode.name).toBe('Race Control')
            expect(allMode.visiblePanels.length).toBeGreaterThanOrEqual(8)
        })

        it('Driver View (developer) shows developer-focused panels', () => {
            const devMode = VIEW_MODES.developer
            expect(devMode.name).toBe('Driver View')
            expect(devMode.visiblePanels).toContain('trackMap')
            expect(devMode.visiblePanels).toContain('waitingOnMe')
            expect(devMode.visiblePanels).not.toContain('priorityDistribution')
        })

        it('Team Principal (teamlead) shows leadership panels', () => {
            const leadMode = VIEW_MODES.teamlead
            expect(leadMode.name).toBe('Team Principal')
            expect(leadMode.visiblePanels).toContain('standupExport')
            expect(leadMode.visiblePanels).toContain('flowMetrics')
        })

        it('Race Strategist (productowner) shows priority panels', () => {
            const poMode = VIEW_MODES.productowner
            expect(poMode.name).toBe('Race Strategist')
            expect(poMode.visiblePanels).toContain('priorityDistribution')
        })

        it('Technical Director (qa) shows testing panels', () => {
            const qaMode = VIEW_MODES.qa
            expect(qaMode.name).toBe('Technical Director')
            expect(qaMode.visiblePanels).toContain('testingProgress')
        })
    })

    describe('DEFAULT_VIEW_MODE', () => {
        it('defaults to all (Race Control)', () => {
            expect(DEFAULT_VIEW_MODE).toBe('all')
        })
    })

    describe('isPanelVisible', () => {
        it('returns true for any panel in "all" mode', () => {
            expect(isPanelVisible('trackMap', 'all')).toBe(true)
            expect(isPanelVisible('priorityDistribution', 'all')).toBe(true)
            expect(isPanelVisible('testingProgress', 'all')).toBe(true)
        })

        it('filters panels for role-specific modes', () => {
            expect(isPanelVisible('waitingOnMe', 'developer')).toBe(true)
            expect(isPanelVisible('priorityDistribution', 'developer')).toBe(false)

            expect(isPanelVisible('testingProgress', 'qa')).toBe(true)
            expect(isPanelVisible('standupExport', 'qa')).toBe(false)
        })
    })

    describe('getViewModeOptions', () => {
        it('returns array of all view mode configs', () => {
            const options = getViewModeOptions()
            expect(Array.isArray(options)).toBe(true)
            expect(options).toHaveLength(5)
            expect(options[0]).toHaveProperty('id')
            expect(options[0]).toHaveProperty('name')
            expect(options[0]).toHaveProperty('emoji')
            expect(options[0]).toHaveProperty('description')
        })
    })
})
