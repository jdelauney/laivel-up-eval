import { describe, expect, it } from 'vitest'
import { readOrder } from '@/games/flow-order/helpers/read-order.helper'
import {
  type FlowOrderConfig,
  flowOrderConfigSchema,
} from '@/games/flow-order/schema/config.schema'

const step = (id: string, rank: number) => ({
  id,
  label: `Libellé de ${id}.`,
  rank,
  note: `Ce qu'apporte ${id}.`,
})

/** Six étapes, rangs 1..6, dans cet ordre. */
const config: FlowOrderConfig = flowOrderConfigSchema.parse({
  statement: 'Consigne de test.',
  steps: [
    step('s1', 1),
    step('s2', 2),
    step('s3', 3),
    step('s4', 4),
    step('s5', 5),
    step('s6', 6),
  ],
  initialOrder: ['s3', 's1', 's6', 's2', 's5', 's4'],
})

describe('read order', () => {
  it('reads the exact order as exact, zero displacement everywhere', () => {
    const reading = readOrder(config, {
      orderedIds: ['s1', 's2', 's3', 's4', 's5', 's6'],
    })

    expect(reading.exact).toBe(true)
    expect(reading.maxDisplacement).toBe(0)
    expect(reading.displacedCount).toBe(0)
  })

  it('reads a swap of two neighbouring steps as a single-position displacement, not exact', () => {
    const reading = readOrder(config, {
      orderedIds: ['s2', 's1', 's3', 's4', 's5', 's6'],
    })

    expect(reading.exact).toBe(false)
    expect(reading.maxDisplacement).toBe(1)
    expect(reading.displacedCount).toBe(2)
  })

  it('never lets a displacement between two neighbours read as an end-to-end displacement', () => {
    // Six étapes, une seule paire de voisines inversée en plein milieu : la
    // lecture doit rester locale, jamais gonflée par la longueur de la
    // frise entière.
    const reading = readOrder(config, {
      orderedIds: ['s1', 's2', 's4', 's3', 's5', 's6'],
    })

    expect(reading.maxDisplacement).toBe(1)
  })

  it('reads the end-to-end reversal with the largest possible displacement', () => {
    const reading = readOrder(config, {
      orderedIds: ['s6', 's5', 's4', 's3', 's2', 's1'],
    })

    expect(reading.exact).toBe(false)
    expect(reading.maxDisplacement).toBe(5)
    expect(reading.displacedCount).toBe(6)
  })

  it('reads maxDisplacement as the largest single-step displacement, not a sum or an average', () => {
    // s6 saute en tête (déplacement de 5), tout le reste glisse d'un cran :
    // la somme des écarts vaudrait bien plus que 5, la moyenne bien moins.
    const reading = readOrder(config, {
      orderedIds: ['s6', 's1', 's2', 's3', 's4', 's5'],
    })

    expect(reading.maxDisplacement).toBe(5)
  })
})
