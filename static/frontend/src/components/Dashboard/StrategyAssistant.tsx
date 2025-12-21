import React, { useState, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { Panel } from '../Common/Panel'
import { t } from '../../i18n'
import { IconButton } from '../Common/Buttons'
import { ALL_ACTIONS } from '../../domain/strategy/ActionDefinitions'
import { analyzeActionRelevance } from '../../domain/strategy/ActionPolicies'
import type { BoardContext, IssueContext } from '../../domain/strategy/StrategyTypes'
import { openAgentChat } from '../../utils/rovoBridge'

// --- Animations ---
const pulseRed = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
`

const RadioFeed = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
`

const FeedItem = styled.div<{ $priority: 'critical' | 'normal' | 'low' }>`
  background: var(--bg-main);
  border-left: 3px solid ${({ $priority }) =>
    $priority === 'critical' ? 'var(--color-danger)' :
      $priority === 'normal' ? 'var(--color-brand)' :
        'var(--border)'
  };
  padding: 10px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: var(--bg-card-hover);
    transform: translateX(2px);
  }
`

const FeedHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`

const SpeakerName = styled.span`
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
`

const Timestamp = styled.span`
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-muted);
`

const MessageText = styled.div`
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--text-primary);
  line-height: 1.4;
`

const IssueRef = styled.span`
  font-family: var(--font-mono);
  font-size: 9px;
  background: var(--bg-card);
  padding: 2px 4px;
  border-radius: 4px;
  margin-left: 6px;
  color: var(--text-brand);
`

const BoxBoxButton = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: ${({ $active }) => $active ? 'var(--color-danger)' : 'var(--bg-card)'};
  color: ${({ $active }) => $active ? '#FFFFFF' : 'var(--text-disabled)'};
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: ${({ $active }) => $active ? 'pointer' : 'not-allowed'};
  transition: all 0.3s;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${({ $active }) => $active && css`
    animation: ${pulseRed} 2s infinite;
    &:hover { background: var(--color-danger-hover); }
  `}
`

interface Props {
  feed: Array<{ time: string; msg: string; type: any }>;
  alertActive: boolean;
  onBoxBox: () => void;
  onRefresh?: () => void;
  boardType?: 'scrum' | 'kanban' | 'business';
  projectContext?: any;
  issues?: any[];
  telemetryData?: any;
}

