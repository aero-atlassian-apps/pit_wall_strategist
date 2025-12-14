import React from 'react'
import styled from 'styled-components'

function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Box>
      <Icon>📭</Icon>
      <Title>{title}</Title>
      {description && <Desc>{description}</Desc>}
    </Box>
  )
}

const Box = styled.div`display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:24px; border:1px dashed ${({ theme }) => (theme as any).colors.border}; border-radius:${({ theme }) => (theme as any).borderRadius.md}; background:${({ theme }) => (theme as any).colors.bgCard}`
const Icon = styled.div`font-size:32px; margin-bottom:12px`
const Title = styled.div`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:14px; font-weight:700; color:${({ theme }) => (theme as any).colors.textPrimary}; text-transform:uppercase; letter-spacing:1px`
const Desc = styled.div`font-family:${({ theme }) => (theme as any).fonts.ui}; font-size:12px; color:${({ theme }) => (theme as any).colors.textMuted}; margin-top:8px; text-align:center`

export default EmptyState
