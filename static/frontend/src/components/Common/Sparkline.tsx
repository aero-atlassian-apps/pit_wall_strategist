import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Label = styled.span`
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
`

const Value = styled.span<{ $up: boolean }>`
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: ${({ $up }) => $up ? 'var(--color-success)' : 'var(--color-danger)'};
  display: flex;
  align-items: center;
  gap: 2px;
`

const SvgContainer = styled.svg`
  width: 100%;
  height: 32px;
  overflow: visible;
`

function Sparkline({
  data = [],
  label = 'Trend',
  direction = 'stable',
  change = 0,
  showChange = true,
  invertColors = false
}: {
  data?: Array<{ dayLabel: string; value: number }>;
  label?: string;
  direction?: 'up' | 'down' | 'stable';
  change?: number;
  showChange?: boolean;
  invertColors?: boolean
}) {
  if (!data || data.length === 0) return null

  // Calculate layout
  const width = 100
  const height = 32
  const barWidth = width / data.length
  const gap = 2
  const effectiveBarWidth = Math.max(1, barWidth - gap)

  const maxValue = Math.max(...data.map(d => d.value), 1)

  // Color logic
  // If invertColors is true: Up/Higher is BAD (Red), Down/Lower is GOOD (Green)
  // Else: Up/Higher is GOOD (Green), Down/Lower is BAD (Red)

  const isGood = invertColors ? direction === 'down' : direction === 'up'
  const trendColor = isGood ? 'var(--color-success)' : direction === 'stable' ? 'var(--text-tertiary)' : 'var(--color-danger)'

  // Bar colors: Last bar gets the trend color, others are neutral
  const getBarColor = (index: number) => {
    if (index === data.length - 1) return trendColor
    return 'var(--border)' // Neutral history
  }

  return (
    <Container>
      <Header>
        <Label>{label}</Label>
        {showChange && (
          <Value $up={isGood}>
            {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '→'}
            {Math.abs(change)}%
          </Value>
        )}
      </Header>
      <SvgContainer viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * height
          const y = height - barHeight
          const x = i * barWidth

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={effectiveBarWidth}
              height={barHeight}
              fill={getBarColor(i)}
              rx={1}
            >
              <title>{d.dayLabel}: {d.value}</title>
            </rect>
          )
        })}
      </SvgContainer>
    </Container>
  )
}

export default Sparkline
