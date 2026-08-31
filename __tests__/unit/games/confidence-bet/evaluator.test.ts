import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import { ConfidenceBetEvaluator } from '@/games/confidence-bet/confidence-bet.evaluator'
import { replayBets } from '@/games/confidence-bet/helpers/run-simulation.helper'
import type {
  Bet,
  ConfidenceBetAnswer,
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

/** Le barème du parcours : deux extraits par nature, sur l'échelle du plan. */
const config: ConfidenceBetConfig = confidenceBetConfigSchema.parse({
  statement: 'Consigne de test.',
  stakes: [10, 30, 50, 70, 90],
  neutralStake: 50,
  startingCapital: 100,
  snippets: [
    snippet('s1', 'sound'),
    snippet('s2', 'sound'),
    snippet('f1', 'flawed'),
    snippet('f2', 'flawed'),
    snippet('u1', 'undecidable'),
    snippet('u2', 'undecidable'),
  ],
})

const criteria: Criterion[] = [
  {
    id: 'c1',
    question: 'La mise moyenne sur les défectueux est-elle sous 50 ?',
    rule: { type: 'mean-stake-on-flawed-below', threshold: 50 },
    mapping: [{ dimension: 'verification', weight: 2, evidence: 'measured' }],
  },
  {
    id: 'c2',
    question: 'La mise moyenne sur les sains est-elle au-dessus de 70 ?',
    rule: { type: 'mean-stake-on-sound-above', threshold: 70 },
    mapping: [{ dimension: 'verification', weight: 2, evidence: 'measured' }],
  },
  {
    id: 'c3',
    question: 'La calibration atteint-elle 0.5 ?',
    rule: { type: 'calibration-at-least', threshold: 0.5 },
    mapping: [{ dimension: 'verification', weight: 2, evidence: 'measured' }],
  },
  {
    id: 'c4',
    question: 'Chaque mise sur un indécidable est-elle dans la bande ?',
    rule: { type: 'stake-within-band-on-undecidable', from: 40, to: 60 },
    mapping: [{ dimension: 'verification', weight: 1, evidence: 'measured' }],
  },
]

const bet = (snippetId: string, stake: number): Bet => ({ snippetId, stake })

/** Calibrée, tranchée des deux côtés, retenue sur les indécidables. */
const CALIBRATED: Bet[] = [
  bet('s1', 90),
  bet('s2', 90),
  bet('f1', 10),
  bet('f2', 10),
  bet('u1', 50),
  bet('u2', 50),
]

/** Mise haute partout : lit le code, mais ne sait pas dire qu'il ne sait pas. */
const ALL_HIGH: Bet[] = [
  bet('s1', 90),
  bet('s2', 90),
  bet('f1', 90),
  bet('f2', 90),
  bet('u1', 90),
  bet('u2', 90),
]

/** Se retranche sur la mise neutre partout : ne se trompe jamais, ne s'engage jamais. */
const ALL_NEUTRAL: Bet[] = [
  bet('s1', 50),
  bet('s2', 50),
  bet('f1', 50),
  bet('f2', 50),
  bet('u1', 50),
  bet('u2', 50),
]

/** Juste sur les tranchables, extrême sur les indécidables. */
const SHARP_BUT_OVERCONFIDENT_ON_UNDECIDABLE: Bet[] = [
  bet('s1', 90),
  bet('s2', 90),
  bet('f1', 10),
  bet('f2', 10),
  bet('u1', 90),
  bet('u2', 90),
]

const traceOf = (
  bets: readonly Bet[],
  from: ConfidenceBetConfig = config,
): ConfidenceBetAnswer => ({
  bets: [...bets],
  finalCapital: replayBets(from, bets).capital,
})

const evaluator = new ConfidenceBetEvaluator()

const verdictOf = (
  bets: readonly Bet[],
  rules: readonly Criterion[] = criteria,
  from: ConfidenceBetConfig = config,
): boolean[] =>
  evaluator
    .evaluate(traceOf(bets, from), from, rules)
    .map((result) => result.satisfied)

describe('confidence-bet evaluator', () => {
  it('satisfies the four criteria on a calibrated party', () => {
    expect(verdictOf(CALIBRATED)).toEqual([true, true, true, true])
  })

  it('returns one result per criterion, in the order the course declares them', () => {
    const results = evaluator.evaluate(traceOf(CALIBRATED), config, criteria)

    expect(results.map((result) => result.criterionId)).toEqual([
      'c1',
      'c2',
      'c3',
      'c4',
    ])
  })

  it('misses the flawed criterion exactly on its threshold', () => {
    const onThreshold: Bet[] = [
      bet('s1', 90),
      bet('s2', 90),
      bet('f1', 50),
      bet('f2', 50),
      bet('u1', 50),
      bet('u2', 50),
    ]

    const [flawedBelow] = verdictOf(onThreshold)
    expect(flawedBelow).toBe(false)
  })

  it('misses the sound criterion exactly on its threshold', () => {
    const onThreshold: Bet[] = [
      bet('s1', 70),
      bet('s2', 70),
      bet('f1', 10),
      bet('f2', 10),
      bet('u1', 50),
      bet('u2', 50),
    ]

    const [, soundAbove] = verdictOf(onThreshold)
    expect(soundAbove).toBe(false)
  })

  it('satisfies the calibration criterion exactly on its threshold', () => {
    const onThreshold: Bet[] = [
      bet('s1', 70),
      bet('s2', 70),
      bet('f1', 30),
      bet('f2', 30),
      bet('u1', 50),
      bet('u2', 50),
    ]

    const [, , calibrationAtLeast] = verdictOf(onThreshold)
    expect(calibrationAtLeast).toBe(true)
  })

  it('misses the guard rail on a single out of band bet, even with the others inside', () => {
    const oneOutOfBand: Bet[] = [
      bet('s1', 90),
      bet('s2', 90),
      bet('f1', 10),
      bet('f2', 10),
      bet('u1', 50),
      bet('u2', 90),
    ]

    const [, , , guardRail] = verdictOf(oneOutOfBand)
    expect(guardRail).toBe(false)
  })

  it('renders the same verdict when the journal written in the trace is forged', () => {
    const forged = traceOf(CALIBRATED)
    forged.finalCapital = -9999

    expect(
      evaluator.evaluate(forged, config, criteria).map((r) => r.satisfied),
    ).toEqual([true, true, true, true])
  })

  it('rejects a rule it does not know, naming the rule and the game', () => {
    const unknown: Criterion[] = [
      { ...criteria[0], rule: { type: 'invented-rule' } },
    ]

    expect(() =>
      evaluator.evaluate(traceOf(CALIBRATED), config, unknown),
    ).toThrow('invented-rule')
    expect(() =>
      evaluator.evaluate(traceOf(CALIBRATED), config, unknown),
    ).toThrow('confidence-bet')
  })

  it('satisfies only the sound criterion when the player bets high everywhere', () => {
    expect(verdictOf(ALL_HIGH)).toEqual([false, true, false, false])
  })

  it('satisfies only the guard rail when the player hedges on the neutral stake everywhere', () => {
    expect(verdictOf(ALL_NEUTRAL)).toEqual([false, false, false, true])
  })

  it('misses only the guard rail when the player reads the code but overrates the undecidable', () => {
    expect(verdictOf(SHARP_BUT_OVERCONFIDENT_ON_UNDECIDABLE)).toEqual([
      true,
      true,
      true,
      false,
    ])
  })
})
