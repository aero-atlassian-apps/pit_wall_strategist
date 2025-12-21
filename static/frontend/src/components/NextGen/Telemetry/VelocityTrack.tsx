import React from 'react'
import styled from 'styled-components'
import { PanelContainer } from '../Layout/PanelContainer'
import { useBoardContext } from '../../../context/BoardContext'
import { tPop, t } from '../../../i18n'

interface VelocityTrackProps {
  trendData: any
}

const ChartContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  height: 120px;
  padding-top: 32px; /* Increased to fit values */
  position: relative;
`

const BarGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  position: relative;
  cursor: pointer;
  
  &:hover > div:first-child {
    background: var(--text-tertiary); /* Highlight */
  }
`

const Bar = styled.div<{ $height: string, $isCurrent?: boolean }>`
  width: 100%;
  height: ${({ $height }) => $height};
  background: ${({ $isCurrent }) => $isCurrent ? 'var(--brand-primary)' : 'var(--color-slate-300)'};
  border-radius: 2px 2px 0 0;
  transition: all 0.3s ease;
  position: relative;

  [data-theme='dark'] & {
    background: ${({ $isCurrent }) => $isCurrent ? 'var(--brand-primary)' : 'var(--color-slate-700)'};
  }
  
  ${({ $isCurrent }) => $isCurrent && `
    box-shadow: var(--shadow-glow);
  `}
`

const Label = styled.div<{ $isCurrent?: boolean }>`
  font-family: var(--font-stack-mono);
  font-size: 9px;
  color: ${({ $isCurrent }) => $isCurrent ? 'var(--brand-primary)' : 'var(--text-tertiary)'};
  text-align: center;
  margin-top: 4px;
  font-weight: 700;
`

const ValueBadge = styled.div`
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-stack-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary);
  opacity: 1; /* Always visible */
  transition: all 0.2s ease;
  pointer-events: none;

  ${BarGroup}:hover & {
    color: var(--text-primary);
    transform: translateX(-50%) translateY(-2px);
  }
`

export const VelocityTrack: React.FC<VelocityTrackProps> = ({ trendData }) => {
  const locale = (window as any).__PWS_LOCALE || 'en'
  const { context } = useBoardContext()

  // Derive boardType for population-specific terminology
  let boardType: 'scrum' | 'kanban' | 'business' = 'scrum'
  if (context?.projectType === 'business') {
    boardType = 'business'
  } else if (context?.boardStrategy === 'kanban') {
    boardType = 'kanban'
  }

  // Backend returns { velocity: TrendData } where TrendData = { data: TrendPoint[], direction, ... }
  // TrendPoint = { dayLabel: string, value: number }
  // NOTE: This is DAILY data (D-6 to Today), NOT sprint-based velocity
  const dataPoints = trendData?.velocity?.data || [] // Array of { dayLabel, value }
  const maxVal = Math.max(...dataPoints.map((s: any) => s.value || 0), 10)

  // Context-aware title: Shows throughput/delivery trend, not sprint velocity
  const title = boardType === 'scrum'
    ? t('performanceTrends', locale) // "Performance Trends"
    : tPop('progressMetric', boardType, locale) + ' Trend' // "Throughput Trend" or "Delivery Rate Trend"

  return (
    <PanelContainer
      title={title}
      action={
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
          {t('last7Days', locale) || 'Last 7 Days'}
        </span>
      }
      collapsible
    >
      <ChartContainer>
        {/* Background Grid Lines */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />
          <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />
          <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />
          <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {dataPoints.map((s: any, i: number) => {
          const h = Math.max((s.value / maxVal) * 100, 5) + '%'
          const isCurrent = i === dataPoints.length - 1
          return (
            <BarGroup key={i}>
              <ValueBadge>{s.value}</ValueBadge>
              <Bar $height={h} $isCurrent={isCurrent} />
              <Label $isCurrent={isCurrent}>{s.dayLabel}</Label>
            </BarGroup>
          )
        })}

        {/* Empty state filler if no data */}
        {dataPoints.length === 0 && (
          <div style={{ width: '100%', textAlign: 'center', fontSize: 10, color: 'var(--text-tertiary)' }}>
            {t('noData', locale) || 'No historical data'}
          </div>
        )}
      </ChartContainer>
    </PanelContainer>
  )
}

