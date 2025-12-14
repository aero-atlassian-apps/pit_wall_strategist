/**
 * Predictive Alerts Panel
 * 
 * Displays:
 * - Pre-Stall Warnings (proactive, before tickets stall)
 * - WIP Aging Alerts (Kanban)
 * - Bottleneck Detection (Theory of Constraints)
 */

import React from 'react'
import styled, { keyframes, css } from 'styled-components'

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
`

const Container = styled.div`
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  padding: ${({ theme }) => (theme as any).spacing.md};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => (theme as any).spacing.sm};
`

const Title = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
`

const AlertCount = styled.span<{ $level: 'critical' | 'warning' | 'watch' | 'none' }>`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  
  ${({ $level, theme }) => {
        if ($level === 'critical') {
            return css`
        background: ${(theme as any).colors.redAlert};
        color: white;
        animation: ${pulse} 1.5s ease-in-out infinite;
      `
        } else if ($level === 'warning') {
            return css`
        background: ${(theme as any).colors.yellowFlag};
        color: ${(theme as any).colors.bgMain};
      `
        } else if ($level === 'watch') {
            return css`
        background: ${(theme as any).colors.border};
        color: ${(theme as any).colors.textPrimary};
      `
        } else {
            return css`
        background: ${(theme as any).colors.greenPace}33;
        color: ${(theme as any).colors.greenPace};
      `
        }
    }}
`

const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as any).spacing.xs};
  max-height: 150px;
  overflow-y: auto;
`

const AlertItem = styled.div<{ $riskLevel: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as any).spacing.sm};
  padding: ${({ theme }) => (theme as any).spacing.xs} ${({ theme }) => (theme as any).spacing.sm};
  background: ${({ theme }) => (theme as any).colors.bgMain};
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  border-left: 3px solid ${({ $riskLevel, theme }) =>
        $riskLevel === 'CRITICAL' ? (theme as any).colors.redAlert :
            $riskLevel === 'WARNING' ? (theme as any).colors.yellowFlag :
                (theme as any).colors.border
    };
`

const AlertIcon = styled.span`
  font-size: 14px;
`

const AlertContent = styled.div`
  flex: 1;
  min-width: 0;
`

const AlertKey = styled.span`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  margin-right: ${({ theme }) => (theme as any).spacing.xs};
`

const AlertProgress = styled.span<{ $percent: number }>`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
  color: ${({ $percent, theme }) =>
        $percent >= 85 ? (theme as any).colors.redAlert :
            $percent >= 70 ? (theme as any).colors.yellowFlag :
                (theme as any).colors.textMuted
    };
`

const AlertRecommendation = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.ui};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors.textDim};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const NoAlerts = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  color: ${({ theme }) => (theme as any).colors.greenPace};
  text-align: center;
  padding: ${({ theme }) => (theme as any).spacing.md};
`

const BottleneckBox = styled.div<{ $impact: string }>`
  margin-top: ${({ theme }) => (theme as any).spacing.sm};
  padding: ${({ theme }) => (theme as any).spacing.sm};
  background: ${({ theme }) => (theme as any).colors.bgMain};
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  border-left: 3px solid ${({ $impact, theme }) =>
        $impact === 'CRITICAL' ? (theme as any).colors.redAlert :
            $impact === 'HIGH' ? (theme as any).colors.yellowFlag :
                (theme as any).colors.border
    };
`

const BottleneckTitle = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  margin-bottom: 4px;
`

const BottleneckMeta = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
`

const BottleneckMetaphor = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.ui};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors.yellowFlag};
  font-style: italic;
  margin-top: 4px;
`

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
    const criticalCount = preStallWarnings.filter(w => w.riskLevel === 'CRITICAL').length
    const warningCount = preStallWarnings.filter(w => w.riskLevel === 'WARNING').length
    const totalAlerts = preStallWarnings.length

    const alertLevel = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : totalAlerts > 0 ? 'watch' : 'none'

    if (loading) {
        return (
            <Container>
                <Header>
                    <Title>🔮 Predictive Alerts</Title>
                </Header>
                <NoAlerts style={{ color: '#64748B' }}>Scanning for risks...</NoAlerts>
            </Container>
        )
    }

    return (
        <Container>
            <Header>
                <Title>🔮 Pre-Stall Warnings</Title>
                <AlertCount $level={alertLevel}>
                    {totalAlerts === 0 ? '✓ CLEAR' : `${totalAlerts} ALERT${totalAlerts > 1 ? 'S' : ''}`}
                </AlertCount>
            </Header>

            {totalAlerts === 0 ? (
                <NoAlerts>✅ No imminent stalls detected. Track is clear!</NoAlerts>
            ) : (
                <AlertList>
                    {preStallWarnings.slice(0, 5).map(warning => (
                        <AlertItem
                            key={warning.issueKey}
                            $riskLevel={warning.riskLevel}
                            onClick={() => onIssueClick?.(warning.issueKey)}
                            style={{ cursor: onIssueClick ? 'pointer' : 'default' }}
                        >
                            <AlertIcon>
                                {warning.riskLevel === 'CRITICAL' ? '🔴' : warning.riskLevel === 'WARNING' ? '🟡' : '👀'}
                            </AlertIcon>
                            <AlertContent>
                                <div>
                                    <AlertKey>{warning.issueKey}</AlertKey>
                                    <AlertProgress $percent={warning.percentToStall}>
                                        {warning.percentToStall}% to stall ({warning.hoursInStatus}h of {warning.threshold}h)
                                    </AlertProgress>
                                </div>
                                <AlertRecommendation title={warning.recommendation}>
                                    💡 {warning.recommendation}
                                </AlertRecommendation>
                            </AlertContent>
                        </AlertItem>
                    ))}
                </AlertList>
            )}

            {bottleneck && (
                <BottleneckBox $impact={bottleneck.impact}>
                    <BottleneckTitle>
                        🚧 Bottleneck: "{bottleneck.bottleneckStatus}"
                    </BottleneckTitle>
                    <BottleneckMeta>
                        {bottleneck.issuesInBottleneck} issues ({bottleneck.percentOfFlow}% of flow) • Avg {bottleneck.avgHoursInBottleneck}h
                    </BottleneckMeta>
                    <BottleneckMetaphor>
                        🏎️ {bottleneck.f1Metaphor}
                    </BottleneckMetaphor>
                </BottleneckBox>
            )}
        </Container>
    )
}

export default PredictiveAlertsPanel
