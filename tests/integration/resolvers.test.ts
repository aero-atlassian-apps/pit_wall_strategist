import { describe, it, expect } from 'vitest'
import { handler } from '../../src/resolvers/index'

describe('resolver definitions', () => {
  it('exposes handler definitions', () => {
    expect(handler).toBeTruthy()
  })
})
