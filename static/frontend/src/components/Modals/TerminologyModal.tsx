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
  width: 650px; max-width: 90vw; max-height: 85vh; overflow-y: auto;
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

const Body = styled.div`
  padding: 24px;
`

const TermsTable = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => (theme as any).colors.border}44;
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 12px;
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

type Props = {
    open: boolean
    onClose: () => void
}

export default function TerminologyModal({ open, onClose }: Props) {
    const locale = (window as any).__PWS_LOCALE || 'en'

    if (!open) return null

    const items = [
        { f1: 'downforce', icon: '💨' },
        { f1: 'fuel', icon: '⛽' },
        { f1: 'tire', icon: '🛞' },
        { f1: 'grid', icon: '🏁' },
        { f1: 'sectors', icon: '📍' },
        { f1: 'safetycar', icon: '⚠️' },
        { f1: 'boxbox', icon: '📢' },
        { f1: 'pitstop', icon: '🛑' },
    ]

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={e => e.stopPropagation()}>
                <Header>
                    <Title>
                        <span>📖</span>
                        {t('glossary', locale)}
                    </Title>
                    <IconButton onClick={onClose} title={t('close', locale)}><CloseIcon /></IconButton>
                </Header>
                <Body>
                    <TermsTable>
                        <TermRow>
                            <TermHeader>{t('termF1', locale)}</TermHeader>
                            <TermHeader>{t('termAgile', locale)}</TermHeader>
                        </TermRow>
                        {items.map(item => (
                            <TermRow key={item.f1}>
                                <Cell>
                                    <span style={{ marginRight: 8 }}>{item.icon}</span>
                                    <F1Term>{t(`g_${item.f1}`, locale)}</F1Term>
                                </Cell>
                                <Cell>
                                    <AgileTerm>{t(`g_${item.f1}_desc`, locale)}</AgileTerm>
                                </Cell>
                            </TermRow>
                        ))}
                    </TermsTable>
                    <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
                        <strong>💡 {t('proTipTitle', locale)}</strong> {t('proTipBody', locale)}
                    </div>
                </Body>
            </Modal>
        </Overlay>
    )
}
