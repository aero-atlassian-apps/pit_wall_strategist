import React from 'react'
import styled from 'styled-components'

const CardWrapper = styled.div<{ $noPadding?: boolean; $fullHeight?: boolean; $glowColor?: 'red' | 'green' | 'purple' }>`
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: ${({ $noPadding }) => ($noPadding ? '0' : 'var(--space-4)')};
  height: ${({ $fullHeight }) => ($fullHeight ? '100%' : 'auto')};
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease;

  /* Polish: Ensure consistency with Panel.tsx */
  box-shadow: var(--shadow-sm);

  [data-theme='dark'] & {
    background: var(--bg-surface);
    border-color: var(--border-app);
    box-shadow: var(--shadow-md);
  }

  &:hover {
    border-color: var(--border-focus);
  }

  ${({ $glowColor }) => $glowColor && `box-shadow: var(--shadow-glow); border-color: ${$glowColor === 'red' ? 'var(--color-danger)' : $glowColor === 'green' ? 'var(--color-success)' : 'var(--chart-2)'};`}
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  min-height: 32px;
`

const CardTitle = styled.h3`
  font-family: var(--font-stack-mono);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-secondary);
  margin: 0;
`

const CardBadge = styled.span<{ $variant?: 'critical' | 'warning' | 'success' | 'muted' }>`
  font-family: var(--font-stack-mono);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background-color: ${({ $variant }) => ($variant === 'critical' ? 'var(--color-danger)' : $variant === 'warning' ? 'var(--color-warning)' : $variant === 'success' ? 'var(--color-success)' : 'var(--bg-surface-hover)')};
  color: ${({ $variant }) => ($variant === 'warning' ? 'var(--color-black)' : $variant === 'muted' ? 'var(--text-secondary)' : 'var(--color-white)')};
`

const CardContent = styled.div<{ $scrollable?: boolean }>`
  flex: 1;
  overflow: ${({ $scrollable }) => ($scrollable ? 'auto' : 'visible')};
`

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
