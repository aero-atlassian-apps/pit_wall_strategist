import React from 'react'
import styled from 'styled-components'
import { PanelContainer } from '../Layout/PanelContainer'

interface Problem {
    id: string
    title: string
    description: string
    severity: 'CRITICAL' | 'WARNING'
}

interface WarningCenterProps {
    problems: Problem[]
}

const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`

const AlertItem = styled.div<{ $severity: 'CRITICAL' | 'WARNING' }>`
  background: ${({ $severity }) => $severity === 'CRITICAL'
        ? 'rgba(244, 42, 64, 0.1)'
        : 'rgba(250, 204, 21, 0.1)'};
  border: 1px solid ${({ $severity }) => $severity === 'CRITICAL'
        ? 'rgba(244, 42, 64, 0.3)'
        : 'rgba(250, 204, 21, 0.3)'};
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

const AlertTitle = styled.div<{ $severity: 'CRITICAL' | 'WARNING' }>`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ $severity }) => $severity === 'CRITICAL'
        ? 'var(--status-critical)'
        : 'var(--status-warning)'};
`

const Badge = styled.span<{ $severity: 'CRITICAL' | 'WARNING' }>`
  font-size: 9px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 2px;
  background: ${({ $severity }) => $severity === 'CRITICAL'
        ? 'var(--status-critical)'
        : 'var(--status-warning)'};
  color: ${({ $severity }) => $severity === 'CRITICAL' ? 'white' : 'black'};
`

const AlertDesc = styled.div`
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.3;
`

export const WarningCenter: React.FC<WarningCenterProps> = ({ problems }) => {
    return (
        <PanelContainer
            title="Warnings"
            action={
                problems.length > 0 && <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--status-warning)' }}>warning_amber</span>
            }
            className="flex-1"
        >
            {problems.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'center', opacity: 0.5 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--status-success)' }}>check_circle</span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Systems Nominal</span>
                </div>
            ) : (
                <AlertList>
                    {problems.map(p => (
                        <AlertItem key={p.id} $severity={p.severity}>
                            <AlertHeader>
                                <AlertTitle $severity={p.severity}>{p.title}</AlertTitle>
                                <Badge $severity={p.severity}>{p.severity === 'CRITICAL' ? 'CRIT' : 'WARN'}</Badge>
                            </AlertHeader>
                            <AlertDesc>{p.description}</AlertDesc>
                        </AlertItem>
                    ))}
                </AlertList>
            )}
        </PanelContainer>
    )
}
