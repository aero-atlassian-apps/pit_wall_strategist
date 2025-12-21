import React from 'react'
import styled, { keyframes } from 'styled-components'
import { PanelContainer } from '../Layout/PanelContainer'
import { t, tPop } from '../../../i18n'

interface Issue {
  key: string
  statusCategory: 'TODO' | 'IN_PROGRESS' | 'DONE'
  summary?: string
  assignee?: { accountId: string, displayName: string, avatarUrl: string }
}

interface CircuitProps {
  issues: Issue[]
  boardType?: string
  locale?: string
}

// -- Animations --
const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`

const raceActivePulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(244, 42, 64, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(244, 42, 64, 0); }
  100% { box-shadow: 0 0 0 0 rgba(244, 42, 64, 0); }
`

// -- Styles --

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 16px 16px 16px;
  position: relative;
  
  /* Subtle background swirl to mimic 'track' feel without overpowering content */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80%;
    height: 60%;
    background: radial-gradient(ellipse at center, var(--bg-surface-hover) 0%, transparent 70%);
    transform: translate(-50%, -50%) rotate(-10deg);
    z-index: 0;
    pointer-events: none;
    opacity: 0.5;
  }
`

const SectorsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 1;
`

const SectorRow = styled.div<{ $variant: 'gray' | 'red' | 'green' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: var(--bg-surface-hover);
  border-radius: 6px;
  border: 1px solid ${({ $variant }) =>
    $variant === 'red' ? 'rgba(244, 42, 64, 0.2)' :
      $variant === 'green' ? 'rgba(34, 197, 94, 0.2)' :
        'var(--border-subtle)'};
  box-shadow: ${({ $variant }) => $variant === 'red' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'};
`

const SectorInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 80px;
  text-align: right;
`

const SectorTitle = styled.div`
  font-family: var(--font-stack-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
`

const SectorSubtitle = styled.div`
  font-family: var(--font-stack-ui);
  font-size: 10px;
  color: var(--text-tertiary);
`

const VerticalBar = styled.div<{ $variant: 'gray' | 'red' | 'green' }>`
  width: 4px;
  height: 32px;
  border-radius: 2px;
  background-color: ${({ $variant }) =>
    $variant === 'red' ? 'var(--color-red-500)' :
      $variant === 'green' ? 'var(--color-success)' :
        'var(--color-slate-400)'};
`

const TrackLane = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  overflow: hidden; /* Hide excess cars */
`

const CarBlock = styled.div<{ $variant: 'gray' | 'red' | 'green', $opacity: number }>`
  width: ${({ $variant }) => $variant === 'red' ? '24px' : '12px'};
  height: ${({ $variant }) => $variant === 'red' ? '18px' : '12px'};
  border-radius: 2px;
  background-color: ${({ $variant }) =>
    $variant === 'red' ? 'var(--color-red-500)' :
      $variant === 'green' ? 'var(--color-success)' :
        'var(--color-slate-300)'};
  opacity: ${({ $opacity }) => $opacity};
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.2);
    z-index: 10;
    opacity: 1;
  }
`

const SectorCount = styled.div<{ $variant: 'gray' | 'red' | 'green' }>`
  font-family: var(--font-stack-mono);
  font-size: 14px;
  font-weight: 700;
  color: ${({ $variant }) =>
    $variant === 'red' ? 'var(--color-red-500)' :
      $variant === 'green' ? 'var(--color-success)' :
        'var(--text-tertiary)'};
  min-width: 24px;
  text-align: right;
`

// -- Footer Stats --
const FooterStats = styled.div`
  display: flex;
  justify-content: space-between;
  border-top: 1px dashed var(--border-subtle);
  padding-top: 16px;
  margin-top: 8px;
  z-index: 1;
`

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`

const StatLabel = styled.div`
  font-family: var(--font-stack-mono);
  font-size: 9px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const StatValue = styled.div<{ $color?: string }>`
  font-family: var(--font-stack-mono);
  font-size: 18px;
  font-weight: 700;
  color: ${({ $color }) => $color || 'var(--text-primary)'};
