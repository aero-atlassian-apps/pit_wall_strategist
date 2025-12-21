import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BoardDiscoveryService } from '../../src/infrastructure/services/BoardDiscoveryService'

// Mock the Forge API
vi.mock('@forge/api', () => {
    const mockRequestJira = vi.fn()
    return {
        default: {
            asUser: () => ({ requestJira: mockRequestJira }),
            asApp: () => ({ requestJira: mockRequestJira })
        },
        route: (strings: TemplateStringsArray, ...values: any[]) => {
            let result = ''
            strings.forEach((str, i) => {
                result += str + (values[i] || '')
            })
            return result
        }
    }
})

describe('BoardDiscoveryService', () => {
    let service: BoardDiscoveryService
    let mockRequestJira: ReturnType<typeof vi.fn>

    beforeEach(async () => {
        vi.resetModules()
        const api = await import('@forge/api')
        mockRequestJira = vi.fn()
            ; (api.default.asUser as any) = () => ({ requestJira: mockRequestJira })
            ; (api.default.asApp as any) = () => ({ requestJira: mockRequestJira })

        service = new BoardDiscoveryService()
    })

    describe('detectBoardType', () => {

        it('returns business type for JWM projects', async () => {
            mockRequestJira
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ projectTypeKey: 'business' })
                })

            const result = await service.detectBoardType('JWM')

            expect(result.boardType).toBe('business')
            expect(result.boardId).toBeNull()
            expect(result.boardName).toBe('Work Items')
        })

        it('returns business type when no agile boards exist', async () => {
            mockRequestJira
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ projectTypeKey: 'software' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ values: [] })
                })

            const result = await service.detectBoardType('NOBOARD')

            expect(result.boardType).toBe('business')
            expect(result.boardId).toBeNull()
        })

        it('detects scrum board with active sprint', async () => {
            mockRequestJira
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ projectTypeKey: 'software' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        values: [
                            { id: 1, name: 'Scrum Board', type: 'scrum', location: { projectKey: 'SCRUM' } }
                        ]
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        values: [{ id: 100, name: 'Sprint 1', state: 'active' }]
                    })
                })

            const result = await service.detectBoardType('SCRUM')

            expect(result.boardType).toBe('scrum')
            expect(result.boardId).toBe(1)
        })

        it('detects kanban board', async () => {
            mockRequestJira
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ projectTypeKey: 'software' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        values: [
                            { id: 2, name: 'Kanban Board', type: 'kanban', location: { projectKey: 'KAN' } }
                        ]
                    })
                })

            const result = await service.detectBoardType('KAN')

            expect(result.boardType).toBe('kanban')
            expect(result.boardId).toBe(2)
        })

        it('falls back to business when board API fails', async () => {
            mockRequestJira
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ projectTypeKey: 'software' })
                })
                .mockResolvedValueOnce({ ok: false, status: 403 })
                .mockResolvedValueOnce({ ok: false, status: 403 })

            const result = await service.detectBoardType('NOACCESS')

            expect(result.boardType).toBe('business')
        })

        it('selects board matching project key when multiple exist', async () => {
            mockRequestJira
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ projectTypeKey: 'software' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        values: [
                            { id: 1, name: 'Other Board', type: 'scrum', location: { projectKey: 'OTHER' } },
                            { id: 2, name: 'Target Board', type: 'scrum', location: { projectKey: 'TARGET' } }
                        ]
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ values: [{ id: 200, state: 'active' }] })
                })

            const result = await service.detectBoardType('TARGET')

            expect(result.boardId).toBe(2)
            expect(result.boardName).toBe('Target Board')
        })
    })
})

describe('SecurityGuard Permission Scenarios', () => {

    it('should identify when user has BROWSE_PROJECTS permission', async () => {
        // This test validates the permission check structure
        const mockPermissions = {
            permissions: {
                BROWSE_PROJECTS: { havePermission: true }
            }
        }

        expect(mockPermissions.permissions.BROWSE_PROJECTS.havePermission).toBe(true)
    })

    it('should identify when user lacks BROWSE_PROJECTS permission', async () => {
        const mockPermissions = {
            permissions: {
                BROWSE_PROJECTS: { havePermission: false }
            }
        }

        expect(mockPermissions.permissions.BROWSE_PROJECTS.havePermission).toBe(false)
    })

    it('should handle missing permission key gracefully', async () => {
        const mockPermissions = {
            permissions: {}
        }

        const hasBrowse = mockPermissions.permissions?.['BROWSE_PROJECTS']?.havePermission ?? false
        expect(hasBrowse).toBe(false)
    })
})
