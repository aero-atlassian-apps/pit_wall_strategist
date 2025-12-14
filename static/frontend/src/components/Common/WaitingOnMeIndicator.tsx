import React, { useMemo } from 'react'
import styled, { keyframes } from 'styled-components'

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 140, 0, 0.1);
  border: 1px solid rgba(255, 140, 0, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 140, 0, 0.2);
    border-color: rgba(255, 140, 0, 0.5);
  }
`

const IconWrapper = styled.div<{ $hasItems: boolean }>`
  font-size: 16px;
  ${({ $hasItems }) => $hasItems && `animation: ${pulse} 2s infinite;`}
`

const Count = styled.span<{ $hasItems: boolean }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: ${({ $hasItems }) => $hasItems ? '#FF8C00' : '#888'};
`

const Label = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
`

const Tooltip = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  padding: 12px;
  background: #1a1a2e;
  border: 1px solid rgba(255, 140, 0, 0.4);
  border-radius: 8px;
  min-width: 280px;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
`

const TooltipHeader = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #FF8C00;
  margin-bottom: 8px;
  text-transform: uppercase;
`

const TicketList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`

const TicketItem = styled.li`
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`

const TicketKey = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #FF8C00;
  margin-right: 8px;
`

const TicketSummary = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #ccc;
`

const WaitingReason = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
  margin-top: 2px;
`

const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`

interface Issue {
    key: string
    summary?: string
    status?: string
    assignee?: string
    labels?: string[]
    isStalled?: boolean
    fields?: {
        summary?: string
        status?: { name: string }
        assignee?: { displayName: string }
        labels?: string[]
    }
}

interface WaitingOnMeProps {
    issues: Issue[]
    currentUserName: string
}

function isWaitingOnUser(issue: Issue, userName: string): { waiting: boolean; reason: string } {
    const labels = issue.labels || issue.fields?.labels || []
    const summary = (issue.summary || issue.fields?.summary || '').toLowerCase()
    const status = (issue.status || issue.fields?.status?.name || '').toLowerCase()
    const assignee = (issue.assignee || issue.fields?.assignee?.displayName || '').toLowerCase()
    const userLower = userName.toLowerCase()

    // Check if user is mentioned in labels as blocker
    if (labels.some(l => l.toLowerCase().includes('waiting') && l.toLowerCase().includes(userLower))) {
        return { waiting: true, reason: 'Tagged as waiting on you' }
    }

    // Check if issue mentions user and is blocked
    if ((summary.includes(userLower) || summary.includes(userName.split(' ')[0].toLowerCase())) &&
        (status.includes('block') || status.includes('waiting') || labels.some(l => l.toLowerCase().includes('block')))) {
        return { waiting: true, reason: 'Mentioned in blocked ticket' }
    }

    // Check if issue is in review and assigned to someone else but user is original author
    // This is a heuristic - in real implementation would check reporter field
    if (status.includes('review') && !assignee.includes(userLower)) {
        return { waiting: true, reason: 'Your ticket awaiting review' }
    }

    // Check for explicit "waiting on X" labels
    if (labels.some(l => {
        const lower = l.toLowerCase()
        return lower === `waiting-${userLower}` || lower === `blocked-by-${userLower}`
    })) {
        return { waiting: true, reason: 'Explicitly blocked by you' }
    }

    return { waiting: false, reason: '' }
}

export default function WaitingOnMeIndicator({ issues, currentUserName }: WaitingOnMeProps) {
    const [showTooltip, setShowTooltip] = React.useState(false)

    const waitingIssues = useMemo(() => {
        return issues
            .map(issue => {
                const result = isWaitingOnUser(issue, currentUserName)
                return result.waiting ? { ...issue, waitingReason: result.reason } : null
            })
            .filter(Boolean) as (Issue & { waitingReason: string })[]
    }, [issues, currentUserName])

    const hasItems = waitingIssues.length > 0

    return (
        <Wrapper
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <Container>
                <IconWrapper $hasItems={hasItems}>
                    {hasItems ? '⏳' : '✅'}
                </IconWrapper>
                <Count $hasItems={hasItems}>{waitingIssues.length}</Count>
                <Label>Waiting on you</Label>
            </Container>

            {showTooltip && waitingIssues.length > 0 && (
                <Tooltip>
                    <TooltipHeader>🚦 Tickets Blocked by You</TooltipHeader>
                    <TicketList>
                        {waitingIssues.slice(0, 5).map(issue => (
                            <TicketItem key={issue.key}>
                                <TicketKey>{issue.key}</TicketKey>
                                <TicketSummary>
                                    {(issue.summary || issue.fields?.summary || '').slice(0, 40)}
                                    {(issue.summary || issue.fields?.summary || '').length > 40 ? '...' : ''}
                                </TicketSummary>
                                <WaitingReason>{issue.waitingReason}</WaitingReason>
                            </TicketItem>
                        ))}
                        {waitingIssues.length > 5 && (
                            <TicketItem>
                                <TicketSummary>+{waitingIssues.length - 5} more...</TicketSummary>
                            </TicketItem>
                        )}
                    </TicketList>
                </Tooltip>
            )}
        </Wrapper>
    )
}
