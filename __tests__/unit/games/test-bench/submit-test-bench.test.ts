import { describe, expect, it } from 'vitest'
import { buildTestBenchAnswer } from '../../../../src/games/test-bench/actions/submit-test-bench.action'

const propositionIds = ['p1', 'p2', 'p3', 'p4']

describe('test bench answer building', () => {
  it('keeps the selected propositions', () => {
    const answer = buildTestBenchAnswer(new Set(['p1', 'p3']), propositionIds)

    expect(answer.selected).toEqual(['p1', 'p3'])
  })

  it('follows the configuration order, whatever the click order', () => {
    const answer = buildTestBenchAnswer(new Set(['p4', 'p1']), propositionIds)

    expect(answer.selected).toEqual(['p1', 'p4'])
  })

  it('produces an empty selection rather than a missing field', () => {
    expect(buildTestBenchAnswer(new Set(), propositionIds).selected).toEqual([])
  })

  it('drops an id the configuration does not declare', () => {
    const answer = buildTestBenchAnswer(
      new Set(['p1', 'ghost']),
      propositionIds,
    )

    expect(answer.selected).toEqual(['p1'])
  })

  it('produces the same answer twice for the same selection', () => {
    const selected = new Set(['p2', 'p3'])

    expect(buildTestBenchAnswer(selected, propositionIds)).toEqual(
      buildTestBenchAnswer(selected, propositionIds),
    )
  })
})
