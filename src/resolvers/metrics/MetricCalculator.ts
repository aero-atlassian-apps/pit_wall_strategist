import type { BoardData, TelemetryConfig, TelemetryData, Sprint } from '../../types/telemetry';
import type { JiraIssue } from '../../types/jira';
import { IssueCategorizer } from '../issue/IssueCategorizer';
import { fieldDiscoveryService } from '../data/FieldDiscoveryService';
import { JiraDataService } from '../data/JiraDataService';

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
            const hasField = Boolean(storyPointsField) && Object.prototype.hasOwnProperty.call(issue.fields as any, storyPointsField as any);
            if (!hasField) return 1;
            const val = (issue.fields as any)[storyPointsField as any];
            return typeof val === 'number' ? val : 1;
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

        const velocityResult = await this.calculateVelocity(boardData.closedSprints || [], boardData.historicalIssues || [], storyPointsField, boardData.boardType);
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
        const cycleTimeWindow = cycleTimeResult.window;

        // Throughput (Flow)
        const throughputResult = this.calculateThroughput(boardData.historicalIssues || [], boardData.boardType);
        const throughput = throughputResult.rate;
        const throughputExplanation = throughputResult.explanation;
        const throughputWindow = throughputResult.window;

        const healthStatus = this.determineHealthStatus(boardData.boardType, velocityDelta, wipLoad);

        return {
            boardType: boardData.boardType,
            healthStatus,
            sprintStatus: healthStatus,
            velocity,
            velocityDelta,
            velocityExplanation,
            velocitySource: velocityResult.source,
            velocityWindow: velocityResult.window,
            cycleTime,
            cycleTimeExplanation,
            cycleTimeWindow,
            throughput,
            throughputExplanation,
            throughputWindow,
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

    private async calculateVelocity(closedSprints: Sprint[], historicalIssues: JiraIssue[], storyPointsField: string | null, boardType: string): Promise<{ velocity: number, explanation?: string, source?: string, window?: string }> {
        // Primary: Sprint-based Velocity (exact per-sprint aggregation)
        if (closedSprints && closedSprints.length > 0) {
            // Backward-compatible path: if historical issues are present, aggregate per sprint from them
            if (historicalIssues && historicalIssues.length > 0) {
                const doneIssuesHist = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);
                const totalPointsHist = doneIssuesHist.reduce((sum, i) => {
                     const val = storyPointsField ? (i.fields as any)[storyPointsField] : 1;
                     return sum + (typeof val === 'number' ? val : 1);
                }, 0);
                const avgVelocity = Math.round(totalPointsHist / closedSprints.length);
                return {
                    velocity: avgVelocity,
                    explanation: `completed issues over last ${closedSprints.length} sprints`,
                    source: 'historical:issuesPerSprint',
                    window: `${closedSprints.length} closed sprints`
                };
            }
            const dataService = new JiraDataService();
            const perSprintPoints: number[] = [];

            for (const s of closedSprints) {
                const fields: string[] = ['status','resolutiondate'];
                if (storyPointsField) fields.push(storyPointsField);
                const issues = await dataService.getSprintIssues(s.id, fields, ['changelog'], 500);

                const endStr = (s.completeDate || s.endDate);
                const end = endStr ? new Date(endStr).getTime() : null;
                const startStr = s.startDate;
                const start = startStr ? new Date(startStr).getTime() : null;

                let sprintCompletedPoints = 0;
                for (const i of issues) {
                    const cat = this.categorizer.getStatusCategory(i);
                    if (cat !== this.config.statusCategories.done) continue;
                    const resolved = i.fields.resolutiondate ? new Date(i.fields.resolutiondate).getTime() : null;
                    if (resolved && end && start) {
                        if (resolved >= start && resolved <= end) {
                            const val = storyPointsField ? (i.fields as any)[storyPointsField] : 1;
                            sprintCompletedPoints += (typeof val === 'number' ? val : 1);
                        }
                    } else {
                        const val = storyPointsField ? (i.fields as any)[storyPointsField] : 1;
                        sprintCompletedPoints += (typeof val === 'number' ? val : 1);
                    }
                }
                perSprintPoints.push(sprintCompletedPoints);
            }

            const valid = perSprintPoints.filter(n => typeof n === 'number');
            if (valid.length && valid.reduce((a,b)=>a+b,0) > 0) {
                const avgVelocity = Math.round(valid.reduce((a,b)=>a+b,0) / valid.length);
                return {
                    velocity: avgVelocity,
                    explanation: `Average completed ${storyPointsField ? 'points' : 'issues'} across ${closedSprints.length} closed sprints.`,
                    source: 'agile:sprintIssues',
                    window: `${closedSprints.length} closed sprints`
                };
            }
            // Fallback 1: use provided historicalIssues per-sprint aggregation if sprint fetch yielded no data
            const doneIssuesHist = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);
            const totalPointsHist = doneIssuesHist.reduce((sum, i) => {
                 const val = storyPointsField ? (i.fields as any)[storyPointsField] : 1;
                 return sum + (typeof val === 'number' ? val : 1);
            }, 0);
            let avgVelocity = closedSprints.length ? Math.round(totalPointsHist / closedSprints.length) : 0;

            // Fallback 2: if historicalIssues are empty too, fetch via app-scoped JQL `sprint in (ids)`
            if ((!historicalIssues || historicalIssues.length === 0) && closedSprints.length) {
                try {
                    const sprintIds = closedSprints.map(s => s.id).join(',');
                    const fields: string[] = ['status','created','updated','resolutiondate'];
                    if (storyPointsField) fields.push(storyPointsField);
                    const jql = `sprint in (${sprintIds}) AND statusCategory = Done`;
                    const dataService = new JiraDataService();
                    const res = await (dataService as any).searchJqlAsApp(jql, fields, 500, ['changelog']);
                    const fetched = res?.ok ? (res.issues as JiraIssue[]) : [];
                    const points = fetched.reduce((sum, i) => {
                        const val = storyPointsField ? (i.fields as any)[storyPointsField] : 1;
                        return sum + (typeof val === 'number' ? val : 1);
                    }, 0);
                    avgVelocity = closedSprints.length ? Math.round(points / closedSprints.length) : 0;
                    if (avgVelocity > 0) {
                        return {
                            velocity: avgVelocity,
                            explanation: `Average completed ${storyPointsField ? 'points' : 'issues'} across ${closedSprints.length} closed sprints (JQL fallback).`,
                            source: 'app:jqlClosedSprints',
                            window: `${closedSprints.length} closed sprints`
                        };
                    }
                } catch {}
            }

            return {
                velocity: avgVelocity,
                explanation: `Average completed ${storyPointsField ? 'points' : 'issues'} over last ${closedSprints.length} sprints (fallback).`,
                source: 'historical:issuesPerSprint',
                window: `${closedSprints.length} closed sprints`
            };
        }

        // If no closed sprints: Scrum returns 0 with explicit explanation; Kanban/Business uses pseudo-velocity
        if (boardType === 'scrum') {
            return { velocity: 0, explanation: "No closed sprints found to calculate velocity.", source: 'none', window: 'none' };
        }
        const doneIssues = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);
        if (doneIssues.length === 0) {
             return { velocity: 0, explanation: "No completed issues found in recent history.", source: 'historical:resolutiondate', window: 'normalized to 14 days' };
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
            explanation: `Estimated ${unit} per 2 weeks (Pseudo-Velocity).`,
            source: 'historical:resolutiondate',
            window: 'normalized to 14 days'
        };
    }

    private calculateCycleTime(historicalIssues: JiraIssue[]): { avg: number, explanation?: string, window?: string } {
        // Try to use changelog first
        const issuesWithHistory = historicalIssues.filter(i => i.changelog && i.changelog.histories && i.changelog.histories.length > 0);
        const completedIssues = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);

        if (completedIssues.length === 0) {
            return { avg: 0, explanation: "No completed issues to analyze.", window: "none" };
        }

        let totalDuration = 0;
        let count = 0;
        let usedChangelog = false;

        // Method 1: Changelog (Accurate Cycle Time)
        // Time from first statusCategory 'indeterminate' entry to resolution
        if (issuesWithHistory.length > 0) {
            let changelogCount = 0;
            let changelogDuration = 0;

            const classify = (name: string): 'new'|'indeterminate'|'done' => {
                const n = (name || '').toLowerCase();
                if (n.includes('done') || n.includes('closed') || n.includes('resolved') || n.includes('complete') || n.includes('finished') || n.includes('released')) return 'done'
                if (n.includes('to do') || n.includes('todo') || n.includes('open') || n.includes('backlog') || n.includes('new')) return 'new'
                return 'indeterminate'
            }

            for (const issue of issuesWithHistory) {
                if (this.categorizer.getStatusCategory(issue) !== this.config.statusCategories.done) continue;

                const histories = issue.changelog!.histories!;
                histories.sort((a, b) => new Date(a.created!).getTime() - new Date(b.created!).getTime());

                const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : new Date(issue.fields.updated!).getTime();

                let startTs: number | null = null;
                let lastCat: 'new'|'indeterminate'|'done' = 'new';
                for (const h of histories) {
                    const statusChange = (h.items || []).find((it: any) => it.field === 'status');
                    if (!statusChange) continue;
                    const toCat = classify(statusChange.toString || '');
                    const fromCat = classify(statusChange.fromString || '');
                    const t = new Date(h.created!).getTime();
                    if (lastCat === 'new' && toCat === 'indeterminate' && startTs === null) {
                        startTs = t;
                    }
                    lastCat = toCat;
                }

                if (startTs && resolved > startTs) {
                    changelogDuration += (resolved - startTs);
                    changelogCount++;
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

        if (count === 0) return { avg: 0, explanation: "Insufficient data.", window: "none" };

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
            explanation,
            window: `${count} completed issues`
        };
    }

    private calculateThroughput(historicalIssues: JiraIssue[], boardType: string): { rate: number, explanation?: string, window?: string } {
        const doneIssues = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);

        if (doneIssues.length === 0) {
            return { rate: 0, explanation: "No completed issues found.", window: "none" };
        }

        const dates = doneIssues.map(i => i.fields.resolutiondate ? new Date(i.fields.resolutiondate).getTime() : new Date(i.fields.updated!).getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        let diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

        if (diffDays < 1) diffDays = 1; // Avoid division by zero or weird infinity

        // If very short window (e.g. 1 day), normalized throughput might be high.
        // If we have < 7 days data, just show the count.
        if (diffDays < 7) {
             return { rate: doneIssues.length, explanation: `Total items completed in last ${Math.round(diffDays)} days.`, window: `${Math.round(diffDays)} days` };
        }

        const weeks = diffDays / 7;
        const rate = Math.round((doneIssues.length / weeks) * 10) / 10;

        return { rate, explanation: `Average items per week (over ${Math.round(diffDays)} days).`, window: `${Math.round(diffDays)} days` };
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
