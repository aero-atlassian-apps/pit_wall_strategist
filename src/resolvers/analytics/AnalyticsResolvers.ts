/**
 * Analytics Resolvers
 * 
 * Advanced analytics and flow metrics resolvers:
 * - getAdvancedAnalytics - Sprint health, pre-stall warnings, WIP aging, bottleneck detection
 * - getFlowMetrics - SAFe flow metrics (flow distribution, velocity, flow time, load)
 * - getDevOpsStatus - DevOps connectivity and no-commit detection
 */

import { JiraBoardRepository } from '../../infrastructure/jira/JiraBoardRepository';
import { LegacyTelemetryAdapter } from '../../infrastructure/services/LegacyTelemetryAdapter';
import { getEffectiveConfig } from '../config/ConfigResolvers';
import { mockDevOps } from '../mocks';
import { getAdvancedAnalytics } from '../advancedAnalytics';
import { checkProjectDevOpsStatus, detectNoCommitIssues } from '../devOpsDetection';
import { GetFlowMetricsUseCase } from '../../application/usecases/GetFlowMetricsUseCase';
import type { BoardData } from '../../types/telemetry';

const PLATFORM = process.env.PLATFORM || 'atlassian';
const boardRepository = new JiraBoardRepository();

/**
 * Registers all analytics-related resolvers on the provided resolver instance
 */
export function registerAnalyticsResolvers(resolver: any): void {

    resolver.define('getAdvancedAnalytics', async ({ payload, context }: any) => {
        try {
            const userConfig = await getEffectiveConfig(context, payload);
            console.log('[ENTRY] getAdvancedAnalytics for project:', context?.extension?.project?.key);
            const projectKey = context?.extension?.project?.key as string;

            // Fetch board data
            const boardData = await boardRepository.getBoardData(projectKey, userConfig, context);

            const issues = boardData.issues || [];

            // Determine sprint dates
            let sprintStartDate: Date | null = null;
            let sprintEndDate: Date | null = null;

            if (boardData.sprint?.startDate) sprintStartDate = new Date(boardData.sprint.startDate);
            if (boardData.sprint?.endDate) sprintEndDate = new Date(boardData.sprint.endDate);

            // Get field cache for story points field name
            const fields = await LegacyTelemetryAdapter.discoverCustomFields();
            const storyPointsField = fields.storyPoints || 'customfield_10040';

            // Calculate advanced analytics
            const analytics = await getAdvancedAnalytics(
                issues,
                projectKey,
                sprintStartDate,
                sprintEndDate,
                {
                    historicalVelocity: userConfig.assigneeCapacity * 5 || 20,
                    stalledThresholdHours: userConfig.stalledThresholdHours || 24,
                    wipLimitPerPerson: userConfig.assigneeCapacity || 3,
                    storyPointsField
                }
            );

            console.log(`[Analytics] Sprint Health: ${analytics.sprintHealth.status} (${analytics.sprintHealth.score}%)`);
            console.log(`[Analytics] Pre-Stall Warnings: ${analytics.preStallWarnings.length}`);
            console.log(`[Analytics] WIP Aging: ${analytics.wipAging.length}`);
            console.log(`[Analytics] Bottleneck: ${analytics.bottleneck?.bottleneckStatus || 'None'}`);

            return {
                success: true,
                boardType: boardData.boardType,
                sprintName: boardData.sprint?.name || boardData.boardName,
                ...analytics
            };
        } catch (error: any) {
            console.error('Error in getAdvancedAnalytics:', error);
            return { success: false, error: error.message };
        }
    });

    resolver.define('getFlowMetrics', async ({ payload, context }: any) => {
        try {
            console.log('[ENTRY] getFlowMetrics for project:', context?.extension?.project?.key);

            const userConfig = await getEffectiveConfig(context, payload);
            const projectKey = context.extension.project.key as string;

            const useCase = new GetFlowMetricsUseCase();
            const result = await useCase.execute(projectKey, userConfig, context);

            return result;

        } catch (error: any) {
            console.error('Error fetching flow metrics:', error);
            return {
                success: true,
                isEmpty: true,
                error: error.message,
                message: `Unable to calculate flow metrics: ${error.message}`,
                distribution: { features: { count: 0, percentage: 0 }, defects: { count: 0, percentage: 0 }, risks: { count: 0, percentage: 0 }, debt: { count: 0, percentage: 0 }, other: { count: 0, percentage: 0 }, total: 0 },
                velocity: { completed: 0, period: 'Unknown', trend: 'stable', changePercent: 0 },
                flowTime: { avgHours: 0, medianHours: 0, p85Hours: 0, minHours: 0, maxHours: 0 },
                flowLoad: { total: 0, byCategory: { features: 0, defects: 0, risks: 0, debt: 0, other: 0 }, limit: 10, loadPercent: 0 },
                typeMapping: {},
                detectedTypes: [],
                f1Theme: {}
            };
        }
    });

    resolver.define('getDevOpsStatus', async ({ payload, context }: any) => {
        try {
            const userConfig = await getEffectiveConfig(context, payload);
            console.log('[ENTRY] getDevOpsStatus for project:', context?.extension?.project?.key);
            if (PLATFORM === 'local') return mockDevOps();
            const projectKey = context.extension.project.key as string;
            const devOpsStatus = await checkProjectDevOpsStatus(projectKey, context);
            if (!devOpsStatus.enabled) return { success: true, enabled: false, source: null, noCommitIssues: [] };
            const boardData: BoardData = await boardRepository.getBoardData(projectKey, userConfig);
            const noCommitIssues = await detectNoCommitIssues(boardData.issues);
            return { success: true, enabled: true, source: devOpsStatus.source, noCommitIssues };

        } catch (error: any) {
            console.error('Error fetching DevOps status:', error);
            return { success: false, error: error.message };
        }
    });
}
