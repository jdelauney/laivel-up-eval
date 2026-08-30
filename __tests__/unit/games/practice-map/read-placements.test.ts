import { describe, expect, it } from 'vitest'
import { readPlacements } from '@/games/practice-map/helpers/read-placements.helper'
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

/**
 * `p1` bas-gauche, basse rigueur ; `p2` centre ; `p3` haut-droite, en haute
 * rigueur (`rigorFrom` 0.6 ≥ `highRigorFrom` 0.5) ; `p4` bas-droite, basse
 * rigueur mais forte intensité.
 */
const config: PracticeMapConfig = practiceMapConfigSchema.parse({
  statement: 'Consigne de test.',
  highRigorFrom: 0.5,
  poles: poles(),
  quadrants: quadrants(),
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

const placement = (practiceId: string, intensity: number, rigor: number) => ({
  practiceId,
  intensity,
  rigor,
})

describe('read placements', () => {
  it('reads a point at the center of its zone as in zone', () => {
    const reading = readPlacements(config, {
      placements: [
        placement('p1', 0.1, 0.1),
        placement('p2', 0.5, 0.5),
        placement('p3', 0.5, 0.5),
        placement('p4', 0.5, 0.5),
      ],
    })

    expect(reading.placements[0].inZone).toBe(true)
  })

  it('reads a point exactly on the boundary of its zone as in zone', () => {
    const reading = readPlacements(config, {
      placements: [
        placement('p1', 0.2, 0.2),
        placement('p2', 0.5, 0.5),
        placement('p3', 0.5, 0.5),
        placement('p4', 0.5, 0.5),
      ],
    })

    expect(reading.placements[0].inZone).toBe(true)
  })

  it('reads a point just outside its zone as not in zone', () => {
    const reading = readPlacements(config, {
      placements: [
        placement('p1', 0.21, 0.1),
        placement('p2', 0.5, 0.5),
        placement('p3', 0.5, 0.5),
        placement('p4', 0.5, 0.5),
      ],
    })

    expect(reading.placements[0].inZone).toBe(false)
  })

  it('reads a held ordering when the higher practice is strictly above the lower one', () => {
    const reading = readPlacements(config, {
      placements: [
        placement('p1', 0.1, 0.1),
        placement('p2', 0.5, 0.5),
        placement('p3', 0.7, 0.7),
        placement('p4', 0.5, 0.5),
      ],
    })

    const o1 = reading.orderings.find((entry) => entry.orderingId === 'o1')
    expect(o1?.held).toBe(true)
  })

  it('reads an inverted ordering as not held', () => {
    const reading = readPlacements(config, {
      placements: [
        placement('p1', 0.1, 0.9),
        placement('p2', 0.5, 0.5),
        placement('p3', 0.7, 0.1),
        placement('p4', 0.5, 0.5),
      ],
    })

    const o1 = reading.orderings.find((entry) => entry.orderingId === 'o1')
    expect(o1?.held).toBe(false)
  })

  it('reads two practices posed at the same level on the ordering axis as not held', () => {
    const reading = readPlacements(config, {
      placements: [
        placement('p1', 0.1, 0.4),
        placement('p2', 0.5, 0.5),
        placement('p3', 0.7, 0.4),
        placement('p4', 0.5, 0.5),
      ],
    })

    const o1 = reading.orderings.find((entry) => entry.orderingId === 'o1')
    expect(o1?.held).toBe(false)
  })

  it('reads inHighRigorZone false for a practice posed in its own zone when that zone is not high-rigor', () => {
    const reading = readPlacements(config, {
      placements: [
        placement('p1', 0.1, 0.1),
        placement('p2', 0.5, 0.5),
        placement('p3', 0.5, 0.5),
        placement('p4', 0.5, 0.5),
      ],
    })

    const p1 = reading.placements.find((entry) => entry.practiceId === 'p1')
    expect(p1?.inZone).toBe(true)
    expect(p1?.inHighRigorZone).toBe(false)
  })

  it('reads inHighRigorZone true for a practice posed in its own zone when that zone is high-rigor', () => {
    const reading = readPlacements(config, {
      placements: [
        placement('p1', 0.1, 0.1),
        placement('p2', 0.5, 0.5),
        placement('p3', 0.7, 0.7),
        placement('p4', 0.5, 0.5),
      ],
    })

    const p3 = reading.placements.find((entry) => entry.practiceId === 'p3')
    expect(p3?.inZone).toBe(true)
    expect(p3?.inHighRigorZone).toBe(true)
    expect(reading.highRigorHit).toBe(true)
  })

  it('does not credit highRigorHit for a low-rigor practice merely posed high on the plane', () => {
    const reading = readPlacements(config, {
      placements: [
        placement('p1', 0.9, 0.9),
        placement('p2', 0.5, 0.5),
        placement('p3', 0.5, 0.5),
        placement('p4', 0.5, 0.5),
      ],
    })

    expect(reading.highRigorHit).toBe(false)
  })

  it('aggregates inZoneCount and heldOrderingCount across the whole reading', () => {
    const reading = readPlacements(config, {
      placements: [
        placement('p1', 0.1, 0.1),
        placement('p2', 0.4, 0.4),
        placement('p3', 0.7, 0.7),
        placement('p4', 0.9, 0.1),
      ],
    })

    expect(reading.inZoneCount).toBe(4)
    expect(reading.heldOrderingCount).toBe(3)
  })
})
