import { describe, expect, it } from 'vitest'
import projectGrid from '../../../../config/grid.json'
import type { Grid } from '../../../../src/core/contracts/grid.schema'
import { parseGrid } from '../../../../src/core/contracts/helpers/parse-config.helper'
import type { DimensionScore } from '../../../../src/core/ports/scoring-strategy.interface'
import { resolveLevel } from '../../../../src/core/scoring/helpers/level-resolver.helper'

const grid: Grid = parseGrid(projectGrid)

const score = (dimensionId: string, value: number): DimensionScore => ({
  dimensionId,
  label: dimensionId,
  score: value,
  band: undefined,
  measured: true,
  earned: value,
  possible: 1,
  contributions: [],
})

const unmeasured = (dimensionId: string): DimensionScore => ({
  ...score(dimensionId, 0),
  measured: false,
  earned: 0,
  possible: 0,
})

/** Les quatre axes de la grille, plus l'initiative qui sépare Silver de Gold. */
const axes = (
  taille: number,
  harness: number,
  intervention: number,
  parallele: number,
  initiative?: number,
): DimensionScore[] => [
  score('taille', taille),
  score('harness', harness),
  score('intervention', intervention),
  score('parallele', parallele),
  initiative === undefined
    ? unmeasured('initiative')
    : score('initiative', initiative),
]

describe('level resolution', () => {
  it('reaches the highest level whose conditions all hold', () => {
    const verdict = resolveLevel(grid, axes(1, 1, 1, 1, 1))

    expect(verdict.level.id).toBe('gold')
    expect(verdict.nextLevel).toBeUndefined()
  })

  it('stops below when a single axis fails, the others being at the top', () => {
    const verdict = resolveLevel(grid, axes(1, 1, 1, 0.66, 1))

    expect(verdict.level.id).toBe('green')
    expect(verdict.nextLevel?.id).toBe('copper')
  })

  it('treats a score sitting exactly on a min threshold as reaching it', () => {
    const verdict = resolveLevel(grid, axes(0.5, 0.5, 0.5, 0.33))

    expect(verdict.level.id).toBe('blue')
  })

  it('treats a score sitting exactly on a max threshold as still inside it', () => {
    const verdict = resolveLevel(grid, axes(0, 0, 0, 0))

    expect(verdict.level.id).toBe('white')
  })

  it('falls back to the lowest level when no condition holds at all', () => {
    const verdict = resolveLevel(grid, axes(0.25, 0.25, 0.25, 0))

    expect(verdict.level.id).toBe('white')
    expect(verdict.satisfiedConditions).toHaveLength(0)
  })

  it('holds Silver back from Gold on the initiative of the agents alone', () => {
    expect(resolveLevel(grid, axes(1, 1, 1, 1, 0.5)).level.id).toBe('silver')
    expect(resolveLevel(grid, axes(1, 1, 1, 1, 1)).level.id).toBe('gold')
  })

  it('never lets an unmeasured dimension satisfy a condition', () => {
    const verdict = resolveLevel(grid, [
      score('taille', 1),
      unmeasured('harness'),
      score('intervention', 1),
      score('parallele', 1),
    ])

    expect(verdict.level.id).toBe('white')
    expect(verdict.satisfiedConditions).toHaveLength(0)
  })

  it('carries the hint the reached level holds, and names the level above', () => {
    const verdict = resolveLevel(grid, axes(0.5, 0.5, 0.5, 0.33))

    expect(verdict.level.id).toBe('blue')
    expect(verdict.hint).toBe(verdict.level.nextLevelHint)
    expect(verdict.nextLevel?.label).toBe('🟢 Green')
  })

  it('resolves the same level on two runs of the same input', () => {
    const dimensions = axes(0.8, 0.76, 0.9, 0.5)

    expect(resolveLevel(grid, dimensions)).toEqual(
      resolveLevel(grid, dimensions),
    )
  })
})
