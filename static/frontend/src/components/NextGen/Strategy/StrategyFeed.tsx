import React from 'react'
import styled from 'styled-components'
import { PanelContainer } from '../Layout/PanelContainer'
import { t } from '../../../i18n'

interface Recommendation {
  id: string
  title: string
  description: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'OPPORTUNITY'
  type: string
  issueKey?: string
}

interface StrategyFeedProps {
  recommendations: Recommendation[]
  onAction: (id: string, type: string) => void
  onBoxBox: () => void
  boardType?: string
}

// -- Styled Components matching the new aesthetic --

const FeedContainer = styled.div`
  position: relative;
  flex: 1;
  min-height: 0; /* Critical for nested flex scrolling */
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
`

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }
`

const FeedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

/* Updated Card Style: White card with colored left border */
const StrategyCard = styled.div`
  background: var(--bg-card); /* Should be lighter/white in dark mode or contrasty */
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05); /* Subtle shadow */
  border: 1px solid var(--border-subtle); /* Very subtle border */
  display: flex;
  overflow: hidden;
  min-height: 80px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
`

const ColorStripe = styled.div<{ $severity: string }>`
  width: 4px;
  flex-shrink: 0;
  background: ${({ $severity }) => {
    switch ($severity) {
      case 'CRITICAL': return 'var(--color-red-500)';
      case 'WARNING': return 'var(--color-yellow-500)';
      case 'OPPORTUNITY': return 'var(--color-green-500)';
      case 'INFO': default: return 'var(--color-slate-400)';
    }
  }};
`

const CardContent = styled.div`
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
`

const CardTitle = styled.div`
  font-family: var(--font-stack-ui);
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
`

const Icon = styled.span<{ $severity: string }>`
  font-size: 14px;
  line-height: 1;
  color: ${({ $severity }) => {
    switch ($severity) {
      case 'CRITICAL': return 'var(--color-red-500)';
      case 'WARNING': return 'var(--color-yellow-500)';
      case 'OPPORTUNITY': return 'var(--color-green-500)';
      case 'INFO': default: return 'var(--color-slate-400)';
    }
  }};
`

const CardMeta = styled.span`
  font-family: var(--font-stack-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const CardDesc = styled.p`
  font-family: var(--font-stack-ui);
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 4px 0 0 0;
`

/* Updated Footer Button: Full width, solid red */
const FooterContainer = styled.div`
  padding: 16px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  z-index: 10;
`

const BoxBoxButton = styled.button`
  width: 100%;
  background: #F42A40; /* F1 Red */
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-family: var(--font-stack-mono);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(244, 42, 64, 0.3);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #D11E32;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(244, 42, 64, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`

const LiveButton = styled.div`
    background: var(--color-red-500);
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    font-family: var(--font-stack-mono);
`

const InlineSvg = styled.svg<{ $severity: string }>`
  width: 16px;
  height: 16px;
  fill: ${({ $severity }) => {
    switch ($severity) {
      case 'CRITICAL': return 'var(--color-red-500)';
      case 'WARNING': return 'var(--color-yellow-500)';
      case 'OPPORTUNITY': return 'var(--color-green-500)';
      case 'INFO': default: return 'var(--color-slate-400)';
    }
  }};
`

// Simple SVG paths for standard icons
const ICONS = {
  flag: "M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z",
  timelapse: "M16.24 7.76C15.07 6.59 13.54 6 12 6v6l-4.24 4.24c2.34 2.34 6.14 2.34 8.49 0 2.34-2.34 2.34-6.14-.01-8.48zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z",
  bolt: "M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z",
  info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
};

const getIconPath = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return ICONS.flag;
    case 'WARNING': return ICONS.timelapse;
    case 'OPPORTUNITY': return ICONS.bolt;
    case 'INFO': default: return ICONS.info;
  }
}

// -- Icons Helper --
const getIcon = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return 'flag';     // material icon name
    case 'WARNING': return 'timelapse';
    case 'OPPORTUNITY': return 'bolt';
    case 'INFO': default: return 'info';
  }
}

const getF1Metaphor = (severity: string, fallbackTitle: string): string => {
  switch (severity) {
    case 'CRITICAL': return `Red Flag: ${fallbackTitle}`;
    case 'WARNING': return `Tire Wear: ${fallbackTitle}`;
    case 'OPPORTUNITY': return `DRS Available: ${fallbackTitle}`;
    case 'INFO': return `Weather Report: ${fallbackTitle}`;
    default: return fallbackTitle;
  }
}

export const StrategyFeed: React.FC<StrategyFeedProps> = ({
  recommendations,
  onAction,
  onBoxBox,
  boardType = 'scrum'
}) => {
  const locale = (window as any).__PWS_LOCALE || 'en'
  // Always show button if requested, or maybe always?
  // User asked for it to be visible. Let's make it always visible as the main CTA.

  return (
    <PanelContainer
      title="Strategy Assistant"
      action={<LiveButton>LIVE FEED</LiveButton>}
      collapsible
    >
      <FeedContainer>
        <ScrollArea>
          <FeedList>
            {recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 32, fontFamily: 'var(--font-stack-mono)', fontSize: 12 }}>
                -- NO RADIO TRAFFIC --
              </div>
            ) : (
              recommendations.map(rec => (
                <StrategyCard key={rec.id} onClick={() => onAction(rec.id, rec.type)}>
                  <ColorStripe $severity={rec.severity} />
                  <CardContent>
                    <CardHeader>
                      <CardTitle>
                        <InlineSvg className="icon" viewBox="0 0 24 24" $severity={rec.severity}>
                          <path d={getIconPath(rec.severity)} />
                        </InlineSvg>
                        {getF1Metaphor(rec.severity, rec.title)}
                      </CardTitle>
                      <CardMeta>#{rec.issueKey || 'TEAM'}</CardMeta>
                    </CardHeader>
                    <CardDesc>{rec.description}</CardDesc>
                  </CardContent>
                </StrategyCard>
              ))
            )}
          </FeedList>
        </ScrollArea>

        <FooterContainer>
          <BoxBoxButton onClick={onBoxBox}>
            <InlineSvg viewBox="0 0 24 24" $severity="white" style={{ fill: 'white', width: 18, height: 18 }}>
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
            </InlineSvg>
            BOX BOX (CRITICAL ALERTS)
          </BoxBoxButton>
        </FooterContainer>

      </FeedContainer>
    </PanelContainer>
  )
}
