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
          background: var(--color-success);
          color: var(--color-black);
          border-color: var(--color-success);
          &:hover:not(:disabled) {
            background: var(--color-success-hover);
            box-shadow: var(--shadow-glow);
          }
          &:focus-visible {
            box-shadow: 0 0 0 2px var(--bg-app), 0 0 0 4px var(--color-success);
          }
        `
      case 'danger':
        return css`
          background: var(--bg-danger-subtle);
          color: var(--color-danger);
          border-color: var(--color-danger);
          &:hover:not(:disabled) {
            background: var(--color-danger);
            color: var(--color-white);
            box-shadow: var(--shadow-glow);
          }
          &:focus-visible {
            box-shadow: 0 0 0 2px var(--bg-app), 0 0 0 4px var(--color-danger);
          }
        `
      case 'secondary':
      default:
        return css`
          background: var(--bg-card);
          color: var(--text-primary);
          border-color: var(--border);
          &:hover:not(:disabled) {
            background: var(--bg-card-hover);
            border-color: var(--text-muted);
          }
          &:focus-visible {
            box-shadow: 0 0 0 2px var(--bg-app), 0 0 0 4px var(--border-focus);
          }
        `
    }
  }}
`

const IconButtonStyled = styled.button<{ $size?: 'sm' | 'md' }>`
  ${ButtonBase}
  width: ${({ $size }) => ($size === 'sm' ? '28px' : '36px')}; /* Polished: Larger touch target */
  height: ${({ $size }) => ($size === 'sm' ? '28px' : '36px')};
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  background: transparent;
  color: var(--text-muted);
  
  &:hover:not(:disabled) {
    background: var(--bg-surface-hover);
    color: var(--text-primary);
  }

  &:focus-visible {
    background: var(--bg-surface-hover);
    color: var(--text-primary);
    box-shadow: 0 0 0 2px var(--border-focus);
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

export function IconButton({ onClick, title, ariaLabel, children, size = 'sm', className }: { onClick?: () => void; title?: string; ariaLabel?: string; children?: React.ReactNode; size?: 'sm' | 'md'; className?: string }) {
  return (
    <IconButtonStyled
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      $size={size}
      className={className}
      type="button"
    >
      {children}
    </IconButtonStyled>
  )
}
