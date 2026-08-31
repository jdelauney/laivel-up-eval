import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Level } from '@/core/contracts/grid.schema'
import type { LevelVerdict } from '@/core/scoring/helpers/level-resolver.helper'
import type { PlanStep } from '@/core/scoring/helpers/progression-plan.helper'
import { LevelBlock } from '@/features/scoring-summary/components/composites/level-block'

const level = (id: string, label: string, order: number): Level => ({
  id,
  label,
  order,
  conditions: [{ dimension: 'taille', min: 0.5 }],
  nextLevelHint: `Passer à ce qui suit ${label}.`,
})

const step = (overrides: Partial<PlanStep> = {}): PlanStep => ({
  dimensionId: 'taille',
  label: 'taille',
  measurement: 'measured',
  target: { label: 'M — complexité moyenne', from: 0.5 },
  action: undefined,
  proof: undefined,
  observed: 0.25,
  required: 0.75,
  observedBand: 'S — peu de complexité',
  ...overrides,
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

const unrankedVerdict = (): LevelVerdict => ({
  level: undefined,
  unranked: [],
  satisfiedConditions: [],
  blocking: [],
  capping: undefined,
  hint: undefined,
  nextLevel: level('white', '❖ White', 1),
})

const unrankedReasonFixture = (): PlanStep[] => [
  step(),
  step({
    dimensionId: 'initiative',
    label: 'initiative',
    measurement: 'unmeasured',
    observed: undefined,
    observedBand: undefined,
    target: undefined,
  }),
]

describe('level block', () => {
  it('names the official label of a reached level, as the level-2 heading', () => {
    render(<LevelBlock level={reachedVerdict()} unrankedReason={undefined} />)

    expect(
      screen.getByRole('heading', { level: 2, name: '🔹 Blue' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Niveau suivant · 🟢 Green')).toBeInTheDocument()
  })

  it('never announces White by default when no level is reached', () => {
    render(
      <LevelBlock
        level={unrankedVerdict()}
        unrankedReason={unrankedReasonFixture()}
      />,
    )

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Aucun niveau ne peut être annoncé',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('❖ White')).not.toBeInTheDocument()
  })

  it('explains the unranked state with each axis in cause', () => {
    render(
      <LevelBlock
        level={unrankedVerdict()}
        unrankedReason={unrankedReasonFixture()}
      />,
    )

    expect(screen.getByText(/taille/)).toBeInTheDocument()
    expect(screen.getByText(/non mesuré/)).toBeInTheDocument()
  })

  it('names the current rung and the targeted rung, both in the words of the grid', () => {
    render(
      <LevelBlock
        level={unrankedVerdict()}
        unrankedReason={unrankedReasonFixture()}
      />,
    )

    expect(
      screen.getByText(
        'taille — actuellement « S — peu de complexité », la condition demande « M — complexité moyenne »',
      ),
    ).toBeInTheDocument()
  })

  it('renders no reason when no reason is passed', () => {
    render(<LevelBlock level={unrankedVerdict()} unrankedReason={undefined} />)

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Aucun niveau ne peut être annoncé',
      }),
    ).toBeInTheDocument()
  })
})
