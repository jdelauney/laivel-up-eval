import { describe, expect, it } from 'vitest'
import {
  IncompletePlacementError,
  parsePracticeMapTrace,
  UnknownPracticeError,
} from '@/games/practice-map/schema/answer.schema'
import {
  type PracticeMapConfig,
  practiceMapConfigSchema,
} from '@/games/practice-map/schema/config.schema'

const poles = () => ({
  intensityLow: 'vous le faites',
  intensityHigh: "l'agent le fait seul",
  rigorLow: 'rien ne la vérifie',
  rigorHigh: 'un garde-fou la tient sans vous',
})

const zone = (
  intensityFrom: number,
  intensityTo: number,
  rigorFrom: number,
  rigorTo: number,
) => ({ intensityFrom, intensityTo, rigorFrom, rigorTo })

const practice = (id: string, expected: ReturnType<typeof zone>) => ({
  id,
  label: `Pratique ${id}.`,
  expected,
  marker: `Repère de ${id}.`,
})

const config: PracticeMapConfig = practiceMapConfigSchema.parse({
  statement: 'Consigne de test.',
  highRigorFrom: 0.5,
  poles: poles(),
  practices: [
    practice('p1', zone(0, 0.2, 0, 0.2)),
    practice('p2', zone(0.3, 0.5, 0.3, 0.5)),
    practice('p3', zone(0.6, 0.8, 0.6, 0.8)),
    practice('p4', zone(0.8, 1, 0, 0.15)),
  ],
  orderings: [
    { id: 'o1', axis: 'rigor', higherId: 'p3', lowerId: 'p1' },
    { id: 'o2', axis: 'rigor', higherId: 'p2', lowerId: 'p1' },
    { id: 'o3', axis: 'intensity', higherId: 'p4', lowerId: 'p1' },
  ],
})

const placement = (practiceId: string, intensity = 0.5, rigor = 0.5) => ({
  practiceId,
  intensity,
  rigor,
})

describe('practice-map answer schema', () => {
  it('accepts a complete trace, one placement per practice', () => {
    const trace = parsePracticeMapTrace(
      {
        placements: [
          placement('p1'),
          placement('p2'),
          placement('p3'),
          placement('p4'),
        ],
      },
      config,
    )

    expect(trace.placements).toHaveLength(4)
  })

  it('rejects a placement outside [0,1]', () => {
    const call = () =>
      parsePracticeMapTrace(
        {
          placements: [
            { practiceId: 'p1', intensity: 1.2, rigor: 0.5 },
            placement('p2'),
            placement('p3'),
            placement('p4'),
          ],
        },
        config,
      )

    expect(call).toThrow()
  })

  it('rejects a trace placing the same practice twice', () => {
    const call = () =>
      parsePracticeMapTrace(
        {
          placements: [
            placement('p1'),
            placement('p1'),
            placement('p2'),
            placement('p3'),
            placement('p4'),
          ],
        },
        config,
      )

    expect(call).toThrow()
  })

  it('rejects a trace omitting a practice, naming it with IncompletePlacementError', () => {
    const call = () =>
      parsePracticeMapTrace(
        { placements: [placement('p1'), placement('p2'), placement('p3')] },
        config,
      )

    expect(call).toThrow(IncompletePlacementError)
    expect(call).toThrow('p4')
  })

  it('rejects a placement aiming at a practice absent from the configuration, naming it with UnknownPracticeError', () => {
    const call = () =>
      parsePracticeMapTrace(
        {
          placements: [
            placement('p1'),
            placement('p2'),
            placement('p3'),
            placement('p4'),
            placement('introuvable'),
          ],
        },
        config,
      )

    expect(call).toThrow(UnknownPracticeError)
    expect(call).toThrow('introuvable')
  })
})
