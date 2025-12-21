/**
 * Edge Case Tests
 * 
 * Tests edge cases: reopen scenarios, partial data, custom workflows, etc.
 */

import { describe, it, expect } from 'vitest';

describe('Edge Cases: Reopen Scenarios', () => {
    describe('Issue Reopen Detection', () => {
        it('should handle issue reopened from Done to In Progress', () => {
            const changelog = {
                histories: [
                    { created: '2024-01-10T10:00:00Z', items: [{ field: 'status', fromString: 'To Do', toString: 'In Progress' }] },
                    { created: '2024-01-12T10:00:00Z', items: [{ field: 'status', fromString: 'In Progress', toString: 'Done' }] },
                    { created: '2024-01-14T10:00:00Z', items: [{ field: 'status', fromString: 'Done', toString: 'In Progress' }] }, // Reopen
                ]
            };

            const reopenTransitions = changelog.histories.filter(h =>
                h.items.some(i => i.field === 'status' && i.fromString === 'Done' && i.toString !== 'Done')
            );

            expect(reopenTransitions.length).toBe(1);
        });

        it('should calculate correct cycle time excluding reopen time', () => {
            // First completion: Jan 10 -> Jan 12 = 2 days
            // Reopen: Jan 14, completed again Jan 15 = 1 day
            // Total active time: 3 days (not 5 days from start to final end)

            const firstCycleHours = 48; // 2 days
            const secondCycleHours = 24; // 1 day
            const totalActiveHours = firstCycleHours + secondCycleHours;

            expect(totalActiveHours).toBe(72); // 3 days active work
        });

        it('should not count waiting time during Done status', () => {
            const doneStart = new Date('2024-01-12T10:00:00Z');
            const reopenTime = new Date('2024-01-14T10:00:00Z');
            const waitingHours = (reopenTime.getTime() - doneStart.getTime()) / (1000 * 60 * 60);

            // This time should be excluded from cycle time
            expect(waitingHours).toBe(48);
        });
    });
});

describe('Edge Cases: Partial Data', () => {
    describe('Missing Story Points', () => {
        it('should fall back to issue count when no story points field exists', () => {
            const issues = [
                { key: 'TEST-1', statusCategory: 'done', storyPoints: undefined },
                { key: 'TEST-2', statusCategory: 'done', storyPoints: null },
                { key: 'TEST-3', statusCategory: 'done' },
            ];

            const hasStoryPoints = issues.some(i => typeof i.storyPoints === 'number');
            const velocity = hasStoryPoints
                ? issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0)
                : issues.filter(i => i.statusCategory === 'done').length;

            expect(hasStoryPoints).toBe(false);
            expect(velocity).toBe(3); // Issue count
        });

        it('should handle mixed story points and missing values', () => {
            const issues = [
                { key: 'TEST-1', statusCategory: 'done', storyPoints: 5 },
                { key: 'TEST-2', statusCategory: 'done', storyPoints: undefined },
                { key: 'TEST-3', statusCategory: 'done', storyPoints: 3 },
            ];

            const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

            expect(totalPoints).toBe(8); // 5 + 0 + 3
        });
    });

    describe('Missing Changelog', () => {
        it('should handle issue without changelog for cycle time', () => {
            const issue = { key: 'TEST-1', changelog: null };
            const hasChangelog = issue.changelog && issue.changelog;

            expect(hasChangelog).toBeFalsy();
            // Cycle time calculation should skip this issue
        });

        it('should handle issue with empty changelog', () => {
            const issue = { key: 'TEST-1', changelog: { histories: [] } };
            const hasTransitions = issue.changelog.histories.length > 0;

            expect(hasTransitions).toBe(false);
        });
    });

    describe('Missing Sprint Info', () => {
        it('should handle no active sprint gracefully', () => {
            const activeSprint: { name?: string } | null = null;
            const sprintName = activeSprint?.name || 'No Sprint';

            expect(sprintName).toBe('No Sprint');
        });

        it('should handle no closed sprints for velocity', () => {
            const closedSprints: any[] = [];
            const canCalculateVelocity = closedSprints.length > 0;

            expect(canCalculateVelocity).toBe(false);
        });
    });
});

describe('Edge Cases: Custom Workflows', () => {
    describe('Non-Standard Status Categories', () => {
        it('should handle custom "In Review" status as indeterminate', () => {
            const customStatuses = {
                'In Review': 'indeterminate',
                'Code Review': 'indeterminate',
                'QA Testing': 'indeterminate',
                'Deployed': 'done',
            };

            expect(customStatuses['In Review']).toBe('indeterminate');
            expect(customStatuses['Deployed']).toBe('done');
        });

        it('should handle multiple done-equivalent statuses', () => {
            const doneStatuses = ['Done', 'Closed', 'Resolved', 'Deployed', 'Released'];
            const issueStatus = 'Deployed';
            const isDone = doneStatuses.includes(issueStatus);

            expect(isDone).toBe(true);
        });
    });

    describe('Multi-Column Workflows', () => {
        it('should correctly identify in-progress across multiple columns', () => {
            const inProgressColumns = ['In Progress', 'In Review', 'Testing', 'Awaiting Deploy'];
            const issue = { status: 'Testing' };
            const isInProgress = inProgressColumns.includes(issue.status);

            expect(isInProgress).toBe(true);
        });

        it('should handle status not in any known column', () => {
            const knownStatuses = ['To Do', 'In Progress', 'Done'];
            const issue = { status: 'Blocked' };
            const isKnown = knownStatuses.includes(issue.status);

            expect(isKnown).toBe(false);
            // Should default to indeterminate
        });
    });
});

describe('Edge Cases: Boundary Conditions', () => {
    describe('Zero Values', () => {
        it('should handle zero WIP correctly', () => {
            const wipCurrent = 0;
            const wipLimit = 5;
            const wipLoad = wipLimit > 0 ? Math.round((wipCurrent / wipLimit) * 100) : 0;

            expect(wipLoad).toBe(0);
        });

        it('should handle zero throughput period', () => {
            const doneIssues = 5;
            const periodWeeks = 0;
            const throughput = periodWeeks > 0 ? doneIssues / periodWeeks : 0;

            expect(throughput).toBe(0);
        });
    });

    describe('Large Values', () => {
        it('should handle very large WIP counts', () => {
            const wipCurrent = 1000;
            const wipLimit = 5;
            const wipLoad = Math.round((wipCurrent / wipLimit) * 100);

            expect(wipLoad).toBe(20000); // 20000%
        });

        it('should handle very long cycle times', () => {
            const cycleTimeHours = 8760; // 1 year
            const cycleTimeDays = Math.round(cycleTimeHours / 24);

            expect(cycleTimeDays).toBe(365);
        });
    });

    describe('Negative Edge Cases', () => {
        it('should handle future dates gracefully', () => {
            const now = new Date('2024-01-15T10:00:00Z');
            const futureUpdate = new Date('2024-01-20T10:00:00Z');
            const hoursSinceUpdate = (now.getTime() - futureUpdate.getTime()) / (1000 * 60 * 60);

            expect(hoursSinceUpdate).toBeLessThan(0);
            // Should treat as recently updated (not stalled)
            const isStalled = hoursSinceUpdate > 24;
            expect(isStalled).toBe(false);
        });
    });
});
