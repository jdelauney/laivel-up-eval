import { describe, expect, it } from 'vitest'
import {
  IncompleteTraceError,
  parseConfidenceBetTrace,
  StakeOutOfScaleError,
  UnknownSnippetError,
} from '@/games/confidence-bet/schema/answer.schema'
import {
  type ConfidenceBetConfig,
  confidenceBetConfigSchema,
} from '@/games/confidence-bet/schema/config.schema'

const snippet = (id: string, nature: 'sound' | 'flawed' | 'undecidable') => ({
  id,
  label: id,
  language: 'ts',
  code: `const ${id} = 1`,
  nature,
  reveal: `révélation ${id}`,
})

const config: ConfidenceBetConfig = confidenceBetConfigSchema.parse({
  statement: 'Consigne de test.',
  stakes: [10, 30, 50, 70, 90],
  neutralStake: 50,
  startingCapital: 100,
  snippets: [
    snippet('s1', 'sound'),
    snippet('f1', 'flawed'),
    snippet('u1', 'undecidable'),
  ],
})

const completeTrace = () => ({
  bets: [
    { snippetId: 's1', stake: 90 },
    { snippetId: 'f1', stake: 10 },
    { snippetId: 'u1', stake: 50 },
  ],
  finalCapital: 180,
})

describe('confidence-bet answer schema', () => {
  it('accepts a trace covering every declared snippet', () => {
    expect(parseConfidenceBetTrace(completeTrace(), config).bets).toHaveLength(
      3,
    )
  })

  it('accepts a trace whose bets are not in declared order', () => {
    const trace = completeTrace()
    trace.bets.reverse()

    expect(() => parseConfidenceBetTrace(trace, config)).not.toThrow()
  })

  it('rejects a trace missing a snippet, naming the missing snippet', () => {
    const trace = completeTrace()
    trace.bets.splice(1, 1)

    expect(() => parseConfidenceBetTrace(trace, config)).toThrow(
      IncompleteTraceError,
    )
    expect(() => parseConfidenceBetTrace(trace, config)).toThrow('f1')
  })

  it('rejects a bet aiming at a snippet the config does not declare, naming the identifier', () => {
    const trace = completeTrace()
    trace.bets.push({ snippetId: 'ghost', stake: 90 })

    const call = () => parseConfidenceBetTrace(trace, config)
    expect(call).toThrow(UnknownSnippetError)
    expect(call).toThrow('ghost')
  })

  it('rejects a bet stake absent from the declared scale, naming the faulty snippet', () => {
    const trace = completeTrace()
    trace.bets[0] = { snippetId: 's1', stake: 42 }

    const call = () => parseConfidenceBetTrace(trace, config)
    expect(call).toThrow(StakeOutOfScaleError)
    expect(call).toThrow('s1')
  })
})
