import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
    key: string
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    action: () => void
    description: string
}

interface UseKeyboardShortcutsOptions {
    onOpenChat?: () => void
    onRefresh?: () => void
    onOpenSettings?: () => void
    onToggleHelp?: () => void
    enabled?: boolean
}

export function useKeyboardShortcuts({
    onOpenChat,
    onRefresh,
    onOpenSettings,
    onToggleHelp,
    enabled = true
}: UseKeyboardShortcutsOptions) {

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if typing in input/textarea
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return
        }

        // Define shortcuts
        const shortcuts: KeyboardShortcut[] = [
            { key: '/', action: () => onOpenChat?.(), description: 'Open Pit Wall Engineer chat' },
            { key: 'r', action: () => onRefresh?.(), description: 'Refresh telemetry data' },
            { key: 's', action: () => onOpenSettings?.(), description: 'Open settings panel' },
            { key: '?', shift: true, action: () => onToggleHelp?.(), description: 'Show keyboard shortcuts' },
            { key: 'Escape', action: () => { }, description: 'Close modals' } // Handled by individual modals
        ]

        for (const shortcut of shortcuts) {
            const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
            const ctrlMatch = !shortcut.ctrl || (e.ctrlKey || e.metaKey)
            const shiftMatch = !shortcut.shift || e.shiftKey
            const altMatch = !shortcut.alt || e.altKey

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                e.preventDefault()
                shortcut.action()
                return
            }
        }
    }, [onOpenChat, onRefresh, onOpenSettings, onToggleHelp])

    useEffect(() => {
        if (!enabled) return

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown, enabled])
}

// Shortcut help data for display
export const KEYBOARD_SHORTCUTS = [
    { key: '/', description: 'Open Pit Wall Engineer' },
    { key: 'R', description: 'Refresh data' },
    { key: 'S', description: 'Open settings' },
    { key: '?', description: 'Show shortcuts' },
    { key: 'Esc', description: 'Close modal' }
]
