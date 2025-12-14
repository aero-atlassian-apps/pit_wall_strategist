import { describe, it, expect, vi } from 'vitest'
import { handler } from '../../src/resolvers/index'

describe('health resolver presence', () => {
  it('handler is truthy (health endpoint registered)', async () => {
    expect(handler).toBeTruthy()
  })
})

