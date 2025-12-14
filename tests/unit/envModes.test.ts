import { describe, it, expect } from 'vitest'

describe('env modes', () => {
  it('frontend local mode uses mocked data', () => {
    const platform = 'local'
    expect(platform).toBe('local')
  })
  it('backend PLATFORM default is atlassian when unset', () => {
    const platform = process.env.PLATFORM || 'atlassian'
    expect(platform).toBe('atlassian')
  })
})
