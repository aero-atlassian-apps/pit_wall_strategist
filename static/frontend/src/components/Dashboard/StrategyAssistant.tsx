import React, { useState, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'
import F1Card from '../Common/F1Card'
import StatusLight from '../Common/StatusLight'
import { t } from '../../i18n'
import { IconButton, RefreshIcon } from '../Common/Buttons'
import { invoke } from '@forge/bridge'

const blinkAnimation = keyframes`0%,100%{opacity:1;box-shadow:0 0 30px rgba(255,0,51,.8), inset 0 0 20px rgba(255,0,51,.3)}50%{opacity:.85;box-shadow:0 0 50px rgba(255,0,51,1), inset 0 0 30px rgba(255,0,51,.5)}`

const AssistantContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: ${({ theme }) => (theme as any).spacing.md};
`

const InsightPanel = styled.div`
  flex: 1;
  background: ${({ theme }) => (theme as any).colors.bgMain}55;
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  padding: ${({ theme }) => (theme as any).spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as any).spacing.sm};
  min-height: 120px;
`

const InsightHeader = styled.h4`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  text-transform: uppercase;
  color: ${({ theme }) => (theme as any).colors.textMuted};
  letter-spacing: 1px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`

const InsightText = styled.div`
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
`

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => (theme as any).spacing.sm};
`

const ActionButton = styled.button<{ $variant?: 'default' | 'primary' | 'critical' }>`
  background: ${({ theme, $variant }) =>
    $variant === 'critical' ? 'rgba(255, 0, 51, 0.1)' :
    $variant === 'primary' ? 'rgba(191, 90, 242, 0.1)' :
    (theme as any).colors.bgCard};
  border: 1px solid ${({ theme, $variant }) =>
    $variant === 'critical' ? (theme as any).colors.redAlert :
    $variant === 'primary' ? (theme as any).colors.purpleSector :
    (theme as any).colors.border};
  border-left-width: 4px;
  color: ${({ theme, $variant }) =>
    $variant === 'critical' ? (theme as any).colors.redAlert :
    $variant === 'primary' ? (theme as any).colors.purpleSector :
    (theme as any).colors.textSecondary};
  padding: 10px 12px;
  border-radius: 4px;
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &:hover {
    background: ${({ theme, $variant }) =>
        $variant === 'critical' ? 'rgba(255, 0, 51, 0.2)' :
        $variant === 'primary' ? 'rgba(191, 90, 242, 0.2)' :
        (theme as any).colors.bgCardHover};
    transform: translateX(2px);
  }
`

const ActionTitle = styled.span`
  font-weight: 700;
`

const ActionDesc = styled.span`
  font-size: 9px;
  opacity: 0.7;
  text-transform: none;
`

