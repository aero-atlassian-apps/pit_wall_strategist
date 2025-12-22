import { describe, it, expect, vi } from 'vitest'
import { fieldDiscoveryService } from '../../src/infrastructure/services/FieldDiscoveryService'

const route = (strings: any, ...values: any[]) => { let s = ''; for (let i = 0; i < strings.length; i++) s += strings[i] + (values[i] ?? ''); return s }
const mkErr = (status = 500) => ({ ok: false, status, json: async () => ({}) })

describe('field discovery', () => {
  it('returns empty/null when discovery fails', async () => {
    const requester = async (url: string, options?: any) => mkErr()
    vi.doMock('@forge/api', () => ({ default: { asApp: () => ({ requestJira: requester }) }, route }))
    const fields = await fieldDiscoveryService.discoverCustomFields()
    // Field discovery returns empty arrays for storyPoints, null for sprint on error
    expect(fields.storyPoints).toEqual([])
    expect(fields.sprint).toBeNull()
  })
})

