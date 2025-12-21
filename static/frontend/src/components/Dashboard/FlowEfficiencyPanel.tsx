import React, { useMemo } from 'react'
import styled, { keyframes } from 'styled-components'

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

const Badge = styled.span<{ $efficiency: number }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  padding: 3px 8px;
  border-radius: 4px;
  background: ${({ $efficiency }) =>
    $efficiency >= 40 ? 'rgba(57, 255, 20, 0.2)' :
      $efficiency >= 20 ? 'rgba(244, 208, 63, 0.2)' :
        'rgba(255, 0, 51, 0.2)'};
  color: ${({ $efficiency }) =>
    $efficiency >= 40 ? '#39FF14' :
      $efficiency >= 20 ? '#F4D03F' :
        '#FF0033'};
  text-transform: uppercase;
`

const GaugeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
`

const GaugeOuter = styled.div`
  width: 140px;
  height: 70px;
  position: relative;
  overflow: hidden;
`

const GaugeArc = styled.div`
  width: 140px;
  height: 140px;
  border: 12px solid #2a2a3a;
  border-radius: 50%;
  border-bottom-color: transparent;
  border-left-color: transparent;
  transform: rotate(135deg);
  position: absolute;
  top: 0;
`

const GaugeFill = styled.div<{ $percent: number }>`
  width: 140px;
  height: 140px;
  border: 12px solid transparent;
  border-radius: 50%;
  border-top-color: ${({ $percent }) =>
    $percent >= 40 ? '#39FF14' :
      $percent >= 20 ? '#F4D03F' :
        '#FF0033'};
  border-right-color: ${({ $percent }) =>
    $percent >= 50 ? ($percent >= 40 ? '#39FF14' : $percent >= 20 ? '#F4D03F' : '#FF0033') : 'transparent'};
  transform: rotate(${({ $percent }) => 135 + (Math.min($percent, 100) * 1.8)}deg);
  position: absolute;
  top: 0;
  transition: transform 0.5s ease;
`

const GaugeLabel = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
`

const GaugeValue = styled.div<{ $efficiency: number }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
  font-weight: 700;
  color: ${({ $efficiency }) =>
    $efficiency >= 40 ? '#39FF14' :
      $efficiency >= 20 ? '#F4D03F' :
        '#FF0033'};
`

const GaugeUnit = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
`

const StatsRow = styled.div`
  display: flex;
  gap: 8px;
`

const StatItem = styled.div<{ $color: string }>`
  flex: 1;
  background: ${({ $color }) => $color}10;
  border: 1px solid ${({ $color }) => $color}30;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
`

const StatLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 2px;
`

const StatValue = styled.div<{ $color: string }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: ${({ $color }) => $color};
`

const Explanation = styled.div`
  margin-top: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #888;
  text-align: center;
`

interface StatusTime {
  statusName: string
  category: string
  hours: number
}

interface Issue {
  key: string
  statusTimes?: StatusTime[]
  fields?: {
    [key: string]: any
  }
}

interface FlowEfficiencyProps {
  issues: Issue[]
  statusChangelog?: Map<string, StatusTime[]>
}

export default function FlowEfficiencyPanel({ issues, statusChangelog }: FlowEfficiencyProps) {
  const efficiency = useMemo(() => {
    let totalActiveHours = 0
    let totalWaitHours = 0
    let issuesWithData = 0

    for (const issue of issues) {
      // Try to get status times from issue or changelog
      const times = issue.statusTimes || statusChangelog?.get(issue.key)
      if (!times || times.length === 0) continue

      issuesWithData++

      for (const time of times) {
        const cat = time.category?.toLowerCase() || ''
        // Active = in progress statuses
        // Wait = todo or blocked statuses
        if (cat === 'indeterminate' || cat.includes('progress')) {
          totalActiveHours += time.hours
        } else if (cat === 'new' || cat.includes('todo') || cat.includes('wait') || cat.includes('block')) {
          totalWaitHours += time.hours
        }
      }
    }

    const totalHours = totalActiveHours + totalWaitHours
    const efficiencyPercent = totalHours > 0
      ? Math.round((totalActiveHours / totalHours) * 100)
      : 0

    return {
      activeHours: Math.round(totalActiveHours),
      waitHours: Math.round(totalWaitHours),
      totalHours: Math.round(totalHours),
      percent: efficiencyPercent,
      issuesWithData,
      hasData: issuesWithData > 0
    }
  }, [issues, statusChangelog])

  // No mock data - show real values or indicate no data
  const displayData = efficiency.hasData ? efficiency : {
    activeHours: 0,
    waitHours: 0,
    totalHours: 0,
    percent: 0,
    issuesWithData: 0,
    hasData: false
  }

  const rating = displayData.hasData
    ? (displayData.percent >= 40 ? 'Excellent' :
      displayData.percent >= 20 ? 'Moderate' : 'Needs Improvement')
    : 'No Data'

  return (
    <Container>
      <Header>
        <Title>⚡ Engine Efficiency</Title>
        <Badge $efficiency={displayData.percent}>{rating}</Badge>
      </Header>

      {displayData.hasData ? (
        <>
          <GaugeContainer>
            <GaugeOuter>
              <GaugeArc />
              <GaugeFill $percent={displayData.percent} />
              <GaugeLabel>
                <GaugeValue $efficiency={displayData.percent}>
                  {displayData.percent}%
                </GaugeValue>
                <GaugeUnit>Flow Efficiency</GaugeUnit>
              </GaugeLabel>
            </GaugeOuter>
          </GaugeContainer>

          <StatsRow>
            <StatItem $color="#39FF14">
              <StatLabel>Active Time</StatLabel>
              <StatValue $color="#39FF14">{displayData.activeHours}h</StatValue>
            </StatItem>
            <StatItem $color="#FF8C00">
              <StatLabel>Wait Time</StatLabel>
              <StatValue $color="#FF8C00">{displayData.waitHours}h</StatValue>
            </StatItem>
            <StatItem $color="#8B5CF6">
              <StatLabel>Total Time</StatLabel>
              <StatValue $color="#8B5CF6">{displayData.totalHours}h</StatValue>
            </StatItem>
          </StatsRow>

          <Explanation>
            Active work: {displayData.percent}% of total time in statuses
          </Explanation>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px', color: '#888', fontSize: '11px' }}>
          📊 Flow efficiency requires status changelog data.<br />
          <span style={{ opacity: 0.7 }}>Enable 'expand=changelog' for accurate metrics.</span>
        </div>
      )}
    </Container>
  )
}
