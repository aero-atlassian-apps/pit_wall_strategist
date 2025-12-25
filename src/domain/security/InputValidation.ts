/**
 * InputValidation
 *
 * Domain service for validating and sanitizing user inputs to prevent injection attacks.
 * Specifically targets JQL injection and cross-site scripting risks in user-provided content.
 */
export class InputValidation {

    /**
     * Validates a Jira Project Key.
     * Project keys must start with an uppercase letter and contain only uppercase letters, numbers, and underscores.
     * Max length is typically 10, but we allow up to 20 to be safe.
     */
    static validateProjectKey(projectKey: string): boolean {
        if (!projectKey) return false;
        // Strict regex: Uppercase letters, numbers, underscore. Start with letter.
        const regex = /^[A-Z][A-Z0-9_]{1,19}$/;
        return regex.test(projectKey);
    }

    /**
     * Validates a Jira Issue Key.
     * Format: PROJECT-123
     */
    static validateIssueKey(issueKey: string): boolean {
        if (!issueKey) return false;
        // Regex: Project Key (valid chars) + Hyphen + Numbers
        const regex = /^[A-Z][A-Z0-9_]+-[0-9]+$/;
        return regex.test(issueKey);
    }

    /**
     * Sanitizes a string for use in JQL queries.
     * Escapes special characters that could alter the query structure.
     * Note: Prefer using parameterized queries or validated IDs over raw strings when possible.
     */
    static sanitizeJqlString(input: string): string {
        if (!input) return '';
        // Escape double quotes and backslashes
        return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    /**
     * Validates that an input is a safe sort order (ASC/DESC).
     */
    static validateSortOrder(order: string): boolean {
        return ['ASC', 'DESC'].includes(order?.toUpperCase());
    }
}
