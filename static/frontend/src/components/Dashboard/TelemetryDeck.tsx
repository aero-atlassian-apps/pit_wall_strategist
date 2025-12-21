import React, { useState } from 'react'
import styled from 'styled-components'
import { Panel } from '../Common/Panel'
import Sparkline from '../Common/Sparkline'
import { IconButton } from '../Common/Buttons'
import { t, tPop } from '../../i18n'
import { openAgentChat } from '../../utils/rovoBridge'
import { useBoardContext } from '../../context/BoardContext'
import { theme } from '../../styles/theme'

// --- Types ---
type PopulationMode = 'scrum' | 'flow' | 'process'
function getPopulationMode(boardType: string): PopulationMode {
    switch (boardType) {
        case 'scrum': return 'scrum'
        case 'kanban': return 'flow'
        case 'business': return 'process'
        default: return 'scrum'
    }
}

// --- Styled Components (Minimal, relying on base.css vars) ---
const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`

const KPIBox = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: border-color 0.2s;
  
  &:hover {
    border-color: var(--border-subtle);
  }
`

const KPIValue = styled.div`
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
`

const KPILabel = styled.div`
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
`

const SectionTitle = styled.h3`
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 16px 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
`

// Progress Bars
const BarRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
`
const BarTrack = styled.div`
  height: 6px;
  background: var(--bg-main);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
`
const BarFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  width: ${({ $percent }) => Math.min($percent, 100)}%;
  background: ${({ $color }) => $color};
  transition: width 0.4s ease;
`

// Tabs
const TabContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  padding: 2px;
  background: var(--bg-main);
  border-radius: 6px;
`
const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  border: none;
  background: ${({ $active }) => $active ? 'var(--bg-card)' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--text-primary)' : 'var(--text-tertiary)'};
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: var(--text-primary);
  }
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
    const { boardType: ctxBoardType } = useBoardContext()
    const effectiveBoardType = ctxBoardType || boardType
    const populationMode = getPopulationMode(effectiveBoardType)

    const isScrum = effectiveBoardType === 'scrum'
    const isFlow = effectiveBoardType === 'kanban'
    const isProcess = effectiveBoardType === 'business'

    // Refactor logic from old component
    const getWipColor = (load: number) => {
        if (load >= 100) return 'var(--color-danger)'
        if (load >= 80) return 'var(--color-warning)'
        return 'var(--color-success)'
    }

    const HeaderActions = (
        <div className="flex gap-2">
            <IconButton
                onClick={() => openAgentChat(t('rovo_briefingPrompt', locale))}
                title={t('rovo_briefingBtn', locale)}
                size="sm"
                style={{ border: '1px solid var(--border)' }}
            >
                🤖
            </IconButton>
            <IconButton
                onClick={onRefresh}
                size="sm"
                ariaLabel={t('refresh', locale)}
                style={{ border: '1px solid var(--border)' }}
            >
                ⟳
            </IconButton>
        </div>
    )

    if (telemetryData?.status === 'disabled') {
        return (
            <Panel title={tPop('telemetryTitle', populationMode, locale)} rightAction={HeaderActions}>
                <div className="flex items-center justify-center h-full p-4 text-muted font-mono text-sm">
                    {t('metricsDisabled', locale)}
                </div>
            </Panel>
        )
    }

    return (
        <Panel title={tPop('telemetryTitle', populationMode, locale)} rightAction={HeaderActions} className="telemetry-panel">

            {/* KPI Grid */}
            <Grid2 style={{ marginTop: 16 }}>
                {isScrum && (
                    <>
                        <KPIBox>
                            <KPIValue>{telemetryData?.velocity ?? '-'}</KPIValue>
                            <KPILabel>{telemetryData?.velocityWindow ? `${tPop('progressMetric', 'scrum', locale)} (${telemetryData.velocityWindow})` : tPop('progressMetric', 'scrum', locale)}</KPILabel>
                        </KPIBox>
                        <KPIBox>
                            <KPIValue>{telemetryData?.completion || 0}%</KPIValue>
                            <KPILabel>{tPop('completion', 'scrum', locale)}</KPILabel>
                        </KPIBox>
                    </>
                )}
                {isFlow && (
                    <>
                        <KPIBox>
                            <KPIValue>{telemetryData?.cycleTime ? `${telemetryData.cycleTime}h` : '-'}</KPIValue>
                            <KPILabel>{tPop('timeMetric', 'flow', locale)}</KPILabel>
                        </KPIBox>
                        <KPIBox>
                            <KPIValue>{telemetryData?.throughput ?? '-'}</KPIValue>
                            <KPILabel>{tPop('progressMetric', 'flow', locale)}</KPILabel>
                        </KPIBox>
                    </>
                )}
                {isProcess && (
                    <>
                        <KPIBox>
                            <KPIValue>{telemetryData?.cycleTime ? `${telemetryData.cycleTime}h` : '-'}</KPIValue>
                            <KPILabel>{tPop('timeMetric', 'process', locale)}</KPILabel>
                        </KPIBox>
                        <KPIBox>
                            <KPIValue>{telemetryData?.throughput ?? '-'}</KPIValue>
                            <KPILabel>{tPop('progressMetric', 'process', locale)}</KPILabel>
                        </KPIBox>
                    </>
                )}
            </Grid2>

            {/* Tabs */}
            <TabContainer>
                <Tab $active={activeTab === 'vitals'} onClick={() => setActiveTab('vitals')}>{t('vitals', locale)}</Tab>
                <Tab $active={activeTab === 'trends'} onClick={() => setActiveTab('trends')}>{t('trends', locale)}</Tab>
            </TabContainer>

            {/* Panels */}
            {activeTab === 'vitals' && (
                <div className="animate-slide-in">
                    <SectionTitle>{tPop('load', populationMode, locale)}</SectionTitle>

                    {/* WIP Load */}
                    <BarRow>
                        <span>{tPop('workItems', populationMode, locale)}</span>
                        <span style={{ color: getWipColor(telemetryData?.wipLoad || 0), fontWeight: 700 }}>
                            {telemetryData?.wipCurrent || 0} / {telemetryData?.wipLimit || '∞'}
                        </span>
                    </BarRow>
                    <BarTrack>
                        <BarFill
                            $percent={telemetryData?.wipLoad || 0}
                            $color={getWipColor(telemetryData?.wipLoad || 0)}
                        />
                    </BarTrack>

                    {/* Burnout by Assignee */}
                    {telemetryData?.teamBurnout && Object.keys(telemetryData.teamBurnout).length > 0 && (
                        <>
                            <SectionTitle>{t('teamBurnout', locale)}</SectionTitle>
                            {Object.entries(telemetryData.teamBurnout).map(([name, value]: [string, any]) => (
                                <div key={name}>
                                    <BarRow>
                                        <span>{name}</span>
                                        <span>{value}%</span>
                                    </BarRow>
                                    <BarTrack style={{ height: 4, marginBottom: 8 }}>
                                        <BarFill
                                            $percent={value}
                                            $color={value >= 80 ? 'var(--color-danger)' : value >= 60 ? 'var(--color-warning)' : 'var(--color-success)'}
                                        />
                                    </BarTrack>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'trends' && trendData && (
                <div className="animate-slide-in">
                    <SectionTitle>{t('performanceTrends', locale)}</SectionTitle>
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
                </div>
            )}
        </Panel>
    )
}

