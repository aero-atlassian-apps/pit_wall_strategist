/**
 * Telemetry Resolvers
 * 
 * Core telemetry data fetching and processing resolvers:
 * - getTelemetryData - Main telemetry dashboard data
 * - getSprintIssues - Sprint/board issues with categorization
 * - getBoardInfo - Board type detection
 * - getContext - Project context discovery
 * - getTelemetryDiagnostics - Telemetry source diagnostics
 */

import { JiraBoardRepository } from '../../infrastructure/jira/JiraBoardRepository';
import { TelemetryService } from '../../infrastructure/services/TelemetryService';
import { StatusMapService } from '../../infrastructure/services/StatusMapService';
import { getEffectiveConfig } from '../config/ConfigResolvers';
import { mockTelemetry, mockIssues } from '../mocks';
import { getFetchStatuses } from '../fetchStatus';
import { getBoardColumns, mapStatusToColumn } from '../timingMetrics';
import { getProjectContext, getContextSummary } from '../contextEngine';
import type { TelemetryConfig, TelemetryData, CategorizedIssue, BoardData, StalledTicket } from '../../types/telemetry';
import { InternalContext } from '../../domain/types/Context';

const PLATFORM = process.env.PLATFORM || 'atlassian';
const boardRepository = new JiraBoardRepository();
const statusMapService = new StatusMapService();

/**
 * Generates the F1-style feed messages for the telemetry dashboard
 */
function generateFeed(
    telemetry: TelemetryData,
    stalledTickets: StalledTicket[],
    boardType: 'scrum' | 'kanban' | 'business',
    locale: 'en' | 'fr' | 'es' | 'pt',
    fetchStatuses?: Array<{ endpoint: string; ok: boolean; status?: number }>
): Array<{ time: string; msg: string; type: 'info' | 'success' | 'warning' | 'critical' }> {
    const FEED_I18N: Record<string, Record<string, string>> = {
        en: { raceStartSprint: 'Sprint Race', raceStartEndurance: 'Endurance Race', greenFlagStarted: 'Green Flag. {race} Started.', sectorClear: 'Sector 1 Clear. Good pace.', fuelWarn: 'WARN: Fuel load approaching limit.', wipCritical: 'CRITICAL: WIP limit exceeded! Reduce fuel load.', dragDetected: '{key} High Drag Detected.', stalledBox: '{key} Stalled > {hours}h. BOX BOX!' },
        fr: { raceStartSprint: 'Course Sprint', raceStartEndurance: "Course d'Endurance", greenFlagStarted: 'Drapeau Vert. {race} démarrée.', sectorClear: 'Secteur 1 dégagé. Bon rythme.', fuelWarn: "ALERTE : Charge de carburant proche de la limite.", wipCritical: 'CRITIQUE : Limite WIP dépassée ! Réduire la charge.', dragDetected: '{key} Traînée élevée détectée.', stalledBox: '{key} En panne > {hours}h. BOX BOX !' },
        es: { raceStartSprint: 'Carrera Sprint', raceStartEndurance: 'Carrera de Resistencia', greenFlagStarted: 'Bandera Verde. {race} iniciada.', sectorClear: 'Sector 1 despejado. Buen ritmo.', fuelWarn: 'ADVERTENCIA: Carga de combustible acercándose al límite.', wipCritical: 'CRÍTICO: ¡Límite de WIP excedido! Reducir carga.', dragDetected: '{key} Alta resistencia detectada.', stalledBox: '{key} Atascado > {hours}h. ¡BOX BOX!' },
        pt: { raceStartSprint: 'Corrida Sprint', raceStartEndurance: 'Corrida de Endurance', greenFlagStarted: 'Bandeira Verde. {race} iniciada.', sectorClear: 'Setor 1 livre. Bom ritmo.', fuelWarn: 'AVISO: Carga de combustível se aproximando do limite.', wipCritical: 'CRÍTICO: Limite de WIP excedido! Reduzir carga.', dragDetected: '{key} Alta resistência detectada.', stalledBox: '{key} Parado > {hours}h. BOX BOX!' }
    };
    const dict = FEED_I18N[locale] || FEED_I18N.en;
    const feed: Array<{ time: string; msg: string; type: 'info' | 'success' | 'warning' | 'critical' }> = [];
    const now = new Date();
    const raceType = boardType === 'kanban' ? dict.raceStartEndurance : dict.raceStartSprint;
    feed.push({ time: formatTime(new Date(now.getTime() - 3600000 * 4), locale), msg: dict.greenFlagStarted.replace('{race}', raceType), type: 'info' });
    const wipLoad = telemetry.wipLoad ?? 0;
    if (wipLoad < 80) feed.push({ time: formatTime(new Date(now.getTime() - 3600000 * 2), locale), msg: dict.sectorClear, type: 'success' });
    if (wipLoad >= 80 && wipLoad < 100) feed.push({ time: formatTime(new Date(now.getTime() - 3600000), locale), msg: dict.fuelWarn, type: 'warning' });
    if (wipLoad >= 100) feed.push({ time: formatTime(new Date(now.getTime() - 1800000), locale), msg: dict.wipCritical, type: 'critical' });
    stalledTickets.forEach(ticket => {
        feed.push({ time: formatTime(new Date(now.getTime() - 1800000), locale), msg: dict.dragDetected.replace('{key}', ticket.key), type: 'warning' });
        feed.push({ time: formatTime(now, locale), msg: dict.stalledBox.replace('{key}', ticket.key).replace('{hours}', String(ticket.hoursSinceUpdate)), type: 'critical' });
    });
    return feed;
}

