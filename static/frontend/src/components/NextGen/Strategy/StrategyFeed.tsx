import React from 'react'
import styled from 'styled-components'
import { PanelContainer } from '../Layout/PanelContainer'

interface Recommendation {
    id: string
    title: string
    description: string
    severity: 'CRITICAL' | 'WARNING' | 'INFO'
    type: string
}

interface StrategyFeedProps {
    recommendations: Recommendation[]
    onAction: (id: string) => void
}

const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;

  /* Custom Scrollbar for list */
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }
`

const InsightCard = styled.div<{ $severity: string }>`
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid ${({ $severity }) =>
        $severity === 'CRITICAL' ? 'var(--status-critical)' :
            $severity === 'WARNING' ? 'var(--status-warning)' :
                'var(--status-success)'};
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-surface-hover);
    transform: translateX(2px);
  }
`

const InsightHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
`

const InsightTitle = styled.h3`
  font-size: 12px;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
`

const InsightDesc = styled.p`
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
`

const ActionButton = styled.button`
  margin-top: var(--space-2);
  background: transparent;
  border: 1px solid var(--brand-primary);
  color: var(--brand-primary);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: var(--brand-primary);
    color: var(--text-inverse);
  }
`

export const StrategyFeed: React.FC<StrategyFeedProps> = ({ recommendations, onAction }) => {
    return (
        <PanelContainer title="Strategy Assistant">
            <FeedContainer>
                {recommendations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 11 }}>
                        Radio check... No active strategies.
                    </div>
                ) : (
                    recommendations.map(rec => (
                        <InsightCard key={rec.id} $severity={rec.severity} onClick={() => onAction(rec.id)}>
                            <InsightHeader>
                                <InsightTitle>
                                    {rec.severity === 'CRITICAL' && '🚩'}
                                    {rec.severity === 'WARNING' && '⚠️'}
                                    {rec.title}
                                </InsightTitle>
                                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>#{rec.type}</span>
                            </InsightHeader>
                            <InsightDesc>{rec.description}</InsightDesc>
                            {rec.severity === 'CRITICAL' && (
                                <ActionButton>Pit Confirm</ActionButton>
                            )}
                        </InsightCard>
                    ))
                )}
            </FeedContainer>
        </PanelContainer>
    )
}
