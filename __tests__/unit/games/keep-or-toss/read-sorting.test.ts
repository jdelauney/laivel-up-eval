import { describe, expect, it } from 'vitest'
import { readSorting } from '@/games/keep-or-toss/helpers/read-sorting.helper'
import { keepOrTossConfigSchema } from '@/games/keep-or-toss/schema/config.schema'

const item = (id: string, keep: boolean) => ({
  id,
  label: `Libellé de ${id}.`,
  keep,
  reason: `Pourquoi ${id}.`,
})

const config = keepOrTossConfigSchema.parse({
  statement: 'Consigne de test.',
  durationSeconds: 10,
  items: [
    item('p1', true),
    item('p2', false),
    item('p3', true),
    item('p4', false),
    item('p5', true),
    item('p6', false),
    item('p7', true),
    item('p8', false),
  ],
})

describe('read sorting', () => {
  it('counts an unsorted item as missed: the denominator is the total, never the sorted count', () => {
    // Trois items triés, tous justes ; cinq restent non triés.
    const reading = readSorting(config, {
      verdicts: [
        { itemId: 'p1', kept: true },
        { itemId: 'p2', kept: false },
        { itemId: 'p3', kept: true },
      ],
      elapsedSeconds: 4,
    })

    expect(reading.total).toBe(8)
    expect(reading.sortedCount).toBe(3)
    expect(reading.correctCount).toBe(3)
    expect(reading.unsortedCount).toBe(5)
    // 3/8, jamais 3/3 : l'abandon précoce ne rend pas 100 %.
    expect(reading.correctShare).toBeCloseTo(3 / 8, 10)
  })

  it('counts a wrong verdict as incorrect, distinct from an unsorted item', () => {
    const reading = readSorting(config, {
      verdicts: [
        { itemId: 'p1', kept: false }, // faux : p1 est à garder
        { itemId: 'p2', kept: false }, // juste
      ],
      elapsedSeconds: 2,
    })

    expect(reading.correctCount).toBe(1)
    expect(reading.correctShare).toBeCloseTo(1 / 8, 10)
  })

  it('is completed in time only when the whole lot is sorted, within the budget', () => {
    const fullTrace = config.items.map((entry) => ({
      itemId: entry.id,
      kept: entry.keep,
    }))

    expect(
      readSorting(config, { verdicts: fullTrace, elapsedSeconds: 10 })
        .completedInTime,
    ).toBe(true)

    expect(
      readSorting(config, { verdicts: fullTrace, elapsedSeconds: 10.01 })
        .completedInTime,
    ).toBe(false)

    expect(
      readSorting(config, {
        verdicts: fullTrace.slice(0, 7),
        elapsedSeconds: 1,
      }).completedInTime,
    ).toBe(false)
  })

  it('is never completed in time when nothing is sorted, even well within budget', () => {
    const reading = readSorting(config, { verdicts: [], elapsedSeconds: 0 })

    expect(reading.completedInTime).toBe(false)
  })
})
