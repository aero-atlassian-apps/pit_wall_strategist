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

const EpicList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const EpicItem = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
`

const EpicHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const EpicKey = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  color: #8B5CF6;
`

const EpicSummary = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #ccc;
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ProgressBar = styled.div`
  height: 8px;
  background: #2a2a3a;
  border-radius: 4px;
  overflow: hidden;
`

const ProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: ${({ $percent }) =>
        $percent >= 80 ? 'linear-gradient(90deg, #39FF14, #00FF88)' :
            $percent >= 50 ? 'linear-gradient(90deg, #F4D03F, #FFD700)' :
                'linear-gradient(90deg, #FF0033, #FF6B6B)'};
  border-radius: 4px;
  transition: width 0.5s ease;
`

const ProgressStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
`

const ProgressLabel = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
`

const ProgressPercent = styled.span<{ $percent: number }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  color: ${({ $percent }) =>
        $percent >= 80 ? '#39FF14' :
            $percent >= 50 ? '#F4D03F' :
                '#FF6B6B'};
`

const EmptyState = styled.div`
  text-align: center;
  padding: 30px 20px;
  color: #888;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
`

interface Issue {
    key: string
    summary?: string
    statusCategory?: string
    parent?: string
    epicKey?: string
    fields?: {
        summary?: string
        status?: { statusCategory?: { key: string } }
        parent?: { key: string; fields?: { summary?: string } }
        [key: string]: any
    }
}

interface EpicProgressProps {
    issues: Issue[]
    epicLinkField?: string
}

interface EpicData {
    key: string
    summary: string
    total: number
    done: number
    percent: number
}

export default function EpicProgressPanel({ issues, epicLinkField }: EpicProgressProps) {
    // Group issues by epic/parent and calculate progress
    const epics = useMemo(() => {
        const epicMap = new Map<string, EpicData>()

        for (const issue of issues) {
            // Try multiple ways to find parent/epic
            let parentKey: string | undefined
            let parentSummary: string | undefined

            // 1. Built-in parent field (next-gen projects)
            if (issue.fields?.parent?.key) {
                parentKey = issue.fields.parent.key
                parentSummary = issue.fields.parent.fields?.summary
            }
            // 2. Epic Link custom field
            else if (epicLinkField && issue.fields?.[epicLinkField]) {
                parentKey = issue.fields[epicLinkField]
            }
            // 3. Direct parent property (simplified)
            else if (issue.parent) {
                parentKey = issue.parent
            }
            // 4. Direct epicKey property
            else if (issue.epicKey) {
                parentKey = issue.epicKey
            }

            if (!parentKey) continue

            const statusCat = issue.statusCategory || issue.fields?.status?.statusCategory?.key || 'new'
            const isDone = statusCat === 'done'

            if (!epicMap.has(parentKey)) {
                epicMap.set(parentKey, {
                    key: parentKey,
                    summary: parentSummary || parentKey,
                    total: 0,
                    done: 0,
                    percent: 0
                })
            }

            const epic = epicMap.get(parentKey)!
            epic.total++
            if (isDone) epic.done++
            epic.percent = Math.round((epic.done / epic.total) * 100)
        }

        return Array.from(epicMap.values())
            .sort((a, b) => b.total - a.total) // Most issues first
            .slice(0, 5) // Top 5
    }, [issues, epicLinkField])

    if (epics.length === 0) {
        return (
            <Container>
                <Header>
                    <Title>📊 Championship Standings</Title>
                    <Badge>Epic Progress</Badge>
                </Header>
                <EmptyState>
                    No epics/parent issues detected.
                    <br />
                    Link issues to epics to track progress.
                </EmptyState>
            </Container>
        )
    }

    return (
        <Container>
            <Header>
                <Title>📊 Championship Standings</Title>
                <Badge>Epic Progress</Badge>
            </Header>

            <EpicList>
                {epics.map(epic => (
                    <EpicItem key={epic.key}>
                        <EpicHeader>
                            <EpicKey>{epic.key}</EpicKey>
                        </EpicHeader>
                        <EpicSummary title={epic.summary}>
                            {epic.summary.slice(0, 40)}{epic.summary.length > 40 ? '...' : ''}
                        </EpicSummary>
                        <ProgressBar>
                            <ProgressFill $percent={epic.percent} />
                        </ProgressBar>
                        <ProgressStats>
                            <ProgressLabel>{epic.done}/{epic.total} issues done</ProgressLabel>
                            <ProgressPercent $percent={epic.percent}>{epic.percent}%</ProgressPercent>
                        </ProgressStats>
                    </EpicItem>
                ))}
            </EpicList>
        </Container>
    )
}
