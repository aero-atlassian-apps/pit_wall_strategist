import React from 'react'
import styled, { css } from 'styled-components'

export const ButtonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${({ theme }) => (theme as any).transitions.fast};
  border: 1px solid transparent;
  outline: none;
  font-family: ${({ theme }) => (theme as any).fonts.ui};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger'; $size?: 'sm' | 'md' }>`
  ${ButtonBase}
  padding: ${({ $size }) => ($size === 'sm' ? '6px 12px' : '8px 16px')};
  font-size: ${({ $size }) => ($size === 'sm' ? '12px' : '14px')};
  font-weight: 500;
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  
  ${({ $variant = 'secondary', theme }) => {
    const t = theme as any
    switch ($variant) {
      case 'primary':
        return css`
          background: ${t.colors.greenPace};
          color: #000;
          border-color: ${t.colors.greenPace};
          &:hover:not(:disabled) {
            background: #2ecc71;
            box-shadow: 0 0 10px rgba(57, 255, 20, 0.4);
          }
        `
      case 'danger':
        return css`
          background: rgba(255, 0, 51, 0.1);
          color: ${t.colors.redAlert};
          border-color: ${t.colors.redAlert};
          &:hover:not(:disabled) {
            background: ${t.colors.redAlert};
            color: #fff;
            box-shadow: 0 0 10px rgba(255, 0, 51, 0.4);
          }
        `
      case 'secondary':
      default:
        return css`
          background: ${t.colors.bgCard};
          color: ${t.colors.textPrimary};
          border-color: ${t.colors.border};
          &:hover:not(:disabled) {
            background: ${t.colors.bgCardHover};
            border-color: ${t.colors.textMuted};
          }
        `
    }
  }}
`

const IconButtonStyled = styled.button<{ $size?: 'sm' | 'md' }>`
  ${ButtonBase}
  width: ${({ $size }) => ($size === 'sm' ? '24px' : '32px')};
  height: ${({ $size }) => ($size === 'sm' ? '24px' : '32px')};
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => (theme as any).colors.textMuted};
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => (theme as any).colors.bgCardHover};
    color: ${({ theme }) => (theme as any).colors.textPrimary};
  }
`

export const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
)

export const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

export function IconButton({ onClick, title, children, size = 'sm', className }: { onClick?: () => void; title?: string; children?: React.ReactNode; size?: 'sm' | 'md'; className?: string }) {
  return (
    <IconButtonStyled onClick={onClick} title={title} $size={size} className={className} type="button">
      {children}
    </IconButtonStyled>
  )
}
