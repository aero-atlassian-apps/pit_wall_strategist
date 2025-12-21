/**
 * Context Engine - Unified Source of Truth
 * 
 * Determines:
 * - Project Type (Business vs Software)
 * - Board Strategy (Scrum vs Kanban)
 * - Agile Capabilities
 * - Metric Validity (Strict visibility rules)
 */

import api, { route } from '@forge/api';
import {
    InternalContext,
    ProjectType,
    BoardStrategy,
    AgileCapability,
    EstimationMode,
    MetricValidity,
    DEFAULT_METRIC_VALIDITY,
    StatusCategory,
    WorkflowTopology
} from '../domain/types/Context';
import { getProjectStatusMap } from './statusMap';

// Existing Interfaces (kept for compatibility with older parts, but InternalContext is preferred)
export interface BoardColumn {
    name: string
    statuses: Array<{ id: string; name: string; categoryKey: string }>
}

export interface IssueTypeInfo {
    id: string
    name: string
    subtask: boolean
    hierarchyLevel: number
}

// Extends InternalContext with detailed metadata needed for resolvers but not necessarily for generic context
export interface ExtendedProjectContext extends InternalContext {
    boardId: number | undefined;
    sprintId: number | undefined;
    sprintName: string | undefined;
    sprintState: string | undefined;
    columns: BoardColumn[];
    doneColumn: string | null;
    statuses: any[];
    issueTypes: IssueTypeInfo[];
    issueHierarchy: {
        epics: string[];
        standard: string[];
        subtasks: string[];
    };
    // Explicitly match InternalContext's workflow type
    workflow: WorkflowTopology;
}

let contextCache: { [projectKey: string]: { context: ExtendedProjectContext; timestamp: number } } = {};
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetches the complete, strictly-typed context for a Jira project.
 * @param projectKey - The Jira project key.
 * @param requestedBoardId - Optional: specific board ID to use (solves the Single Board Trap).
 */
