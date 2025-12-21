import React from 'react'
import styled from 'styled-components'
import { PanelContainer } from '../Layout/PanelContainer'

interface VelocityTrackProps {
    trendData: any
}

const ChartContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  height: 120px;
  padding-top: var(--space-4);
  position: relative;
`

const BarGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  position: relative;
  cursor: pointer;
  
  &:hover > div:first-child {
    background: var(--text-tertiary); /* Highlight */
  }
`

const Bar = styled.div<{ $height: string, $isCurrent?: boolean }>`
  width: 100%;
  height: ${({ $height }) => $height};
  background: ${({ $isCurrent }) => $isCurrent ? 'var(--brand-primary)' : 'var(--color-slate-300)'};
  border-radius: 2px 2px 0 0;
  transition: all 0.3s ease;
  position: relative;

  [data-theme='dark'] & {
    background: ${({ $isCurrent }) => $isCurrent ? 'var(--brand-primary)' : 'var(--color-slate-700)'};
  }
  
  ${({ $isCurrent }) => $isCurrent && `
    box-shadow: var(--shadow-glow);
  `}
`

const Label = styled.div<{ $isCurrent?: boolean }>`
  font-family: var(--font-stack-mono);
  font-size: 9px;
  color: ${({ $isCurrent }) => $isCurrent ? 'var(--brand-primary)' : 'var(--text-tertiary)'};
  text-align: center;
  margin-top: 4px;
  font-weight: 700;
`

const ValueBadge = styled.div`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  font-weight: 700;
  color: var(--text-primary);
  opacity: 0;
  transition: opacity 0.2s;

  ${BarGroup}:hover & {
    opacity: 1;
  }
`

export const VelocityTrack: React.FC<VelocityTrackProps> = ({ trendData }) => {
    // Normalize data for chart height
    const sprints = trendData?.velocityTrend || [] // Expecting array of { sprint: string, value: number }
    const maxVal = Math.max(...sprints.map((s: any) => s.completed || 0), 10)

    return (
        <PanelContainer
            title="Velocity Telemetry"
            action={
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Last 5 Sprints</span>
            }
        >
            <ChartContainer>
                {/* Background Grid Lines */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0, pointerEvents: 'none' }}>
                    <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />
                    <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />
                    <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />
                    <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />
                </div>

                {sprints.map((s: any, i: number) => {
                    const h = Math.max((s.completed / maxVal) * 100, 5) + '%'
                    const isCurrent = i === sprints.length - 1
                    return (
                        <BarGroup key={i}>
                            <ValueBadge>{s.completed}</ValueBadge>
                            <Bar $height={h} $isCurrent={isCurrent} />
                            <Label $isCurrent={isCurrent}>{s.name || `S-${sprints.length - 1 - i}`}</Label>
                        </BarGroup>
                    )
                })}

                {/* Empty state filler if no data */}
                {sprints.length === 0 && (
                    <div style={{ width: '100%', textAlign: 'center', fontSize: 10, color: 'var(--text-tertiary)' }}>No historical data</div>
                )}
            </ChartContainer>
        </PanelContainer>
    )
}
