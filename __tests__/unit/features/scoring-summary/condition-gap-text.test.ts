import { describe, expect, it } from 'vitest'
import type { PlanStep } from '@/core/scoring/helpers/progression-plan.helper'
import { describePlanStep } from '@/features/scoring-summary/helpers/condition-gap-text.helper'

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

describe('describePlanStep', () => {
  it('names the current rung and the targeted rung, both in the words of the grid', () => {
    expect(describePlanStep(step())).toBe(
      'Harness monté autour du modèle — actuellement « prompts », la condition demande « context engineering »',
    )
  })

  it('names an inferred axis exactly like a measured one', () => {
    expect(describePlanStep(step({ measurement: 'inferred' }))).toBe(
      'Harness monté autour du modèle — actuellement « prompts », la condition demande « context engineering »',
    )
  })

  it('says an unmeasured axis in words, never borrowing the wording of a low rung', () => {
    const unmeasured = describePlanStep(
      step({
        measurement: 'unmeasured',
        observed: undefined,
        observedBand: undefined,
      }),
    )

    expect(unmeasured).toBe(
      'Harness monté autour du modèle — non mesuré, aucune condition ne peut tenir',
    )
    expect(unmeasured).not.toMatch(/cran plus (haut|bas)/)
  })

  it('names the axis alone when the condition targets no band on an axis without a scale', () => {
    const noTarget = describePlanStep(step({ target: undefined }))

    expect(noTarget).toBe(
      "Harness monté autour du modèle — actuellement « prompts », la condition ne vise aucun cran de l'échelle",
    )
  })

  it('falls back to an explicit words when the current band itself is unknown', () => {
    expect(describePlanStep(step({ observedBand: undefined }))).toBe(
      'Harness monté autour du modèle — actuellement « sans cran défini », la condition demande « context engineering »',
    )
  })

  it('never renders a raw number', () => {
    expect(describePlanStep(step())).not.toMatch(/\d/)
  })
})
