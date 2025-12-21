import { TelemetryData } from '../../types/telemetry';
import { RovoActionType, ACTION_DESCRIPTIONS } from './RovoActionTypes';

/**
 * Rovo Chat Request - Input for the expert system
 */
export interface RovoChatRequest {
    message: string;
    telemetry: TelemetryData;
    trends: TrendData;
    sprintName: string;
    issues: ChatIssue[];
    boardType: 'scrum' | 'kanban' | 'business';
    config: ChatConfig;
}

export interface TrendData {
    direction: 'up' | 'down' | 'flat';
    change: number;
    velocity?: {
        total: number;
        averagePerDay?: number;
    };
}

export interface ChatIssue {
    key: string;
    summary?: string;
    status?: string;
    statusCategory?: string;
    assignee?: string;
    isStalled?: boolean;
    labels?: string[];
    updated?: string;
}

export interface ChatConfig {
    assigneeCapacity: number;
    wipLimit: number;
}

/**
 * Rovo Chat Response - Output from the expert system
 */
export interface RovoChatResponse {
    success: boolean;
    answer: string;
    suggestedActions?: SuggestedAction[];
    context?: ChatContext;
}

export interface SuggestedAction {
    actionType: RovoActionType;
    label: string;
    description: string;
    issueKey?: string;
    payload?: Record<string, unknown>;
}

export interface ChatContext {
    detectedIntent: string;
    matchedTopics: string[];
    processedAt: string;
}

/**
 * Driver Statistics for workload analysis
 */
interface DriverStats {
    total: number;
    stalled: number;
    inProgress: number;
    issues: ChatIssue[];
}

/**
 * Rovo Chat Expert System
 * 
 * World-class rule-based AI for F1 sprint management analysis.
 * This domain service contains pure business logic with no external dependencies.
 */
export class RovoChatExpertSystem {

    /**
     * Process a chat message and return expert analysis
     */
    analyze(request: RovoChatRequest): RovoChatResponse {
        const {
            message,
            telemetry,
            trends,
            sprintName,
            issues,
            boardType,
            config
        } = request;

        const lowerMsg = (message || '').toLowerCase();
        const isKanban = boardType === 'kanban';
        const assigneeStats = this.calculateAssigneeStats(issues);
        const overloadedDrivers = this.findOverloadedDrivers(assigneeStats, config.assigneeCapacity);
        const context = this.detectIntent(lowerMsg);

        let response = '';
        let suggestedActions: SuggestedAction[] = [];

        // Intent matching and response generation
        if (this.matchesIntent(lowerMsg, ['team', 'driver', 'who', 'assignee'])) {
            const result = this.analyzeTeamWorkload(assigneeStats, overloadedDrivers, config.assigneeCapacity);
            response = result.response;
            suggestedActions = result.actions;
            context.detectedIntent = 'team_workload';

        } else if (this.matchesIntent(lowerMsg, ['stall', 'stuck', 'problem'])) {
            const result = this.analyzeStalledIssues(issues, assigneeStats, config.assigneeCapacity);
            response = result.response;
            suggestedActions = result.actions;
            context.detectedIntent = 'stalled_analysis';

        } else if (this.matchesIntent(lowerMsg, ['recommend', 'strategy', 'what should', 'help'])) {
            const result = this.generateStrategicRecommendations(issues, telemetry, overloadedDrivers, assigneeStats, config, sprintName);
            response = result.response;
            suggestedActions = result.actions;
            context.detectedIntent = 'strategy_recommendations';

        } else if (this.matchesIntent(lowerMsg, ['pace', 'velocity'])) {
            response = this.analyzePace(telemetry, trends, overloadedDrivers);
            context.detectedIntent = 'pace_analysis';

        } else if (this.matchesIntent(lowerMsg, ['cycle', 'lap time'])) {
            response = this.analyzeCycleTime(telemetry, isKanban);
            context.detectedIntent = 'cycle_time';

        } else if (this.matchesIntent(lowerMsg, ['throughput', 'flow rate'])) {
            response = this.analyzeThroughput(trends);
            context.detectedIntent = 'throughput';

        } else if (this.matchesIntent(lowerMsg, ['wip', 'aging', 'tire deg'])) {
            response = this.analyzeWipAging(issues);
            context.detectedIntent = 'wip_aging';

        } else if (this.matchesIntent(lowerMsg, ['traffic', 'bottle', 'block'])) {
            response = this.analyzeTraffic(issues);
            context.detectedIntent = 'traffic_analysis';

        } else if (this.matchesIntent(lowerMsg, ['health', 'crew'])) {
            response = this.analyzeCrewHealth(telemetry);
            context.detectedIntent = 'crew_health';

        } else if (this.matchesIntent(lowerMsg, ['predict', 'finish'])) {
            response = this.generatePrediction(sprintName, telemetry);
            context.detectedIntent = 'prediction';

        } else if (this.matchesIntent(lowerMsg, ['red flag', 'blocked'])) {
            response = this.analyzeBlockedIssues(issues);
            context.detectedIntent = 'blocked_issues';

        } else {
            const stalledCount = issues.filter(i => i.isStalled).length;
            response = this.generateHelpResponse(sprintName, issues.length, stalledCount, telemetry.wipLoad || 0, isKanban);
            context.detectedIntent = 'help';
        }

        return {
            success: true,
            answer: response,
            suggestedActions,
            context
        };
    }

