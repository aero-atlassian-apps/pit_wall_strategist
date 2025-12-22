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

  // Helper: Convert hours to days for more readable display
  const hoursToDisplayDays = (hours: number | null): string => {
    if (hours === null || hours === undefined) return '--';
    const days = hours / 24;
    if (days < 1) return `${Math.round(hours)}h`; // Less than 1 day: show hours
    return `${Math.round(days * 10) / 10}`; // Days with 1 decimal
  };

  // Values - Use correct backend field names
  // Backend returns leadTime.avgLapTime (hours), convert to days
  const leadTimeHours = timingMetrics?.leadTime?.avgLapTime ?? null;
  const leadTimeDays = hoursToDisplayDays(leadTimeHours);
  const leadTimeUnit = leadTimeHours !== null && leadTimeHours < 24 ? 'h' : 'd';

  // Flow efficiency
  const rawFlowEfficiency = timingMetrics?.flowEfficiency ?? telemetryData?.flowEfficiency;
  const flowEfficiency = rawFlowEfficiency !== undefined && rawFlowEfficiency !== null
    ? Math.round(rawFlowEfficiency)
    : null;

  // Select metric based on board type - BUT CHECKS VALIDITY FIRST
  // If velocity is hidden, we shouldn't display it even if data exists (it might be stale)
  const isVelocityValid = metricValidity.velocity === 'valid';
  const isThroughputValid = metricValidity.throughput === 'valid';

  // Decide what to show for "Progress Metric"
  // Default to Velocity (Scrum) or Throughput (Kanban) based on context
  let progressValue = '--';
  let progressLabelKey = 'progressMetric';

  if (boardType === 'scrum' && isVelocityValid) {
    progressValue = telemetryData?.velocity ?? '--';
    progressLabelKey = 'velocityHelp'; // Use tooltip key as label proxy or just use standard
  } else if (isThroughputValid) {
    progressValue = telemetryData?.throughput ?? '--';
    progressLabelKey = 'throughputHelp';
  } else {
    progressValue = 'N/A';
  }

  // WIP Calculation
  const wisValid = metricValidity.wip === 'valid'; // Check validity
  const wipLimit = telemetryData?.wipLimit ?? null;
  const currentWip = telemetryData?.wip ?? telemetryData?.wipCurrent ?? null;
  const wipAvailable = wisValid && wipLimit !== null && currentWip !== null && wipLimit > 0;
  const wipStatus = !isValid ? 'Disabled' : (!wipAvailable ? '--' : (currentWip! <= wipLimit! ? 'Optimal' : 'Overload'));

  const segments = [1, 2, 3, 4, 5];
  const activeSegments = wipAvailable ? Math.min(5, Math.ceil((currentWip! / wipLimit!) * 5)) : 0;

  // Engine Load (Capacity)
  const capacityPercent = telemetryData?.capacityPercent ?? telemetryData?.wipLoad ?? null;
  const loadAvailable = capacityPercent !== null;
  const loadStatus = !loadAvailable ? '--' : (capacityPercent! > 90 ? 'Overheating' : 'Optimal');

  // Trend
  const velocityChange = telemetryData?.velocityDelta ?? null;
  const trendAvailable = velocityChange !== null && isVelocityValid; // Trend only valid if velocity is
  const isPositive = trendAvailable ? velocityChange! >= 0 : true;

  // Check if Cycle Time is a proxy (Lead Time)
  const isCycleTimeProxy = telemetryData?.cycleTimeExplanation?.includes('leadTimeProxy');

  // Dynamic Labels
  const progressLabel = tPop('progressMetric', boardType, locale).toUpperCase();
  const timeLabel = tPop('timeMetric', boardType, locale).toUpperCase();
  const wipLimitLabel = tPop('wipLimitLabel', boardType, locale).toUpperCase().split('(')[0];
  const capacityLabel = tPop('load', boardType, locale).toUpperCase();

  return (
    <PanelContainer
      title={t('appTitle', locale).toUpperCase()}
      noPadding
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

          {/* Hero Metric - Lead Time / Cycle Time */}
          {/* Always valid per "No Assumptions" rule (Context Engine Rule 4) */}
          <HeroMetricCard title={telemetryData?.cycleTimeExplanation || t('cycleTimeHelp', locale)}>
            {isCycleTimeProxy && (
              <div style={{ position: 'absolute', top: 8, right: 8, color: 'var(--color-warning)', display: 'flex', alignItems: 'center' }} title="Lead Time fallback (missing changelog data)">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
              </div>
            )}
            <HeroValue>{leadTimeDays}<span className="unit">{leadTimeUnit}</span></HeroValue>
            <HeroLabel>{timeLabel} {isCycleTimeProxy ? '(LEAD TIME)' : '(AVG)'}</HeroLabel>
          </HeroMetricCard>

          {/* Secondary Metrics - Constrained by Validity */}
          <MetricsGrid>
            {/* Primary Progress Metric */}
            <SmallMetricCard title={boardType === 'scrum' ? (telemetryData?.velocityExplanation || t('velocityHelp', locale)) : (telemetryData?.throughputExplanation || t('throughputHelp', locale))}>
              <SmallValue style={{ color: progressValue === 'N/A' ? 'var(--text-disabled)' : 'var(--text-primary)' }}>
                {progressValue}
              </SmallValue>
              <SmallLabel>{progressLabel}</SmallLabel>
            </SmallMetricCard>

            {/* Flow Efficiency or Completion */}
            {boardType === 'scrum' ? (
              // For Scrum, show Completion. If sprintHealth is hidden (e.g. inactive sprint), this might stay 0 or be hidden.
              // We check sprintHealth validity for completion as it's sprint-bound.
              <SmallMetricCard style={{ opacity: metricValidity.sprintHealth === 'valid' ? 1 : 0.5 }}>
                <SmallValue>{metricValidity.sprintHealth === 'valid' ? (telemetryData?.completion ?? 0) : '--'}%</SmallValue>
                <SmallLabel>{tPop('completion', boardType, locale).toUpperCase()}</SmallLabel>
              </SmallMetricCard>
            ) : (
              // For Kanban/Business, show Flow Efficiency
              <SmallMetricCard title={telemetryData?.flowEfficiencyExplanation || 'Active work as percentage of WIP'}>
                <SmallValue>
                  {flowEfficiency !== null ? `${flowEfficiency}%` : '--'}
                </SmallValue>
                <SmallLabel>{t('flowRate', locale).toUpperCase()}</SmallLabel>
              </SmallMetricCard>
            )}
          </MetricsGrid>

          {/* Gauges */}

          {/* WIP Limits Segmented - Strictly controlled by metricValidity.wip */}
          {metricValidity.wip === 'valid' && (
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

          {/* Engine Load Gradient - Explicitly check logic */}
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
