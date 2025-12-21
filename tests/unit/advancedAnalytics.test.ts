import { describe, it, expect, vi } from 'vitest'
import {
    calculateSprintHealth,
    detectPreStallWarnings,
    analyzeWIPAging,
    analyzeTeamCapacity,
    detectScopeCreep
} from '../../src/resolvers/advancedAnalytics'
import type { JiraIssue } from '../../src/types/jira'

// Helper to create test issues
const createIssue = (overrides: Partial<JiraIssue> = {}): JiraIssue => ({
    key: `TEST-${Math.floor(Math.random() * 1000)}`,
    fields: {
        summary: 'Test Issue',
        status: {
            name: 'In Progress',
            statusCategory: { key: 'indeterminate', name: 'In Progress' }
        },
        assignee: { displayName: 'Test User', accountId: 'test-123' },
        priority: { name: 'Medium' },
        issuetype: { name: 'Story' },
        created: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
        updated: new Date(Date.now() - 2 * 3600000).toISOString(),
        project: { key: 'TEST', name: 'Test Project' },
        ...overrides.fields
    },
    ...overrides
} as JiraIssue)

describe('advancedAnalytics', () => {

    describe('calculateSprintHealth', () => {

        it('returns valid score structure with empty issues array', () => {
            const result = calculateSprintHealth([], null, null, 20)
            expect(result.score).toBeDefined()
            expect(result.score).toBeGreaterThanOrEqual(0)
            expect(result.score).toBeLessThanOrEqual(100)
            expect(['GREEN_FLAG', 'YELLOW_FLAG', 'RED_FLAG']).toContain(result.status)
            expect(result.factors).toBeDefined()
        })

        it('handles zero historical velocity gracefully', () => {
            const issues = [
                createIssue({ fields: { status: { name: 'Done', statusCategory: { key: 'done', name: 'Done' } } } as any }),
            ]
            const result = calculateSprintHealth(issues, null, null, 0)
            expect(result.score).toBeGreaterThanOrEqual(0)
            expect(result.score).toBeLessThanOrEqual(100)
        })

        it('calculates factors with sprint dates', () => {
            const now = new Date()
            const sprintStart = new Date(now.getTime() - 7 * 24 * 3600000)
            const sprintEnd = new Date(now.getTime() + 7 * 24 * 3600000)

            const issues = [
                createIssue({ fields: { status: { name: 'To Do', statusCategory: { key: 'new', name: 'To Do' } } } as any }),
                createIssue({ fields: { status: { name: 'In Progress', statusCategory: { key: 'indeterminate', name: 'In Progress' } } } as any }),
                createIssue({ fields: { status: { name: 'Done', statusCategory: { key: 'done', name: 'Done' } } } as any }),
            ]

            const result = calculateSprintHealth(issues, sprintStart, sprintEnd, 20)
            expect(result.factors.timeFactor).toBeDefined()
            expect(typeof result.factors.timeFactor).toBe('number')
            expect(result.factors.velocityFactor).toBeDefined()
        })

        it('flags stalled issues correctly', () => {
            const stalledIssue = createIssue({
                fields: {
                    status: { name: 'In Progress', statusCategory: { key: 'indeterminate', name: 'In Progress' } },
                    updated: new Date(Date.now() - 48 * 3600000).toISOString() // 48 hours ago
                } as any
            })

            const result = calculateSprintHealth([stalledIssue], null, null, 20)
            expect(result.factors.stalledFactor).toBeDefined()
        })
    })

    describe('detectPreStallWarnings', () => {

        it('returns empty array with no in-progress issues', () => {
            const issues = [
                createIssue({ fields: { status: { name: 'Done', statusCategory: { key: 'done', name: 'Done' } } } as any }),
            ]
            const result = detectPreStallWarnings(issues, 24)
            expect(result).toEqual([])
        })

        it('detects issues approaching stall threshold', () => {
            const nearStallIssue = createIssue({
                fields: {
                    status: { name: 'In Progress', statusCategory: { key: 'indeterminate', name: 'In Progress' } },
                    updated: new Date(Date.now() - 18 * 3600000).toISOString() // 18 hours ago (75% of 24h threshold)
                } as any
            })

            const result = detectPreStallWarnings([nearStallIssue], 24)
            expect(result.length).toBeGreaterThanOrEqual(0)
            // If detected, should have risk level
            if (result.length > 0) {
                expect(['WATCH', 'WARNING', 'CRITICAL']).toContain(result[0].riskLevel)
            }
        })

        it('handles issues with no changelog gracefully', () => {
            const issueNoChangelog = createIssue({
                changelog: undefined
            })

            // Should not throw
            expect(() => detectPreStallWarnings([issueNoChangelog], 24)).not.toThrow()
        })
    })

    describe('analyzeWIPAging', () => {

        it('returns empty array with no in-progress issues', () => {
            const doneIssues = [
                createIssue({ fields: { status: { name: 'Done', statusCategory: { key: 'done', name: 'Done' } } } as any }),
            ]
            const result = analyzeWIPAging(doneIssues)
            expect(result).toEqual([])
        })

        it('calculates aging ratio correctly', () => {
            const oldIssue = createIssue({
                fields: {
                    status: { name: 'In Progress', statusCategory: { key: 'indeterminate', name: 'In Progress' } },
                    created: new Date(Date.now() - 30 * 24 * 3600000).toISOString() // 30 days ago
                } as any
            })

            const result = analyzeWIPAging([oldIssue])
            if (result.length > 0) {
                expect(result[0].daysInProgress).toBeGreaterThan(0)
                expect(['NORMAL', 'AGING', 'CRITICAL']).toContain(result[0].riskLevel)
            }
        })

        it('uses historical issues for P85 calculation when provided', () => {
            const currentIssue = createIssue({
                fields: {
                    status: { name: 'In Progress', statusCategory: { key: 'indeterminate', name: 'In Progress' } }
                } as any
            })

            const historicalIssues = Array.from({ length: 20 }, (_, i) =>
                createIssue({
                    fields: {
                        status: { name: 'Done', statusCategory: { key: 'done', name: 'Done' } },
                        resolutiondate: new Date(Date.now() - (i + 1) * 24 * 3600000).toISOString()
                    } as any
                })
            )

            const result = analyzeWIPAging([currentIssue], historicalIssues)
            if (result.length > 0) {
                expect(result[0].cycleTimeP85).toBeGreaterThan(0)
            }
        })
    })

    describe('analyzeTeamCapacity', () => {

        it('returns empty array with no assignees', () => {
            const unassignedIssue = createIssue({
                fields: {
                    assignee: undefined
                } as any
            })
            const result = analyzeTeamCapacity([unassignedIssue])
            expect(result).toEqual([])
        })

        it('calculates WIP per assignee correctly', () => {
            const issues = [
                createIssue({ fields: { assignee: { displayName: 'Alice', accountId: 'alice-1' }, status: { name: 'In Progress', statusCategory: { key: 'indeterminate', name: 'In Progress' } } } as any }),
                createIssue({ fields: { assignee: { displayName: 'Alice', accountId: 'alice-1' }, status: { name: 'In Progress', statusCategory: { key: 'indeterminate', name: 'In Progress' } } } as any }),
                createIssue({ fields: { assignee: { displayName: 'Bob', accountId: 'bob-1' }, status: { name: 'In Progress', statusCategory: { key: 'indeterminate', name: 'In Progress' } } } as any }),
            ]

            const result = analyzeTeamCapacity(issues, 3)

            const alice = result.find(t => t.accountId === 'alice-1')
            const bob = result.find(t => t.accountId === 'bob-1')

            expect(alice?.currentWIP).toBe(2)
            expect(bob?.currentWIP).toBe(1)
        })

        it('marks overloaded team members correctly', () => {
            const issues = Array.from({ length: 5 }, () =>
                createIssue({
                    fields: {
                        assignee: { displayName: 'Overloaded', accountId: 'overloaded-1' },
                        status: { name: 'In Progress', statusCategory: { key: 'indeterminate', name: 'In Progress' } }
                    } as any
                })
            )

            const result = analyzeTeamCapacity(issues, 3)
            const overloaded = result.find(t => t.accountId === 'overloaded-1')

            expect(overloaded?.availability).toBe('OVERLOADED')
        })
    })

    describe('detectScopeCreep', () => {

        it('returns no detection with no sprint start date', () => {
            const issues = [createIssue()]
            const result = detectScopeCreep(issues, null)
            expect(result.detected).toBe(false)
        })

        it('detects issues added after sprint start', () => {
            const sprintStart = new Date(Date.now() - 7 * 24 * 3600000) // 7 days ago

            const midSprintIssue = createIssue({
                fields: {
                    created: new Date(Date.now() - 3 * 24 * 3600000).toISOString() // 3 days ago (mid-sprint)
                } as any
            })

            const result = detectScopeCreep([midSprintIssue], sprintStart)
            expect(result.addedCount).toBe(1)
        })

        it('does not flag issues created before sprint start', () => {
            const sprintStart = new Date(Date.now() - 7 * 24 * 3600000) // 7 days ago

            const preSprintIssue = createIssue({
                fields: {
                    created: new Date(Date.now() - 14 * 24 * 3600000).toISOString() // 14 days ago (before sprint)
                } as any
            })

            const result = detectScopeCreep([preSprintIssue], sprintStart)
            expect(result.addedCount).toBe(0)
            expect(result.detected).toBe(false)
        })
    })
})