`

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-stack-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary);
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background-color: var(--color-red-500);
    border-radius: 50%;
    animation: ${raceActivePulse} 2s infinite;
  }
`

export const LiveCircuit: React.FC<CircuitProps> = ({ issues = [], boardType = 'scrum', locale = 'en' }) => {

  // 1. Categorize Issues
  const getCategory = (issue: any): 'TODO' | 'IN_PROGRESS' | 'DONE' => {
    // Direct statusCategory or fallback to fields mapping
    const key = issue.statusCategory || issue.fields?.status?.statusCategory?.key || 'new';
    // Normalize 'new', 'indeterminate', 'done' (Jira API) to our internal types
    if (key === 'new' || key === 'TODO') return 'TODO';
    if (key === 'indeterminate' || key === 'IN_PROGRESS') return 'IN_PROGRESS';
    if (key === 'done' || key === 'DONE') return 'DONE';
    return 'TODO';
  };

  const todo = issues.filter(i => getCategory(i) === 'TODO');
  const wip = issues.filter(i => getCategory(i) === 'IN_PROGRESS');
  const done = issues.filter(i => getCategory(i) === 'DONE');

  // 2. Stats
  const plannedCount = todo.length + wip.length + done.length; // Total in 'view' (usually sprint)
  const activeCount = wip.length;
  const finishedCount = done.length;

  // 3. Labels
  const activeLabel = tPop('workContainer', boardType, locale).toUpperCase() + ' ACTIVE'; // RACE ACTIVE / FLOW ACTIVE

  // Helper to render race cars
  const renderCars = (items: Issue[], variant: 'gray' | 'red' | 'green') => {
    // Limit to 15 to avoid layout break
    const displayItems = items.slice(0, 15);
    return (
      <TrackLane>
        {displayItems.map((issue, idx) => (
          <CarBlock
            key={issue.key}
            $variant={variant}
            $opacity={1 - (idx * 0.03)} // Slight fade for trails
            title={`${issue.key}: ${issue.summary || issue.statusCategory}`}
          />
        ))}
        {items.length > 15 && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>+{items.length - 15}</span>}
      </TrackLane>
    );
  };

  return (
    <PanelContainer
      title="Live Circuit"
      action={<LiveIndicator>{activeLabel}</LiveIndicator>}
      collapsible
    >
      <Container>
        <SectorsContainer>
          {/* Sector 1: TODO */}
          <SectorRow $variant="gray">
            <VerticalBar $variant="gray" />
            <SectorInfo>
              <SectorTitle>SECTOR 1</SectorTitle>
              <SectorSubtitle>To Do</SectorSubtitle>
            </SectorInfo>
            {renderCars(todo, 'gray')}
            <SectorCount $variant="gray">{todo.length}</SectorCount>
          </SectorRow>

          {/* Sector 2: WIP (Highlighted) */}
          <SectorRow $variant="red">
            <VerticalBar $variant="red" />
            <SectorInfo>
              <SectorTitle>SECTOR 2</SectorTitle>
              <SectorSubtitle>In Progress</SectorSubtitle>
            </SectorInfo>
            {renderCars(wip, 'red')}
            <SectorCount $variant="red">{wip.length}</SectorCount>
          </SectorRow>

          {/* Sector 3: DONE */}
          <SectorRow $variant="green">
            <VerticalBar $variant="green" />
            <SectorInfo>
              <SectorTitle>SECTOR 3</SectorTitle>
              <SectorSubtitle>Done</SectorSubtitle>
            </SectorInfo>
            {renderCars(done, 'green')}
            <SectorCount $variant="green">{done.length}</SectorCount>
          </SectorRow>
        </SectorsContainer>

        <FooterStats>
          <StatItem>
            <StatLabel>PLANNED</StatLabel>
            <StatValue>{plannedCount}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>ACTIVE</StatLabel>
            <StatValue $color="var(--color-red-500)">{activeCount}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>FINISHED</StatLabel>
            <StatValue $color="var(--color-success)">{finishedCount}</StatValue>
          </StatItem>
        </FooterStats>
      </Container>
    </PanelContainer>
  )
}
