import React, { useState } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { PanelContainer } from '../NextGen/Layout/PanelContainer'
import { t, tPop } from '../../i18n'

// --- Animations ---
const pulseRed = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`

// --- Styled Components ---

const CircuitContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  position: relative;
`

// Background Curve SVG
const BackgroundTrack = styled.svg`
  position: absolute;
  top: 10%;
  left: 0;
  width: 100%;
  height: 80%;
  z-index: 0;
  opacity: 0.05;
  pointer-events: none;
`

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-stack-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-secondary);

  &::before {
    content: '';
    display: block;
    width: 6px;
    height: 6px;
    background: var(--color-red-500);
    border-radius: 50%;
    animation: ${pulseRed} 2s infinite;
  }
`

const SectorsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
`

const SectorRow = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 24px;
  align-items: center;
  gap: 12px;
`

const SectorInfo = styled.div`
  text-align: right;
`

const SectorName = styled.div`
  font-family: var(--font-stack-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
`

const SectorStatus = styled.div`
  font-family: var(--font-stack-ui);
  font-size: 10px;
  color: var(--text-tertiary);
`

const TrackLane = styled.div<{ $variant: 'gray' | 'red' | 'green' }>`
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'red': return 'rgba(244, 42, 64, 0.05)'; // faint red
      case 'green': return 'rgba(34, 197, 94, 0.05)';
      default: return 'var(--bg-surface-hover)';
    }
  }};
  border: 1px solid ${({ $variant }) => {
    switch ($variant) {
      case 'red': return 'rgba(244, 42, 64, 0.2)';
      case 'green': return 'rgba(34, 197, 94, 0.2)';
      default: return 'var(--border-subtle)';
    }
  }};
  border-left: 3px solid ${({ $variant }) => {
    switch ($variant) {
      case 'red': return 'var(--color-red-500)';
      case 'green': return 'var(--color-success)';
      default: return 'var(--color-slate-500)';
    }
  }};
  border-radius: 4px;
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 4px;
  position: relative;
  overflow: hidden;
`

const CarBlock = styled.div<{ $variant: 'gray' | 'red' | 'green'; $opacity?: number }>`
  height: 24px;
  width: 16px;
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'red': return 'var(--color-red-500)';
      case 'green': return 'var(--color-success)';
      default: return 'var(--color-slate-300)';
    }
  }};
  border-radius: 2px;
  opacity: ${({ $opacity }) => $opacity ?? 1};
  transition: transform 0.2s;
  cursor: pointer;

  &:hover {
    transform: scale(1.2);
    opacity: 1;
  }
`

const SectorTotal = styled.div<{ $variant: 'gray' | 'red' | 'green' }>`
  font-family: var(--font-stack-mono);
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  color: ${({ $variant }) => {
    switch ($variant) {
      case 'red': return 'var(--color-red-500)';
      case 'green': return 'var(--color-success)';
      default: return 'var(--text-tertiary)';
    }
  }};
`

const FooterStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding-top: 16px;
  border-top: 1px dashed var(--border-subtle);
  margin-top: auto;
`

const StatItem = styled.div`
  text-align: center;
`

const StatLabel = styled.div`
  font-family: var(--font-stack-mono);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 4px;
  letter-spacing: 0.5px;
`

const StatValue = styled.div<{ $color?: string }>`
  font-family: var(--font-stack-mono);
  font-size: 16px;
  font-weight: 700;
  color: ${({ $color }) => $color ? `var(${$color})` : 'var(--text-primary)'};
`

// Tooltip (Simplest Implementation)
const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-surface-overlay);
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  box-shadow: var(--shadow-md);
  pointer-events: none;
  z-index: 10;
  border: 1px solid var(--border-subtle);
