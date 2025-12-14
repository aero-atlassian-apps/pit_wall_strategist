import React, { useMemo } from 'react'
import styled, { keyframes } from 'styled-components'

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const Container = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(57, 255, 20, 0.2);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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
  background: rgba(57, 255, 20, 0.2);
  color: #39FF14;
  text-transform: uppercase;
`

const StagesContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
`

const Stage = styled.div<{ $active: boolean; $complete: boolean }>`
  flex: 1;
  padding: 10px 8px;
  background: ${({ $complete, $active }) =>
        $complete ? 'rgba(57, 255, 20, 0.2)' :
            $active ? 'rgba(244, 208, 63, 0.2)' :
                'rgba(136, 136, 136, 0.1)'};
  border: 1px solid ${({ $complete, $active }) =>
        $complete ? 'rgba(57, 255, 20, 0.4)' :
            $active ? 'rgba(244, 208, 63, 0.4)' :
                'rgba(136, 136, 136, 0.2)'};
  border-radius: 6px;
  text-align: center;
  transition: all 0.3s ease;
  ${({ $active }) => $active && `animation: ${pulse} 2s infinite;`}
`

const StageName = styled.div<{ $complete: boolean; $active: boolean }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: ${({ $complete, $active }) =>
        $complete ? '#39FF14' :
            $active ? '#F4D03F' :
                '#888'};
  text-transform: uppercase;
  margin-bottom: 4px;
`

const StageCount = styled.div<{ $complete: boolean; $active: boolean }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 700;
  color: ${({ $complete, $active }) =>
        $complete ? '#39FF14' :
            $active ? '#F4D03F' :
                '#ccc'};
`

const OverallProgress = styled.div`
  margin-top: 12px;
`

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
`

const ProgressText = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #888;
`

const ProgressPercent = styled.span<{ $percent: number }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  color: ${({ $percent }) =>
        $percent >= 80 ? '#39FF14' :
            $percent >= 50 ? '#F4D03F' :
                '#FF0033'};
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

const TestingAlert = styled.div<{ $hasIssues: boolean }>`
  margin-top: 12px;
  padding: 8px 12px;
  background: ${({ $hasIssues }) => $hasIssues ? 'rgba(255, 0, 51, 0.1)' : 'rgba(57, 255, 20, 0.1)'};
  border: 1px solid ${({ $hasIssues }) => $hasIssues ? 'rgba(255, 0, 51, 0.3)' : 'rgba(57, 255, 20, 0.3)'};
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: ${({ $hasIssues }) => $hasIssues ? '#FF6B6B' : '#39FF14'};
  display: ${({ $hasIssues }) => 'flex'};
  align-items: center;
  gap: 8px;
`

interface Issue {
    key: string
    status?: string
    statusCategory?: string
    fields?: {
        status?: { name: string; statusCategory?: { key: string } }
    }
}

interface TestingProgressProps {
    issues: Issue[]
}

function getStage(issue: Issue): 'todo' | 'dev' | 'testing' | 'done' {
    const statusCat = issue.statusCategory || issue.fields?.status?.statusCategory?.key
    const statusName = (issue.status || issue.fields?.status?.name || '').toLowerCase()

    if (statusCat === 'done') return 'done'
    if (statusCat === 'new') return 'todo'

    // Check for testing-specific statuses
    if (
        statusName.includes('test') ||
        statusName.includes('qa') ||
        statusName.includes('review') ||
        statusName.includes('verify')
    ) return 'testing'

    return 'dev'
}

export default function TestingProgressPanel({ issues }: TestingProgressProps) {
    const stages = useMemo(() => {
        const counts = { todo: 0, dev: 0, testing: 0, done: 0 }

        for (const issue of issues) {
            const stage = getStage(issue)
            counts[stage]++
        }

        const total = issues.length || 1
        const completed = counts.done
        const inTesting = counts.testing
        const percentComplete = Math.round((completed / total) * 100)
        const percentTested = Math.round(((completed + inTesting) / total) * 100)

        return { ...counts, total, percentComplete, percentTested }
    }, [issues])

    if (issues.length === 0) {
        return (
            <Container>
                <Header>
                    <Title>🏁 Pit Lane Progress</Title>
                    <Badge>QA Status</Badge>
                </Header>
                <div style={{ textAlign: 'center', color: '#888', padding: 20 }}>
                    No issues to track
                </div>
            </Container>
        )
    }

    const hasTestingBacklog = stages.testing > 3

    return (
        <Container>
            <Header>
                <Title>🏁 Pit Lane Progress</Title>
                <Badge>QA Status</Badge>
            </Header>

            <StagesContainer>
                <Stage $active={false} $complete={false}>
                    <StageName $active={false} $complete={false}>Garage</StageName>
                    <StageCount $active={false} $complete={false}>{stages.todo}</StageCount>
                </Stage>
                <Stage $active={stages.dev > 0} $complete={false}>
                    <StageName $active={stages.dev > 0} $complete={false}>On Track</StageName>
                    <StageCount $active={stages.dev > 0} $complete={false}>{stages.dev}</StageCount>
                </Stage>
                <Stage $active={stages.testing > 0} $complete={false}>
                    <StageName $active={stages.testing > 0} $complete={false}>Pit Stop</StageName>
                    <StageCount $active={stages.testing > 0} $complete={false}>{stages.testing}</StageCount>
                </Stage>
                <Stage $active={false} $complete={stages.done > 0}>
                    <StageName $active={false} $complete={stages.done > 0}>Finish</StageName>
                    <StageCount $active={false} $complete={stages.done > 0}>{stages.done}</StageCount>
                </Stage>
            </StagesContainer>

            <OverallProgress>
                <ProgressLabel>
                    <ProgressText>Race Completion</ProgressText>
                    <ProgressPercent $percent={stages.percentComplete}>
                        {stages.percentComplete}% ({stages.done}/{stages.total})
                    </ProgressPercent>
                </ProgressLabel>
                <ProgressBar>
                    <ProgressFill $percent={stages.percentComplete} />
                </ProgressBar>
            </OverallProgress>

            {hasTestingBacklog && (
                <TestingAlert $hasIssues={true}>
                    ⚠️ {stages.testing} issues in Pit Stop (Testing) - QA bottleneck detected
                </TestingAlert>
            )}

            {stages.percentComplete === 100 && (
                <TestingAlert $hasIssues={false}>
                    🏆 Checkered Flag! All issues complete!
                </TestingAlert>
            )}
        </Container>
    )
}
