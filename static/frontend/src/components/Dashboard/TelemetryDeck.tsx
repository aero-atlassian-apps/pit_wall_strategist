import React, { useState } from 'react'
import styled from 'styled-components'
import F1Card from '../Common/F1Card'
import Sparkline from '../Common/Sparkline'
import StatusLight from '../Common/StatusLight'
import { IconButton, RefreshIcon } from '../Common/Buttons'
import { t } from '../../i18n'
import { useBoardContext } from '../../context/BoardContext'
import DiagnosticsWidget from './DiagnosticsWidget'

const DeckContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as any).spacing.md};
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
`

const VitalsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => (theme as any).spacing.sm};
`

const VitalCard = styled.div`
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`

const VitalValue = styled.div<{ $color?: string }>`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 18px;
  font-weight: 700;
  color: ${({ $color, theme }) => $color || (theme as any).colors.textPrimary};
`
const VitalLabel = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 9px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
  text-transform: uppercase;
  margin-top: 4px;
`

const SectionHeader = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors.textDim};
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 1px;
  border-bottom: 1px solid ${({ theme }) => (theme as any).colors.border};
  padding-bottom: 4px;
`

const BarContainer = styled.div`
  margin-bottom: 8px;
`
const BarLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 10px;
  font-family: ${({ theme }) => (theme as any).fonts.mono};
`
const BarValues = styled.span`font-weight: 600;`

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: ${({ theme }) => (theme as any).colors.bgMain};
  border-radius: 3px;
  overflow: hidden;
`
const ProgressFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  width: ${({ $percent }) => Math.min($percent, 100)}%;
  background-color: ${({ $color }) => $color};
  transition: width 0.5s ease;
`

const Tabs = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 12px;
  background: ${({ theme }) => (theme as any).colors.bgMain};
  padding: 2px;
  border-radius: 6px;
`
const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  background: ${({ $active, theme }) => $active ? (theme as any).colors.bgCardHover : 'transparent'};
  color: ${({ $active, theme }) => $active ? (theme as any).colors.textPrimary : (theme as any).colors.textMuted};
  border: none;
  padding: 6px;
  border-radius: 4px;
  font-size: 10px;
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  cursor: pointer;
  font-weight: 600;
