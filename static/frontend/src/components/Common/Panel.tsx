import React from 'react'
import styled from 'styled-components'

interface PanelProps {
    title: string
    rightAction?: React.ReactNode
    children: React.ReactNode
    className?: string
    loading?: boolean
    error?: string
}

const PanelContainer = styled.section`
  background: var(--bg-panel);
  border-radius: 8px; /* Do not use theme object if possible, rely on var */
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: var(--border-subtle); /* subtle highlight */
  }
`

const PanelHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  min-height: 48px;
  background: var(--bg-panel);
`

const PanelTitle = styled.h2`
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-secondary);
  font-weight: 600;
  margin: 0;
`

const PanelContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 0;
  position: relative;
`

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg-panel);
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

export const Panel: React.FC<PanelProps> = ({ title, rightAction, children, className, loading, error }) => {
    return (
        <PanelContainer className={className}>
            <PanelHeader>
                <PanelTitle>{title}</PanelTitle>
                {rightAction && <div>{rightAction}</div>}
            </PanelHeader>
            <PanelContent>
                {error ? (
                    <ErrorState>
                        ⚠️ {error}
                    </ErrorState>
                ) : (
                    children
                )}
                {loading && <LoadingOverlay>INITIALIZING...</LoadingOverlay>}
            </PanelContent>
        </PanelContainer>
    )
}
