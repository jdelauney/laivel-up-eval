import { describe, expect, it } from 'vitest'
import type { Grid } from '@/core/contracts/grid.schema'
import type { DimensionScore } from '@/core/ports/scoring-strategy.interface'
import type { ConditionGap } from '@/core/scoring/helpers/level-resolver.helper'
import { planProgression } from '@/core/scoring/helpers/progression-plan.helper'

const grid: Grid = {
  version: 'test',
  title: 'Grille de test',
  dimensions: [
    {
      id: 'parallele',
      label: 'Chantiers menés en parallèle',
      weight: 1,
      scale: [
        { from: 0, label: 'aucun' },
        { from: 0.33, label: '1 chantier' },
        {
          from: 0.66,
          label: '2 chantiers',
          action: 'Mener deux chantiers de front le même jour.',
          proof: 'Deux PR mergées la même journée.',
        },
        {
          from: 1,
          label: '3 chantiers et plus',
          action: 'Mener trois chantiers de front le même jour.',
          proof: 'Trois PR mergées la même journée.',
        },
      ],
    },
    {
      id: 'intervention',
      label: 'Reprise humaine',
      weight: 1,
      scale: [
        { from: 0, label: 'rien à reprendre' },
        { from: 0.5, label: 'après coup' },
        { from: 1, label: 'jamais' },
      ],
    },
    { id: 'sans-echelle', label: 'Sans échelle', weight: 1 },
    {
      id: 'sans-action',
      label: 'Sans action',
      weight: 1,
      scale: [
        { from: 0, label: 'rien' },
        { from: 0.5, label: 'partiel' },
      ],
    },
  ],
  levels: [
    {
      id: 'low',
      label: 'Low',
      order: 1,
      conditions: [{ dimension: 'parallele', max: 0 }],
      nextLevelHint: 'Monter.',
    },
  ],
}

const measuredDimension = (
  dimensionId: string,
  label: string,
  score: number,
): DimensionScore => ({
  dimensionId,
  label,
  score,
  band: undefined,
  measurement: 'measured',
  earned: score,
  possible: 1,
  contributions: [],
})

const unmeasuredDimension = (
  dimensionId: string,
  label: string,
): DimensionScore => ({
  dimensionId,
  label,
  score: 0,
  band: undefined,
  measurement: 'unmeasured',
  earned: 0,
  possible: 0,
  contributions: [],
})

const gap = (
  dimension: string,
  bound: { min?: number; max?: number },
  dimensionScore: DimensionScore | undefined,
  gapValue: number | undefined,
  violated: 'min' | 'max' | undefined = bound.min !== undefined
    ? 'min'
    : bound.max !== undefined
      ? 'max'
      : undefined,
): ConditionGap => ({
  condition: { dimension, ...bound },
  dimension: dimensionScore,
  gap: gapValue,
  violated,
})

