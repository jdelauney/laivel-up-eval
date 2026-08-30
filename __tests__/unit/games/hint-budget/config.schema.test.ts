import { describe, expect, it } from 'vitest'
import { hintBudgetConfigSchema } from '@/games/hint-budget/schema/config.schema'

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
 * Trois causes (le minimum du schéma) forcent `ruledOutByReport` à zéro
 * partout : le refus « au moins trois causes restent après le rapport »
 * n'admet aucune marge en dessous. Quatre indices, pas trois : le chemin
 * frugal exige de faire tomber le champ à une cause avec au plus
 * `floor(hints.length / 2)` d'entre eux ; à trois indices ce plafond vaut un
 * seul indice, qui ne peut jamais suffire sans violer le refus voisin
 * (aucun indice seul ne ramène le champ sous deux). `h1` et `h2` écartent
 * chacun l'une des deux causes non réelles ; leur combinaison (deux indices,
 * sous le plafond de deux) ramène le champ à une seule cause.
 */
const situation = (
  id: string,
  overrides: Partial<{
    framings: ReturnType<typeof framing>[]
    hints: ReturnType<typeof hint>[]
    causes: ReturnType<typeof cause>[]
  }> = {},
) => ({
  id,
  symptom: `Symptôme ${id}.`,
  report: [`Fait 1 de ${id}.`, `Fait 2 de ${id}.`],
  framings: overrides.framings ?? [
    framing(`${id}-f1`, true),
    framing(`${id}-f2`, true),
    framing(`${id}-f3`, false),
    framing(`${id}-f4`, false),
    framing(`${id}-f5`, false),
  ],
  hints: overrides.hints ?? [
    hint(`${id}-h1`, 5, [`${id}-c1`]),
    hint(`${id}-h2`, 10, [`${id}-c3`]),
    hint(`${id}-h3`, 15),
    hint(`${id}-h4`, 20),
  ],
  causes: overrides.causes ?? [
    cause(`${id}-c1`, false),
    cause(`${id}-c2`, true),
    cause(`${id}-c3`, false),
  ],
})

const validConfig = () => ({
  statement: 'Consigne de test.',
  wrongCutPenalty: 40,
  blindCutSurcharge: 30,
  situations: [situation('s1'), situation('s2'), situation('s3')],
})

