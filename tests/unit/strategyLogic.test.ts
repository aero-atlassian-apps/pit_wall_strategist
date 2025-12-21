import { describe, it, expect } from 'vitest';
import { analyzeActionRelevance } from '../../static/frontend/src/domain/strategy/ActionPolicies';
import { getSituationAnalysis } from '../../static/frontend/src/presentation/SituationAnalysis';
import { ALL_ACTIONS } from '../../static/frontend/src/domain/strategy/ActionDefinitions';
import { IssueContext, BoardContext } from '../../static/frontend/src/domain/strategy/StrategyTypes';

describe('Strategy Intelligence Logic', () => {

    // Helper to get specific action definition
    const getAction = (id: string) => ALL_ACTIONS.find(a => a.id === id)!;

    const mockBoard: BoardContext = {
        boardType: 'scrum',
        sprintActive: true,
        sprintDaysRemaining: 10,
        wipLimit: 10,
        wipCurrent: 5,
        columns: []
    };

    describe('ActionPolicies', () => {

        it('should mark THE UNDERCUT as CRITICAL for large stalled tickets', () => {
            const issue: IssueContext = {
                key: 'TEST-1',
                isStalled: true,
                storyPoints: 8,
                hasSubtasks: false,
                issueType: 'Story',
                status: 'In Progress',
                daysInStatus: 3,
                priority: 'Medium'
            };

            const result = analyzeActionRelevance(getAction('undercut'), issue, mockBoard);
            expect(result.relevance).toBe('critical');
            expect(result.reason).toContain('Large stalled ticket');
        });

        it('should mark THE UNDERCUT as RECOMMENDED for small stalled tickets', () => {
            const issue: IssueContext = {
                key: 'TEST-2',
                isStalled: true,
                storyPoints: 3,
                hasSubtasks: false,
                issueType: 'Story',
                status: 'In Progress',
                daysInStatus: 3,
                priority: 'Medium'
            };

            const result = analyzeActionRelevance(getAction('undercut'), issue, mockBoard);
            expect(result.relevance).toBe('recommended');
        });

        it('should mark TEAM ORDERS as CRITICAL for stalled High Priority items with assignee', () => {
            const issue: IssueContext = {
                key: 'TEST-3',
                isStalled: true,
                assignee: 'some-user',
                priority: 'High',
                status: 'In Progress',
                issueType: 'Task',
                daysInStatus: 4
            };

            const result = analyzeActionRelevance(getAction('team-orders'), issue, mockBoard);
            expect(result.relevance).toBe('critical');
            expect(result.reason).toContain('Driver overloaded');
        });

        it('should mark RETIRE CAR as CRITICAL when Sprint is ending', () => {
            const endingBoard = { ...mockBoard, sprintDaysRemaining: 2 };
            const issue: IssueContext = {
                key: 'TEST-4',
                priority: 'Low',
                statusCategory: 'indeterminate',
                issueType: 'Task',
                daysInStatus: 2
            };

            const result = analyzeActionRelevance(getAction('retire'), issue, endingBoard);
            expect(result.relevance).toBe('critical');
            expect(result.reason).toContain('Sprint ending');
        });
    });

    describe('SituationAnalysis', () => {
        it('should report HIGH DRAG for stalled items', () => {
            const issue: IssueContext = {
                key: 'TEST-5',
                isStalled: true,
                daysInStatus: 7,
                issueType: 'Task',
                storyPoints: 3
            };

            const message = getSituationAnalysis(issue, mockBoard);
            expect(message).toContain('HIGH DRAG');
            expect(message).toContain('No movement');
        });

        it('should report HIGH DRAG (Large Item) for large stalled items', () => {
            const issue: IssueContext = {
                key: 'TEST-6',
                isStalled: true,
                daysInStatus: 4,
                issueType: 'Story',
                storyPoints: 8
            };

            const message = getSituationAnalysis(issue, mockBoard);
            expect(message).toContain('HIGH DRAG');
            expect(message).toContain('Large item (8pts)');
        });

        it('should suggest strategies for Tire Deg (Long time in status)', () => {
            const issue: IssueContext = {
                key: 'TEST-7',
                statusCategory: 'indeterminate',
                daysInStatus: 10,
                issueType: 'Story'
            };

            const message = getSituationAnalysis(issue, mockBoard);
            expect(message).toContain('Tire degradation is high');
        });
    });
});