describe('progression plan', () => {
  it('targets the lowest band at or above a min bound', () => {
    const blocking = [
      gap(
        'parallele',
        { min: 1 },
        measuredDimension('parallele', 'Chantiers menés en parallèle', 0.66),
        0.34,
      ),
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.target).toEqual({ label: '3 chantiers et plus', from: 1 })
  })

  it('targets the highest band at or below a max bound', () => {
    const blocking = [
      gap(
        'intervention',
        { max: 0.4 },
        measuredDimension('intervention', 'Reprise humaine', 0.6),
        0.2,
      ),
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.target).toEqual({ label: 'rien à reprendre', from: 0 })
  })

  it('targets the band sitting exactly on a min threshold', () => {
    const blocking = [
      gap(
        'parallele',
        { min: 0.66 },
        measuredDimension('parallele', 'Chantiers menés en parallèle', 0.33),
        0.33,
      ),
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.target).toEqual({ label: '2 chantiers', from: 0.66 })
  })

  it('renders the grid text verbatim on a band that carries an action', () => {
    const blocking = [
      gap(
        'parallele',
        { min: 1 },
        measuredDimension('parallele', 'Chantiers menés en parallèle', 0.66),
        0.34,
      ),
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.action).toBe('Mener trois chantiers de front le même jour.')
    expect(step.proof).toBe('Trois PR mergées la même journée.')
  })

  it('leaves an axis without a scale with no target, but still renders the step', () => {
    const blocking = [
      gap(
        'sans-echelle',
        { min: 1 },
        measuredDimension('sans-echelle', 'Sans échelle', 0),
        1,
      ),
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.target).toBeUndefined()
    expect(step.action).toBeUndefined()
    expect(step.proof).toBeUndefined()
    expect(step.dimensionId).toBe('sans-echelle')
    expect(step.observedBand).toBeUndefined()
  })

  it('names the currently reached band as observedBand, resolved by bandFor', () => {
    const blocking = [
      gap(
        'parallele',
        { min: 1 },
        measuredDimension('parallele', 'Chantiers menés en parallèle', 0.66),
        0.34,
      ),
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.observedBand).toBe('2 chantiers')
  })

  it('picks the direction from the bound that actually gave way, not merely from having a min', () => {
    // Une condition à deux bornes : seul `max` a cédé (score 0.6 > 0.4), même
    // si `min` (0.1) est aussi déclaré. La cible doit descendre, pas monter.
    const blocking = [
      gap(
        'intervention',
        { min: 0.1, max: 0.4 },
        measuredDimension('intervention', 'Reprise humaine', 0.6),
        0.2,
        'max',
      ),
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.target).toEqual({ label: 'rien à reprendre', from: 0 })
    expect(step.required).toBe(0.4)
  })

  it('invents no text on a band without an action: both stay absent', () => {
    const blocking = [
      gap(
        'sans-action',
        { min: 0.5 },
        measuredDimension('sans-action', 'Sans action', 0),
        0.5,
      ),
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.target).toEqual({ label: 'partiel', from: 0.5 })
    expect(step.action).toBeUndefined()
    expect(step.proof).toBeUndefined()
  })

  it('changes the rendered action when only the grid object changes, the code untouched', () => {
    const blocking = [
      gap(
        'parallele',
        { min: 1 },
        measuredDimension('parallele', 'Chantiers menés en parallèle', 0.66),
        0.34,
      ),
    ]

    const editedGrid: Grid = {
      ...grid,
      dimensions: grid.dimensions.map((dimension) =>
        dimension.id !== 'parallele'
          ? dimension
          : {
              ...dimension,
              scale: dimension.scale?.map((band) =>
                band.from !== 1
                  ? band
                  : {
                      ...band,
                      action: 'Un tout autre geste, posé dans le JSON.',
                    },
              ),
            },
      ),
    }

    const [before] = planProgression(grid, blocking)
    const [after] = planProgression(editedGrid, blocking)

    expect(before.action).toBe('Mener trois chantiers de front le même jour.')
    expect(after.action).toBe('Un tout autre geste, posé dans le JSON.')
  })

  it('renders an empty plan once the profile sits at the top of the referential', () => {
    expect(planProgression(grid, [])).toEqual([])
  })

  it('keeps the order of blocking gaps, the capping axis first', () => {
    const blocking = [
      gap(
        'parallele',
        { min: 1 },
        measuredDimension('parallele', 'Chantiers menés en parallèle', 0.66),
        0.34,
      ),
      gap(
        'intervention',
        { min: 1 },
        measuredDimension('intervention', 'Reprise humaine', 0.5),
        0.5,
      ),
    ]

    const steps = planProgression(grid, blocking)

    expect(steps.map((step) => step.dimensionId)).toEqual([
      'parallele',
      'intervention',
    ])
  })

  it('offers no target when an unmeasured axis only guesses the starting band of the scale', () => {
    // F2, résidu R-C : `gap.violated` n'est absent que pour un axe non
    // mesuré ; la direction devinée pour une borne `max` à 0 retombe sur
    // la bande de départ de l'échelle (`from: 0`), qui ne porte jamais de
    // geste. L'afficher comme cible reproduirait la pathologie de DB-2 —
    // « la condition demande aucune feature livrée avec l'IA » — sur un axe
    // dont on ne sait même pas la valeur. Construit à la main plutôt que
    // via `gap(...)` : le paramètre par défaut de ce helper recalcule
    // `violated` dès qu'`undefined` lui est passé explicitement — c'est
    // exactement la sémantique JS des paramètres par défaut — donc il ne
    // peut pas exprimer le cas qu'`evaluateCondition` produit pour un axe
    // non mesuré.
    const blocking: ConditionGap[] = [
      {
        condition: { dimension: 'parallele', max: 0 },
        dimension: unmeasuredDimension(
          'parallele',
          'Chantiers menés en parallèle',
        ),
        gap: undefined,
        violated: undefined,
      },
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.target).toBeUndefined()
    expect(step.action).toBeUndefined()
    expect(step.proof).toBeUndefined()
  })

  it('still guesses a positive band for an unmeasured axis on a min bound', () => {
    // Le même axe non mesuré, mais une borne `min` : la supposition reste
    // rendue tant qu'elle ne retombe pas sur la bande de départ — c'est
    // seulement `from: 0` qui n'est jamais un cran à viser.
    const blocking: ConditionGap[] = [
      {
        condition: { dimension: 'parallele', min: 1 },
        dimension: unmeasuredDimension(
          'parallele',
          'Chantiers menés en parallèle',
        ),
        gap: undefined,
        violated: undefined,
      },
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.target).toEqual({ label: '3 chantiers et plus', from: 1 })
  })

  it('renders a blocking unmeasured axis: measurement told, action present regardless', () => {
    const blocking = [
      gap(
        'parallele',
        { min: 1 },
        unmeasuredDimension('parallele', 'Chantiers menés en parallèle'),
        undefined,
      ),
    ]

    const [step] = planProgression(grid, blocking)

    expect(step.measurement).toBe('unmeasured')
    expect(step.observed).toBeUndefined()
    expect(step.observedBand).toBeUndefined()
    expect(step.action).toBe('Mener trois chantiers de front le même jour.')
  })

  it('resolves the same plan on two runs of the same input', () => {
    const blocking = [
      gap(
        'parallele',
        { min: 1 },
        measuredDimension('parallele', 'Chantiers menés en parallèle', 0.66),
        0.34,
      ),
    ]

    expect(planProgression(grid, blocking)).toEqual(
      planProgression(grid, blocking),
    )
  })
})
