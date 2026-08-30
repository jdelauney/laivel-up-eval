import { describe, expect, it } from 'vitest'
import { buildLieDetectorAnswer } from '@/games/lie-detector/actions/build-lie-detector-answer.action'
import { IncompleteTraceError } from '@/games/lie-detector/schema/answer.schema'
import {
  type LieDetectorConfig,
  lieDetectorConfigSchema,
} from '@/games/lie-detector/schema/config.schema'

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

const config: LieDetectorConfig = lieDetectorConfigSchema.parse({
  statement: 'Consigne de test.',
  rounds: [round('r1', 'r1-b'), round('r2', 'r2-a'), round('r3', 'r3-a')],
})

const pick = (roundId: string, firstPickId: string, finalPickId: string) => ({
  roundId,
  firstPickId,
  finalPickId,
})

describe('build lie-detector answer', () => {
  it('orders the trace on the configuration, not on the order the rounds were played', () => {
    const answer = buildLieDetectorAnswer(config, [
      pick('r3', 'r3-a', 'r3-a'),
      pick('r1', 'r1-b', 'r1-b'),
      pick('r2', 'r2-a', 'r2-b'),
    ])

    expect(answer.picks.map((entry) => entry.roundId)).toEqual([
      'r1',
      'r2',
      'r3',
    ])
  })

  it('rejects a played round missing from the picks, naming the round', () => {
    const call = () =>
      buildLieDetectorAnswer(config, [
        pick('r1', 'r1-b', 'r1-b'),
        pick('r2', 'r2-a', 'r2-b'),
      ])

    expect(call).toThrow(IncompleteTraceError)
    expect(call).toThrow('r3')
  })

  it('rejects a pick aiming at a claim absent from its round', () => {
    const call = () =>
      buildLieDetectorAnswer(config, [
        pick('r1', 'introuvable', 'r1-b'),
        pick('r2', 'r2-a', 'r2-b'),
        pick('r3', 'r3-a', 'r3-a'),
      ])

    expect(call).toThrow()
  })
})
