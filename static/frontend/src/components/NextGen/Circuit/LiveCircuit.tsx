import React from 'react'
import styled from 'styled-components'
import { PanelContainer } from '../Layout/PanelContainer'

interface Issue {
  key: string
  statusCategory: 'TODO' | 'IN_PROGRESS' | 'DONE'
  assignee?: { accountId: string, displayName: string, avatarUrl: string }
}

interface CircuitProps {
  issues: Issue[]
  columns?: string[]
}

const TrackContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`

const SvgTrack = styled.svg`
  width: 100%;
  height: 100%;
  max-width: 600px;
`

const SectorLabel = styled.div<{ $left?: string, $top?: string, $color: string }>`
  position: absolute;
  left: ${({ $left }) => $left};
  top: ${({ $top }) => $top};
  font-family: var(--font-stack-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ $color }) => $color};
  background: var(--bg-surface-subtle);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid ${({ $color }) => $color};
`

export const LiveCircuit: React.FC<CircuitProps> = ({ issues }) => {
  // Group issues by sector
  const todo = issues.filter(i => i.statusCategory === 'TODO')
  const wip = issues.filter(i => i.statusCategory === 'IN_PROGRESS')
  const done = issues.filter(i => i.statusCategory === 'DONE')

  // Calculate "heat" or density on the track segments
  // This is a simplified visual mapping

  return (
    <PanelContainer
      title="Live Circuit"
      action={
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
          LAP 12/14
        </span>
      }
    >
      <TrackContainer>
        {/* Background Track */}
        <SvgTrack viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-slate-300)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--color-slate-300)" stopOpacity="0.2" />
            </linearGradient>
            <marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
              <circle cx="5" cy="5" r="5" fill="var(--text-secondary)" />
            </marker>
          </defs>

          {/* Main Path: S-Curve */}
          <path
            d="M20,160 C80,160 80,40 200,40 C320,40 320,160 380,160"
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="24"
            strokeLinecap="round"
          />

          {/* Active Path (simulating grooved line) */}
          <path
            d="M20,160 C80,160 80,40 200,40 C320,40 320,160 380,160"
            fill="none"
            stroke="var(--border-focus)"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Sectors Visualization (Dots) */}
          {/* Sector 1: TODO (Start) */}
          {todo.length > 0 && (
            <circle cx="50" cy="140" r={Math.min(10 + todo.length * 2, 24)} fill="var(--color-slate-400)" opacity="0.8" />
          )}

          {/* Sector 2: WIP (Middle Apex) */}
          {wip.length > 0 && (
            <circle cx="200" cy="40" r={Math.min(10 + wip.length * 2, 30)} fill="var(--brand-primary)" opacity="0.8">
              <animate attributeName="r" values="30;32;30" dur="2s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Sector 3: DONE (Finish) */}
          {done.length > 0 && (
            <circle cx="350" cy="140" r={Math.min(10 + done.length * 2, 24)} fill="var(--status-success)" opacity="0.8" />
          )}

        </SvgTrack>

        {/* Labels positioned absolutely over the SVG */}
        <SectorLabel $left="10%" $top="70%" $color="var(--color-slate-500)">
          S1: TO DO ({todo.length})
        </SectorLabel>

        <SectorLabel $left="45%" $top="10%" $color="var(--brand-primary)">
          S2: WIP ({wip.length})
        </SectorLabel>

        <SectorLabel $left="80%" $top="70%" $color="var(--status-success)">
          S3: DONE ({done.length})
        </SectorLabel>

      </TrackContainer>
    </PanelContainer>
  )
}
