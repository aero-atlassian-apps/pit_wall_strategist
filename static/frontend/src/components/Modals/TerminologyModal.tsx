import React from 'react'
import styled, { keyframes } from 'styled-components'
import { t } from '../../i18n'
import { IconButton, CloseIcon } from '../Common/Buttons'

const fadeIn = keyframes`from{opacity:0}to{opacity:1}`
const slideUp = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1100;
  animation: ${fadeIn} 0.2s ease-out;
`

const Modal = styled.div`
  width: 750px; max-width: 90vw; max-height: 85vh; overflow-y: auto;
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  border-radius: ${({ theme }) => (theme as any).borderRadius.lg};
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex; flex-direction: column;
  animation: ${slideUp} 0.3s ease-out;
`

const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between; padding: 16px 24px;
  border-bottom: 1px solid ${({ theme }) => (theme as any).colors.border};
  background: linear-gradient(90deg, ${({ theme }) => (theme as any).colors.bgCard} 0%, rgba(191, 90, 242, 0.1) 100%);
`

const Title = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 2px;
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  display: flex; align-items: center; gap: 12px;
`

const PopulationBadge = styled.span<{ $mode: string }>`
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  background: ${({ $mode, theme }) => $mode === 'scrum'
    ? (theme as any).colors.purpleSector + '33'
    : $mode === 'flow'
      ? (theme as any).colors.yellowFlag + '33'
      : (theme as any).colors.greenPace + '33'};
  color: ${({ $mode, theme }) => $mode === 'scrum'
    ? (theme as any).colors.purpleSector
    : $mode === 'flow'
      ? (theme as any).colors.yellowFlag
      : (theme as any).colors.greenPace};
  text-transform: uppercase;
`

const Body = styled.div`
  padding: 24px;
`

const TermsTable = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
`

const TermRow = styled.div`
  display: contents;
  &:hover > div { background: ${({ theme }) => (theme as any).colors.bgCardHover}; }
`

const TermHeader = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
  padding-bottom: 8px; border-bottom: 2px solid ${({ theme }) => (theme as any).colors.border};
  margin-bottom: 8px;
`

const Cell = styled.div`
  padding: 10px;
  border-bottom: 1px solid ${({ theme }) => (theme as any).colors.border}44;
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  transition: background 0.2s;
  border-radius: 4px;
`

const F1Term = styled.span`
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  font-weight: 600;
`

const AgileTerm = styled.span`
  color: ${({ theme }) => (theme as any).colors.greenPace};
`

const BusinessTerm = styled.span`
  color: ${({ theme }) => (theme as any).colors.yellowFlag};