const firstIssue = (config: unknown) => {
  const result = hintBudgetConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('hint-budget config schema', () => {
  it('accepts three situations, each with a mixed framing and one actual cause', () => {
    const parsed = hintBudgetConfigSchema.parse(validConfig())

    expect(parsed.situations).toHaveLength(3)
  })

  it('rejects two situations sharing the same id, naming the situation', () => {
    const config = validConfig()
    config.situations[1] = situation('s1')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 1, 'id'])
    expect(issue.message).toContain('s1')
  })

  it('rejects two hints sharing the same id within a situation, naming both', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      hints: [hint('s1-h1', 5), hint('s1-h1', 10), hint('s1-h3', 15)],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'hints', 1, 'id'])
    expect(issue.message).toContain('s1-h1')
    expect(issue.message).toContain('s1')
  })

  it('rejects two causes sharing the same id within a situation, naming both', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      causes: [
        cause('s1-c1', false),
        cause('s1-c1', true),
        cause('s1-c3', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'causes', 1, 'id'])
    expect(issue.message).toContain('s1-c1')
    expect(issue.message).toContain('s1')
  })

  it('rejects two framings sharing the same id within a situation, naming both', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      framings: [
        framing('s1-f1', true),
        framing('s1-f1', false),
        framing('s1-f3', false),
        framing('s1-f4', false),
        framing('s1-f5', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'framings', 1, 'id'])
    expect(issue.message).toContain('s1-f1')
    expect(issue.message).toContain('s1')
  })

  it('rejects a situation with no actual cause, naming the situation', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      causes: [
        cause('s1-c1', false),
        cause('s1-c2', false),
        cause('s1-c3', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'causes'])
    expect(issue.message).toContain('s1')
  })

  it('rejects a situation with two actual causes, naming the situation', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      causes: [
        cause('s1-c1', true),
        cause('s1-c2', true),
        cause('s1-c3', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'causes'])
    expect(issue.message).toContain('s1')
  })

  it('rejects a situation whose every framing is established, naming the situation', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      framings: [
        framing('s1-f1', true),
        framing('s1-f2', true),
        framing('s1-f3', true),
        framing('s1-f4', true),
        framing('s1-f5', true),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'framings'])
    expect(issue.message).toContain('s1')
  })

  it('rejects a situation with no established framing, naming the situation', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      framings: [
        framing('s1-f1', false),
        framing('s1-f2', false),
        framing('s1-f3', false),
        framing('s1-f4', false),
        framing('s1-f5', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'framings'])
    expect(issue.message).toContain('s1')
  })

  it('rejects a blind-cut surcharge that does not strictly exceed the priciest hint, naming both amounts', () => {
    const config = validConfig()
    config.blindCutSurcharge = 15

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['blindCutSurcharge'])
    expect(issue.message).toContain('15')
  })

  /**
   * Le graphe d'élimination des causes, ajouté le 30/08 après le tour 2 de
   * revue : cinq refus qui rendent la délégation totale inexprimable au
   * contrat, plutôt que de compter sur une consigne d'écriture du corpus.
   */
  describe('the cause-elimination graph', () => {
    it("rejects a hint's eliminates naming a cause absent from the situation", () => {
      const config = validConfig()
      config.situations[0] = situation('s1', {
        hints: [
          hint('s1-h1', 5, ['introuvable']),
          hint('s1-h2', 10, ['s1-c3']),
          hint('s1-h3', 15),
          hint('s1-h4', 20),
        ],
      })

      const issue = firstIssue(config)
      expect(issue.path).toEqual(['situations', 0, 'hints', 0, 'eliminates', 0])
      expect(issue.message).toContain('introuvable')
      expect(issue.message).toContain('s1-h1')
    })

    it('rejects a report that rules out the actual cause', () => {
      const config = validConfig()
      config.situations[0] = situation('s1', {
        causes: [
          cause('s1-c1', false),
          cause('s1-c2', true, true),
          cause('s1-c3', false),
        ],
      })

      const issue = firstIssue(config)
      expect(issue.path).toEqual(['situations', 0, 'causes'])
      expect(issue.message).toContain('s1-c2')
    })

    it('rejects a hint whose eliminates names the actual cause', () => {
      const config = validConfig()
      config.situations[0] = situation('s1', {
        hints: [
          hint('s1-h1', 5, ['s1-c2']),
          hint('s1-h2', 10),
          hint('s1-h3', 15),
        ],
      })

      const issue = firstIssue(config)
      expect(issue.path).toEqual(['situations', 0, 'hints', 0, 'eliminates'])
      expect(issue.message).toContain('s1-h1')
      expect(issue.message).toContain('s1-c2')
    })

    it('rejects a report that rules out too many causes, leaving fewer than three in play', () => {
      const config = validConfig()
      config.situations[0] = situation('s1', {
        causes: [
          cause('s1-c1', false, true),
          cause('s1-c2', true),
          cause('s1-c3', false, true),
        ],
      })

      const issue = firstIssue(config)
      expect(issue.path).toEqual(['situations', 0, 'causes'])
      expect(issue.message).toContain('s1')
    })

    /**
     * La preuve directe qu'aucun indice, pris seul, ne peut trancher une
     * situation : `s1-h1` écarte à lui seul les deux causes non réelles, ce
     * qui ramènerait le champ à une — la délégation totale que l'épique
     * interdit. Le refus la rend inexprimable au chargement.
     */
    it('rejects a single hint whose eliminates, combined with the report, would leave fewer than two causes', () => {
      const config = validConfig()
      config.situations[0] = situation('s1', {
        hints: [
          hint('s1-h1', 5, ['s1-c1', 's1-c3']),
          hint('s1-h2', 10),
          hint('s1-h3', 15),
        ],
      })

      const issue = firstIssue(config)
      expect(issue.path).toEqual(['situations', 0, 'hints', 0, 'eliminates'])
      expect(issue.message).toContain('s1-h1')
    })

    it('rejects a situation where no combination of at most half its hints ever narrows the field to one cause', () => {
      const config = validConfig()
      config.situations[0] = situation('s1', {
        hints: [
          hint('s1-h1', 5),
          hint('s1-h2', 10),
          hint('s1-h3', 15),
          hint('s1-h4', 20),
        ],
      })

      const issue = firstIssue(config)
      expect(issue.path).toEqual(['situations', 0, 'hints'])
      expect(issue.message).toContain('s1')
    })
  })
})
