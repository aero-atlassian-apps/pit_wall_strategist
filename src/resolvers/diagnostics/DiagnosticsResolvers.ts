/**
 * Diagnostics Resolvers
 * 
 * System diagnostics and health check resolvers:
 * - getDiagnosticsSummary - Full diagnostics summary
 * - getDiagnosticsDetails - Detailed diagnostics with board config
 * - getAccessProbe - API endpoint accessibility test
 * - getPermissionsDiagnostics - Permission status
 * - getPermissions - Simple permission check
 * - getHealth - System health status
 */

import api, { route } from '@forge/api';
import { JiraBoardRepository } from '../../infrastructure/jira/JiraBoardRepository';
import { LegacyTelemetryAdapter } from '../../infrastructure/services/LegacyTelemetryAdapter';
import { StatusMapService } from '../../infrastructure/services/StatusMapService';
import { SecurityGuard } from '../security/SecurityGuard';
import { getEffectiveConfig } from '../config/ConfigResolvers';
import { getScopes } from '../../config/scopes';
import { calculateWipTrend, calculateVelocityTrend } from '../trendMetrics';
import { getFetchStatuses } from '../fetchStatus';
import type { TelemetryData, BoardData, TrendData } from '../../types/telemetry';

const PLATFORM = process.env.PLATFORM || 'atlassian';
const boardRepository = new JiraBoardRepository();
const statusMapService = new StatusMapService();

/**
 * Registers all diagnostics-related resolvers on the provided resolver instance
 */
