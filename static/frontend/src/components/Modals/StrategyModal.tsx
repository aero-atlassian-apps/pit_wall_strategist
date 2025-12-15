import React, { useState, useEffect, useMemo } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { analyzeTicket } from '../../utils/raceEngineer'
import { getRecommendedActions, getSituationAnalysis, type IssueContext, type BoardContext, type ActionRecommendation } from '../../utils/strategyIntelligence'
import { t } from '../../i18n'

const Overlay = styled.div`position:fixed; top:0; left:0; right:0; bottom:0; background: rgba(0, 0, 0, 0.85); display:flex; align-items:center; justify-content:center; z-index:1000; animation: fadeIn .3s ease-out; @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }`
const ModalContainer = styled.div`background:${({ theme }) => (theme as any).colors.bgMain}; border:2px solid ${({ theme }) => (theme as any).colors.redAlert}; border-radius:${({ theme }) => (theme as any).borderRadius.lg}; width:90%; max-width:900px; max-height:90vh; overflow:hidden; box-shadow:0 0 60px rgba(255, 0, 51, 0.3); animation: slideUp .3s ease-out; @keyframes slideUp { from { opacity:0; transform: translateY(20px) } to { opacity:1; transform: translateY(0) } }`
const ModalHeader = styled.div`display:flex; justify-content:space-between; align-items:center; padding:${({ theme }) => (theme as any).spacing.lg}; border-bottom:1px solid ${({ theme }) => (theme as any).colors.border}; background: linear-gradient(90deg, ${({ theme }) => (theme as any).colors.redAlert}22 0%, transparent 50%)`
const ModalTitle = styled.h2`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:16px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:${({ theme }) => (theme as any).colors.redAlert}; margin:0; display:flex; align-items:center; gap:${({ theme }) => (theme as any).spacing.sm}`
const CloseButton = styled.button`background:transparent; border:1px solid ${({ theme }) => (theme as any).colors.border}; border-radius:${({ theme }) => (theme as any).borderRadius.sm}; color:${({ theme }) => (theme as any).colors.textMuted}; padding:${({ theme }) => (theme as any).spacing.xs} ${({ theme }) => (theme as any).spacing.sm}; font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:11px; cursor:pointer; transition:all .2s; &:hover { border-color:${({ theme }) => (theme as any).colors.textPrimary}; color:${({ theme }) => (theme as any).colors.textPrimary} }`
const ModalBody = styled.div`padding:${({ theme }) => (theme as any).spacing.lg}; max-height: calc(90vh - 80px); overflow-y: auto`
const TicketInfo = styled.div`display:flex; flex-direction:column; gap:${({ theme }) => (theme as any).spacing.xs}; margin-bottom:${({ theme }) => (theme as any).spacing.lg}; padding:${({ theme }) => (theme as any).spacing.md}; background:${({ theme }) => (theme as any).colors.bgCard}; border-radius:${({ theme }) => (theme as any).borderRadius.md}; border-left:3px solid ${({ theme }) => (theme as any).colors.redAlert}`
const TicketKey = styled.span`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:14px; font-weight:700; color:${({ theme }) => (theme as any).colors.textPrimary}`
const TicketSummary = styled.span`font-family:${({ theme }) => (theme as any).fonts.ui}; font-size:13px; color:${({ theme }) => (theme as any).colors.textMuted}`
const TicketMeta = styled.div`display:flex; gap:${({ theme }) => (theme as any).spacing.lg}; font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:10px; color:${({ theme }) => (theme as any).colors.textDim}; text-transform:uppercase; flex-wrap: wrap`
const blink = keyframes`50% { border-color: transparent }`
const AnalysisSection = styled.div`margin-bottom:${({ theme }) => (theme as any).spacing.lg}`
const AnalysisLabel = styled.div`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:${({ theme }) => (theme as any).colors.textMuted}; margin-bottom:${({ theme }) => (theme as any).spacing.sm}`
const AnalysisText = styled.div`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:13px; line-height:1.6; color:${({ theme }) => (theme as any).colors.greenPace}; padding:${({ theme }) => (theme as any).spacing.md}; background:${({ theme }) => (theme as any).colors.bgCard}; border-radius:${({ theme }) => (theme as any).borderRadius.md}; border:1px solid ${({ theme }) => (theme as any).colors.border}; position:relative; &::after { content:'▊'; animation:${blink} 1s step-end infinite; color:${({ theme }) => (theme as any).colors.greenPace} }`
const ActionCardsGrid = styled.div`display:grid; grid-template-columns:repeat(3, 1fr); gap:${({ theme }) => (theme as any).spacing.md}; @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }`