`

interface Issue {
  key: string
  summary?: string
  statusCategory: string // 'new', 'indeterminate', 'done'
  column?: string
  isStalled?: boolean
}

interface LiveCircuitProps {
  issues?: Issue[]
  boardType?: 'scrum' | 'kanban'
  locale?: string
}

export default function LiveCircuit({ issues = [], boardType = 'scrum', locale = 'en' }: LiveCircuitProps) {

  // Categorize issues
  const todo = issues.filter(i => i.statusCategory === 'new');
  const inProgress = issues.filter(i => i.statusCategory === 'indeterminate');
  const done = issues.filter(i => i.statusCategory === 'done');

  // Counts
  const plannedCount = todo.length;
  const activeCount = inProgress.length;
  // Mocking 'Review' stage if no explicit column mapping, usually part of Indeterminate or Done
  // For visual match, we can just split In Progress or take a subset
  const finishedCount = done.length;

  // Labels via tPop
  const activeLabel = tPop('workContainer', boardType, locale).toUpperCase() + ' ACTIVE'; // RACE ACTIVE / FLOW ACTIVE

  const renderTrack = (items: Issue[], variant: 'gray' | 'red' | 'green') => {
    // Limit items visually to avoid overflow
    const displayItems = items.slice(0, 15);
    return (
      <TrackLane $variant={variant}>
        {displayItems.map((issue, idx) => (
          <div key={issue.key} style={{ position: 'relative' }} title={`${issue.key}: ${issue.summary}`}>
            <CarBlock
              $variant={variant}
              $opacity={1 - (idx * 0.03)} // Slight fade for items further back
            />
          </div>
        ))}
      </TrackLane>
    )
  }

  return (
    <PanelContainer
      title="LIVE CIRCUIT"
      action={<LiveIndicator>{activeLabel}</LiveIndicator>}
    >
      <CircuitContainer>
        {/* Background Decoration */}
        <BackgroundTrack viewBox="0 0 400 200" preserveAspectRatio="none">
          <path d="M0,100 Q100,50 200,100 T400,100" fill="none" stroke="var(--border-subtle)" strokeWidth="40" opacity="0.5" />
        </BackgroundTrack>

        <SectorsList>
          {/* SECTOR 1: Planned / To Do */}
          <SectorRow>
            <SectorInfo>
              <SectorName>SECTOR 1</SectorName>
              <SectorStatus>To Do</SectorStatus>
            </SectorInfo>
            {renderTrack(todo, 'gray')}
            <SectorTotal $variant="gray">{plannedCount}</SectorTotal>
          </SectorRow>

          {/* SECTOR 2: Active / In Progress */}
          <SectorRow>
            <SectorInfo>
              <SectorName style={{ color: 'var(--color-red-500)' }}>SECTOR 2</SectorName>
              <SectorStatus>In Progress</SectorStatus>
            </SectorInfo>
            {renderTrack(inProgress, 'red')}
            <SectorTotal $variant="red">{activeCount}</SectorTotal>
          </SectorRow>

          {/* SECTOR 3: Done */}
          <SectorRow>
            <SectorInfo>
              <SectorName style={{ color: 'var(--color-success)' }}>SECTOR 3</SectorName>
              <SectorStatus>Done</SectorStatus>
            </SectorInfo>
            {renderTrack(done, 'green')}
            <SectorTotal $variant="green">{finishedCount}</SectorTotal>
          </SectorRow>
        </SectorsList>

        <FooterStats>
          <StatItem>
            <StatLabel>PLANNED</StatLabel>
            <StatValue>{plannedCount}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>ACTIVE</StatLabel>
            <StatValue $color="--color-red-500">{activeCount}</StatValue>
          </StatItem>
          {/* Mock Review Separate - often indeterminate with specific status */}
          <StatItem>
            <StatLabel>REVIEW</StatLabel>
            <StatValue $color="--color-warning">--</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>FINISHED</StatLabel>
            <StatValue $color="--color-success">{finishedCount}</StatValue>
          </StatItem>
        </FooterStats>

      </CircuitContainer>
    </PanelContainer>
  )
}
