import React, { useMemo } from 'react'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const Container = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(138, 43, 226, 0.3);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const Title = styled.h3`
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`

const StatCard = styled.div<{ $color: string }>`
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
  font-size: 24px;
  font-weight: 700;
  color: ${({ $color }) => $color};
`

const TicketList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TicketItem = styled.div<{ $isStalled: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: ${({ $isStalled }) => $isStalled ? 'rgba(255, 0, 51, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${({ $isStalled }) => $isStalled ? 'rgba(255, 0, 51, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`

const TicketKey = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #8B5CF6;
  min-width: 80px;
`

const TicketSummary = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #ccc;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const TicketStatus = styled.span<{ $category: string }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  padding: 3px 8px;
  border-radius: 4px;
  background: ${({ $category }) => {
        switch ($category) {
            case 'done': return 'rgba(57, 255, 20, 0.2)'
            case 'indeterminate': return 'rgba(244, 208, 63, 0.2)'
            default: return 'rgba(136, 136, 136, 0.2)'
        }
    }};
  color: ${({ $category }) => {
        switch ($category) {
            case 'done': return '#39FF14'
            case 'indeterminate': return '#F4D03F'
            default: return '#888'
        }
    }};
`

const StalledBadge = styled.span`
  font-size: 10px;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #888;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
`

interface Issue {
    key: string
    summary?: string
    status?: string
    statusCategory?: string
    isStalled?: boolean
    fields?: {
        summary?: string
        status?: { name: string; statusCategory?: { key: string } }
        assignee?: { displayName: string; accountId: string }
    }
}

interface MyPitStopProps {
    issues: Issue[]
    currentUserAccountId?: string
    currentUserName?: string
}

export default function MyPitStopPanel({ issues, currentUserAccountId, currentUserName }: MyPitStopProps) {
    // Filter to current user's issues
    const myIssues = useMemo(() => {
        if (!currentUserAccountId && !currentUserName) return issues

        return issues.filter(issue => {
            const assigneeId = issue.fields?.assignee?.accountId
            const assigneeName = issue.fields?.assignee?.displayName

            return (
                (currentUserAccountId && assigneeId === currentUserAccountId) ||
                (currentUserName && assigneeName?.toLowerCase().includes(currentUserName.toLowerCase()))
            )
        })
    }, [issues, currentUserAccountId, currentUserName])

    // Calculate personal stats
    const stats = useMemo(() => {
        const total = myIssues.length
        const inProgress = myIssues.filter(i => {
            const cat = i.statusCategory || i.fields?.status?.statusCategory?.key
            return cat === 'indeterminate'
        }).length
        const done = myIssues.filter(i => {
            const cat = i.statusCategory || i.fields?.status?.statusCategory?.key
            return cat === 'done'
        }).length
        const stalled = myIssues.filter(i => i.isStalled).length

        return { total, inProgress, done, stalled }
    }, [myIssues])

    if (myIssues.length === 0) {
        return (
            <Container>
                <Header>
                    <Title>🏎️ My Pit Stop</Title>
                    <Badge>Personal</Badge>
                </Header>
                <EmptyState>
                    No tickets assigned to you in this sprint.
                    <br />
                    Time to take on some work!
                </EmptyState>
            </Container>
        )
    }

    return (
        <Container>
            <Header>
                <Title>🏎️ My Pit Stop</Title>
                <Badge>Personal</Badge>
            </Header>

            <StatsGrid>
                <StatCard $color="#8B5CF6">
                    <StatLabel>Assigned</StatLabel>
                    <StatValue $color="#8B5CF6">{stats.total}</StatValue>
                </StatCard>
                <StatCard $color="#F4D03F">
                    <StatLabel>In Progress</StatLabel>
                    <StatValue $color="#F4D03F">{stats.inProgress}</StatValue>
                </StatCard>
                <StatCard $color="#39FF14">
                    <StatLabel>Completed</StatLabel>
                    <StatValue $color="#39FF14">{stats.done}</StatValue>
                </StatCard>
            </StatsGrid>

            <TicketList>
                {myIssues.slice(0, 8).map(issue => {
                    const status = issue.status || issue.fields?.status?.name || 'Unknown'
                    const category = issue.statusCategory || issue.fields?.status?.statusCategory?.key || 'new'
                    const summary = issue.summary || issue.fields?.summary || ''

                    return (
                        <TicketItem key={issue.key} $isStalled={!!issue.isStalled}>
                            <TicketKey>{issue.key}</TicketKey>
                            <TicketSummary title={summary}>
                                {summary.slice(0, 50)}{summary.length > 50 ? '...' : ''}
                            </TicketSummary>
                            <TicketStatus $category={category}>{status}</TicketStatus>
                            {issue.isStalled && <StalledBadge>🚨</StalledBadge>}
                        </TicketItem>
                    )
                })}
                {myIssues.length > 8 && (
                    <EmptyState style={{ padding: '8px' }}>
                        +{myIssues.length - 8} more tickets
                    </EmptyState>
                )}
            </TicketList>
        </Container>
    )
}
