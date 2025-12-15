import { describe, it, expect, vi } from 'vitest'
import { fieldDiscoveryService } from '../../src/resolvers/data/FieldDiscoveryService'

const route = (strings: any, ...values: any[]) => { let s = ''; for (let i = 0; i < strings.length; i++) s += strings[i] + (values[i] ?? ''); return s }
const mkErr = (status = 500) => ({ ok: false, status, json: async () => ({}) })

describe('field discovery', () => {
  it('returns nulls when discovery fails', async () => {
    const requester = async (url: string, options?: any) => mkErr()
    vi.doMock('@forge/api', () => ({ default: { asApp: () => ({ requestJira: requester }) }, route }))
    const fields = await fieldDiscoveryService.discoverCustomFields()
    expect(fields.storyPoints).toBeNull()
    expect(fields.sprint).toBeNull()
  })
})

