import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { invoke } from '@forge/bridge'
import F1Card from '../Common/F1Card'
import { t } from '../../i18n'

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const Container = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`

const MetricSection = styled.div`
  background: ${({ theme }) => (theme as any).colors?.bgMain || '#1a1a1a'}44;
  border-radius: 8px;
  padding: 12px;
`

const SectionTitle = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors?.textMuted || '#888'};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`

// Distribution Bar
const DistributionBars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const DistributionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const DistributionLabel = styled.span`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors?.textSecondary || '#ccc'};
  min-width: 80px;
`

const DistributionBar = styled.div<{ $percentage: number; $color: string }>`
  flex: 1;
  height: 16px;
  background: ${({ theme }) => (theme as any).colors?.bgCard || '#2a2a2a'};
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ $percentage }) => $percentage}%;
    background: ${({ $color }) => $color};
    border-radius: 4px;
    transition: width 0.5s ease;
  }
`

const DistributionValue = styled.span`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => (theme as any).colors?.textPrimary || '#fff'};
  min-width: 32px;
  text-align: right;
`

// Velocity Card
const VelocityDisplay = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`

const VelocityValue = styled.span`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => (theme as any).colors?.textPrimary || '#fff'};
`

const VelocityUnit = styled.span`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 12px;
  color: ${({ theme }) => (theme as any).colors?.textMuted || '#888'};
`

const TrendBadge = styled.span<{ $trend: 'up' | 'down' | 'stable' }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 10px;
  font-weight: 600;
  background: ${({ $trend }) =>
        $trend === 'up' ? 'rgba(57, 255, 20, 0.2)' :
            $trend === 'down' ? 'rgba(255, 0, 51, 0.2)' :
                'rgba(136, 136, 136, 0.2)'};
  color: ${({ $trend }) =>
        $trend === 'up' ? '#39FF14' :
            $trend === 'down' ? '#FF0033' :
                '#888'};
`

// Flow Time Stats
const TimeStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`

const TimeStat = styled.div`
  text-align: center;
`

const TimeValue = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => (theme as any).colors?.textPrimary || '#fff'};
`

const TimeLabel = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 9px;
  color: ${({ theme }) => (theme as any).colors?.textMuted || '#888'};
  text-transform: uppercase;
`

// Load Gauge
const LoadGauge = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const LoadBar = styled.div<{ $percent: number; $status: 'good' | 'warning' | 'danger' }>`
  flex: 1;
  height: 24px;
  background: ${({ theme }) => (theme as any).colors?.bgCard || '#2a2a2a'};
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ $percent }) => Math.min($percent, 100)}%;
    background: ${({ $status }) =>
        $status === 'good' ? '#39FF14' :
            $status === 'warning' ? '#F4D03F' :
                '#FF0033'};
    border-radius: 12px;
    transition: width 0.5s ease;
  }
`

const LoadValue = styled.span<{ $status: 'good' | 'warning' | 'danger' }>`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 18px;
  font-weight: 700;
  color: ${({ $status }) =>
        $status === 'good' ? '#39FF14' :
            $status === 'warning' ? '#F4D03F' :
                '#FF0033'};
`

const DetectedTypes = styled.div`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => (theme as any).colors?.border || '#444'}22;
`

const TypeBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 2px 8px;
  margin: 2px 4px 2px 0;
  border-radius: 4px;
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 9px;
  background: ${({ $color }) => $color}22;
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => $color}44;
`

interface FlowMetricsData {
    distribution: {
        features: { count: number; percentage: number }
        defects: { count: number; percentage: number }
        risks: { count: number; percentage: number }
        debt: { count: number; percentage: number }
        other: { count: number; percentage: number }
        total: number
    }
    velocity: { completed: number; period: string; trend: 'up' | 'down' | 'stable'; changePercent: number }
    flowTime: { avgHours: number; medianHours: number; p85Hours: number }
    flowLoad: { total: number; limit: number; loadPercent: number }
    detectedTypes: string[]
    f1Theme: Record<string, { name: string; emoji: string; color: string }>
}

interface FlowMetricsPanelProps {
    locale?: string
}

