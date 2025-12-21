import React, { useState } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { Panel } from '../Common/Panel'
import { t } from '../../i18n'

// --- Animations ---
const pulseRed = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
  70% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
`

const pulseGreen = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7); }
  70% { box-shadow: 0 0 0 4px rgba(5, 150, 105, 0); }
  100% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
`

// --- Styled Components ---

const CircuitContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
`

const SectorRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const SectorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
`

const SectorTitle = styled.div`
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
`

const SectorCount = styled.div`
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-tertiary);
`

const TrackLane = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-main);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 8px;
  min-height: 48px;
  flex-wrap: wrap;
`

const CarDot = styled.div<{ $isStalled?: boolean; $isHovered?: boolean; $statusCategory: string }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid var(--bg-card);

  /* Color based on status category/stalled */
  background: ${({ $isStalled, $statusCategory }) => {
        if ($isStalled) return 'var(--color-danger)'
        switch ($statusCategory) {
            case 'done': return 'var(--color-success)'
            case 'indeterminate': return 'var(--color-warning)' // Or purple for 'in progress'
            default: return 'var(--text-tertiary)' // Grey for todo
        }
    }};

  /* Pulse animation for stalled items */
  ${({ $isStalled }) => $isStalled && css`
    animation: ${pulseRed} 2s infinite;
  `}
  
  /* Hover effect */
  &:hover, ${({ $isHovered }) => $isHovered && css`transform: scale(1.4); z-index: 10;`}
  
  ${({ $isHovered }) => $isHovered && css`
    border-color: var(--text-primary);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  `}
`

// Tooltip (Custom implementation to avoid CSP issues with portals/libraries)
const Tooltip = styled.div<{ $visible: boolean; $x: number; $y: number }>`
  position: fixed;
  top: ${({ $y }) => $y}px;
  left: ${({ $x }) => $x}px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
  z-index: 9999;
  pointer-events: none;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transform: translateY(-100%);
  margin-top: -12px; /* Offset above cursor */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  width: 260px;
  transition: opacity 0.15s ease;
`

const TooltipHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
`

const IssueKey = styled.div`
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-brand);
`

const StatusBadge = styled.span<{ $stalled?: boolean }>`
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 2px;
  background: ${({ $stalled }) => $stalled ? 'rgba(220, 38, 38, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${({ $stalled }) => $stalled ? 'var(--color-danger)' : 'var(--text-tertiary)'};
  text-transform: uppercase;
`

const Summary = styled.div`
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const MetaRow = styled.div`
  display: flex;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-muted);
`

// Stats Footer
const StatsFooter = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding-top: 16px;
  margin-top: auto;
  border-top: 1px solid var(--border);
`

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`

const StatVal = styled.span<{ $color?: string }>`
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: ${({ $color }) => $color ? `var(${$color})` : 'var(--text-primary)'};
`

const StatLbl = styled.span`
  font-family: var(--font-mono);
  font-size: 9px;
  text-transform: uppercase;
  color: var(--text-tertiary);
`

// --- Types ---
interface Issue {
    key: string
    summary?: string
    statusCategory: string // 'new', 'indeterminate', 'done'
    assignee: string
    isStalled?: boolean
    column?: string
    status?: string
}

interface LiveCircuitProps {
    issues?: Issue[]
    boardType?: 'scrum' | 'kanban'
    columns?: string[]
    locale?: string
}

export default function LiveCircuit({ issues = [], boardType = 'scrum', columns = [], locale = 'en' }: LiveCircuitProps) {
    const [hoveredIssue, setHoveredIssue] = useState<Issue | null>(null)
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

    // Organize issues into "Sectors" (Columns/Statuses)
    let sectors: { label: string; full: string; issues: Issue[] }[] = []

    if (columns && columns.length > 0) {
        sectors = columns.map((name) => ({
            label: name,
            full: name,
            issues: issues.filter(i => i.column === name)
        }))
    } else {
        // Fallback: Group by statusCategory
        const categoryMap: Record<string, string> = { 'new': 'To Do', 'indeterminate': 'In Progress', 'done': 'Done' }
        sectors = ['new', 'indeterminate', 'done'].map(cat => ({
            label: categoryMap[cat],
            full: categoryMap[cat],
            issues: issues.filter(i => i.statusCategory === cat)
        }))
    }

    // Calculate high-level stats
    const stalledCount = issues.filter(i => i.isStalled).length
    const doneCount = issues.filter(i => i.statusCategory === 'done').length
    const inProgressCount = issues.filter(i => i.statusCategory === 'indeterminate').length
    const todoCount = issues.filter(i => i.statusCategory === 'new').length

    const handleMouseEnter = (issue: Issue, e: React.MouseEvent) => {
        setHoveredIssue(issue)
        setTooltipPos({ x: e.clientX, y: e.clientY })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (hoveredIssue) {
            setTooltipPos({ x: e.clientX, y: e.clientY })
        }
    }

    const handleMouseLeave = () => {
        setHoveredIssue(null)
    }

    return (
        <Panel title={t('circuit', locale) || 'Live Circuit'} rightAction={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>{issues.length} {t('tickets', locale) || 'CARS'}</span>} fullHeight>
            <CircuitContainer>
                {sectors.map((sector) => (
                    <SectorRow key={sector.label}>
                        <SectorHeader>
                            <SectorTitle>{sector.label}</SectorTitle>
                            <SectorCount>{sector.issues.length}</SectorCount>
                        </SectorHeader>
                        <TrackLane>
                            {sector.issues.length === 0 && (
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Empty Track</span>
                            )}
                            {sector.issues.map(issue => (
                                <CarDot
                                    key={issue.key}
                                    $statusCategory={issue.statusCategory}
                                    $isStalled={issue.isStalled}
                                    $isHovered={hoveredIssue?.key === issue.key}
                                    onMouseEnter={(e) => handleMouseEnter(issue, e)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                />
                            ))}
                        </TrackLane>
                    </SectorRow>
                ))}

                <StatsFooter>
                    <StatItem>
                        <StatVal>{todoCount}</StatVal>
                        <StatLbl>{t('grid', locale) || 'GRID'}</StatLbl>
                    </StatItem>
                    <StatItem>
                        <StatVal $color="--color-warning">{inProgressCount}</StatVal>
                        <StatLbl>{t('racing', locale) || 'RACING'}</StatLbl>
                    </StatItem>
                    <StatItem>
                        <StatVal $color="--color-danger">{stalledCount}</StatVal>
                        <StatLbl>{t('pitlane', locale) || 'PITS'}</StatLbl>
                    </StatItem>
                    <StatItem>
                        <StatVal $color="--color-success">{doneCount}</StatVal>
                        <StatLbl>{t('finished', locale) || 'FINISH'}</StatLbl>
                    </StatItem>
                </StatsFooter>
            </CircuitContainer>

            {/* Portal-free Tooltip for CSP safety */}
            <Tooltip
                $visible={!!hoveredIssue}
                $x={tooltipPos.x}
                $y={tooltipPos.y}
            >
                {hoveredIssue && (
                    <>
                        <TooltipHeader>
                            <IssueKey>{hoveredIssue.key}</IssueKey>
                            <StatusBadge $stalled={hoveredIssue.isStalled}>
                                {hoveredIssue.isStalled ? (t('stalled', locale) || 'STALLED') : (hoveredIssue.status || hoveredIssue.column || 'Active')}
                            </StatusBadge>
                        </TooltipHeader>
                        <Summary>{hoveredIssue.summary || 'No summary available'}</Summary>
                        <MetaRow>
                            <span>👤 {hoveredIssue.assignee || 'Unassigned'}</span>
                            <span>📍 {hoveredIssue.column}</span>
                        </MetaRow>
                    </>
                )}
            </Tooltip>
        </Panel>
    )
}
