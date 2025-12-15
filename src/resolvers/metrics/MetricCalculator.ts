import type { BoardData, TelemetryConfig, TelemetryData, Sprint } from '../../types/telemetry';
import type { JiraIssue } from '../../types/jira';
import { IssueCategorizer } from '../issue/IssueCategorizer';
import { fieldDiscoveryService } from '../data/FieldDiscoveryService';

export class MetricCalculator {
    constructor(private categorizer: IssueCategorizer, private config: TelemetryConfig) {}

    async calculate(boardData: BoardData): Promise<TelemetryData> {
        const issues = boardData.issues;
        const customFields = await fieldDiscoveryService.discoverCustomFields();
        const storyPointsField = customFields.storyPoints || this.config.storyPointsFieldName;

        const todoIssues = issues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.todo);
        const inProgressIssues = issues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.inProgress);
        const doneIssues = issues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);

        // WIP Load
        const wipCurrent = inProgressIssues.length;
        const wipLimit = this.config.wipLimit;
        const wipLoad = wipLimit > 0 ? Math.round((wipCurrent / wipLimit) * 100) : 0;
        const wipExplanation = wipLimit <= 0 ? "No WIP limit configured." : undefined;

        // Assignee Load & Burnout
        const assigneeLoad = this.calculateAssigneeLoad(inProgressIssues);
        const teamBurnout = this.calculateTeamBurnout(assigneeLoad);

        // Story Points / Completion
        const getPoints = (issue: JiraIssue) => {
            if (!storyPointsField) return 1; // Fallback to item count if no field
            const val = (issue.fields as any)[storyPointsField];
            return typeof val === 'number' ? val : 0;
        };

        const totalStoryPoints = issues.reduce((sum, i) => sum + getPoints(i), 0);
        const doneStoryPoints = doneIssues.reduce((sum, i) => sum + getPoints(i), 0);
        const completion = totalStoryPoints > 0 ? Math.round((doneStoryPoints / totalStoryPoints) * 100) : 0;

        // Velocity Calculation (Scrum)
        let velocity = 0;
        let velocityExplanation: string | undefined;
        let velocityDelta = 0;

        if (boardData.boardType === 'scrum') {
            const result = this.calculateVelocity(boardData.closedSprints || [], boardData.historicalIssues || [], storyPointsField);
            velocity = result.velocity;
            velocityExplanation = result.explanation;

            // Calculate Delta (Current vs Average)
            // If current sprint is active, we project? Or just compare completed so far?
            // "Velocity" usually means "Average Completed per Sprint".
            // "Velocity Delta" in the old code was "Completion vs Expected Time".
            // Let's keep Velocity Delta as "Pace" (Completion % - Time Elapsed %)
            velocityDelta = this.calculatePace(boardData, completion);
        } else {
            velocityExplanation = "Velocity is a Scrum metric.";
        }

        // Cycle Time (Flow)
        const cycleTimeResult = this.calculateCycleTime(boardData.historicalIssues || []);
        const cycleTime = cycleTimeResult.avg;
        const cycleTimeExplanation = cycleTimeResult.explanation;

        // Throughput (Flow)
        const throughputResult = this.calculateThroughput(boardData.historicalIssues || [], boardData.boardType);
        const throughput = throughputResult.rate;
        const throughputExplanation = throughputResult.explanation;

        const healthStatus = this.determineHealthStatus(boardData.boardType, velocityDelta, wipLoad);

        return {
            boardType: boardData.boardType,
            healthStatus,
            sprintStatus: healthStatus,
            velocity,
            velocityDelta,
            velocityExplanation,
            cycleTime,
            cycleTimeExplanation,
            throughput,
            throughputExplanation,
            wipLoad,
            wipLimit,
            wipCurrent,
            wipExplanation,
            teamBurnout,
            completion,
            issuesByStatus: { todo: todoIssues.length, inProgress: inProgressIssues.length, done: doneIssues.length }
        };
    }

    private calculateVelocity(closedSprints: Sprint[], historicalIssues: JiraIssue[], storyPointsField: string | null): { velocity: number, explanation?: string } {
        if (!closedSprints || closedSprints.length === 0) {
            return { velocity: 0, explanation: "No closed sprints found to calculate velocity." };
        }

        if (!storyPointsField) {
             return { velocity: 0, explanation: "Story Points field not detected. Configure field name in settings." };
        }

        const sprintPoints: number[] = [];

        // Map issues to sprints
        // NOTE: Jira Issue 'sprint' field usually contains the array of sprints the issue was in.
        // But the issue object we get from 'historicalIssues' (fetched by 'sprint in (...)')
        // will have the field.

        for (const sprint of closedSprints) {
            let total = 0;
            // Find issues that were completed in this sprint.
            // A simplified check: Issue was in this sprint AND is Done.
            // A more accurate check requires checking the Sprint Report logic (completed *during* the sprint).
            // For now, we sum the points of issues returned by "sprint = X" that are Done.
            // Limitation: We fetched 'historicalIssues' using 'sprint in (ids)'.

            // We need to check if the issue belongs to this sprint.
            // The 'sprint' field in issue.fields is complex (often customfield_10020).
            // It contains an array of sprint objects (strings like "com.atlassian.greenhopper.service.sprint.Sprint@...[id=123...]").
            // Or if using API v3 with expansion, it might be objects.

            // Heuristic: Filter historicalIssues that are 'Done' and were last updated/resolved
            // around the sprint end date?
            // Better: 'historicalIssues' query was `sprint in (...)`.
            // We can iterate issues and check their sprint custom field if available,
            // OR we can assume that since we can't easily map without the complex field parsing,
            // we might be better off just trusting the user to have mostly clean data or
            // using the `closedSprints` data if it contained completion data (it doesn't usually).

            // Let's try to find the issue's sprints.
            // If we can't link issues to specific sprints easily without complex parsing,
            // we might fail to compute per-sprint velocity accurately.

            // ALTERNATIVE: Use the Sprint Report API? No, Forge doesn't expose it easily.

            // Let's approximate:
            // Velocity = Total Points of All Fetched Historical Issues (which are from last 5 sprints) / Number of Sprints.
            // This assumes 'historicalIssues' contains *all* issues from those sprints.
            // And that they are mostly 'Done' if they are in closed sprints?
            // No, closed sprints can have unfinished work that moved to next sprint.

            // We need to filter for issues that are currently DONE.
            // This implies Velocity = "Points that are NOW Done from the last 5 sprints".
            // This is slightly wrong (points might have been completed *after* the sprint),
            // but it's a decent proxy if teams close tickets.

            const issuesInSprint = historicalIssues.filter(i => {
                // This is hard. We'll simplify:
                // If we treat the set of historicalIssues as "The body of work from recent sprints",
                // we can just average the total done points by the number of sprints.
                // But we need to avoid double counting if an issue was in multiple sprints.
                // Actually, `historicalIssues` is a flat list of unique issues.
                return true;
            });
        }

        // Revised Simple Logic:
        // Velocity = (Sum of Story Points of DONE issues in historical set) / (Number of Closed Sprints Fetched)
        // This assumes the historical set corresponds roughly to the work of those sprints.
        // Since we queried `sprint in (id1, id2...)`, we have the unique issues.
        // If an issue spanned 3 sprints and is now Done, it contributes its points once.
        // Dividing by 5 (sprints) gives "Points completed per sprint interval".
        // This effectively smooths out the velocity.

        const doneIssues = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);
        if (doneIssues.length === 0) {
             return { velocity: 0, explanation: "No completed issues found in recent sprints." };
        }

        const totalPoints = doneIssues.reduce((sum, i) => {
             const val = (i.fields as any)[storyPointsField];
             return sum + (typeof val === 'number' ? val : 0);
        }, 0);

        // Fix: Do not round up to nearest integer immediately if low, but standard is int.
        // The issue in test was strict equality (7 vs 0). Wait, 13 / 2 = 6.5 -> 7.
        // Why did I get 0?
        // Ah, because in my test setup, I might have forgotten to mock getStatusCategory correctly or
        // the `this.categorizer` is not using the spy correctly inside the class if instantiated differently?
        // No, I passed the categorizer instance.

        // Debugging via thought:
        // In the test:
        // closedSprints: [1, 2] (length 2)
        // historicalIssues: 3 issues.
        // TEST-1: Done, 5 pts.
        // TEST-2: Done, 8 pts.
        // TEST-3: New, 3 pts.
        // Done Issues: TEST-1, TEST-2. Total = 13.
        // avg = 13 / 2 = 6.5 -> 7.
        // Received 0.
        // This implies doneIssues.length is 0.
        // Why? categorizer.getStatusCategory(i) must be failing to return 'done'.
        // The test mocks `categorizer.getStatusCategory` but does `new IssueCategorizer()` inside?
        // No, I pass `categorizer` to constructor.
        // The mock implementation: `issue.fields.status.statusCategory.key`.
        // My test data: `status: { statusCategory: { key: 'done' } }`. This looks correct.
        // Wait, `this.config.statusCategories.done` is 'done'.

        // Maybe the issue is `storyPointsField`.
        // In test config: `storyPointsFieldName: 'customfield_10010'`.
        // In class: `const storyPointsField = customFields.storyPoints || this.config.storyPointsFieldName;`
        // `fieldDiscoveryService.discoverCustomFields()` is called.
        // I did NOT mock `fieldDiscoveryService`. It might be returning empty object,
        // so `customFields.storyPoints` is undefined.
        // So `storyPointsField` becomes 'customfield_10010'.
        // The issue fields have `customfield_10010`.
        // So that part should be fine.

        // Wait, `fieldDiscoveryService` is imported globally. I need to mock it.
        // If `fieldDiscoveryService.discoverCustomFields()` fails or returns something that breaks logic?
        // It returns a promise. If I don't mock it, it might try to call Forge API and fail/timeout/return empty.

        const avgVelocity = Math.round(totalPoints / closedSprints.length);

        return {
            velocity: avgVelocity,
            explanation: `Based on ${doneIssues.length} completed issues over last ${closedSprints.length} sprints.`
        };
    }

    private calculateCycleTime(historicalIssues: JiraIssue[]): { avg: number, explanation?: string } {
        // We need changelog to do this.
        // If no changelog, we can't compute it.
        const issuesWithHistory = historicalIssues.filter(i => i.changelog && i.changelog.histories);

        if (issuesWithHistory.length === 0) {
            return { avg: 0, explanation: "No history data available to calculate cycle time." };
        }

        const completedIssues = issuesWithHistory.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);

        if (completedIssues.length === 0) {
            return { avg: 0, explanation: "No completed issues in the analysis period." };
        }

        let totalDuration = 0;
        let count = 0;

        for (const issue of completedIssues) {
            const histories = issue.changelog!.histories!;
            // Sort histories by date
            histories.sort((a, b) => new Date(a.created!).getTime() - new Date(b.created!).getTime());

            // Find when it entered "In Progress"
            let startTime: number | null = null;
            let endTime: number | null = null;

            // Simplified: First transition to "In Progress" (or similar) -> Start
            // Last transition to "Done" -> End

            // We need to look at items
            for (const history of histories) {
                for (const item of history.items || []) {
                    if (item.field === 'status') {
                        // Check if status category changed
                        // This requires status map, but we only have string status names here.
                        // We can infer from the issue's current status category what the target status implies?
                        // Or use the strings in 'fromString' / 'toString'.
                        // Ideally we'd map these status names to categories.
                        // For now, let's look for the *first* transition out of "To Do" (or into In Progress)
                        // and the *last* transition into "Done".

                        // Heuristic: If toString is 'In Progress' (or configured), start.
                        // If toString is 'Done' (or configured), end.

                        // Better: Use `resolutiondate` as end time if available.

                    }
                }
            }

            // Fallback to simpler timestamps if changelog analysis is too heavy/complex without full status map
            // Start: created (Lead Time) or first transition?
            // Let's calculate LEAD TIME for now as it's deterministic (Resolution - Created).
            // Cycle Time requires accurate "Start" timestamp.

            // Let's try to find "In Progress" start.
            // Assume 'In Progress' status name matches config or default.

            const created = new Date(issue.fields.created!).getTime();
            const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : new Date(issue.fields.updated!).getTime(); // Fallback to updated if Done

            // This is LEAD TIME (Created -> Done)
            // Cycle Time is usually (In Progress -> Done).
            // If we can't reliably find In Progress start, Lead Time is a safe fallback IF we label it.
            // But the UI says "Cycle Time".

            // Let's scan history for the first status change that isn't 'To Do' -> 'To Do'.
            // Or just use (Resolution - Created) and explain it's Lead Time if we must.
            // But the requirement is "Make telemetry real".

            // Let's try to find the first transition to a status that IS NOT 'To Do'.
            // We don't have the status ID to category map here easily for every status in history.
            // But we know the issue is currently DONE.

            // Let's use the first transition in the history as "Start Work" proxy if it exists.
            // Often the first transition is "To Do" -> "In Progress".
            const firstTransition = histories[0];
            if (firstTransition) {
                startTime = new Date(firstTransition.created!).getTime();
            } else {
                startTime = created; // Fallback
            }

            if (resolved > startTime) {
                const hours = (resolved - startTime) / (1000 * 60 * 60);
                totalDuration += hours;
                count++;
            }
        }

        if (count === 0) return { avg: 0, explanation: "Could not calculate durations." };

        return {
            avg: Math.round(totalDuration / count),
            explanation: `Average based on ${count} issues (First Transition to Done).`
        };
    }

    private calculateThroughput(historicalIssues: JiraIssue[], boardType: string): { rate: number, explanation?: string } {
        // Items completed per week.
        const doneIssues = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);

        if (doneIssues.length === 0) {
            return { rate: 0, explanation: "No completed issues found." };
        }

        // Find range
        const dates = doneIssues.map(i => i.fields.resolutiondate ? new Date(i.fields.resolutiondate).getTime() : new Date(i.fields.updated!).getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

        if (diffDays < 7) {
            // Less than a week of data. Return total count? Or project?
            // "Throughput" usually implies a rate per period (Sprint or Week).
            // If < 1 week, maybe just return the count and say "in last X days".
            return { rate: doneIssues.length, explanation: `Total items completed in last ${Math.round(diffDays)} days.` };
        }

        const weeks = diffDays / 7;
        const rate = Math.round((doneIssues.length / weeks) * 10) / 10; // 1 decimal

        return { rate, explanation: `Average items per week (over ${Math.round(diffDays)} days).` };
    }

    private calculateAssigneeLoad(issues: JiraIssue[]): Record<string, number> {
        const load: Record<string, number> = {};
        issues.forEach(issue => {
            const assignee = issue.fields.assignee?.displayName || 'Unassigned';
            load[assignee] = (load[assignee] || 0) + 1;
        });
        return load;
    }

    private calculateTeamBurnout(assigneeLoad: Record<string, number>): Record<string, number> {
        const burnout: Record<string, number> = {};
        Object.entries(assigneeLoad).forEach(([name, count]) => {
            const firstName = name.toLowerCase().split(' ')[0];
            burnout[firstName] = Math.round((count / this.config.assigneeCapacity) * 100);
        });
        return burnout;
    }

    private calculatePace(boardData: BoardData, completion: number): number {
        // Replaces calculateVelocityDelta for Scrum Pace
        if (boardData.boardType === 'scrum' && boardData.sprint?.startDate && boardData.sprint?.endDate) {
            const now = new Date();
            const start = new Date(boardData.sprint.startDate);
            const end = new Date(boardData.sprint.endDate);
            const totalDuration = end.getTime() - start.getTime();

            // Avoid division by zero
            if (totalDuration <= 0) return 0;

            const elapsed = now.getTime() - start.getTime();
            const expectedProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
            return completion - expectedProgress;
        }
        return 0;
    }

    private determineHealthStatus(boardType: string, velocityDelta: number, wipLoad: number): 'OPTIMAL' | 'WARNING' | 'CRITICAL' {
        if (boardType === 'scrum') {
            // In Scrum, we care about velocity AND WIP
            // If velocity is significantly behind (-20%), it's critical
            if (velocityDelta < -20 || wipLoad > 120) return 'CRITICAL';
            else if (velocityDelta < -10 || wipLoad > 90) return 'WARNING';
        } else {
            // In Kanban/Business, we purely care about WIP and Flow
            // Strict WIP limits: > 100% is Critical
            if (wipLoad > 100) return 'CRITICAL';
            else if (wipLoad > 85) return 'WARNING';
        }
        return 'OPTIMAL';
    }
}
