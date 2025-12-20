import api from '@forge/api';

/**
 * JiraExecutionContextResolver
 * 
 * Single authority for determining Jira API execution context.
 * 
 * Strategy (User-Approved):
 * - READ operations (visualization): asApp() - Anyone with project access can view
 * - WRITE operations (mutations): asUser() - Respects user's Jira permissions
 */

export type OperationType =
    // READ operations → asApp()
    | 'ISSUE_SEARCH'
    | 'BOARD_DISCOVERY'
    | 'SPRINT_DATA'
    | 'PROJECT_INFO'
    | 'FIELD_DISCOVERY'
    // WRITE operations → asUser()
    | 'ISSUE_CREATE'
    | 'ISSUE_UPDATE'
    | 'ISSUE_TRANSITION'
    | 'COMMENT_ADD'
    | 'ISSUE_LINK';

const READ_OPERATIONS: OperationType[] = [
    'ISSUE_SEARCH',
    'BOARD_DISCOVERY',
    'SPRINT_DATA',
    'PROJECT_INFO',
    'FIELD_DISCOVERY'
];

const WRITE_OPERATIONS: OperationType[] = [
    'ISSUE_CREATE',
    'ISSUE_UPDATE',
    'ISSUE_TRANSITION',
    'COMMENT_ADD',
    'ISSUE_LINK'
];

export class JiraExecutionContextResolver {
    /**
     * Returns the appropriate execution context for the given operation.
     * - READ ops: api.asApp() - uses app scopes, not limited by user permissions
     * - WRITE ops: api.asUser() - uses user permissions, respects Jira security
     */
    getContext(operation: OperationType) {
        if (READ_OPERATIONS.includes(operation)) {
            return api.asApp();
        }

        if (WRITE_OPERATIONS.includes(operation)) {
            return api.asUser();
        }

        // Unknown operation - fail fast with clear error
        throw new Error(`[JiraExecutionContextResolver] Unknown operation type: ${operation}. ` +
            `Valid READ ops: ${READ_OPERATIONS.join(', ')}. ` +
            `Valid WRITE ops: ${WRITE_OPERATIONS.join(', ')}.`);
    }

    /**
     * Check if an operation is a read operation.
     */
    isReadOperation(operation: OperationType): boolean {
        return READ_OPERATIONS.includes(operation);
    }

    /**
     * Check if an operation is a write operation.
     */
    isWriteOperation(operation: OperationType): boolean {
        return WRITE_OPERATIONS.includes(operation);
    }
}

// Singleton instance for convenience
export const contextResolver = new JiraExecutionContextResolver();
