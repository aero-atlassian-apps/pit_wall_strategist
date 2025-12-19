/**
 * Validation utilities for secure input handling.
 */
export class InputValidation {

    /**
     * Validates that a project key matches the standard Jira format.
     * Jira project keys must be uppercase alphanumeric and can contain underscores.
     * They must start with a letter.
     *
     * Regex: ^[A-Z][A-Z0-9_]*$
     *
     * @param key The project key to validate
     * @returns boolean true if valid
     */
    static isValidProjectKey(key: string): boolean {
        if (!key || typeof key !== 'string') {
            return false;
        }
        // Standard Jira Project Key format: Uppercase letters, numbers, underscore.
        // Must start with a letter. Max length is usually 10, but can be up to 255 theoretically.
        // We'll be slightly generous but strict on characters.
        const projectKeyRegex = /^[A-Z][A-Z0-9_]+$/;
        return projectKeyRegex.test(key);
    }

    /**
     * Throws an error if the project key is invalid.
     * @param key The project key to validate
     */
    static validateProjectKey(key: string): void {
        if (!this.isValidProjectKey(key)) {
            throw new Error(`Invalid Project Key format: "${key}". Project keys must be uppercase alphanumeric.`);
        }
    }
}
