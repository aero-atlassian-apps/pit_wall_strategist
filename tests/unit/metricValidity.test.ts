/**
 * Context-Aware Metric Validity Tests
 * 
 * C-010 FIX: Tests now import the REAL computeMetricValidity() from contextEngine.ts
 * Ensures metrics are correctly hidden/shown based on project type and board strategy.
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_METRIC_VALIDITY, InternalContext } from '../../src/domain/types/Context';
// C-010 FIX: Import real function instead of duplicating logic
import { computeMetricValidity } from '../../src/resolvers/contextEngine';

describe('DEFAULT_METRIC_VALIDITY', () => {
    it('should have all 10 metrics defined', () => {
        const expectedMetrics = [
            'velocity', 'sprintHealth', 'sprintProgress', 'scopeCreep',
            'wip', 'wipConsistency', 'cycleTime', 'leadTime', 'throughput', 'flowEfficiency'
        ];

        expectedMetrics.forEach(metric => {
            expect(DEFAULT_METRIC_VALIDITY[metric]).toBeDefined();
            expect(DEFAULT_METRIC_VALIDITY[metric]).toBe('valid');
        });
    });

    it('should have exactly 10 metrics', () => {
        const keys = Object.keys(DEFAULT_METRIC_VALIDITY);
        expect(keys.length).toBe(10);
    });
});

describe('Metric Validity Rules', () => {
    // C-010 FIX: Helper creates InternalContext for testing with real function
    const createTestContext = (overrides: Partial<InternalContext>): InternalContext => ({
        projectKey: 'TEST',
        projectName: 'Test Project',
        projectType: 'software',
        boardStrategy: 'scrum',
        agileCapability: 'full',
        estimationMode: 'storyPoints',
        metricValidity: {},
        workflow: { statusMap: {}, startStatuses: [], doneStatuses: [] },
        locale: 'en',
        ...overrides
    });

    describe('Scrum Board (Software Project)', () => {
        // M-003 FIX: Added sprintId to simulate active sprint
        const ctx = createTestContext({ projectType: 'software', boardStrategy: 'scrum', sprintId: 101 });

        it('should show velocity for scrum boards', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.velocity).toBe('valid');
        });

        it('should show sprint health for scrum boards', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.sprintHealth).toBe('valid');
        });

        it('should hide sprint health for scrum boards with no active sprint', () => {
            // Context without sprintId
            const ctxNoSprint = createTestContext({ projectType: 'software', boardStrategy: 'scrum' });
            const validity = computeMetricValidity(ctxNoSprint);
            expect(validity.sprintHealth).toBe('hidden');
        });

        it('should show all flow metrics', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.cycleTime).toBe('valid');
            expect(validity.throughput).toBe('valid');
            expect(validity.wip).toBe('valid');
        });
    });

    describe('Kanban Board (Software Project)', () => {
        const ctx = createTestContext({ projectType: 'software', boardStrategy: 'kanban' });

        it('should hide velocity for kanban boards', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.velocity).toBe('hidden');
        });

        it('should hide sprint health for kanban boards', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.sprintHealth).toBe('hidden');
        });

        it('should hide sprint progress for kanban boards', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.sprintProgress).toBe('hidden');
        });

        it('should hide scope creep for kanban boards', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.scopeCreep).toBe('hidden');
        });

        it('should show all flow metrics', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.cycleTime).toBe('valid');
            expect(validity.throughput).toBe('valid');
            expect(validity.wip).toBe('valid');
            expect(validity.flowEfficiency).toBe('valid');
        });
    });

    describe('Business Project (JWM)', () => {
        const ctx = createTestContext({ projectType: 'business', boardStrategy: 'none' });

        it('should hide velocity for business projects', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.velocity).toBe('hidden');
        });

        it('should hide sprint health for business projects', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.sprintHealth).toBe('hidden');
        });

        it('should show all flow metrics', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.cycleTime).toBe('valid');
            expect(validity.throughput).toBe('valid');
            expect(validity.leadTime).toBe('valid');
            expect(validity.wipConsistency).toBe('valid');
        });
    });
});
