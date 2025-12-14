/**
 * Sprint Health Gauge Component
 * 
 * Displays the Sprint Health Prediction with F1-themed visuals:
 * - GREEN FLAG: On track
 * - YELLOW FLAG: Pace dropping
 * - RED FLAG: Intervention needed
 */

import React from 'react'
import styled, { keyframes } from 'styled-components'

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`

const Container = styled.div`
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  padding: ${({ theme }) => (theme as any).spacing.md};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => (theme as any).spacing.md};
`

const Title = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
`

const FlagBadge = styled.span<{ $status: 'GREEN_FLAG' | 'YELLOW_FLAG' | 'RED_FLAG' }>`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  animation: ${pulse} 2s ease-in-out infinite;
  
  ${({ $status, theme }) => {
        if ($status === 'GREEN_FLAG') {
            return `
        background: ${(theme as any).colors.greenPace};
        color: ${(theme as any).colors.bgMain};
      `
        } else if ($status === 'YELLOW_FLAG') {
            return `
        background: ${(theme as any).colors.yellowFlag};
        color: ${(theme as any).colors.bgMain};
      `
        } else {
            return `
        background: ${(theme as any).colors.redAlert};
        color: white;
      `
        }
    }}
`

const GaugeContainer = styled.div`
  position: relative;
  height: 16px;
  background: ${({ theme }) => (theme as any).colors.bgMain};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: ${({ theme }) => (theme as any).spacing.sm};
`

const GaugeFill = styled.div<{ $percent: number; $status: string }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  border-radius: 8px;
  transition: width 1s ease-out;
  
  ${({ $status, theme }) => {
        if ($status === 'GREEN_FLAG') {
            return `background: linear-gradient(90deg, ${(theme as any).colors.greenPace}88, ${(theme as any).colors.greenPace});`
        } else if ($status === 'YELLOW_FLAG') {
            return `background: linear-gradient(90deg, ${(theme as any).colors.yellowFlag}88, ${(theme as any).colors.yellowFlag});`
        } else {
            return `background: linear-gradient(90deg, ${(theme as any).colors.redAlert}88, ${(theme as any).colors.redAlert});`
        }
    }}
`

const ScoreText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
`

const Message = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => (theme as any).colors.textPrimary};
  margin-bottom: ${({ theme }) => (theme as any).spacing.xs};
`

const Recommendation = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.ui};
  font-size: 11px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
  font-style: italic;
`

const FactorsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => (theme as any).spacing.sm};
  margin-top: ${({ theme }) => (theme as any).spacing.sm};
  flex-wrap: wrap;
`

const Factor = styled.div<{ $value: number }>`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${({ theme }) => (theme as any).colors.bgMain};
  color: ${({ $value, theme }) =>
        $value >= 0.8 ? (theme as any).colors.greenPace :
            $value >= 0.5 ? (theme as any).colors.yellowFlag :
                (theme as any).colors.redAlert
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
    if (loading || !sprintHealth) {
        return (
            <Container>
                <Header>
                    <Title>🏥 Sprint Health</Title>
                </Header>
                <Message style={{ color: '#64748B' }}>Calculating prediction...</Message>
            </Container>
        )
    }

    const { score, status, message, recommendation, factors } = sprintHealth
    const flagLabel = status.replace('_', ' ')

    return (
        <Container>
            <Header>
                <Title>🏥 Sprint Health Predictor</Title>
                <FlagBadge $status={status}>{flagLabel}</FlagBadge>
            </Header>

            <GaugeContainer>
                <GaugeFill $percent={score} $status={status} />
                <ScoreText>{score}%</ScoreText>
            </GaugeContainer>

            <Message>{message}</Message>
            <Recommendation>💡 {recommendation}</Recommendation>

            <FactorsRow>
                <Factor $value={factors.velocityFactor} title="Velocity vs History">
                    ⚡ Pace: {Math.round(factors.velocityFactor * 100)}%
                </Factor>
                <Factor $value={factors.timeFactor} title="Time Progress">
                    ⏱️ Time: {Math.round(factors.timeFactor * 100)}%
                </Factor>
                <Factor $value={factors.stalledFactor} title="Stall-Free">
                    🚦 Flow: {Math.round(factors.stalledFactor * 100)}%
                </Factor>
                <Factor $value={factors.scopeFactor} title="WIP Balance">
                    📦 Scope: {Math.round(factors.scopeFactor * 100)}%
                </Factor>
            </FactorsRow>
        </Container>
    )
}

export default SprintHealthGauge
