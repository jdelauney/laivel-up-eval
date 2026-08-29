import { describe, expect, it } from 'vitest'
import { buildConfidenceBetAnswer } from '@/games/confidence-bet/actions/build-confidence-bet-answer.action'
import {
  type ConfidenceBetConfig,
  confidenceBetConfigSchema,
} from '@/games/confidence-bet/schema/config.schema'

const snippet = (id: string, nature: 'sound' | 'flawed' | 'undecidable') => ({
  id,
  label: id,
  language: 'ts',
  code: `const ${id} = 1`,
  nature,
  reveal: `révélation ${id}`,
})

const snippets = [
  snippet('s1', 'sound'),
  snippet('f1', 'flawed'),
  snippet('u1', 'undecidable'),
]

const config: ConfidenceBetConfig = confidenceBetConfigSchema.parse({
  statement: 'Consigne de test.',
  stakes: [10, 30, 50, 70, 90],
  neutralStake: 50,
  startingCapital: 100,
  snippets,
})

describe('build confidence bet answer', () => {
  it('follows the config order, never the order played', () => {
    const inOrder = buildConfidenceBetAnswer(config, [
      { snippetId: 's1', stake: 90 },
      { snippetId: 'f1', stake: 10 },
      { snippetId: 'u1', stake: 50 },
    ])
    const outOfOrder = buildConfidenceBetAnswer(config, [
      { snippetId: 'u1', stake: 50 },
      { snippetId: 's1', stake: 90 },
      { snippetId: 'f1', stake: 10 },
    ])

    expect(inOrder.bets.map((bet) => bet.snippetId)).toEqual(
      config.snippets.map((entry) => entry.id),
    )
    expect(outOfOrder.bets).toEqual(inOrder.bets)
  })

  it('carries a bet per declared snippet', () => {
    const answer = buildConfidenceBetAnswer(config, [
      { snippetId: 's1', stake: 90 },
      { snippetId: 'f1', stake: 10 },
      { snippetId: 'u1', stake: 50 },
    ])

    expect(answer.bets).toHaveLength(config.snippets.length)
  })

  /**
   * Le repli sur la mise neutre rendrait une trace complète et notable pour
   * une partie inachevée : le garde-fou de la bande d'incertitude serait
   * satisfait par des mises que personne n'a engagées.
   */
  it('refuses a snippet left without a bet, naming it, rather than filling in the neutral stake', () => {
    expect(() =>
      buildConfidenceBetAnswer(config, [
        { snippetId: 's1', stake: 90 },
        { snippetId: 'f1', stake: 10 },
      ]),
    ).toThrow(/u1/)
  })

  it('takes the final capital from the replayed simulation, not a recomputation', () => {
    const answer = buildConfidenceBetAnswer(config, [
      { snippetId: 's1', stake: 90 },
      { snippetId: 'f1', stake: 10 },
      { snippetId: 'u1', stake: 50 },
    ])

    // sound: +40, flawed: +40, undecidable: 0 → 100 + 40 + 40 + 0
    expect(answer.finalCapital).toBe(180)
  })
})
