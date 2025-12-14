import { describe, it, expect } from 'vitest'
import {
    detectFlowCategory,
    buildFlowTypeMapping,
    calculateFlowDistribution,
    calculateFlowVelocity,
    calculateFlowTime,
    FLOW_CATEGORY_F1_NAMES
} from '../../src/resolvers/flowTypeHeuristics'

describe('Flow Type Heuristics', () => {
    describe('detectFlowCategory', () => {
        it('should detect features from Story', () => {
            expect(detectFlowCategory('Story')).toBe('features')
            expect(detectFlowCategory('User Story')).toBe('features')
            expect(detectFlowCategory('Epic')).toBe('features')
            expect(detectFlowCategory('Feature')).toBe('features')
        })

        it('should detect defects from Bug', () => {
            expect(detectFlowCategory('Bug')).toBe('defects')
            expect(detectFlowCategory('Defect')).toBe('defects')
            expect(detectFlowCategory('Incident')).toBe('defects')
        })

        it('should detect risks from Spike', () => {
            expect(detectFlowCategory('Spike')).toBe('risks')
            expect(detectFlowCategory('Research')).toBe('risks')
            expect(detectFlowCategory('POC')).toBe('risks')
        })

        it('should detect debt from Tech Debt', () => {
            expect(detectFlowCategory('Tech Debt')).toBe('debt')
            expect(detectFlowCategory('Technical Debt')).toBe('debt')
            expect(detectFlowCategory('Refactor')).toBe('debt')
            expect(detectFlowCategory('Chore')).toBe('debt')
        })

        it('should classify Task as features', () => {
            expect(detectFlowCategory('Task')).toBe('features')
        })

        it('should return other for unknown types', () => {
            expect(detectFlowCategory('Custom Type XYZ')).toBe('other')
        })
    })

    describe('buildFlowTypeMapping', () => {
        it('should build mapping from issues', () => {
            const issues = [
                { issueType: 'Story' },
                { issueType: 'Bug' },
                { issueType: 'Spike' },
                { fields: { issuetype: { name: 'Tech Debt' } } }
            ]

            const mapping = buildFlowTypeMapping(issues)

            expect(mapping['Story']).toBe('features')
            expect(mapping['Bug']).toBe('defects')
            expect(mapping['Spike']).toBe('risks')
            expect(mapping['Tech Debt']).toBe('debt')
        })
    })

    describe('calculateFlowDistribution', () => {
        it('should calculate percentages correctly', () => {
            const issues = [
                { issueType: 'Story' },
                { issueType: 'Story' },
                { issueType: 'Story' },
                { issueType: 'Bug' },
                { issueType: 'Spike' }
            ]

            const distribution = calculateFlowDistribution(issues)

            expect(distribution.features.count).toBe(3)
            expect(distribution.features.percentage).toBe(60)
            expect(distribution.defects.count).toBe(1)
            expect(distribution.defects.percentage).toBe(20)
            expect(distribution.total).toBe(5)
        })
    })

    describe('calculateFlowVelocity', () => {
        it('should calculate velocity trend', () => {
            const current = [
                { statusCategory: 'done' },
                { statusCategory: 'done' },
                { statusCategory: 'indeterminate' }
            ]
            const previous = [
                { statusCategory: 'done' }
            ]

            const velocity = calculateFlowVelocity(current, previous, 'Sprint 5')

            expect(velocity.completed).toBe(2)
            expect(velocity.period).toBe('Sprint 5')
            expect(velocity.trend).toBe('up')
        })
    })

    describe('calculateFlowTime', () => {
        it('should calculate lead time statistics', () => {
            const now = Date.now()
            const issues = [
                { fields: { created: new Date(now - 48 * 60 * 60 * 1000).toISOString(), resolutiondate: new Date(now).toISOString() } }, // 48h
                { fields: { created: new Date(now - 24 * 60 * 60 * 1000).toISOString(), resolutiondate: new Date(now).toISOString() } }  // 24h
            ]

            const flowTime = calculateFlowTime(issues)

            expect(flowTime.avgHours).toBe(36) // (48+24)/2 = 36
            expect(flowTime.minHours).toBe(24)
            expect(flowTime.maxHours).toBe(48)
        })
    })

    describe('F1 Theme Names', () => {
        it('should have all categories themed', () => {
            expect(FLOW_CATEGORY_F1_NAMES.features.name).toBe('New Aero')
            expect(FLOW_CATEGORY_F1_NAMES.defects.name).toBe('Repairs')
            expect(FLOW_CATEGORY_F1_NAMES.risks.name).toBe('R&D')
            expect(FLOW_CATEGORY_F1_NAMES.debt.name).toBe('Maintenance')
        })
    })
})
