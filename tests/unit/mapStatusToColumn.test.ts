import { describe, it, expect } from 'vitest'
import { mapStatusToColumn } from '../../src/resolvers/timingMetrics'

describe('mapStatusToColumn', () => {
  const columns = [
    { name: 'To Do', statuses: [{ name: 'Open' }, { name: 'Backlog' }] },
    { name: 'In Progress', statuses: [{ name: 'In Progress' }, { name: 'Doing' }] },
    { name: 'Done', statuses: [{ name: 'Done' }] }
  ]

  it('maps exact status name to column', () => {
    expect(mapStatusToColumn('In Progress', columns)).toBe('In Progress')
    expect(mapStatusToColumn('Done', columns)).toBe('Done')
  })

  it('handles case-insensitive match', () => {
    expect(mapStatusToColumn('open', columns)).toBe('To Do')
  })

  it('returns null for unmapped status', () => {
    expect(mapStatusToColumn('Review', columns)).toBeNull()
  })
})
