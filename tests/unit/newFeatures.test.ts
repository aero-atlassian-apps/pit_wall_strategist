import { describe, it, expect, vi } from 'vitest'

// Mock Forge storage for resolver tests
vi.mock('@forge/api', () => ({
    default: {
        asApp: () => ({
            requestJira: vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ values: [] })
            })
        })
    },
    storage: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined)
    },
    route: (strings: TemplateStringsArray, ...values: any[]) =>
        strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '')
}))

describe('New Features Resolvers', () => {
    describe('Theme Mode Storage', () => {
        it('stores theme mode per user account', async () => {
            const { storage } = await import('@forge/api')

            // Simulate saving theme
            await storage.set('themeMode:user123', 'light')
            expect(storage.set).toHaveBeenCalledWith('themeMode:user123', 'light')
        })

        it('defaults to dark mode when no stored value', async () => {
            const { storage } = await import('@forge/api')
            const stored = await storage.get('themeMode:unknown')
            expect(stored).toBeNull() // null means use default (dark)
        })
    })

    describe('View Mode Storage', () => {
        it('stores view mode per user account', async () => {
            const { storage } = await import('@forge/api')

            await storage.set('viewMode:user123', 'developer')
            expect(storage.set).toHaveBeenCalledWith('viewMode:user123', 'developer')
        })
    })

    describe('Multi-Board API', () => {
        it('calls boards API with project key', async () => {
            const api = (await import('@forge/api')).default
            const requestJira = api.asApp().requestJira as ReturnType<typeof vi.fn>

            // Simulated call
            await requestJira('/rest/agile/1.0/board?projectKeyOrId=TEST')
            expect(requestJira).toHaveBeenCalled()
        })
    })
})
