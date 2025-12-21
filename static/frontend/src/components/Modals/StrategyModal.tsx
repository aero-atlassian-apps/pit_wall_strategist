import React, { useState, useEffect, useMemo } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { analyzeTicket } from '../../utils/raceEngineer'
import { getRecommendedActions, getSituationAnalysis, type IssueContext, type BoardContext, type ActionRecommendation } from '../../utils/strategyIntelligence'
import { t } from '../../i18n'
import { invoke } from '@forge/bridge'

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
  background: rgba(0, 0, 0, 0.85); 
  display: flex; align-items: center; justify-content: center; 
  z-index: 1000; 
  animation: fadeIn .3s ease-out; 
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
`
const ModalContainer = styled.div`
  background: var(--bg-main); 
  border: 2px solid var(--color-brand); 
  border-radius: var(--radius-lg); 
  width: 90%; max-width: 900px; max-height: 90vh; 
  overflow: hidden; 
  box-shadow: 0 0 60px rgba(244, 42, 64, 0.3); 
  animation: slideUp .3s ease-out; 
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
  display: flex; flex-direction: column;
`
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; 
  padding: var(--space-4); 
  border-bottom: 1px solid var(--border); 
  background: linear-gradient(90deg, rgba(244, 42, 64, 0.1) 0%, transparent 50%);
`
const ModalTitle = styled.h2`
  font-family: var(--font-stack-mono); font-size: 16px; font-weight: 700; 
  text-transform: uppercase; letter-spacing: 2px; 
  color: var(--color-brand); margin: 0; 
  display: flex; align-items: center; gap: var(--space-2);
`
const CloseButton = styled.button`
  background: transparent; border: 1px solid var(--border); 
  border-radius: var(--radius-sm); 
  color: var(--text-muted); 
  padding: var(--space-1) var(--space-2); 
  font-family: var(--font-stack-mono); font-size: 11px; 
  cursor: pointer; transition: all .2s; 
  &:hover { border-color: var(--text-primary); color: var(--text-primary); }
`
const ModalBody = styled.div`
  padding: var(--space-4); 
  overflow-y: auto;
  flex: 1;
`
const TicketInfo = styled.div`
  display: flex; flex-direction: column; gap: var(--space-2); 
  margin-bottom: var(--space-4); 
  padding: var(--space-4); 
  background: var(--bg-card); 
  border-radius: var(--radius-md); 
  border-left: 3px solid var(--color-brand);
`
const TicketKey = styled.span`
  font-family: var(--font-stack-mono); font-size: 14px; font-weight: 700; color: var(--text-primary);
`
const TicketSummary = styled.span`
  font-family: var(--font-stack-ui); font-size: 13px; color: var(--text-muted);
`
const TicketMeta = styled.div`
  display: flex; gap: var(--space-4); 
  font-family: var(--font-stack-mono); font-size: 10px; 
  color: var(--text-tertiary); text-transform: uppercase; 
  flex-wrap: wrap;
`
const blink = keyframes`50% { border-color: transparent }`

const AnalysisSection = styled.div`margin-bottom: var(--space-4)`

const AnalysisLabel = styled.div`
  font-family: var(--font-stack-mono); font-size: 10px; 
  text-transform: uppercase; letter-spacing: 1.5px; 
  color: var(--text-muted); margin-bottom: var(--space-1);
`
const AnalysisText = styled.div`
  font-family: var(--font-stack-mono); font-size: 13px; line-height: 1.6; 
  color: var(--color-success); 
  padding: var(--space-4); 
  background: var(--bg-card); 
  border-radius: var(--radius-md); 
  border: 1px solid var(--border); 
  position: relative; 
  &::after { 
    content: '▊'; 
    animation: ${blink} 1s step-end infinite; 
    color: var(--color-success); 
  }
`
const ActionCardsGrid = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); 
  @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }
`

const ActionCard = styled.button<{ $relevance?: 'critical' | 'recommended' | 'available'; $disabled?: boolean }>`
  background: var(--bg-card); 
  border: 1px solid var(--border);
  border-left: 3px solid ${({ $relevance }) =>
    $relevance === 'critical' ? 'var(--color-danger)' :
      $relevance === 'recommended' ? 'var(--color-success)' :
        'var(--border)'
  };
  border-radius: var(--radius-md); 
  padding: var(--space-4); 
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'}; 
  transition: all .3s ease; 
  text-align: left; 
  display: flex; flex-direction: column; gap: var(--space-2);
  position: relative;
  opacity: ${({ $disabled }) => $disabled ? 0.5 : 1};
  
  ${({ $relevance, $disabled }) => !$disabled && $relevance === 'critical' && css`
    box-shadow: 0 0 20px rgba(244, 42, 64, 0.1);
    background: linear-gradient(135deg, var(--bg-card) 0%, rgba(244, 42, 64, 0.05) 100%);
  `}
  
  ${({ $relevance, $disabled }) => !$disabled && $relevance === 'recommended' && css`
    box-shadow: 0 0 15px rgba(74, 222, 128, 0.1);
    background: linear-gradient(135deg, var(--bg-card) 0%, rgba(74, 222, 128, 0.05) 100%);
  `}
  
  &:hover { 
    ${({ $disabled }) => !$disabled && css`
      border-color: var(--color-brand);
      box-shadow: var(--shadow-md); 
      transform: translateY(-2px);
    `}
  } 
  &:active { ${({ $disabled }) => !$disabled && 'transform: translateY(0)'} }
`

const RelevanceBadge = styled.span<{ $type: 'critical' | 'recommended' }>`
  position: absolute;
  top: -8px;
  right: 8px;
  font-family: var(--font-stack-mono);
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  ${({ $type }) => $type === 'critical' ? css`
    background: var(--color-danger);
    color: white;
  ` : css`
    background: var(--color-success);
    color: var(--bg-app);
  `}
`

const ActionIcon = styled.div`
  width: 40px; height: 40px; 
  border-radius: var(--radius-sm); 
  background: var(--bg-surface-hover); 
  display: flex; align-items: center; justify-content: center; 
  font-size: 20px;
`
const ActionTitle = styled.div`
  font-family: var(--font-stack-mono); font-size: 12px; font-weight: 700; 
  text-transform: uppercase; letter-spacing: 0.5px; 
  color: var(--text-primary);
`
const ActionDescription = styled.div`
  font-family: var(--font-stack-ui); font-size: 11px; 
  color: var(--text-tertiary); line-height: 1.3;
`
const ActionReason = styled.div`
  font-family: var(--font-stack-mono); font-size: 9px; 
  color: var(--color-warning); margin-top: var(--space-1); font-style: italic;
`
const AssigneeBox = styled.div`margin-bottom: var(--space-4)`
const AssigneeSelect = styled.select`
  width: 100%; padding: var(--space-2); 
  background: var(--bg-card); 
  color: var(--text-primary); 
  border: 1px solid var(--border); 
  border-radius: var(--radius-sm);
  font-family: var(--font-stack-mono);
  font-size: 12px;
