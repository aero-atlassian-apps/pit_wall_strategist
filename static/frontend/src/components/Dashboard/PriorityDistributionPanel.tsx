import React, { useMemo } from 'react'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const Container = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 0, 51, 0.2);
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
  background: rgba(255, 0, 51, 0.2);
  color: #FF0033;
  text-transform: uppercase;
`

const PriorityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
`

const PriorityCard = styled.div<{ $color: string }>`
  background: ${({ $color }) => $color}15;
  border: 1px solid ${({ $color }) => $color}40;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    border-color: ${({ $color }) => $color}80;
  }
`

const PriorityLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
`

const PriorityValue = styled.div<{ $color: string }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 28px;
  font-weight: 700;
  color: ${({ $color }) => $color};
`

const PriorityPercent = styled.div<{ $color: string }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: ${({ $color }) => $color}AA;
`

const ProgressBar = styled.div`
  margin-top: 16px;
  height: 6px;
  background: #2a2a3a;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
`

const ProgressSegment = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ $color }) => $color};
  transition: width 0.5s ease;
`

const Legend = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const LegendDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`

const LegendLabel = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
`

// Priority colors matching F1 tire compounds
const PRIORITY_CONFIG = {
    highest: { label: 'P0 Critical', color: '#FF0033', f1Name: 'Soft' },      // Red - urgent
    high: { label: 'P1 High', color: '#FF8C00', f1Name: 'Medium' },           // Orange
    medium: { label: 'P2 Medium', color: '#F4D03F', f1Name: 'Hard' },         // Yellow
    low: { label: 'P3+ Low', color: '#39FF14', f1Name: 'Inter' }              // Green - safe
}

interface Issue {
    key: string
    fields?: {
        priority?: { name: string }
    }
    priority?: string
}

interface PriorityPanelProps {
    issues: Issue[]
}

function normalizePriority(priority?: string): keyof typeof PRIORITY_CONFIG {
    const p = (priority || '').toLowerCase()
    if (p.includes('highest') || p.includes('critical') || p.includes('blocker') || p === 'p0') return 'highest'
    if (p.includes('high') || p === 'p1') return 'high'
    if (p.includes('low') || p.includes('lowest') || p === 'p3' || p === 'p4') return 'low'
    return 'medium' // Default
}

export default function PriorityDistributionPanel({ issues }: PriorityPanelProps) {
    const distribution = useMemo(() => {
        const counts = { highest: 0, high: 0, medium: 0, low: 0 }

        for (const issue of issues) {
            const priority = issue.fields?.priority?.name || issue.priority || 'Medium'
            const normalized = normalizePriority(priority)
            counts[normalized]++
        }

        const total = issues.length || 1

        return {
            highest: { count: counts.highest, percent: Math.round((counts.highest / total) * 100) },
            high: { count: counts.high, percent: Math.round((counts.high / total) * 100) },
            medium: { count: counts.medium, percent: Math.round((counts.medium / total) * 100) },
            low: { count: counts.low, percent: Math.round((counts.low / total) * 100) },
            total
        }
    }, [issues])

    if (issues.length === 0) {
        return (
            <Container>
                <Header>
                    <Title>🏎️ Tire Strategy</Title>
                    <Badge>Priority Mix</Badge>
                </Header>
                <div style={{ textAlign: 'center', color: '#888', padding: 20 }}>
                    No issues to analyze
                </div>
            </Container>
        )
    }

    return (
        <Container>
            <Header>
                <Title>🏎️ Tire Strategy</Title>
                <Badge>Priority Mix</Badge>
            </Header>

            <PriorityGrid>
                {(['highest', 'high', 'medium', 'low'] as const).map(key => (
                    <PriorityCard key={key} $color={PRIORITY_CONFIG[key].color}>
                        <PriorityLabel>{PRIORITY_CONFIG[key].f1Name}</PriorityLabel>
                        <PriorityValue $color={PRIORITY_CONFIG[key].color}>
                            {distribution[key].count}
                        </PriorityValue>
                        <PriorityPercent $color={PRIORITY_CONFIG[key].color}>
                            {distribution[key].percent}%
                        </PriorityPercent>
                    </PriorityCard>
                ))}
            </PriorityGrid>

            <ProgressBar>
                <ProgressSegment $width={distribution.highest.percent} $color={PRIORITY_CONFIG.highest.color} />
                <ProgressSegment $width={distribution.high.percent} $color={PRIORITY_CONFIG.high.color} />
                <ProgressSegment $width={distribution.medium.percent} $color={PRIORITY_CONFIG.medium.color} />
                <ProgressSegment $width={distribution.low.percent} $color={PRIORITY_CONFIG.low.color} />
            </ProgressBar>

            <Legend>
                {(['highest', 'high', 'medium', 'low'] as const).map(key => (
                    <LegendItem key={key}>
                        <LegendDot $color={PRIORITY_CONFIG[key].color} />
                        <LegendLabel>{PRIORITY_CONFIG[key].label}</LegendLabel>
                    </LegendItem>
                ))}
            </Legend>
        </Container>
    )
}
