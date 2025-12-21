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

    /** Localization Context */
    locale: string;
}

export const DEFAULT_CONTEXT: InternalContext = {
    projectType: 'software',
    boardStrategy: 'scrum',
    agileCapability: 'full',
    estimationMode: 'storyPoints',
    metricValidity: {
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
    },
    locale: 'en'
};
