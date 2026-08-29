import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import { CheckpointsEvaluator } from '@/games/checkpoints/checkpoints.evaluator'
import { replayTrace } from '@/games/checkpoints/helpers/run-simulation.helper'
import type { CheckpointsAnswer } from '@/games/checkpoints/schema/answer.schema'
import {
  type CheckpointsConfig,
  type Choice,
  checkpointsConfigSchema,
} from '@/games/checkpoints/schema/config.schema'

type TestDefect = { id: string; burstsAt: string; factor: number }

const stage = (id: string, corriger: number, defect?: TestDefect) => ({
  id,
  label: id,
  output: { prose: `sortie de l'IA pour ${id}` },
  costs: { 'laisser-passer': 0, corriger, 're-cadrer': corriger + 1 },
  defect,
})

/** Le barème du parcours : le coût d'une reprise monte avec l'étape. */
const config: CheckpointsConfig = checkpointsConfigSchema.parse({
  budget: 10,
  stages: [
    stage('cadrage', 2, { id: 'ambiguite', burstsAt: 'revue', factor: 3 }),
    stage('plan', 2, { id: 'pan-non-couvert', burstsAt: 'tests', factor: 3 }),
    stage('generation', 3),
    stage('revue', 4),
    stage('tests', 5),
    stage('merge', 6),
  ],
})

/** Un barème plat, pour éprouver les égalités que le barème réel interdit. */
const flatConfig: CheckpointsConfig = checkpointsConfigSchema.parse({
  budget: 10,
  stages: ['cadrage', 'plan', 'generation', 'revue', 'tests', 'merge'].map(
    (id) => stage(id, 2),
  ),
})

const criteria: Criterion[] = [
  {
    id: 'c1',
    question:
      'La reprise la plus lourde a-t-elle eu lieu avant la génération ?',
    rule: { type: 'heaviest-recovery-before', stage: 'generation' },
    mapping: [{ dimension: 'intervention', weight: 3 }],
  },
  {
    id: 'c2',
    question: "Aucune reprise n'a-t-elle eu lieu après la revue ?",
    rule: { type: 'no-recovery-after', stage: 'revue' },
    mapping: [{ dimension: 'intervention', weight: 3 }],
  },
  {
    id: 'c3',
    question: "L'IA a-t-elle produit l'essentiel du livrable ?",
    rule: { type: 'ai-produced-most-of-deliverable', threshold: 0.5 },
    mapping: [{ dimension: 'intervention', weight: 1 }],
  },
]

const LET_IT_RIDE: Choice[] = Array.from({ length: 6 }, () => 'laisser-passer')

const withChoices = (overrides: Readonly<Record<number, Choice>>): Choice[] =>
  LET_IT_RIDE.map((choice, index) => overrides[index] ?? choice)

const traceOf = (
  choices: readonly Choice[],
  from: CheckpointsConfig = config,
): CheckpointsAnswer => {
  const state = replayTrace(
    from,
    choices.map((choice) => ({ choice })),
  )
  return {
    decisions: [...state.decisions],
    remainingBudget: state.budget,
    remainingDefects: state.pendingDefects.map((defect) => defect.id),
  }
}

const evaluator = new CheckpointsEvaluator()

const verdictOf = (
  choices: readonly Choice[],
  rules: readonly Criterion[] = criteria,
  from: CheckpointsConfig = config,
): boolean[] =>
  evaluator
    .evaluate(traceOf(choices, from), from, rules)
    .map((result) => result.satisfied)

const EARLY_FRAMING = withChoices({ 0: 'corriger', 1: 'corriger' })
const FIXES_EVERYTHING: Choice[] = Array.from({ length: 6 }, () => 'corriger')

