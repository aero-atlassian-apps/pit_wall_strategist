import React from 'react'
import { DashboardGrid, LeftZone, CenterZone, RightZone } from '../Layout/DashboardGrid'
import { TelemetryDeck } from '../Telemetry/TelemetryDeck'
import { WarningCenter } from '../Warnings/WarningCenter'
import { LiveCircuit } from '../Circuit/LiveCircuit'
import { VelocityTrack } from '../Telemetry/VelocityTrack'
import { StrategyFeed } from '../Strategy/StrategyFeed'
import { InternalContext } from '../../../types/Context'
import SprintHealthGauge from '../../Dashboard/SprintHealthGauge'
import { t } from '../../../i18n'

interface DashboardViewProps {
    telemetryData: any
    timingMetrics: any
    trendData: any
    issues: any[]
    healthData?: any
    advancedAnalytics?: any
    context: InternalContext // STRICT CONTEXT
    locale: string
    refreshAll: () => void
    handleStrategyAction: (id: string) => void
    onOpenDiagnostics?: () => void
    onOpenRovo?: () => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    telemetryData,
    timingMetrics,
    trendData,
    issues,
    healthData,
    advancedAnalytics,
    refreshAll,
    handleStrategyAction,
    context,
    locale,
    onOpenDiagnostics,
    onOpenRovo
}) => {

    // Derive boardType for i18n (tPop) - must be 'scrum' | 'kanban' | 'business'
    // context.boardStrategy can be 'scrum', 'kanban', or 'none'
    // context.projectType can be 'software' or 'business'
    let derivedBoardType: 'scrum' | 'kanban' | 'business';
    if (context.projectType === 'business') {
        derivedBoardType = 'business';
    } else if (context.boardStrategy === 'kanban') {
        derivedBoardType = 'kanban';
    } else {
        derivedBoardType = 'scrum'; // Default for software projects with scrum or none boardStrategy
    }

    // Transform data for sub-components
    const recommendations = telemetryData?.feed?.map((f: any, index: number) => {
        const severity = (f.severity || f.type || 'INFO').toUpperCase();
        let title = f.title;
        let desc = f.msg || f.description;

        if (!title && desc) {
            if (desc.includes(':')) {
                const parts = desc.split(':');
                title = parts[0].trim();
                desc = parts.slice(1).join(':').trim();
            } else {
                switch (severity) {
                    case 'CRITICAL': title = 'Red Flag'; break;
                    case 'WARNING': title = 'Caution'; break;
                    case 'SUCCESS': title = 'Sector Clear'; break;
                    default: title = 'Radio Check';
                }
            }
        }

        return {
            id: f.key || f.id || `feed-${index}`,
            title: title,
            description: desc,
            severity: severity === 'SUCCESS' ? 'OPPORTUNITY' : severity,
            type: f.type || 'info',
            issueKey: f.key
        };
    }) || []

    const problems: Array<{ id: string; title: string; description: string; severity: 'CRITICAL' | 'WARNING' | 'INFO'; timeBlocked?: string }> = []

    if (advancedAnalytics?.preStallWarnings?.length > 0) {
        advancedAnalytics.preStallWarnings.forEach((w: any) => {
            problems.push({
                id: w.issueKey,
                title: w.issueKey,
                description: w.recommendation || `${w.percentToStall}% to stall threshold`,
                severity: w.riskLevel === 'CRITICAL' ? 'CRITICAL' : w.riskLevel === 'WARNING' ? 'WARNING' : 'INFO',
                timeBlocked: `${w.hoursInStatus}h / ${w.threshold}h`
            })
        })
    }

    if (problems.length === 0 && telemetryData?.stalledTickets?.length > 0) {
        telemetryData.stalledTickets.forEach((t: any) => {
            const hours = t.hoursSinceUpdate || 0;
            problems.push({
                id: t.key,
                title: `Stalled: ${t.key}`,
                description: `Ticket has been dormant for ${hours}h.`,
                severity: 'WARNING',
                timeBlocked: `${hours}h`
            })
        })
    }

    if (context.metricValidity.scopeCreep !== 'hidden') {
        if (advancedAnalytics?.scopeCreep?.detected) {
            problems.push({
                id: 'scope-creep',
                title: t('scopeCreepTitle', locale),
                description: advancedAnalytics.scopeCreep.message,
                severity: 'INFO'
            })
        } else if (telemetryData?.scopeCreep) {
            problems.push({
                id: 'scope-creep',
                title: t('scopeCreepTitle', locale),
                description: t('scopeCreepPoints', locale).replace('{points}', String(telemetryData.scopeCreep)),
                severity: 'INFO'
            })
        }
    }

    const bottleneck = advancedAnalytics?.bottleneck || null
    const health = advancedAnalytics?.sprintHealth || healthData?.sprintHealth || telemetryData?.sprintHealth || null

    return (
        <DashboardGrid>
            <LeftZone>
                <TelemetryDeck
                    telemetryData={telemetryData}
                    timingMetrics={timingMetrics}
                    boardType={derivedBoardType}
                    locale={locale}
                    onOpenRovo={onOpenRovo}
                />

                {context.metricValidity.sprintHealth !== 'hidden' && (
                    <SprintHealthGauge sprintHealth={health} boardType={derivedBoardType} />
                )}

                {context.metricValidity.velocity !== 'hidden' && (
                    <VelocityTrack trendData={trendData} />
                )}
            </LeftZone>

            <CenterZone>
                <LiveCircuit
                    issues={issues}
                    boardType={derivedBoardType}
                    locale={locale}
                />
                <WarningCenter problems={problems} bottleneck={bottleneck} />
            </CenterZone>

            <RightZone>
                <StrategyFeed
                    recommendations={recommendations}
                    onAction={handleStrategyAction}
                    onBoxBox={refreshAll}
                />
            </RightZone>
        </DashboardGrid>
    )
}
