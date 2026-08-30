import { describe, expect, it } from 'vitest'
import {
  DuplicateMarkedLineError,
  MarkedLineOutOfSnippetError,
  parseDefectHuntTrace,
} from '@/games/defect-hunt/schema/answer.schema'
import {
  type DefectHuntConfig,
  defectHuntConfigSchema,
} from '@/games/defect-hunt/schema/config.schema'

type Kind = 'security' | 'logic' | 'hallucinated-dependency'

const CODE = Array.from(
  { length: 10 },
  (_, index) => `const line${index + 1} = ${index + 1}`,
).join('\n')

const defect = (id: string, line: number, kind: Kind) => ({
  id,
  line,
  kind,
  reveal: `révélation ${id}`,
})

const config: DefectHuntConfig = defectHuntConfigSchema.parse({
  statement: 'Consigne de test.',
  snippet: { label: 'Extrait', language: 'ts', code: CODE },
  timeLimitSeconds: 180,
  defects: [
    defect('d1', 2, 'security'),
    defect('d2', 4, 'logic'),
    defect('d3', 6, 'hallucinated-dependency'),
  ],
})

describe('defect-hunt answer schema', () => {
  it('accepts a review marking some of the faulty lines', () => {
    const trace = parseDefectHuntTrace(
      { markedLines: [2, 4], elapsedSeconds: 42 },
      config,
    )

    expect(trace.markedLines).toEqual([2, 4])
  })

  it('accepts a review without any mark', () => {
    const trace = parseDefectHuntTrace(
      { markedLines: [], elapsedSeconds: 12 },
      config,
    )

    expect(trace.markedLines).toEqual([])
  })

  it('rejects a mark aiming at a line absent from the snippet, naming the line, not counting it as a false positive', () => {
    const call = () =>
      parseDefectHuntTrace({ markedLines: [99], elapsedSeconds: 5 }, config)

    expect(call).toThrow(MarkedLineOutOfSnippetError)
    expect(call).toThrow('99')
  })

  it('rejects a line marked twice, naming the line', () => {
    const call = () =>
      parseDefectHuntTrace({ markedLines: [2, 2], elapsedSeconds: 5 }, config)

    expect(call).toThrow(DuplicateMarkedLineError)
    expect(call).toThrow('2')
  })
})
