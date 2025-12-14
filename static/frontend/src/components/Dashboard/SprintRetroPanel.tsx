import React, { useMemo } from 'react'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const Container = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(138, 43, 226, 0.2);
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

const Badge = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(138, 43, 226, 0.2);
  color: #8B5CF6;
  text-transform: uppercase;
`

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`

const SprintCard = styled.div<{ $isCurrent: boolean }>`
  background: ${({ $isCurrent }) =>
        $isCurrent ? 'rgba(138, 43, 226, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${({ $isCurrent }) =>
        $isCurrent ? 'rgba(138, 43, 226, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 8px;
  padding: 12px;
`

const SprintLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 8px;
`

const SprintName = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
`

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`

const MetricLabel = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
`

const MetricValue = styled.span<{ $color?: string }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  color: ${({ $color }) => $color || '#fff'};
`

const DeltaIndicator = styled.div<{ $positive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: ${({ $positive }) =>
        $positive ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 0, 51, 0.1)'};
  border: 1px solid ${({ $positive }) =>
        $positive ? 'rgba(57, 255, 20, 0.3)' : 'rgba(255, 0, 51, 0.3)'};
  border-radius: 8px;
`

const DeltaIcon = styled.span`
  font-size: 16px;
`

const DeltaText = styled.span<{ $positive: boolean }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: ${({ $positive }) => $positive ? '#39FF14' : '#FF0033'};
`

const RetroInsights = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const InsightItem = styled.div<{ $type: 'good' | 'bad' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: ${({ $type }) =>
        $type === 'good' ? 'rgba(57, 255, 20, 0.1)' :
            $type === 'bad' ? 'rgba(255, 0, 51, 0.1)' :
                'rgba(255, 255, 255, 0.02)'};
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: ${({ $type }) =>
        $type === 'good' ? '#39FF14' :
            $type === 'bad' ? '#FF6B6B' :
                '#888'};
`

const EmptyState = styled.div`
  text-align: center;
  padding: 30px 20px;
  color: #888;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
`

interface SprintData {
    name: string
    velocity: number
    committed: number
    completed: number
    carryOver: number
    avgCycleTime: number
}

interface SprintRetroProps {
    currentSprint?: SprintData
    previousSprint?: SprintData
}

