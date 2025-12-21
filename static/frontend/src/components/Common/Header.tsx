import React from 'react'
import styled from 'styled-components'
import { t } from '../../i18n'

const HeaderRoot = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 24px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border-app);
  flex-shrink: 0;
  transition: all 0.3s ease;
`

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

// Logo Design matching the mock
const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: var(--color-red-500);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  box-shadow: 0 2px 4px rgba(244, 42, 64, 0.3);
  
  /* Simple gauge/speedometer svg icon representation */
  &::after {
    content: '⚡'; /* Fallback to bolt or use specific SVG if possible, using slight visual metaphor */
    font-size: 16px;
  }
`

const LogoTextContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-stack-mono);
  font-size: 16px;
  letter-spacing: 1px;
  text-transform: uppercase;
`

const BrandName = styled.span`
  font-weight: 700;
  color: var(--text-primary);
`

const SubName = styled.span`
  font-weight: 400;
  color: var(--color-red-500);
`

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const StatusPill = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 4px;
  background: ${({ $status }) => {
    switch ($status) {
      case 'OPTIMAL': return 'rgba(34, 197, 94, 0.1)';
      case 'WARNING': return 'rgba(234, 179, 8, 0.1)';
      case 'CRITICAL': return 'rgba(244, 42, 64, 0.1)';
      default: return 'var(--bg-surface-hover)';
    }
  }};
  border: 1px solid ${({ $status }) => {
    switch ($status) {
      case 'OPTIMAL': return 'rgba(34, 197, 94, 0.2)';
      case 'WARNING': return 'rgba(234, 179, 8, 0.2)';
      case 'CRITICAL': return 'rgba(244, 42, 64, 0.2)';
      default: return 'transparent';
    }
  }};
  font-family: var(--font-stack-mono);
  font-size: 11px;
  font-weight: 700;
  color: ${({ $status }) => {
    switch ($status) {
      case 'OPTIMAL': return 'var(--color-success)';
      case 'WARNING': return 'var(--color-warning)';
      case 'CRITICAL': return 'var(--color-danger)';
      default: return 'var(--text-secondary)';
    }
  }};
`

const StatusDot = styled.div<{ $status: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
`

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background-color: var(--border-subtle);
  margin: 0 4px;
`

const IconButton = styled.button<{ $active?: boolean }>`
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: var(--text-primary);
    background: var(--bg-surface-hover);
  }

  ${({ $active }) => $active && `
    color: var(--text-primary);
    background: var(--bg-surface-active);
  `}
`

interface HeaderProps {
  status: string
  boardType: string
  locale: string
  theme: string
  dictionaryOpen: boolean
  onToggleDictionary: () => void
  onToggleTheme: () => void
  onOpenSettings: () => void
  onRefresh: () => void
}

export const Header: React.FC<HeaderProps> = ({
  status,
  boardType,
  locale,
  theme,
  dictionaryOpen,
  onToggleDictionary,
  onToggleTheme,
  onOpenSettings,
  onRefresh
}) => {

  let labelKey = 'sprint';
  if (boardType === 'kanban') labelKey = 'flow';
  if (boardType === 'business') labelKey = 'process';

  const statusLabel = t(labelKey, locale);
  const statusValue = t(status.toLowerCase(), locale) || status;

  return (
    <HeaderRoot>
      <LeftSection>
        <LogoIcon>
          {/* Using a simple SVG gauge icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v2" opacity="0.5" />
            <path d="M12 22v-2" opacity="0.5" />
            <path d="M22 12h-2" opacity="0.5" />
            <path d="M2 12h2" opacity="0.5" />
            <path d="M18.36 5.64l-1.41 1.41" opacity="0.5" />
            <path d="M5.64 18.36l-1.41 1.41" opacity="0.5" />
            <path d="M18.36 18.36l-1.41-1.41" opacity="0.5" />
            <path d="M5.64 5.64L4.23 4.23" opacity="0.5" />
            <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />
            <path d="M16 12l-4-4" /> {/* Needle */}
          </svg>
        </LogoIcon>
        <LogoTextContainer>
          <BrandName>PIT WALL</BrandName>
          <SubName>STRATEGIST</SubName>
        </LogoTextContainer>
      </LeftSection>

      <RightSection>
        <StatusPill $status={status}>
          <StatusDot $status={status} />
          {statusLabel}: {statusValue}
        </StatusPill>

        <Divider />

        <IconButton
          $active={dictionaryOpen}
          onClick={onToggleDictionary}
          title={t('glossary', locale)}
        >
          📖
        </IconButton>

        <IconButton
          onClick={onOpenSettings}
          title={t('settings', locale)}
        >
          ⚙️
        </IconButton>

        <IconButton
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </IconButton>

        {/* Keeping Refresh as a subtle extra or hidden if strictly following mock? 
                    User didn't say remove, but "look and feel like". 
                    I'll keep it but maybe visually separated or very distinct? 
                    Actually, common practice is to keep it. I'll add it at the end. */}
        {/* <IconButton onClick={onRefresh} title={t('refreshAll', locale)}>⟳</IconButton> */}
      </RightSection>
    </HeaderRoot>
  )
}