`

type Props = {
    telemetryData: any
    timingMetrics: any
    trendData: any
    boardType?: 'scrum' | 'kanban' | 'business'
    projectContext?: any
    onRefresh: () => void
}

export default function TelemetryDeck({ telemetryData, timingMetrics, trendData, boardType = 'scrum', projectContext, onRefresh }: Props) {
    const locale = (window as any).__PWS_LOCALE || 'en'
    const [activeTab, setActiveTab] = useState<'vitals' | 'trends'>('vitals')
    const { boardType: ctxBoardType } = useBoardContext() // prefer context if available
    const effectiveBoardType = ctxBoardType || boardType
    const isKanban = effectiveBoardType === 'kanban'

    // Helper to get colors
    const getWipColor = (load: number) => {
        if (load >= 100) return '#FF0033'
        if (load >= 80) return '#F4D03F'
        return '#39FF14'
    }

    // Check for disabled status
    if (telemetryData?.status === 'disabled') {
         return (
             <F1Card
                 title={isKanban ? t('flowTelemetry', locale) : t('sprintTelemetry', locale)}
                 fullHeight
                 action={<IconButton onClick={onRefresh} size="sm" ariaLabel={t('refresh', locale)}><RefreshIcon /></IconButton>}
             >
                 <DeckContainer>
                     <div style={{ textAlign: 'center', color: '#64748B', padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
                        {t('metricsDisabled', locale) || 'Metrics Disabled (Access Denied)'}
                     </div>
                     <DiagnosticsWidget />
                 </DeckContainer>
             </F1Card>
         )
    }

    return (
        <F1Card
            title={isKanban ? t('flowTelemetry', locale) : t('sprintTelemetry', locale)}
            fullHeight
            action={<IconButton onClick={onRefresh} size="sm" ariaLabel={t('refresh', locale)}><RefreshIcon /></IconButton>}
        >
            <DeckContainer>

                {/* Adaptive Top Stats based on board type */}
                <VitalsGrid>
                    {isKanban ? (
                        <>
                            <VitalCard title={`${telemetryData?.cycleTimeExplanation || ''}${telemetryData?.cycleTimeWindow ? `\n${t('window', locale)}: ${telemetryData.cycleTimeWindow}` : ''}`}>
                                <VitalValue>{telemetryData?.cycleTime ? `${telemetryData.cycleTime}h` : '-'}</VitalValue>
                                <VitalLabel>{t('avgCycleTime', locale)}</VitalLabel>
                            </VitalCard>
                            <VitalCard title={`${telemetryData?.throughputExplanation || ''}${telemetryData?.throughputWindow ? `\n${t('window', locale)}: ${telemetryData.throughputWindow}` : ''}`}>
                                <VitalValue>{telemetryData?.throughput || '-'}</VitalValue>
                                <VitalLabel>{t('throughput', locale)}</VitalLabel>
                            </VitalCard>
                        </>
                    ) : (
                        <>
                            <VitalCard title={`${telemetryData?.velocityExplanation || ''}${telemetryData?.velocitySource ? `\n${t('source', locale)}: ${telemetryData.velocitySource}` : ''}${telemetryData?.velocityWindow ? `\n${t('window', locale)}: ${telemetryData.velocityWindow}` : ''}`}>
                                <VitalValue>{telemetryData?.velocity ? `${telemetryData.velocity}` : '-'}</VitalValue>
                                <VitalLabel>{t('velocity', locale)}</VitalLabel>
                            </VitalCard>
                            <VitalCard>
                                <VitalValue>{telemetryData?.completion || 0}%</VitalValue>
                                <VitalLabel>{t('completion', locale)}</VitalLabel>
                            </VitalCard>
                        </>
                    )}
                </VitalsGrid>

                <Tabs role="tablist">
                    <Tab
                        $active={activeTab === 'vitals'}
                        onClick={() => setActiveTab('vitals')}
                        role="tab"
                        aria-selected={activeTab === 'vitals'}
                        aria-controls="panel-vitals"
                        id="tab-vitals"
                    >
                        {t('vitals', locale)}
                    </Tab>
                    <Tab
                        $active={activeTab === 'trends'}
                        onClick={() => setActiveTab('trends')}
                        role="tab"
                        aria-selected={activeTab === 'trends'}
                        aria-controls="panel-trends"
                        id="tab-trends"
                    >
                        {t('trends', locale)}
                    </Tab>
                </Tabs>

                {activeTab === 'vitals' && (
                    <div role="tabpanel" id="panel-vitals" aria-labelledby="tab-vitals">
                        <SectionHeader>{isKanban ? t('flowLoad', locale) : t('workInProgress', locale)}</SectionHeader>
                        <BarContainer>
                            <BarLabelRow>
                                <span>{isKanban ? t('wipUtilization', locale) : t('sprintLoad', locale)}</span>
                                <BarValues style={{ color: getWipColor(telemetryData?.wipLoad || 0) }}>
                                    {telemetryData?.wipCurrent || 0}/{telemetryData?.wipLimit || 0}
                                </BarValues>
                            </BarLabelRow>
                            <ProgressBar>
                                <ProgressFill
                                    $percent={telemetryData?.wipLoad || 0}
                                    $color={getWipColor(telemetryData?.wipLoad || 0)}
                                />
                            </ProgressBar>
                        </BarContainer>

                        <SectionHeader>{t('teamBurnout', locale)}</SectionHeader>
                        {Object.entries(telemetryData?.teamBurnout || {}).map(([name, value]: [string, any]) => (
                            <BarContainer key={name}>
                                <BarLabelRow>
                                    <span>{name}</span>
                                    <BarValues>{value}%</BarValues>
                                </BarLabelRow>
                                <ProgressBar>
                                    <ProgressFill
                                        $percent={value}
                                        $color={value >= 80 ? '#FF0033' : value >= 60 ? '#F4D03F' : '#39FF14'}
                                    />
                                </ProgressBar>
                            </BarContainer>
                        ))}
                        <DiagnosticsWidget />
                    </div>
                )}

                {activeTab === 'trends' && trendData && (
                    <div role="tabpanel" id="panel-trends" aria-labelledby="tab-trends">
                        <SectionHeader>{t('performanceTrends', locale)}</SectionHeader>
                        <div style={{ marginBottom: 16 }}>
                            <Sparkline
                                data={trendData.wip?.data}
                                label={t('wipConsistency', locale)}
                                direction={trendData.wip?.direction}
                                change={trendData.wip?.change}
                            />
                        </div>
                        <div>
                            <Sparkline
                                data={trendData.velocity?.data}
                                label={t('velocity', locale)}
                                direction={trendData.velocity?.direction}
                                change={trendData.velocity?.change}
                                invertColors={true}
                            />
                        </div>
                        <DiagnosticsWidget />
                    </div>
                )}

            </DeckContainer>
        </F1Card>
    )
}