export default function FlowMetricsPanel({ locale = 'en' }: FlowMetricsPanelProps) {
    const [data, setData] = useState<FlowMetricsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await invoke<any>('getFlowMetrics')
                if (result.success) {
                    setData(result)
                } else {
                    setError(result.error || 'Failed to load flow metrics')
                }
            } catch (e: any) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <F1Card title={`🏁 ${t('raceStrategyAnalysis', locale)}`} badge={t('loading', locale)}>
                <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
                    {t('calculatingFlowMetrics', locale)}
                </div>
            </F1Card>
        )
    }

    if (error || !data) {
        return (
            <F1Card title={`🏁 ${t('raceStrategyAnalysis', locale)}`} badge={t('error', locale)}>
                <div style={{ padding: 24, textAlign: 'center', color: '#FF0033' }}>
                    {error || t('noData', locale)}
                </div>
            </F1Card>
        )
    }

    const theme = data.f1Theme
    const loadStatus = data.flowLoad.loadPercent > 100 ? 'danger' :
        data.flowLoad.loadPercent > 80 ? 'warning' : 'good'

    return (
        <Container>
            <F1Card title={`🏁 ${t('raceStrategyAnalysis', locale)}`} badge={t('safeFlow', locale)}>
                <MetricsGrid>
                    {/* Strategy Mix (Distribution) */}
                    <MetricSection>
                        <SectionTitle>
                            {theme.features.emoji} {t('strategyMix', locale)}
                        </SectionTitle>
                        <DistributionBars>
                            <DistributionRow>
                                <DistributionLabel>{theme.features.name}</DistributionLabel>
                                <DistributionBar $percentage={data.distribution.features.percentage} $color={theme.features.color} />
                                <DistributionValue>{data.distribution.features.percentage}%</DistributionValue>
                            </DistributionRow>
                            <DistributionRow>
                                <DistributionLabel>{theme.defects.name}</DistributionLabel>
                                <DistributionBar $percentage={data.distribution.defects.percentage} $color={theme.defects.color} />
                                <DistributionValue>{data.distribution.defects.percentage}%</DistributionValue>
                            </DistributionRow>
                            <DistributionRow>
                                <DistributionLabel>{theme.risks.name}</DistributionLabel>
                                <DistributionBar $percentage={data.distribution.risks.percentage} $color={theme.risks.color} />
                                <DistributionValue>{data.distribution.risks.percentage}%</DistributionValue>
                            </DistributionRow>
                            <DistributionRow>
                                <DistributionLabel>{theme.debt.name}</DistributionLabel>
                                <DistributionBar $percentage={data.distribution.debt.percentage} $color={theme.debt.color} />
                                <DistributionValue>{data.distribution.debt.percentage}%</DistributionValue>
                            </DistributionRow>
                        </DistributionBars>
                    </MetricSection>

                    {/* Laps Completed (Velocity) */}
                    <MetricSection>
                        <SectionTitle>
                            🏎️ {t('lapsCompleted', locale)}
                        </SectionTitle>
                        <VelocityDisplay>
                            <VelocityValue>{data.velocity.completed}</VelocityValue>
                            <VelocityUnit>{t('items', locale)}</VelocityUnit>
                            <TrendBadge $trend={data.velocity.trend}>
                                {data.velocity.trend === 'up' ? '▲' : data.velocity.trend === 'down' ? '▼' : '━'}
                                {' '}{data.velocity.changePercent}%
                            </TrendBadge>
                        </VelocityDisplay>
                        <div style={{ marginTop: 8, fontSize: 10, color: '#888' }}>{data.velocity.period}</div>
                    </MetricSection>

                    {/* Sector Time (Flow Time) */}
                    <MetricSection>
                        <SectionTitle>
                            ⏱️ {t('sectorTimeLeadTime', locale)}
                        </SectionTitle>
                        <TimeStats>
                            <TimeStat>
                                <TimeValue>{Math.round(data.flowTime.avgHours / 24)}d</TimeValue>
                                <TimeLabel>{t('average', locale)}</TimeLabel>
                            </TimeStat>
                            <TimeStat>
                                <TimeValue>{Math.round(data.flowTime.medianHours / 24)}d</TimeValue>
                                <TimeLabel>{t('median', locale)}</TimeLabel>
                            </TimeStat>
                            <TimeStat>
                                <TimeValue>{Math.round(data.flowTime.p85Hours / 24)}d</TimeValue>
                                <TimeLabel>{t('p85', locale)}</TimeLabel>
                            </TimeStat>
                        </TimeStats>
                    </MetricSection>

                    {/* Fuel Load (Flow Load) */}
                    <MetricSection>
                        <SectionTitle>
                            ⛽ {t('fuelLoadWip', locale)}
                        </SectionTitle>
                        <LoadGauge>
                            <LoadBar $percent={data.flowLoad.loadPercent} $status={loadStatus} />
                            <LoadValue $status={loadStatus}>{data.flowLoad.loadPercent}%</LoadValue>
                        </LoadGauge>
                        <div style={{ marginTop: 8, fontSize: 10, color: '#888' }}>
                            {data.flowLoad.total} / {data.flowLoad.limit} {t('items', locale)}
                        </div>
                    </MetricSection>
                </MetricsGrid>

                {/* Detected Types */}
                <DetectedTypes>
                    <SectionTitle style={{ marginBottom: 8 }}>
                        🔍 {t('autoDetectedIssueTypes', locale)}
                    </SectionTitle>
                    <div>
                        {data.detectedTypes.map(type => (
                            <TypeBadge key={type} $color={theme.features.color}>
                                {type}
                            </TypeBadge>
                        ))}
                    </div>
                </DetectedTypes>
            </F1Card>
        </Container>
    )
}
