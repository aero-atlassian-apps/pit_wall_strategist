import React, { useMemo } from 'react'
import styled, { keyframes } from 'styled-components'

const pulse = keyframes`0%, 100% { opacity: 1; } 50% { opacity: 0.6; }`
const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const Container = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 140, 0, 0.2);
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

const Badge = styled.span<{ $warning: boolean }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  padding: 3px 8px;
  border-radius: 4px;
  background: ${({ $warning }) => $warning ? 'rgba(255, 0, 51, 0.2)' : 'rgba(57, 255, 20, 0.2)'};
  color: ${({ $warning }) => $warning ? '#FF0033' : '#39FF14'};
  text-transform: uppercase;
  ${({ $warning }) => $warning && `animation: ${pulse} 2s infinite;`}
`

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
`

const StatCard = styled.div<{ $color: string }>`
  flex: 1;
  background: ${({ $color }) => $color}15;
  border: 1px solid ${({ $color }) => $color}40;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`

const StatLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 4px;
`

const StatValue = styled.div<{ $color: string }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  color: ${({ $color }) => $color};
`

const CreepMeter = styled.div`
  margin-bottom: 12px;
`

const MeterLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
`

const MeterText = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #888;
`

const MeterPercent = styled.span<{ $danger: boolean }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  color: ${({ $danger }) => $danger ? '#FF0033' : '#39FF14'};
`

const MeterBar = styled.div`
  height: 10px;
  background: #2a2a3a;
  border-radius: 5px;
  overflow: hidden;
  display: flex;
`

const MeterSegment = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ $color }) => $color};
`

const AddedIssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const AddedIssue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 140, 0, 0.1);
  border: 1px solid rgba(255, 140, 0, 0.2);
  border-radius: 6px;
`

const IssueKey = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  color: #FF8C00;
`

const IssueSummary = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #ccc;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const DaysAgo = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: #39FF14;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
`

interface Issue {
    key: string
    summary?: string
    created?: string
    fields?: {
        summary?: string
        created?: string
    }
}

interface ScopeCreepProps {
    issues: Issue[]
    sprintStartDate?: string | Date
}

export default function ScopeCreepIndicator({ issues, sprintStartDate }: ScopeCreepProps) {
    const analysis = useMemo(() => {
        // Default sprint start: 14 days ago if not provided
        const sprintStart = sprintStartDate
            ? new Date(sprintStartDate)
            : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

        const now = new Date()

        // Categorize issues
        const original: Issue[] = []
        const added: (Issue & { daysAgo: number })[] = []

        for (const issue of issues) {
            const createdStr = issue.created || issue.fields?.created
            if (!createdStr) {
                original.push(issue)
                continue
            }

            const created = new Date(createdStr)

            if (created < sprintStart) {
                original.push(issue)
            } else {
                const daysAgo = Math.round((now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000))
                added.push({ ...issue, daysAgo })
            }
        }

        const totalOriginal = original.length
        const totalAdded = added.length
        const total = totalOriginal + totalAdded
        const creepPercent = total > 0 ? Math.round((totalAdded / total) * 100) : 0
        const isWarning = creepPercent > 20

        return {
            original: original.length,
            added: added.sort((a, b) => a.daysAgo - b.daysAgo),
            totalAdded,
            total,
            creepPercent,
            isWarning
        }
    }, [issues, sprintStartDate])

    return (
        <Container>
            <Header>
                <Title>🔧 Pit Stop Additions</Title>
                <Badge $warning={analysis.isWarning}>
                    {analysis.isWarning ? 'Scope Alert' : 'On Track'}
                </Badge>
            </Header>

            <StatsRow>
                <StatCard $color="#8B5CF6">
                    <StatLabel>Original</StatLabel>
                    <StatValue $color="#8B5CF6">{analysis.original}</StatValue>
                </StatCard>
                <StatCard $color="#FF8C00">
                    <StatLabel>Added</StatLabel>
                    <StatValue $color="#FF8C00">{analysis.totalAdded}</StatValue>
                </StatCard>
                <StatCard $color={analysis.isWarning ? '#FF0033' : '#39FF14'}>
                    <StatLabel>Creep %</StatLabel>
                    <StatValue $color={analysis.isWarning ? '#FF0033' : '#39FF14'}>
                        {analysis.creepPercent}%
                    </StatValue>
                </StatCard>
            </StatsRow>

            <CreepMeter>
                <MeterLabel>
                    <MeterText>Scope Composition</MeterText>
                    <MeterPercent $danger={analysis.isWarning}>
                        {analysis.isWarning ? '⚠️ Over 20% added' : '✓ Healthy'}
                    </MeterPercent>
                </MeterLabel>
                <MeterBar>
                    <MeterSegment $width={100 - analysis.creepPercent} $color="#8B5CF6" />
                    <MeterSegment $width={analysis.creepPercent} $color="#FF8C00" />
                </MeterBar>
            </CreepMeter>

            {analysis.added.length > 0 ? (
                <AddedIssuesList>
                    {analysis.added.slice(0, 4).map(issue => (
                        <AddedIssue key={issue.key}>
                            <IssueKey>{issue.key}</IssueKey>
                            <IssueSummary>
                                {(issue.summary || issue.fields?.summary || '').slice(0, 30)}...
                            </IssueSummary>
                            <DaysAgo>{issue.daysAgo}d ago</DaysAgo>
                        </AddedIssue>
                    ))}
                    {analysis.added.length > 4 && (
                        <DaysAgo style={{ textAlign: 'center', display: 'block', marginTop: 4 }}>
                            +{analysis.added.length - 4} more added mid-sprint
                        </DaysAgo>
                    )}
                </AddedIssuesList>
            ) : (
                <EmptyState>
                    🏆 No scope creep detected!
                    <br />
                    Clean sprint discipline.
                </EmptyState>
            )}
        </Container>
    )
}
