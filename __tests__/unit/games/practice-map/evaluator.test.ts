import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import { PracticeMapEvaluator } from '@/games/practice-map/practice-map.evaluator'
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

const quadrants = () => ({
  highRigorLowIntensity: 'Outillé, à la main',
  highRigorHighIntensity: 'Outillé, délégué',
  lowRigorLowIntensity: 'À la main, sans filet',
  lowRigorHighIntensity: 'Délégué, sans filet',
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
  shortLabel: `Court ${id}`,
  expected,
  marker: `Repère de ${id}.`,
})

const ordering = (
  id: string,
  axis: 'intensity' | 'rigor',
  higherId: string,
  lowerId: string,
) => ({ id, axis, higherId, lowerId })

/**
 * Sept pratiques en grille, deux à deux disjointes, réparties sur les deux
 * axes : `p5` et `p6` sont les deux zones en haute rigueur
 * (`highRigorFrom` 0.6), les cinq autres en dessous. Sept relations d'ordre,
 * chacune soutenue par les zones, sur le modèle du corpus réel.
 */
const config: PracticeMapConfig = practiceMapConfigSchema.parse({
  statement: 'Consigne de test.',
  highRigorFrom: 0.6,
  poles: poles(),
  quadrants: quadrants(),
  practices: [
    practice('p1', zone(0, 0.1, 0, 0.1)),
    practice('p2', zone(0.15, 0.25, 0.15, 0.25)),
    practice('p3', zone(0.3, 0.4, 0.3, 0.4)),
    practice('p4', zone(0.45, 0.55, 0.45, 0.55)),
    practice('p5', zone(0.6, 0.7, 0.6, 0.7)),
    practice('p6', zone(0.75, 0.85, 0.75, 0.85)),
    practice('p7', zone(0.9, 1, 0, 0.1)),
  ],
  orderings: [
    ordering('o1', 'rigor', 'p5', 'p2'),
    ordering('o2', 'rigor', 'p6', 'p1'),
    ordering('o3', 'intensity', 'p7', 'p6'),
    ordering('o4', 'intensity', 'p5', 'p1'),
    ordering('o5', 'rigor', 'p4', 'p1'),
    ordering('o6', 'rigor', 'p3', 'p1'),
    ordering('o7', 'intensity', 'p2', 'p1'),
  ],
})

const criteria: Criterion[] = [
  {
    id: 'c1',
    question: 'Assez de pratiques sont-elles situées là où elles se tiennent ?',
    rule: { type: 'placements-in-zone-at-least', threshold: 4 },
    mapping: [
      { dimension: 'pilotage-contexte', weight: 2, evidence: 'measured' },
    ],
  },
  {
    id: 'c2',
    question:
      'Une pratique de haute rigueur a-t-elle été située dans son quadrant ?',
    rule: { type: 'high-rigor-zone-hit' },
    mapping: [
      { dimension: 'pilotage-contexte', weight: 1, evidence: 'measured' },
    ],
  },
  {
    id: 'c3',
    question:
      'Les pratiques sont-elles situées les unes par rapport aux autres comme elles se tiennent ?',
    rule: { type: 'orderings-held-at-least', threshold: 6 },
    mapping: [
      { dimension: 'pilotage-contexte', weight: 1, evidence: 'measured' },
    ],
  },
]

const evaluator = new PracticeMapEvaluator()

const center = (z: ReturnType<typeof zone>) => ({
  intensity: (z.intensityFrom + z.intensityTo) / 2,
  rigor: (z.rigorFrom + z.rigorTo) / 2,
})

const perfectPlacements = () =>
  config.practices.map((entry) => ({
    practiceId: entry.id,
    ...center(entry.expected),
  }))

const verdictOf = (
  placements: { practiceId: string; intensity: number; rigor: number }[],
  rules: readonly Criterion[] = criteria,
): boolean[] =>
  evaluator
    .evaluate({ placements }, config, rules)
    .map((result) => result.satisfied)