    // ============ Analysis Methods ============

    private analyzeTeamWorkload(
        stats: Record<string, DriverStats>,
        overloaded: [string, DriverStats][],
        capacity: number
    ): { response: string; actions: SuggestedAction[] } {
        const driverReports = Object.entries(stats)
            .filter(([name]) => name !== 'Unassigned')
            .sort((a, b) => b[1].stalled - a[1].stalled)
            .slice(0, 5)
            .map(([name, s]) => {
                const status = s.stalled > 0 ? '🔴' : s.total > capacity ? '🟡' : '🟢';
                const stalledList = s.stalled > 0
                    ? ` (${s.issues.filter(i => i.isStalled).map(i => i.key).join(', ')})`
                    : '';
                return `${status} **${name}**: ${s.total} tickets, ${s.inProgress} racing, ${s.stalled} stalled${stalledList}`;
            });

        const availableDriver = this.findAvailableDriver(stats, capacity);
        let recommendation = '';
        const actions: SuggestedAction[] = [];

        if (overloaded.length > 0) {
            const [name, driverStats] = overloaded[0];
            recommendation = `\n\n🎯 **Strategy Recommendation**: ${name} has ${driverStats.stalled} stalled ticket(s).`;

            if (availableDriver && driverStats.issues.length > 0) {
                const topIssue = driverStats.issues[0];
                recommendation += ` Consider **Team Orders** to ${availableDriver}.`;
                actions.push({
                    actionType: RovoActionType.REASSIGN_TICKET,
                    label: ACTION_DESCRIPTIONS[RovoActionType.REASSIGN_TICKET].name,
                    description: `Reassign ${topIssue.key} to ${availableDriver}`,
                    issueKey: topIssue.key
                });
            } else {
                recommendation += ' No available drivers—consider deferring lower-priority items.';
            }
        } else {
            recommendation = '\n\n✅ All drivers operating within capacity.';
        }

        return {
            response: `👥 **Driver Telemetry (Team Workload)**\n\n${driverReports.join('\n')}${recommendation}`,
            actions
        };
    }

