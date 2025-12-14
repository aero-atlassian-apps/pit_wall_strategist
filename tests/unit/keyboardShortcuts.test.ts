import { describe, it, expect } from 'vitest'
import { KEYBOARD_SHORTCUTS } from '../../static/frontend/src/hooks/useKeyboardShortcuts'

describe('Keyboard Shortcuts', () => {
    describe('KEYBOARD_SHORTCUTS constant', () => {
        it('defines all key shortcuts', () => {
            expect(KEYBOARD_SHORTCUTS).toBeDefined()
            expect(Array.isArray(KEYBOARD_SHORTCUTS)).toBe(true)
        })

        it('includes slash for opening chat', () => {
            const slashShortcut = KEYBOARD_SHORTCUTS.find(s => s.key === '/')
            expect(slashShortcut).toBeDefined()
            expect(slashShortcut?.description).toContain('Pit Wall Engineer')
        })

        it('includes R for refresh', () => {
            const refreshShortcut = KEYBOARD_SHORTCUTS.find(s => s.key === 'R')
            expect(refreshShortcut).toBeDefined()
            expect(refreshShortcut?.description.toLowerCase()).toContain('refresh')
        })

        it('includes S for settings', () => {
            const settingsShortcut = KEYBOARD_SHORTCUTS.find(s => s.key === 'S')
            expect(settingsShortcut).toBeDefined()
            expect(settingsShortcut?.description.toLowerCase()).toContain('settings')
        })

        it('includes ? for help', () => {
            const helpShortcut = KEYBOARD_SHORTCUTS.find(s => s.key === '?')
            expect(helpShortcut).toBeDefined()
        })

        it('includes Esc for modal close', () => {
            const escShortcut = KEYBOARD_SHORTCUTS.find(s => s.key === 'Esc')
            expect(escShortcut).toBeDefined()
        })
    })
})
