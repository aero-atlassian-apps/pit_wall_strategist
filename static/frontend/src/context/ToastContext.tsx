import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'

// Toast types with F1 theming
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ToastContextValue {
    showToast: (type: ToastType, message: string, duration?: number) => void
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
    info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

// Animations
const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`

const slideOut = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
`

// Styled components
const ToastContainer = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
`

const ToastItem = styled.div<{ $type: ToastType; $exiting: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${({ $type }) => {
        switch ($type) {
            case 'success': return 'linear-gradient(145deg, rgba(57, 255, 20, 0.15), rgba(0, 255, 136, 0.1))'
            case 'error': return 'linear-gradient(145deg, rgba(255, 0, 51, 0.15), rgba(255, 107, 107, 0.1))'
            case 'warning': return 'linear-gradient(145deg, rgba(255, 140, 0, 0.15), rgba(244, 208, 63, 0.1))'
            default: return 'linear-gradient(145deg, rgba(138, 43, 226, 0.15), rgba(75, 0, 130, 0.1))'
        }
    }};
  border: 1px solid ${({ $type }) => {
        switch ($type) {
            case 'success': return 'rgba(57, 255, 20, 0.4)'
            case 'error': return 'rgba(255, 0, 51, 0.4)'
            case 'warning': return 'rgba(255, 140, 0, 0.4)'
            default: return 'rgba(138, 43, 226, 0.4)'
        }
    }};
  border-radius: 8px;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  animation: ${({ $exiting }) => $exiting ? slideOut : slideIn} 0.3s ease-out forwards;
`

const ToastIcon = styled.span`
  font-size: 18px;
`

const ToastMessage = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #fff;
  flex: 1;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
  
  &:hover {
    color: #fff;
  }
`

const ICONS: Record<ToastType, string> = {
    success: '🏁',
    error: '🚨',
    warning: '⚠️',
    info: '📻'
}

interface ToastProviderProps {
    children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<(Toast & { exiting?: boolean })[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 300)
    }, [])

    const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
        setToasts(prev => [...prev, { id, type, message, duration }])

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration)
        }
    }, [removeToast])

    const value: ToastContextValue = {
        showToast,
        success: (msg) => showToast('success', msg),
        error: (msg) => showToast('error', msg),
        warning: (msg) => showToast('warning', msg),
        info: (msg) => showToast('info', msg)
    }

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer>
                {toasts.map(toast => (
                    <ToastItem key={toast.id} $type={toast.type} $exiting={!!toast.exiting}>
                        <ToastIcon>{ICONS[toast.type]}</ToastIcon>
                        <ToastMessage>{toast.message}</ToastMessage>
                        <CloseButton onClick={() => removeToast(toast.id)}>×</CloseButton>
                    </ToastItem>
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    )
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext)
    if (!context) {
        // Return no-op functions if not in provider (graceful degradation)
        return {
            showToast: () => { },
            success: () => { },
            error: () => { },
            warning: () => { },
            info: () => { }
        }
    }
    return context
}
