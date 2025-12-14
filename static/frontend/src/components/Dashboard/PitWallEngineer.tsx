import React, { useState, useEffect, useRef } from 'react'
import styled, { keyframes, css } from 'styled-components'
import F1Card from '../Common/F1Card'
import StatusLight from '../Common/StatusLight'
import { t } from '../../i18n'
import { IconButton, RefreshIcon } from '../Common/Buttons'
import { invoke } from '@forge/bridge'

const blinkAnimation = keyframes`0%,100%{opacity:1;box-shadow:0 0 30px rgba(255,0,51,.8), inset 0 0 20px rgba(255,0,51,.3)}50%{opacity:.85;box-shadow:0 0 50px rgba(255,0,51,1), inset 0 0 30px rgba(255,0,51,.5)}`

const EngineerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: ${({ theme }) => (theme as any).spacing.md};
`

const ChatWindow = styled.div`
  flex: 1;
  background: ${({ theme }) => (theme as any).colors.bgMain}55;
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  padding: ${({ theme }) => (theme as any).spacing.md};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as any).spacing.sm};
`

const MessageBubble = styled.div<{ $isSystem?: boolean; $isUser?: boolean; $type?: string }>`
  background: ${({ $isSystem, $isUser, $type, theme }) =>
    $isSystem ? 'transparent' :
      $isUser ? (theme as any).colors.bgCardHover :
        (theme as any).colors.bgCard};
  border: 1px solid ${({ $isSystem, $type, theme }) =>
    $isSystem ? 'transparent' :
      $type === 'critical' ? (theme as any).colors.redAlert :
        (theme as any).colors.border};
  
  padding: ${({ theme }) => (theme as any).spacing.sm};
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  align-self: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
  max-width: 90%;
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  
  ${({ $isSystem }) => $isSystem && css`
    padding: 2px 0;
    width: 100%;
    border-bottom: 1px solid ${({ theme }) => (theme as any).colors.border}33;
    border-radius: 0;
  `}
`

const Timestamp = styled.span`
  color: ${({ theme }) => (theme as any).colors.textMuted};
  font-size: 10px;
  margin-right: 8px;
`

const InputArea = styled.div`
  display: flex;
  gap: ${({ theme }) => (theme as any).spacing.sm};
`

const EngineerInput = styled.input`
  flex: 1;
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  padding: 8px 12px;
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => (theme as any).colors.purpleSector};
  }
`

const StrategyPad = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => (theme as any).spacing.sm};
`

const ActionPill = styled.button`
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  border-left: 3px solid ${({ theme }) => (theme as any).colors.purpleSector};
  color: ${({ theme }) => (theme as any).colors.textSecondary};
  padding: 8px 12px;
  border-radius: 4px; /* Tech-boxy look instead of full round pill */
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background: ${({ theme }) => (theme as any).colors.bgCardHover};
    color: ${({ theme }) => (theme as any).colors.textPrimary};
    border-color: ${({ theme }) => (theme as any).colors.purpleSector};
    box-shadow: 0 0 10px rgba(191, 90, 242, 0.2);
    transform: translateX(2px);
  }
  
  &:active {
    transform: translateX(1px);
  }
`

