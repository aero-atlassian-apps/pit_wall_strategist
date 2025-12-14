
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '../../src/resolvers/index'

// Mock dependencies
vi.mock('@forge/api', () => ({
    storage: { get: vi.fn(), set: vi.fn() },
    default: { asApp: vi.fn(), asUser: vi.fn(), route: (strs: any, ...vals: any) => strs.join('') }
}))

vi.mock('../../src/resolvers/telemetryUtils', () => ({
    fetchSprintData: vi.fn().mockResolvedValue({
        issues: [
            { key: 'TEST-1', status: 'To Do', statusCategory: 'new' },
            { key: 'TEST-2', status: 'In Progress', statusCategory: 'indeterminate' },
            { key: 'TEST-3', status: 'Done', statusCategory: 'done' },
            { key: 'TEST-4', status: 'Weird Status', statusCategory: 'new' }
        ],
        sprintName: 'Test Sprint',
        boardType: 'scrum'
    }),
    calculateTelemetry: vi.fn(),
    detectStalledTickets: vi.fn().mockReturnValue([]),
    categorizeIssues: vi.fn().mockImplementation((issues) => issues),
    discoverCustomFields: vi.fn(),
    detectBoardType: vi.fn().mockResolvedValue({ boardId: 1, type: 'scrum' }),
    DEFAULT_CONFIG: {},
    getFieldCacheSnapshot: vi.fn()
}))

vi.mock('../../src/resolvers/statusMap', () => ({
    getProjectStatusMap: vi.fn().mockResolvedValue({})
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
