import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import { LieDetectorEvaluator } from '@/games/lie-detector/lie-detector.evaluator'
import {
  type LieDetectorConfig,
  lieDetectorConfigSchema,
} from '@/games/lie-detector/schema/config.schema'
import { buildGameRegistry } from '@/games/register-games'

const claim = (id: string, lying: boolean) => ({
  id,
  text: `Affirmation ${id}.`,
  lying,
  verification: `Vérification ${id}.`,
})

const round = (id: string, targetId: string) => ({
  id,
  prompt: `Mise en situation ${id}.`,
  claims: [
    claim(`${id}-a`, false),
    claim(`${id}-b`, true),
    claim(`${id}-c`, false),
    claim(`${id}-d`, false),
  ],
  objection: { targetId, argument: 'Argument de test.' },
})

/**
 * Quatre manches. r1 et r3 portent une objection FONDÉE (elle vise la
 * menteuse) ; r2 et r4 une objection CREUSE (elle vise une vraie
 * affirmation) : le corpus porte les deux natures, comme l'exige le
 * garde-fou anti-triche du schéma.
 */
const config: LieDetectorConfig = lieDetectorConfigSchema.parse({
  statement: 'Consigne de test.',
  rounds: [
    round('r1', 'r1-b'),
    round('r2', 'r2-a'),
    round('r3', 'r3-b'),
    round('r4', 'r4-a'),
  ],
})

const pick = (roundId: string, firstPickId: string, finalPickId: string) => ({
  roundId,
  firstPickId,
  finalPickId,
})

const criteria: Criterion[] = [
  {
    id: 'c1',
    question: 'La fausse affirmation a-t-elle été identifiée ?',
    rule: { type: 'lies-unmasked-at-least', threshold: 3 },
    mapping: [{ dimension: 'verification', weight: 2 }],
  },
  {
    id: 'c2',
    question: 'Le choix est-il resté stable sous la contradiction ?',
    rule: { type: 'no-capitulation' },
    mapping: [{ dimension: 'verification', weight: 2 }],
  },
]

const evaluator = new LieDetectorEvaluator()

const verdictOf = (
  picks: ReturnType<typeof pick>[],
  rules: readonly Criterion[] = criteria,
): boolean[] =>
  evaluator.evaluate({ picks }, config, rules).map((result) => result.satisfied)

describe('lie-detector evaluator', () => {
  it('registers under its own type, resolvable by the game registry, against a four round configuration', () => {
    const contract = buildGameRegistry().resolve('lie-detector')

    expect(contract.evaluator).toBeInstanceOf(LieDetectorEvaluator)
    expect(() => contract.configSchema.parse(config)).not.toThrow()
    expect(config.rounds).toHaveLength(4)
  })

  it('satisfies both criteria on four rounds unmasked and held under contradiction', () => {
    // Chaque manche : la menteuse désignée en premier, maintenue ensuite —
    // qu'elle confirme (r1, r3) ou contredise (r2, r4) selon la nature de
    // l'objection.
    expect(
      verdictOf([
        pick('r1', 'r1-b', 'r1-b'),
        pick('r2', 'r2-b', 'r2-b'),
        pick('r3', 'r3-b', 'r3-b'),
        pick('r4', 'r4-b', 'r4-b'),
      ]),
    ).toEqual([true, true])
  })

  it('misses the identification criterion under its threshold: two unmasked out of four against a threshold of three', () => {
    const [identification] = verdictOf([
      pick('r1', 'r1-b', 'r1-b'),
      pick('r2', 'r2-b', 'r2-b'),
      pick('r3', 'r3-a', 'r3-a'),
      pick('r4', 'r4-a', 'r4-a'),
    ])

    expect(identification).toBe(false)
  })

  it('misses the stability criterion on a single capitulation: a correct designation abandoned under contradiction', () => {
    // r2 : objection creuse, désignation juste au départ, lâchée à la fin.
    const [, stability] = verdictOf([
      pick('r1', 'r1-b', 'r1-b'),
      pick('r2', 'r2-b', 'r2-c'),
      pick('r3', 'r3-b', 'r3-b'),
      pick('r4', 'r4-b', 'r4-b'),
    ])

    expect(stability).toBe(false)
  })

  it('misses the stability criterion by vacuity when every designation targets the objection: never contradicted, never proven', () => {
    // La première désignation vise exactement la cible de l'objection dans
    // les quatre manches : aucune n'est jamais contredite.
    const [, stability] = verdictOf([
      pick('r1', 'r1-b', 'r1-b'),
      pick('r2', 'r2-a', 'r2-a'),
      pick('r3', 'r3-b', 'r3-b'),
      pick('r4', 'r4-a', 'r4-a'),
    ])

    expect(stability).toBe(false)
  })

  it('rejects a rule it does not know, naming the rule and the game', () => {
    const unknown: Criterion[] = [
      { ...criteria[0], rule: { type: 'invented-rule' } },
    ]

    const picks = [
      pick('r1', 'r1-b', 'r1-b'),
      pick('r2', 'r2-b', 'r2-b'),
      pick('r3', 'r3-b', 'r3-b'),
      pick('r4', 'r4-b', 'r4-b'),
    ]

    expect(() => verdictOf(picks, unknown)).toThrow('invented-rule')
    expect(() => verdictOf(picks, unknown)).toThrow('lie-detector')
  })

  it('renders the same verdict on two evaluations of the same trace', () => {
    const picks = [
      pick('r1', 'r1-b', 'r1-b'),
      pick('r2', 'r2-b', 'r2-c'),
      pick('r3', 'r3-a', 'r3-b'),
      pick('r4', 'r4-a', 'r4-a'),
    ]

    expect(verdictOf(picks)).toEqual(verdictOf(picks))
  })
})
