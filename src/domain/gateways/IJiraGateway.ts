import { DomainIssue } from '../issue/DomainIssue';
import { DomainSprint } from '../sprint/DomainSprint';

/**
 * IJiraGateway - Port interface for Jira data access
 * 
 * This interface defines the contract for accessing Jira data.
 * The Domain layer depends on this interface, not on concrete implementations.
 * Infrastructure adapters implement this interface with Forge-specific code.
 * 
 * This follows the Dependency Inversion Principle (DIP):
 * - High-level modules (Domain) should not depend on low-level modules (Forge API)
 * - Both should depend on abstractions (this interface)
 */
export interface IJiraGateway {
    /**
     * Search for issues using JQL
     * @param jql - JQL query string
     * @param fields - Fields to include in the response
     * @param limit - Maximum number of issues to return
     */
    searchIssues(jql: string, fields: string[], limit?: number): Promise<IssueSearchResult>;

    /**
     * Get issues in a specific sprint
     */
    getSprintIssues(sprintId: number): Promise<DomainIssue[]>;

    /**
     * Get the active sprint for a board
     */
    getActiveSprint(boardId: number): Promise<DomainSprint | null>;

    /**
     * Get closed sprints for velocity calculation
     */
    getClosedSprints(boardId: number, limit?: number): Promise<DomainSprint[]>;

    /**
     * Get project status mappings
     */
    getProjectStatuses(projectKey: string): Promise<StatusEntry[]>;

    /**
     * Get boards associated with a project
     */
    getProjectBoards(projectKey: string): Promise<BoardInfo[]>;

    /**
     * Get board configuration
     */
    getBoardConfiguration(boardId: number): Promise<BoardConfig | null>;
}

/**
 * Result of an issue search operation
 */
export interface IssueSearchResult {
    issues: DomainIssue[];
    total: number;
    hasMore: boolean;
}

/**
 * Status entry in project status mapping
 */
export interface StatusEntry {
    id: string;
    name: string;
    categoryKey: string;
    categoryName: string;
}

/**
 * Board information
 */
export interface BoardInfo {
    id: number;
    name: string;
    type: 'scrum' | 'kanban' | 'simple';
}

/**
 * Board configuration details
 */
export interface BoardConfig {
    id: number;
    name: string;
    filterId?: number;
    columns: BoardColumn[];
}

/**
 * Board column (for Kanban boards)
 */
export interface BoardColumn {
    name: string;
    statuses: { id: string; name: string }[];
}
