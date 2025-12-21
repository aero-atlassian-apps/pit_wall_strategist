import { describe, it, expect, vi } from 'vitest';
import { MetricCalculator } from '../../infrastructure/services/legacy/MetricCalculator';
import { IssueCategorizer } from '../issue/IssueCategorizer';
import type { BoardData, TelemetryConfig } from '../../types/telemetry';

// Mock fieldDiscoveryService
vi.mock('../data/FieldDiscoveryService', () => ({
    fieldDiscoveryService: {
        discoverCustomFields: vi.fn().mockResolvedValue({ storyPoints: 'customfield_10010' })
    }
}));

describe('MetricCalculator', () => {
    const config: TelemetryConfig = {
        wipLimit: 10,
        assigneeCapacity: 3,
        stalledThresholdHours: 24,
        storyPointsFieldName: 'customfield_10010',
        statusCategories: { todo: 'new', inProgress: 'indeterminate', done: 'done' },
        includeBoardIssuesWhenSprintEmpty: true
    };
    const categorizer = new IssueCategorizer();
    // Mock getStatusCategory to handle both real issues and mock issues from classify()
    vi.spyOn(categorizer, 'getStatusCategory').mockImplementation((issue: any) => {
        // Real issue with statusCategory
        if (issue.fields?.status?.statusCategory?.key) {
            return issue.fields.status.statusCategory.key;
        }
        // Mock issue from classify() with just status.name
        const name = (issue.fields?.status?.name || '').toLowerCase();
        if (name.includes('done') || name.includes('resolved') || name.includes('closed')) return 'done';
        if (name.includes('progress') || name.includes('doing') || name.includes('review')) return 'indeterminate';
        return 'new';
    });

    const calculator = new MetricCalculator(categorizer, config);

    it('calculates velocity from closed sprints', async () => {
        const boardData: BoardData = {
            boardType: 'scrum',
            boardId: 1,
            boardName: 'Test Board',
            issues: [],
            closedSprints: [
                { id: 1, name: 'Sprint 1', state: 'closed', completeDate: '2023-01-01' },
                { id: 2, name: 'Sprint 2', state: 'closed', completeDate: '2023-01-15' }
            ],
            historicalIssues: [
                { key: 'TEST-1', fields: { status: { statusCategory: { key: 'done' } }, customfield_10010: 5 } } as any,
                { key: 'TEST-2', fields: { status: { statusCategory: { key: 'done' } }, customfield_10010: 8 } } as any,
                { key: 'TEST-3', fields: { status: { statusCategory: { key: 'new' } }, customfield_10010: 3 } } as any
            ]
        };

        const result = await calculator.calculate(boardData);
        // Total done points = 5 + 8 = 13
        // Sprints = 2
        // Velocity = 13 / 2 = 6.5 -> 7 (round)
        expect(result.velocity).toBe(7);
        expect(result.velocityExplanation).toContain('exp:velocitySprints:count=2');
    });

    it('calculates velocity as 0 with explanation when no closed sprints', async () => {
        const boardData: BoardData = {
            boardType: 'scrum',
            boardId: 1,
            boardName: 'Test Board',
            issues: [],
            closedSprints: []
        };

        const result = await calculator.calculate(boardData);
        expect(result.velocity).toBe(0);
        expect(result.velocityExplanation).toBe('exp:noClosedSprints');
    });

    it('calculates cycle time from history', async () => {
        const now = new Date().getTime();
        const hour = 3600 * 1000;

        const boardData: BoardData = {
            boardType: 'kanban',
            boardId: 1,
            boardName: 'Kanban',
            issues: [],
            historicalIssues: [
                {
                    key: 'TEST-1',
                    fields: {
                        status: { statusCategory: { key: 'done' } },
                        created: new Date(now - 100 * hour).toISOString(),
                        resolutiondate: new Date(now).toISOString()
                    },
                    changelog: {
                        histories: [
                            { created: new Date(now - 48 * hour).toISOString(), items: [{ field: 'status', fromString: 'To Do', toString: 'In Progress' }] }
                        ]
                    }
                } as any
            ]
        };

        const result = await calculator.calculate(boardData);
        // Created: now - 100h
        // First Transition (Start): now - 48h
        // Resolved: now
        // Cycle Time = 48h
        expect(result.cycleTime).toBe(48);
    });

    it('calculates throughput (items per week)', async () => {
        const now = new Date();
        const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();

        const boardData: BoardData = {
            boardType: 'kanban',
            boardId: 1,
            boardName: 'Kanban',
            issues: [],
            historicalIssues: [
                { fields: { status: { statusCategory: { key: 'done' } }, resolutiondate: daysAgo(1) } } as any,
                { fields: { status: { statusCategory: { key: 'done' } }, resolutiondate: daysAgo(2) } } as any,
                { fields: { status: { statusCategory: { key: 'done' } }, resolutiondate: daysAgo(10) } } as any
            ]
        };

        const result = await calculator.calculate(boardData);
        // Range: ~9 days (10 to 1) -> 1.28 weeks
        // Items: 3
        // Rate: 3 / 1.28 = 2.3
        expect(result.throughput).toBeGreaterThan(0);
        expect(result.throughputExplanation).toContain('exp:throughputAvg');
    });

    it('handles missing data gracefully', async () => {
        const boardData: BoardData = {
            boardType: 'scrum',
            boardId: 1,
            boardName: 'Test',
            issues: [],
            closedSprints: [],
            historicalIssues: []
        };

        const result = await calculator.calculate(boardData);
        expect(result.velocity).toBe(0);
        expect(result.cycleTime).toBe(0);
        expect(result.throughput).toBe(0);
    });
});
