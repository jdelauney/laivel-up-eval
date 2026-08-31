import { describe, expect, it } from 'vitest'
import {
  parseKeepOrTossTrace,
  UnknownItemError,
} from '@/games/keep-or-toss/schema/answer.schema'
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

describe('keep-or-toss answer schema', () => {
  it('accepts an unfinished sort: a trace that covers only some of the lot', () => {
    const trace = parseKeepOrTossTrace(
      { verdicts: [{ itemId: 'p1', kept: true }], elapsedSeconds: 3 },
      config,
    )

    expect(trace.verdicts).toHaveLength(1)
  })

  it('accepts an empty trace: sorting nothing is a valid, if empty, run', () => {
    const trace = parseKeepOrTossTrace(
      { verdicts: [], elapsedSeconds: 0 },
      config,
    )

    expect(trace.verdicts).toEqual([])
  })

  it('accepts a fully covered trace', () => {
    const trace = parseKeepOrTossTrace(
      {
        verdicts: config.items.map((entry) => ({
          itemId: entry.id,
          kept: entry.keep,
        })),
        elapsedSeconds: 10,
      },
      config,
    )

    expect(trace.verdicts).toHaveLength(8)
  })

  it('rejects a verdict aimed at an item unknown to the configuration', () => {
    expect(() =>
      parseKeepOrTossTrace(
        {
          verdicts: [{ itemId: 'introuvable', kept: true }],
          elapsedSeconds: 1,
        },
        config,
      ),
    ).toThrow(UnknownItemError)
  })

  it('rejects a trace that gives the same item two verdicts', () => {
    const result = () =>
      parseKeepOrTossTrace(
        {
          verdicts: [
            { itemId: 'p1', kept: true },
            { itemId: 'p1', kept: false },
          ],
          elapsedSeconds: 1,
        },
        config,
      )

    expect(result).toThrow()
  })

  it('rejects a negative duration', () => {
    const result = () =>
      parseKeepOrTossTrace({ verdicts: [], elapsedSeconds: -1 }, config)

    expect(result).toThrow()
  })
})
