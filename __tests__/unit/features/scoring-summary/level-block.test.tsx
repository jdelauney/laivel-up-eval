import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Level, LevelCondition } from '@/core/contracts/grid.schema'
import type { DimensionScore } from '@/core/ports/scoring-strategy.interface'
import type {
  ConditionGap,
  LevelVerdict,
} from '@/core/scoring/helpers/level-resolver.helper'
import { LevelBlock } from '@/features/scoring-summary/components/composites/level-block'

const level = (id: string, label: string, order: number): Level => ({
  id,
  label,
  order,
  conditions: [{ dimension: 'taille', min: 0.5 }],
  nextLevelHint: `Passer à ce qui suit ${label}.`,
})

const dimension = (dimensionId: string, band: string): DimensionScore => ({
  dimensionId,
  label: dimensionId,
  score: 0.5,
  band,
  measurement: 'measured',
  earned: 1,
  possible: 2,
  contributions: [],
})

const condition = (dimensionId: string): LevelCondition => ({
  dimension: dimensionId,
  min: 0.75,
})

const reachedVerdict = (): LevelVerdict => ({
  level: level('blue', '🔹 Blue', 3),
  unranked: undefined,
  satisfiedConditions: [],
  blocking: [],
  capping: undefined,
  hint: 'Automatiser la relance.',
  nextLevel: level('green', '🟢 Green', 4),
})

const unrankedVerdict = (): LevelVerdict => {
  const gaps: ConditionGap[] = [
    {
      condition: condition('taille'),
      dimension: dimension('taille', 'S — peu de complexité'),
      gap: 0.25,
    },
    {
      condition: condition('initiative'),
      dimension: undefined,
      gap: undefined,
    },
  ]

  return {
    level: undefined,
    unranked: gaps,
    satisfiedConditions: [],
    blocking: gaps,
    capping: gaps[0],
    hint: undefined,
    nextLevel: level('white', '❖ White', 1),
  }
}

describe('level block', () => {
  it('names the official label of a reached level, as the level-2 heading', () => {
    render(<LevelBlock level={reachedVerdict()} />)

    expect(
      screen.getByRole('heading', { level: 2, name: '🔹 Blue' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Niveau suivant · 🟢 Green')).toBeInTheDocument()
  })

  it('never announces White by default when no level is reached', () => {
    render(<LevelBlock level={unrankedVerdict()} />)

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Aucun niveau ne peut être annoncé',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('❖ White')).not.toBeInTheDocument()
  })

  it('explains the unranked state with each axis in cause', () => {
    render(<LevelBlock level={unrankedVerdict()} />)

    expect(screen.getByText(/taille/)).toBeInTheDocument()
    expect(screen.getByText(/non mesuré/)).toBeInTheDocument()
  })
})
