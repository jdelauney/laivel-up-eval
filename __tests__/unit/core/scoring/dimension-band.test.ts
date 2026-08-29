import { describe, expect, it } from 'vitest'
import type { Dimension } from '../../../../src/core/contracts/grid.schema'
import { bandFor } from '../../../../src/core/scoring/helpers/dimension-band.helper'

const taille: Dimension = {
  id: 'taille',
  label: 'Taille',
  weight: 1,
  scale: [
    { from: 0, label: 'aucune' },
    { from: 0.25, label: 'S' },
    { from: 0.5, label: 'M' },
    { from: 0.75, label: 'L' },
    { from: 1, label: 'XL' },
  ],
}

describe('dimension band', () => {
  it('names the band a score falls into', () => {
    expect(bandFor(taille, 0.6)).toBe('M')
  })

  it('takes the band a score sits exactly on, not the one below', () => {
    expect(bandFor(taille, 0.75)).toBe('L')
  })

  it('names the top band on a full score, and the first one on zero', () => {
    expect(bandFor(taille, 1)).toBe('XL')
    expect(bandFor(taille, 0)).toBe('aucune')
  })

  it('gives no band to a dimension the grid left without a scale', () => {
    expect(bandFor({ id: 'x', label: 'X', weight: 1 }, 0.9)).toBeUndefined()
  })
})
