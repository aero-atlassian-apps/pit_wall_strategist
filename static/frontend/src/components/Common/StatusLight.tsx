import React from 'react'
import styled, { keyframes } from 'styled-components'

const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.5}`
const LightWrapper = styled.div`display:inline-flex; align-items:center; gap:${({ theme }) => (theme as any).spacing.sm}`
const LightDot = styled.div<{ $size?: 'lg' | 'md' | 'sm'; $status?: 'critical' | 'warning' | 'success' | 'neutral' | 'red' | 'yellow' | 'green'; $pulse?: boolean }>`width:${({ $size }) => ($size === 'lg' ? '16px' : $size === 'sm' ? '8px' : '12px')}; height:${({ $size }) => ($size === 'lg' ? '16px' : $size === 'sm' ? '8px' : '12px')}; border-radius:50%; background-color:${({ $status, theme }) => ($status === 'critical' || $status === 'red' ? (theme as any).colors.redAlert : $status === 'warning' || $status === 'yellow' ? (theme as any).colors.yellowFlag : $status === 'success' || $status === 'green' ? (theme as any).colors.greenPace : (theme as any).colors.textMuted)}; box-shadow:${({ $status, theme }) => ($status === 'critical' || $status === 'red' ? `0 0 8px ${(theme as any).colors.redAlert}` : $status === 'warning' || $status === 'yellow' ? `0 0 8px ${(theme as any).colors.yellowFlag}` : $status === 'success' || $status === 'green' ? `0 0 8px ${(theme as any).colors.greenPace}` : 'none')}; animation:${({ $pulse }) => ($pulse ? pulse : 'none')} 1s ease-in-out infinite`
const LightLabel = styled.span<{ $size?: 'lg' | 'md' | 'sm'; $status?: string }>`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:${({ $size }) => ($size === 'lg' ? '12px' : '10px')}; font-weight:500; text-transform:uppercase; letter-spacing:1px; color:${({ $status, theme }) => ($status === 'critical' || $status === 'red' ? (theme as any).colors.redAlert : $status === 'warning' || $status === 'yellow' ? (theme as any).colors.yellowFlag : $status === 'success' || $status === 'green' ? (theme as any).colors.greenPace : (theme as any).colors.textMuted)}`

function StatusLight({ status = 'neutral', label, size = 'md', pulse = false }: { status?: any; label?: string; size?: 'lg' | 'md' | 'sm'; pulse?: boolean }) {
  return (
    <LightWrapper>
      <LightDot $status={status} $size={size} $pulse={pulse} />
      {label && <LightLabel $status={status} $size={size}>{label}</LightLabel>}
    </LightWrapper>
  )
}

export default StatusLight