    private analyzeStalledIssues(
        issues: ChatIssue[],
        stats: Record<string, DriverStats>,
        capacity: number
    ): { response: string; actions: SuggestedAction[] } {
        const stalledIssues = issues.filter(i => i.isStalled);

        if (stalledIssues.length === 0) {
            return {
                response: '✅ **All Clear**\n\nNo stalled tickets detected. Track is clear, push to the limit!',
                actions: []
            };
        }

        const details = stalledIssues.slice(0, 5).map(issue => {
            const hoursSinceUpdate = issue.updated
                ? Math.round((Date.now() - new Date(issue.updated).getTime()) / (1000 * 60 * 60))
                : 0;
            return `🚨 **${issue.key}** - ${(issue.summary || 'No summary').substring(0, 40)}...\n   └ Driver: ${issue.assignee || 'Unassigned'} | Stalled: ${hoursSinceUpdate}h | Status: ${issue.status || 'Unknown'}`;
        });

        const availableDriver = this.findAvailableDriver(stats, capacity);
        const topStalled = stalledIssues[0];
        const actions: SuggestedAction[] = [];
        let actionRec: string;

        if (availableDriver) {
            actionRec = `**Recommended Action**: Execute **Team Orders** - Reassign ${topStalled.key} to ${availableDriver}`;
            actions.push({
                actionType: RovoActionType.REASSIGN_TICKET,
                label: ACTION_DESCRIPTIONS[RovoActionType.REASSIGN_TICKET].name,
                description: `Reassign to ${availableDriver}`,
                issueKey: topStalled.key
            });
        } else {
            actionRec = `**Recommended Action**: Execute **The Undercut** - Split ${topStalled.key} into smaller tasks`;
            actions.push({
                actionType: RovoActionType.SPLIT_TICKET,
                label: ACTION_DESCRIPTIONS[RovoActionType.SPLIT_TICKET].name,
                description: 'Split into subtasks',
                issueKey: topStalled.key
            });
        }

        return {
            response: `🚩 **Stalled Tickets Report**\n\n${details.join('\n\n')}\n\n---\n${actionRec}`,
            actions
        };
    }

    private generateStrategicRecommendations(
        issues: ChatIssue[],
        telemetry: TelemetryData,
        overloaded: [string, DriverStats][],
        stats: Record<string, DriverStats>,
        config: ChatConfig,
        sprintName: string
    ): { response: string; actions: SuggestedAction[] } {
        const stalledCount = issues.filter(i => i.isStalled).length;
        const wipLoad = telemetry?.wipLoad || 0;
        const recommendations: string[] = [];
        const actions: SuggestedAction[] = [];

        if (stalledCount > 0) {
            const topStalled = issues.find(i => i.isStalled);
            const availableDriver = this.findAvailableDriver(stats, config.assigneeCapacity);

            if (availableDriver && topStalled) {
                recommendations.push(`🔄 **Team Orders**: Reassign ${topStalled.key} to ${availableDriver} (has capacity)`);
                actions.push({
                    actionType: RovoActionType.REASSIGN_TICKET,
                    label: 'Team Orders',
                    description: `Reassign ${topStalled.key}`,
                    issueKey: topStalled.key
                });
            }

            if (topStalled) {
                recommendations.push(`✂️ **The Undercut**: Split ${topStalled.key} into smaller, faster subtasks`);
                actions.push({
                    actionType: RovoActionType.SPLIT_TICKET,
                    label: 'The Undercut',
                    description: `Split ${topStalled.key}`,
                    issueKey: topStalled.key
                });
            }
        }

        if (wipLoad > 100) {
            recommendations.push(`⛽ **Fuel Adjustment**: WIP at ${wipLoad}%. Defer lowest-priority items to next sprint.`);
        }

        if (overloaded.length > 0) {
            const [name, driverStats] = overloaded[0];
            recommendations.push(`👥 **Driver Rotation**: ${name} has ${driverStats.total} tickets. Consider load balancing.`);
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ **Green Flag**: All systems nominal. Maintain current pace and push for fastest lap!');
        }

        return {
            response: `🏁 **Strategic Recommendations**\n\nBased on current ${sprintName} telemetry:\n\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}`,
            actions
        };
    }

