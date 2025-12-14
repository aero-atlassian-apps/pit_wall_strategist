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
  const [insight, setInsight] = useState<string>(t('analyzingTelemetry', locale))
  const [loading, setLoading] = useState(false)

  // Generate an initial insight based on feed/context
  useEffect(() => {
      // Find critical or warning items from feed
      const critical = feed.filter(f => f.type === 'critical').pop()
      const warning = feed.filter(f => f.type === 'warning').pop()

      if (critical) {
          setInsight(`${t('criticalAlert', locale)} ${critical.msg}\n${t('immediateIntervention', locale)}`)
      } else if (warning) {
          setInsight(`${t('warning', locale)} ${warning.msg}\n${t('adjustStrategy', locale)}`)
      } else {
          setInsight(isKanban ? t('flowOptimalHint', locale) : t('sprintPaceHint', locale))
      }
  }, [feed, isKanban])

  const handleAction = async (prompt: string, label: string) => {
      setLoading(true)
      setInsight(`${t('analyzing', locale)} ${label}...`)

      try {
        const result = await invoke('chatWithRovo', { message: prompt }) as any
        if (result && result.success) {
            setInsight(result.answer)
        } else {
            setInsight(`${t('failedToAnalyze', locale)} ${result?.error || t('unknown', locale)}`)
        }
      } catch (e) {
        setInsight(t('telemetryLinkFailed', locale))
      } finally {
        setLoading(false)
      }
  }

  return (
    <F1Card
      title={t('strategyAssistant', locale)}
      badge={t('ai', locale)}
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
                {loading ? t('calculating', locale) : t('strategicInsight', locale)}
            </InsightHeader>
            <InsightText>
                {insight}
            </InsightText>
        </InsightPanel>

        <ActionGrid>
          {isKanban ? (
            <>
              <ActionButton $variant="primary" onClick={() => handleAction(t('analyzeCycleTime', locale), t('cycleTime', locale))}>
                <ActionTitle>{t('analyzeFlow', locale)}</ActionTitle>
                <ActionDesc>{t('checkCycleLap', locale)}</ActionDesc>
              </ActionButton>
              <ActionButton onClick={() => handleAction(t('showWipAging', locale), t('wipAging', locale))}>
                <ActionTitle>{t('tireDegCheck', locale)}</ActionTitle>
                <ActionDesc>{t('identifyAgingWip', locale)}</ActionDesc>
              </ActionButton>
              <ActionButton onClick={() => handleAction(t('checkThroughput', locale), t('throughput', locale))}>
                <ActionTitle>{t('flowRate', locale)}</ActionTitle>
                <ActionDesc>{t('verifyThroughput', locale)}</ActionDesc>
              </ActionButton>
              <ActionButton $variant="critical" onClick={() => handleAction(t('identifyBlocked', locale), t('blockers', locale))}>
                <ActionTitle>{t('redFlags', locale)}</ActionTitle>
                <ActionDesc>{t('findBlockedOrStalled', locale)}</ActionDesc>
              </ActionButton>
            </>
          ) : (
             <>
              <ActionButton $variant="primary" onClick={() => handleAction(t('analyzeSprintVelocity', locale), t('velocity', locale))}>
                <ActionTitle>{t('analyzePace', locale)}</ActionTitle>
                <ActionDesc>{t('checkVelocityVsTarget', locale)}</ActionDesc>
              </ActionButton>
              <ActionButton onClick={() => handleAction(t('identifyBottlenecks', locale), t('bottlenecks', locale))}>
                <ActionTitle>{t('trafficReport', locale)}</ActionTitle>
                <ActionDesc>{t('locateBottlenecks', locale)}</ActionDesc>
              </ActionButton>
              <ActionButton onClick={() => handleAction(t('predictCompletion', locale), t('predictions', locale))}>
                <ActionTitle>{t('racePrediction', locale)}</ActionTitle>
                <ActionDesc>{t('forecastCompletion', locale)}</ActionDesc>
              </ActionButton>
              <ActionButton onClick={() => handleAction(t('showTeamHealth', locale), t('teamHealth', locale))}>
                <ActionTitle>{t('pitCrewStatus', locale)}</ActionTitle>
                <ActionDesc>{t('checkTeamLoadBurnout', locale)}</ActionDesc>
              </ActionButton>
            </>
          )}
        </ActionGrid>

        <BoxBoxButton $active={alertActive} onClick={alertActive ? onBoxBox : undefined}>
          {alertActive ? t('boxboxCritical', locale) : t('noCriticalAlerts', locale)}
        </BoxBoxButton>

      </AssistantContainer>
    </F1Card>
  )
}
