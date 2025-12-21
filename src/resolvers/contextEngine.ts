/**
 * Context Engine - Board, Workflow, and Hierarchy Discovery
 * 
 * This module provides a unified context object that describes the current Jira environment:
 * - Board type (Scrum vs Kanban)
 * - Board columns with status mappings
 * - Workflow statuses and their categories (TODO, IN_PROGRESS, DONE)
 * - Issue type hierarchy (Epics → Stories → Subtasks)
 */

import api, { route } from '@forge/api'

export interface BoardColumn {
    name: string
    statuses: Array<{ id: string; name: string; categoryKey: string }>
}

export interface WorkflowStatus {
    id: string
    name: string
    categoryKey: 'new' | 'indeterminate' | 'done' | 'undefined'
    categoryName: string
}

export interface IssueTypeInfo {
    id: string
    name: string
    subtask: boolean
    hierarchyLevel: number // 0=Epic, 1=Story, 2=Subtask
}

export interface ProjectContext {
    projectKey: string
    projectName: string
    boardId: number | null
    boardType: 'scrum' | 'kanban' | 'unknown'
    sprintId: number | null
    sprintName: string | null
    sprintState: string | null
    columns: BoardColumn[]
    doneColumn: string | null
    statuses: WorkflowStatus[]
    issueTypes: IssueTypeInfo[]
    issueHierarchy: {
        epics: string[]      // Issue type names at epic level
        standard: string[]   // Story, Task, Bug level
        subtasks: string[]   // Sub-task level
    }
}

// Cache to avoid repeated API calls
let contextCache: { [projectKey: string]: { context: ProjectContext; timestamp: number } } = {}
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches the complete context for a Jira project
 */
