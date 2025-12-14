import React, { Component, ErrorInfo, ReactNode } from 'react'
import styled from 'styled-components'

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border: 1px solid ${({ theme }) => (theme as any).colors.redAlert}44;
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  text-align: center;
`

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`

const ErrorTitle = styled.h2`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => (theme as any).colors.redAlert};
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 8px 0;
`

const ErrorMessage = styled.p`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
  margin: 0 0 20px 0;
  max-width: 400px;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
`

const Button = styled.button<{ $primary?: boolean }>`
  padding: 10px 20px;
  border: 1px solid ${({ $primary, theme }) =>
        $primary ? (theme as any).colors.purpleSector : (theme as any).colors.border};
  background: ${({ $primary, theme }) =>
        $primary ? (theme as any).colors.purpleSector : 'transparent'};
  color: ${({ $primary, theme }) =>
        $primary ? 'white' : (theme as any).colors.textSecondary};
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`

const TechnicalDetails = styled.details`
  margin-top: 16px;
  width: 100%;
  max-width: 500px;
  text-align: left;
`

const DetailsSummary = styled.summary`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
  cursor: pointer;
  padding: 8px;
  
  &:hover { color: ${({ theme }) => (theme as any).colors.textSecondary}; }
`

const StackTrace = styled.pre`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 9px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
  background: ${({ theme }) => (theme as any).colors.bgMain};
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 8px 0 0 0;
`

interface Props {
    children: ReactNode
    fallback?: ReactNode
    onReset?: () => void
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[PitWall] Error Boundary caught:', error, errorInfo)
        this.setState({ errorInfo })
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
        this.props.onReset?.()
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            const errorName = this.state.error?.name || 'Unknown Error'
            const errorMessage = this.state.error?.message || 'Something went wrong'

            const f1Messages: Record<string, string> = {
                'TypeError': '🔧 Mechanical failure in the gearbox',
                'ReferenceError': '📡 Lost radio connection to team',
                'NetworkError': '🌧️ Visibility reduced - connectivity issues',
                'SyntaxError': '⚙️ ECU malfunction detected',
                'default': '🚩 Red Flag: Session Stopped'
            }

            const f1Title = f1Messages[errorName] || f1Messages['default']

            return (
                <ErrorContainer>
                    <ErrorIcon>🚩</ErrorIcon>
                    <ErrorTitle>{f1Title}</ErrorTitle>
                    <ErrorMessage>
                        {errorMessage}
                    </ErrorMessage>

                    <ButtonRow>
                        <Button onClick={this.handleRetry}>
                            ⟳ Attempt Recovery
                        </Button>
                        <Button $primary onClick={this.handleReload}>
                            🔄 Full Restart
                        </Button>
                    </ButtonRow>

                    <TechnicalDetails>
                        <DetailsSummary>📋 Technical Telemetry</DetailsSummary>
                        <StackTrace>
                            {`Error: ${errorName}\nMessage: ${errorMessage}\n\nStack:\n${this.state.error?.stack || 'No stack trace available'}`}
                        </StackTrace>
                    </TechnicalDetails>
                </ErrorContainer>
            )
        }

        return this.props.children
    }
}

// HOC for wrapping components
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        )
    }
}

export default ErrorBoundary