function formatTime(date: Date, locale: 'en' | 'fr' | 'es' | 'pt'): string {
    const locMap: Record<string, string> = { en: 'en-US', fr: 'fr-FR', es: 'es-ES', pt: 'pt-PT' };
    return date.toLocaleTimeString(locMap[locale] || 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Registers all telemetry-related resolvers on the provided resolver instance
 */
export function registerTelemetryResolvers(resolver: any): void {

    resolver.define('getTelemetryData', async ({ payload, context }: any) => {
        try {
            const userConfig = await getEffectiveConfig(context, payload);
            console.log('[ENTRY] getTelemetryData for project:', context?.extension?.project?.key);

            if (PLATFORM === 'local') return { success: true, data: mockTelemetry() };

            const projectKey = context.extension.project.key as string;
            await TelemetryService.discoverCustomFields();
            const statusMap = await statusMapService.getProjectStatusMap(projectKey);

            // Get Strict Context
            // Cast to InternalContext by ensuring nulls are undefined
            const boardId = payload?.boardId ? parseInt(String(payload.boardId)) : undefined;
            const baseCtx = await getProjectContext(projectKey, boardId);
            const ctx: InternalContext = {
                ...baseCtx,
                sprintId: baseCtx.sprintId ?? undefined,
                boardId: baseCtx.boardId ?? undefined,
                sprintName: baseCtx.sprintName ?? undefined
            };

            console.log(`[Context] ${ctx.projectType} | ${ctx.boardStrategy} | Est: ${ctx.estimationMode}`);

            const boardData: BoardData = await boardRepository.getBoardData(projectKey, userConfig, context);
            const telemetry: TelemetryData = await TelemetryService.calculateTelemetry(boardData, userConfig, ctx, statusMap);
            const stalledTickets: StalledTicket[] = TelemetryService.detectStalledTickets(boardData.issues, userConfig, statusMap);

            // Filter Metrics based on Strict Validity
            // If metric is invalid, we null it out or mark it
            if (ctx.metricValidity.velocity === 'hidden') telemetry.velocity = undefined;
            if (ctx.metricValidity.sprintHealth === 'hidden') telemetry.healthStatus = undefined;

            const fetchStatuses = getFetchStatuses();
            const diagnostics = { velocitySource: telemetry.velocitySource, velocityWindow: telemetry.velocityWindow, fetchStatuses };

            // Generate F1-style feed messages
            const boardTypeForFeed = (ctx.projectType === 'business' ? 'business' : (ctx.boardStrategy === 'kanban' ? 'kanban' : 'scrum')) as 'scrum' | 'kanban' | 'business';
            const feed = generateFeed(telemetry, stalledTickets, boardTypeForFeed, userConfig.locale as any, fetchStatuses);

            return {
                success: true,
                data: {
                    ...telemetry,
                    // Inject Strict Context for Frontend
                    context: {
                        projectType: ctx.projectType,
                        boardStrategy: ctx.boardStrategy,
                        agileCapability: ctx.agileCapability,
                        estimationMode: ctx.estimationMode,
                        metricValidity: ctx.metricValidity
                    },
                    boardId: ctx.boardId || boardData.boardId, // Prefer context boardId
                    sprintName: ctx.sprintName || boardData.boardName,
                    stalledTickets,
                    diagnostics,
                    alertActive: stalledTickets.length > 0,
                    feed  // F1-style feed messages for Strategy Assistant
                }
            };
        } catch (error: any) {
            console.error('Error fetching telemetry:', error);
            return { success: false, error: error.message || 'Failed to fetch telemetry data' };
        }
    });

    resolver.define('getSprintIssues', async ({ payload, context }: any) => {
        try {
            const userConfig = await getEffectiveConfig(context, payload);
            console.log('[ENTRY] getSprintIssues for project:', context?.extension?.project?.key);
            if (PLATFORM === 'local') { return { success: true, boardType: 'scrum', sprintName: 'Local Board', issues: mockIssues() }; }
            const projectKey = context.extension.project.key as string;
            const boardData: BoardData = await boardRepository.getBoardData(projectKey, userConfig, context);
            const statusMap = await statusMapService.getProjectStatusMap(projectKey);
            const stalledTickets = TelemetryService.detectStalledTickets(boardData.issues, userConfig, statusMap);

            const stalledKeys = new Set(stalledTickets.map(t => t.key));
            let columns: Array<{ name: string; statuses: Array<{ name: string }> }> = [];

            // Attempt to get board columns if available
            try {
                if (boardData.boardId) {
                    columns = await getBoardColumns(boardData.boardId);
                }
            } catch { }

            // Fallback if no columns found
            const useFallback = columns.length === 0;
            if (useFallback) {
                columns = [
                    { name: 'To Do', statuses: [] },
                    { name: 'In Progress', statuses: [] },
                    { name: 'Done', statuses: [] }
                ];
            }

            const categorizedIssues: CategorizedIssue[] = TelemetryService.categorizeIssues(boardData.issues, statusMap).map(issue => {
                let colName = mapStatusToColumn(issue.status, columns);
                if (!colName && useFallback) {
                    if (issue.statusCategory === 'new') colName = 'To Do';
                    else if (issue.statusCategory === 'done') colName = 'Done';
                    else colName = 'In Progress';
                }
                return {
                    ...issue,
                    isStalled: stalledKeys.has(issue.key),
                    column: colName || undefined
                };
            });
            const columnNames = columns.map(c => c.name);

            let sprintName = boardData.boardName;
            if (boardData.boardType === 'scrum' && boardData.sprint) {
                sprintName = boardData.sprint.name;
            }

            return { success: true, boardType: boardData.boardType, sprintName, issues: categorizedIssues, columns: columnNames };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    resolver.define('getBoardInfo', async ({ context }: any) => {
        try {
            const projectKey = context.extension.project.key as string;
            const boardInfo = await boardRepository.detectBoardType(projectKey);
            return { success: true, ...boardInfo };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    resolver.define('getContext', async ({ payload, context }: any) => {
        try {
            const projectKey = context?.extension?.project?.key as string;
            if (!projectKey) return { success: false, error: 'No project context' };
            const boardId = payload?.boardId ? parseInt(String(payload.boardId)) : undefined;
            const ctx = await getProjectContext(projectKey, boardId);
            return { success: true, context: ctx, summary: getContextSummary(ctx) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    resolver.define('getTelemetryDiagnostics', async ({ payload, context }: any) => {
        try {
            if (PLATFORM === 'local') return { success: true, diagnostics: { velocitySource: 'mock', velocityWindow: 'mock', fetchStatuses: [] } };
            const userConfig = await getEffectiveConfig(context);
            const projectKey = context.extension.project.key as string;
            const boardId = payload?.boardId ? parseInt(String(payload.boardId)) : undefined;

            const baseCtx = await getProjectContext(projectKey, boardId);
            const ctx: InternalContext = {
                ...baseCtx,
                sprintId: baseCtx.sprintId ?? undefined,
                boardId: baseCtx.boardId ?? undefined,
                sprintName: baseCtx.sprintName ?? undefined
            };

            const boardData: BoardData = await boardRepository.getBoardData(projectKey, userConfig, context);
            const statusMap = await statusMapService.getProjectStatusMap(projectKey);
            const telemetry: TelemetryData = await TelemetryService.calculateTelemetry(boardData, userConfig, ctx, statusMap);
            const fetchStatuses = getFetchStatuses();
            return {
                success: true,
                diagnostics: {
                    velocitySource: telemetry.velocitySource,
                    velocityWindow: telemetry.velocityWindow,
                    cycleTimeWindow: telemetry.cycleTimeWindow,
                    throughputWindow: telemetry.throughputWindow,
                    fetchStatuses,
                    boardType: boardData.boardType,
                    sprintName: boardData.sprint?.name || boardData.boardName
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });
}
