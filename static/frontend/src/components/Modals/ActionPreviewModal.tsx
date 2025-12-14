import React from 'react'
import styled, { keyframes } from 'styled-components'
import { t } from '../../i18n'

const fadeIn = keyframes`from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); }`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`

const Modal = styled.div`
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  border-radius: ${({ theme }) => (theme as any).borderRadius.lg};
  padding: 24px;
  max-width: 500px;
  width: 90%;
  animation: ${fadeIn} 0.2s ease-out;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => (theme as any).colors.border};
`

const ActionIcon = styled.div<{ $variant?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: ${({ $variant, theme }) =>
        $variant === 'danger' ? 'rgba(255, 0, 51, 0.2)' :
            $variant === 'warning' ? 'rgba(244, 208, 63, 0.2)' :
                'rgba(191, 90, 242, 0.2)'};
  border: 2px solid ${({ $variant, theme }) =>
        $variant === 'danger' ? (theme as any).colors.redAlert :
            $variant === 'warning' ? '#F4D03F' :
                (theme as any).colors.purpleSector};
`

const Title = styled.h2`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
`

const Subtitle = styled.p`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
  margin: 4px 0 0 0;
`

const PreviewSection = styled.div`
  background: ${({ theme }) => (theme as any).colors.bgMain};
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  padding: 16px;
  margin-bottom: 20px;
`

const PreviewTitle = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
`

const PreviewItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  
  &:last-child { margin-bottom: 0; }
`

const PreviewLabel = styled.span`
  color: ${({ theme }) => (theme as any).colors.textMuted};
  min-width: 80px;
`

const PreviewValue = styled.span`
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  word-break: break-word;
`

const ChangeSummary = styled.div<{ $type?: 'add' | 'remove' | 'modify' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  background: ${({ $type }) =>
        $type === 'add' ? 'rgba(57, 255, 20, 0.1)' :
            $type === 'remove' ? 'rgba(255, 0, 51, 0.1)' :
                'rgba(191, 90, 242, 0.1)'};
  border-left: 3px solid ${({ $type }) =>
        $type === 'add' ? '#39FF14' :
            $type === 'remove' ? '#FF0033' :
                '#BF5AF2'};
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  
  &:last-child { margin-bottom: 0; }
`

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`

const Button = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 12px 20px;
  border: 1px solid ${({ $primary, theme }) =>
        $primary ? (theme as any).colors.purpleSector : (theme as any).colors.border};
  background: ${({ $primary, theme }) =>
        $primary ? (theme as any).colors.purpleSector : 'transparent'};
  color: ${({ $primary, theme }) =>
        $primary ? 'white' : (theme as any).colors.textSecondary};
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ $primary, theme }) =>
        $primary ? '#9b4dca' : (theme as any).colors.bgCardHover};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const LoadingSpinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

interface ActionPreviewProps {
    open: boolean
    action: {
        id: string
        name: string
        description?: string
        icon?: string
    }
    ticket: {
        key: string
        summary?: string
        assignee?: string
        status?: string
    }
    changes: Array<{
        type: 'add' | 'remove' | 'modify'
        label: string
        from?: string
        to?: string
    }>
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
}

const actionIcons: Record<string, string> = {
    'split-ticket': '✂️',
    'reassign-ticket': '👥',
    'defer-ticket': '🏁',
    'change-priority': '🔵',
    'transition-issue': '⚡',
    'add-blocker-flag': '🚩',
    'link-issues': '🔗',
    'update-estimate': '⛽',
    'add-radio-message': '📻',
    'create-subtask': '📋'
}

const actionVariants: Record<string, string> = {
    'defer-ticket': 'warning',
    'add-blocker-flag': 'danger'
}

export default function ActionPreviewModal({
    open,
    action,
    ticket,
    changes,
    loading = false,
    onConfirm,
    onCancel
}: ActionPreviewProps) {
    const locale = (window as any).__PWS_LOCALE || 'en'

    if (!open) return null

    const icon = actionIcons[action.id] || '🔧'
    const variant = actionVariants[action.id]

    return (
        <Overlay onClick={onCancel}>
            <Modal onClick={(e) => e.stopPropagation()}>
                <Header>
                    <ActionIcon $variant={variant}>{icon}</ActionIcon>
                    <div>
                        <Title>{action.name}</Title>
                        <Subtitle>{action.description || 'Execute pit strategy'}</Subtitle>
                    </div>
                </Header>

                <PreviewSection>
                    <PreviewTitle>Target Issue</PreviewTitle>
                    <PreviewItem>
                        <PreviewLabel>Key:</PreviewLabel>
                        <PreviewValue>{ticket.key}</PreviewValue>
                    </PreviewItem>
                    <PreviewItem>
                        <PreviewLabel>Summary:</PreviewLabel>
                        <PreviewValue>{ticket.summary || 'No summary'}</PreviewValue>
                    </PreviewItem>
                    {ticket.assignee && (
                        <PreviewItem>
                            <PreviewLabel>Driver:</PreviewLabel>
                            <PreviewValue>{ticket.assignee}</PreviewValue>
                        </PreviewItem>
                    )}
                    {ticket.status && (
                        <PreviewItem>
                            <PreviewLabel>Status:</PreviewLabel>
                            <PreviewValue>{ticket.status}</PreviewValue>
                        </PreviewItem>
                    )}
                </PreviewSection>

                <PreviewSection>
                    <PreviewTitle>Proposed Changes</PreviewTitle>
                    {changes.map((change, idx) => (
                        <ChangeSummary key={idx} $type={change.type}>
                            <span>{change.type === 'add' ? '➕' : change.type === 'remove' ? '➖' : '↔️'}</span>
                            <span>
                                <strong>{change.label}:</strong>{' '}
                                {change.from && change.to
                                    ? `${change.from} → ${change.to}`
                                    : change.to || change.from || 'Will be updated'}
                            </span>
                        </ChangeSummary>
                    ))}
                </PreviewSection>

                <ButtonRow>
                    <Button onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button $primary onClick={onConfirm} disabled={loading}>
                        {loading && <LoadingSpinner />}
                        {loading ? 'Executing...' : 'Confirm Strategy'}
                    </Button>
                </ButtonRow>
            </Modal>
        </Overlay>
    )
}
