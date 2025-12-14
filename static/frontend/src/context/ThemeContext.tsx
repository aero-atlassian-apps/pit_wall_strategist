import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { invoke } from '@forge/bridge'

type ThemeMode = 'dark' | 'light' | 'auto'

interface ThemeContextValue {
    mode: ThemeMode
    isDark: boolean
    setMode: (mode: ThemeMode) => void
    toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// CSS variables for each theme
const THEME_VARS = {
    dark: {
        '--bg-main': '#0b1221',
        '--bg-card': '#16213e',
        '--bg-elevated': '#1a1a2e',
        '--text-primary': '#ffffff',
        '--text-secondary': '#cbd5e1',
        '--text-muted': '#64748b',
        '--border-color': 'rgba(255, 255, 255, 0.1)',
        '--accent-red': '#FF0033',
        '--accent-green': '#39FF14'
    },
    light: {
        '--bg-main': '#f1f5f9',
        '--bg-card': '#ffffff',
        '--bg-elevated': '#f8fafc',
        '--text-primary': '#1e293b',
        '--text-secondary': '#475569',
        '--text-muted': '#94a3b8',
        '--border-color': 'rgba(0, 0, 0, 0.1)',
        '--accent-red': '#dc2626',
        '--accent-green': '#16a34a'
    }
}

function getSystemPreference(): boolean {
    if (typeof window === 'undefined') return true
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? true
}

function applyThemeVars(isDark: boolean) {
    const vars = isDark ? THEME_VARS.dark : THEME_VARS.light
    const root = document.documentElement
    Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(key, value)
    })
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

interface ThemeProviderProps {
    children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [mode, setModeState] = useState<ThemeMode>('dark')
    const [systemDark, setSystemDark] = useState(true)

    // Load saved preference
    useEffect(() => {
        async function load() {
            try {
                const result = await invoke('getThemeMode') as { success: boolean; mode?: ThemeMode }
                if (result?.success && result.mode) {
                    setModeState(result.mode)
                }
            } catch {
                // Default to dark
            }
        }
        load()

        // Listen for system preference changes
        const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
        setSystemDark(mediaQuery?.matches ?? true)

        const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
        mediaQuery?.addEventListener?.('change', handler)
        return () => mediaQuery?.removeEventListener?.('change', handler)
    }, [])

    // Compute effective dark mode
    const isDark = mode === 'auto' ? systemDark : mode === 'dark'

    // Apply theme when it changes
    useEffect(() => {
        applyThemeVars(isDark)
    }, [isDark])

    // Set mode with persistence
    const setMode = useCallback(async (newMode: ThemeMode) => {
        setModeState(newMode)
        try {
            await invoke('setThemeMode', { mode: newMode })
        } catch { }
    }, [])

    // Toggle between dark/light (skip auto)
    const toggle = useCallback(() => {
        setMode(isDark ? 'light' : 'dark')
    }, [isDark, setMode])

    return (
        <ThemeContext.Provider value={{ mode, isDark, setMode, toggle }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext)
    if (!context) {
        return { mode: 'dark', isDark: true, setMode: () => { }, toggle: () => { } }
    }
    return context
}
