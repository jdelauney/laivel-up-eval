import { describe, expect, it } from 'vitest'
import type { Dimension } from '../../../../src/core/contracts/grid.schema'
import type { CriterionOutcome } from '../../../../src/core/entities/evaluation-result.entity'
import { WeightedMappingStrategy } from '../../../../src/core/scoring/weighted-mapping.strategy'

const dimensions: Dimension[] = [
  { id: 'verification', label: 'Vérification', weight: 1.5 },
  { id: 'pilotage', label: 'Pilotage', weight: 1 },
  { id: 'autonomie', label: 'Autonomie', weight: 1 },
]

const criterion = (
  criterionId: string,
  satisfied: boolean,
  mapping: readonly { dimension: string; weight: number }[],
): CriterionOutcome => ({
  criterionId,
  gameId: 'g1',
  question: `Critère ${criterionId} ?`,
  satisfied,
  mapping,
})

const strategy = new WeightedMappingStrategy()

describe('weighted mapping scoring', () => {
  it('scores a dimension as earned over possible contributions', () => {
    const scores = strategy.score(
      [
        criterion('c1', true, [{ dimension: 'verification', weight: 1 }]),
        criterion('c2', false, [{ dimension: 'verification', weight: 3 }]),
      ],
      dimensions,
    )

    const verification = scores[0]
    expect(verification.earned).toBe(1)
    expect(verification.possible).toBe(4)
    expect(verification.score).toBe(0.25)
  })

  it('keeps every score inside [0,1] whatever the weights', () => {
    const scores = strategy.score(
      [
        criterion('c1', true, [{ dimension: 'verification', weight: 12 }]),
        criterion('c2', true, [{ dimension: 'verification', weight: 0.5 }]),
      ],
      dimensions,
    )

    expect(scores[0].score).toBe(1)
    expect(scores.every((score) => score.score >= 0 && score.score <= 1)).toBe(
      true,
    )
  })

  it('spreads a criterion across every dimension it maps', () => {
    const scores = strategy.score(
      [
        criterion('c1', true, [
          { dimension: 'verification', weight: 1 },
          { dimension: 'pilotage', weight: 2 },
        ]),
      ],
      dimensions,
    )

    expect(scores[0].score).toBe(1)
    expect(scores[1].score).toBe(1)
    expect(scores[1].possible).toBe(2)
  })

  it('marks a dimension no criterion targets as unmeasured, not as zero', () => {
    const scores = strategy.score(
      [criterion('c1', true, [{ dimension: 'verification', weight: 1 }])],
      dimensions,
    )

    const autonomie = scores[2]
    expect(autonomie.measured).toBe(false)
    expect(autonomie.possible).toBe(0)
    expect(autonomie.contributions).toHaveLength(0)
  })

  it('separates a fully missed dimension from an unmeasured one', () => {
    const scores = strategy.score(
      [criterion('c1', false, [{ dimension: 'pilotage', weight: 1 }])],
      dimensions,
    )

    expect(scores[1].measured).toBe(true)
    expect(scores[1].score).toBe(0)
    expect(scores[2].measured).toBe(false)
  })

  it('produces the same scores on two runs of the same input', () => {
    const criteria = [
      criterion('c1', true, [{ dimension: 'verification', weight: 1 }]),
      criterion('c2', false, [{ dimension: 'pilotage', weight: 2 }]),
    ]

    expect(strategy.score(criteria, dimensions)).toEqual(
      strategy.score(criteria, dimensions),
    )
  })
})
