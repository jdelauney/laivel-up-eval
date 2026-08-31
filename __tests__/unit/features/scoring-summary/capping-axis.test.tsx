import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PlanStep } from '@/core/scoring/helpers/progression-plan.helper'
import { CappingAxis } from '@/features/scoring-summary/components/composites/capping-axis'

const step = (overrides: Partial<PlanStep> = {}): PlanStep => ({
  dimensionId: 'harness',
  label: 'Harness monté autour du modèle',
  measurement: 'measured',
  target: { label: 'context engineering', from: 0.5 },
  action: undefined,
  proof: undefined,
  observed: 0.25,
  required: 0.5,
  observedBand: 'prompts',
  ...overrides,
})

describe('capping axis', () => {
  it('names the axis, the current rung and the targeted rung, both in the words of the grid', () => {
    render(<CappingAxis capping={step()} />)

    expect(
      screen.getByText(
        'Harness monté autour du modèle — actuellement « prompts », la condition demande « context engineering »',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/0\.\d/)).not.toBeInTheDocument()
    expect(screen.queryByText(/cran plus (haut|bas)/)).not.toBeInTheDocument()
  })

  it('says the top of the referential is reached when nothing caps anymore', () => {
    render(<CappingAxis capping={undefined} />)

    expect(
      screen.getByText(
        'Le sommet du référentiel est atteint : aucun axe ne plafonne plus.',
      ),
    ).toBeInTheDocument()
  })

  it('tells an unmeasured capping axis apart, without borrowing the wording of a low rung', () => {
    render(
      <CappingAxis
        capping={step({
          measurement: 'unmeasured',
          observed: undefined,
          observedBand: undefined,
        })}
      />,
    )

    expect(
      screen.getByText(
        'Harness monté autour du modèle — non mesuré, aucune condition ne peut tenir',
      ),
    ).toBeInTheDocument()
  })
})
