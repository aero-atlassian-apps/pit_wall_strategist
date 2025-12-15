import React, { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { invoke } from '@forge/bridge'

const fadeIn = keyframes`from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); }`

const Container = styled.div`
  position: relative;
  display: inline-block;
`

const SelectorButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  border: 1px solid rgba(244, 208, 63, 0.3);
  border-radius: 6px;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(244, 208, 63, 0.6);
  }
`

const BoardIcon = styled.span<{ $type: 'scrum' | 'kanban' }>`
  font-size: 12px;
`

const BoardName = styled.span`
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Chevron = styled.span<{ $open: boolean }>`
  font-size: 8px;
  transition: transform 0.2s ease;
  transform: rotate(${({ $open }) => $open ? '180deg' : '0deg'});
`

const Dropdown = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 220px;
  max-height: 300px;
  overflow-y: auto;
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  border: 1px solid rgba(244, 208, 63, 0.4);
  border-radius: 8px;
  padding: 6px;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  display: ${({ $visible }) => $visible ? 'block' : 'none'};
  animation: ${fadeIn} 0.2s ease-out;
`

const DropdownHeader = styled.div`
  padding: 6px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 6px;
`

const BoardOption = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  background: ${({ $selected }) => $selected ? 'rgba(244, 208, 63, 0.15)' : 'transparent'};
  border: 1px solid ${({ $selected }) => $selected ? 'rgba(244, 208, 63, 0.4)' : 'transparent'};
  border-radius: 6px;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${({ $selected }) => $selected ? 'rgba(244, 208, 63, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  }
`

const BoardOptionIcon = styled.span`
  font-size: 16px;
`

const BoardOptionDetails = styled.div`
  flex: 1;
`

const BoardOptionName = styled.div`
  font-size: 11px;
  font-weight: 600;
`

const BoardOptionType = styled.div`
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
`

const CheckMark = styled.span`
  color: #F4D03F;
  font-size: 12px;
`

const LoadingState = styled.div`
  padding: 20px;
  text-align: center;
  color: #888;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
`

interface Board {
    id: number
    name: string
    type: 'scrum' | 'kanban'
}

interface MultiBoardSelectorProps {
    currentBoardId?: number
    currentBoardName?: string
    currentBoardType?: 'scrum' | 'kanban'
    onBoardChange?: (board: Board) => void
}

export default function MultiBoardSelector({
    currentBoardId,
    currentBoardName = 'Board',
    currentBoardType = 'scrum',
    onBoardChange
}: MultiBoardSelectorProps) {
    const [boards, setBoards] = useState<Board[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Fetch boards when dropdown opens
    useEffect(() => {
        if (!isOpen || boards.length > 0) return

        async function fetchBoards() {
            setIsLoading(true)
            try {
                const result = await invoke('getProjectBoards') as { success: boolean; boards?: Board[] }
                if (result?.success && result.boards) {
                    setBoards(result.boards)
                }
            } catch {
                // Fallback: just show current board
                setBoards([{
                    id: currentBoardId || 0,
                    name: currentBoardName,
                    type: currentBoardType
                }])
            } finally {
                setIsLoading(false)
            }
        }
        fetchBoards()
    }, [isOpen, boards.length, currentBoardId, currentBoardName, currentBoardType])

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (board: Board) => {
        onBoardChange?.(board)
        setIsOpen(false)
    }

    return (
        <Container ref={containerRef}>
            <SelectorButton onClick={() => setIsOpen(!isOpen)}>
                <BoardIcon $type={currentBoardType}>
                    {currentBoardType === 'kanban' ? '📊' : '🏃'}
                </BoardIcon>
                <BoardName>{currentBoardName}</BoardName>
                <Chevron $open={isOpen}>▼</Chevron>
            </SelectorButton>

            <Dropdown $visible={isOpen}>
                <DropdownHeader>{t('switchBoard', (window as any).__PWS_LOCALE || 'en')}</DropdownHeader>

                {isLoading ? (
                    <LoadingState>{t('loadingBoards', (window as any).__PWS_LOCALE || 'en')}</LoadingState>
                ) : boards.length === 0 ? (
                    <LoadingState>{t('noBoardsFound', (window as any).__PWS_LOCALE || 'en')}</LoadingState>
                ) : (
                    boards.map(board => (
                        <BoardOption
                            key={board.id}
                            $selected={board.id === currentBoardId}
                            onClick={() => handleSelect(board)}
                        >
                            <BoardOptionIcon>
                                {board.type === 'kanban' ? '📊' : '🏃'}
                            </BoardOptionIcon>
                            <BoardOptionDetails>
                                <BoardOptionName>{board.name}</BoardOptionName>
                                <BoardOptionType>{board.type}</BoardOptionType>
                            </BoardOptionDetails>
                            {board.id === currentBoardId && <CheckMark>✓</CheckMark>}
                        </BoardOption>
                    ))
                )}
            </Dropdown>
        </Container>
    )
}
import { t } from '../../i18n'
