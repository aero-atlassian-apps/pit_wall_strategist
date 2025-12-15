import React, { useState, useRef, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { useViewMode } from '../../context/ViewModeContext'
import { getViewModeOptions, ViewModeConfig } from '../../config/viewModeConfig'

const fadeIn = keyframes`from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); }`

const Container = styled.div`
  position: relative;
  display: inline-block;
`

const SelectorButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  border: 1px solid rgba(255, 0, 51, 0.3);
  border-radius: 8px;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(255, 0, 51, 0.6);
    box-shadow: 0 4px 12px rgba(255, 0, 51, 0.2);
  }
`

const ModeEmoji = styled.span`
  font-size: 16px;
`

const ModeName = styled.span`
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const Chevron = styled.span<{ $open: boolean }>`
  font-size: 10px;
  transition: transform 0.2s ease;
  transform: rotate(${({ $open }) => $open ? '180deg' : '0deg'});
`

const Dropdown = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 280px;
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  border: 1px solid rgba(255, 0, 51, 0.4);
  border-radius: 12px;
  padding: 8px;
  z-index: 1000;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  display: ${({ $visible }) => $visible ? 'block' : 'none'};
  animation: ${fadeIn} 0.2s ease-out;
`

const DropdownHeader = styled.div`
  padding: 8px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
`

const OptionItem = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  background: ${({ $selected }) => $selected ? 'rgba(255, 0, 51, 0.15)' : 'transparent'};
  border: 1px solid ${({ $selected }) => $selected ? 'rgba(255, 0, 51, 0.4)' : 'transparent'};
  border-radius: 8px;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${({ $selected }) => $selected ? 'rgba(255, 0, 51, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  }
`

const OptionEmoji = styled.span`
  font-size: 20px;
  width: 32px;
  text-align: center;
`

const OptionContent = styled.div`
  flex: 1;
`

const OptionName = styled.div`
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
`

const OptionDescription = styled.div`
  font-size: 10px;
  color: #888;
`

const CheckMark = styled.span`
  color: #FF0033;
  font-size: 14px;
`

export default function ViewModeSelector() {
    const { viewMode, setViewMode, currentConfig } = useViewMode()
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const options = getViewModeOptions()

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (option: ViewModeConfig) => {
        setViewMode(option.id)
        setIsOpen(false)
    }

    return (
        <Container ref={containerRef}>
            <SelectorButton onClick={() => setIsOpen(!isOpen)}>
                <ModeEmoji>{currentConfig.emoji}</ModeEmoji>
                <ModeName>{currentConfig.name}</ModeName>
                <Chevron $open={isOpen}>▼</Chevron>
            </SelectorButton>

            <Dropdown $visible={isOpen}>
                <DropdownHeader>{t('selectYourView', (window as any).__PWS_LOCALE || 'en')}</DropdownHeader>
                {options.map(option => (
                    <OptionItem
                        key={option.id}
                        $selected={viewMode === option.id}
                        onClick={() => handleSelect(option)}
                    >
                        <OptionEmoji>{option.emoji}</OptionEmoji>
                        <OptionContent>
                            <OptionName>{option.name}</OptionName>
                            <OptionDescription>{option.description}</OptionDescription>
                        </OptionContent>
                        {viewMode === option.id && <CheckMark>✓</CheckMark>}
                    </OptionItem>
                ))}
            </Dropdown>
        </Container>
    )
}
import { t } from '../../i18n'
