import { describe, expect, it } from 'vitest'
import type { Game, Group } from '../../../../src/core/contracts/course.schema'
import {
  buildGameOutcome,
  buildGroupOutcome,
  EvaluationResult,
} from '../../../../src/core/entities/evaluation-result.entity'
import { WeightedMappingStrategy } from '../../../../src/core/scoring/weighted-mapping.strategy'

const game = (id: string, criterionIds: readonly string[]): Game => ({
  id,
  type: 'test-bench',
  label: `Jeu ${id}`,
  config: {},
  criteria: criterionIds.map((criterionId) => ({
    id: criterionId,
    question: `Critère ${criterionId} ?`,
    rule: { type: 'test-rule' },
    mapping: [{ dimension: 'verification', weight: 1 }],
  })),
})

const group = (id: string): Group => ({
  id,
  label: `Groupe ${id}`,
  order: 1,
  games: [],
})

describe('evaluation result aggregation', () => {
  it('scores a game as the proportion of satisfied criteria', () => {
    const outcome = buildGameOutcome(game('g1', ['c1', 'c2', 'c3', 'c4']), [
      { criterionId: 'c1', satisfied: true },
      { criterionId: 'c2', satisfied: false },
      { criterionId: 'c3', satisfied: true },
      { criterionId: 'c4', satisfied: false },
    ])

    expect(outcome.score).toBe(0.5)
    expect(outcome.criteria).toHaveLength(4)
  })

  it('carries the question of each criterion, so the verdict can be read', () => {
    const outcome = buildGameOutcome(game('g1', ['c1']), [
      { criterionId: 'c1', satisfied: true },
    ])

    expect(outcome.criteria[0].question).toBe('Critère c1 ?')
    expect(outcome.criteria[0].gameId).toBe('g1')
  })

  it('refuses a criterion left unevaluated instead of scoring it as failed', () => {
    expect(() =>
      buildGameOutcome(game('g1', ['c1', 'c2']), [
        { criterionId: 'c1', satisfied: true },
      ]),
    ).toThrow('c2')
  })

  it('scores a group as the average of its games', () => {
    const first = buildGameOutcome(game('g1', ['c1', 'c2']), [
      { criterionId: 'c1', satisfied: true },
      { criterionId: 'c2', satisfied: true },
    ])
    const second = buildGameOutcome(game('g2', ['c1', 'c2']), [
      { criterionId: 'c1', satisfied: false },
      { criterionId: 'c2', satisfied: false },
    ])

    const outcome = buildGroupOutcome(group('grp'), [first, second])

    expect(outcome.score).toBe(0.5)
    expect(outcome.games).toHaveLength(2)
  })

  it('walks from a dimension score back to the criteria that produced it', () => {
    const outcome = buildGameOutcome(game('g1', ['c1', 'c2']), [
      { criterionId: 'c1', satisfied: true },
      { criterionId: 'c2', satisfied: false },
    ])
    const groups = [buildGroupOutcome(group('grp'), [outcome])]
    const dimensions = new WeightedMappingStrategy().score(
      groups.flatMap((entry) => entry.games).flatMap((entry) => entry.criteria),
      [{ id: 'verification', label: 'Vérification', weight: 1 }],
    )

    const result = new EvaluationResult(groups, dimensions)
    const verification = result.dimension('verification')

    expect(
      verification?.contributions.map((entry) => entry.criterionId),
    ).toEqual(['c1', 'c2'])
    expect(
      verification?.contributions.every((entry) => entry.gameId === 'g1'),
    ).toBe(true)
    expect(result.allCriteria()).toHaveLength(2)
  })
})
