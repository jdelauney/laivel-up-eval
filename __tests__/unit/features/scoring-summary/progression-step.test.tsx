import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PlanStep } from '@/core/scoring/helpers/progression-plan.helper'
import { ProgressionStep } from '@/features/scoring-summary/components/composites/progression-step'

const step = (overrides: Partial<PlanStep> = {}): PlanStep => ({
  dimensionId: 'parallele',
  label: 'Chantiers menés en parallèle',
  measurement: 'measured',
  target: { label: '3 chantiers et plus', from: 1 },
  action: "Mener trois chantiers de front le même jour, chacun jusqu'au merge.",
  proof:
    'Trois PR mergées dans la même journée, sur trois branches ouvertes en même temps.',
  observed: 0.66,
  required: 1,
  ...overrides,
})

describe('progression step', () => {
  it('reads the axis and the targeted rung in the words of the grid', () => {
    render(<ProgressionStep step={step()} />)

    expect(
      screen.getByText('Chantiers menés en parallèle → 3 chantiers et plus'),
    ).toBeInTheDocument()
  })

  it('reads the action in full', () => {
    render(<ProgressionStep step={step()} />)

    expect(
      screen.getByText(
        "Mener trois chantiers de front le même jour, chacun jusqu'au merge.",
      ),
    ).toBeInTheDocument()
  })

  it('reads the proof introduced as such', () => {
    render(<ProgressionStep step={step()} />)

    expect(
      screen.getByText(
        'Preuve : Trois PR mergées dans la même journée, sur trois branches ouvertes en même temps.',
      ),
    ).toBeInTheDocument()
  })

  it('says the grid carries no action for a band without one', () => {
    render(
      <ProgressionStep step={step({ action: undefined, proof: undefined })} />,
    )

    expect(
      screen.getByText("La grille ne porte pas d'action pour ce cran."),
    ).toBeInTheDocument()
  })

  it('tells an unmeasured axis apart while still rendering the same action', () => {
    render(
      <ProgressionStep
        step={step({ measurement: 'unmeasured', observed: undefined })}
      />,
    )

    expect(screen.getByText("Cet axe n'a pas été mesuré.")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Mener trois chantiers de front le même jour, chacun jusqu'au merge.",
      ),
    ).toBeInTheDocument()
  })

  it('renders the axis alone when the condition targets no band', () => {
    render(<ProgressionStep step={step({ target: undefined })} />)

    expect(screen.getByText('Chantiers menés en parallèle')).toBeInTheDocument()
  })
})