`

type Props = {
  open: boolean
  onClose: () => void
  boardType?: 'scrum' | 'kanban' | 'business'
}

// Helper to derive population mode from board type (same logic as backend)
function derivePopulationMode(boardType: string): 'scrum' | 'flow' | 'process' {
  if (boardType === 'scrum') return 'scrum'
  if (boardType === 'kanban') return 'flow'
  return 'process'
}

export default function TerminologyModal({ open, onClose, boardType = 'scrum' }: Props) {
  const locale = (window as any).__PWS_LOCALE || 'en'
  const populationMode = derivePopulationMode(boardType)

  if (!open) return null

  // F1 terminology with population-specific real-world equivalents
  const items = [
    {
      f1: 'race',
      icon: '🏎️',
      scrum: 'Sprint',
      flow: 'Cycle',
      process: 'Workflow Period'
    },
    {
      f1: 'driver',
      icon: '👤',
      scrum: 'Developer / Assignee',
      flow: 'Team Member',
      process: 'Owner / Assignee'
    },
    {
      f1: 'pitstop',
      icon: '🛑',
      scrum: 'Sprint Planning / Refinement',
      flow: 'Replenishment',
      process: 'Task Review'
    },
    {
      f1: 'boxbox',
      icon: '📢',
      scrum: 'Urgent Intervention (Blocker)',
      flow: 'Pull System Signal',
      process: 'Escalation Required'
    },
    {
      f1: 'velocity',
      icon: '⚡',
      scrum: 'Velocity (Story Points/Sprint)',
      flow: 'Throughput (Items/Week)',
      process: 'Delivery Rate'
    },
    {
      f1: 'laptime',
      icon: '⏱️',
      scrum: 'Cycle Time',
      flow: 'Cycle Time',
      process: 'Lead Time'
    },
    {
      f1: 'fuel',
      icon: '⛽',
      scrum: 'Sprint Capacity',
      flow: 'WIP Capacity',
      process: 'Team Bandwidth'
    },
    {
      f1: 'sectors',
      icon: '📍',
      scrum: 'Workflow Stages (Columns)',
      flow: 'Kanban Swimlanes',
      process: 'Process Stages'
    },
    {
      f1: 'safetycar',
      icon: '⚠️',
      scrum: 'Blocker / Impediment',
      flow: 'Queue Congestion',
      process: 'Process Bottleneck'
    },
    {
      f1: 'downforce',
      icon: '💨',
      scrum: 'Team Stability/Focus',
      flow: 'Flow Efficiency',
      process: 'Process Efficiency'
    },
    {
      f1: 'dragdetected',
      icon: '🔴',
      scrum: 'Stalled Ticket (No Progress)',
      flow: 'Aging WIP Item',
      process: 'Delayed Task'
    },
    {
      f1: 'greenflag',
      icon: '🟢',
      scrum: 'Sprint Started',
      flow: 'Work Flowing',
      process: 'Period Active'
    },
  ]

  const populationLabel = populationMode === 'scrum' ? 'Scrum / Sprint Teams'
    : populationMode === 'flow' ? 'Kanban / Flow Teams'
      : 'Business / Process Teams'

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>
            <span>📖</span>
            {t('glossary', locale)}
            <PopulationBadge $mode={populationMode}>{populationLabel}</PopulationBadge>
          </Title>
          <IconButton onClick={onClose} title={t('close', locale)}><CloseIcon /></IconButton>
        </Header>
        <Body>
          <TermsTable>
            <TermRow>
              <TermHeader>🏎️ {t('termF1', locale)}</TermHeader>
              <TermHeader>📊 {populationMode === 'scrum' ? 'Scrum' : populationMode === 'flow' ? 'Kanban' : 'Business'}</TermHeader>
              <TermHeader>💡 {t('termDesc', locale) || 'Description'}</TermHeader>
            </TermRow>
            {items.map(item => (
              <TermRow key={item.f1}>
                <Cell>
                  <span style={{ marginRight: 8 }}>{item.icon}</span>
                  <F1Term>{t(`g_${item.f1}`, locale) || item.f1.toUpperCase()}</F1Term>
                </Cell>
                <Cell>
                  {populationMode === 'scrum' && <AgileTerm>{item.scrum}</AgileTerm>}
                  {populationMode === 'flow' && <BusinessTerm>{item.flow}</BusinessTerm>}
                  {populationMode === 'process' && <BusinessTerm>{item.process}</BusinessTerm>}
                </Cell>
                <Cell style={{ color: '#94A3B8', fontSize: 10 }}>
                  {t(`g_${item.f1}_desc`, locale)}
                </Cell>
              </TermRow>
            ))}
          </TermsTable>
          <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
            <strong>💡 {t('proTipTitle', locale)}</strong> {t('proTipBody', locale)}
          </div>
          <div style={{ marginTop: 16, padding: 12, background: populationMode === 'scrum' ? 'rgba(191,90,242,0.1)' : populationMode === 'flow' ? 'rgba(245,158,11,0.1)' : 'rgba(74,222,128,0.1)', borderRadius: 8, fontSize: 10, color: '#94A3B8' }}>
            <strong>ℹ️ {t('populationNote', locale) || 'Population Mode'}:</strong> {
              populationMode === 'scrum'
                ? (t('populationScrumDesc', locale) || 'Terminology optimized for Sprint-based teams using Scrum methodology.')
                : populationMode === 'flow'
                  ? (t('populationFlowDesc', locale) || 'Terminology optimized for Kanban/Flow teams focused on continuous delivery.')
                  : (t('populationProcessDesc', locale) || 'Terminology optimized for Business teams managing work without sprints.')
            }
          </div>
        </Body>
      </Modal>
    </Overlay>
  )
}
