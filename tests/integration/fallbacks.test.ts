import { describe, it, expect } from 'vitest'
import { getPopulationMode } from '../../src/types/telemetry'

describe('Population Mode Helper', () => {
  it('returns scrum for scrum board type', () => {
    expect(getPopulationMode('scrum')).toBe('scrum')
  })

  it('returns flow for kanban board type', () => {
    expect(getPopulationMode('kanban')).toBe('flow')
  })

  it('returns process for business board type', () => {
    expect(getPopulationMode('business')).toBe('process')
  })
})

describe('Board Type to Population Mode Mapping', () => {
  it('maps software scrum boards to scrum population', () => {
    // Software space + Scrum board = Sprint-oriented teams
    expect(getPopulationMode('scrum')).toBe('scrum')
  })

  it('maps software kanban boards to flow population', () => {
    // Software space + Kanban board = Lean/Flow teams
    expect(getPopulationMode('kanban')).toBe('flow')
  })

  it('maps business projects to process population', () => {
    // Business space (JWM) = Business teams (Marketing, HR, Finance)
    expect(getPopulationMode('business')).toBe('process')
  })
})
