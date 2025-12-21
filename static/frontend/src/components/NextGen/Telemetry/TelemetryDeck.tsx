import React from 'react'
import styled from 'styled-components'
import { PanelContainer } from '../Layout/PanelContainer'
import { MetricCard } from '../Common/MetricCard'

interface TelemetryDeckProps {
    telemetryData: any
    timingMetrics?: any
}

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`

const PrimaryMetricWrapper = styled.div`
  height: 100px; /* Force height for visual weight */
`

const SecondaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  height: 80px;
`

export const TelemetryDeck: React.FC<TelemetryDeckProps> = ({ telemetryData, timingMetrics }) => {
    const leadTime = timingMetrics?.leadTime?.avg ? Math.round(timingMetrics.leadTime.avg) : '--'
    const cycleTime = timingMetrics?.cycleTime?.avg ? Math.round(timingMetrics.cycleTime.avg) : '--'
    const flowEfficiency = timingMetrics?.flowEfficiency ? Math.round(timingMetrics.flowEfficiency) : '--'

    // Throughput (delivery rate) could come from velocity or recent completed
    const throughput = telemetryData?.velocity?.current || '--'

    return (
        <PanelContainer
            title="Telemetry"
            action={
                <span style={{ fontSize: 10, color: 'var(--status-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>trending_up</span>
                    +12%
                </span>
            }
        >
            <GridContainer>
                <PrimaryMetricWrapper>
                    <MetricCard
                        label="Lead Time (Avg)"
                        value={leadTime}
                        unit="h"
                        variant="primary"
                    />
                </PrimaryMetricWrapper>

                <SecondaryGrid>
                    <MetricCard
                        label="Delivery Rate"
                        value={throughput}
                    />
                    <MetricCard
                        label="Flow Eff."
                        value={`${flowEfficiency}%`}
                    />
                </SecondaryGrid>
            </GridContainer>

            {/* WIP Limits Visualizer could go here later */}
        </PanelContainer>
    )
}
