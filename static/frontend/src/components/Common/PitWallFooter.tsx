import React from 'react'
import styled from 'styled-components'

const FooterRoot = styled.footer`
  height: 28px;
  background-color: var(--bg-surface);
  border-top: 1px solid var(--border-app);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  z-index: 100;
  font-family: var(--font-stack-mono);
  font-size: 10px;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  user-select: none;
`

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const StatusDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-success);
  box-shadow: 0 0 4px var(--color-success);
`

const Divider = styled.div`
  width: 1px;
  height: 12px;
  background-color: var(--border-subtle);
`

const FooterAction = styled.button`
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-family: inherit;
  font-size: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  padding: 0;
  text-transform: uppercase;
  transition: color 0.2s;

  &:hover {
    color: var(--text-primary);
    text-decoration: underline;
  }
`

interface PitWallFooterProps {
    onOpenDiagnostics: () => void
}

export const PitWallFooter: React.FC<PitWallFooterProps> = ({ onOpenDiagnostics }) => {
    return (
        <FooterRoot>
            <LeftSection>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusDot />
                    <span>SYSTEMS: NOMINAL</span>
                </div>
                <Divider />
                <span>API: ONLINE</span>
            </LeftSection>

            <RightSection>
                <FooterAction onClick={onOpenDiagnostics}>Diagnostics</FooterAction>
                <FooterAction title="Race Control Center" style={{ cursor: 'default', textDecoration: 'none' }}>Race Control</FooterAction>
            </RightSection>
        </FooterRoot>
    )
}
