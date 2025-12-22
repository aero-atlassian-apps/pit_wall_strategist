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
    // B-003 FIX: Surface multi-board information
    boardFallbackUsed?: boolean;
    availableBoardCount?: number;
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

    // Default Initialization - SAFE DEFAULTS (No Assumptions)
    const ctx: ExtendedProjectContext = {
        projectKey,
        projectName: '',
        projectType: 'business', // Default to lowest capability (Business) until proven Software
        boardStrategy: 'none',
        agileCapability: 'none',
        estimationMode: 'issueCount',
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
        if (!projectResp.ok) {
            throw new Error(`Failed to fetch project ${projectKey}`);
        }

        const project = await projectResp.json();
        ctx.projectName = project.name || projectKey;

        // STRICT Project Type Detection
        // Map Jira projectTypeKey to our internal ProjectType
        // software -> software
        // business -> business
        // service_desk -> business (treated as non-agile for our purposes)
        switch (project.projectTypeKey) {
            case 'software':
                ctx.projectType = 'software';
                break;
            case 'business':
            case 'service_desk':
            case 'service_management':
            default:
                ctx.projectType = 'business';
                break;
        }

        // 2. Detect Board Strategy - STRICT (No Fallbacks)
        // If specific board requested -> use it.
        // If no board requested -> check if ONLY ONE board exists.
        // If multiple boards exist and none requested -> DO NOT GUESS. Return 'none' strategy.
        const boardsResp = await api.asApp().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}&maxResults=50`, { headers: { Accept: 'application/json' } });
        if (boardsResp.ok) {
            const boards = await boardsResp.json();
            ctx.availableBoardCount = boards.values?.length || 0;

            if (boards.values && boards.values.length > 0) {
                let board = null;
                ctx.boardFallbackUsed = false;

                if (requestedBoardId) {
                    // Case A: Specific Board Requested
                    board = boards.values.find((b: any) => b.id === requestedBoardId);
                    if (!board) {
                        console.warn(`[ContextEngine] Requested board ${requestedBoardId} not found.`);
                    }
                } else if (boards.values.length === 1) {
                    // Case B: Exactly One Board (Ambiguity Free)
                    board = boards.values[0];
                } else {
                    // Case C: Multiple Boards && No ID -> AMBIGUOUS.
                    // DO NOT GUESS.
                    console.warn(`[ContextEngine] Multiple boards found (${boards.values.length}). Ambiguous context. Waiting for user selection.`);
                    // ctx.boardStrategy remains 'none'
                }

                if (board) {
                    ctx.boardId = board.id;
                    const type = (board.type || '').toLowerCase();
                    if (type === 'scrum') ctx.boardStrategy = 'scrum';
                    else if (type === 'kanban') ctx.boardStrategy = 'kanban';
                    // else remains 'none'
                }
            }
        }

        // 2.5 Populate Workflow Topology (Early for Column Analysis)
        // This is critical for deriving Done columns correctly via categories
        const statusMapData = await getProjectStatusMap(projectKey);
        ctx.workflow.statusMap = {};
        Object.entries(statusMapData.byId).forEach(([id, entry]) => {
            ctx.workflow.statusMap[id] = entry.category;
            ctx.workflow.statusMap[entry.name.toLowerCase()] = entry.category;
        });

        // 3. Fetch Board Config & Columns (Only if we have a valid board strategy)
        if (ctx.boardId && ctx.boardStrategy !== 'none') {
            const configResp = await api.asApp().requestJira(route`/rest/agile/1.0/board/${ctx.boardId}/configuration`, { headers: { Accept: 'application/json' } });
            if (configResp.ok) {
                const config = await configResp.json();

                // Process Columns
                if (config.columnConfig?.columns) {
                    ctx.columns = config.columnConfig.columns.map((col: any) => ({
                        name: col.name,
                        statuses: (col.statuses || []).map((s: any) => ({ id: s.id, name: '', categoryKey: '' }))
                    }));

                    // C-002: STRICT DONE COLUMN DETECTION
                    // Must contain at least one status with category 'done'
                    let doneColName: string | null = null;

                    // Find the rightmost column that contains at least one DONE status
                    // Iterate backwards for efficiency as Done is usually at the end
                    for (let i = ctx.columns.length - 1; i >= 0; i--) {
                        const col = ctx.columns[i];
                        const hasDoneStatus = col.statuses.some((s: any) => ctx.workflow.statusMap[s.id] === 'done');
                        if (hasDoneStatus) {
                            doneColName = col.name;
                            break; // strict lock on first valid done column from right
                        }
                    }

                    // ZERO ASSUMPTIONS: If no column has Done status, we do NOT set a doneColumn.
                    // We do NOT guess by name "Done" or "Closed". Categories are the source of truth.
                    ctx.doneColumn = doneColName;
                }

                // Detect Estimation Mode based on Board Config
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
        } else {
            ctx.agileCapability = 'none'; // Fallback for software projects with no board/ambiguous board
        }

        // 5. Compute Metric Validity (STRICT RULES)
        ctx.metricValidity = computeMetricValidity(ctx);

        // 6. Fetch Backlog & Sprints (If Scrum and Active Board)
        if (ctx.boardStrategy === 'scrum' && ctx.boardId) {
            // Only fetch active sprints
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
        // Derive startStatuses: The "In Progress" entry point
        if (ctx.columns && ctx.columns.length > 0) {
            for (const col of ctx.columns) {
                const colStatuses = col.statuses.map(s => s.id);
                // Check if this column has ANY indeterminate status
                const hasIndeterminate = colStatuses.some(id => ctx.workflow.statusMap[id] === 'indeterminate');
                if (hasIndeterminate) {
                    // Identify specific indeterminate statuses in this column
                    const indeterminateStatuses = colStatuses.filter(id => ctx.workflow.statusMap[id] === 'indeterminate');
                    if (indeterminateStatuses.length > 0) {
                        ctx.workflow.startStatuses = indeterminateStatuses;
                        break; // Found the start column
                    }
                }
            }
        }

        // Fallback: If map lookup failed completely (empty columns?), rely strictly on status categories
        if (ctx.workflow.startStatuses.length === 0) {
            ctx.workflow.startStatuses = Object.entries(ctx.workflow.statusMap)
                .filter(([_, cat]) => cat === 'indeterminate')
                .map(([key, _]) => key);
        }

        ctx.workflow.doneStatuses = Object.entries(ctx.workflow.statusMap)
            .filter(([_, cat]) => cat === 'done')
            .map(([key, _]) => key);

        // Cache
        contextCache[cacheKey] = { context: ctx, timestamp: Date.now() };

    } catch (e) {
        console.error('CRITICAL: Failed to build project context', e);
        // Do NOT return a half-baked context. If we failed to get project info, we should probably throw.
        // However, resolvers expect a context. We return the SAFE DEFAULT (Business/None) context initialized above.
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
// C-010 FIX: Export for unit testing
export function computeMetricValidity(ctx: InternalContext): MetricValidity {
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

    // RULE 2.5: Scrum with NO Active Sprint (e.g. between sprints)
    // M-003 FIX: Context-aware validity for inter-sprint periods
    if (ctx.boardStrategy === 'scrum' && !ctx.sprintId) {
        v.sprintHealth = 'hidden';
        v.sprintProgress = 'hidden';
        v.scopeCreep = 'hidden';
        // Velocity (historic) remains valid as it shows past performance
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