export default function SprintRetroPanel({
    currentSprint = {
        name: 'Sprint 5',
        velocity: 32,
        committed: 15,
        completed: 12,
        carryOver: 2,
        avgCycleTime: 3.2
    },
    previousSprint = {
        name: 'Sprint 4',
        velocity: 28,
        committed: 14,
        completed: 11,
        carryOver: 3,
        avgCycleTime: 4.1
    }
}: SprintRetroProps) {
    const analysis = useMemo(() => {
        const velocityDelta = currentSprint.velocity - previousSprint.velocity
        const velocityPercent = previousSprint.velocity > 0
            ? Math.round((velocityDelta / previousSprint.velocity) * 100)
            : 0

        const cycleTimeDelta = previousSprint.avgCycleTime - currentSprint.avgCycleTime
        const cycleTimeImproved = cycleTimeDelta > 0

        const completionRate = currentSprint.committed > 0
            ? Math.round((currentSprint.completed / currentSprint.committed) * 100)
            : 0

        const prevCompletionRate = previousSprint.committed > 0
            ? Math.round((previousSprint.completed / previousSprint.committed) * 100)
            : 0

        // Generate insights
        const insights: { text: string; type: 'good' | 'bad' | 'neutral' }[] = []

        if (velocityDelta > 0) {
            insights.push({ text: `Velocity up ${velocityPercent}% from last sprint`, type: 'good' })
        } else if (velocityDelta < 0) {
            insights.push({ text: `Velocity down ${Math.abs(velocityPercent)}% from last sprint`, type: 'bad' })
        }

        if (cycleTimeImproved) {
            insights.push({ text: `Cycle time improved by ${cycleTimeDelta.toFixed(1)} days`, type: 'good' })
        }

        if (currentSprint.carryOver > previousSprint.carryOver) {
            insights.push({ text: `More carry-over than last sprint (${currentSprint.carryOver} vs ${previousSprint.carryOver})`, type: 'bad' })
        } else if (currentSprint.carryOver < previousSprint.carryOver) {
            insights.push({ text: `Less carry-over than last sprint`, type: 'good' })
        }

        if (completionRate >= 90) {
            insights.push({ text: `Excellent completion rate: ${completionRate}%`, type: 'good' })
        } else if (completionRate < 70) {
            insights.push({ text: `Low completion rate: ${completionRate}%`, type: 'bad' })
        }

        return {
            velocityDelta,
            velocityPercent,
            isPositive: velocityDelta >= 0,
            insights
        }
    }, [currentSprint, previousSprint])

    if (!currentSprint || !previousSprint) {
        return (
            <Container>
                <Header>
                    <Title>📊 Pit Crew Debrief</Title>
                    <Badge>Retro</Badge>
                </Header>
                <EmptyState>
                    Need at least 2 sprints for comparison.
                </EmptyState>
            </Container>
        )
    }

    return (
        <Container>
            <Header>
                <Title>📊 Pit Crew Debrief</Title>
                <Badge>Retro</Badge>
            </Header>

            <ComparisonGrid>
                <SprintCard $isCurrent={false}>
                    <SprintLabel>Previous</SprintLabel>
                    <SprintName>{previousSprint.name}</SprintName>
                    <MetricRow>
                        <MetricLabel>Velocity</MetricLabel>
                        <MetricValue>{previousSprint.velocity}</MetricValue>
                    </MetricRow>
                    <MetricRow>
                        <MetricLabel>Committed</MetricLabel>
                        <MetricValue>{previousSprint.committed}</MetricValue>
                    </MetricRow>
                    <MetricRow>
                        <MetricLabel>Completed</MetricLabel>
                        <MetricValue>{previousSprint.completed}</MetricValue>
                    </MetricRow>
                    <MetricRow>
                        <MetricLabel>Cycle Time</MetricLabel>
                        <MetricValue>{previousSprint.avgCycleTime}d</MetricValue>
                    </MetricRow>
                </SprintCard>

                <SprintCard $isCurrent={true}>
                    <SprintLabel>Current</SprintLabel>
                    <SprintName>{currentSprint.name}</SprintName>
                    <MetricRow>
                        <MetricLabel>Velocity</MetricLabel>
                        <MetricValue $color={analysis.isPositive ? '#39FF14' : '#FF0033'}>
                            {currentSprint.velocity}
                        </MetricValue>
                    </MetricRow>
                    <MetricRow>
                        <MetricLabel>Committed</MetricLabel>
                        <MetricValue>{currentSprint.committed}</MetricValue>
                    </MetricRow>
                    <MetricRow>
                        <MetricLabel>Completed</MetricLabel>
                        <MetricValue>{currentSprint.completed}</MetricValue>
                    </MetricRow>
                    <MetricRow>
                        <MetricLabel>Cycle Time</MetricLabel>
                        <MetricValue>{currentSprint.avgCycleTime}d</MetricValue>
                    </MetricRow>
                </SprintCard>
            </ComparisonGrid>

            <DeltaIndicator $positive={analysis.isPositive}>
                <DeltaIcon>{analysis.isPositive ? '🚀' : '🔧'}</DeltaIcon>
                <DeltaText $positive={analysis.isPositive}>
                    {analysis.isPositive ? '+' : ''}{analysis.velocityDelta} velocity ({analysis.velocityPercent}%)
                </DeltaText>
            </DeltaIndicator>

            {analysis.insights.length > 0 && (
                <RetroInsights>
                    {analysis.insights.map((insight, idx) => (
                        <InsightItem key={idx} $type={insight.type}>
                            {insight.type === 'good' ? '✓' : insight.type === 'bad' ? '⚠' : '○'} {insight.text}
                        </InsightItem>
                    ))}
                </RetroInsights>
            )}
        </Container>
    )
}
