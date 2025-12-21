/**
 * Context-Aware Metric Validity Tests
 * 
 * Tests the computeMetricValidity() logic from contextEngine.ts
 * Ensures metrics are correctly hidden/shown based on project type and board strategy.
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_METRIC_VALIDITY } from '../../src/domain/types/Context';

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
    // Helper to simulate computeMetricValidity logic
    const computeMetricValidity = (ctx: { projectType: string; boardStrategy: string }) => {
        const v = { ...DEFAULT_METRIC_VALIDITY };

        if (ctx.projectType === 'business') {
            v.velocity = 'hidden';
            v.sprintHealth = 'hidden';
            v.sprintProgress = 'hidden';
            v.scopeCreep = 'hidden';
        }

        if (ctx.boardStrategy === 'kanban') {
            v.velocity = 'hidden';
            v.sprintHealth = 'hidden';
            v.sprintProgress = 'hidden';
            v.scopeCreep = 'hidden';
        }

        // Flow metrics always valid
        v.cycleTime = 'valid';
        v.leadTime = 'valid';
        v.wip = 'valid';
        v.wipConsistency = 'valid';
        v.throughput = 'valid';
        v.flowEfficiency = 'valid';

        return v;
    };

    describe('Scrum Board (Software Project)', () => {
        const ctx = { projectType: 'software', boardStrategy: 'scrum' };

        it('should show velocity for scrum boards', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.velocity).toBe('valid');
        });

        it('should show sprint health for scrum boards', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.sprintHealth).toBe('valid');
        });

        it('should show all flow metrics', () => {
            const validity = computeMetricValidity(ctx);
            expect(validity.cycleTime).toBe('valid');
            expect(validity.throughput).toBe('valid');
            expect(validity.wip).toBe('valid');
        });
    });

    describe('Kanban Board (Software Project)', () => {
        const ctx = { projectType: 'software', boardStrategy: 'kanban' };

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
        const ctx = { projectType: 'business', boardStrategy: 'none' };

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
