/**
 * Sprint Health Gauge Component
 * 
 * Displays the Sprint Health Prediction with F1-themed visuals:
 * - GREEN FLAG: On track
 * - YELLOW FLAG: Pace dropping
 * - RED FLAG: Intervention needed
 */

import React from 'react'
import { t, tPop } from '../../i18n'
import styled, { keyframes } from 'styled-components'
import { Panel } from '../Common/Panel'

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`

const FlagBadge = styled.span<{ $status: 'GREEN_FLAG' | 'YELLOW_FLAG' | 'RED_FLAG' }>`
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  ${({ $status }) => {
        if ($status === 'GREEN_FLAG') {
            return `background: var(--color-success); color: #000;`
        } else if ($status === 'YELLOW_FLAG') {
            return `background: var(--color-warning); color: #000;`
        } else {
            return `background: var(--color-danger); color: #FFF; box-shadow: 0 2px 4px rgba(244, 42, 64, 0.3);`
        }
    }}
`

const GaugeContainer = styled.div`
  position: relative;
  height: 20px;
  background: var(--bg-surface-hover);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
`

const GaugeFill = styled.div<{ $percent: number; $status: string }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  border-radius: 10px;
  transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 2px 0 8px rgba(0,0,0,0.2);
  
  ${({ $status }) => {
        if ($status === 'GREEN_FLAG') {
            return `background: linear-gradient(90deg, #10B981, #34D399);`
        } else if ($status === 'YELLOW_FLAG') {
            return `background: linear-gradient(90deg, #F59E0B, #FBBF24);`
        } else {
            return `background: linear-gradient(90deg, #EF4444, #F87171);`
        }
    }}
`

const ScoreText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  z-index: 2;
  mix-blend-mode: overlay;
`

const Message = styled.div`
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.4;
`

const BoxBoxText = styled.span`
  font-family: var(--font-mono);
  font-weight: 800;
  color: var(--text-primary);
  margin-right: 6px;
  text-transform: uppercase;
`

const Recommendation = styled.div`
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--text-secondary);
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  
  &::before {
    content: '⚡';
    font-style: normal;
    color: var(--color-warning);
  }
`

const FactorsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
`

const FactorPill = styled.div<{ $value: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-hover);
  border-radius: 6px;
  padding: 6px 4px;
  border: 1px solid var(--border-subtle);
  cursor: help;
  
  .label {
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .value {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    color: ${({ $value }) =>
        $value > 0.8 ? 'var(--color-success)' :
            $value > 0.5 ? 'var(--color-warning)' :
                'var(--color-danger)'
    };
  }
  
  &:hover {
      background: var(--bg-card-hover);
  }
`

interface SprintHealthGaugeProps {
    sprintHealth: {
        score: number
        status: 'GREEN_FLAG' | 'YELLOW_FLAG' | 'RED_FLAG'
        message: string
        recommendation: string
        factors: {
            velocityFactor: number
            timeFactor: number
            stalledFactor: number
            scopeFactor: number
        }
    } | null
    loading?: boolean
    boardType?: string
    onOpenRovo?: () => void
}

// SVG Icon Helper
const MetricIcon = styled.svg`
  width: 12px;
  height: 12px;
  fill: currentColor;
  flex-shrink: 0;
`

const ICONS = {
    pace: "M7 2v11h3v9l7-12h-4l4-8z", // Lightning
    time: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
    flow: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM6.5 9L10 5.5 13.5 9H11v4H9V9H6.5zm11 6L14 18.5 10.5 15H13v-4h2v4h2.5z", // Up/Down arrows
    scope: "M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z" // Pie Chart slice
};

// 2-column grid for better space management
const TwoColGrid = styled(FactorsRow)`
    grid-template-columns: repeat(2, 1fr);
`

// Compact pill style
const CompactPill = styled(FactorPill)`
    flex-direction: row;
    justify-content: space-between;
    padding: 8px 12px;
    
    .label { margin-bottom: 0; }
    .value { font-size: 11px; }
`