export async function getProjectContext(projectKey: string, requestedBoardId?: number): Promise<ExtendedProjectContext> {
    const cacheKey = requestedBoardId ? `${projectKey}:${requestedBoardId}` : projectKey;
    const cached = contextCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.context;
    }

    // Default Initialization
    const ctx: ExtendedProjectContext = {
        projectKey,
        projectName: '',
        projectType: 'software', // Assume software first, downgrade if needed
        boardStrategy: 'none',
        agileCapability: 'none',
        estimationMode: 'issueCount', // Default
        metricValidity: { ...DEFAULT_METRIC_VALIDITY },
        locale: 'en',
        workflow: {
            statusMap: {},
            flowOrder: [],
            startStatuses: [],
            doneStatuses: []
        },

        // Metadata
        boardId: undefined,
        sprintId: undefined,
        sprintName: undefined,
        sprintState: undefined,
        columns: [],
        doneColumn: null,
        statuses: [],
        issueTypes: [],
        issueHierarchy: { epics: [], standard: [], subtasks: [] }
    };

    try {
        // 1. Fetch Project Info
        const projectResp = await api.asApp().requestJira(route`/rest/api/3/project/${projectKey}`, { headers: { Accept: 'application/json' } });
        if (projectResp.ok) {
            const project = await projectResp.json();
            ctx.projectName = project.name || projectKey;

            // Detect Business Projects (Jire Work Management)
            // JWM projects often have projectTypeKey 'business'
            if (project.projectTypeKey === 'business') {
                ctx.projectType = 'business';
            }
        }

        // 2. Detect Board Strategy
        const boardsResp = await api.asApp().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}&maxResults=50`, { headers: { Accept: 'application/json' } });
        if (boardsResp.ok) {
            const boards = await boardsResp.json();
            if (boards.values && boards.values.length > 0) {
                // Determine which board to use:
                // 1. The requested board ID if provided and valid.
                // 2. The first board found otherwise (legacy/default).
                let board = boards.values[0];
                if (requestedBoardId) {
                    const found = boards.values.find((b: any) => b.id === requestedBoardId);
                    if (found) board = found;
                }

                ctx.boardId = board.id;
                const type = (board.type || '').toLowerCase();

                if (type === 'scrum') ctx.boardStrategy = 'scrum';
                else if (type === 'kanban') ctx.boardStrategy = 'kanban';
                else ctx.boardStrategy = 'none';
            }
        }

        // 3. Fetch Board Config & Columns
        if (ctx.boardId) {
            const configResp = await api.asApp().requestJira(route`/rest/agile/1.0/board/${ctx.boardId}/configuration`, { headers: { Accept: 'application/json' } });
            if (configResp.ok) {
                const config = await configResp.json();

                // Process Columns
                if (config.columnConfig?.columns) {
                    ctx.columns = config.columnConfig.columns.map((col: any) => ({
                        name: col.name,
                        statuses: (col.statuses || []).map((s: any) => ({ id: s.id, name: '', categoryKey: '' }))
                    }));

                    const doneCol = ctx.columns.find(c => ['done', 'closed', 'complete'].includes(c.name.toLowerCase())) || ctx.columns[ctx.columns.length - 1];
                    ctx.doneColumn = doneCol?.name || null;
                }

                // Detect Estimation Mode based on Board Config
                // "estimation" object usually contains field info
                if (config.estimation && config.estimation.field && config.estimation.field.displayName) {
                    const fieldName = config.estimation.field.displayName.toLowerCase();
                    if (fieldName.includes('story point') || fieldName.includes('story points')) {
                        ctx.estimationMode = 'storyPoints';
                    }
                }
            }
        }

        // 4. Determine Agile Capabilities & Validity
        if (ctx.projectType === 'business') {
            ctx.agileCapability = 'none';
        } else if (ctx.boardStrategy === 'scrum') {
            ctx.agileCapability = 'full';
        } else if (ctx.boardStrategy === 'kanban') {
            ctx.agileCapability = 'limited';
        }

        // 5. Compute Metric Validity (STRICT RULES)
        ctx.metricValidity = computeMetricValidity(ctx);

        // 6. Fetch Backlog & Sprints (If Scrum)
        if (ctx.boardStrategy === 'scrum' && ctx.boardId) {
            const sprintResp = await api.asApp().requestJira(route`/rest/agile/1.0/board/${ctx.boardId}/sprint?state=active`, { headers: { Accept: 'application/json' } });
            if (sprintResp.ok) {
                const sprints = await sprintResp.json();
                if (sprints.values && sprints.values.length > 0) {
                    const sprint = sprints.values[0];
                    ctx.sprintId = sprint.id;
                    ctx.sprintName = sprint.name;
                    ctx.sprintState = sprint.state;
                }
            }
        }

        // 7. Populate Statuses & Issue Types (Metadata for Resolvers)
        const projectFullResp = await api.asApp().requestJira(route`/rest/api/3/project/${projectKey}`, { headers: { Accept: 'application/json' } });
        if (projectFullResp.ok) {
            const projectData = await projectFullResp.json();
            const types = projectData.issueTypes || [];

            // Populate Hierarchy
            for (const t of types) {
                const level = t.hierarchyLevel ?? (t.subtask ? 2 : (t.name?.toLowerCase().includes('epic') ? 0 : 1));
                ctx.issueTypes.push({ id: t.id, name: t.name, subtask: t.subtask || false, hierarchyLevel: level });

                if (level === 0) ctx.issueHierarchy.epics.push(t.name);
                else if (level === 2) ctx.issueHierarchy.subtasks.push(t.name);
                else ctx.issueHierarchy.standard.push(t.name);
            }
        }

        // 8. Populate Workflow Topology (Strict Map)
        const statusMapData = await getProjectStatusMap(projectKey);
        ctx.workflow.statusMap = {};
        Object.entries(statusMapData.byId).forEach(([id, entry]) => {
            ctx.workflow.statusMap[id] = entry.category;
            // Also map by name for resilience
            ctx.workflow.statusMap[entry.name.toLowerCase()] = entry.category;
        });

        ctx.workflow.startStatuses = Object.entries(ctx.workflow.statusMap)
            .filter(([_, cat]) => cat === 'indeterminate')
            .map(([key, _]) => key);

        ctx.workflow.doneStatuses = Object.entries(ctx.workflow.statusMap)
            .filter(([_, cat]) => cat === 'done')
            .map(([key, _]) => key);

        // Cache
        contextCache[cacheKey] = { context: ctx, timestamp: Date.now() };

    } catch (e) {
        console.error('CRITICAL: Failed to build project context', e);
    }

    return ctx;
}

/**
 * STRICT RULE ENGINE for Metric Validity
 * 
 * @rule Business Projects: Sprint metrics hidden (no timeboxes)
 * @rule Kanban Boards: Sprint metrics hidden (flow-based, no iterations)
 * @rule All Contexts: Flow metrics (WIP, cycle time, throughput) always valid
 */
function computeMetricValidity(ctx: InternalContext): MetricValidity {
    const v: MetricValidity = { ...DEFAULT_METRIC_VALIDITY };

    // RULE 1: Business Projects have NO Sprint/Velocity metrics
    if (ctx.projectType === 'business') {
        v.velocity = 'hidden';
        v.sprintHealth = 'hidden';
        v.sprintProgress = 'hidden';
        v.scopeCreep = 'hidden'; // Scope creep is sprint-based
    }

    // RULE 2: Kanban has NO Sprint metrics (flow-based, no iterations)
    if (ctx.boardStrategy === 'kanban') {
        v.velocity = 'hidden';     // Velocity is iteration-based. Throughput is for Kanban.
        v.sprintHealth = 'hidden'; // No fixed timebox
        v.sprintProgress = 'hidden';
        v.scopeCreep = 'hidden';
    }

    // RULE 3: If no estimation (Issue Count only), velocity still valid but displayed as count
    // Decision: Keep 'velocity' valid but Frontend handles unit display (Points vs Count)

    // RULE 4: Flow metrics are ALWAYS valid for everyone
    // These apply to all projects regardless of type or board strategy
    v.cycleTime = 'valid';
    v.leadTime = 'valid';
    v.wip = 'valid';
    v.wipConsistency = 'valid';
    v.throughput = 'valid';
    v.flowEfficiency = 'valid';

    return v;
}

export function getContextSummary(ctx: ExtendedProjectContext): string {
    return [
        `Project: ${ctx.projectName} (${ctx.projectType})`,
        `Strategy: ${ctx.boardStrategy.toUpperCase()}`,
        `Estimation: ${ctx.estimationMode}`,
        `Active Sprint: ${ctx.sprintName || 'None'}`,
        `Valid Metrics: ${Object.keys(ctx.metricValidity).filter(k => ctx.metricValidity[k] === 'valid').join(', ')}`
    ].join('\n');
}

export function clearContextCache(projectKey?: string) {
    if (projectKey) delete contextCache[projectKey];
    else contextCache = {};
}
