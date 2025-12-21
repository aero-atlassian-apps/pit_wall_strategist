/**
 * STRICT SOURCE OF TRUTH CONTEXT MODEL
 * 
 * This model defines the absolute truth about the current execution environment.
 * It is computed ONCE in the backend and propagated to all consumers (Frontend, Rovo, Advisors).
 */

export type ProjectType = 'business' | 'software';
export type BoardStrategy = 'scrum' | 'kanban' | 'none';
export type AgileCapability = 'full' | 'limited' | 'none';
export type EstimationMode = 'storyPoints' | 'issueCount';

export type MetricValidityStatus = 'valid' | 'hidden' | 'disabled';
export interface MetricValidity {
    [metricKey: string]: MetricValidityStatus;
}

export type StatusCategory = 'new' | 'indeterminate' | 'done';

export interface WorkflowTopology {
    /** Map of "Status ID" or "Status Name" -> Standard Category */
    statusMap: Record<string, StatusCategory>;

    /** Order of statuses in the workflow (if detectable) */
    flowOrder?: string[];

    /** Which explicit statuses mean "Work is Started" (exiting ToDo) */
    startStatuses: string[];

    /** Which explicit statuses mean "Work is Done" */
    doneStatuses: string[];
}

export interface InternalContext {
    /** The raw Project Key (e.g., "PROJ") */
    projectKey: string;

    /** The raw Project Name */
    projectName: string;

    /** The type of project we are running in */
    projectType: ProjectType;

    /** The strategy of the active board (or none if Business project) */
    boardStrategy: BoardStrategy;

    /** The level of Agile features applicable here */
    agileCapability: AgileCapability;

    /** How work is estimated in this context */
    estimationMode: EstimationMode;

    /** 
     * Computed map of valid metrics.
     * Frontend and Rovo MUST check this before displaying or discussing a metric.
     */
    metricValidity: MetricValidity;

    /** 
     * The Topology of the workflow in this context.
     * USED FOR: Cycle Time, Lead Time, WIP, Transition Validation.
     * NEVER GUESS STATUS MEANINGS DOWNSTREAM. 
     */
    workflow: WorkflowTopology;

    /**
     * Localization Context
     */
    locale: string;

    /** 
     * Active Sprint Context (Strict)
     * If boardStrategy is 'scrum', this MAY be present.
     */
    sprintId?: number;
    boardId?: number;
    sprintName?: string;
}

/**
 * Default metric validity - all metrics valid by default.
 * Context engine will override based on project/board configuration.
 */
export const DEFAULT_METRIC_VALIDITY: MetricValidity = {
    // Sprint/Scrum metrics
    velocity: 'valid',
    sprintHealth: 'valid',
    sprintProgress: 'valid',
    scopeCreep: 'valid',

    // Flow/Universal metrics
    wip: 'valid',
    wipConsistency: 'valid',
    cycleTime: 'valid',
    leadTime: 'valid',
    throughput: 'valid',
    flowEfficiency: 'valid'
};
