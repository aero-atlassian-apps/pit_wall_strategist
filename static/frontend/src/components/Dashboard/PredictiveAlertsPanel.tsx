import React from 'react'
import styled, { keyframes, css } from 'styled-components'
import { Panel } from '../Common/Panel'
import { t } from '../../i18n'

// --- Animations ---
const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
`

// --- Styled Components ---
const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
`

const AlertItem = styled.div<{ $riskLevel: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: var(--bg-main);
  border-radius: 4px;
  border-left: 3px solid ${({ $riskLevel }) =>
        $riskLevel === 'CRITICAL' ? 'var(--color-danger)' :
            $riskLevel === 'WARNING' ? 'var(--color-warning)' :
                'var(--border)'
    };
  transition: transform 0.1s;
  
  &:hover {
    transform: translateX(2px);
    background: var(--bg-card-hover);
  }
`

const AlertContent = styled.div`
  flex: 1;
  min-width: 0;
`

const AlertMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
`

const AlertKey = styled.span`
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
`

const AlertProgress = styled.span<{ $percent: number }>`
  font-family: var(--font-mono);
  font-size: 10px;
  color: ${({ $percent }) =>
        $percent >= 85 ? 'var(--color-danger)' :
            $percent >= 70 ? 'var(--color-warning)' :
                'var(--text-tertiary)'
    };
`

const AlertRec = styled.div`
  font-family: var(--font-ui);
  font-size: 10px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const BottleneckBox = styled.div<{ $impact: string }>`
  margin-top: 12px;
  padding: 10px;
  background: var(--bg-main);
  border-radius: 4px;
  border: 1px dashed ${({ $impact }) =>
        $impact === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-warning)'
    };
`

const BottleneckTitle = styled.div`
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
`

const BottleneckMeta = styled.div`
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-tertiary);
  margin-top: 2px;
`

const NoAlerts = styled.div`
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-success);
  text-align: center;
  padding: 24px;
  background: var(--bg-main);
  border-radius: 4px;
`

// --- Interfaces ---
interface PreStallWarning {
    issueKey: string
    summary: string
    assignee: string | null
    hoursInStatus: number
    threshold: number
    percentToStall: number
    riskLevel: 'WATCH' | 'WARNING' | 'CRITICAL'
    recommendation: string
}

interface BottleneckAnalysis {
    bottleneckStatus: string
    avgHoursInBottleneck: number
    issuesInBottleneck: number
    percentOfFlow: number
    impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    recommendation: string
    f1Metaphor: string
}

interface PredictiveAlertsPanelProps {
    preStallWarnings: PreStallWarning[]
    bottleneck: BottleneckAnalysis | null
    loading?: boolean
    onIssueClick?: (issueKey: string) => void
}

export function PredictiveAlertsPanel({
    preStallWarnings,
    bottleneck,
    loading,
    onIssueClick
}: PredictiveAlertsPanelProps) {
    const totalAlerts = preStallWarnings.length

    // Header component for Panel
    const RiskBadge = () => {
        if (totalAlerts === 0) return <span style={{ fontSize: 10, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>CLEAR</span>
        const crit = preStallWarnings.filter(w => w.riskLevel === 'CRITICAL').length
        return (
            <span style={{
                fontSize: 10,
                color: crit > 0 ? 'var(--color-danger)' : 'var(--color-warning)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                animation: crit > 0 ? 'pulse-red 2s infinite' : 'none'
            }}>
                {totalAlerts} ISSUE{totalAlerts !== 1 ? 'S' : ''}
            </span>
        )
    }

    if (loading) {
        return (
            <Panel title="Predictive Risks" loading={true}>
                <div style={{ height: 100 }} />
            </Panel>
        )
    }

    return (
        <Panel title="Predictive Risks" rightAction={<RiskBadge />}>
            {totalAlerts === 0 ? (
                <NoAlerts>
                    ✅ No stall risks detected.<br />
                    <span style={{ fontSize: 9, opacity: 0.7 }}>Race control is monitoring.</span>
                </NoAlerts>
            ) : (
                <AlertList>
                    {preStallWarnings.slice(0, 5).map(warning => (
                        <AlertItem
                            key={warning.issueKey}
                            $riskLevel={warning.riskLevel}
                            onClick={() => onIssueClick?.(warning.issueKey)}
                            style={{ cursor: onIssueClick ? 'pointer' : 'default' }}
                        >
                            <div style={{ fontSize: 12 }}>
                                {warning.riskLevel === 'CRITICAL' ? '🔴' : warning.riskLevel === 'WARNING' ? '🟡' : '👀'}
                            </div>
                            <AlertContent>
                                <AlertMeta>
                                    <AlertKey>{warning.issueKey}</AlertKey>
                                    <AlertProgress $percent={warning.percentToStall}>
                                        {warning.hoursInStatus}h / {warning.threshold}h
                                    </AlertProgress>
                                </AlertMeta>
                                <AlertRec title={warning.recommendation}>
                                    💡 {warning.recommendation}
                                </AlertRec>
                            </AlertContent>
                        </AlertItem>
                    ))}
                </AlertList>
            )}

            {bottleneck && (
                <BottleneckBox $impact={bottleneck.impact}>
                    <BottleneckTitle>
                        🚧 {bottleneck.bottleneckStatus}
                    </BottleneckTitle>
                    <BottleneckMeta>
                        {bottleneck.issuesInBottleneck} tickets stuck ({bottleneck.percentOfFlow}% of flow)
                    </BottleneckMeta>
                    <div style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--text-tertiary)', marginTop: 4 }}>
                        ℹ️ "{bottleneck.f1Metaphor}"
                    </div>
                </BottleneckBox>
            )}
        </Panel>
    )
}

export default PredictiveAlertsPanel
