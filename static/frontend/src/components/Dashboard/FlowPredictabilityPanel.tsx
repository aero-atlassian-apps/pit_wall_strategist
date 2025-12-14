import React, { useMemo } from 'react'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const Container = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(244, 208, 63, 0.2);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const Title = styled.h3`
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
`

const Badge = styled.span<{ $status: 'good' | 'warning' | 'danger' }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  padding: 3px 8px;
  border-radius: 4px;
  background: ${({ $status }) =>
        $status === 'good' ? 'rgba(57, 255, 20, 0.2)' :
            $status === 'warning' ? 'rgba(244, 208, 63, 0.2)' :
                'rgba(255, 0, 51, 0.2)'};
  color: ${({ $status }) =>
        $status === 'good' ? '#39FF14' :
            $status === 'warning' ? '#F4D03F' :
                '#FF0033'};
  text-transform: uppercase;
`

const MainStat = styled.div`
  text-align: center;
  margin-bottom: 16px;
`

const MainValue = styled.div<{ $status: 'good' | 'warning' | 'danger' }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 48px;
  font-weight: 700;
  color: ${({ $status }) =>
        $status === 'good' ? '#39FF14' :
            $status === 'warning' ? '#F4D03F' :
                '#FF0033'};
`

const MainLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
`

const ComparisonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`

const CompareCard = styled.div<{ $highlight: boolean }>`
  flex: 1;
  background: ${({ $highlight }) => $highlight ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${({ $highlight }) => $highlight ? 'rgba(57, 255, 20, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 6px;
  padding: 12px;
  text-align: center;
`

const CompareLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 4px;
`

const CompareValue = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`

const TrendIndicator = styled.div<{ $up: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: ${({ $up }) => $up ? '#39FF14' : '#FF0033'};
`

const HistoryBar = styled.div`
  display: flex;
  gap: 4px;
  height: 40px;
  align-items: flex-end;
`

const HistoryColumn = styled.div<{ $height: number; $current: boolean }>`
  flex: 1;
  height: ${({ $height }) => $height}%;
  background: ${({ $current }) =>
        $current ? 'linear-gradient(180deg, #F4D03F, #FF8C00)' : '#3a3a5a'};
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
`

const HistoryLabels = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
`

const HistoryLabel = styled.span`
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  color: #666;
  text-align: center;
`

interface SprintData {
    name: string
    committed: number
    delivered: number
}

interface FlowPredictabilityProps {
    currentSprint?: SprintData
    previousSprints?: SprintData[]
}

export default function FlowPredictabilityPanel({
    currentSprint = { name: 'Current', committed: 15, delivered: 12 },
    previousSprints = [
        { name: 'S-4', committed: 12, delivered: 10 },
        { name: 'S-3', committed: 14, delivered: 11 },
        { name: 'S-2', committed: 13, delivered: 12 },
        { name: 'S-1', committed: 14, delivered: 14 },
    ]
}: FlowPredictabilityProps) {
    const analysis = useMemo(() => {
        // Calculate current delivery rate
        const deliveryRate = currentSprint.committed > 0
            ? Math.round((currentSprint.delivered / currentSprint.committed) * 100)
            : 0

        // Calculate average from previous sprints
        const prevRates = previousSprints.map(s =>
            s.committed > 0 ? (s.delivered / s.committed) * 100 : 0
        )
        const avgRate = prevRates.length > 0
            ? Math.round(prevRates.reduce((a, b) => a + b, 0) / prevRates.length)
            : 0

        // Determine status
        const status: 'good' | 'warning' | 'danger' =
            deliveryRate >= 85 ? 'good' :
                deliveryRate >= 70 ? 'warning' :
                    'danger'

        // Trend
        const isImproving = deliveryRate > avgRate

        return {
            deliveryRate,
            avgRate,
            status,
            isImproving,
            history: [...previousSprints.map(s => ({
                ...s,
                rate: s.committed > 0 ? Math.round((s.delivered / s.committed) * 100) : 0
            })), {
                ...currentSprint,
                rate: deliveryRate
            }]
        }
    }, [currentSprint, previousSprints])

    return (
        <Container>
            <Header>
                <Title>🎯 Pit Lane Consistency</Title>
                <Badge $status={analysis.status}>
                    {analysis.status === 'good' ? 'Reliable' :
                        analysis.status === 'warning' ? 'Variable' :
                            'Unpredictable'}
                </Badge>
            </Header>

            <MainStat>
                <MainValue $status={analysis.status}>{analysis.deliveryRate}%</MainValue>
                <MainLabel>Commitment Delivery Rate</MainLabel>
            </MainStat>

            <ComparisonRow>
                <CompareCard $highlight={false}>
                    <CompareLabel>Committed</CompareLabel>
                    <CompareValue>{currentSprint.committed}</CompareValue>
                </CompareCard>
                <CompareCard $highlight={true}>
                    <CompareLabel>Delivered</CompareLabel>
                    <CompareValue>{currentSprint.delivered}</CompareValue>
                </CompareCard>
                <CompareCard $highlight={false}>
                    <CompareLabel>Avg Rate</CompareLabel>
                    <CompareValue>{analysis.avgRate}%</CompareValue>
                </CompareCard>
            </ComparisonRow>

            <HistoryBar>
                {analysis.history.map((sprint, idx) => (
                    <HistoryColumn
                        key={sprint.name}
                        $height={sprint.rate}
                        $current={idx === analysis.history.length - 1}
                    />
                ))}
            </HistoryBar>
            <HistoryLabels>
                {analysis.history.map(sprint => (
                    <HistoryLabel key={sprint.name}>{sprint.name}</HistoryLabel>
                ))}
            </HistoryLabels>

            <TrendIndicator $up={analysis.isImproving}>
                {analysis.isImproving ? '📈' : '📉'}
                {analysis.isImproving
                    ? `+${analysis.deliveryRate - analysis.avgRate}% vs average`
                    : `${analysis.deliveryRate - analysis.avgRate}% vs average`
                }
            </TrendIndicator>
        </Container>
    )
}
