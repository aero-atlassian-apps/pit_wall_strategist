import React, { ReactNode } from 'react'
import styled from 'styled-components'

interface GridProps {
    children: ReactNode
}

const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr; /* Mobile first */
  gap: var(--space-3);
  padding: var(--space-3);
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  align-content: start;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(12, 1fr);
    gap: var(--space-4);
    padding: var(--space-4);
    overflow: hidden; /* Desktop fits viewport */
  }
`

/*
  Layout Logic:
  - Telemetry: 3 cols
  - Circuit: 5 cols
  - Strategy: 4 cols
*/

export const DashboardGrid: React.FC<GridProps> = ({ children }) => {
    return <GridWrapper>{children}</GridWrapper>
}

// Sub-containers for specific zones
export const LeftZone = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: min-content;

  @media (min-width: 1024px) {
    grid-column: span 3;
    overflow-y: auto;
    padding-right: 4px; /* Space for scrollbar */
  }
`

export const CenterZone = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  @media (min-width: 1024px) {
    grid-column: span 5;
    overflow: hidden;
  }
`

export const RightZone = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  @media (min-width: 1024px) {
    grid-column: span 4;
    overflow: hidden;
  }
`