`

interface StrategyModalProps {
  ticket: any
  boardContext?: { boardType: 'scrum' | 'kanban'; sprintActive?: boolean; sprintDaysRemaining?: number; wipLimit?: number; wipCurrent?: number }
  alertType?: 'stalled' | 'overdue' | 'blocked' | 'capacity' | 'general'
  canWrite?: boolean  // User permission to perform write actions
  onClose?: () => void
  onAction?: (action: any, ticket: any, assignee?: string) => void
}

function StrategyModal({ ticket, boardContext, alertType = 'general', canWrite = true, onClose, onAction }: StrategyModalProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [users, setUsers] = useState<Array<{ accountId: string; displayName: string }>>([])
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const platform = (import.meta as any).env?.VITE_PLATFORM || 'local'
  const isForgeContext = () => platform === 'atlassian'
  const locale = (window as any).__PWS_LOCALE || 'en'

  // Build context objects for intelligence engine
  const issueContext: IssueContext = useMemo(() => ({
    key: ticket.key || '',
    summary: ticket.summary || '',
    status: ticket.status || 'Unknown',
    statusCategory: ticket.statusCategory || 'indeterminate',
    issueType: ticket.issueType || 'Task',
    isStalled: ticket.isStalled ?? true, // Default to true if showing this modal
    isBlocked: ticket.isBlocked || ticket.flagged || false,
    hasSubtasks: (ticket.subtasks?.length || 0) > 0,
    storyPoints: ticket.storyPoints,
    assignee: ticket.assignee,
    priority: ticket.priority || 'Medium',
    daysInStatus: ticket.daysInStatus || ticket.stalledDays || 3,
    linkedIssues: ticket.linkedIssues?.length || 0
  }), [ticket])

  const boardCtx: BoardContext = useMemo(() => ({
    boardType: boardContext?.boardType || 'scrum',
    sprintActive: boardContext?.sprintActive ?? true,
    sprintDaysRemaining: boardContext?.sprintDaysRemaining,
    wipLimit: boardContext?.wipLimit,
    wipCurrent: boardContext?.wipCurrent,
    columns: []
  }), [boardContext])

  // Get intelligent recommendations
  const recommendedActions = useMemo(() =>
    getRecommendedActions(issueContext, boardCtx, alertType),
    [issueContext, boardCtx, alertType]
  )

  // Get situation analysis
  const situationAnalysis = useMemo(() =>
    getSituationAnalysis(issueContext, boardCtx),
    [issueContext, boardCtx]
  )

  // Fallback to old analysis for additional context
  const legacyAnalysis = useMemo(() => analyzeTicket(ticket), [ticket])

  // Combine analyses for display
  const fullAnalysis = `${situationAnalysis} ${legacyAnalysis?.message || ''}`

  // Typewriter effect
  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index <= fullAnalysis.length) {
        setDisplayedText(fullAnalysis.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 15)
    return () => clearInterval(interval)
  }, [fullAnalysis])

  // Fetch assignable users
  useEffect(() => {
    if (isForgeContext()) {
      invoke('getAssignableUsers', { issueKey: ticket.key }).then((res: any) => {
        if (res?.success && Array.isArray(res.users)) {
          setUsers(res.users)
          setSelectedAssignee(res.users[0]?.accountId || '')
        }
      }).catch(() => { })
    }
  }, [ticket.key])

  function handleAction(action: ActionRecommendation) {
    const assignee = action.action === 'reassign-ticket' ? selectedAssignee : undefined
    onAction?.(action.action, ticket, assignee)
  }

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle><span>🚨</span>{t('strategyCall', locale)} {ticket.key}</ModalTitle>
          <CloseButton onClick={onClose}>{t('esc', locale)}</CloseButton>
        </ModalHeader>
        <ModalBody>
          <TicketInfo>
            <TicketKey>{ticket.key}</TicketKey>
            <TicketSummary>{ticket.summary}</TicketSummary>
            <TicketMeta>
              <span>🏎️ {ticket.assignee || t('unassigned', locale)}</span>
              <span>📍 {ticket.status || t('unknown', locale)}</span>
              <span>🎯 {ticket.priority || t('priority', locale)}</span>
              <span>📋 {ticket.issueType || t('task', locale)}</span>
              {issueContext.daysInStatus > 0 && <span>⏱️ {issueContext.daysInStatus}{t('daysShort', locale)} {t('inStatus', locale)}</span>}
            </TicketMeta>
          </TicketInfo>

          <AnalysisSection>
            <AnalysisLabel>🎧 {t('raceEngineerAnalysis', locale)}</AnalysisLabel>
            <AnalysisText>{displayedText}</AnalysisText>
          </AnalysisSection>

          {users.length > 0 && (
            <AssigneeBox>
              <AnalysisLabel>👥 {t('assigneeTeamOrders', locale)}</AnalysisLabel>
              <AssigneeSelect value={selectedAssignee} onChange={e => setSelectedAssignee(e.target.value)}>
                {users.map(u => (<option key={u.accountId} value={u.accountId}>{u.displayName}</option>))}
              </AssigneeSelect>
            </AssigneeBox>
          )}

          <AnalysisLabel>⚡ {t('selectStrategy', locale)} ({recommendedActions.length} {boardCtx.boardType === 'scrum' ? t('sprint', locale) : t('flow', locale)} {t('tactics', locale)})</AnalysisLabel>
          <ActionCardsGrid>
            {recommendedActions.map(action => (
              <ActionCard
                key={action.id}
                onClick={() => canWrite && handleAction(action)}
                $relevance={action.relevance === 'critical' || action.relevance === 'recommended' ? action.relevance : undefined}
                $disabled={!canWrite}
                title={!canWrite ? t('noWritePermission', locale) || "You don't have permission to perform this action" : undefined}
              >
                {(action.relevance === 'critical' || action.relevance === 'recommended') && (
                  <RelevanceBadge $type={action.relevance}>
                    {action.relevance === 'critical' ? t('urgent', locale) : t('suggested', locale)}
                  </RelevanceBadge>
                )}
                <ActionIcon>{action.icon}</ActionIcon>
                <ActionTitle>{action.name}</ActionTitle>
                <ActionDescription>{action.description}</ActionDescription>
                {action.reason && <ActionReason>💡 {action.reason}</ActionReason>}
                {!canWrite && <ActionReason>🔒 {t('noWritePermission', locale) || "You don't have permission to perform this action"}</ActionReason>}
              </ActionCard>
            ))}
          </ActionCardsGrid>
        </ModalBody>
      </ModalContainer>
    </Overlay>
  )
}

export default StrategyModal