const BoxBoxButton = styled.button<{ $active: boolean }>`
  width: 100%;
  height: 48px;
  border: none;
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  cursor: ${({ $active }) => ($active ? 'pointer' : 'default')};
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => (theme as any).spacing.md};
  transition: all .3s ease;
  
  ${({ $active, theme }) => ($active ? css`
    background: linear-gradient(135deg, ${(theme as any).colors.redAlert} 0%, #cc0029 100%);
    color: white;
    animation: ${blinkAnimation} 1.5s ease-in-out infinite;
    &:hover { transform: scale(1.02) }
    &:active { transform: scale(.98) }
  ` : css`
    background: ${(theme as any).colors.border};
    color: ${(theme as any).colors.textMuted}
  `)}
`

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const StatusBadge = styled.div`
  font-size: 9px;
  background: ${({ theme }) => (theme as any).colors.bgMain};
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  color: ${({ theme }) => (theme as any).colors.textMuted};
`

interface Props {
  feed: Array<{ time: string; msg: string; type: any }>;
  alertActive: boolean;
  onBoxBox: () => void;
  onRefresh?: () => void;
  boardType?: 'scrum' | 'kanban' | 'unknown';
  projectContext?: any;
}

export default function PitWallEngineer({ feed = [], alertActive, onBoxBox, onRefresh, boardType = 'scrum', projectContext }: Props) {
  const locale = (window as any).__PWS_LOCALE || 'en'
  const chatRef = useRef<HTMLDivElement>(null)
  const [inputText, setInputText] = useState('')
  const [localHistory, setLocalHistory] = useState<any[]>([])
  const isKanban = boardType === 'kanban'

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [feed, localHistory])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim()) return
    const msgText = inputText
    const msg = { time: 'NOW', msg: msgText, type: 'user', isUser: true }
    setLocalHistory(prev => [...prev, msg])
    setInputText('')

    // Add temporary loading bubble
    const loadingId = Date.now()
    setLocalHistory(prev => [...prev, { time: '...', msg: '...', type: 'ai', id: loadingId, isLoading: true }])

    try {
      // FIX: Use Vite env var directly instead of window prop to ensure correct platform detection in production
      const platform = (import.meta as any).env?.VITE_PLATFORM || 'local'
      let response: { success: boolean; answer: string; error?: string }

      if (platform === 'local') {
        // Mock local response
        await new Promise(r => setTimeout(r, 1000))
        response = { success: true, answer: `Local Verify: I received "${msgText}".` }
      } else {
        // Real Forge Invoke
        // We use invoke imported from @forge/bridge in parent App, but here we can't import it comfortably if this is a dumb component?
        // Actually App passed down no invoker? We should import invoke here or assume it's available.
        // We need to import invoke
        response = await invoke('chatWithRovo', { message: msgText }) as any
      }

      setLocalHistory(prev => {
        const filtered = prev.filter(m => m.id !== loadingId)
        if (response.success) {
          return [...filtered, { time: 'NOW', msg: response.answer, type: 'ai' }]
        } else {
          return [...filtered, { time: 'ERR', msg: `Error: ${response.error}`, type: 'critical' }]
        }
      })

    } catch (e) {
      setLocalHistory(prev => prev.filter(m => m.id !== loadingId).concat({ time: 'ERR', msg: "Comms Failure", type: 'critical' }))
    }
  }

  // Merge feed and local history for display, sorting by time if we had real timestamps, 
  // but for now we just append local history to feed or interleave them.
  // Since feed is props-based and might refresh, we'll just show feed then local for this MVP.

  return (
    <F1Card
      title="Pit Wall Engineer (ROVO)"
      badge="LIVE"
      badgeVariant="success"
      fullHeight
      glowColor="purple"
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton onClick={onRefresh} title={t('refreshAll', locale)}><RefreshIcon /></IconButton>
        </div>
      }
    >
      <EngineerContainer>
        <HeaderRow>
          <StatusBadge>MODE: STRATEGIC</StatusBadge>
          <div style={{ display: 'flex', gap: 8 }}>
            <StatusLight status="green" label="COMMS" size="sm" />
            <StatusLight status="green" label="AI CORE" size="sm" />
          </div>
        </HeaderRow>

        <ChatWindow ref={chatRef}>
          {feed.map((item, idx) => (
            <MessageBubble key={`feed-${idx}`} $isSystem $type={item.type}>
              <Timestamp>{item.time}</Timestamp>
              {item.msg}
            </MessageBubble>
          ))}
          {localHistory.map((item, idx) => (
            <MessageBubble key={`local-${idx}`} $isUser={item.isUser} $isSystem={false}>
              <Timestamp>{item.time}</Timestamp>
              {item.msg}
            </MessageBubble>
          ))}
        </ChatWindow>

        <BoxBoxButton $active={alertActive} onClick={alertActive ? onBoxBox : undefined}>
          {alertActive ? "⚠️ BOX BOX (CRITICAL)" : "NO ACTIVE ALERTS"}
        </BoxBoxButton>

        <InputArea as="form" onSubmit={handleSend}>
          <EngineerInput
            placeholder="Ask Rovo for strategy insights..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <IconButton onClick={() => handleSend()} title="Send">➤</IconButton>
        </InputArea>

        <StrategyPad>
          {isKanban ? (
            <>
              <ActionPill type="button" onClick={() => setInputText("Analyze Cycle Time")}>Lap Times</ActionPill>
              <ActionPill type="button" onClick={() => setInputText("Show WIP Aging")}>Tire Deg</ActionPill>
              <ActionPill type="button" onClick={() => setInputText("Check Throughput Trend")}>Flow Rate</ActionPill>
              <ActionPill type="button" onClick={() => setInputText("Identify Blocked Items")}>Red Flags</ActionPill>
            </>
          ) : (
            <>
              <ActionPill type="button" onClick={() => setInputText("Analyze Sprint Velocity")}>Analyze Pace</ActionPill>
              <ActionPill type="button" onClick={() => setInputText("Identify Bottlenecks")}>Find Traffic</ActionPill>
              <ActionPill type="button" onClick={() => setInputText("Predict Completion Date")}>Predict Finish</ActionPill>
              <ActionPill type="button" onClick={() => setInputText("Show Team Health")}>Check Crew</ActionPill>
            </>
          )}
        </StrategyPad>

      </EngineerContainer>
    </F1Card>
  )
}
