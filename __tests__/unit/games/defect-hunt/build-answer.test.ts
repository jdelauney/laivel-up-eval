import { describe, expect, it } from 'vitest'
import { buildDefectHuntAnswer } from '@/games/defect-hunt/actions/build-defect-hunt-answer.action'
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

describe('build defect hunt answer', () => {
  it('sorts the marked lines ascending, regardless of the click order', () => {
    const inOrder = buildDefectHuntAnswer(config, [2, 4, 6], 90)
    const outOfOrder = buildDefectHuntAnswer(config, [6, 2, 4], 90)

    expect(inOrder.markedLines).toEqual([2, 4, 6])
    expect(outOfOrder.markedLines).toEqual(inOrder.markedLines)
  })

  it('accepts a review without any mark', () => {
    const answer = buildDefectHuntAnswer(config, [], 12)

    expect(answer.markedLines).toEqual([])
  })

  it('carries the elapsed seconds untouched', () => {
    const answer = buildDefectHuntAnswer(config, [2], 42)

    expect(answer.elapsedSeconds).toBe(42)
  })

  it('does not deduplicate: a forged trace with a repeated line is refused, not silently cleaned', () => {
    expect(() => buildDefectHuntAnswer(config, [2, 2], 10)).toThrow()
  })
})