describe('checkpoints evaluator', () => {
  it('satisfies the three criteria for a player who frames early then lets it ride', () => {
    expect(verdictOf(EARLY_FRAMING)).toEqual([true, true, true])
  })

  it('returns one result per criterion, in the order the course declares them', () => {
    const results = evaluator.evaluate(traceOf(EARLY_FRAMING), config, criteria)

    expect(results.map((result) => result.criterionId)).toEqual([
      'c1',
      'c2',
      'c3',
    ])
  })

  it('misses the first criterion when the heaviest recovery lands on the merge', () => {
    expect(verdictOf(withChoices({ 5: 'corriger' }))[0]).toBe(false)
  })

  it('keeps the earliest stage when two recoveries cost the same', () => {
    expect(
      verdictOf(
        withChoices({ 0: 'corriger', 3: 'corriger' }),
        criteria,
        flatConfig,
      )[0],
    ).toBe(true)
    expect(
      verdictOf(withChoices({ 3: 'corriger' }), criteria, flatConfig)[0],
    ).toBe(false)
  })

  it('misses the second criterion when a fix is posted after the review', () => {
    expect(verdictOf(withChoices({ 4: 'corriger' }))[1]).toBe(false)
  })

  it('keeps the second criterion when a defect bursts on its own after the review', () => {
    const trace = traceOf(LET_IT_RIDE)

    expect(trace.remainingBudget).toBe(-2)
    expect(verdictOf(LET_IT_RIDE)[1]).toBe(true)
  })

  it('misses the guard rail criterion when every stage is taken back', () => {
    expect(verdictOf(FIXES_EVERYTHING)).toEqual([false, false, false])
  })

  /**
   * Les trois critères visent la même dimension avec des poids positifs : tout
   * satisfaire contre rien satisfaire ordonne les deux scores d'intervention,
   * quelle que soit la pondération. Le parcours réel le rejoue en intégration.
   */
  it('scores a player who fixes everything below one who frames early', () => {
    const early = verdictOf(EARLY_FRAMING).filter(Boolean).length
    const exhaustive = verdictOf(FIXES_EVERYTHING).filter(Boolean).length

    expect(exhaustive).toBeLessThan(early)
  })

  it('misses the first criterion when the player never takes anything back', () => {
    expect(verdictOf(LET_IT_RIDE)).toEqual([false, true, true])
  })

  it('moves with the threshold declared in the course, with no code change', () => {
    const strict: Criterion[] = [
      { ...criteria[2], rule: { type: criteria[2].rule.type, threshold: 0.9 } },
    ]

    expect(verdictOf(EARLY_FRAMING, [criteria[2]])).toEqual([true])
    expect(verdictOf(EARLY_FRAMING, strict)).toEqual([false])
  })

  it('replays the game rather than trusting the costs written in the trace', () => {
    const forged = traceOf(EARLY_FRAMING)
    forged.decisions = forged.decisions.map((decision) =>
      decision.stageId === 'merge' ? { ...decision, cost: 99 } : decision,
    )

    expect(
      evaluator.evaluate(forged, config, criteria).map((r) => r.satisfied),
    ).toEqual([true, true, true])
  })

  it('rejects a trace that does not match the game contract', () => {
    expect(() =>
      evaluator.evaluate({ decisions: 'aucune' }, config, criteria),
    ).toThrow()
  })

  it('rejects a trace that skips a stage rather than missing criteria by default', () => {
    const truncated = traceOf(EARLY_FRAMING)
    truncated.decisions = truncated.decisions.slice(0, 4)

    expect(() => evaluator.evaluate(truncated, config, criteria)).toThrow(
      'tests',
    )
  })

  it('rejects a rule it does not know, naming the rule and the game', () => {
    const unknown: Criterion[] = [
      { ...criteria[0], rule: { type: 'invented-rule' } },
    ]

    expect(() =>
      evaluator.evaluate(traceOf(EARLY_FRAMING), config, unknown),
    ).toThrow('invented-rule')
    expect(() =>
      evaluator.evaluate(traceOf(EARLY_FRAMING), config, unknown),
    ).toThrow('checkpoints')
  })

  it('rejects a rule aiming at a stage the config does not declare', () => {
    const misaimed: Criterion[] = [
      {
        ...criteria[0],
        rule: { type: 'heaviest-recovery-before', stage: 'recette' },
      },
    ]

    expect(() =>
      evaluator.evaluate(traceOf(EARLY_FRAMING), config, misaimed),
    ).toThrow('recette')
  })
})
