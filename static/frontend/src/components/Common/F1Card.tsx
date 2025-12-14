import React from 'react'
import styled from 'styled-components'

const CardWrapper = styled.div<{ $noPadding?: boolean; $fullHeight?: boolean; $glowColor?: 'red' | 'green' | 'purple' }>`
  background-color: ${({ theme }) => (theme as any).colors.bgCard};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  padding: ${({ theme, $noPadding }) => ($noPadding ? '0' : (theme as any).spacing.md)};
  height: ${({ $fullHeight }) => ($fullHeight ? '100%' : 'auto')};
  display: flex;
  flex-direction: column;
  transition: border-color ${({ theme }) => (theme as any).transitions.fast};
  ${({ $glowColor, theme }) => $glowColor && `box-shadow: ${(theme as any).shadows.glow[$glowColor]}; border-color: ${(theme as any).colors[$glowColor === 'red' ? 'redAlert' : $glowColor === 'green' ? 'greenPace' : 'purpleSector']};`}
`

const CardHeader = styled.div`display:flex; align-items:center; justify-content:space-between; padding-bottom:${({ theme }) => (theme as any).spacing.sm}; margin-bottom:${({ theme }) => (theme as any).spacing.sm}; border-bottom:1px solid ${({ theme }) => (theme as any).colors.border}`
const CardTitle = styled.h3`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:1.5px; color:${({ theme }) => (theme as any).colors.textMuted}; margin:0`
const CardBadge = styled.span<{ $variant?: 'critical' | 'warning' | 'success' | 'muted' }>`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:10px; font-weight:600; padding:2px 8px; border-radius:${({ theme }) => (theme as any).borderRadius.sm}; background-color:${({ $variant, theme }) => ($variant === 'critical' ? (theme as any).colors.redAlert : $variant === 'warning' ? (theme as any).colors.yellowFlag : $variant === 'success' ? (theme as any).colors.greenPace : (theme as any).colors.bgCardHover)}; color:${({ $variant }) => ($variant === 'warning' ? '#000' : '#fff')}`
const CardContent = styled.div<{ $scrollable?: boolean }>`flex:1; overflow:${({ $scrollable }) => ($scrollable ? 'auto' : 'visible')}`

function F1Card({ title, badge, badgeVariant, children, fullHeight = false, noPadding = false, glowColor, scrollable = false, action, className }: { title?: string; badge?: string; badgeVariant?: 'critical' | 'warning' | 'success' | 'muted'; children?: React.ReactNode; fullHeight?: boolean; noPadding?: boolean; glowColor?: 'red' | 'green' | 'purple'; scrollable?: boolean; action?: React.ReactNode; className?: string }) {
  const wrapperClasses = [
    'card',
    title ? 'card--titlebar' : '',
    noPadding ? 'card--compact' : '',
    badgeVariant === 'critical' ? 'card--critical' : '',
    badgeVariant === 'warning' ? 'card--warning' : '',
    badgeVariant === 'success' ? 'card--success' : '',
    className || ''
  ].filter(Boolean).join(' ')
  const badgeClass = `card-badge${badgeVariant ? ` card-badge--${badgeVariant}` : ''}`
  return (
    <CardWrapper $fullHeight={fullHeight} $noPadding={noPadding} $glowColor={glowColor} className={wrapperClasses}>
      {title && (
        <CardHeader className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CardTitle className="card-title">{title}</CardTitle>
            {badge && <CardBadge className={badgeClass} $variant={badgeVariant}>{badge}</CardBadge>}
          </div>
          {action && <div className="card-context">{action}</div>}
        </CardHeader>
      )}
      <CardContent className="card-content" $scrollable={scrollable}>{children}</CardContent>
    </CardWrapper>
  )
}

export default F1Card
