import { describe, expect, it } from 'vitest'
import type { Course, Game } from '@/core/contracts/course.schema'
import { parseConfiguration } from '@/core/contracts/helpers/parse-config.helper'
import { WeightedMappingStrategy } from '@/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '@/core/session/game-session.facade'
import { buildCheckpointsAnswer } from '@/games/checkpoints/actions/build-checkpoints-answer.action'
import { checkpointsConfigSchema } from '@/games/checkpoints/schema/config.schema'
import { buildConfidenceBetAnswer } from '@/games/confidence-bet/actions/build-confidence-bet-answer.action'
import { confidenceBetConfigSchema } from '@/games/confidence-bet/schema/config.schema'
import { buildDefectHuntAnswer } from '@/games/defect-hunt/actions/build-defect-hunt-answer.action'
import { defectHuntConfigSchema } from '@/games/defect-hunt/schema/config.schema'
import { buildHintBudgetAnswer } from '@/games/hint-budget/actions/build-hint-budget-answer.action'
import { readSituations } from '@/games/hint-budget/helpers/read-situations.helper'
import {
  type Attempt,
  parseHintBudgetTrace,
} from '@/games/hint-budget/schema/answer.schema'
import {
  type HintBudgetConfig,
  hintBudgetConfigSchema,
  type Situation,
} from '@/games/hint-budget/schema/config.schema'
import { buildGameRegistry } from '@/games/register-games'
import { buildThreeTracksAnswer } from '@/games/three-tracks/actions/build-three-tracks-answer.action'
import { threeTracksConfigSchema } from '@/games/three-tracks/schema/config.schema'
import { FixedClock } from '@/infrastructure/clock/fixed.adapter'
import projectCourse from '../../../config/course.json'
import projectGrid from '../../../config/grid.json'
import projectSignature from '../../../config/signature.json'
import { defaultLieDetectorAnswer } from '../../fixtures/lie-detector-answer'
import { MemoryPersistence } from '../../fixtures/memory-persistence'

/**
 * Le jeu traverse le moteur réel : le vrai registre, la vraie façade, la
 * vraie stratégie de pondération, et le corpus réel de `g2-1` lu depuis
 * `config/course.json`. `verification` vit dans la signature, `pilotage-contexte`
 * aussi : lire `getVerdict().signature`, jamais `.result`.
 *
 * Les profils se construisent depuis le corpus lu, jamais depuis des
 * identifiants écrits en dur : une réécriture du corpus ne doit pas casser ce
 * test pour la mauvaise raison.
 */

const G2_1_GAME_ID = 'g2-1'

const realG2_1 = () => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === G2_1_GAME_ID),
  )
  const game = group?.games.find((entry) => entry.id === G2_1_GAME_ID)
  if (group === undefined || game === undefined) {
    throw new Error(`${G2_1_GAME_ID} introuvable dans le parcours réel`)
  }
  return { group, game }
}

const realG2_1Config = (): HintBudgetConfig =>
  hintBudgetConfigSchema.parse(realG2_1().game.config)

const isolatedCourse = (): unknown => {
  const { group, game } = realG2_1()
  return {
    version: (projectCourse as Course).version,
    groups: [{ ...group, games: [game] }],
  }
}

const buildFacade = (
  rawCourse: unknown = projectCourse,
  persistence = new MemoryPersistence(),
): GameSessionFacade => {
  const { grid, course, signature } = parseConfiguration(
    projectGrid,
    rawCourse,
    projectSignature,
  )

  return new GameSessionFacade({
    registry: buildGameRegistry(),
    scoring: new WeightedMappingStrategy(),
    persistence,
    clock: new FixedClock(),
    grid,
    course,
    signature,
  })
}

const pilotageContexteDimension = (facade: GameSessionFacade) => {
  const dimension = facade
    .getVerdict()
    .signature?.dimensions.find(
      (entry) => entry.dimensionId === 'pilotage-contexte',
    )

  if (dimension === undefined) {
    throw new Error('pilotage-contexte is not scored')
  }
  return dimension
}

const actualCauseIdOf = (situation: Situation): string => {
  const actual = situation.causes.find((cause) => cause.actual)
  if (actual === undefined)
    throw new Error(`${situation.id} has no actual cause`)
  return actual.id
}

const establishedFramingIdsOf = (situation: Situation): string[] =>
  situation.framings.filter((framing) => framing.established).map((f) => f.id)

/**
 * Cadre juste, d'entrée, dans les deux premières situations, en achetant au
 * plus deux indices sur cinq, et tranche juste. La troisième situation ne
 * pèse sur aucun des deux seuils (`threshold: 2`) : le profil doit rester
 * satisfaisant même si elle est jouée n'importe comment.
 */
