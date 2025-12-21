import {
    RovoActionResult,
    RovoActionType,
    ActionMetadata,
    ActionErrorCode
} from '../../domain/rovo/RovoActionTypes';

/**
 * Rovo Action Result Builder
 * 
 * Factory for creating consistent, well-structured action results.
 * Follows the Result pattern for explicit error handling.
 */
export class RovoActionResultBuilder<T = unknown> {
    private actionType: RovoActionType | string;
    private issueKey?: string;
    private startTime: number;

    constructor(actionType: RovoActionType | string, issueKey?: string) {
        this.actionType = actionType;
        this.issueKey = issueKey;
        this.startTime = Date.now();
    }

    /**
     * Build a success result
     */
    success(message: string, data?: T): RovoActionResult<T> {
        return {
            success: true,
            message,
            data,
            metadata: this.buildMetadata()
        };
    }

    /**
     * Build a failure result
     */
    failure(
        message: string,
        code: ActionErrorCode = ActionErrorCode.UNKNOWN_ERROR,
        details?: unknown
    ): RovoActionResult<T> {
        return {
            success: false,
            message,
            error: {
                code,
                message,
                details
            },
            metadata: this.buildMetadata()
        };
    }

    /**
     * Build from an exception
     */
    fromError(error: Error, context?: string): RovoActionResult<T> {
        const message = context ? `${context}: ${error.message}` : error.message;

        // Determine error code based on error message patterns
        let code = ActionErrorCode.UNKNOWN_ERROR;
        const lowerMessage = error.message.toLowerCase();

        if (lowerMessage.includes('permission') || lowerMessage.includes('403')) {
            code = ActionErrorCode.PERMISSION_DENIED;
        } else if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
            code = ActionErrorCode.NOT_FOUND;
        } else if (lowerMessage.includes('validation')) {
            code = ActionErrorCode.VALIDATION_ERROR;
        } else if (lowerMessage.includes('jira') || lowerMessage.includes('api')) {
            code = ActionErrorCode.JIRA_API_ERROR;
        }

        return this.failure(message, code, { originalError: error.stack });
    }

    private buildMetadata(): ActionMetadata {
        return {
            actionType: this.actionType,
            executedAt: new Date().toISOString(),
            issueKey: this.issueKey,
            executionTimeMs: Date.now() - this.startTime
        };
    }
}

/**
 * Factory function for quick result builder creation
 */
export function createResultBuilder<T = unknown>(
    actionType: RovoActionType | string,
    issueKey?: string
): RovoActionResultBuilder<T> {
    return new RovoActionResultBuilder<T>(actionType, issueKey);
}
