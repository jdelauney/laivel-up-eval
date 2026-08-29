import { describe, expect, it } from 'vitest'
import {
  ConfigValidationError,
  parseGrid,
} from '@/core/contracts/helpers/parse-config.helper'
import projectGrid from '../../../config/grid.json'

const minimalGrid = () => ({
  version: '1.0',
  title: 'Grille de test',
  dimensions: [
    {
      id: 'verification',
      label: 'Vérification',
      weight: 1,
      scale: [
        { from: 0, label: 'aucune' },
        { from: 0.5, label: 'partielle' },
      ],
    },
  ],
  levels: [
    {
      id: 'low-level',
      label: 'Niveau bas',
      order: 1,
      conditions: [{ dimension: 'verification', max: 0.4 }],
      nextLevelHint: 'Relire les diffs.',
    },
  ],
})

const expectRejection = (data: unknown): ConfigValidationError => {
  try {
    parseGrid(data)
  } catch (error) {
    if (error instanceof ConfigValidationError) return error
    throw error
  }
  throw new Error('the grid should have been rejected')
}

describe('grid loading', () => {
  it('accepts the project grid and exposes its dimensions and levels', () => {
    const grid = parseGrid(projectGrid)

    expect(grid.dimensions.map((dimension) => dimension.id)).toEqual([
      'taille',
      'harness',
      'intervention',
      'parallele',
      'initiative',
    ])
    expect(grid.levels.map((level) => level.id)).toEqual([
      'white',
      'red',
      'blue',
      'green',
      'copper',
      'silver',
      'gold',
    ])
    expect(grid.levels.map((level) => level.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ])
    expect(grid.levels.every((level) => level.nextLevelHint.length > 0)).toBe(
      true,
    )
  })

  it('carries the grid vocabulary on every axis, not only a score', () => {
    const grid = parseGrid(projectGrid)

    expect(
      grid.dimensions.every((dimension) => dimension.scale !== undefined),
    ).toBe(true)
    expect(
      grid.dimensions
        .find((dimension) => dimension.id === 'taille')
        ?.scale?.map((band) => band.label),
    ).toContain('L — multi-étapes')
  })

  it('rejects a scale that does not start at 0', () => {
    const data = minimalGrid()
    data.dimensions[0].scale = [
      { from: 0.5, label: 'moitié' },
      { from: 1, label: 'tout' },
    ]

    const error = expectRejection(data)

    expect(error.field).toBe('dimensions[0].scale')
    expect(error.message).toContain('0')
  })

  it('rejects a scale whose bands are not strictly ascending', () => {
    const data = minimalGrid()
    data.dimensions[0].scale = [
      { from: 0, label: 'rien' },
      { from: 0, label: 'rien non plus' },
    ]

    const error = expectRejection(data)

    expect(error.field).toBe('dimensions[0].scale')
  })

  it('rejects a level without conditions, naming the missing field', () => {
    const data = minimalGrid()
    Reflect.deleteProperty(data.levels[0], 'conditions')

    const error = expectRejection(data)

    expect(error.field).toBe('levels[0].conditions')
    expect(error.message).toContain('levels[0].conditions')
  })

  it('rejects a condition carrying neither a min nor a max bound', () => {
    const data = minimalGrid()
    data.levels[0].conditions = [{ dimension: 'verification' } as never]

    const error = expectRejection(data)

    expect(error.field).toBe('levels[0].conditions[0]')
    expect(error.message).toContain('min')
  })

  it('rejects an out-of-contract dimension weight, naming the faulty dimension', () => {
    const data = minimalGrid()
    data.dimensions[0].weight = -1

    const error = expectRejection(data)

    expect(error.field).toBe('dimensions[0].weight')
  })

  it('returns no partial object when the data is rejected', () => {
    expect(() => parseGrid({ version: '1.0' })).toThrow(ConfigValidationError)
  })
})
