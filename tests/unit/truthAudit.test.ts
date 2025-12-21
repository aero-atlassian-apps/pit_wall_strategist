
import { describe, it, expect, vi } from 'vitest';
import { CycleTimeCalculator } from '../../src/domain/metrics/CycleTimeCalculator';
import { WipAnalysis } from '../../src/domain/metrics/WipAnalysis';
import { calculateSprintHealth } from '../../src/resolvers/advancedAnalytics';
import { JiraStatusCategory } from '../../src/domain/issue/JiraStatusCategory';

describe('Deterministic Truth Audit', () => {

    describe('Cycle Time: Oscillation Accumulation', () => {
        it('should correctly accumulate time across multiple in-progress intervals', () => {
            const calculator = new CycleTimeCalculator();

            const issue = {
                key: 'OP-1',
                statusName: 'Done',
                statusCategory: JiraStatusCategory.DONE,
                created: new Date('2023-01-01T00:00:00Z'),
                resolved: new Date('2023-01-02T14:00:00Z'),
                changelog: {
                    histories: [
                        // T1: Start (Day 1, 10:00) -> Progress
                        { created: '2023-01-01T10:00:00Z', items: [{ field: 'status', to: '101', toString: 'In Progress', fromString: 'To Do' }] },
                        // T2: Reopen (Day 1, 14:00) -> Backlog (Indeterminate to To Do)
                        { created: '2023-01-01T14:00:00Z', items: [{ field: 'status', to: '1', toString: 'To Do', fromString: 'In Progress' }] },
                        // T3: Restart (Day 2, 10:00) -> Progress
                        { created: '2023-01-02T10:00:00Z', items: [{ field: 'status', to: '101', toString: 'In Progress', fromString: 'To Do' }] },
                        // T4: Done (Day 2, 14:00) -> Done
                        { created: '2023-01-02T14:00:00Z', items: [{ field: 'status', to: '102', toString: 'Done', fromString: 'In Progress' }] }
                    ]
                }
            } as any;

            const statusResolver = (name: string) => {
                if (name === 'In Progress' || name === '101') return JiraStatusCategory.IN_PROGRESS;
                if (name === 'Done' || name === '102') return JiraStatusCategory.DONE;
                return JiraStatusCategory.TO_DO;
            };

            const result = calculator.calculate([issue], statusResolver);

            // Expected: 
            // Interval 1: 10:00 to 14:00 (4 hours)
            // Interval 2: 10:00 to 14:00 (4 hours)
            // Total: 8 hours
            expect(result.avgHours).toBe(8);
        });
    });

    describe('WIP Consistency: Historical Reconstruction', () => {
        it('should accurately detect status-aware WIP at any point in history', () => {
            const analysis = new WipAnalysis();

            const issue = {
                key: 'WIP-1',
                created: new Date('2023-01-01T00:00:00Z'),
                statusCategory: JiraStatusCategory.DONE,
                changelog: {
                    histories: [
                        { created: '2023-01-01T12:00:00Z', items: [{ field: 'status', to: '101', toString: 'In Progress', fromString: 'To Do' }] },
                        { created: '2023-01-02T12:00:00Z', items: [{ field: 'status', to: '102', toString: 'Done', fromString: 'In Progress' }] }
                    ]
                }
            } as any;

            const statusResolver = (name: string) => {
                if (name === 'In Progress' || name === '101') return JiraStatusCategory.IN_PROGRESS;
                if (name === 'Done' || name === '102') return JiraStatusCategory.DONE;
                return JiraStatusCategory.TO_DO;
            };

            // T = Jan 1, 10:00 (Still in 'new' category) -> isInProgress = false
            const t1 = new Date('2023-01-01T10:00:00Z').getTime();
            expect(analysis.getCategoryAtTime(issue, t1, statusResolver).isInProgress).toBe(false);

            // T = Jan 1, 15:00 (In 'indeterminate' category) -> isInProgress = true
            const t2 = new Date('2023-01-01T15:00:00Z').getTime();
            expect(analysis.getCategoryAtTime(issue, t2, statusResolver).isInProgress).toBe(true);

            // T = Jan 3, 10:00 (In 'done' category) -> isInProgress = false
            const t3 = new Date('2023-01-03T10:00:00Z').getTime();
            expect(analysis.getCategoryAtTime(issue, t3, statusResolver).isInProgress).toBe(false);
        });
    });

    describe('Sprint Health: Resource Balancing', () => {
        it('should penalize excessive WIP even with good completion', () => {
            const now = new Date('2023-01-10T00:00:00Z');
            const start = new Date('2023-01-01T00:00:00Z');
            const end = new Date('2023-01-15T00:00:00Z');

            // Scenario A: 50% done, 50% new (Healthy)
            const healthyIssues = [
                ...Array(5).fill({ fields: { status: { statusCategory: { key: 'done' } } } }),
                ...Array(5).fill({ fields: { status: { statusCategory: { key: 'new' } } } })
            ] as any;

            // Scenario B: 40% done, 60% in progress (Overloaded/Unstable)
            const overloadedIssues = [
                ...Array(4).fill({ fields: { status: { statusCategory: { key: 'done' } } } }),
                ...Array(6).fill({ fields: { status: { statusCategory: { key: 'indeterminate' } } } })
            ] as any;

            const healthA = calculateSprintHealth(healthyIssues, start, end, 10);
            const healthB = calculateSprintHealth(overloadedIssues, start, end, 10);

            // Health B should be lower than Health A because of the WIP penalty
            expect(healthB.score).toBeLessThan(healthA.score);
        });
    });
});