    private analyzePace(telemetry: TelemetryData, trends: TrendData, overloaded: [string, DriverStats][]): string {
        const dir = trends.direction || 'flat';
        const change = trends.change || 0;
        const wipLoad = telemetry.wipLoad || 0;

        const driverInsight = overloaded.length > 0
            ? `\n\n⚠️ **Driver Alert**: ${overloaded[0][0]} may be affecting pace (${overloaded[0][1].stalled} stalled).`
            : '';

        const strategyCall = wipLoad > 100
            ? 'We are heavy on fuel. Box for a strategy adjustment.'
            : 'Pace is good. Push for the fastest lap.';

        return `🏎️ **Telemetry Report: Pace Analysis**\n\nCurrent Fuel Load (WIP) is **${wipLoad}%**.\nVelocity is trending **${dir}** (${change}% vs last sprint).${driverInsight}\n\n*Engineer's Call*: ${strategyCall}`;
    }

    private analyzeCycleTime(telemetry: TelemetryData, isKanban: boolean): string {
        const cycleTime = (telemetry as any).timing?.cycleTime?.average || '-';
        const modeLabel = isKanban ? 'Flow Optimization' : 'Sprint';
        const advice = Number(cycleTime) > 48
            ? 'Lap times are too long. Consider breaking down large items.'
            : 'Lap times are competitive. Maintain current pace.';

        return `⏱️ **Lap Time Analysis (Cycle Time)**\n\nAverage Lap Time: **${cycleTime}h**\nThis measures how long tickets spend in active work.\n\n*${modeLabel}*: ${advice}`;
    }

    private analyzeThroughput(trends: TrendData): string {
        const throughput = trends.velocity?.total || 0;
        const avgPerDay = trends.velocity?.averagePerDay || '-';
        const advice = throughput < 5
            ? 'Flow is restricted. Check for blockers in the middle sector.'
            : 'Good flow. Keep the DRS zone open.';

        return `📊 **Throughput Report (Flow Rate)**\n\nCompleted this period: **${throughput}** items.\nAverage per day: **${avgPerDay}**\n\n*Strategy*: ${advice}`;
    }

    private analyzeWipAging(issues: ChatIssue[]): string {
        const stalledIssues = issues.filter(i => i.isStalled);
        const aging = stalledIssues.length;
        const advice = aging > 2
            ? '⚠️ HIGH WEAR. Recommend immediate pit stop (Split or Reassign).'
            : '✅ Tires holding. Continue current stint.';

        const preview = stalledIssues.slice(0, 3)
            .map(i => `• ${i.key}: ${(i.summary || '').substring(0, 30)}...`)
            .join('\n');

        return `🛞 **Tire Degradation Report (WIP Aging)**\n\n**${aging}** items showing signs of degradation (stalled >24h).\n${preview}\n\n*Strategy*: ${advice}`;
    }

    private analyzeTraffic(issues: ChatIssue[]): string {
        const stalledCount = issues.filter(i => i.isStalled).length;
        return `⚠️ **Track Traffic Report**\n\nI see **${issues.length}** cars on track (Tickets in Sprint).\n**${stalledCount}** cars appear to be stalled or high-drag.\n\n*Strategy*: Clear the middle sector. Focus on finishing active laps before starting new ones.`;
    }

    private analyzeCrewHealth(telemetry: TelemetryData): string {
        const burnout = telemetry.teamBurnout || {};
        const hot = Object.entries(burnout)
            .filter(([_, v]) => (v as number) > 80)
            .map(([k]) => k);

        const status = hot.length > 0
            ? `🔥 **Critical**: ${hot.join(', ')} are overheating (>80% load).`
            : '✅ All systems nominal. Crew is fresh.';

        const rotation = hot.length > 0
            ? 'Suggest immediate pit stop for tired engineers.'
            : 'Maintain current shift pattern.';

        return `🏥 **Pit Crew Status**\n\n${status}\n\n*Rotation*: ${rotation}`;
    }

    private generatePrediction(sprintName: string, telemetry: TelemetryData): string {
        const remaining = 100 - (telemetry.completion || 0);
        return `🔮 **Race Strategy Prediction**\n\nBased on current **${sprintName}** telemetry:\nEstimated laps remaining: **${remaining}%**.\n\nTo finish P1, we need to maintain current velocity.`;
    }