describe('practice-map evaluator', () => {
  it('accepts a configuration of seven practices and three declarative criteria', () => {
    expect(config.practices).toHaveLength(7)
    expect(criteria).toHaveLength(3)
    expect(() => verdictOf(perfectPlacements())).not.toThrow()
  })

  it('satisfies all three criteria for a perfect reading, every practice posed in its own zone', () => {
    expect(verdictOf(perfectPlacements())).toEqual([true, true, true])
  })

  /**
   * Décalage uniforme de 0,3 vers le bas sur l'axe de rigueur, borné à zéro :
   * l'ordre relatif entre les pratiques est préservé (`c3` tient), mais la
   * plupart quittent leur propre zone (`c1` manque).
   */
  it('misses the zone criterion but holds the ordering criterion for a reading shifted down in a block', () => {
    const shifted = config.practices.map((entry) => {
      const { intensity, rigor } = center(entry.expected)
      return {
        practiceId: entry.id,
        intensity,
        rigor: Math.max(0, rigor - 0.3),
      }
    })

    const [c1, , c3] = verdictOf(shifted)
    expect(c1).toBe(false)
    expect(c3).toBe(true)
  })

  it('misses the zone and the high-rigor criteria when all seven tokens are stacked on the same point', () => {
    const stacked = config.practices.map((entry) => ({
      practiceId: entry.id,
      intensity: 0.5,
      rigor: 0.5,
    }))

    const [c1, c2, c3] = verdictOf(stacked)
    expect(c1).toBe(false)
    expect(c2).toBe(false)
    expect(c3).toBe(false)
  })

  /**
   * `p1`, une pratique de basse rigueur, est glissée dans les coordonnées de
   * la zone haute rigueur de `p5` : les coordonnées seules ne suffisent
   * jamais, seule la pratique dont c'est réellement la zone compte.
   */
  it('misses the high-rigor criterion when a low-rigor practice is merely slid into high-rigor coordinates', () => {
    const placements = config.practices.map((entry) => {
      if (entry.id === 'p1')
        return { practiceId: 'p1', intensity: 0.65, rigor: 0.65 }
      return { practiceId: entry.id, intensity: 0.02, rigor: 0.98 }
    })

    const [, c2] = verdictOf(placements)
    expect(c2).toBe(false)
  })

  it('satisfies the high-rigor criterion but misses the zone criterion when only the high-rigor practice is posed in its own zone', () => {
    const placements = config.practices.map((entry) => {
      if (entry.id === 'p5')
        return { practiceId: 'p5', ...center(entry.expected) }
      return { practiceId: entry.id, intensity: 0.05, rigor: 0.95 }
    })

    const [c1, c2] = verdictOf(placements)
    expect(c1).toBe(false)
    expect(c2).toBe(true)
  })

  it('rejects a rule it does not know, naming the rule and the game', () => {
    const unknown: Criterion[] = [
      { ...criteria[0], rule: { type: 'invented-rule' } },
    ]

    expect(() => verdictOf(perfectPlacements(), unknown)).toThrow(
      'invented-rule',
    )
    expect(() => verdictOf(perfectPlacements(), unknown)).toThrow(
      'practice-map',
    )
  })

  it('reads the threshold from the rule: two runs of the same placements with two thresholds render two verdicts', () => {
    const lenient: Criterion = {
      ...criteria[0],
      rule: { type: 'placements-in-zone-at-least', threshold: 4 },
    }
    const strict: Criterion = {
      ...criteria[0],
      rule: { type: 'placements-in-zone-at-least', threshold: 8 },
    }

    const [lenientResult] = verdictOf(perfectPlacements(), [lenient])
    const [strictResult] = verdictOf(perfectPlacements(), [strict])

    expect(lenientResult).toBe(true)
    expect(strictResult).toBe(false)
  })

  it('renders the same verdict on two evaluations of the same trace', () => {
    const placements = perfectPlacements()

    expect(verdictOf(placements)).toEqual(verdictOf(placements))
  })

  const attributionsOf = (
    placements: { practiceId: string; intensity: number; rigor: number }[],
    rules: readonly Criterion[] = criteria,
  ) =>
    evaluator
      .evaluate({ placements }, config, rules)
      .map((result) => result.attributions)

  it('names each practice out of its zone by its config label, never by its id', () => {
    const shifted = config.practices.map((entry) => {
      const { intensity, rigor } = center(entry.expected)
      return {
        practiceId: entry.id,
        intensity,
        rigor: Math.max(0, rigor - 0.3),
      }
    })

    const [c1Attributions] = attributionsOf(shifted, [criteria[0]])

    expect(c1Attributions).toHaveLength(7)
    expect(c1Attributions?.every((entry) => !/^p\d$/.test(entry.label))).toBe(
      true,
    )
    // p1 et p7 restent dans leur zone même décalés (bornés à zéro) ; les cinq
    // autres — dont p2 et p3 — la quittent : c'est ce que `c1` manque.
    expect(
      c1Attributions
        ?.filter((entry) => !entry.held)
        .map((entry) => entry.label),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Pratique p2'),
        expect.stringContaining('Pratique p3'),
      ]),
    )
    expect(
      c1Attributions?.filter((entry) => entry.held).map((entry) => entry.label),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Pratique p1'),
        expect.stringContaining('Pratique p7'),
      ]),
    )
  })

  it('holds every attribution when all seven practices sit in their own zone', () => {
    const [c1Attributions] = attributionsOf(perfectPlacements(), [criteria[0]])

    expect(c1Attributions).toHaveLength(7)
    expect(c1Attributions?.every((entry) => entry.held)).toBe(true)
  })

  it('lists only the high-rigor-zone practices for the high-rigor criterion', () => {
    const [c2Attributions] = attributionsOf(perfectPlacements(), [criteria[1]])

    // p5 et p6 sont les deux seules zones en haute rigueur du corpus de test.
    expect(c2Attributions).toHaveLength(2)
    expect(c2Attributions?.every((entry) => entry.held)).toBe(true)
  })

  it('names an unheld ordering by the two practices it compares', () => {
    const shifted = config.practices.map((entry) => {
      if (entry.id !== 'p5')
        return { practiceId: entry.id, ...center(entry.expected) }
      return { practiceId: 'p5', intensity: 0.05, rigor: 0.05 }
    })

    const [c3Attributions] = attributionsOf(shifted, [criteria[2]])

    const unheld = c3Attributions?.filter((entry) => !entry.held) ?? []
    expect(unheld.length).toBeGreaterThan(0)
    expect(unheld.every((entry) => !/^p\d/.test(entry.label))).toBe(true)
  })
})
