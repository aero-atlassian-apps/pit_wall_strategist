import type { BoardData, TelemetryConfig, TelemetryData, Sprint } from '../../types/telemetry';
import type { JiraIssue } from '../../types/jira';
import { IssueCategorizer } from '../../resolvers/issue/IssueCategorizer';
import { fieldDiscoveryService } from './FieldDiscoveryService';
import { JiraDataService } from '../jira/JiraDataService';
import { InternalContext } from '../../domain/types/Context';

export class MetricCalculator {
    constructor(private categorizer: IssueCategorizer, private config: TelemetryConfig) { }

    /**
     * Calculates telemetry strictly adhering to the provided Canonical Context.
     * If context forbids a metric (e.g. Velocity in Kanban), it returns a degraded/NA state.
     */
    async calculate(boardData: BoardData, context: InternalContext): Promise<TelemetryData> {
        const issues = boardData.issues;
        const customFields = await fieldDiscoveryService.discoverCustomFields();
        const storyPointsFields = customFields.storyPoints || (this.config.storyPointsFieldName ? [this.config.storyPointsFieldName] : []);

        // 1. Strict Context Categorization
        // Use context.workflow if available, otherwise fallback to config (legacy) for safety
        const todoIssues = issues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.todo);
        const inProgressIssues = issues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.inProgress);
        const doneIssues = issues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);

        // 2. Flow Metrics (Universal)
        const wipCurrent = inProgressIssues.length;
        const wipLimit = this.config.wipLimit;
        const wipLoad = wipLimit > 0 ? Math.round((wipCurrent / wipLimit) * 100) : 0; // 0 if no limit, handled by explanation
        const wipExplanation = wipLimit <= 0 ? "exp:noWipLimit" : undefined;

        // WIP Consistency (Requires History)
        const wipConsistencyResult = this.calculateWipConsistency(boardData.historicalIssues || [], wipCurrent, context);
        const wipConsistency = wipConsistencyResult.consistency;
        const wipConsistencyExplanation = wipConsistencyResult.explanation;

        // Assignee Load
        const assigneeLoad = this.calculateAssigneeLoad(inProgressIssues);
        const teamBurnout = this.calculateTeamBurnout(assigneeLoad);

        // Completion (Context Aware)
        const getPoints = (issue: JiraIssue) => this.getIssuePoints(issue, context, storyPointsFields);

        const totalStoryPoints = issues.reduce((sum, i) => sum + getPoints(i), 0);
        const doneStoryPoints = doneIssues.reduce((sum, i) => sum + getPoints(i), 0);
        const completion = totalStoryPoints > 0 ? Math.round((doneStoryPoints / totalStoryPoints) * 100) : 0;

        // 3. Velocity (STRICTLY SCRUM ONLY)
        let velocity: number | undefined;
        let velocityExplanation: string | undefined;
        let velocityDelta: number | undefined;
        let velocitySource: string | undefined;
        let velocityWindow: string | undefined;

        if (context.boardStrategy === 'scrum') {
            const vRes = await this.calculateScrumVelocity(boardData, storyPointsFields, context);
            velocity = vRes.velocity;
            velocityExplanation = vRes.explanation;
            velocitySource = vRes.source;
            velocityWindow = vRes.window;
            velocityDelta = this.calculatePace(boardData, completion);
        } else {
            // Explicitly Not Applicable for Kanban/Business
            velocity = undefined;
            velocityExplanation = "exp:metricNotApplicable:strategy=" + context.boardStrategy;
            velocitySource = "n/a";
            velocityWindow = "n/a";
            velocityDelta = undefined;
        }

        // 4. Cycle Time & Throughput (Use Historical Data)
        // If history is missing, these degrade gracefully
        const cycleTimeResult = this.calculateCycleTime(boardData.historicalIssues || [], context);
        const throughputResult = this.calculateThroughput(boardData.historicalIssues || [], context);

        const flowEfficiency = this.calculateFlowEfficiency(inProgressIssues);

        // 5. Health Status Determination
        const healthStatus = this.determineHealthStatus(context.boardStrategy, velocityDelta, wipLoad);

        return {
            boardType: context.boardStrategy === 'none' ? 'business' : context.boardStrategy,
            healthStatus,
            sprintStatus: healthStatus,

            velocity,
            velocityDelta,
            velocityExplanation,
            velocitySource,
            velocityWindow,

            cycleTime: cycleTimeResult.avg,
            cycleTimeExplanation: cycleTimeResult.explanation,
            cycleTimeWindow: cycleTimeResult.window,

            throughput: throughputResult.rate,
            throughputExplanation: throughputResult.explanation,
            throughputWindow: throughputResult.window,

            wipLoad,
            wipLimit,
            wipCurrent,
            wipExplanation,
            wipConsistency,
            wipConsistencyExplanation,

            flowEfficiency,
            teamBurnout,
            completion,
            issuesByStatus: { todo: todoIssues.length, inProgress: inProgressIssues.length, done: doneIssues.length }
        };
    }

    // --- STRATEGY: Scrum Velocity ---
    private async calculateScrumVelocity(boardData: BoardData, storyPointsFields: string[], context: InternalContext): Promise<{ velocity: number, explanation?: string, source?: string, window?: string }> {
        const closedSprints = boardData.closedSprints || [];

        if (closedSprints.length === 0) {
            return { velocity: 0, explanation: "exp:noClosedSprints", source: 'none', window: 'none' };
        }

        const dataService = new JiraDataService();
        const perSprintPoints: number[] = [];
        let missingData = false;

        for (const s of closedSprints) {
            const fields: string[] = ['status', 'resolutiondate'];
            if (storyPointsFields.length > 0) fields.push(...storyPointsFields);

            try {
                // We rely on the Jira Service to respect permissions 
                const issues = await dataService.getSprintIssues(s.id, fields, ['changelog'], 500);

                // If issues are empty but sprint is closed, it might be permission issue OR empty sprint. 
                // We assume valid empty sprint if no error.

                const points = issues.reduce((sum, i) => {
                    const cat = this.categorizer.getStatusCategory(i);
                    // Strict Velocity: Only 'Done' items count.
                    if (cat !== this.config.statusCategories.done) return sum;

                    // Truth: Respect Estimation Mode
                    if (context.estimationMode === 'issueCount') {
                        return sum + 1;
                    }

                    // Story Points Mode
                    // Story Points Mode: Check all candidate fields
                    let val = 0;
                    for (const fieldId of storyPointsFields) {
                        const v = (i.fields as any)[fieldId];
                        if (typeof v === 'number') {
                            val = v;
                            break; // Take first valid number found
                        }
                    }
                    return sum + val;
                }, 0);
                perSprintPoints.push(points);

            } catch (e) {
                missingData = true;
            }
        }

        if (perSprintPoints.length === 0) {
            return { velocity: 0, explanation: "exp:dataAccessError", source: 'error', window: 'none' };
        }

        const avgVelocity = Math.round(perSprintPoints.reduce((a, b) => a + b, 0) / perSprintPoints.length);

        return {
            velocity: avgVelocity,
            explanation: `exp:velocityAvgSprints:count=${perSprintPoints.length}${missingData ? ':partial' : ''}`,
            source: 'agile:sprintIssues',
            window: `${perSprintPoints.length} closed sprints`
        };
    }

    // --- STRATEGY: Cycle Time ---
    private calculateCycleTime(historicalIssues: JiraIssue[], context: InternalContext): { avg: number, explanation?: string, window?: string } {
        // Strict: We ONLY use changelog for Cycle Time to be accurate.
        // If no changelog, we degrade to Resolution - Created (Lead Time) but label it clearly.

        const completedIssues = historicalIssues.filter(i => this.categorizer.getStatusCategory(i) === this.config.statusCategories.done);
        if (completedIssues.length === 0) return { avg: 0, explanation: "exp:noCompletedIssues", window: "none" };

        let totalTime = 0;
        let count = 0;
        let method = 'changelog';

        // 1. Try Changelog
        const issuesWithHistory = historicalIssues.filter(i => i.changelog && i.changelog.histories && i.changelog.histories.length > 0);

        if (issuesWithHistory.length > 0) {
            for (const issue of issuesWithHistory) {
                if (this.categorizer.getStatusCategory(issue) !== this.config.statusCategories.done) continue;

                const durationInfo = this.calculateIssueCycleTime(issue, context);
                if (durationInfo !== null) {
                    totalTime += durationInfo;
                    count++;
                }
            }
        }

        // 2. Fallback: Resolution - Created (Lead Time proxy)
        if (count === 0) {
            method = 'leadTimeProxy';
            for (const issue of completedIssues) {
                const created = new Date(issue.fields.created!).getTime();
                const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : new Date(issue.fields.updated!).getTime();
                if (resolved > created) {
                    totalTime += (resolved - created);
                    count++;
                }
            }
        }

        if (count === 0) return { avg: 0, explanation: "exp:insufficientData", window: "none" };

        const avgHours = totalTime / count / (1000 * 60 * 60);

        return {
            avg: Math.round(avgHours),
            explanation: `exp:cycleTime:${method}:count=${count}`,
            window: `${count} issues`
        };
    }

    private calculateIssueCycleTime(issue: JiraIssue, context: InternalContext): number | null {
        if (!issue.changelog?.histories) return null;

        const histories = issue.changelog.histories.sort((a, b) => new Date(a.created!).getTime() - new Date(b.created!).getTime());
        let startTime: number | null = null;

        // STRICT CONTEXT: Use Workflow Topology for accurate, locale-agnostic detection
        const { statusMap } = context.workflow;

        for (const h of histories) {
            const item = h.items.find((i: any) => i.field === 'status');
            if (!item) continue;

            const toId = item.to;

            // Resolve Category
            let category = 'indeterminate'; // Default Assumption

            if (statusMap && toId && statusMap[toId]) {
                // FAST PATH: We have the ID and the Map. Absolute Truth.
                category = statusMap[toId] as any;
            } else {
                // FALLBACK PATH: Unmapped ID or Missing Map.
                // We must log this as a potential accuracy risk in a real system, but here we fallback to heuristics.
                // This is "Degraded" accuracy but better than nothing for now.
                const name = (item.toString || '').toLowerCase();

                // Heuristics for standard English/French terms if map fails
                if (['to do', 'new', 'open', 'backlog', 'create', 'à faire', 'nouveau'].some(s => name.includes(s))) category = 'new';
                else if (['done', 'closed', 'resolved', 'complete', 'terminé', 'résolu'].some(s => name.includes(s))) category = 'done';
            }

            // Check if this transition starts the cycle (First entry into 'indeterminate')
            if (category === 'indeterminate' && startTime === null) {
                startTime = new Date(h.created!).getTime();
            }
        }

        const endTime = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : new Date(issue.fields.updated!).getTime();

        if (startTime && endTime > startTime) {
            return endTime - startTime;
        }

        return null;
    }

    // --- STRATEGY: Throughput ---
    private calculateThroughput(historicalIssues: JiraIssue[], context: InternalContext): { rate: number, explanation?: string, window?: string } {
        // IMPROVED: Robust Done Detection
        // 1. Status Category 'done'
        // 2. Or has resolutiondate (Logic: Resolved usually means Done)
        const doneIssues = historicalIssues.filter(i => {
            if (this.categorizer.getStatusCategory(i) === this.config.statusCategories.done) return true;
            if (i.fields.resolutiondate) return true; // Fallback
            return false;
        });

        if (doneIssues.length === 0) return { rate: 0, explanation: "exp:noCompletedFound", window: "none" };

        const dates = doneIssues.map(i => i.fields.resolutiondate ? new Date(i.fields.resolutiondate).getTime() : new Date(i.fields.updated!).getTime());
        const min = Math.min(...dates);
        const max = Math.max(...dates);

        let days = (max - min) / (1000 * 60 * 60 * 24);

        // Adaptive window: if we have very little time range, we don't force a week
        // but we do want to avoid massive spikes from a single hour of work.
        // Minimum window: 1 day if issues exist, to avoid infinity or extreme skew.
        if (days < 1) days = 1;

        // Throughput = Issues / Week
        const weeks = days / 7;
        const rate = Math.round((doneIssues.length / weeks) * 10) / 10;

        return {
            rate,
            explanation: `exp:throughputAvg:days=${Math.round(days)}`,
            window: `${Math.round(days)} ${Math.round(days) === 1 ? 'day' : 'days'}`
        };
    }

    private calculateFlowEfficiency(inProgressIssues: JiraIssue[]): number {
        const now = new Date();
        const stalledThreshold = this.config.stalledThresholdHours || 24;

        const active = inProgressIssues.filter(i => {
            let lastActivityTime = new Date(i.fields.updated || 0).getTime();

            // Try to find the most recent status change in history
            if (i.changelog?.histories) {
                const histories = [...i.changelog.histories].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
                const lastStatusChange = histories.find(h => h.items.some(it => it.field === 'status'));
                if (lastStatusChange) {
                    lastActivityTime = new Date(lastStatusChange.created).getTime();
                }
            }

            const hours = (now.getTime() - lastActivityTime) / (1000 * 60 * 60);
            return hours <= stalledThreshold;
        }).length;

        return inProgressIssues.length > 0
            ? Math.round((active / inProgressIssues.length) * 100)
            : 100;
    }

    private calculateWipConsistency(issues: JiraIssue[], currentWip: number, context: InternalContext): { consistency: number, explanation?: string } {
        // If not software/flow, WIP consistency is less relevant but we can still calc it.
        // We iterate back 4 weeks.

        if (issues.length === 0 && currentWip === 0) return { consistency: 0, explanation: "exp:insufficientData" };

        const now = Date.now();
        const week = 7 * 24 * 60 * 60 * 1000;
        const samples = [currentWip]; // T0

        for (let i = 1; i <= 3; i++) {
            const t = now - (i * week);
            // Reconstruct WIP at t
            // Count issues where Created <= t AND (Unresolved OR Resolution > t)
            // This is an Approximation (Lead Time WIP), not true Column WIP, but statistically useful for stability
            let count = 0;
            for (const issue of issues) {
                const created = new Date(issue.fields.created!).getTime();
                const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : null;
                if (created <= t) {
                    if (!resolved || resolved > t) count++;
                }
            }
            samples.push(count);
        }

        // Standard Deviation
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        if (mean === 0) return { consistency: 0, explanation: "exp:wipZero" };

        const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
        const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

        return {
            consistency: stdDev,
            explanation: `exp:wipDeviation:val=${stdDev}`
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
        if (boardData.boardType === 'scrum' && boardData.sprint?.startDate && boardData.sprint?.endDate) {
            const now = new Date();
            const start = new Date(boardData.sprint.startDate);
            const end = new Date(boardData.sprint.endDate);
            const total = end.getTime() - start.getTime();
            if (total <= 0) return 0;
            const elapsed = now.getTime() - start.getTime();
            const expected = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
            return completion - expected;
        }
        return 0;
    }

    private determineHealthStatus(strategy: string, velocityDelta: number = 0, wipLoad: number): 'OPTIMAL' | 'WARNING' | 'CRITICAL' {
        if (strategy === 'scrum') {
            if (velocityDelta < -20 || wipLoad > 120) return 'CRITICAL';
            if (velocityDelta < -10 || wipLoad > 90) return 'WARNING';
        } else {
            // Kanban/Business: purely WIP/Flow based
            if (wipLoad > 100) return 'CRITICAL';
            if (wipLoad > 85) return 'WARNING';
        }
        return 'OPTIMAL';
    }

    private getIssuePoints(issue: JiraIssue, context: InternalContext, storyPointsFields: string[]): number {
        // 1. Business Projects = Always 1 (Count)
        if (context.projectType === 'business') return 1;

        // 2. Strict Estimation Mode (Software)
        if (context.estimationMode === 'issueCount') return 1;

        // 3. Story Points Mode
        if (!storyPointsFields || storyPointsFields.length === 0) return 0;

        for (const fieldId of storyPointsFields) {
            const val = (issue.fields as any)[fieldId];
            if (typeof val === 'number') return val;
        }
        return 0;
    }
}