    private analyzeBlockedIssues(issues: ChatIssue[]): string {
        const blocked = issues.filter(i => i.labels?.includes('blocked') || i.isStalled);
        const preview = blocked.slice(0, 3)
            .map(i => `• ${i.key}: ${i.status}`)
            .join('\n');

        return `🚩 **Red Flag Report**\n\n**${blocked.length}** items currently flagged or blocked.\n${preview}\n\n*Action*: Use RED FLAG action to formally flag blockers.`;
    }

    private generateHelpResponse(
        sprintName: string,
        issueCount: number,
        stalledCount: number,
        wipLoad: number,
        isKanban: boolean
    ): string {
        const statusEmoji = stalledCount > 0 ? '🟡' : '🟢';
        const mode = isKanban ? 'KANBAN' : 'SCRUM';

        return `🎙️ **Radio Check** ${statusEmoji}\n\nReading telemetry for **${sprintName}** (${mode} mode).\n\n📊 **Quick Stats**: ${issueCount} tickets | ${stalledCount} stalled | WIP: ${wipLoad}%\n\nAsk me about:\n• **"team"** - Driver workload analysis\n• **"stalled"** - Deep dive on stuck tickets\n• **"recommend"** - Strategic action recommendations\n• **"pace"** - Velocity & trends\n• **"crew"** - Team burnout analysis`;
    }

    // ============ Helper Methods ============

    private calculateAssigneeStats(issues: ChatIssue[]): Record<string, DriverStats> {
        const stats: Record<string, DriverStats> = {};

        for (const issue of issues) {
            const assignee = issue.assignee || 'Unassigned';
            if (!stats[assignee]) {
                stats[assignee] = { total: 0, stalled: 0, inProgress: 0, issues: [] };
            }
            stats[assignee].total++;
            stats[assignee].issues.push(issue);
            if (issue.isStalled) stats[assignee].stalled++;
            if (issue.statusCategory === 'indeterminate') stats[assignee].inProgress++;
        }

        return stats;
    }

    private findOverloadedDrivers(
        stats: Record<string, DriverStats>,
        capacity: number
    ): [string, DriverStats][] {
        return Object.entries(stats)
            .filter(([_, s]) => s.total > capacity || s.stalled > 0)
            .sort((a, b) => (b[1].stalled + b[1].total) - (a[1].stalled + a[1].total));
    }

    private findAvailableDriver(
        stats: Record<string, DriverStats>,
        capacity: number
    ): string | null {
        const available = Object.entries(stats)
            .filter(([name, s]) => name !== 'Unassigned' && s.total < capacity && s.stalled === 0)
            .sort((a, b) => a[1].total - b[1].total);

        return available.length > 0 ? available[0][0] : null;
    }

    private matchesIntent(message: string, keywords: string[]): boolean {
        return keywords.some(k => message.includes(k));
    }

    private detectIntent(message: string): ChatContext {
        const topics: string[] = [];

        const intentPatterns = [
            { keywords: ['team', 'driver', 'who', 'assignee'], topic: 'team' },
            { keywords: ['stall', 'stuck', 'problem'], topic: 'stalled' },
            { keywords: ['recommend', 'strategy', 'help'], topic: 'strategy' },
            { keywords: ['pace', 'velocity'], topic: 'pace' },
            { keywords: ['cycle', 'lap'], topic: 'cycle_time' },
            { keywords: ['wip', 'aging'], topic: 'wip' },
            { keywords: ['block', 'flag'], topic: 'blocked' }
        ];

        for (const pattern of intentPatterns) {
            if (pattern.keywords.some(k => message.includes(k))) {
                topics.push(pattern.topic);
            }
        }

        return {
            detectedIntent: 'unknown',
            matchedTopics: topics,
            processedAt: new Date().toISOString()
        };
    }
}

// Singleton instance
export const rovoChatExpert = new RovoChatExpertSystem();
