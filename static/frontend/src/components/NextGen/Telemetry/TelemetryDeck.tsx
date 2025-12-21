import React, { useState } from 'react'
import styled from 'styled-components'
import { PanelContainer } from '../Layout/PanelContainer'
import { t, tPop } from '../../../i18n'
import { useBoardContext } from '../../../context/BoardContext'

interface TelemetryDeckProps {
  telemetryData: any
  timingMetrics?: any
  boardType?: string
  locale: string
  onOpenRovo?: () => void
}

// Layout Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 8px;
`

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const HeaderLabel = styled.div`
  font-family: var(--font-stack-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  color: var(--text-tertiary);
`

const TrendBadge = styled.div<{ $positive: boolean }>`
  background: ${({ $positive }) => $positive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${({ $positive }) => $positive ? 'var(--color-success)' : 'var(--color-danger)'};
  font-family: var(--font-stack-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`

// Big Hero Metric
const HeroMetricCard = styled.div`
  background: var(--bg-surface-hover);
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-subtle);

  /* Red accent bar on left */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 4px;
    background: var(--color-red-500);
    border-radius: 0 4px 4px 0;
  }
`

const HeroValue = styled.div`
  font-family: var(--font-stack-mono);
  font-size: 42px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 8px;
  
  span.unit {
    font-size: 20px;
    color: var(--text-tertiary);
    margin-left: 4px;
  }
`

const HeroLabel = styled.div`
  font-family: var(--font-stack-mono);
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-secondary);
`

// Secondary Metrics Grid
const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`

const SmallMetricCard = styled.div`
  background: var(--bg-surface-hover);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const SmallValue = styled.div`
  font-family: var(--font-stack-mono);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
`

const SmallLabel = styled.div`
  font-family: var(--font-stack-mono);
  font-size: 9px;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
`

// Gauge Section
const GaugeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const GaugeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`

const GaugeLabel = styled.div`
  font-family: var(--font-stack-mono);
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-tertiary);
`

const GaugeStatus = styled.div<{ $status: 'optimal' | 'warning' | 'critical' }>`
  font-size: 10px;
  font-weight: 700;
  color: ${({ $status }) => {
    if ($status === 'optimal') return 'var(--color-success)';
    if ($status === 'warning') return 'var(--color-warning)';
    return 'var(--color-danger)';
  }};
`

// WIP Segmented Bar
const SegmentedBar = styled.div`
  display: flex;
  gap: 4px;
  height: 6px;
  width: 100%;
`

const Segment = styled.div<{ $active: boolean }>`
  flex: 1;
  background: ${({ $active }) => $active ? 'var(--color-success)' : 'var(--bg-surface-hover)'};
  border-radius: 2px;
  transition: all 0.3s ease;
`

// Engine Heat Gradient Bar
const HeatBarContainer = styled.div`
  height: 6px;
  width: 100%;
  background: var(--bg-surface-hover);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`

const HeatFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: linear-gradient(90deg, #4ADE80 0%, #FACC15 50%, #F42A40 100%);
  border-radius: 4px;
  transition: width 1s ease-out;
`

const CapacityLabel = styled.div`
  text-align: right;
  font-family: var(--font-stack-mono);
  font-size: 9px;
  color: var(--color-red-500);
  margin-top: 4px;
`

export const TelemetryDeck: React.FC<TelemetryDeckProps> = ({
  telemetryData,
  timingMetrics,
  boardType = 'scrum',
  locale,
  onOpenRovo
}) => {

  // Get context for metric validity checks
  const { context } = useBoardContext();
  const metricValidity = context?.metricValidity || {};

  // Values - Use correct backend field names
  // Backend returns leadTime.avgLapTime (hours), not leadTime.avg
  const leadTimeAvg = timingMetrics?.leadTime?.avgLapTime ?? null;
  const leadTime = leadTimeAvg !== null ? Math.round(leadTimeAvg) : '--';

  // Flow efficiency: Backend doesn't provide this directly, but we can estimate from timing
  // For now, show '--' if not available; backend should be extended to provide this
  const flowEfficiency = timingMetrics?.flowEfficiency !== undefined
    ? Math.round(timingMetrics.flowEfficiency)
    : (telemetryData?.flowEfficiency !== undefined ? Math.round(telemetryData.flowEfficiency) : '--');

  // Select metric based on board type
  const progressValue = boardType === 'scrum'
    ? (telemetryData?.velocity ?? '--')
    : (telemetryData?.throughput ?? '--');

  // WIP Calculation - NO HARDCODED DEFAULTS
  const wipLimit = telemetryData?.wipLimit ?? null;
  const currentWip = telemetryData?.wip ?? telemetryData?.wipCurrent ?? null;
  const wipAvailable = wipLimit !== null && currentWip !== null && wipLimit > 0;
  const wipStatus = !wipAvailable ? '--' : (currentWip! <= wipLimit! ? 'Optimal' : 'Overload');
  // Create 5 segments visual
  const segments = [1, 2, 3, 4, 5];
  const activeSegments = wipAvailable ? Math.min(5, Math.ceil((currentWip! / wipLimit!) * 5)) : 0;

  // Engine Load (Capacity) - Use backend wipLoad, NO DEFAULTS
  const capacityPercent = telemetryData?.capacityPercent ?? telemetryData?.wipLoad ?? null;
  const loadAvailable = capacityPercent !== null;
  const loadStatus = !loadAvailable ? '--' : (capacityPercent! > 90 ? 'Overheating' : 'Optimal');

  // Trend - Use actual backend delta, null if not available
  const velocityChange = telemetryData?.velocityDelta ?? null;
  const trendAvailable = velocityChange !== null;
  const isPositive = trendAvailable ? velocityChange! >= 0 : true;

  // Check if Cycle Time is a proxy (Lead Time)
  const isCycleTimeProxy = telemetryData?.cycleTimeExplanation?.includes('leadTimeProxy');

  // Dynamic Labels
  const progressLabel = tPop('progressMetric', boardType, locale).toUpperCase(); // VELOCITY or THROUGHPUT or RATE
  const timeLabel = tPop('timeMetric', boardType, locale).toUpperCase(); // LEAD TIME or CYCLE TIME
  const wipLimitLabel = tPop('wipLimitLabel', boardType, locale).toUpperCase().split('(')[0]; // "WIP LIMITS"
  const capacityLabel = tPop('load', boardType, locale).toUpperCase();

  return (
    <PanelContainer
      title={t('appTitle', locale).toUpperCase()}
      noPadding // We handle padding in Container
      collapsible
    >
      <div style={{ padding: '16px 24px' }}>
        <Container>

          {/* Header with Trend */}
          <HeaderRow>
            <HeaderLabel>{t('telemetry', locale).toUpperCase()}</HeaderLabel>
            {trendAvailable && (
              <TrendBadge $positive={isPositive}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>trending_up</span>
                {isPositive ? '+' : ''}{velocityChange}%
              </TrendBadge>
            )}
          </HeaderRow>

          {/* Hero Metric */}
          <HeroMetricCard title={telemetryData?.cycleTimeExplanation || t('cycleTimeHelp', locale)}>
            {isCycleTimeProxy && (
              <div style={{ position: 'absolute', top: 8, right: 8, color: 'var(--color-warning)', display: 'flex', alignItems: 'center' }} title="Lead Time fallback (missing changelog data)">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
              </div>
            )}
            <HeroValue>{leadTime}<span className="unit">h</span></HeroValue>
            <HeroLabel>{timeLabel} {isCycleTimeProxy ? '(LEAD TIME)' : '(AVG)'}</HeroLabel>
          </HeroMetricCard>

          {/* Secondary Metrics - Context-aware display */}
          <MetricsGrid>
            {/* Primary Progress Metric - Velocity for Scrum, Throughput for Kanban/Business */}
            <SmallMetricCard title={boardType === 'scrum' ? (telemetryData?.velocityExplanation || t('velocityHelp', locale)) : (telemetryData?.throughputExplanation || t('throughputHelp', locale))}>
              <SmallValue>{progressValue}</SmallValue>
              <SmallLabel>{progressLabel}</SmallLabel>
            </SmallMetricCard>

            {/* Flow Efficiency - Only show for Kanban/Business where it's applicable */}
            {/* For Scrum, show Completion instead */}
            {boardType === 'scrum' ? (
              <SmallMetricCard>
                <SmallValue>{telemetryData?.completion ?? 0}%</SmallValue>
                <SmallLabel>{tPop('completion', boardType, locale).toUpperCase()}</SmallLabel>
              </SmallMetricCard>
            ) : (
              // For Kanban/Business, show Flow Efficiency (percentage of active WIP)
              <SmallMetricCard title={telemetryData?.flowEfficiencyExplanation}>
                <SmallValue>
                  {typeof flowEfficiency === 'number' ? `${flowEfficiency}%` : '--'}
                </SmallValue>
                <SmallLabel>{t('flowRate', locale).toUpperCase()}</SmallLabel>
              </SmallMetricCard>
            )}
          </MetricsGrid>

          {/* Gauges */}

          {/* WIP Limits Segmented - Only show if wip metric is valid */}
          {metricValidity.wip !== 'hidden' && (
            <GaugeSection>
              <GaugeHeader>
                <GaugeLabel>{wipLimitLabel}</GaugeLabel>
                <GaugeStatus $status={wipStatus === 'Optimal' ? 'optimal' : wipStatus === '--' ? 'warning' : 'critical'}>{wipStatus}</GaugeStatus>
              </GaugeHeader>
              <SegmentedBar>
                {segments.map((s, i) => (
                  <Segment key={i} $active={i < activeSegments} />
                ))}
              </SegmentedBar>
            </GaugeSection>
          )}

          {/* Engine Load Gradient */}
          <GaugeSection>
            <GaugeHeader>
              <GaugeLabel>{capacityLabel}</GaugeLabel>
              <GaugeStatus $status={loadStatus === 'Optimal' ? 'optimal' : loadStatus === '--' ? 'warning' : 'critical'}>{loadStatus}</GaugeStatus>
            </GaugeHeader>
            <HeatBarContainer>
              <HeatFill $percent={capacityPercent ?? 0} />
            </HeatBarContainer>
            <CapacityLabel>
              {loadAvailable
                ? t('capacityPercent', locale).replace('{percent}', String(capacityPercent))
                : t('metricUnavailable', locale) || '--'
              }
            </CapacityLabel>
          </GaugeSection>

        </Container>
      </div>
    </PanelContainer>
  )
}
