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

        // WIP Consistency
        const wipConsistencyResult = this.calculateWipConsistency(boardData.historicalIssues || [], wipCurrent);
        const wipConsistency = wipConsistencyResult.consistency;
        const wipConsistencyExplanation = wipConsistencyResult.explanation;

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

        // Force Velocity Calculation even if not Scrum if data exists, but UI might hide it.
        // User mandate: "If Jira UI shows it... assume data is accessible".
        // However, Velocity is typically Scrum. If Kanban, we might want to show throughput as primary.
        // But user says: "Velocity... MUST SHOW REAL NUMBERS".
        // We will calculate Velocity for Scrum boards using sprints, and fallback for others or if sprints missing.

        const velocityResult = this.calculateVelocity(boardData.closedSprints || [], boardData.historicalIssues || [], storyPointsField, boardData.boardType);
        velocity = velocityResult.velocity;
        velocityExplanation = velocityResult.explanation;

        if (boardData.boardType === 'scrum') {
            // Calculate Delta (Current vs Average)
            velocityDelta = this.calculatePace(boardData, completion);
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
            wipConsistency,
            wipConsistencyExplanation,
            teamBurnout,
            completion,
            issuesByStatus: { todo: todoIssues.length, inProgress: inProgressIssues.length, done: doneIssues.length }
        };
    }

    private calculateVelocity(closedSprints: Sprint[], historicalIssues: JiraIssue[], storyPointsField: string | null, boardType: string): { velocity: number, explanation?: string } {
        // Primary: Sprint-based Velocity
        if (closedSprints && closedSprints.length > 0) {
            // Use the points field if available, otherwise count issues (fallback handled in reduce)
            const sprintPoints: number[] = [];
            // To be accurate without complex sprint field parsing, we can't easily map historical issues to sprints 1:1 reliably
            // without the 'sprint' field in 'historicalIssues' which we might not have fully parsed.
            // BUT, we can use the "Pseudo Velocity" logic even here if we can't map.
            // However, let's try to do it right:

            // If we have closed sprints, we *could* fetch their reports, but we are limited to 'historicalIssues' context here.
            // Let's use the "Average Completed Points in Time Window" method if we can't map sprints.
            // Actually, "Velocity" = Average per Sprint.
            // If we have 5 closed sprints, we assume they cover approx 10 weeks (if 2 weeks each).

            // Let's count TOTAL done points in 'historicalIssues' (which should be from the sprint timeframe)
            // and divide by number of sprints.
            const doneIssues = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);
            if (doneIssues.length > 0) {
                const totalPoints = doneIssues.reduce((sum, i) => {
                     const val = storyPointsField ? (i.fields as any)[storyPointsField] : 1;
                     return sum + (typeof val === 'number' ? val : 1);
                }, 0);

                const avgVelocity = Math.round(totalPoints / closedSprints.length);
                return {
                    velocity: avgVelocity,
                    explanation: `Avg points per sprint (based on last ${closedSprints.length} sprints).`
                };
            }
        }

        // Fallback: Pseudo-Velocity (Time-based)
        // If no closed sprints (Kanban/Business) or data missing.
        // Calculate "Points/Items per 2 Weeks" based on historical data.
        const doneIssues = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);

        if (doneIssues.length === 0) {
             return { velocity: 0, explanation: "No completed issues found in recent history." };
        }

        // Determine time window of these issues
        const dates = doneIssues.map(i => i.fields.resolutiondate ? new Date(i.fields.resolutiondate).getTime() : new Date(i.fields.updated!).getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        let diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

        // If diffDays is small (e.g., 1 day), projecting to 14 days might be huge. Cap minimum window to 7 days for calculation.
        if (diffDays < 7) diffDays = 7;

        const totalPoints = doneIssues.reduce((sum, i) => {
             const val = storyPointsField ? (i.fields as any)[storyPointsField] : 1;
             return sum + (typeof val === 'number' ? val : 1);
        }, 0);

        // Normalize to 14 days
        const velocity = Math.round((totalPoints / diffDays) * 14);

        const unit = storyPointsField ? "points" : "issues";
        return {
            velocity: velocity,
            explanation: `Estimated ${unit} per 2 weeks (Pseudo-Velocity).`
        };
    }

    private calculateCycleTime(historicalIssues: JiraIssue[]): { avg: number, explanation?: string } {
        // Try to use changelog first
        const issuesWithHistory = historicalIssues.filter(i => i.changelog && i.changelog.histories && i.changelog.histories.length > 0);
        const completedIssues = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);

        if (completedIssues.length === 0) {
            return { avg: 0, explanation: "No completed issues to analyze." };
        }

        let totalDuration = 0;
        let count = 0;
        let usedChangelog = false;

        // Method 1: Changelog (Accurate Cycle Time)
        // We look for In Progress -> Done.
        if (issuesWithHistory.length > 0) {
            let changelogCount = 0;
            let changelogDuration = 0;

            for (const issue of issuesWithHistory) {
                // Skip if not Done
                 if (this.categorizer.getStatusCategory(issue) !== this.config.statusCategories.done) continue;

                const histories = issue.changelog!.histories!;
                histories.sort((a, b) => new Date(a.created!).getTime() - new Date(b.created!).getTime());

                // Find "Done" timestamp
                const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : new Date(issue.fields.updated!).getTime();

                // Find first transition that suggests start of work (not To Do)
                // Heuristic: First transition in history often implies moving out of backlog/creation state
                // provided the history doesn't start with creation only.
                const firstTransition = histories[0];
                if (firstTransition) {
                     const start = new Date(firstTransition.created!).getTime();
                     if (resolved > start) {
                         changelogDuration += (resolved - start);
                         changelogCount++;
                     }
                }
            }

            if (changelogCount > 0) {
                totalDuration = changelogDuration;
                count = changelogCount;
                usedChangelog = true;
            }
        }

        // Method 2: Lead Time Fallback (Resolution - Created)
        if (count === 0) {
             for (const issue of completedIssues) {
                const created = new Date(issue.fields.created!).getTime();
                const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : new Date(issue.fields.updated!).getTime();

                if (resolved > created) {
                    totalDuration += (resolved - created);
                    count++;
                }
             }
        }

        if (count === 0) return { avg: 0, explanation: "Insufficient data." };

        const avgHours = totalDuration / count / (1000 * 60 * 60);
        const avgDays = Math.round(avgHours / 24 * 10) / 10;

        // Return in hours if small, days if large? The UI usually expects hours or a number.
        // Let's return hours but explanation says days.
        // Wait, 'cycleTime' type is number. Let's return Hours.

        const explanation = usedChangelog
            ? `Avg Cycle Time (First Transition -> Done) over ${count} issues.`
            : `Avg Lead Time (Created -> Done) over ${count} issues (Fallback).`;

        return {
            avg: Math.round(avgHours),
            explanation
        };
    }

    private calculateThroughput(historicalIssues: JiraIssue[], boardType: string): { rate: number, explanation?: string } {
        const doneIssues = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);

        if (doneIssues.length === 0) {
            return { rate: 0, explanation: "No completed issues found." };
        }

        const dates = doneIssues.map(i => i.fields.resolutiondate ? new Date(i.fields.resolutiondate).getTime() : new Date(i.fields.updated!).getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        let diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

        if (diffDays < 1) diffDays = 1; // Avoid division by zero or weird infinity

        // If very short window (e.g. 1 day), normalized throughput might be high.
        // If we have < 7 days data, just show the count.
        if (diffDays < 7) {
             return { rate: doneIssues.length, explanation: `Total items completed in last ${Math.round(diffDays)} days.` };
        }

        const weeks = diffDays / 7;
        const rate = Math.round((doneIssues.length / weeks) * 10) / 10;

        return { rate, explanation: `Avg items/week (over ${Math.round(diffDays)} days).` };
    }

    private calculateWipConsistency(historicalIssues: JiraIssue[], currentWip: number): { consistency: number, explanation?: string } {
         // Metric: Standard Deviation of WIP over time.
         // We reconstruct past WIP using Done issues (heuristic: Created < T < Resolved).

         const issuesWithHistory = historicalIssues.filter(i => i.changelog && i.changelog.histories);

         if (issuesWithHistory.length === 0 && currentWip === 0) {
             return { consistency: 0, explanation: "Insufficient history for WIP trends." };
         }

         // Sampling: Check WIP count at T, T-7d, T-14d, T-21d.
         const now = Date.now();
         const week = 7 * 24 * 60 * 60 * 1000;
         const samples = [now, now - week, now - 2*week, now - 3*week];

         const wipCounts = samples.map((time, index) => {
             // For the current moment (index 0), use the actual currentWip passed from the board data.
             // This is more accurate than reconstructing from Done issues because it includes active issues.
             if (index === 0) return currentWip;

             // For past dates, we can only rely on the 'historicalIssues' (which are mostly Done issues).
             // This underestimates past WIP because it ignores issues that were active then but are still active now (not Done).
             // However, it provides *some* number to measure flow consistency of the completed work.

             let count = 0;
             for (const issue of historicalIssues) {
                 const created = new Date(issue.fields.created!).getTime();
                 const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : null;

                 // If issue existed at 'time' and was not yet resolved (or resolved after time)
                 if (created <= time) {
                     if (!resolved || resolved > time) {
                         count++;
                     }
                 }
             }
             return count;
         });

         // Calculate Std Dev
         const mean = wipCounts.reduce((a, b) => a + b, 0) / wipCounts.length;
         if (mean === 0) return { consistency: 0, explanation: "WIP is consistently zero." };

         const variance = wipCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wipCounts.length;
         const stdDev = Math.sqrt(variance);

         return {
             consistency: Math.round(stdDev * 10) / 10,
             explanation: `WIP Deviation: ${Math.round(stdDev * 10)/10} (Avg WIP: ${Math.round(mean)}).`
         };
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
