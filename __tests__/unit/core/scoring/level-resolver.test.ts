import { describe, expect, it } from 'vitest'
import projectGrid from '../../../../config/grid.json'
import type { Grid } from '../../../../src/core/contracts/grid.schema'
import { parseGrid } from '../../../../src/core/contracts/helpers/parse-config.helper'
import type {
  DimensionScore,
  MeasurementStatus,
} from '../../../../src/core/ports/scoring-strategy.interface'
import { resolveLevel } from '../../../../src/core/scoring/helpers/level-resolver.helper'

const grid: Grid = parseGrid(projectGrid)

const dim = (
  dimensionId: string,
  value: number,
  measurement: MeasurementStatus = 'measured',
): DimensionScore => ({
  dimensionId,
  label: dimensionId,
  score: value,
  band: undefined,
  measurement,
  earned: measurement === 'unmeasured' ? 0 : value,
  possible: measurement === 'unmeasured' ? 0 : 1,
  contributions: [],
})

/** Les quatre axes de la grille, plus l'initiative qui sépare Silver de Gold. */
const axes = (
  taille: number,
  harness: number,
  intervention: number,
  parallele: number,
  initiative?: number,
  initiativeMeasurement: MeasurementStatus = 'measured',
): DimensionScore[] => {
  const dimensions = [
    dim('taille', taille),
    dim('harness', harness),
    dim('intervention', intervention),
    dim('parallele', parallele),
  ]
  if (initiative !== undefined) {
    dimensions.push(dim('initiative', initiative, initiativeMeasurement))
  }
  return dimensions
}

describe('level resolution', () => {
  it('reaches the highest level when every axis sits at the top, with no cap left', () => {
    const verdict = resolveLevel(grid, axes(1, 1, 1, 1, 1))

    expect(verdict.level?.id).toBe('gold')
    expect(verdict.nextLevel).toBeUndefined()
    expect(verdict.blocking).toHaveLength(0)
    expect(verdict.noNextLevelReason).toBe('summit')
  })

  it('names the single axis that caps the next level when the rest are at the top', () => {
    const verdict = resolveLevel(grid, axes(1, 1, 1, 0.66, 1))

    expect(verdict.level?.id).toBe('green')
    expect(verdict.nextLevel?.id).toBe('copper')
    expect(verdict.blocking[0]?.condition.dimension).toBe('parallele')
    expect(verdict.blocking).toHaveLength(1)
  })

  it('treats a score sitting exactly on a min threshold as reaching it', () => {
    const verdict = resolveLevel(grid, axes(0.5, 0.5, 0.5, 0.33))

    expect(verdict.level?.id).toBe('blue')
  })

  it('treats a score sitting exactly on a max threshold as still inside it', () => {
    const verdict = resolveLevel(grid, axes(0, 0, 0, 0))

    expect(verdict.level?.id).toBe('white')
  })

  it('lets an inferred axis satisfy a condition exactly like a measured one', () => {
    const verdict = resolveLevel(grid, axes(1, 1, 1, 1, 1, 'inferred'))

    expect(verdict.level?.id).toBe('gold')
  })

  it('holds Silver back from Gold on the initiative of the agents alone', () => {
    expect(resolveLevel(grid, axes(1, 1, 1, 1, 0.5)).level?.id).toBe('silver')
    expect(resolveLevel(grid, axes(1, 1, 1, 1, 1)).level?.id).toBe('gold')
  })

  it('announces no level when the profile sits in a gap of the referential, and aims the climbable level, not the one it violates', () => {
    // taille au-dessus de White (max 0) mais en dessous de Red (min 0.25) :
    // aucun niveau ne peut tenir. White viole une borne max — regresser vers
    // lui n'a pas de sens — donc la cible grimpe jusqu'à Red, le premier
    // niveau que rien n'interdit d'atteindre en avançant.
    const verdict = resolveLevel(grid, axes(0.1, 0, 0, 0, 0))

    expect(verdict.level).toBeUndefined()
    expect(verdict.nextLevel?.id).toBe('red')
    expect(verdict.unranked).toHaveLength(1)
    expect(verdict.unranked?.[0].condition.dimension).toBe('taille')
    expect(verdict.unranked?.[0].gap).toBeCloseTo(0.1)
  })

  it('announces no level and names the axis that was never measured', () => {
    const verdict = resolveLevel(grid, [
      dim('taille', 0, 'unmeasured'),
      dim('harness', 0),
      dim('intervention', 0),
      dim('parallele', 0),
    ])

    expect(verdict.level).toBeUndefined()
    const tailleGap = verdict.unranked?.find(
      (gap) => gap.condition.dimension === 'taille',
    )
    expect(tailleGap?.gap).toBeUndefined()
  })

  it('resolves the same verdict on two runs of the same input', () => {
    const dimensions = axes(0.8, 0.76, 0.9, 0.5)

    expect(resolveLevel(grid, dimensions)).toEqual(
      resolveLevel(grid, dimensions),
    )
  })

  it('flags which bound gave way on a violated condition', () => {
    const verdict = resolveLevel(grid, axes(1, 1, 1, 0.66, 1))

    expect(verdict.blocking[0]?.violated).toBe('min')
  })
})

