import React, { ReactNode } from 'react'
import styled from 'styled-components'

interface PanelProps {
    children: ReactNode
    title?: string
    action?: ReactNode
    className?: string
    noPadding?: boolean
}

const GlassFrame = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;

  /* Dark mode specific glass/glow */
  [data-theme='dark'] & {
    background: var(--bg-surface);
    border-color: var(--border-app);
    box-shadow: var(--shadow-md);
  }

  /* Interactive hover state if needed */
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

const Body = styled.div<{ $noPadding?: boolean }>`
  padding: ${({ $noPadding }) => $noPadding ? '0' : 'var(--space-4)'};
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent spillover */
  position: relative;
`

export const PanelContainer: React.FC<PanelProps> = ({
    children,
    title,
    action,
    className,
    noPadding = false
}) => {
    return (
        <GlassFrame className={className}>
            {(title || action) && (
                <Header>
                    <Title>{title}</Title>
                    {action && <div>{action}</div>}
                </Header>
            )}
            <Body $noPadding={noPadding}>
                {children}
            </Body>
        </GlassFrame>
    )
}
