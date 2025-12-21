import React from 'react'
import styled from 'styled-components'

const LayoutRoot = styled.main`
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 300px;
  grid-template-rows: 100%;
  gap: 16px;
  height: calc(100vh - 64px); /* Header height approx 48-64px */
  padding: 16px;
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    height: auto;
    overflow-y: auto;
  }
`

const PanelSection = styled.section<{ $area: string }>`
  grid-area: ${({ $area }) => $area};
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0; /* Important for scrolling internal content */
  height: 100%;
`

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [left, center, right] = React.Children.toArray(children)
  return (
    <LayoutRoot>
      <PanelSection $area="1 / 1 / 2 / 2">{left}</PanelSection>
      <PanelSection $area="1 / 2 / 2 / 3">{center}</PanelSection>
      <PanelSection $area="1 / 3 / 2 / 4">{right}</PanelSection>
    </LayoutRoot>
  )
}

export default DashboardLayout
