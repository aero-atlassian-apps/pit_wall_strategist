/**
 * Trends Resolvers
 * 
 * Trend analysis resolvers:
 * - getTrendData - WIP and velocity trends
 */

import { getEffectiveConfig } from '../config/ConfigResolvers';
import { mockTrends } from '../mocks';
import { calculateWipTrend, calculateVelocityTrend } from '../trendMetrics';
import type { TrendData } from '../../types/telemetry';

const PLATFORM = process.env.PLATFORM || 'atlassian';

/**
 * Registers all trend-related resolvers on the provided resolver instance
 */
export function registerTrendResolvers(resolver: any): void {

    resolver.define('getTrendData', async ({ payload, context }: any) => {
        try {
            await getEffectiveConfig(context, payload); // Load correctly into globalConfig
            if (PLATFORM === 'local') return mockTrends();
            const projectKey = context.extension.project.key as string;
            console.log(`[ENTRY] getTrendData for project: ${projectKey}`);
            const wipTrend: TrendData = await calculateWipTrend(projectKey);
            const velocityTrend: TrendData = await calculateVelocityTrend(projectKey);
            console.log(`[Trends] WIP: direction=${wipTrend.direction}, change=${wipTrend.change}, dataLen=${wipTrend.data?.length}`);
            console.log(`[Trends] Velocity: direction=${velocityTrend.direction}, total=${velocityTrend.total}, dataLen=${velocityTrend.data?.length}`);
            return { success: true, wip: wipTrend, velocity: velocityTrend };

        } catch (error: any) {
            console.error('Error fetching trend data:', error);
            return { success: false, error: error.message };
        }
    });
}
