import React from 'react'
import styled from 'styled-components'

const SparklineContainer = styled.div`display:flex; flex-direction:column; gap:${({ theme }) => (theme as any).spacing.xs}`
const SparklineLabel = styled.div`display:flex; justify-content:space-between; align-items:center`
const LabelText = styled.span`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:9px; text-transform:uppercase; letter-spacing:1px; color:${({ theme }) => (theme as any).colors.textMuted}`
const TrendIndicator = styled.span<{ $direction: 'up' | 'down' | 'stable' }>`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:10px; font-weight:600; color:${({ $direction, theme }) => ($direction === 'up' ? (theme as any).colors.redAlert : $direction === 'down' ? (theme as any).colors.greenPace : (theme as any).colors.textMuted)}`
const ChartContainer = styled.div`display:flex; align-items:flex-end; gap:2px; height:32px; padding: ${({ theme }) => (theme as any).spacing.xs} 0`
const Bar = styled.div<{ $isLast?: boolean; $direction: 'up' | 'down' | 'stable' }>`flex:1; min-width:8px; background:${({ $isLast, $direction, theme }) => ($isLast ? ($direction === 'up' ? (theme as any).colors.redAlert : $direction === 'down' ? (theme as any).colors.greenPace : (theme as any).colors.purpleSector) : (theme as any).colors.border)}; border-radius:2px; transition:all .3s ease; position:relative; &:hover{background:${({ theme }) => (theme as any).colors.purpleSector}}`
const BarTooltip = styled.div`position:absolute; bottom:100%; left:50%; transform:translateX(-50%); background:${({ theme }) => (theme as any).colors.bgMain}; border:1px solid ${({ theme }) => (theme as any).colors.border}; border-radius:4px; padding:2px 6px; font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:9px; color:${({ theme }) => (theme as any).colors.textPrimary}; white-space:nowrap; opacity:0; pointer-events:none; transition:opacity .2s; ${Bar}:hover & { opacity: 1 }`

function Sparkline({ data = [], label = 'Trend', direction = 'stable', change = 0, showChange = true, invertColors = false }: { data?: Array<{ dayLabel: string; value: number }>; label?: string; direction?: 'up' | 'down' | 'stable'; change?: number; showChange?: boolean; invertColors?: boolean }) {
  if (!data || data.length === 0) return null
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const displayDirection = invertColors ? (direction === 'up' ? 'down' : direction === 'down' ? 'up' : 'stable') : direction
  return (
    <SparklineContainer>
      <SparklineLabel>
        <LabelText>{label}</LabelText>
        {showChange && (<TrendIndicator $direction={displayDirection as any}>{direction === 'up' ? '▲' : direction === 'down' ? '▼' : '→'}{Math.abs(change)}%</TrendIndicator>)}
      </SparklineLabel>
      <ChartContainer>
        {data.map((point, index) => (
          <Bar key={index} $isLast={index === data.length - 1} $direction={displayDirection as any} style={{ height: `${(point.value / maxValue) * 100}%` }}>
            <BarTooltip>{point.dayLabel}: {point.value}</BarTooltip>
          </Bar>
        ))}
      </ChartContainer>
    </SparklineContainer>
  )
}

export default Sparkline
