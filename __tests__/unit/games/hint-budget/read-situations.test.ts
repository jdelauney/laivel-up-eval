import { describe, expect, it } from 'vitest'
import { readSituations } from '@/games/hint-budget/helpers/read-situations.helper'
import {
  type HintBudgetConfig,
  hintBudgetConfigSchema,
} from '@/games/hint-budget/schema/config.schema'

const framing = (id: string, established: boolean) => ({
  id,
  text: `Lecture ${id}.`,
  established,
})

const hint = (id: string, cost: number, eliminates: string[] = []) => ({
  id,
  label: `Indice ${id}.`,
  cost,
  text: `Texte de l'indice ${id}.`,
  eliminates,
})

const cause = (id: string, actual: boolean, ruledOutByReport = false) => ({
  id,
  text: `Cause ${id}.`,
  actual,
  verification: `Vérification ${id}.`,
  ruledOutByReport,
})

/**
 * `f1`, `f2` établies ; `f3`, `f4`, `f5` supposées. `h1`(5) · `h2`(10) ·
 * `h3`(15) · `h4`(20) — quatre indices, pas trois : le chemin frugal du
 * contrat de config exige de ramener le champ à une cause avec au plus
 * `floor(hints.length / 2)` indices, ce que trois indices sur trois causes
 * ne peuvent jamais satisfaire (voir `config.schema.ts`). `c2` est la cause
 * réelle ; `h1` écarte `c1`, `h2` écarte `c3`.
 */
const situation = (id: string) => ({
  id,
  symptom: `Symptôme ${id}.`,
  report: [`Fait 1 de ${id}.`, `Fait 2 de ${id}.`],
  framings: [
    framing(`${id}-f1`, true),
    framing(`${id}-f2`, true),
    framing(`${id}-f3`, false),
    framing(`${id}-f4`, false),
    framing(`${id}-f5`, false),
  ],
  hints: [
    hint(`${id}-h1`, 5, [`${id}-c1`]),
    hint(`${id}-h2`, 10, [`${id}-c3`]),
    hint(`${id}-h3`, 15, [`${id}-c4`]),
    hint(`${id}-h4`, 20, [`${id}-c4`]),
  ],
  causes: [
    cause(`${id}-c1`, false),
    cause(`${id}-c2`, true),
    cause(`${id}-c3`, false),
    cause(`${id}-c4`, false, true),
  ],
})

const config: HintBudgetConfig = hintBudgetConfigSchema.parse({
  statement: 'Consigne de test.',
  wrongCutPenalty: 40,
  blindCutSurcharge: 30,
  situations: [situation('s1'), situation('s2')],
})

const attempt = (
  situationId: string,
  overrides: Partial<{
    framing: { retainedIds: string[]; afterHints: number } | null
    boughtHintIds: string[]
    cutCauseId: string
  }> = {},
) => ({
  situationId,
  framing: overrides.framing === undefined ? null : overrides.framing,
  boughtHintIds: overrides.boughtHintIds ?? [],
  cutCauseId: overrides.cutCauseId ?? `${situationId}-c2`,
})

const filler = attempt('s2')

