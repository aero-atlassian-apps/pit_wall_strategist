/**
 * STRICT SOURCE OF TRUTH CONTEXT MODEL (Mirrored from Backend)
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
    projectKey?: string;

    /** The raw Project Name */
    projectName?: string;

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
     */
    workflow?: WorkflowTopology;

    /** Localization Context */
    locale: string;
}

export const DEFAULT_CONTEXT: InternalContext = {
    projectType: 'software',
    boardStrategy: 'none',  // Safe default: don't assume Scrum until context is loaded
    agileCapability: 'none',
    estimationMode: 'issueCount',  // Safe default: count issues, not points
    metricValidity: {
        // Sprint/Scrum metrics - hidden by default until context confirms Scrum
        velocity: 'hidden',
        sprintHealth: 'hidden',
        sprintProgress: 'hidden',
        scopeCreep: 'hidden',
        // Flow/Universal metrics - always valid
        wip: 'valid',
        wipConsistency: 'valid',
        cycleTime: 'valid',
        leadTime: 'valid',
        throughput: 'valid',
        flowEfficiency: 'valid'
    },
    workflow: {
        statusMap: {},
        startStatuses: [],
        doneStatuses: []
    },
    locale: 'en'
};
