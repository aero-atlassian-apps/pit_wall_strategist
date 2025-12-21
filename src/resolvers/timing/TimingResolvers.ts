/**
 * Timing Resolvers
 * 
 * Time-based metric resolvers:
 * - getTimingMetrics - Lead/cycle time metrics
 * - getCycleHints - Cycle time recommendations by issue type
 */

import { JiraBoardRepository } from '../../infrastructure/jira/JiraBoardRepository';
import { StatusMapService } from '../../infrastructure/services/StatusMapService';
import { getEffectiveConfig } from '../config/ConfigResolvers';
import { mockTiming } from '../mocks';
import { calculateLeadTime, calculateCycleTime, evaluateSectorPerformance, getIssueStatusCategoryTimes } from '../timingMetrics';
import { cacheGet, cacheSet } from '../cache';
import type { BoardData, SectorTimes, LeadTimeResult } from '../../types/telemetry';

const PLATFORM = process.env.PLATFORM || 'atlassian';
const boardRepository = new JiraBoardRepository();
const statusMapService = new StatusMapService();

/**
 * Registers all timing-related resolvers on the provided resolver instance
 */
export function registerTimingResolvers(resolver: any): void {

    resolver.define('getTimingMetrics', async ({ payload, context }: any) => {
        try {
            const userConfig = await getEffectiveConfig(context, payload);
            console.log('[ENTRY] getTimingMetrics for project:', context?.extension?.project?.key);
            if (PLATFORM === 'local') { return mockTiming(); }
            const projectKey = context.extension.project.key as string;
            const boardData: BoardData = await boardRepository.getBoardData(projectKey, userConfig, context);
            const leadTime: LeadTimeResult = calculateLeadTime(boardData.issues);
            const issueKeys = boardData.issues.map(i => i.key);
            const cycleTime: SectorTimes = await calculateCycleTime(issueKeys, context);
            const sectorTimes = evaluateSectorPerformance(cycleTime);
            const hasUnmapped = Boolean((cycleTime as any)['UNMAPPED']);
            return {
                success: true,
                leadTime: {
                    avgLapTime: leadTime.average,
                    bestLap: leadTime.min,
                    worstLap: leadTime.max,
                    completedLaps: leadTime.count,
                    driverTimes: leadTime.byAssignee
                },
                sectorTimes,
                raceStatus: leadTime.average > 72 ? 'slow' : leadTime.average > 48 ? 'caution' : 'optimal',
                hasUnmapped,
                boardId: boardData.boardId
            };

        } catch (error: any) {
            console.error('Error fetching timing metrics:', error);
            return { success: false, error: error.message };
        }
    });

    resolver.define('getCycleHints', async ({ payload, context }: any) => {
        try {
            const userConfig = await getEffectiveConfig(context, payload);
            const projectKey = context?.extension?.project?.key as string;
            const statusMap = await statusMapService.getProjectStatusMap(projectKey);
            const boardData: BoardData = await boardRepository.getBoardData(projectKey, userConfig, context);
            const boardType = boardData.boardType;

            const cacheKey = `cycleHints:${projectKey}:${boardData.boardId || 'na'}`;
            const cached = cacheGet<any>(cacheKey);
            if (cached) return cached;

            const byType: Record<string, { total: number; count: number }> = {};
            const issues = boardData.issues || [];
            if (!issues || issues.length === 0) {
                const res = { success: false, code: 'NO_DATA', message: 'No issues available for hints' };
                cacheSet(cacheKey, res, 5 * 60_000);
                return res;
            }

            // Sample up to 50 issues for cycle time hints
            for (const issue of issues.slice(0, 50)) {
                const typeName = (issue.fields.issuetype?.name || '').toLowerCase();
                if (!typeName) continue;
                const times = await getIssueStatusCategoryTimes(issue.key, context, statusMap);
                const inProg = times.indeterminate || 0;
                if (!byType[typeName]) byType[typeName] = { total: 0, count: 0 };
                byType[typeName].total += inProg;
                byType[typeName].count += 1;
            }

            const hints: Record<string, { avgInProgressHours: number; recommendedMin: number; recommendedMax: number }> = {};
            const [minFactor, maxFactor] = boardType === 'kanban' ? [0.6, 1.0] : [0.8, 1.2];
            const clamp = (h: number) => Math.max(4, Math.min(168, Math.round(h)));

            Object.entries(byType).forEach(([type, agg]) => {
                const avg = agg.count > 0 ? agg.total / agg.count : 0;
                const min = clamp(avg * minFactor);
                const max = clamp(avg * maxFactor);
                hints[type] = { avgInProgressHours: Math.round(avg), recommendedMin: min, recommendedMax: max };
            });

            const res = { success: true, boardType, hints };
            cacheSet(cacheKey, res, 10 * 60_000);
            return res;
        } catch (error: any) {
            const msg = (error?.message || '').toLowerCase();
            const code = msg.includes('429') || msg.includes('rate') ? 'RATE_LIMITED' : (msg.includes('permission') || msg.includes('401') || msg.includes('403')) ? 'PERMISSION_DENIED' : 'UNKNOWN';
            return { success: false, code, error: error.message || 'Failed to compute cycle hints' };
        }
    });
}