describe('read situations', () => {
  it('reads an exact framing posted first, and grounds it, as framed and grounded', () => {
    const reading = readSituations(config, {
      attempts: [
        attempt('s1', {
          framing: { retainedIds: ['s1-f1', 's1-f2'], afterHints: 0 },
        }),
        filler,
      ],
    })

    const s1 = reading.situations[0]
    expect(s1.framedFirst).toBe(true)
    expect(s1.framingGrounded).toBe(true)
  })

  it('reads an exact framing posted after a purchase as grounded but not first', () => {
    const reading = readSituations(config, {
      attempts: [
        attempt('s1', {
          boughtHintIds: ['s1-h1'],
          framing: { retainedIds: ['s1-f1', 's1-f2'], afterHints: 1 },
        }),
        filler,
      ],
    })

    const s1 = reading.situations[0]
    expect(s1.framedFirst).toBe(false)
    expect(s1.framingGrounded).toBe(true)
  })

  it('reads a partial framing, missing one established reading, as ungrounded', () => {
    const reading = readSituations(config, {
      attempts: [
        attempt('s1', {
          framing: { retainedIds: ['s1-f1'], afterHints: 0 },
        }),
        filler,
      ],
    })

    expect(reading.situations[0].framingGrounded).toBe(false)
  })

  it('reads a framing with one supposition on top of both established readings as ungrounded', () => {
    const reading = readSituations(config, {
      attempts: [
        attempt('s1', {
          framing: { retainedIds: ['s1-f1', 's1-f2', 's1-f3'], afterHints: 0 },
        }),
        filler,
      ],
    })

    expect(reading.situations[0].framingGrounded).toBe(false)
  })

  it('reads a situation without any posted framing as neither grounded nor first', () => {
    const reading = readSituations(config, {
      attempts: [attempt('s1'), filler],
    })

    const s1 = reading.situations[0]
    expect(s1.framedFirst).toBe(false)
    expect(s1.framingGrounded).toBe(false)
  })

  it('reads a correct cut as solved', () => {
    const reading = readSituations(config, {
      attempts: [attempt('s1', { cutCauseId: 's1-c2' }), filler],
    })

    expect(reading.situations[0].solved).toBe(true)
  })

  it('reads a wrong cut as not solved, and charges the wrong-cut penalty', () => {
    const reading = readSituations(config, {
      attempts: [
        attempt('s1', { boughtHintIds: ['s1-h1'], cutCauseId: 's1-c1' }),
        filler,
      ],
    })

    const s1 = reading.situations[0]
    expect(s1.solved).toBe(false)
    expect(s1.cost).toBe(5 + 40)
  })

  it('reads a wrong and blind cut as charging both the wrong-cut penalty and the blind-cut surcharge', () => {
    const reading = readSituations(config, {
      attempts: [attempt('s1', { cutCauseId: 's1-c1' }), filler],
    })

    const s1 = reading.situations[0]
    expect(s1.solved).toBe(false)
    expect(s1.blindCut).toBe(true)
    expect(s1.cost).toBe(0 + 40 + 30)
  })

  it('charges a blind and wrong cut strictly more than the same wrong cut made after buying the priciest hint of the situation', () => {
    const blind = readSituations(config, {
      attempts: [attempt('s1', { cutCauseId: 's1-c1' }), filler],
    }).situations[0]

    const afterPriciestHint = readSituations(config, {
      attempts: [
        attempt('s1', { boughtHintIds: ['s1-h4'], cutCauseId: 's1-c1' }),
        filler,
      ],
    }).situations[0]

    expect(blind.cost).toBeGreaterThan(afterPriciestHint.cost)
  })

  /**
   * `s1` cadre en premier, fondé. `s2` cadre en premier aussi, mais avec une
   * lecture en moins : compté par `framedFirstCount` (ordre seul), pas par
   * `groundedFramingCount` (fondement seul). Les deux comptes sont
   * indépendants depuis la scission de `c2` en deux règles, le 30/08 après
   * revue.
   */
  it('aggregates the framed-first count, the grounded count, and the total cost independently across situations', () => {
    const reading = readSituations(config, {
      attempts: [
        attempt('s1', {
          framing: { retainedIds: ['s1-f1', 's1-f2'], afterHints: 0 },
          cutCauseId: 's1-c2',
        }),
        attempt('s2', {
          framing: { retainedIds: ['s2-f1'], afterHints: 0 },
          cutCauseId: 's2-c2',
        }),
      ],
    })

    expect(reading.framedFirstCount).toBe(2)
    expect(reading.groundedFramingCount).toBe(1)
    expect(reading.totalCost).toBe(0)
  })
})
