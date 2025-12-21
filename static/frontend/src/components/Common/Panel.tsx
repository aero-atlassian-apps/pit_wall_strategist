import React, { useState } from 'react'
import styled from 'styled-components'

interface PanelProps {
  title: string
  rightAction?: React.ReactNode
  children: React.ReactNode
  className?: string
  loading?: boolean
  error?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const GlassFrame = styled.section<{ $collapsed?: boolean }>`
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  height: ${({ $collapsed }) => $collapsed ? 'auto' : '100%'};
  min-height: ${({ $collapsed }) => $collapsed ? 'auto' : 'min-content'};

  [data-theme='dark'] & {
    background: var(--bg-surface);
    border-color: var(--border-app);
    box-shadow: var(--shadow-md);
  }

  &:hover {
    border-color: var(--border-focus);
  }
`

const PanelHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-app);
  background: var(--bg-surface-subtle);
  min-height: 48px;
  cursor: pointer;
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const PanelTitle = styled.h2`
  margin: 0;
  font-family: var(--font-stack-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  color: var(--text-secondary);
`

const PanelContent = styled.div<{ $collapsed?: boolean; $padding?: string }>`
  flex: 1;
  overflow: auto;
  padding: ${({ $padding }) => $padding || 'var(--space-4)'};
  position: relative;
  display: ${({ $collapsed }) => $collapsed ? 'none' : 'block'};
`

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg-surface);
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-tertiary);
`

const ErrorState = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--color-danger);
  font-family: var(--font-mono);
  font-size: 12px;
`

const CollapseIcon = styled.span<{ $collapsed?: boolean }>`
    font-size: 16px;
    transition: transform 0.2s;
    transform: rotate(${({ $collapsed }) => $collapsed ? '-90deg' : '0deg'});
    opacity: 0.5;
`

export const Panel: React.FC<PanelProps> = ({
  title,
  rightAction,
  children,
  className,
  loading,
  error,
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const handleToggle = () => {
    if (collapsible) setIsCollapsed(!isCollapsed)
  }

  return (
    <GlassFrame className={className} $collapsed={isCollapsed}>
      <PanelHeader onClick={handleToggle} style={{ cursor: collapsible ? 'pointer' : 'default' }}>
        <HeaderLeft>
          {collapsible && <CollapseIcon $collapsed={isCollapsed}>▼</CollapseIcon>}
          <PanelTitle>{title}</PanelTitle>
        </HeaderLeft>
        <div onClick={(e) => e.stopPropagation()}>{rightAction}</div>
      </PanelHeader>
      <PanelContent $collapsed={isCollapsed}>
        {error ? (
          <ErrorState>⚠️ {error}</ErrorState>
        ) : (
          children
        )}
        {loading && <LoadingOverlay>INITIALIZING...</LoadingOverlay>}
      </PanelContent>
    </GlassFrame>
  )
}
