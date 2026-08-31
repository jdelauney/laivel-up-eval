import { describe, expect, it } from 'vitest'
import {
  IncompleteOrderError,
  parseFlowOrderTrace,
  UnknownStepError,
} from '@/games/flow-order/schema/answer.schema'
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

describe('flow-order answer schema', () => {
  it('accepts a trace covering every step exactly once, in any order', () => {
    const trace = parseFlowOrderTrace(
      { orderedIds: ['s6', 's5', 's4', 's3', 's2', 's1'] },
      config,
    )

    expect(trace.orderedIds).toEqual(['s6', 's5', 's4', 's3', 's2', 's1'])
  })

  it('rejects a trace repeating a step, naming it', () => {
    const call = () =>
      parseFlowOrderTrace(
        { orderedIds: ['s1', 's2', 's3', 's4', 's5', 's1'] },
        config,
      )

    expect(call).toThrow()
  })

  it('rejects a trace aiming at a step absent from the configuration, naming it with UnknownStepError', () => {
    const call = () =>
      parseFlowOrderTrace(
        { orderedIds: ['s1', 's2', 's3', 's4', 's5', 'introuvable'] },
        config,
      )

    expect(call).toThrow(UnknownStepError)
    expect(call).toThrow('introuvable')
  })

  it('rejects a trace missing a declared step, naming it with IncompleteOrderError', () => {
    const call = () =>
      parseFlowOrderTrace(
        { orderedIds: ['s1', 's2', 's3', 's4', 's5'] },
        config,
      )

    expect(call).toThrow(IncompleteOrderError)
    expect(call).toThrow('s6')
  })

  it('rejects an empty trace, incomplete by construction', () => {
    const call = () => parseFlowOrderTrace({ orderedIds: [] }, config)

    expect(call).toThrow(IncompleteOrderError)
  })
})
