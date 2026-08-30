import { describe, expect, it } from 'vitest'
import {
  IncompleteTraceError,
  parseLieDetectorTrace,
  UnknownClaimError,
  UnknownRoundError,
} from '@/games/lie-detector/schema/answer.schema'
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

describe('lie-detector answer schema', () => {
  it('accepts a complete trace, one pick per round', () => {
    const trace = parseLieDetectorTrace(
      {
        picks: [
          pick('r1', 'r1-b', 'r1-b'),
          pick('r2', 'r2-a', 'r2-b'),
          pick('r3', 'r3-a', 'r3-b'),
        ],
      },
      config,
    )

    expect(trace.picks).toHaveLength(3)
  })

  it('rejects a trace omitting a round, naming the missing round', () => {
    const call = () =>
      parseLieDetectorTrace({ picks: [pick('r1', 'r1-b', 'r1-b')] }, config)

    expect(call).toThrow(IncompleteTraceError)
    expect(call).toThrow('r2')
  })

  it('rejects a pick aiming at a round absent from the configuration, naming the round', () => {
    const call = () =>
      parseLieDetectorTrace(
        {
          picks: [
            pick('r1', 'r1-b', 'r1-b'),
            pick('r2', 'r2-a', 'r2-b'),
            pick('r3', 'r3-a', 'r3-b'),
            pick('r9', 'x', 'x'),
          ],
        },
        config,
      )

    expect(call).toThrow(UnknownRoundError)
    expect(call).toThrow('r9')
  })

  it('rejects a pick aiming at a claim absent from its round, naming the claim and the round', () => {
    const call = () =>
      parseLieDetectorTrace(
        {
          picks: [
            pick('r1', 'introuvable', 'r1-b'),
            pick('r2', 'r2-a', 'r2-b'),
            pick('r3', 'r3-a', 'r3-b'),
          ],
        },
        config,
      )

    expect(call).toThrow(UnknownClaimError)
    expect(call).toThrow('introuvable')
    expect(call).toThrow('r1')
  })

  it('rejects a trace covering the same round twice', () => {
    const call = () =>
      parseLieDetectorTrace(
        {
          picks: [
            pick('r1', 'r1-b', 'r1-b'),
            pick('r1', 'r1-a', 'r1-b'),
            pick('r2', 'r2-a', 'r2-b'),
          ],
        },
        config,
      )

    expect(call).toThrow()
  })
})
