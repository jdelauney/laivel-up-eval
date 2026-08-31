import { describe, expect, it } from 'vitest'
import type { MappingEvidence } from '../../../../src/core/contracts/course.schema'
import type { Grid } from '../../../../src/core/contracts/grid.schema'
import type { CriterionOutcome } from '../../../../src/core/entities/evaluation-result.entity'
import { proveAxes } from '../../../../src/core/scoring/helpers/axis-proof.helper'
import { WeightedMappingStrategy } from '../../../../src/core/scoring/weighted-mapping.strategy'

const grid: Grid = {
  version: 'test',
  title: 'Grille de test',
  dimensions: [
    {
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
    },
    { id: 'sans-echelle', label: 'Sans échelle', weight: 1 },
  ],
  levels: [
    {
      id: 'low',
      label: 'Low',
      order: 1,
      conditions: [{ dimension: 'taille', max: 0 }],
      nextLevelHint: 'Monter.',
    },
  ],
}

type MappingInput = {
  dimension: string
  weight: number
  evidence?: MappingEvidence
}

const criterion = (
  criterionId: string,
  satisfied: boolean,
  mapping: readonly MappingInput[],
  attributions?: CriterionOutcome['attributions'],
): CriterionOutcome => ({
  criterionId,
  gameId: 'g1',
  question: `Question ${criterionId} ?`,
  satisfied,
  mapping: mapping.map((entry) => ({
    dimension: entry.dimension,
    weight: entry.weight,
    evidence: entry.evidence ?? 'measured',
  })),
  attributions,
})

const strategy = new WeightedMappingStrategy()

describe('axis proof', () => {
  it('resolves the reached band from the raw scale', () => {
    const criteria = [
      criterion('c1', true, [{ dimension: 'taille', weight: 1 }]),
    ]
    const dimensions = strategy.score(criteria, grid.dimensions)

    const [proof] = proveAxes(grid, dimensions, criteria)

    expect(proof.band).toBe('XL')
  })

  it('names the band above when the axis sits under the top', () => {
    const criteria = [
      criterion('c1', true, [{ dimension: 'taille', weight: 1 }]),
      criterion('c2', false, [{ dimension: 'taille', weight: 1 }]),
    ]
    const dimensions = strategy.score(criteria, grid.dimensions)

    const [proof] = proveAxes(grid, dimensions, criteria)

    expect(proof.band).toBe('M')
    expect(proof.missedBand).toEqual({ label: 'L' })
  })

  it('names no missed band once the axis sits at the top of the scale', () => {
    const criteria = [
      criterion('c1', true, [{ dimension: 'taille', weight: 1 }]),
    ]
    const dimensions = strategy.score(criteria, grid.dimensions)

    const [proof] = proveAxes(grid, dimensions, criteria)

    expect(proof.missedBand).toBeUndefined()
  })

  it('reads no band on a dimension without a scale, but keeps the observed value', () => {
    const criteria = [
      criterion('c1', true, [{ dimension: 'sans-echelle', weight: 2 }]),
    ]
    const dimensions = strategy.score(criteria, grid.dimensions)

    const [, sansEchelle] = proveAxes(grid, dimensions, criteria)

    expect(sansEchelle.band).toBeUndefined()
    expect(sansEchelle.missedBand).toBeUndefined()
    expect(sansEchelle.earned).toBe(2)
    expect(sansEchelle.possible).toBe(2)
  })

  it('separates held from missed signals, heaviest weight first', () => {
    const criteria = [
      criterion('c-light', true, [{ dimension: 'taille', weight: 1 }]),
      criterion('c-heavy', true, [{ dimension: 'taille', weight: 3 }]),
      criterion('c-missed-heavy', false, [{ dimension: 'taille', weight: 2 }]),
    ]
    const dimensions = strategy.score(criteria, grid.dimensions)

    const [proof] = proveAxes(grid, dimensions, criteria)

    expect(proof.held.map((signal) => signal.criterionId)).toEqual([
      'c-heavy',
      'c-light',
    ])
    expect(proof.missed.map((signal) => signal.criterionId)).toEqual([
      'c-missed-heavy',
    ])
  })

  it('carries a criterion attributable detail onto the signal it fixed, without recomputing it', () => {
    const criteria = [
      criterion(
        'c1',
        true,
        [{ dimension: 'taille', weight: 1 }],
        [{ label: 'Fichier de contexte projet', held: true }],
      ),
    ]
    const dimensions = strategy.score(criteria, grid.dimensions)

    const [proof] = proveAxes(grid, dimensions, criteria)

    expect(proof.held[0].attributions).toEqual([
      { label: 'Fichier de contexte projet', held: true },
    ])
  })

  it('leaves a signal without attributions when its criterion carries none', () => {
    const criteria = [
      criterion('c1', true, [{ dimension: 'taille', weight: 1 }]),
    ]
    const dimensions = strategy.score(criteria, grid.dimensions)

    const [proof] = proveAxes(grid, dimensions, criteria)

    expect(proof.held[0].attributions).toBeUndefined()
  })

  it('breaks a tie on equal weight by criterionId', () => {
    const criteria = [
      criterion('c-b', true, [{ dimension: 'taille', weight: 1 }]),
      criterion('c-a', true, [{ dimension: 'taille', weight: 1 }]),
    ]
    const dimensions = strategy.score(criteria, grid.dimensions)

    const [proof] = proveAxes(grid, dimensions, criteria)

    expect(proof.held.map((signal) => signal.criterionId)).toEqual([
      'c-a',
      'c-b',
    ])
  })

  it('leaves an unmeasured axis without a band, a threshold or any signal', () => {
    const criteria: CriterionOutcome[] = []
    const dimensions = strategy.score(criteria, grid.dimensions)

    const [proof] = proveAxes(grid, dimensions, criteria)

    expect(proof.measurement).toBe('unmeasured')
    expect(proof.band).toBeUndefined()
    expect(proof.missedBand).toBeUndefined()
    expect(proof.held).toHaveLength(0)
    expect(proof.missed).toHaveLength(0)
  })

  it('throws when a contribution points at a criterion missing from the trace', () => {
    const criteria = [
      criterion('c1', true, [{ dimension: 'taille', weight: 1 }]),
    ]
    const dimensions = strategy.score(criteria, grid.dimensions)

    expect(() => proveAxes(grid, dimensions, [])).toThrow(/c1/)
  })

  it('resolves the same proof on two runs of the same input', () => {
    const criteria = [
      criterion('c1', true, [{ dimension: 'taille', weight: 1 }]),
      criterion('c2', false, [{ dimension: 'taille', weight: 2 }]),
    ]
    const dimensions = strategy.score(criteria, grid.dimensions)

    expect(proveAxes(grid, dimensions, criteria)).toEqual(
      proveAxes(grid, dimensions, criteria),
    )
  })
})