// Different styled cards based on relevance
const ActionCard = styled.button<{ $relevance?: 'critical' | 'recommended' | 'available' }>`
  background:${({ theme }) => (theme as any).colors.bgCard}; 
  border:2px solid ${({ theme, $relevance }) =>
    $relevance === 'critical' ? (theme as any).colors.redAlert :
      $relevance === 'recommended' ? (theme as any).colors.greenPace :
        (theme as any).colors.border}; 
  border-radius:${({ theme }) => (theme as any).borderRadius.md}; 
  padding:${({ theme }) => (theme as any).spacing.md}; 
  cursor:pointer; 
  transition:all .3s ease; 
  text-align:left; 
  display:flex; 
  flex-direction:column; 
  gap:${({ theme }) => (theme as any).spacing.sm};
  position: relative;
  
  ${({ $relevance, theme }) => $relevance === 'critical' && css`
    box-shadow: 0 0 20px ${(theme as any).colors.redAlert}44;
    background: linear-gradient(135deg, ${(theme as any).colors.bgCard} 0%, ${(theme as any).colors.redAlert}11 100%);
  `}
  
  ${({ $relevance, theme }) => $relevance === 'recommended' && css`
    box-shadow: 0 0 15px ${(theme as any).colors.greenPace}33;
    background: linear-gradient(135deg, ${(theme as any).colors.bgCard} 0%, ${(theme as any).colors.greenPace}08 100%);
  `}
  
  &:hover { 
    border-color:${({ theme }) => (theme as any).colors.purpleSector}; 
    box-shadow:0 0 20px ${({ theme }) => (theme as any).colors.purpleSector}44; 
    transform: translateY(-2px) 
  } 
  &:active { transform: translateY(0) }
`

const RelevanceBadge = styled.span<{ $type: 'critical' | 'recommended' }>`
  position: absolute;
  top: -8px;
  right: 8px;
  font-family:${({ theme }) => (theme as any).fonts.mono};
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  ${({ $type, theme }) => $type === 'critical' ? css`
    background: ${(theme as any).colors.redAlert};
    color: white;
  ` : css`
    background: ${(theme as any).colors.greenPace};
    color: ${(theme as any).colors.bgMain};
  `}
`

const ActionIcon = styled.div`width:40px; height:40px; border-radius:${({ theme }) => (theme as any).borderRadius.sm}; background:${({ theme }) => (theme as any).colors.bgMain}; display:flex; align-items:center; justify-content:center; font-size:20px`
const ActionTitle = styled.div`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:${({ theme }) => (theme as any).colors.textPrimary}`
const ActionDescription = styled.div`font-family:${({ theme }) => (theme as any).fonts.ui}; font-size:11px; color:${({ theme }) => (theme as any).colors.textMuted}; line-height:1.3`
const ActionReason = styled.div`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:9px; color:${({ theme }) => (theme as any).colors.yellowFlag}; margin-top:${({ theme }) => (theme as any).spacing.xs}; font-style: italic`
const AssigneeBox = styled.div`margin-bottom:${({ theme }) => (theme as any).spacing.md}`
const AssigneeSelect = styled.select`width:100%; padding:${({ theme }) => (theme as any).spacing.sm}; background:${({ theme }) => (theme as any).colors.bgCard}; color:${({ theme }) => (theme as any).colors.textPrimary}; border:1px solid ${({ theme }) => (theme as any).colors.border}; border-radius:${({ theme }) => (theme as any).borderRadius.sm}`

interface StrategyModalProps {
  ticket: any
  boardContext?: { boardType: 'scrum' | 'kanban'; sprintActive?: boolean; sprintDaysRemaining?: number; wipLimit?: number; wipCurrent?: number }
  alertType?: 'stalled' | 'overdue' | 'blocked' | 'capacity' | 'general'
  onClose?: () => void
  onAction?: (action: any, ticket: any, assignee?: string) => void
}

function StrategyModal({ ticket, boardContext, alertType = 'general', onClose, onAction }: StrategyModalProps) {
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
      import('@forge/bridge').then(({ invoke }) => {
        invoke('getAssignableUsers', { issueKey: ticket.key }).then((res: any) => {
          if (res?.success && Array.isArray(res.users)) {
            setUsers(res.users)
            setSelectedAssignee(res.users[0]?.accountId || '')
          }
        }).catch(() => { })
      }).catch(() => { })
    } else {
      const mocked = [
        { accountId: 'mock-sarah', displayName: 'Sarah Connor' },
        { accountId: 'mock-mike', displayName: 'Mike Hamilton' },
        { accountId: 'mock-jess', displayName: 'Jess Vettel' }
      ]
      setUsers(mocked)
      setSelectedAssignee(mocked[0].accountId)
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
                onClick={() => handleAction(action)}
                $relevance={action.relevance === 'critical' || action.relevance === 'recommended' ? action.relevance : undefined}
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
              </ActionCard>
            ))}
          </ActionCardsGrid>
        </ModalBody>
      </ModalContainer>
    </Overlay>
  )
}

export default StrategyModal
