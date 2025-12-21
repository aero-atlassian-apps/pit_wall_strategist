/**
 * DomainSprint - Pure domain representation of a Sprint
 * 
 * This value object is Forge-agnostic and contains only domain-relevant
 * sprint data. Used for sprint health calculations and pace analysis.
 */
export interface DomainSprint {
    /** Sprint ID */
    id: number;

    /** Sprint name */
    name: string;

    /** Sprint state (active, future, closed) */
    state: SprintState;

    /** Sprint start date */
    startDate?: Date;

    /** Sprint end date (planned) */
    endDate?: Date;

    /** Sprint completion date (actual) */
    completeDate?: Date;

    /** Sprint goal description */
    goal?: string;
}

/**
 * Sprint state enum representing possible Jira sprint states
 */
export type SprintState = 'active' | 'future' | 'closed';

/**
 * Factory for creating DomainSprint instances
 */
export function createDomainSprint(params: {
    id: number;
    name: string;
    state: string;
    startDate?: string;
    endDate?: string;
    completeDate?: string;
    goal?: string;
}): DomainSprint {
    return {
        id: params.id,
        name: params.name,
        state: normalizeSprintState(params.state),
        startDate: params.startDate ? new Date(params.startDate) : undefined,
        endDate: params.endDate ? new Date(params.endDate) : undefined,
        completeDate: params.completeDate ? new Date(params.completeDate) : undefined,
        goal: params.goal
    };
}

function normalizeSprintState(state: string): SprintState {
    const normalized = state.toLowerCase();
    if (normalized === 'active') return 'active';
    if (normalized === 'future') return 'future';
    return 'closed';
}
