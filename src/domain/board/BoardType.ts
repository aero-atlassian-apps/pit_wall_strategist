export type BoardType = 'scrum' | 'kanban' | 'business';

export const BoardTypes = {
    SCRUM: 'scrum' as BoardType,
    KANBAN: 'kanban' as BoardType,
    BUSINESS: 'business' as BoardType
};

export function isKnownBoardType(type: string): type is BoardType {
    return Object.values(BoardTypes).includes(type as BoardType);
}