describe("the referential's gap", () => {
  it('aims Red by climbing when the profile falls into the gap between White and Red, never White by descending', () => {
    // Le profil que D2 anticipe nommément : une feature de taille moyenne
    // (taille ≈ 0.5, largement au-dessus de White qui exige max 0) mais
    // aucun chantier mené en parallèle (parallele = 0, en dessous du
    // minimum de Red). Aucun niveau ne tient. White viole `max` sur taille
    // et harness : le viser demanderait de désapprendre ce qui est déjà
    // acquis. Red ne viole que des bornes `min` : c'est la cible qui monte.
    const verdict = resolveLevel(grid, axes(0.5, 0.5, 1, 0))

    expect(verdict.level).toBeUndefined()
    expect(verdict.nextLevel?.id).toBe('red')
    expect(verdict.blocking[0]?.condition.dimension).toBe('parallele')
    expect(verdict.blocking.map((gap) => gap.condition.dimension)).toEqual([
      'parallele',
    ])

    // La raison de l'état non classé reste celle de White — un contenu
    // distinct de celui du plan qui, lui, vise Red : plus de phrase
    // dupliquée. Comparaison de contenu, pas de référence : `[...gaps].sort()`
    // rend toujours un tableau neuf, donc `not.toBe` ne protégerait rien.
    const unrankedAxes = (verdict.unranked ?? [])
      .map((gap) => gap.condition.dimension)
      .sort()
    const blockingAxes = verdict.blocking
      .map((gap) => gap.condition.dimension)
      .sort()
    expect(unrankedAxes).toEqual(['harness', 'taille'])
    expect(blockingAxes).not.toEqual(unrankedAxes)
  })
})

describe('a reached level follows the same climb rule as an unranked one', () => {
  it('never offers a regressive next level, even when it holds the naive next order', () => {
    // La grille où `byOrder[position + 1]` serait « mid » — un niveau
    // intermédiaire dont la borne max est déjà dépassée. Le viser
    // redemanderait de régresser, exactement la pathologie de DB-2, mais sur
    // un profil classé. `resolveClimbTarget` doit sauter par-dessus, comme
    // pour un profil non classé.
    const regressiveGrid: Grid = {
      version: 'test',
      title: 'Grille de test',
      dimensions: [{ id: 'a', label: 'A', weight: 1 }],
      levels: [
        {
          id: 'low',
          label: 'Low',
          order: 1,
          conditions: [{ dimension: 'a', min: 0 }],
          nextLevelHint: 'Monter.',
        },
        {
          id: 'mid',
          label: 'Mid',
          order: 2,
          conditions: [{ dimension: 'a', max: 0.3 }],
          nextLevelHint: 'Ne devrait jamais être visé ici.',
        },
        {
          id: 'high',
          label: 'High',
          order: 3,
          conditions: [{ dimension: 'a', min: 0.8 }],
          nextLevelHint: 'Sommet.',
        },
      ],
    }

    const verdict = resolveLevel(regressiveGrid, [dim('a', 0.5)])

    expect(verdict.level?.id).toBe('low')
    expect(verdict.nextLevel?.id).toBe('high')
    expect(verdict.blocking.map((gap) => gap.condition.dimension)).toEqual([
      'a',
    ])
  })
})