export function registerDiagnosticsResolvers(resolver: any): void {

    resolver.define('getDiagnosticsSummary', async ({ payload, context }: any) => {
        try {
            const userConfig = await getEffectiveConfig(context, payload);
            if (PLATFORM === 'local') return { success: true, summary: { telemetry: {}, trends: {}, permissions: {}, fetchStatuses: [] } };
            const projectKey = context.extension.project.key as string;

            // Use Guard for permissions
            const guard = new SecurityGuard();
            const status = await guard.validateContext(projectKey);
            const permissions = { userBrowse: status.permissions.userBrowse, appBrowse: status.permissions.appBrowse };

            // Pass security context to avoid re-fetch
            const enhancedContext = { ...context, security: status };
            const boardData: BoardData = await boardRepository.getBoardData(projectKey, userConfig, enhancedContext);
            const statusMap = await statusMapService.getProjectStatusMap(projectKey);
            const telemetry: TelemetryData = await LegacyTelemetryAdapter.calculateTelemetry(boardData, userConfig, statusMap);
            const wipTrend: TrendData = await calculateWipTrend(projectKey);
            const velocityTrend: TrendData = await calculateVelocityTrend(projectKey);

            const fetchStatuses = getFetchStatuses();
            return {
                success: true,
                summary: {
                    telemetry,
                    trends: { wip: wipTrend, velocity: velocityTrend },
                    permissions,
                    fetchStatuses,
                    context: { boardType: boardData.boardType, sprintName: boardData.sprint?.name || boardData.boardName, boardId: boardData.boardId }
                }
            };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    resolver.define('getPermissionsDiagnostics', async ({ context }: any) => {
        try {
            const projectKey = context.extension.project.key as string;
            const guard = new SecurityGuard();
            const status = await guard.validateContext(projectKey);

            return {
                success: true,
                permissions: {
                    userBrowse: status.permissions.userBrowse,
                    appBrowse: status.permissions.appBrowse,
                    hasSprintField: status.canReadSprints
                },
                messages: status.messages
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    resolver.define('getPermissions', async ({ context }: any) => {
        try {
            const projectKey = context?.extension?.project?.key as string;
            const guard = new SecurityGuard();
            const status = await guard.validateContext(projectKey);
            return {
                success: true,
                canRead: status.canReadProject,
                canWrite: status.permissions.userBrowse
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    resolver.define('getHealth', async ({ context }: any) => {
        try {
            const projectKey = context?.extension?.project?.key as string;
            const guard = new SecurityGuard();
            const status = await guard.validateContext(projectKey);

            let boardInfo: any = null;
            if (status.canReadProject) {
                try { boardInfo = await boardRepository.detectBoardType(projectKey); } catch (e: any) { boardInfo = { error: e?.message || 'board detection failed' }; }
            } else {
                boardInfo = { error: 'Access Denied' };
            }

            const fields = await LegacyTelemetryAdapter.discoverCustomFields();
            return {
                success: true,
                platform: PLATFORM,
                projectKey,
                boardInfo,
                fields,
                permissions: { userBrowse: status.permissions.userBrowse, appBrowse: status.permissions.appBrowse },
                messages: status.messages
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    resolver.define('getDiagnosticsDetails', async ({ context }: any) => {
        try {
            const projectKey = context?.extension?.project?.key as string;
            const guard = new SecurityGuard();
            const status = await guard.validateContext(projectKey);
            const userConfig = await getEffectiveConfig(context);

            let boardInfo: any = null;
            if (status.canReadProject) {
                try { boardInfo = await boardRepository.detectBoardType(projectKey); } catch (e: any) { boardInfo = { error: e?.message || 'board detection failed' }; }
            } else {
                boardInfo = { error: 'Access Denied: ' + status.messages.join(', ') };
            }

            let filter: any = null;
            try {
                if (boardInfo?.boardId && status.permissions.appBrowse) {
                    const cfgResp = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardInfo.boardId}/configuration`, { headers: { Accept: 'application/json' } });
                    const cfg = cfgResp.ok ? await cfgResp.json() : null;
                    const filterId = cfg?.filter?.id;
                    if (filterId) {
                        const filterResp = await api.asApp().requestJira(route`/rest/api/3/filter/${filterId}`, { headers: { Accept: 'application/json' } });
                        filter = filterResp.ok ? await filterResp.json() : { id: filterId };
                    }
                }
            } catch (e: any) { filter = { error: e?.message }; }

            const fieldsSnapshot = LegacyTelemetryAdapter.getFieldCacheSnapshot() || (await LegacyTelemetryAdapter.discoverCustomFields());

            let sprint: any = null;
            try {
                const sd = await boardRepository.getBoardData(projectKey, userConfig, context);
                sprint = { id: sd.sprint?.id, name: sd.sprint?.name || sd.boardName, state: sd.sprint?.state, boardType: sd.boardType };
            } catch (e: any) { sprint = { error: e?.message }; }

            const scopes = getScopes();
            let statuses: any = null;
            if (status.canReadProject) {
                try { statuses = await statusMapService.getProjectStatusMap(projectKey); } catch { }
            }
            return { success: true, boardInfo, filter, fields: fieldsSnapshot, sprint, scopes, statuses, permissions: status.permissions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    resolver.define('getAccessProbe', async ({ context }: any) => {
        try {
            const projectKey = context?.extension?.project?.key as string;
            const results: Array<{ endpoint: string; ok: boolean; status?: number }> = [];

            const push = (label: string, resp: any) => {
                if (!resp) { results.push({ endpoint: label, ok: false, status: undefined }); return; }
                results.push({ endpoint: label, ok: !!resp.ok, status: resp.status });
            };

            const pUser = await api.asUser().requestJira(route`/rest/api/3/project/${projectKey}`, { headers: { Accept: 'application/json' } });
            push('GET project (asUser)', pUser);
            const pApp = await api.asApp().requestJira(route`/rest/api/3/project/${projectKey}`, { headers: { Accept: 'application/json' } });
            push('GET project (asApp)', pApp);

            const bUser = await api.asUser().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, { headers: { Accept: 'application/json' } });
            push('GET boards (asUser)', bUser);
            const bApp = await api.asApp().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, { headers: { Accept: 'application/json' } });
            push('GET boards (asApp)', bApp);

            const body = { jql: `project = "${projectKey}" ORDER BY updated DESC`, maxResults: 1, fields: ['summary'] };
            const sApp = await api.asApp().requestJira(route`/rest/api/3/search/jql`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            push('POST search/jql (asApp)', sApp);
            const sUser = await api.asUser().requestJira(route`/rest/api/3/search/jql`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            push('POST search/jql (asUser)', sUser);

            return { success: true, results };
        } catch (error: any) { return { success: false, error: error.message }; }
    });
}
