/**
 * DomainBoard - Pure domain representation of a Jira board
 * 
 * This aggregate represents the board context for telemetry calculations.
 * It is Forge-agnostic and depends only on domain types.
 */
import { DomainIssue } from '../issue/DomainIssue';
import { DomainSprint } from '../sprint/DomainSprint';

/**
 * Board type enum - represents different Jira project/board types
 */
export type BoardType = 'scrum' | 'kanban' | 'business';

/**
 * Domain board aggregate containing all context needed for metrics
 */
export interface DomainBoard {
    /** Board ID (null for Business projects) */
    boardId: number | null;

    /** Board display name */
    boardName: string;

    /** Board type determines metric calculation strategy */
    boardType: BoardType;

    /** Current sprint (for Scrum boards) */
    activeSprint?: DomainSprint;

    /** Issues in current view (sprint or board) */
    issues: DomainIssue[];

    /** Historical issues for trend analysis */
    historicalIssues: DomainIssue[];

    /** Recently closed sprints for velocity calculation */
    closedSprints: DomainSprint[];

    /** Whether access to this board is restricted */
    isRestricted: boolean;
}

/**
 * Factory function for creating a DomainBoard
 */
export function createDomainBoard(params: {
    boardId: number | null;
    boardName: string;
    boardType: string;
    activeSprint?: DomainSprint;
    issues: DomainIssue[];
    historicalIssues?: DomainIssue[];
    closedSprints?: DomainSprint[];
    isRestricted?: boolean;
}): DomainBoard {
    return {
        boardId: params.boardId,
        boardName: params.boardName,
        boardType: normalizeBoardType(params.boardType),
        activeSprint: params.activeSprint,
        issues: params.issues,
        historicalIssues: params.historicalIssues || [],
        closedSprints: params.closedSprints || [],
        isRestricted: params.isRestricted || false
    };
}

function normalizeBoardType(type: string): BoardType {
    const normalized = type.toLowerCase();
    if (normalized === 'kanban') return 'kanban';
    if (normalized === 'business') return 'business';
    return 'scrum';
}