export default function StrategyAssistant({ feed = [], alertActive, onBoxBox, onRefresh, boardType = 'scrum', projectContext, issues = [], telemetryData }: Props) {
  const locale = (window as any).__PWS_LOCALE || 'en'
  const [recommendations, setRecommendations] = useState<any[]>([])

  // Determine the best 3-5 recommendations based on current state
  // (Preserving logic from original component)
  useEffect(() => {
    if (!issues.length || !telemetryData) return

    const boardCtx: BoardContext = {
      boardType: boardType === 'business' ? 'kanban' : (boardType as 'scrum' | 'kanban' | 'unknown'),
      sprintActive: !!telemetryData.sprint,
      sprintDaysRemaining: telemetryData.sprintDaysRemaining,
      wipLimit: telemetryData.wipLimit,
      wipCurrent: telemetryData.wipCurrent
    }

    const stalledIssues = issues.filter((i: any) => i.isStalled)
    const blockedIssues = issues.filter((i: any) => i.isBlocked)
    const agingIssues = issues.filter((i: any) => i.statusCategory === 'indeterminate' && (i.daysInStatus || 0) > 5)

    const candidates: any[] = []
    const addRec = (action: any, issue: any, relevance: any) => {
      const key = `${action.id}-${issue.key}`
      if (!candidates.find(c => c.key === key)) {
        candidates.push({ key, action, issue, relevance })
      }
    }

    // Logic: Stalled -> Blocked -> Aging
    stalledIssues.slice(0, 3).forEach((issue: any) => {
      ALL_ACTIONS.forEach(action => {
        const result = analyzeActionRelevance(action, mapToIssueContext(issue), boardCtx)
        if (result.relevance === 'critical' || result.relevance === 'recommended') {
          addRec(action, issue, result)
        }
      })
    })

    blockedIssues.slice(0, 2).forEach((issue: any) => {
      const radioAction = ALL_ACTIONS.find(a => a.id === 'radio')!
      const result = analyzeActionRelevance(radioAction, mapToIssueContext(issue), boardCtx)
      if (result.relevance !== 'hidden') addRec(radioAction, issue, result)
    })

    if (candidates.length < 3) {
      agingIssues.slice(0, 3).forEach((issue: any) => {
        const undercutAction = ALL_ACTIONS.find(a => a.id === 'undercut')!
        const result = analyzeActionRelevance(undercutAction, mapToIssueContext(issue), boardCtx)
        if (result.relevance !== 'hidden') addRec(undercutAction, issue, result)
      })
    }

    setRecommendations(candidates.sort((a, b) => {
      const score = (r: string) => r === 'critical' ? 2 : r === 'recommended' ? 1 : 0
      return score(b.relevance.relevance) - score(a.relevance.relevance)
    }).slice(0, 5))

  }, [issues, telemetryData, boardType])

  const mapToIssueContext = (issue: any): IssueContext => ({
    key: issue.key,
    summary: issue.fields?.summary || issue.summary,
    status: issue.fields?.status?.name || issue.status,
    statusCategory: issue.statusCategory || 'indeterminate',
    issueType: issue.fields?.issuetype?.name || issue.issueType || 'Task',
    isStalled: issue.isStalled || false,
    isBlocked: issue.isBlocked || false,
    hasSubtasks: (issue.fields?.subtasks?.length || 0) > 0,
    storyPoints: issue.fields?.customfield_10016 || issue.storyPoints,
    assignee: issue.fields?.assignee?.displayName || issue.assignee,
    priority: issue.fields?.priority?.name || issue.priority || 'Medium',
    daysInStatus: issue.daysInStatus || 0,
    linkedIssues: (issue.fields?.issuelinks?.length || 0)
  })

  // Header Actions
  const HeaderActions = (
    <div className="flex gap-2">
      <IconButton
        onClick={() => openAgentChat(t('rovo_radioPrompt', locale))}
        title={t('rovo_radioBtn', locale)}
        size="sm"
        style={{ border: '1px solid var(--border)' }}
      >
        📡
      </IconButton>
      <IconButton
        onClick={onRefresh}
        size="sm"
        style={{ border: '1px solid var(--border)' }}
      >
        ⟳
      </IconButton>
    </div>
  )

  return (
    <Panel title={t('strategyAssistant', locale)} rightAction={HeaderActions} fullHeight>
      <RadioFeed>
        {recommendations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted font-mono text-sm opacity-50 p-4 text-center">
            {t('flowOptimalHint', locale)}
          </div>
        ) : (
          recommendations.map((rec) => (
            <FeedItem
              key={rec.key}
              $priority={rec.relevance.relevance === 'critical' ? 'critical' : 'normal'}
              onClick={onBoxBox}
            >
              <FeedHeader>
                <SpeakerName>
                  🎧 Race Engineer
                </SpeakerName>
                <Timestamp>Now</Timestamp>
              </FeedHeader>
              <MessageText>
                {rec.relevance.reason}
                <IssueRef>{rec.issue.key}</IssueRef>
              </MessageText>
              <div style={{ marginTop: 6, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-brand)', fontWeight: 700 }}>
                Recommended: {rec.action.name.toUpperCase()}
              </div>
            </FeedItem>
          ))
        )}
      </RadioFeed>

      <div style={{ marginTop: 16 }}>
        <BoxBoxButton $active={alertActive || recommendations.some(r => r.relevance.relevance === 'critical')} onClick={onBoxBox}>
          {t('boxboxCritical', locale) || 'BOX BOX'}
        </BoxBoxButton>
      </div>
    </Panel>
  )
}

