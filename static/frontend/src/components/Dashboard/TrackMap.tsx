import React, { useState } from 'react'
import styled, { keyframes, css } from 'styled-components'
import F1Card from '../Common/F1Card'
import { t } from '../../i18n'

const pulse = keyframes`
  0%, 100% { opacity: 1; box-shadow: 0 0 8px #FF0033; }
  50% { opacity: 0.6; box-shadow: 0 0 16px #FF0033; }
`

const TrackContainer = styled.div`
  .track-card { height: 100%; }
`

const Sectors = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
  flex: 1;
`

const Sector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const SectorLabel = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors?.textMuted || '#888'};
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 100px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Lane = styled.div`
  flex: 1;
  background: ${({ theme }) => (theme as any).colors?.bgMain || '#1a1a1a'}44;
  border-radius: 20px;
  padding: 6px 12px;
  min-height: 32px;
  display: flex;
  align-items: center;
`

const LaneDots = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const Dot = styled.div<{ $isStalled?: boolean; $isHovered?: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ $isStalled, theme }) =>
    $isStalled ? (theme as any).colors?.redAlert || '#FF0033' : (theme as any).colors?.greenPace || '#39FF14'};
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  
  ${({ $isStalled }) => $isStalled && css`
    animation: ${pulse} 2s ease-in-out infinite;
  `}
  
  ${({ $isHovered }) => $isHovered && css`
    transform: scale(1.3);
    box-shadow: 0 0 12px currentColor;
    z-index: 10;
  `}
  
  &:hover {
    transform: scale(1.3);
    box-shadow: 0 0 12px ${({ $isStalled, theme }) =>
    $isStalled ? (theme as any).colors?.redAlert || '#FF0033' : (theme as any).colors?.greenPace || '#39FF14'};
    z-index: 10;
  }
`

const Tooltip = styled.div<{ $visible: boolean }>`
  position: fixed;
  background: ${({ theme }) => (theme as any).colors?.bgCard || '#2a2a2a'};
  border: 1px solid ${({ theme }) => (theme as any).colors?.border || '#444'};
  border-radius: 8px;
  padding: 10px 14px;
  z-index: 1000;
  pointer-events: none;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transform: ${({ $visible }) => $visible ? 'translateY(0)' : 'translateY(4px)'};
  transition: opacity 0.15s ease, transform 0.15s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  max-width: 280px;
`

const TooltipKey = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => (theme as any).colors?.purpleSector || '#BF5AF2'};
  margin-bottom: 4px;
`

const TooltipSummary = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 11px;
  color: ${({ theme }) => (theme as any).colors?.textPrimary || '#fff'};
  margin-bottom: 6px;
  line-height: 1.4;
`

const TooltipMeta = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors?.textMuted || '#888'};
  display: flex;
  gap: 12px;
`

const TooltipBadge = styled.span<{ $type: 'stalled' | 'normal' }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ $type }) => $type === 'stalled' ? 'rgba(255, 0, 51, 0.2)' : 'rgba(57, 255, 20, 0.2)'};
  color: ${({ $type }) => $type === 'stalled' ? '#FF0033' : '#39FF14'};
  margin-left: 8px;
`

const TrackStats = styled.div`
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => (theme as any).colors?.border || '#444'}22;
`

const Stat = styled.div`
  text-align: center;
`

const StatValue = styled.div<{ $color?: string }>`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 24px;
  font-weight: 700;
  color: ${({ $color, theme }) =>
    $color === 'purple' ? (theme as any).colors?.purpleSector || '#BF5AF2' :
      $color === 'yellow' ? (theme as any).colors?.yellowWarning || '#F4D03F' :
        $color === 'green' ? (theme as any).colors?.greenPace || '#39FF14' :
          (theme as any).colors?.textPrimary || '#fff'};
`

const StatLabel = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts?.mono || 'monospace'};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors?.textMuted || '#888'};
  text-transform: uppercase;
  letter-spacing: 1px;
