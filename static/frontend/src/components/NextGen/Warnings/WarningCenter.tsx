import React from 'react'
import styled from 'styled-components'
import { PanelContainer } from '../Layout/PanelContainer'

interface Problem {
  id: string
  title: string
  description: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  timeBlocked?: string // e.g. "12h / 12h"
}

interface Bottleneck {
  bottleneckStatus: string
  avgHoursInBottleneck: number
  issuesInBottleneck: number
  percentOfFlow: number
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendation: string
  f1Metaphor: string
}

interface WarningCenterProps {
  problems: Problem[]
  bottleneck?: Bottleneck | null
}

const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const RiskRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--bg-surface);
  border-radius: 4px;
  border-left: 3px solid var(--color-danger);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
`

const Dot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-danger);
  margin-top: 4px;
  box-shadow: 0 0 4px var(--color-danger);
`

const RiskContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const RiskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

const RiskTitle = styled.div`
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
`

const RiskTime = styled.div`
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-danger);
  font-weight: 700;
`

const RiskDesc = styled.div`
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: '⚡';
    font-size: 10px;
    color: var(--color-warning);
  }
`

const SectorBox = styled.div`
  margin-top: 16px;
  border: 1px dashed var(--color-warning);
  background: rgba(245, 158, 11, 0.05);
  padding: 12px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const SectorHeader = styled.div`
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
`

const SectorMetric = styled.div`
  font-size: 11px;
  color: var(--text-secondary);
  font-family: var(--font-ui);
`

const SectorInsight = styled.div`
  font-size: 11px;
  color: var(--text-secondary);
  font-style: italic;
  display: flex;
  gap: 6px;
  margin-top: 4px;
  
   &::before {
    content: 'ℹ️';
    font-style: normal;
    font-size: 10px;
  }
`

export const WarningCenter: React.FC<WarningCenterProps> = ({ problems, bottleneck }) => {
  // Filter actual stalled tickets for the list (Severity WARNING/CRITICAL)
  const criticalRisks = problems.filter(p => p.severity === 'CRITICAL' || p.severity === 'WARNING');

  return (
    <PanelContainer
      title="PREDICTIVE RISKS"
      action={
        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-danger)' }}>
          {criticalRisks.length} ISSUES
        </span>
      }
      className="flex-1"
      collapsible
    >
      <AlertList>
        {criticalRisks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, opacity: 0.6, fontSize: 12 }}>
            ✅ <span style={{ color: 'var(--color-success)' }}>No stall risks detected.</span><br />
            <span style={{ fontSize: 10, marginTop: 4, display: 'block' }}>Race control is monitoring.</span>
          </div>
        ) : (
          criticalRisks.map(p => (
            <RiskRow key={p.id}>
              <Dot />
              <RiskContent>
                <RiskHeader>
                  <RiskTitle>{p.title.replace('Stalled: ', '')}</RiskTitle>
                  <RiskTime>{p.timeBlocked || '-- / --'}</RiskTime>
                </RiskHeader>
                <RiskDesc>{p.description || "Immediate action required. Check for blockers."}</RiskDesc>
              </RiskContent>
            </RiskRow>
          ))
        )}
      </AlertList>

      {/* Sector Insight Box - Now using real bottleneck data from backend */}
      {bottleneck ? (
        <SectorBox>
          <SectorHeader>
            🚦 {bottleneck.bottleneckStatus}
          </SectorHeader>
          <SectorMetric>{bottleneck.issuesInBottleneck} tickets stuck ({bottleneck.percentOfFlow}% of flow)</SectorMetric>
          <SectorInsight>
            "{bottleneck.f1Metaphor}"
          </SectorInsight>
        </SectorBox>
      ) : (
        <SectorBox style={{ opacity: 0.5, borderColor: 'var(--border-subtle)' }}>
          <SectorHeader>
            🚦 Flow Analysis
          </SectorHeader>
          <SectorMetric>No bottlenecks detected</SectorMetric>
          <SectorInsight>
            Clear track ahead.
          </SectorInsight>
        </SectorBox>
      )}
    </PanelContainer>
  )
}