export async function getProjectContext(projectKey: string): Promise<ProjectContext> {
    // Check cache first
    const cached = contextCache[projectKey]
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.context
    }

    const context: ProjectContext = {
        projectKey,
        projectName: '',
        boardId: null,
        boardType: 'unknown',
        sprintId: null,
        sprintName: null,
        sprintState: null,
        columns: [],
        doneColumn: null,
        statuses: [],
        issueTypes: [],
        issueHierarchy: { epics: [], standard: [], subtasks: [] }
    }

    try {
        // 1. Fetch project info
        const projectResp = await api.asApp().requestJira(
            route`/rest/api/3/project/${projectKey}`,
            { headers: { Accept: 'application/json' } }
        )
        if (projectResp.ok) {
            const project = await projectResp.json()
            context.projectName = project.name || projectKey
        }

        // 2. Find the board for this project
        const boardsResp = await api.asApp().requestJira(
            route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}&maxResults=1`,
            { headers: { Accept: 'application/json' } }
        )
        if (boardsResp.ok) {
            const boards = await boardsResp.json()
            if (boards.values && boards.values.length > 0) {
                const board = boards.values[0]
                context.boardId = board.id
                context.boardType = (board.type || '').toLowerCase() as 'scrum' | 'kanban'
            }
        }

        // 3. Fetch board configuration (columns)
        if (context.boardId) {
            const configResp = await api.asApp().requestJira(
                route`/rest/agile/1.0/board/${context.boardId}/configuration`,
                { headers: { Accept: 'application/json' } }
            )
            if (configResp.ok) {
                const config = await configResp.json()
                if (config.columnConfig?.columns) {
                    context.columns = config.columnConfig.columns.map((col: any) => ({
                        name: col.name,
                        statuses: (col.statuses || []).map((s: any) => ({
                            id: s.id,
                            name: '', // Will be enriched from project statuses below
                            categoryKey: ''
                        }))
                    }))
                    // Identify the "Done" column (usually last or named "Done")
                    const doneCol = context.columns.find(c =>
                        c.name.toLowerCase() === 'done' ||
                        c.name.toLowerCase() === 'closed' ||
                        c.name.toLowerCase() === 'complete'
                    ) || context.columns[context.columns.length - 1]
                    context.doneColumn = doneCol?.name || null
                }
            }

            // 4. Fetch active sprint (Scrum only)
            if (context.boardType === 'scrum') {
                const sprintResp = await api.asApp().requestJira(
                    route`/rest/agile/1.0/board/${context.boardId}/sprint?state=active`,
                    { headers: { Accept: 'application/json' } }
                )
                if (sprintResp.ok) {
                    const sprints = await sprintResp.json()
                    if (sprints.values && sprints.values.length > 0) {
                        const sprint = sprints.values[0]
                        context.sprintId = sprint.id
                        context.sprintName = sprint.name
                        context.sprintState = sprint.state
                    }
                }
            }
        }

        // 5. Fetch all statuses for the project
        const statusesResp = await api.asApp().requestJira(
            route`/rest/api/3/project/${projectKey}/statuses`,
            { headers: { Accept: 'application/json' } }
        )
        if (statusesResp.ok) {
            const statusesByType = await statusesResp.json()
            const statusMap = new Map<string, WorkflowStatus>()
            for (const issueType of statusesByType) {
                for (const status of issueType.statuses || []) {
                    if (!statusMap.has(status.id)) {
                        statusMap.set(status.id, {
                            id: status.id,
                            name: status.name,
                            categoryKey: status.statusCategory?.key || 'undefined',
                            categoryName: status.statusCategory?.name || 'Unknown'
                        })
                    }
                }
            }
            context.statuses = Array.from(statusMap.values())

            // Enrich column statuses with names and categories
            for (const col of context.columns) {
                for (const colStatus of col.statuses) {
                    const found = context.statuses.find(s => s.id === colStatus.id)
                    if (found) {
                        colStatus.name = found.name
                        colStatus.categoryKey = found.categoryKey
                    }
                }
            }
        }

        // 6. Fetch issue types and hierarchy
        const issueTypesResp = await api.asApp().requestJira(
            route`/rest/api/3/project/${projectKey}`,
            { headers: { Accept: 'application/json' }, }
        )
        if (issueTypesResp.ok) {
            const projectData = await issueTypesResp.json()
            const types = projectData.issueTypes || []
            for (const t of types) {
                const level = t.hierarchyLevel ?? (t.subtask ? 2 : (t.name?.toLowerCase().includes('epic') ? 0 : 1))
                context.issueTypes.push({
                    id: t.id,
                    name: t.name,
                    subtask: t.subtask || false,
                    hierarchyLevel: level
                })

                if (level === 0 || t.name?.toLowerCase().includes('epic') || t.name?.toLowerCase().includes('initiative')) {
                    context.issueHierarchy.epics.push(t.name)
                } else if (t.subtask || level === 2) {
                    context.issueHierarchy.subtasks.push(t.name)
                } else {
                    context.issueHierarchy.standard.push(t.name)
                }
            }
        }

        // Cache the result
        contextCache[projectKey] = { context, timestamp: Date.now() }

    } catch (error: any) {
        console.error('[ContextEngine] Error fetching context:', error.message)
    }

    return context
}

/**
 * Returns a simplified context summary suitable for the Rovo Agent prompt
 */
export function getContextSummary(ctx: ProjectContext): string {
    const lines: string[] = []
    lines.push(`Project: ${ctx.projectName} (${ctx.projectKey})`)
    lines.push(`Board Type: ${ctx.boardType.toUpperCase()}`)

    if (ctx.boardType === 'scrum' && ctx.sprintName) {
        lines.push(`Active Sprint: ${ctx.sprintName} (${ctx.sprintState})`)
    }

    lines.push(`Columns: ${ctx.columns.map(c => c.name).join(' → ')}`)
    lines.push(`Done Column: ${ctx.doneColumn}`)

    const todoStatuses = ctx.statuses.filter(s => s.categoryKey === 'new').map(s => s.name)
    const inProgressStatuses = ctx.statuses.filter(s => s.categoryKey === 'indeterminate').map(s => s.name)
    const doneStatuses = ctx.statuses.filter(s => s.categoryKey === 'done').map(s => s.name)

    lines.push(`TODO Statuses: ${todoStatuses.join(', ') || 'None'}`)
    lines.push(`IN_PROGRESS Statuses: ${inProgressStatuses.join(', ') || 'None'}`)
    lines.push(`DONE Statuses: ${doneStatuses.join(', ') || 'None'}`)

    lines.push(`Issue Types: Epics=[${ctx.issueHierarchy.epics.join(',')}], Standard=[${ctx.issueHierarchy.standard.join(',')}], Subtasks=[${ctx.issueHierarchy.subtasks.join(',')}]`)

    return lines.join('\n')
}

/**
 * Clears the context cache (useful for testing or manual refresh)
 */
export function clearContextCache(projectKey?: string) {
    if (projectKey) {
        delete contextCache[projectKey]
    } else {
        contextCache = {}
    }
}