export function SprintHealthGauge({ sprintHealth, loading, boardType = 'scrum', onOpenRovo }: SprintHealthGaugeProps) {
    const locale = (window as any).__PWS_LOCALE || 'en'

    // Adaptive Title - uses population-specific healthTitle key
    const title = tPop('healthTitle', boardType, locale)



    const GaugeStatus = () => {
        if (!sprintHealth) return null;
        return (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {onOpenRovo && (
                    <button
                        onClick={onOpenRovo}
                        title={t('askRovoAnalysis', locale)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>smart_toy</span>
                    </button>
                )}
                <FlagBadge $status={sprintHealth.status}>{sprintHealth.status.replace('_', ' ')}</FlagBadge>
            </div>
        )
    }

    if (!sprintHealth && !loading) {
        return (
            <Panel title={`🏥 ${title}`} collapsible defaultCollapsed={false}>
                <Message style={{ color: 'var(--text-tertiary)', padding: 16 }}>{t('metricUnavailable', locale)}</Message>
            </Panel>
        )
    }

    if (loading || !sprintHealth) {
        return (
            <Panel title={`🏥 ${title}`} loading={true} collapsible><div style={{ height: 100 }} /></Panel>
        )
    }

    const { score, status, message, recommendation, factors } = sprintHealth

    return (
        <Panel title={title} rightAction={<GaugeStatus />} collapsible>
            <GaugeContainer>
                <GaugeFill $percent={score} $status={status} />
                <ScoreText>{score}%</ScoreText>
            </GaugeContainer>

            <div style={{ padding: '0 4px' }}>
                <Message>
                    <BoxBoxText>{t('g_boxbox', locale)}!</BoxBoxText>
                    {message.replace('BOX BOX! ', '').replace('BOX BOX!', '') /* Clean duplication if present */}
                </Message>
                <Recommendation>{recommendation}</Recommendation>

                <TwoColGrid>
                    <CompactPill $value={factors.velocityFactor} title={tPop('factor_pace_tooltip', boardType, locale)}>
                        <div className="label">
                            <MetricIcon viewBox="0 0 24 24"><path d={ICONS.pace} /></MetricIcon>
                            <span>{tPop('factor_pace', boardType, locale)}</span>
                        </div>
                        <div className="value">{Math.round(factors.velocityFactor * 100)}%</div>
                    </CompactPill>

                    <CompactPill $value={factors.timeFactor} title={tPop('factor_time_tooltip', boardType, locale)}>
                        <div className="label">
                            <MetricIcon viewBox="0 0 24 24"><path d={ICONS.time} /></MetricIcon>
                            <span>{tPop('factor_time', boardType, locale)}</span>
                        </div>
                        <div className="value">{Math.round(factors.timeFactor * 100)}%</div>
                    </CompactPill>

                    <CompactPill $value={factors.stalledFactor} title={tPop('factor_flow_tooltip', boardType, locale)}>
                        <div className="label">
                            <MetricIcon viewBox="0 0 24 24"><path d={ICONS.flow} /></MetricIcon>
                            <span>{tPop('factor_flow', boardType, locale)}</span>
                        </div>
                        <div className="value">{Math.round(factors.stalledFactor * 100)}%</div>
                    </CompactPill>

                    <CompactPill $value={factors.scopeFactor} title={tPop('factor_scope_tooltip', boardType, locale)}>
                        <div className="label">
                            <MetricIcon viewBox="0 0 24 24"><path d={ICONS.scope} /></MetricIcon>
                            <span>{tPop('factor_scope', boardType, locale)}</span>
                        </div>
                        <div className="value">{Math.round(factors.scopeFactor * 100)}%</div>
                    </CompactPill>
                </TwoColGrid>
            </div>
        </Panel>
    )
}

export default SprintHealthGauge
