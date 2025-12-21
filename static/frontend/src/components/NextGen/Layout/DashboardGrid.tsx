import React, { ReactNode } from 'react'
import styled from 'styled-components'

interface GridProps {
  children: ReactNode
}

const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr; /* Mobile first: Stacked */
  gap: var(--space-3);
  padding: var(--space-3);
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  align-content: start;

  /* Tablet (Portrait/Small Landscape) */
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr; /* Two columns */
    /* Left and Center share space, Right moves to bottom or specific flow */
    /* But standardizing to 3 column grid immediately might be tight. 
       Let's use a 1fr 1fr grid where Left = 1, Center = 2, Right = 1 (spanning?) 
       Actually, sticking to CSS Grid logic:
    */
    grid-template-areas: 
      "left center"
      "right center" /* Right below left? Or right spans? */
  }

  /* Desktop */
  @media (min-width: 1200px) {
    /* Holy Grail Layout: Fixed Left/Right panels, Fluid Center */
    /* Use minmax to prevent blowout on smaller laptop screens */
    grid-template-columns: minmax(280px, 320px) 1fr minmax(280px, 320px);
    grid-template-rows: 100%;
    gap: var(--space-4);
    padding: var(--space-4);
    overflow: hidden; /* Desktop fits viewport */
  }
`

/*
  Layout Logic:
  - Mobile (<768px): Stacked (Left, Center, Right)
  - Tablet (768px - 1199px): Stacked or 2-column. 
    Let's keep it simple: 1fr 1fr doesn't work well for 3 zones.
    Better: Left (Metrics) | Center (Visuals). Right (Strategy) below?
    Or just keep stacked but with max-width constraints?
    Let's stick to GridWrapper just defining the container.
    The Zones handle themselves.
*/

export const DashboardGrid: React.FC<GridProps> = ({ children }) => {
  return <GridWrapper>{children}</GridWrapper>
}

// Sub-containers for specific zones
export const LeftZone = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0; /* Allow shrinking */

  @media (min-width: 1200px) {
    overflow-y: auto; /* Scrollable content stack */
    padding-right: 4px; 
    height: 100%;
    grid-column: 1;
    
    /* Hide scrollbar for cleaner look, still scrollable */
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }
  }
`

export const CenterZone = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0;

  @media (min-width: 1200px) {
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
    padding-right: 4px;
    grid-column: 2;
    
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }
  }
`

export const RightZone = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0;

  @media (min-width: 1200px) {
    /* StrategyFeed handles its own internal scroll, needing full height */
    overflow: hidden; 
    height: 100%;
    grid-column: 3;
  }
`