describe('no climbable target', () => {
  it('says no rung above is reachable when every level in the grid violates a max bound', () => {
    // Cas signalé par la revue comme non couvert : même le niveau le plus
    // haut porte une borne max dépassée. Le repli sur le plancher a
    // disparu — aucune cible, la raison le dit, distincte du sommet atteint.
    const allCappedGrid: Grid = {
      version: 'test',
      title: 'Grille de test',
      dimensions: [{ id: 'a', label: 'A', weight: 1 }],
      levels: [
        {
          id: 'low',
          label: 'Low',
          order: 1,
          conditions: [{ dimension: 'a', max: 0 }],
          nextLevelHint: 'Monter.',
        },
        {
          id: 'high',
          label: 'High',
          order: 2,
          conditions: [{ dimension: 'a', max: 0.3 }],
          nextLevelHint: 'Toujours hors d’atteinte.',
        },
      ],
    }

    const verdict = resolveLevel(allCappedGrid, [dim('a', 0.5)])

    expect(verdict.level).toBeUndefined()
    expect(verdict.nextLevel).toBeUndefined()
    expect(verdict.blocking).toHaveLength(0)
    expect(verdict.noNextLevelReason).toBe('unreachable')
  })
})

/**
 * Grille minimale pour isoler l'ordre du plafond, indépendamment des seuils
 * réels de `config/grid.json` : trois axes déclarés dans cet ordre, un
 * niveau bas atteignable, un niveau haut qui les exige tous à 1.
 */
const orderingGrid: Grid = {
  version: 'test',
  title: 'Grille de test',
  dimensions: [
    { id: 'a', label: 'A', weight: 1 },
    { id: 'b', label: 'B', weight: 1 },
    { id: 'c', label: 'C', weight: 1 },
  ],
  levels: [
    {
      id: 'low',
      label: 'Low',
      order: 1,
      conditions: [{ dimension: 'a', max: 0 }],
      nextLevelHint: 'Monter.',
    },
    {
      id: 'high',
      label: 'High',
      order: 2,
      conditions: [
        { dimension: 'a', min: 1 },
        { dimension: 'b', min: 1 },
        { dimension: 'c', min: 1 },
      ],
      nextLevelHint: 'Sommet.',
    },
  ],
}

describe('capping order', () => {
  it('puts an unmeasured blocking axis ahead of measured ones', () => {
    const verdict = resolveLevel(orderingGrid, [
      dim('a', 0),
      dim('b', 0.5),
      dim('c', 0, 'unmeasured'),
    ])

    expect(verdict.level?.id).toBe('low')
    expect(verdict.blocking[0]?.condition.dimension).toBe('c')
  })

  it('puts the measured axis with the largest gap ahead of a smaller one', () => {
    const verdict = resolveLevel(orderingGrid, [
      dim('a', 0),
      dim('b', 0.5),
      dim('c', 1),
    ])

    expect(verdict.blocking.map((gap) => gap.condition.dimension)).toEqual([
      'a',
      'b',
    ])
  })

  it('breaks a tie on equal gaps with the order declared in the grid', () => {
    const verdict = resolveLevel(orderingGrid, [
      dim('a', 0),
      dim('b', 0),
      dim('c', 1),
    ])

    expect(verdict.blocking.map((gap) => gap.condition.dimension)).toEqual([
      'a',
      'b',
    ])
  })
})
