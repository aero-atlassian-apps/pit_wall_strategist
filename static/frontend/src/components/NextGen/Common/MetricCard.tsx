import React from 'react'
import styled from 'styled-components'

interface MetricProps {
  label: string
  value: string | number
  unit?: string
  trend?: {
    value?: number | string
    direction: 'up' | 'down' | 'neutral'
    isGood?: boolean // if true, 'up' is green. if false, 'up' is red.
  }
  variant?: 'primary' | 'secondary'
  footer?: React.ReactNode
}

const Card = styled.div<{ $variant: 'primary' | 'secondary' }>`
  background: ${({ $variant }) => $variant === 'primary' ? 'var(--bg-surface-subtle)' : 'var(--bg-surface)'};
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  height: 100%;

  /* Decorator line for primary */
  ${({ $variant }) => $variant === 'primary' && `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--brand-primary);
    }
  `}
`

const ValueLayout = styled.div`
  display: flex;
  align-items: baseline;
  gap: 2px;
`

const Value = styled.div<{ $variant: 'primary' | 'secondary' }>`
  font-family: var(--font-stack-mono);
  font-weight: 700;
  color: var(--text-primary);
  font-size: ${({ $variant }) => $variant === 'primary' ? '32px' : '20px'};
  line-height: 1;
  letter-spacing: -1px;
`

const Unit = styled.div`
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
`

const Label = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-top: var(--space-1);
  text-align: center;
`

const Footer = styled.div`
  margin-top: 4px;
  font-size: 10px;
  font-family: var(--font-stack-mono);
`

export const MetricCard: React.FC<MetricProps> = ({ label, value, unit, variant = 'secondary', footer }) => {
  return (
    <Card $variant={variant}>
      <ValueLayout>
        <Value $variant={variant}>{value}</Value>
        {unit && <Unit>{unit}</Unit>}
      </ValueLayout>
      <Label>{label}</Label>
      {footer && <Footer>{footer}</Footer>}
    </Card>
  )
}
