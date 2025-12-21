/**
 * Rovo Chat & AI Resolvers
 * 
 * AI-powered chat and analysis resolvers:
 * - chatWithRovo - Expert system chat interface
 * - getRovoAnalysis - Issue analysis for Rovo agent
 * - getLocale - User locale detection
 * - getAssignableUsers - Get assignable users for an issue
 */

import api, { route } from '@forge/api';
import { JiraBoardRepository } from '../../infrastructure/jira/JiraBoardRepository';
import { TelemetryService } from '../../infrastructure/services/TelemetryService';
import { StatusMapService } from '../../infrastructure/services/StatusMapService';
import { getEffectiveConfig } from '../config/ConfigResolvers';
import { getProjectContext } from '../contextEngine';
import { mockTelemetry } from '../mocks';
import { calculateWipTrend } from '../trendMetrics';

const PLATFORM = process.env.PLATFORM || 'atlassian';
const boardRepository = new JiraBoardRepository();
const statusMapService = new StatusMapService();

/**
 * Registers all Rovo/AI-related resolvers on the provided resolver instance
 */
export function registerRovoResolvers(resolver: any): void {

    resolver.define('getRovoAnalysis', async ({ payload }: any) => {
        const { issueKey, summary, reason, statusCategory } = payload;
        return {
            analysis: `Driver is stuck in Sector 2 (${statusCategory || 'In Progress'}). Heavy drag detected on "${summary}". \nRoot cause analysis indicates: ${reason || 'Blocking dependency or unclear requirements'}.\nCurrent lap time is degrading. Immediate strategy call required.`,
            options: [
                { id: 'undercut', name: 'The Undercut', description: 'Split ticket into smaller subtasks for faster sector times', icon: 'scissors', action: 'split-ticket' },
                { id: 'team-orders', name: 'Team Orders', description: 'Reassign to senior driver with more track experience', icon: 'users', action: 'reassign-ticket' },
                { id: 'retire', name: 'Retire Car', description: 'Move to backlog - save engine for next race', icon: 'flag', action: 'defer-ticket' }
            ]
        };
    });

    resolver.define('chatWithRovo', async ({ payload, context }: any) => {
        try {
            const userConfig = await getEffectiveConfig(context, payload);
            const { message } = payload;

            // 1. Fetch Context
            const projectKey = context?.extension?.project?.key;
            let data: any = {};
            if (projectKey && PLATFORM !== 'local') {
                const boardData = await boardRepository.getBoardData(projectKey, userConfig, context);
                const statusMap = await statusMapService.getProjectStatusMap(projectKey);
                const ctx = await getProjectContext(projectKey);

                const telemetry = await TelemetryService.calculateTelemetry(boardData, userConfig, ctx, statusMap);
                const trends = await calculateWipTrend(projectKey);
                const sprintName = boardData.sprint?.name || boardData.boardName;
                data = { telemetry, trends, sprintName, issues: boardData.issues, boardType: boardData.boardType };
            } else {
                data = { telemetry: mockTelemetry(), trends: { direction: 'down', change: 12 }, sprintName: 'Local Sprint', issues: [], boardType: 'scrum' };
            }

            const lowerMsg = (message || '').toLowerCase();
            let response = '';
            const isKanban = data.boardType === 'kanban';

            // Get full project context with metricValidity
            let metricValidity: any = {};
            if (projectKey && PLATFORM !== 'local') {
                try {
                    const ctx = await getProjectContext(projectKey);
                    metricValidity = ctx.metricValidity || {};
                } catch { /* Use empty validity if context fetch fails */ }
            }

            // === ENHANCED: Per-Assignee Workload Analysis ===
            const getAssigneeStats = (issues: any[]) => {
                const stats: Record<string, { total: number; stalled: number; inProgress: number; issues: any[] }> = {};
                for (const issue of issues || []) {
                    const assignee = issue.fields?.assignee?.displayName || issue.assignee || 'Unassigned';
                    if (!stats[assignee]) stats[assignee] = { total: 0, stalled: 0, inProgress: 0, issues: [] };
                    stats[assignee].total++;
                    stats[assignee].issues.push(issue);
                    if (issue.isStalled) stats[assignee].stalled++;
                    if (issue.statusCategory === 'indeterminate') stats[assignee].inProgress++;
                }
                return stats;
            };

            const assigneeStats = getAssigneeStats(data.issues);
            const overloadedDrivers = Object.entries(assigneeStats)
                .filter(([_, s]) => s.total > (userConfig.assigneeCapacity || 3) || s.stalled > 0)
                .sort((a, b) => (b[1].stalled + b[1].total) - (a[1].stalled + a[1].total));

            const findAvailableDriver = () => {
                const available = Object.entries(assigneeStats)
                    .filter(([name, s]) => name !== 'Unassigned' && s.total < (userConfig.assigneeCapacity || 3) && s.stalled === 0)
                    .sort((a, b) => a[1].total - b[1].total);
                return available.length > 0 ? available[0][0] : null;
            };

            // 2. Expert System Logic (Rule-Based AI)
            if (lowerMsg.includes('team') || lowerMsg.includes('driver') || lowerMsg.includes('who') || lowerMsg.includes('assignee')) {
                const driverReports = Object.entries(assigneeStats)
                    .filter(([name]) => name !== 'Unassigned')
                    .sort((a, b) => b[1].stalled - a[1].stalled)
                    .slice(0, 5)
                    .map(([name, s]) => {
                        const status = s.stalled > 0 ? '🔴' : s.total > (userConfig.assigneeCapacity || 3) ? '🟡' : '🟢';
                        const stalledList = s.stalled > 0 ? ` (${s.issues.filter((i: any) => i.isStalled).map((i: any) => i.key).join(', ')})` : '';
                        return `${status} **${name}**: ${s.total} tickets, ${s.inProgress} racing, ${s.stalled} stalled${stalledList}`;
                    });

                const availableDriver = findAvailableDriver();
                const recommendation = overloadedDrivers.length > 0
                    ? `\n\n🎯 **Strategy Recommendation**: ${overloadedDrivers[0][0]} has ${overloadedDrivers[0][1].stalled} stalled ticket(s).${availableDriver ? ` Consider **Team Orders** to ${availableDriver}.` : ' No available drivers—consider deferring lower-priority items.'}`
                    : '\n\n✅ All drivers operating within capacity.';

                response = `👥 **Driver Telemetry (Team Workload)**\n\n${driverReports.join('\n')}${recommendation}`;

            } else if (lowerMsg.includes('stall') || lowerMsg.includes('stuck') || lowerMsg.includes('problem')) {
                const stalledIssues = (data.issues || []).filter((i: any) => i.isStalled);
                if (stalledIssues.length === 0) {
                    response = `✅ **All Clear**\n\nNo stalled tickets detected. Track is clear, push to the limit!`;
                } else {
                    const details = stalledIssues.slice(0, 5).map((issue: any) => {
                        const assignee = issue.fields?.assignee?.displayName || issue.assignee || 'Unassigned';
                        const hoursSinceUpdate = Math.round((Date.now() - new Date(issue.fields?.updated || Date.now()).getTime()) / (1000 * 60 * 60));
                        return `🚨 **${issue.key}** - ${issue.summary?.substring(0, 40) || 'No summary'}...\n   └ Driver: ${assignee} | Stalled: ${hoursSinceUpdate}h | Status: ${issue.status || 'Unknown'}`;
                    });

                    const availableDriver = findAvailableDriver();
                    const topStalled = stalledIssues[0];
                    const actionRec = availableDriver
                        ? `**Recommended Action**: Execute **Team Orders** - Reassign ${topStalled?.key} to ${availableDriver}`
                        : `**Recommended Action**: Execute **The Undercut** - Split ${topStalled?.key} into smaller tasks`;

                    response = `🚩 **Stalled Tickets Report**\n\n${details.join('\n\n')}\n\n---\n${actionRec}`;
                }

            } else if (lowerMsg.includes('recommend') || lowerMsg.includes('strategy') || lowerMsg.includes('what should') || lowerMsg.includes('help')) {
                const stalledCount = (data.issues || []).filter((i: any) => i.isStalled).length;
                const wipLoad = data.telemetry?.wipLoad || 0;
                const recommendations: string[] = [];

                if (stalledCount > 0) {
                    const topStalled = (data.issues || []).find((i: any) => i.isStalled);
                    const availableDriver = findAvailableDriver();
                    if (availableDriver) {
                        recommendations.push(`🔄 **Team Orders**: Reassign ${topStalled?.key} to ${availableDriver} (has capacity)`);
                    }
                    recommendations.push(`✂️ **The Undercut**: Split ${topStalled?.key} into smaller, faster subtasks`);
                }

                if (wipLoad > 100) {
                    recommendations.push(`⛽ **Fuel Adjustment**: WIP at ${wipLoad}%. Defer lowest-priority items to next sprint.`);
                }

                if (overloadedDrivers.length > 0) {
                    const [name, stats] = overloadedDrivers[0];
                    recommendations.push(`👥 **Driver Rotation**: ${name} has ${stats.total} tickets. Consider load balancing.`);
                }

                if (recommendations.length === 0) {
                    recommendations.push(`✅ **Green Flag**: All systems nominal. Maintain current pace and push for fastest lap!`);
                }

                response = `🏁 **Strategic Recommendations**\n\nBased on current ${data.sprintName} telemetry:\n\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}`;

            } else if (lowerMsg.includes('pace') || lowerMsg.includes('velocity')) {
                // Check if velocity is hidden for this context
                if (metricValidity.velocity === 'hidden') {
                    // For Kanban/Business: Redirect to throughput instead
                    const throughput = data.trends?.velocity?.total || data.telemetry?.throughput || 0;
                    response = `📊 **Flow Rate Report**\n\nVelocity is not applicable for ${isKanban ? 'flow-based boards' : 'this project type'}.\nInstead, let\'s look at **Throughput**: **${throughput}** items completed this period.\nCurrent Fuel Load (WIP): **${data.telemetry.wipLoad}%**\n\n*For flow teams, focus on cycle time and throughput for performance tracking.*`;
                } else {
                    const trend = data.trends?.change || 0;
                    const dir = data.trends?.direction || 'flat';
                    const driverInsight = overloadedDrivers.length > 0
                        ? `\n\n⚠️ **Driver Alert**: ${overloadedDrivers[0][0]} may be affecting pace (${overloadedDrivers[0][1].stalled} stalled).`
                        : '';
                    response = `🏎️ **Telemetry Report: Pace Analysis**\n\nCurrent Fuel Load (WIP) is **${data.telemetry.wipLoad}%**.\nVelocity is trending **${dir}** (${trend}% vs last sprint).${driverInsight}\n\n*Engineer's Call*: ${data.telemetry.wipLoad > 100 ? 'We are heavy on fuel. Box for a strategy adjustment.' : 'Pace is good. Push for the fastest lap.'}`;
                }
            } else if (lowerMsg.includes('cycle') || lowerMsg.includes('lap time')) {
                const cycleTime = data.timing?.cycleTime?.average || data.timing?.leadTime?.avgLapTime || '-';
                response = `⏱️ **Lap Time Analysis (Cycle Time)**\n\nAverage Lap Time: **${cycleTime}h**\nThis measures how long tickets spend in active work.\n\n*${isKanban ? 'Flow Optimization' : 'Sprint'}*: ${cycleTime > 48 ? 'Lap times are too long. Consider breaking down large items.' : 'Lap times are competitive. Maintain current pace.'}`;
            } else if (lowerMsg.includes('throughput') || lowerMsg.includes('flow rate')) {
                const throughput = data.trends?.velocity?.total || 0;
                response = `📊 **Throughput Report (Flow Rate)**\n\nCompleted this period: **${throughput}** items.\nAverage per day: **${data.trends?.velocity?.averagePerDay || '-'}**\n\n*Strategy*: ${throughput < 5 ? 'Flow is restricted. Check for blockers in the middle sector.' : 'Good flow. Keep the DRS zone open.'}`;
            } else if (lowerMsg.includes('wip') || lowerMsg.includes('aging') || lowerMsg.includes('tire deg')) {
                const stalledIssues = data.issues?.filter((i: any) => i.isStalled) || [];
                const aging = stalledIssues.length;
                response = `🛞 **Tire Degradation Report (WIP Aging)**\n\n**${aging}** items showing signs of degradation (stalled >24h).\n${stalledIssues.slice(0, 3).map((i: any) => `• ${i.key}: ${i.summary?.substring(0, 30)}...`).join('\n')}\n\n*Strategy*: ${aging > 2 ? '⚠️ HIGH WEAR. Recommend immediate pit stop (Split or Reassign).' : '✅ Tires holding. Continue current stint.'}`;
            } else if (lowerMsg.includes('traffic') || lowerMsg.includes('bottle') || lowerMsg.includes('block')) {
                const issues = data.issues || [];
                const stalledCount = issues.filter((i: any) => i.isStalled).length;
                response = `⚠️ **Track Traffic Report**\n\nI see **${issues.length}** cars on track (Tickets in Sprint).\n**${stalledCount}** cars appear to be stalled or high-drag.\n\n*Strategy*: Clear the middle sector. Focus on finishing active laps before starting new ones.`;
            } else if (lowerMsg.includes('health') || lowerMsg.includes('crew')) {
                const burnout = data.telemetry.teamBurnout || {};
                const hot = Object.entries(burnout).filter(([_, v]: any) => v > 80).map(([k]) => k);
                response = `🏥 **Pit Crew Status**\n\n${hot.length > 0 ? `🔥 **Critical**: ${hot.join(', ')} are overheating (>80% load).` : '✅ All systems nominal. Crew is fresh.'}\n\n*Rotation*: ${hot.length > 0 ? 'Suggest immediate pit stop for tired engineers.' : 'Maintain current shift pattern.'}`;
            } else if (lowerMsg.includes('predict') || lowerMsg.includes('finish')) {
                response = `🔮 **Race Strategy Prediction**\n\nBased on current **${data.sprintName}** telemetry:\nEstimated laps remaining: **${100 - (data.telemetry.completion || 0)}%**.\n\nTo finish P1, we need to maintain current velocity.`;
            } else if (lowerMsg.includes('red flag') || lowerMsg.includes('blocked')) {
                const blocked = data.issues?.filter((i: any) => i.labels?.includes('blocked') || i.isStalled) || [];
                response = `🚩 **Red Flag Report**\n\n**${blocked.length}** items currently flagged or blocked.\n${blocked.slice(0, 3).map((i: any) => `• ${i.key}: ${i.status}`).join('\n')}\n\n*Action*: Use RED FLAG action to formally flag blockers.`;
            } else {
                // Default: Enhanced help with driver summary
                const stalledCount = (data.issues || []).filter((i: any) => i.isStalled).length;
                const statusEmoji = stalledCount > 0 ? '🟡' : '🟢';
                response = `🎙️ **Radio Check** ${statusEmoji}\n\nReading telemetry for **${data.sprintName}** (${isKanban ? 'KANBAN' : 'SCRUM'} mode).\n\n📊 **Quick Stats**: ${data.issues?.length || 0} tickets | ${stalledCount} stalled | WIP: ${data.telemetry?.wipLoad || 0}%\n\nAsk me about:\n• **"team"** - Driver workload analysis\n• **"stalled"** - Deep dive on stuck tickets\n• **"recommend"** - Strategic action recommendations\n• **"pace"** - Velocity & trends\n• **"crew"** - Team burnout analysis`;
            }

            return { success: true, answer: response };
        } catch (error: any) {
            return { success: false, error: `Radio Interference: ${error.message}` };
        }
    });

    resolver.define('getAssignableUsers', async ({ payload, context }: any) => {
        try {
            if (PLATFORM === 'local') {
                return { success: true, users: [{ accountId: 'mock-sarah', displayName: 'Sarah' }, { accountId: 'mock-mike', displayName: 'Mike' }, { accountId: 'mock-jess', displayName: 'Jess' }] };
            }
            const issueKey = payload?.issueKey || '';
            const response = await api.asApp().requestJira(route`/rest/api/3/user/assignable/search?issueKey=${issueKey}&maxResults=50`, { headers: { Accept: 'application/json' } });
            const users = await response.json();
            const mapped = (users || []).map((u: any) => ({ accountId: u.accountId, displayName: u.displayName }));
            return { success: true, users: mapped };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    resolver.define('getLocale', async ({ payload, context }: any) => {
        try {
            const userConfig = await getEffectiveConfig(context, payload);
            const supported = ['en', 'fr', 'es', 'pt'];
            let preferred: string | null = null;
            try {
                const resp = await api.asUser().requestJira(route`/rest/api/3/myself`, { headers: { Accept: 'application/json' } });
                if (resp.ok) {
                    const me = await resp.json();
                    const loc = (me?.locale || '').toString().toLowerCase();
                    const code = loc.slice(0, 2);
                    preferred = supported.includes(code) ? code : null;
                }
            } catch { }
            const current = userConfig?.locale && supported.includes(userConfig.locale) ? userConfig.locale : (preferred || 'en');
            return { success: true, locale: current, supported };
        } catch (error: any) { return { success: false, error: error.message }; }
    });
}