const frugalFramerAttempts = (config: HintBudgetConfig): Attempt[] =>
  config.situations.map((situation, index) => {
    if (index >= 2) {
      return {
        situationId: situation.id,
        framing: null,
        boughtHintIds: [],
        cutCauseId: situation.causes[0].id,
      }
    }
    return {
      situationId: situation.id,
      framing: {
        retainedIds: establishedFramingIdsOf(situation),
        afterHints: 0,
      },
      boughtHintIds: [situation.hints[0].id],
      cutCauseId: actualCauseIdOf(situation),
    }
  })

/** N'ouvre jamais le cadrage, et achète tous les indices de chaque situation. */
const eagerAskerAttempts = (config: HintBudgetConfig): Attempt[] =>
  config.situations.map((situation) => ({
    situationId: situation.id,
    framing: null,
    boughtHintIds: situation.hints.map((hint) => hint.id),
    cutCauseId: actualCauseIdOf(situation),
  }))

/** Cadre juste, d'entrée, partout — puis achète tous les indices partout. */
const spendthriftFramerAttempts = (config: HintBudgetConfig): Attempt[] =>
  config.situations.map((situation) => ({
    situationId: situation.id,
    framing: { retainedIds: establishedFramingIdsOf(situation), afterHints: 0 },
    boughtHintIds: situation.hints.map((hint) => hint.id),
    cutCauseId: actualCauseIdOf(situation),
  }))

/** Retient toutes les lectures de cadrage, établies et supposées, de chaque situation. */
const checksEverythingAttempts = (config: HintBudgetConfig): Attempt[] =>
  config.situations.map((situation) => ({
    situationId: situation.id,
    framing: {
      retainedIds: situation.framings.map((framing) => framing.id),
      afterHints: 0,
    },
    boughtHintIds: [],
    cutCauseId: actualCauseIdOf(situation),
  }))

/** Tranche systématiquement la première cause déclarée de chaque situation. */
const positionalCutterAttempts = (config: HintBudgetConfig): Attempt[] =>
  config.situations.map((situation) => ({
    situationId: situation.id,
    framing: null,
    boughtHintIds: [],
    cutCauseId: situation.causes[0].id,
  }))

/**
 * Transmet un cadre vide avant tout achat, dans chaque situation, puis
 * tranche au hasard (la première cause déclarée). Avant le correctif du
 * 30/08 (tour 2 de revue), `framedFirst` ne vérifiait que l'ordre — trois
 * clics sur « Transmettre ce cadre », zéro lecture — et ce profil tenait
 * `c2` 3/3. W9 de la revue 2 : garde-fou manquant, ajouté ici.
 */
const emptyFramerAttempts = (config: HintBudgetConfig): Attempt[] =>
  config.situations.map((situation) => ({
    situationId: situation.id,
    framing: { retainedIds: [], afterHints: 0 },
    boughtHintIds: [],
    cutCauseId: situation.causes[0].id,
  }))

const playG2_1 = (attempts: readonly Attempt[]): GameSessionFacade => {
  const facade = buildFacade(isolatedCourse())
  facade.start('Alice')
  facade.submitAnswer(buildHintBudgetAnswer(realG2_1Config(), attempts))
  facade.nextGame()
  return facade
}