`

interface Issue {
  key: string
  summary?: string
  statusCategory: string
  assignee: string
  isStalled?: boolean
  column?: string
  status?: string
}

interface TrackMapProps {
  issues?: Issue[]
  boardType?: 'scrum' | 'kanban'
  columns?: string[]
  locale?: string
}

function TrackMap({ issues = [], boardType = 'scrum', columns = [], locale = 'en' }: TrackMapProps) {
  const [hoveredIssue, setHoveredIssue] = useState<Issue | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const todoIssues = issues.filter(i => i.statusCategory === 'new')
  const inProgressIssues = issues.filter(i => i.statusCategory === 'indeterminate')
  const doneIssues = issues.filter(i => i.statusCategory === 'done')

  const orderedColumns = (columns && columns.length > 0
    ? columns
    : Array.from(new Set(issues.map(i => i.column).filter(Boolean) as string[])))

  const sectors = orderedColumns.map((name) => ({
    label: `${t('sectorPrefix', locale)} ${name}`,
    full: name,
    issues: issues.filter(i => i.column === name)
  }))

  const handleMouseEnter = (issue: Issue, e: React.MouseEvent) => {
    setHoveredIssue(issue)
    setTooltipPos({ x: e.clientX + 12, y: e.clientY - 60 })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredIssue) {
      setTooltipPos({ x: e.clientX + 12, y: e.clientY - 60 })
    }
  }

  const handleMouseLeave = () => {
    setHoveredIssue(null)
  }

  return (
    <TrackContainer className="track-card">
      <F1Card title={t('circuit', locale)} badge={`${issues.length} ${t('tickets', locale)}`} fullHeight>
        <Sectors>
          {sectors.map((sector) => (
            <Sector key={sector.label}>
              <SectorLabel title={sector.full}>{sector.label}</SectorLabel>
              <Lane>
                <LaneDots>
                  {sector.issues.map(issue => (
                    <Dot
                      key={issue.key}
                      $isStalled={issue.isStalled}
                      $isHovered={hoveredIssue?.key === issue.key}
                      onMouseEnter={(e) => handleMouseEnter(issue, e)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                  ))}
                </LaneDots>
              </Lane>
            </Sector>
          ))}
        </Sectors>
        <TrackStats>
          <Stat>
            <StatValue>{todoIssues.length}</StatValue>
            <StatLabel>{t('grid', locale)}</StatLabel>
          </Stat>
          <Stat>
            <StatValue $color="purple">{inProgressIssues.length}</StatValue>
            <StatLabel>{t('racing', locale)}</StatLabel>
          </Stat>
          <Stat>
            <StatValue $color="yellow">{issues.filter(i => i.isStalled).length}</StatValue>
            <StatLabel>{t('pitlane', locale)}</StatLabel>
          </Stat>
          <Stat>
            <StatValue $color="green">{doneIssues.length}</StatValue>
            <StatLabel>{t('finished', locale)}</StatLabel>
          </Stat>
        </TrackStats>
      </F1Card>

      {/* Floating Tooltip */}
      <Tooltip
        $visible={!!hoveredIssue}
        style={{ left: tooltipPos.x, top: tooltipPos.y }}
      >
        {hoveredIssue && (
          <>
            <TooltipKey>
              {hoveredIssue.key}
              {hoveredIssue.isStalled && <TooltipBadge $type="stalled">{t('stalled', locale)}</TooltipBadge>}
            </TooltipKey>
            <TooltipSummary>
              {hoveredIssue.summary?.substring(0, 60) || t('noSummary', locale)}
              {(hoveredIssue.summary?.length || 0) > 60 ? '...' : ''}
            </TooltipSummary>
            <TooltipMeta>
              <span>👤 {hoveredIssue.assignee || t('unassigned', locale)}</span>
              <span>📍 {hoveredIssue.status || hoveredIssue.column || t('unknown', locale)}</span>
            </TooltipMeta>
          </>
        )}
      </Tooltip>
    </TrackContainer>
  )
}

export default TrackMap
