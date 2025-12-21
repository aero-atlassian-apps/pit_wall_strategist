import React from 'react'
import { DashboardGrid, LeftZone, CenterZone, RightZone } from '../Layout/DashboardGrid'
import { TelemetryDeck } from '../Telemetry/TelemetryDeck'
import { WarningCenter } from '../Warnings/WarningCenter'
import { LiveCircuit } from '../Circuit/LiveCircuit'
import { VelocityTrack } from '../Telemetry/VelocityTrack'
import { StrategyFeed } from '../Strategy/StrategyFeed'
import { t } from '../../../i18n'

interface DashboardViewProps {
    telemetryData: any
    timingMetrics: any
    trendData: any
    issues: any[]
    boardType: string
    locale: string
    refreshAll: () => void
    handleStrategyAction: (id: string) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    telemetryData,
    timingMetrics,
    trendData,
    issues,
    refreshAll,
    handleStrategyAction
}) => {

    // Transform data for sub-components
    const recommendations = telemetryData?.feed?.map((f: any) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        severity: f.severity, // Ensure matches 'CRITICAL' | 'WARNING' | 'INFO'
        type: f.type
    })) || []

    // Extract warnings from analytics or mock
    const problems = telemetryData?.stalledTickets?.map((t: any) => ({
        id: t.key,
        title: `Stalled: ${t.key}`,
        description: `Ticket has been dormant for > ${t.stalledHours || 48}h.`,
        severity: 'WARNING'
    })) || []

    if (telemetryData?.scopeCreep) {
        problems.push({
            id: 'scope-creep',
            title: 'Scope Creep',
            description: `Sprint scope increased by ${telemetryData.scopeCreep} points.`,
            severity: 'INFO'
        })
    }

    return (
        <DashboardGrid>
            <LeftZone>
                <TelemetryDeck
                    telemetryData={telemetryData}
                    timingMetrics={timingMetrics}
                />
                <WarningCenter problems={problems} />
            </LeftZone>

            <CenterZone>
                <LiveCircuit issues={issues} />
                <VelocityTrack trendData={trendData} />
            </CenterZone>

            <RightZone>
                <StrategyFeed
                    recommendations={recommendations}
                    onAction={handleStrategyAction}
                />
                {/* Box Box Button could go here or inside StrategyFeed */}
                <button
                    onClick={refreshAll}
                    style={{
                        marginTop: 'auto',
                        background: 'linear-gradient(90deg, var(--brand-primary), var(--color-red-600))',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: 12,
                        fontFamily: 'var(--font-stack-mono)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-glow)'
                    }}
                >
                    Box Box (Refresh)
                </button>
            </RightZone>
        </DashboardGrid>
    )
}