describe('hint-budget in the course', () => {
  it('loads the real course and opens the situation as hint-budget, three incidents', () => {
    expect(() => buildFacade()).not.toThrow()

    const { game } = realG2_1()
    expect(game.type).toBe('hint-budget')
    const config = hintBudgetConfigSchema.parse(game.config)
    expect(config.situations).toHaveLength(3)
  })

  it('maps every g2-1 criterion to pilotage-contexte, and nothing else', () => {
    const { game } = realG2_1()
    const dimensions = new Set(
      game.criteria.flatMap((criterion) =>
        criterion.mapping.map((mapping) => mapping.dimension),
      ),
    )

    expect([...dimensions]).toEqual(['pilotage-contexte'])
  })

  it('satisfies all three criteria for a profile that frames grounded and first, then solves frugally', () => {
    const dimension = pilotageContexteDimension(
      playG2_1(frugalFramerAttempts(realG2_1Config())),
    )
    const satisfiedByCriterion = Object.fromEntries(
      dimension.contributions.map((contribution) => [
        contribution.criterionId,
        contribution.satisfied,
      ]),
    )

    expect(satisfiedByCriterion['g2-1-c1']).toBe(true)
    expect(satisfiedByCriterion['g2-1-c2']).toBe(true)
    expect(satisfiedByCriterion['g2-1-c3']).toBe(true)
  })

  it('sinks all three criteria for the eager asker who never frames and buys every hint', () => {
    const dimension = pilotageContexteDimension(
      playG2_1(eagerAskerAttempts(realG2_1Config())),
    )
    const satisfiedByCriterion = Object.fromEntries(
      dimension.contributions.map((contribution) => [
        contribution.criterionId,
        contribution.satisfied,
      ]),
    )

    expect(satisfiedByCriterion['g2-1-c1']).toBe(false)
    expect(satisfiedByCriterion['g2-1-c2']).toBe(false)
    expect(satisfiedByCriterion['g2-1-c3']).toBe(false)
  })

  it('satisfies the order and grounding criteria, but not frugality, for the spendthrift framer who frames well but buys every hint', () => {
    const dimension = pilotageContexteDimension(
      playG2_1(spendthriftFramerAttempts(realG2_1Config())),
    )
    const satisfiedByCriterion = Object.fromEntries(
      dimension.contributions.map((contribution) => [
        contribution.criterionId,
        contribution.satisfied,
      ]),
    )

    expect(satisfiedByCriterion['g2-1-c1']).toBe(false)
    expect(satisfiedByCriterion['g2-1-c2']).toBe(true)
    expect(satisfiedByCriterion['g2-1-c3']).toBe(true)
  })

  /**
   * Cocher toutes les lectures — établies et supposées — pose le cadre en
   * premier (`afterHints: 0`) : l'ordre seul (`c2`) ressort donc satisfait.
   * Mais le cadrage n'est pas fondé (`c3`) : il retient plus que ce que le
   * rapport établit. C'est exactement le cas que la scission du 30/08
   * corrige — sous l'ancienne règle unique, ce profil lisait « manqué » sur
   * un critère dont la question affichée ne parlait que d'ordre.
   */
  it('satisfies the order criterion but sinks the grounding criterion for the profile that retains every reading of every situation', () => {
    const dimension = pilotageContexteDimension(
      playG2_1(checksEverythingAttempts(realG2_1Config())),
    )
    const satisfiedByCriterion = Object.fromEntries(
      dimension.contributions.map((contribution) => [
        contribution.criterionId,
        contribution.satisfied,
      ]),
    )

    expect(satisfiedByCriterion['g2-1-c2']).toBe(true)
    expect(satisfiedByCriterion['g2-1-c3']).toBe(false)
  })

  /**
   * W9 de la revue 2 : le profil qui déclenchait C2 (cadrage vide posé en
   * premier) n'était couvert nulle part. `framedFirst` exige désormais un
   * cadrage non vide (`read-situations.helper.ts`, correction du 30/08,
   * tour 2) : trois dépôts vides ne tiennent plus aucun des trois critères.
   */
  it('sinks all three criteria for the profile that posts an empty framing first in every situation', () => {
    const dimension = pilotageContexteDimension(
      playG2_1(emptyFramerAttempts(realG2_1Config())),
    )
    const satisfiedByCriterion = Object.fromEntries(
      dimension.contributions.map((contribution) => [
        contribution.criterionId,
        contribution.satisfied,
      ]),
    )

    expect(satisfiedByCriterion['g2-1-c1']).toBe(false)
    expect(satisfiedByCriterion['g2-1-c2']).toBe(false)
    expect(satisfiedByCriterion['g2-1-c3']).toBe(false)
  })

  it('solves at most one situation for the profile that always cuts the first declared cause', () => {
    const config = realG2_1Config()
    const attempts = positionalCutterAttempts(config)
    const trace = parseHintBudgetTrace({ attempts }, config)
    const reading = readSituations(config, trace)

    expect(reading.situations.filter((entry) => entry.solved)).toHaveLength(1)
  })

  it('carries a corpus where the actual cause never occupies the same rank across the three situations', () => {
    const config = realG2_1Config()

    const ranks = config.situations.map((situation) =>
      situation.causes.findIndex((cause) => cause.actual),
    )

    expect(new Set(ranks).size).toBe(ranks.length)
  })

  /**
   * Garde-fou de corpus, sur le modèle de `lie-detector-run.test.ts:398` :
   * une politique aveugle « trancher la cause la plus longue » (ou la plus
   * courte) tenait `c1` 3/3 sans lire une ligne avant cette correction — la
   * cause `actual` était le texte le plus long des cinq, dans les trois
   * situations. Corrigé le 30/08, après revue : la longueur ne trahit plus
   * rien.
   */
  it('never lets the actual cause be the longest or the shortest claim of its situation: form does not give it away', () => {
    const config = realG2_1Config()

    config.situations.forEach((situation) => {
      const lengths = situation.causes.map((cause) => cause.text.length)
      const actualLength = situation.causes.find((cause) => cause.actual)?.text
        .length

      expect(actualLength).not.toBe(Math.max(...lengths))
      expect(actualLength).not.toBe(Math.min(...lengths))
    })
  })

  /** Le second garde-fou, sur le modèle de `lie-detector-run.test.ts:417`. */
  it('keeps each situation within a quarter of its longest cause claim: the set reads as homogeneous', () => {
    const config = realG2_1Config()

    config.situations.forEach((situation) => {
      const lengths = situation.causes.map((cause) => cause.text.length)
      const longest = Math.max(...lengths)
      const shortest = Math.min(...lengths)

      expect(longest - shortest).toBeLessThanOrEqual(longest / 4)
    })
  })

  /**
   * W7 de la revue 2 : le garde-fou aux extrêmes ne mesurait que « ni la
   * plus longue ni la plus courte », un canal résiduel restait ouvert — la
   * cause réelle occupait le même **rang de longueur** (le k-ième plus
   * court) dans deux situations sur trois, rendant une politique « trancher
   * la k-ième plus courte » gagnante à l'aveugle. Étendu au balayage
   * complet du rang plutôt qu'aux seuls extrêmes, sur le modèle du garde-fou
   * de rang déclaré déjà présent ci-dessus.
   */
  it('never lets the actual cause land on the same length rank across the three situations, not only at the extremes', () => {
    const config = realG2_1Config()

    const lengthRanks = config.situations.map((situation) => {
      const sortedIds = [...situation.causes]
        .sort((a, b) => a.text.length - b.text.length)
        .map((cause) => cause.id)
      return sortedIds.indexOf(actualCauseIdOf(situation))
    })

    expect(new Set(lengthRanks).size).toBe(lengthRanks.length)
  })

  /**
   * C1 de la revue 2, fermé au niveau du corpus lui-même plutôt qu'au seul
   * refus de schéma : acheter un seul indice, quel qu'il soit, ne réduit
   * jamais le champ des causes en jeu (rapport compris) à moins de deux —
   * la délégation totale que l'épique interdit reste impossible sur le
   * corpus réel, pas seulement sur un corpus synthétique de test.
   */
  it('never lets a single hint, combined with the report, narrow a real situation down to one cause', () => {
    const config = realG2_1Config()

    config.situations.forEach((situation) => {
      const ruledOutByReportIds = new Set(
        situation.causes
          .filter((cause) => cause.ruledOutByReport)
          .map((cause) => cause.id),
      )

      situation.hints.forEach((hint) => {
        const coveredIds = new Set([...ruledOutByReportIds, ...hint.eliminates])
        const remaining = situation.causes.filter(
          (cause) => !coveredIds.has(cause.id),
        ).length

        expect(remaining).toBeGreaterThanOrEqual(2)
      })
    })
  })

  /**
   * La contrepartie du refus précédent : le jeu reste gagnable frugalement.
   * Sur le corpus réel, `h1` et `h2` de chaque situation écartent chacun
   * l'une des deux causes que le rapport laisse en jeu — leur achat
   * conjoint (deux indices sur cinq, sous le seuil de frugalité) ramène le
   * champ à la seule cause réelle.
   */
  it('carries, for every situation, a two-hint combination that narrows the field to the actual cause alone', () => {
    const config = realG2_1Config()

    config.situations.forEach((situation) => {
      const ruledOutByReportIds = new Set(
        situation.causes
          .filter((cause) => cause.ruledOutByReport)
          .map((cause) => cause.id),
      )
      const actualCauseId = actualCauseIdOf(situation)

      const coveredIds = new Set([
        ...ruledOutByReportIds,
        ...situation.hints[0].eliminates,
        ...situation.hints[1].eliminates,
      ])
      const remaining = situation.causes
        .map((cause) => cause.id)
        .filter((id) => !coveredIds.has(id))

      expect(remaining).toEqual([actualCauseId])
    })
  })

  /**
   * L'indice le plus cher (`h5`) est celui qui écarte le plus d'alternatives,
   * jamais celui qui livre la réponse (`phase-4.md`, règle 4). `s1-h5`
   * énonçait la cause réelle mot pour mot avant cette correction. Un simple
   * compte de mots partagés tolérerait un vocabulaire technique commun
   * (« horloge », « arrondi ») ; c'est la reprise d'une **phrase entière**
   * qui trahissait la cause. Mesuré par la plus longue sous-chaîne commune.
   */
  it('keeps the priciest hint from echoing the actual cause as a near-verbatim phrase', () => {
    const config = realG2_1Config()
    const OVERLAP_LIMIT = 20

    const longestCommonSubstring = (a: string, b: string): number => {
      const table: number[][] = Array.from({ length: a.length + 1 }, () =>
        new Array(b.length + 1).fill(0),
      )
      let longest = 0
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          if (a[i - 1] === b[j - 1]) {
            table[i][j] = table[i - 1][j - 1] + 1
            longest = Math.max(longest, table[i][j])
          }
        }
      }
      return longest
    }

    config.situations.forEach((situation) => {
      const priciestHint = [...situation.hints].sort(
        (a, b) => b.cost - a.cost,
      )[0]
      const actualCause = situation.causes.find((cause) => cause.actual)
      if (actualCause === undefined) {
        throw new Error(`${situation.id} has no actual cause`)
      }

      const overlap = longestCommonSubstring(
        priciestHint.text,
        `${actualCause.text} ${actualCause.verification}`,
      )
      expect(overlap).toBeLessThan(OVERLAP_LIMIT)
    })
  })

  it('carries a corpus where the set of established framing ranks differs across the three situations', () => {
    const config = realG2_1Config()

    const rankSets = config.situations.map((situation) =>
      situation.framings
        .map((framing, index) => (framing.established ? index : undefined))
        .filter((index): index is number => index !== undefined)
        .join(','),
    )

    expect(new Set(rankSets).size).toBe(rankSets.length)
  })

  it('charges a blind and wrong cut strictly more than the same wrong cut made after buying any single hint, for every situation', () => {
    const config = realG2_1Config()

    config.situations.forEach((situation) => {
      const wrongCauseId = situation.causes.find((cause) => !cause.actual)?.id
      if (wrongCauseId === undefined) {
        throw new Error(`${situation.id} has no wrong cause`)
      }

      const soloConfig = { ...config, situations: [situation] }

      const blindReading = readSituations(soloConfig, {
        attempts: [
          {
            situationId: situation.id,
            framing: null,
            boughtHintIds: [],
            cutCauseId: wrongCauseId,
          },
        ],
      }).situations[0]

      situation.hints.forEach((hint) => {
        const afterHintReading = readSituations(soloConfig, {
          attempts: [
            {
              situationId: situation.id,
              framing: null,
              boughtHintIds: [hint.id],
              cutCauseId: wrongCauseId,
            },
          ],
        }).situations[0]

        expect(blindReading.cost).toBeGreaterThan(afterHintReading.cost)
      })
    })
  })

  /**
   * Le reste du parcours n'a besoin que d'une réponse conforme, jamais d'une
   * bonne réponse : ce test traverse les sept groupes et vérifie qu'aucune
   * soumission n'est refusée, sur le modèle de `checkpoints-run.test.ts`.
   */
  it('walks the whole course, seven groups, with no submission refused, and computes a verdict', () => {
    const answerFor = (game: Game): unknown => {
      if (game.type === 'hint-budget') {
        return buildHintBudgetAnswer(
          hintBudgetConfigSchema.parse(game.config),
          frugalFramerAttempts(hintBudgetConfigSchema.parse(game.config)),
        )
      }
      if (game.type === 'three-tracks') {
        const config = threeTracksConfigSchema.parse(game.config)
        return buildThreeTracksAnswer(
          config,
          Array.from({ length: config.turns }, () => ({})),
        )
      }
      if (game.type === 'confidence-bet') {
        const config = confidenceBetConfigSchema.parse(game.config)
        return buildConfidenceBetAnswer(
          config,
          config.snippets.map((snippet) => ({
            snippetId: snippet.id,
            stake: config.neutralStake,
          })),
        )
      }
      if (game.type === 'defect-hunt') {
        const config = defectHuntConfigSchema.parse(game.config)
        return buildDefectHuntAnswer(config, [], 0)
      }
      if (game.type === 'lie-detector')
        return defaultLieDetectorAnswer(game.config)
      if (game.type === 'checkpoints') {
        const config = checkpointsConfigSchema.parse(game.config)
        return buildCheckpointsAnswer(
          config,
          config.stages.map(() => 'laisser-passer'),
        )
      }
      return { selected: [] }
    }

    const facade = buildFacade()
    facade.start('Alice')

    let progress = facade.getProgress()
    let submissions = 0
    while (progress.game !== undefined) {
      expect(() =>
        facade.submitAnswer(answerFor(progress.game as Game)),
      ).not.toThrow()
      submissions += 1
      facade.nextGame()
      progress = facade.getProgress()
    }

    expect(submissions).toBeGreaterThan(0)
    expect(() => facade.getVerdict()).not.toThrow()
  })
})
