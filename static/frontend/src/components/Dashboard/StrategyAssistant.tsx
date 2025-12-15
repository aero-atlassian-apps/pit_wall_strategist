import React, { useState, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'
import F1Card from '../Common/F1Card'
import { t } from '../../i18n'
import { IconButton, RefreshIcon } from '../Common/Buttons'
import { ALL_ACTIONS } from '../../domain/strategy/ActionDefinitions'
import { analyzeActionRelevance } from '../../domain/strategy/ActionPolicies'
import type { BoardContext, IssueContext } from '../../domain/strategy/StrategyTypes'

const blinkAnimation = keyframes`0%,100%{opacity:1;box-shadow:0 0 30px rgba(255,0,51,.8), inset 0 0 20px rgba(255,0,51,.3)}50%{opacity:.85;box-shadow:0 0 50px rgba(255,0,51,1), inset 0 0 30px rgba(255,0,51,.5)}`

const AssistantContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: ${({ theme }) => (theme as any).spacing.md};
`

const RecommendationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 200px;
  padding-right: 4px;
`

const RecommendationCard = styled.div<{ $relevance: 'critical' | 'recommended' | 'available' }>`
  background: ${({ theme, $relevance }) =>
    $relevance === 'critical' ? 'rgba(255, 0, 51, 0.1)' :
    $relevance === 'recommended' ? 'rgba(191, 90, 242, 0.1)' :
    (theme as any).colors.bgCard};
  border: 1px solid ${({ theme, $relevance }) =>
    $relevance === 'critical' ? (theme as any).colors.redAlert :
    $relevance === 'recommended' ? (theme as any).colors.purpleSector :
    (theme as any).colors.border};
  border-left-width: 4px;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(2px);
    background: ${({ theme }) => (theme as any).colors.bgCardHover};
  }
`

const RecHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`

const RecTitle = styled.span`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
`

const RecReason = styled.div`
  font-size: 11px;
  color: ${({ theme }) => (theme as any).colors.textSecondary};
  font-style: italic;
`

const BoxBoxButton = styled.button<{ $active: boolean }>`
  width: 100%;
  height: 40px;
  border: none;
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  cursor: ${({ $active }) => ($active ? 'pointer' : 'default')};
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => (theme as any).spacing.md};
  transition: all .3s ease;
  margin-top: auto;

  ${({ $active, theme }) => ($active ? css`
    background: linear-gradient(135deg, ${(theme as any).colors.redAlert} 0%, #cc0029 100%);
    color: white;
    animation: ${blinkAnimation} 1.5s ease-in-out infinite;
    &:hover { transform: scale(1.02) }
    &:active { transform: scale(.98) }
  ` : css`
    background: ${(theme as any).colors.border};
    color: ${(theme as any).colors.textMuted};
    opacity: 0.5;
  `)}
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
  useEffect(() => {
    if (!issues.length || !telemetryData) return

    const boardCtx: BoardContext = {
      boardType: boardType === 'business' ? 'kanban' : (boardType as 'scrum' | 'kanban' | 'unknown'), // Treat business as Kanban for logic
      sprintActive: !!telemetryData.sprint,
      sprintDaysRemaining: telemetryData.sprintDaysRemaining,
      wipLimit: telemetryData.wipLimit,
      wipCurrent: telemetryData.wipCurrent
    }

    // Find the most "problematic" issues first
    const stalledIssues = issues.filter((i: any) => i.isStalled)
    const blockedIssues = issues.filter((i: any) => i.isBlocked)
    const agingIssues = issues.filter((i: any) => i.statusCategory === 'indeterminate' && (i.daysInStatus || 0) > 5)

    const candidates: any[] = []

    // Helper to add unique recommendations
    const addRec = (action: any, issue: any, relevance: any) => {
        const key = `${action.id}-${issue.key}`
        if (!candidates.find(c => c.key === key)) {
            candidates.push({ key, action, issue, relevance })
        }
    }

    // 1. Check Stalled Issues
    stalledIssues.slice(0, 3).forEach((issue: any) => {
        ALL_ACTIONS.forEach(action => {
            const result = analyzeActionRelevance(action, mapToIssueContext(issue), boardCtx)
            if (result.relevance === 'critical' || result.relevance === 'recommended') {
                addRec(action, issue, result)
            }
        })
    })

    // 2. Check Blocked Issues (Red Flag)
    blockedIssues.slice(0, 2).forEach((issue: any) => {
         // Usually Red Flag is already applied, so look for solutions like 'Blue Flag' (Priority) or 'Team Orders'
         // For now, if blocked, maybe radio message?
         const result = analyzeActionRelevance(ALL_ACTIONS.find(a => a.id === 'radio')!, mapToIssueContext(issue), boardCtx)
         if (result.relevance !== 'hidden') addRec(ALL_ACTIONS.find(a => a.id === 'radio')!, issue, result)
    })

    // 3. General WIP checks if list is small
    if (candidates.length < 3) {
        agingIssues.slice(0, 3).forEach((issue: any) => {
             const result = analyzeActionRelevance(ALL_ACTIONS.find(a => a.id === 'undercut')!, mapToIssueContext(issue), boardCtx)
             if (result.relevance !== 'hidden') addRec(ALL_ACTIONS.find(a => a.id === 'undercut')!, issue, result)
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
    daysInStatus: issue.daysInStatus || 0, // Assuming this is calculated upstream or defaults to 0
    linkedIssues: (issue.fields?.issuelinks?.length || 0)
  })

  return (
    <F1Card
      title={t('strategyAssistant', locale)}
      badge={boardType === 'kanban' ? t('flow', locale) : t('strategy', locale)}
      badgeVariant="success"
      fullHeight
      glowColor="purple"
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton onClick={onRefresh} title={t('refreshAll', locale)}><RefreshIcon /></IconButton>
        </div>
      }
    >
      <AssistantContainer>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
            {recommendations.length > 0 ? t('strategicInsight', locale) : t('raceNormal', locale)}
        </div>

        <RecommendationList>
            {recommendations.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', opacity: 0.5, fontSize: 12 }}>
                    {t('flowOptimalHint', locale)}
                </div>
            ) : (
                recommendations.map((rec) => (
                    <RecommendationCard key={rec.key} $relevance={rec.relevance.relevance} onClick={() => onBoxBox()}>
                        <RecHeader>
                            <RecTitle>{rec.action.name}</RecTitle>
                            <span style={{ fontSize: 10, opacity: 0.7 }}>{rec.issue.key}</span>
                        </RecHeader>
                        <RecReason>{rec.relevance.reason}</RecReason>
                    </RecommendationCard>
                ))
            )}
        </RecommendationList>

        <BoxBoxButton $active={alertActive} onClick={alertActive ? onBoxBox : undefined}>
          {alertActive ? t('boxboxCritical', locale) : t('noCriticalAlerts', locale)}
        </BoxBoxButton>

      </AssistantContainer>
    </F1Card>
  )
}
