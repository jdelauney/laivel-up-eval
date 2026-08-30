import { describe, expect, it } from 'vitest'
import { buildPracticeMapAnswer } from '@/games/practice-map/actions/build-practice-map-answer.action'
import { IncompletePlacementError } from '@/games/practice-map/schema/answer.schema'
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

const placement = (practiceId: string) => ({
  practiceId,
  intensity: 0.5,
  rigor: 0.5,
})

describe('build practice-map answer', () => {
  it('orders the trace on the configuration, not on the order the placements were entered', () => {
    const answer = buildPracticeMapAnswer(config, [
      placement('p4'),
      placement('p1'),
      placement('p3'),
      placement('p2'),
    ])

    expect(answer.placements.map((entry) => entry.practiceId)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
    ])
  })

  it('carries no derived field: only practiceId, intensity and rigor', () => {
    const answer = buildPracticeMapAnswer(config, [
      placement('p1'),
      placement('p2'),
      placement('p3'),
      placement('p4'),
    ])

    answer.placements.forEach((entry) => {
      expect(Object.keys(entry).sort()).toEqual([
        'intensity',
        'practiceId',
        'rigor',
      ])
    })
  })

  it('rejects an incomplete reserve, naming the missing practice', () => {
    const call = () =>
      buildPracticeMapAnswer(config, [
        placement('p1'),
        placement('p2'),
        placement('p3'),
      ])

    expect(call).toThrow(IncompletePlacementError)
    expect(call).toThrow('p4')
  })

  it('produces the identical trace for two games played with the tokens placed in a different order', () => {
    const first = buildPracticeMapAnswer(config, [
      placement('p1'),
      placement('p2'),
      placement('p3'),
      placement('p4'),
    ])
    const second = buildPracticeMapAnswer(config, [
      placement('p4'),
      placement('p3'),
      placement('p2'),
      placement('p1'),
    ])

    expect(second).toEqual(first)
  })
})
