/**
 * Rovo Action Domain Types
 * 
 * Best-in-class type definitions for Rovo actions following
 * Clean Code, SOLID, and DDD principles.
 */

/**
 * Enumeration of all available Rovo actions
 */
export enum RovoActionType {
    SPLIT_TICKET = 'split-ticket',
    REASSIGN_TICKET = 'reassign-ticket',
    DEFER_TICKET = 'defer-ticket',
    CHANGE_PRIORITY = 'change-priority',
    TRANSITION_ISSUE = 'transition-issue',
    ADD_BLOCKER_FLAG = 'add-blocker-flag',
    LINK_ISSUES = 'link-issues',
    UPDATE_ESTIMATE = 'update-estimate',
    ADD_RADIO_MESSAGE = 'add-radio-message',
    CREATE_SUBTASK = 'create-subtask'
}

/**
 * Base action result - all actions return this structure
 */
export interface RovoActionResult<T = unknown> {
    /** Whether the action succeeded */
    success: boolean;
    /** Human-readable message describing what happened */
    message: string;
    /** Action-specific data */
    data?: T;
    /** Error details if action failed */
    error?: RovoActionError;
    /** Execution metadata */
    metadata: ActionMetadata;
}

/**
 * Action error details
 */
export interface RovoActionError {
    code: ActionErrorCode;
    message: string;
    details?: unknown;
}

/**
 * Error codes for action failures
 */
export enum ActionErrorCode {
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    NOT_FOUND = 'NOT_FOUND',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    JIRA_API_ERROR = 'JIRA_API_ERROR',
    CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Execution metadata
 */
export interface ActionMetadata {
    actionType: RovoActionType | string;
    executedAt: string;
    issueKey?: string;
    executionTimeMs?: number;
}

// ============ Action-Specific Payloads ============

export interface SplitTicketPayload {
    issueKey: string;
    subtasks?: Array<{ summary: string }>;
}

export interface SplitTicketResult {
    subtasks: string[];
    createdCount: number;
}

export interface ReassignTicketPayload {
    issueKey: string;
    newAssignee: string;
}

export interface ReassignTicketResult {
    previousAssignee?: string;
    newAssignee: string;
    newAssigneeDisplayName: string;
}

export interface DeferTicketPayload {
    issueKey: string;
}

export interface DeferTicketResult {
    transitionedTo?: string;
    sprintCleared: boolean;
}

export interface ChangePriorityPayload {
    issueKey: string;
    priority: string;
}

export interface ChangePriorityResult {
    previousPriority?: string;
    newPriority: string;
}

export interface TransitionIssuePayload {
    issueKey: string;
    transitionId?: string;
    transitionName?: string;
}

export interface TransitionIssueResult {
    previousStatus?: string;
    newStatus: string;
    transitionId: string;
}

export interface AddBlockerFlagPayload {
    issueKey: string;
    reason?: string;
}

export interface AddBlockerFlagResult {
    labelAdded: boolean;
    flaggedFieldSet: boolean;
}

export interface LinkIssuesPayload {
    issueKey: string;
    linkedIssueKey: string;
    linkType?: string;
}

export interface LinkIssuesResult {
    linkType: string;
    linkedIssueKey: string;
}

export interface UpdateEstimatePayload {
    issueKey: string;
    storyPoints?: number;
    timeEstimate?: string;
}

export interface UpdateEstimateResult {
    storyPointsUpdated: boolean;
    timeEstimateUpdated: boolean;
}

export interface AddRadioMessagePayload {
    issueKey: string;
    message: string;
}

export interface AddRadioMessageResult {
    commentId?: string;
}

export interface CreateSubtaskPayload {
    issueKey: string;
    summary: string;
    assignee?: string;
}

export interface CreateSubtaskResult {
    subtaskKey: string;
    summary: string;
}

// ============ Action Registry Types ============

/**
 * Union of all action payloads
 */
export type RovoActionPayload =
    | SplitTicketPayload
    | ReassignTicketPayload
    | DeferTicketPayload
    | ChangePriorityPayload
    | TransitionIssuePayload
    | AddBlockerFlagPayload
    | LinkIssuesPayload
    | UpdateEstimatePayload
    | AddRadioMessagePayload
    | CreateSubtaskPayload;

/**
 * Action handler function signature
 */
export type ActionHandler<P, R> = (payload: P) => Promise<RovoActionResult<R>>;

/**
 * F1-themed action descriptions for UI
 */
export const ACTION_DESCRIPTIONS: Record<RovoActionType, { name: string; description: string; icon: string }> = {
    [RovoActionType.SPLIT_TICKET]: {
        name: 'The Undercut',
        description: 'Split ticket into smaller subtasks for faster sector times',
        icon: 'scissors'
    },
    [RovoActionType.REASSIGN_TICKET]: {
        name: 'Team Orders',
        description: 'Reassign to driver with more track experience',
        icon: 'users'
    },
    [RovoActionType.DEFER_TICKET]: {
        name: 'Retire Car',
        description: 'Move to backlog - save engine for next race',
        icon: 'flag'
    },
    [RovoActionType.CHANGE_PRIORITY]: {
        name: 'Blue Flag',
        description: 'Escalate priority to clear the track',
        icon: 'alert-triangle'
    },
    [RovoActionType.TRANSITION_ISSUE]: {
        name: 'Push to the Limit',
        description: 'Transition issue to next status',
        icon: 'arrow-right'
    },
    [RovoActionType.ADD_BLOCKER_FLAG]: {
        name: 'Red Flag',
        description: 'Flag issue as blocked',
        icon: 'alert-octagon'
    },
    [RovoActionType.LINK_ISSUES]: {
        name: 'Slipstream',
        description: 'Link related issues for drafting efficiency',
        icon: 'link'
    },
    [RovoActionType.UPDATE_ESTIMATE]: {
        name: 'Fuel Adjustment',
        description: 'Update effort estimates',
        icon: 'gauge'
    },
    [RovoActionType.ADD_RADIO_MESSAGE]: {
        name: 'Radio Message',
        description: 'Add strategic comment to issue',
        icon: 'message-circle'
    },
    [RovoActionType.CREATE_SUBTASK]: {
        name: 'Pit Crew Task',
        description: 'Create targeted subtask',
        icon: 'plus-circle'
    }
};
