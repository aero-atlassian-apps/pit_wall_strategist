
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '../../src/resolvers/index'

// Mock dependencies
vi.mock('@forge/api', () => ({
    storage: { get: vi.fn(), set: vi.fn() },
    default: { asApp: vi.fn(), asUser: vi.fn(), route: (strs: any, ...vals: any) => strs.join('') },
    route: (strs: any, ...vals: any) => strs.join('')
}))

// Mock the underlying infrastructure modules instead of the re-export wrapper
vi.mock('../../src/infrastructure/jira/JiraBoardRepository', () => ({
    JiraBoardRepository: vi.fn().mockImplementation(() => ({
        getBoardData: vi.fn().mockResolvedValue({
            issues: [
                { key: 'TEST-1', fields: { status: { name: 'To Do', statusCategory: { key: 'new' } }, summary: 'Test 1', assignee: null, updated: new Date().toISOString(), priority: { name: 'Medium' } } },
                { key: 'TEST-2', fields: { status: { name: 'In Progress', statusCategory: { key: 'indeterminate' } }, summary: 'Test 2', assignee: null, updated: new Date().toISOString(), priority: { name: 'Medium' } } },
                { key: 'TEST-3', fields: { status: { name: 'Done', statusCategory: { key: 'done' } }, summary: 'Test 3', assignee: null, updated: new Date().toISOString(), priority: { name: 'Medium' } } },
                { key: 'TEST-4', fields: { status: { name: 'Weird Status', statusCategory: { key: 'new' } }, summary: 'Test 4', assignee: null, updated: new Date().toISOString(), priority: { name: 'Medium' } } }
            ],
            sprint: { name: 'Test Sprint' },
            boardType: 'scrum',
            boardId: 1
        }),
        detectBoardType: vi.fn().mockResolvedValue({ boardId: 1, boardType: 'scrum', boardName: 'Test Board' })
    }))
}))

vi.mock('../../src/infrastructure/services/StatusMapService', () => ({
    StatusMapService: vi.fn().mockImplementation(() => ({
        getProjectStatusMap: vi.fn().mockResolvedValue({ byId: {}, byName: {}, byIssueType: {}, fetchedAt: Date.now() })
    }))
}))

vi.mock('../../src/infrastructure/services/LegacyTelemetryAdapter', () => ({
    LegacyTelemetryAdapter: {
        calculateTelemetry: vi.fn().mockResolvedValue({}),
        detectStalledTickets: vi.fn().mockReturnValue([]),
        categorizeIssues: vi.fn().mockImplementation((issues: any[]) => issues.map((i: any) => ({
            key: i.key,
            summary: i.fields?.summary || '',
            status: i.fields?.status?.name,
            statusCategory: i.fields?.status?.statusCategory?.key,
            assignee: i.fields?.assignee?.displayName || 'Unassigned',
            updated: i.fields?.updated,
            priority: i.fields?.priority?.name || 'Medium',
            isStalled: false
        }))),
        discoverCustomFields: vi.fn().mockResolvedValue({ storyPoints: null }),
        getFieldCacheSnapshot: vi.fn().mockReturnValue({})
    },
    DEFAULT_CONFIG: { wipLimit: 8, assigneeCapacity: 3, stalledThresholdHours: 24 }
}))

vi.mock('../../src/resolvers/timingMetrics', () => ({
    getBoardColumns: vi.fn().mockResolvedValue([]), // RETURN EMPTY COLUMNS TO TRIGGER FALLBACK
    mapStatusToColumn: vi.fn().mockReturnValue(null) // Mock generic failure matches behavior of empty columns
}))

describe('Resolver Fallback Logic', () => {
    it('should fallback to default columns when getBoardColumns returns empty', async () => {
        const result = await handler({ call: { functionKey: 'getSprintIssues' }, context: { extension: { project: { key: 'TEST' } } } }) as any

        expect(result.success).toBe(true)
        expect(result.columns).toEqual(['To Do', 'In Progress', 'Done'])

        // Verify issue mapping
        const issues = result.issues
        expect(issues.find((i: any) => i.key === 'TEST-1').column).toBe('To Do')
        expect(issues.find((i: any) => i.key === 'TEST-2').column).toBe('In Progress')
        expect(issues.find((i: any) => i.key === 'TEST-3').column).toBe('Done')
        expect(issues.find((i: any) => i.key === 'TEST-4').column).toBe('To Do') // Category 'new' -> 'To Do'
    })
})
