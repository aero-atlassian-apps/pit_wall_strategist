import React, { ReactNode, useState } from 'react'
import styled from 'styled-components'

interface PanelProps {
  children: ReactNode
  title?: string
  action?: ReactNode
  className?: string
  noPadding?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
  style?: React.CSSProperties
}

const GlassFrame = styled.div<{ $collapsed?: boolean }>`
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

  /* Dark mode specific glass/glow */
  [data-theme='dark'] & {
    background: var(--bg-surface);
    border-color: var(--border-app);
    box-shadow: var(--shadow-md);
  }

  /* Interactive hover state */
  &:hover {
    border-color: var(--border-focus);
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-app);
  background: var(--bg-surface-subtle);
  min-height: 48px;
  cursor: pointer; /* Enable clicking header to toggle if collapsible */
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Title = styled.h2`
  margin: 0;
  font-family: var(--font-stack-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
`

const Body = styled.div<{ $noPadding?: boolean; $collapsed?: boolean }>`
  padding: ${({ $noPadding }) => $noPadding ? '0' : 'var(--space-4)'};
  flex: 1;
  display: ${({ $collapsed }) => $collapsed ? 'none' : 'flex'};
  flex-direction: column;
  overflow: hidden; /* Prevent spillover */
  position: relative;
`

const CollapseIcon = styled.span<{ $collapsed?: boolean }>`
    font-size: 16px;
    transition: transform 0.2s;
    transform: rotate(${({ $collapsed }) => $collapsed ? '-90deg' : '0deg'});
    opacity: 0.5;
`

export const PanelContainer: React.FC<PanelProps> = ({
  children,
  title,
  action,
  className,
  noPadding = false,
  collapsible = false,
  defaultCollapsed = false,
  style
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const handleToggle = () => {
    if (collapsible) setIsCollapsed(!isCollapsed)
  }

  return (
    <GlassFrame className={className} $collapsed={isCollapsed} style={style}>
      {(title || action) && (
        <Header onClick={handleToggle} style={{ cursor: collapsible ? 'pointer' : 'default' }}>
          <HeaderLeft>
            {collapsible && <CollapseIcon $collapsed={isCollapsed}>▼</CollapseIcon>}
            <Title>{title}</Title>
          </HeaderLeft>
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        </Header>
      )}
      <Body $noPadding={noPadding} $collapsed={isCollapsed}>
        {children}
      </Body>
    </GlassFrame>
  )
}
