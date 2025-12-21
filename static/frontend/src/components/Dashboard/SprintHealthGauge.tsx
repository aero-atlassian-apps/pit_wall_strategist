/**
 * Sprint Health Gauge Component
 * 
 * Displays the Sprint Health Prediction with F1-themed visuals:
 * - GREEN FLAG: On track
 * - YELLOW FLAG: Pace dropping
 * - RED FLAG: Intervention needed
 */

import React from 'react'
import { t } from '../../i18n'
import styled, { keyframes } from 'styled-components'
import { Panel } from '../Common/Panel'

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`

const FlagBadge = styled.span<{ $status: 'GREEN_FLAG' | 'YELLOW_FLAG' | 'RED_FLAG' }>`
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  animation: ${pulse} 2s ease-in-out infinite;
  
  ${({ $status }) => {
        if ($status === 'GREEN_FLAG') {
            return `
        background: var(--color-success);
        color: var(--bg-main);
      `
        } else if ($status === 'YELLOW_FLAG') {
            return `
        background: var(--color-warning);
        color: var(--bg-main);
      `
        } else {
            return `
        background: var(--color-danger);
        color: #FFFFFF;
      `
        }
    }}
`

const GaugeContainer = styled.div`
  position: relative;
  height: 16px;
  background: var(--bg-main);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
`

const GaugeFill = styled.div<{ $percent: number; $status: string }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  border-radius: 8px;
  transition: width 1s ease-out;
  
  ${({ $status }) => {
        if ($status === 'GREEN_FLAG') {
            return `background: linear-gradient(90deg, var(--color-success-dim), var(--color-success));`
        } else if ($status === 'YELLOW_FLAG') {
            return `background: linear-gradient(90deg, var(--color-warning-dim), var(--color-warning));`
        } else {
            return `background: linear-gradient(90deg, var(--color-danger-dim), var(--color-danger));`
        }
    }}
`

const ScoreText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
`

const Message = styled.div`
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  margin-bottom: 8px;
`

const Recommendation = styled.div`
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--text-secondary);
  font-style: italic;
`

const FactorsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
`

const Factor = styled.div<{ $value: number }>`
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-main);
  color: ${({ $value }) =>
        $value >= 0.8 ? 'var(--color-success)' :
            $value >= 0.5 ? 'var(--color-warning)' :
                'var(--color-danger)'
    };
`

interface SprintHealthGaugeProps {
    sprintHealth: {
        score: number
        status: 'GREEN_FLAG' | 'YELLOW_FLAG' | 'RED_FLAG'
        message: string
        recommendation: string
        factors: {
            velocityFactor: number
            timeFactor: number
            stalledFactor: number
            scopeFactor: number
        }
    } | null
    loading?: boolean
}

export function SprintHealthGauge({ sprintHealth, loading }: SprintHealthGaugeProps) {
    const locale = (window as any).__PWS_LOCALE || 'en'

    // Header for Panel
    const GaugeStatus = () => {
        if (!sprintHealth) return null;
        const flagLabel = sprintHealth.status.replace('_', ' ')
        return <FlagBadge $status={sprintHealth.status}>{flagLabel}</FlagBadge>
    }

    if (!sprintHealth && !loading) {
        return (
            <Panel title={`🏥 ${t('sprintHealth', locale)}`}>
                <Message style={{ color: 'var(--text-tertiary)', padding: 16 }}>
                    {t('metricsDisabled', locale) || 'Metrics Unavailable'}
                </Message>
            </Panel>
        )
    }

    if (loading || !sprintHealth) {
        return (
            <Panel title={`🏥 ${t('sprintHealth', locale)}`} loading={true}>
                <div style={{ height: 100 }} />
            </Panel>
        )
    }

    const { score, status, message, recommendation, factors } = sprintHealth

    return (
        <Panel title={`🏥 ${t('sprintHealthPredictor', locale)}`} rightAction={<GaugeStatus />}>
            <GaugeContainer>
                <GaugeFill $percent={score} $status={status} />
                <ScoreText>{score}%</ScoreText>
            </GaugeContainer>

            <Message>{message}</Message>
            <Recommendation>💡 {recommendation}</Recommendation>

            <FactorsRow>
                <Factor $value={factors.velocityFactor} title={t('velocityVsHistory', locale)}>
                    ⚡ {t('pace', locale)}: {Math.round(factors.velocityFactor * 100)}%
                </Factor>
                <Factor $value={factors.timeFactor} title={t('timeProgress', locale)}>
                    ⏱️ {t('time', locale)}: {Math.round(factors.timeFactor * 100)}%
                </Factor>
                <Factor $value={factors.stalledFactor} title={t('stallFree', locale)}>
                    🚦 {t('flow', locale)}: {Math.round(factors.stalledFactor * 100)}%
                </Factor>
                <Factor $value={factors.scopeFactor} title={t('wipBalance', locale)}>
                    📦 {t('scope', locale)}: {Math.round(factors.scopeFactor * 100)}%
                </Factor>
            </FactorsRow>
        </Panel>
    )
}

export default SprintHealthGauge
