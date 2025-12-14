import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { invoke } from '@forge/bridge'
import { ViewMode, PanelId, DEFAULT_VIEW_MODE, isPanelVisible, VIEW_MODES } from '../config/viewModeConfig'

interface ViewModeContextValue {
    viewMode: ViewMode
    setViewMode: (mode: ViewMode) => void
    isPanelVisible: (panelId: PanelId) => boolean
    isLoading: boolean
    currentConfig: typeof VIEW_MODES[ViewMode]
}

const ViewModeContext = createContext<ViewModeContextValue | undefined>(undefined)

interface ViewModeProviderProps {
    children: ReactNode
}

export function ViewModeProvider({ children }: ViewModeProviderProps) {
    const [viewMode, setViewModeState] = useState<ViewMode>(DEFAULT_VIEW_MODE)
    const [isLoading, setIsLoading] = useState(true)

    // Load persisted view mode on mount
    useEffect(() => {
        async function loadViewMode() {
            try {
                const result = await invoke<{ success: boolean; viewMode?: ViewMode }>('getViewMode')
                if (result.success && result.viewMode && VIEW_MODES[result.viewMode]) {
                    setViewModeState(result.viewMode)
                }
            } catch (e) {
                console.warn('[ViewMode] Failed to load persisted mode, using default')
            } finally {
                setIsLoading(false)
            }
        }
        loadViewMode()
    }, [])

    // Persist view mode when changed
    const setViewMode = useCallback(async (mode: ViewMode) => {
        setViewModeState(mode)
        try {
            await invoke('setViewMode', { viewMode: mode })
        } catch (e) {
            console.warn('[ViewMode] Failed to persist mode')
        }
    }, [])

    // Check if panel is visible in current mode
    const checkPanelVisible = useCallback((panelId: PanelId) => {
        return isPanelVisible(panelId, viewMode)
    }, [viewMode])

    const value: ViewModeContextValue = {
        viewMode,
        setViewMode,
        isPanelVisible: checkPanelVisible,
        isLoading,
        currentConfig: VIEW_MODES[viewMode]
    }

    return (
        <ViewModeContext.Provider value={value}>
            {children}
        </ViewModeContext.Provider>
    )
}

// Hook to use view mode context
export function useViewMode(): ViewModeContextValue {
    const context = useContext(ViewModeContext)
    if (!context) {
        throw new Error('useViewMode must be used within ViewModeProvider')
    }
    return context
}

// HOC to conditionally render based on panel visibility
interface ConditionalPanelProps {
    panelId: PanelId
    children: ReactNode
    fallback?: ReactNode
}

export function ConditionalPanel({ panelId, children, fallback = null }: ConditionalPanelProps) {
    const { isPanelVisible } = useViewMode()

    if (!isPanelVisible(panelId)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