const BoxBoxButton = styled.button<{ $active: boolean }>`
  width: 100%;
  height: 40px;
  border: none;
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  cursor: ${({ $active }) => ($active ? 'pointer' : 'default')};
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => (theme as any).spacing.md};
  transition: all .3s ease;
  margin-top: auto;

  ${({ $active, theme }) => ($active ? css`
    background: linear-gradient(135deg, ${(theme as any).colors.redAlert} 0%, #cc0029 100%);
    color: white;
    animation: ${blinkAnimation} 1.5s ease-in-out infinite;
    &:hover { transform: scale(1.02) }
    &:active { transform: scale(.98) }
  ` : css`
    background: ${(theme as any).colors.border};
    color: ${(theme as any).colors.textMuted};
    opacity: 0.5;
  `)}
`

interface Props {
  feed: Array<{ time: string; msg: string; type: any }>;
  alertActive: boolean;
  onBoxBox: () => void;
  onRefresh?: () => void;
  boardType?: 'scrum' | 'kanban' | 'business';
  projectContext?: any;
}

export default function StrategyAssistant({ feed = [], alertActive, onBoxBox, onRefresh, boardType = 'scrum', projectContext }: Props) {
  const locale = (window as any).__PWS_LOCALE || 'en'
  const isKanban = boardType === 'kanban'
  const [insight, setInsight] = useState<string>('Analyzing telemetry data...')
  const [loading, setLoading] = useState(false)

  // Generate an initial insight based on feed/context
  useEffect(() => {
      // Find critical or warning items from feed
      const critical = feed.filter(f => f.type === 'critical').pop()
      const warning = feed.filter(f => f.type === 'warning').pop()

      if (critical) {
          setInsight(`CRITICAL ALERT: ${critical.msg}\nImmediate intervention recommended. Check "Box Box" for details.`)
      } else if (warning) {
          setInsight(`WARNING: ${warning.msg}\nConsider adjusting strategy to avoid potential stalls.`)
      } else {
          setInsight(isKanban
            ? "Flow is optimal. Monitor Cycle Time for anomalies. Current WIP levels are within limits."
            : "Sprint pace is good. Velocity is tracking well against the target.")
      }
  }, [feed, isKanban])

  const handleAction = async (prompt: string, label: string) => {
      setLoading(true)
      setInsight(`Analyzing ${label}...`)

      try {
        const result = await invoke('chatWithRovo', { message: prompt }) as any
        if (result && result.success) {
            setInsight(result.answer)
        } else {
            setInsight(`Failed to analyze: ${result?.error || 'Unknown error'}`)
        }
      } catch (e) {
        setInsight("Telemetry link failed. Please retry.")
      } finally {
        setLoading(false)
      }
  }

  return (
    <F1Card
      title="Strategy Assistant"
      badge="AI"
      badgeVariant="success"
      fullHeight
      glowColor="purple"
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton onClick={onRefresh} title={t('refreshAll', locale)}><RefreshIcon /></IconButton>
        </div>
      }
    >
      <AssistantContainer>
        <InsightPanel>
            <InsightHeader>
                {loading ? 'CALCULATING...' : 'STRATEGIC INSIGHT'}
            </InsightHeader>
            <InsightText>
                {insight}
            </InsightText>
        </InsightPanel>

        <ActionGrid>
          {isKanban ? (
            <>
              <ActionButton $variant="primary" onClick={() => handleAction("Analyze Cycle Time", "Cycle Time")}>
                <ActionTitle>Analyze Flow</ActionTitle>
                <ActionDesc>Check Cycle Time & Lap Pace</ActionDesc>
              </ActionButton>
              <ActionButton onClick={() => handleAction("Show WIP Aging", "WIP Aging")}>
                <ActionTitle>Tire Deg Check</ActionTitle>
                <ActionDesc>Identify aging WIP items</ActionDesc>
              </ActionButton>
              <ActionButton onClick={() => handleAction("Check Throughput Trend", "Throughput")}>
                <ActionTitle>Flow Rate</ActionTitle>
                <ActionDesc>Verify delivery throughput</ActionDesc>
              </ActionButton>
              <ActionButton $variant="critical" onClick={() => handleAction("Identify Blocked Items", "Blockers")}>
                <ActionTitle>Red Flags</ActionTitle>
                <ActionDesc>Find blocked or stalled work</ActionDesc>
              </ActionButton>
            </>
          ) : (
             <>
              <ActionButton $variant="primary" onClick={() => handleAction("Analyze Sprint Velocity", "Velocity")}>
                <ActionTitle>Analyze Pace</ActionTitle>
                <ActionDesc>Check velocity vs target</ActionDesc>
              </ActionButton>
              <ActionButton onClick={() => handleAction("Identify Bottlenecks", "Bottlenecks")}>
                <ActionTitle>Traffic Report</ActionTitle>
                <ActionDesc>Locate process bottlenecks</ActionDesc>
              </ActionButton>
              <ActionButton onClick={() => handleAction("Predict Completion Date", "Predictions")}>
                <ActionTitle>Race Prediction</ActionTitle>
                <ActionDesc>Forecast completion</ActionDesc>
              </ActionButton>
              <ActionButton onClick={() => handleAction("Show Team Health", "Team Health")}>
                <ActionTitle>Pit Crew Status</ActionTitle>
                <ActionDesc>Check team load & burnout</ActionDesc>
              </ActionButton>
            </>
          )}
        </ActionGrid>

        <BoxBoxButton $active={alertActive} onClick={alertActive ? onBoxBox : undefined}>
          {alertActive ? "⚠️ BOX BOX (CRITICAL ALERTS)" : "NO CRITICAL ALERTS"}
        </BoxBoxButton>

      </AssistantContainer>
    </F1Card>
  )
}
