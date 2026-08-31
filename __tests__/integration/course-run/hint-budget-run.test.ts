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
import { flowOrderConfigSchema } from '@/games/flow-order/schema/config.schema'
import { buildHintBudgetAnswer } from '@/games/hint-budget/actions/build-hint-budget-answer.action'
import { readSituations } from '@/games/hint-budget/helpers/read-situations.helper'
import { HintBudgetEvaluator } from '@/games/hint-budget/hint-budget.evaluator'
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
import { correctPracticeMapAnswer } from '../../fixtures/practice-map-answer'

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
 * Cadre juste, d'entrée, partout, en achetant au plus deux indices sur cinq,
 * et tranche juste partout.
 *
 * **Corrigé au tour 5.** Ce profil laissait la troisième situation au hasard,
 * sur la foi d'un commentaire qui affirmait qu'elle « ne pèse sur aucun des
 * deux seuils (`threshold: 2`) ». C'était faux depuis le passage de `c1` à
 * `3` sur `3`, et le test ne passait plus que par accident : la cause réelle
 * de `s3` se trouve être sa première cause déclarée, celle que la branche
 * jouait au hasard. Un test qui réussit pour cette raison-là ne prouve rien.
 */
const frugalFramerAttempts = (config: HintBudgetConfig): Attempt[] =>
  config.situations.map((situation) => ({
    situationId: situation.id,
    framing: {
      retainedIds: establishedFramingIdsOf(situation),
      afterHints: 0,
    },
    boughtHintIds: [situation.hints[0].id],
    cutCauseId: actualCauseIdOf(situation),
  }))

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
   * W7 de la revue 2 : le premier garde-fou (retiré ici) triait en ordre
   * croissant et prenait `indexOf` — une variante qui reste distincte même
   * quand le rang « k-ième plus longue » ne l'est pas, parce que des
   * longueurs ex æquo brisent la relation attendue entre les deux tris.
   * Preuve : sur l'ancien corpus, ce garde-fou passait (rangs croissants
   * 1 · 2 · 3) alors qu'une politique aveugle « trancher la deuxième plus
   * longue cause » résolvait déjà deux situations sur trois — exactement le
   * seuil de `c1`. Remplacé par un balayage complet des cinq rangs de
   * longueur **descendante** : pour chaque k de 1 (le texte le plus long)
   * à 5 (le plus court), « trancher la k-ième plus longue cause, sans rien
   * lire » ne doit jamais résoudre plus d'une situation sur trois.
   */
  it('never lets a "cut the k-th longest cause" policy solve more than one of the three situations, for every k', () => {
    const config = realG2_1Config()

    const descendingRankOfActual = (situation: Situation): number => {
      const sortedIds = [...situation.causes]
        .sort((a, b) => b.text.length - a.text.length)
        .map((cause) => cause.id)
      return sortedIds.indexOf(actualCauseIdOf(situation)) + 1
    }

    const actualRanks = config.situations.map(descendingRankOfActual)
    const causeCount = config.situations[0]?.causes.length ?? 0

    for (let k = 1; k <= causeCount; k++) {
      const situationsSolvedByK = actualRanks.filter(
        (rank) => rank === k,
      ).length
      expect(situationsSolvedByK).toBeLessThanOrEqual(1)
    }

    // Condition suffisante pour la propriété ci-dessus, et plus lisible sur
    // un échec de test : les trois rangs descendants sont deux à deux
    // distincts.
    expect(new Set(actualRanks).size).toBe(actualRanks.length)
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
  it('never lets any purchase, even buying every hint, narrow the field below two causes', () => {
    const config = realG2_1Config()

    config.situations.forEach((situation) => {
      const everyEliminationIds = new Set([
        ...situation.causes
          .filter((cause) => cause.ruledOutByReport)
          .map((cause) => cause.id),
        ...situation.hints.flatMap((hint) => hint.eliminates),
      ])
      const standing = situation.causes.filter(
        (cause) => !everyEliminationIds.has(cause.id),
      )

      expect(
        standing.length,
        `${situation.id} ne laisse que ${standing.length} cause(s) debout après tous les achats`,
      ).toBeGreaterThanOrEqual(2)
      expect(standing.some((cause) => cause.actual)).toBe(true)
    })
  })

  /**
   * Le balayage du complément, la fuite du tour 5. Le plancher du tour 4 ne
   * couvrait que les cibles d'indices, mais le panneau de cadrage nomme lui
   * aussi des causes : les lectures établies redisent ce que le rapport
   * écarte, et une supposition pouvait déguiser une hypothèse de diagnostic.
   * Sur `s2`, les cinq lectures et les cinq intitulés nommaient ensemble
   * quatre causes sur cinq — la survivante était la réponse, sans un achat.
   *
   * La désignation est déclarée (`framing.refersTo`, `hint.eliminates`),
   * jamais mesurée lexicalement : une mesure de sous-chaîne compte aussi les
   * locutions partagées (« de l'agent CI ») et rejetterait un corpus sain.
   */
  it('never lets everything the screen names leave a single cause unnamed', () => {
    const config = realG2_1Config()

    config.situations.forEach((situation) => {
      const namedCauseIds = new Set([
        ...situation.causes
          .filter((cause) => cause.ruledOutByReport)
          .map((cause) => cause.id),
        ...situation.hints.flatMap((hint) => hint.eliminates),
        ...situation.framings.flatMap((framing) =>
          framing.refersTo === null ? [] : [framing.refersTo],
        ),
      ])
      const neverNamed = situation.causes.filter(
        (cause) => !namedCauseIds.has(cause.id),
      )

      expect(
        neverNamed.length,
        `${situation.id} ne laisse que ${neverNamed.length} cause(s) jamais nommée(s) par l'écran : le complément désigne la réponse`,
      ).toBeGreaterThanOrEqual(2)
      expect(neverNamed.some((cause) => cause.actual)).toBe(true)
    })
  })

  /**
   * Le seuil de `c1` n'était protégé par rien : le ramener à `2` laissait
   * toute la suite verte (relevé au tour 5). Ce test ferme le trou par le
   * comportement plutôt que par la valeur — il joue la politique du
   * balayage, celle qui a le plus haut rendement sans lecture, et exige
   * qu'elle ne tienne pas `c1`.
   *
   * Le balayage laisse deux causes debout par situation. Le profil ci-dessous
   * lui donne le meilleur cas possible : il tranche juste dans deux
   * situations sur trois, ce qu'un pile ou face rend une fois sur quatre.
   * À `threshold: 3`, ça ne suffit pas. À `2`, ça suffirait — et ce test
   * échouerait, ce qui est exactement son rôle.
   */
  it('does not let the best two-out-of-three sweep outcome hold the frugality criterion', () => {
    const { game } = realG2_1()
    const config = realG2_1Config()

    const attempts = config.situations.map((situation, index) => ({
      situationId: situation.id,
      framing: null,
      boughtHintIds: [],
      // Juste dans les deux premières situations, faux dans la troisième.
      cutCauseId:
        index < 2
          ? actualCauseIdOf(situation)
          : (situation.causes.find((cause) => !cause.actual)?.id ?? ''),
    }))

    const [frugality] = new HintBudgetEvaluator().evaluate(
      { attempts },
      game.config,
      game.criteria,
    )

    expect(frugality?.satisfied).toBe(false)
  })

  it('carries, for every situation, a purchase path that narrows the field to the last two causes', () => {
    const config = realG2_1Config()

    config.situations.forEach((situation) => {
      const ruledOutByReportIds = new Set(
        situation.causes
          .filter((cause) => cause.ruledOutByReport)
          .map((cause) => cause.id),
      )
      const actualCauseId = actualCauseIdOf(situation)

      // La paire utile n'occupe pas les mêmes positions d'une situation à
      // l'autre — c'est voulu, sinon « acheter les indices 1 et 2 » gagnerait
      // partout sans lire un mot. Le test la cherche donc au lieu de la
      // supposer en tête de liste : il valide la propriété, pas un rang.
      const pairs = situation.hints.flatMap((first, index) =>
        situation.hints.slice(index + 1).map((second) => [first, second]),
      )

      const narrowingPairs = pairs.filter((pair) => {
        const coveredIds = new Set([
          ...ruledOutByReportIds,
          ...pair.flatMap((hint) => hint.eliminates),
        ])
        const remaining = situation.causes
          .map((cause) => cause.id)
          .filter((id) => !coveredIds.has(id))

        return remaining.length === 2 && remaining.includes(actualCauseId)
      })

      expect(
        narrowingPairs.length,
        `${situation.id} n'offre aucune paire d'indices qui ramène le champ aux deux dernières causes`,
      ).toBeGreaterThan(0)
    })
  })

  /**
   * Aucun indice n'énonce la cause réelle. Un simple compte de mots partagés
   * tolérerait un vocabulaire technique commun (« horloge », « arrondi ») ;
   * c'est la reprise d'une **phrase entière** qui trahit. Mesuré par la plus
   * longue sous-chaîne commune.
   *
   * **Généralisé à tous les indices le 30/08, après la troisième revue.** La
   * mesure ne portait que sur l'indice le plus cher, parce que c'est là que
   * le premier tour avait trouvé la paraphrase. La phrase n'a pas disparu :
   * elle a migré d'un cran, sur `s1-h3`, où elle a doublé de longueur
   * (80 caractères) sans que ce test bouge. Un garde-fou posé sur la seule
   * position que le défaut venait de quitter ne garde rien.
   *
   * La mesure porte sur la **cause réelle seule**, jamais sur toutes les
   * causes : un indice qui écarte une cause doit en parler, et partage donc
   * légitimement des phrases entières avec elle — jusqu'à 89 caractères sur
   * le corpus livré. Étendre la limite à toutes les causes ferait échouer le
   * corpus pour la raison exactement inverse de celle qu'on protège.
   */
  it('keeps every hint from echoing the actual cause as a near-verbatim phrase', () => {
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
      const actualCause = situation.causes.find((cause) => cause.actual)
      if (actualCause === undefined) {
        throw new Error(`${situation.id} has no actual cause`)
      }
      const actualText = `${actualCause.text} ${actualCause.verification}`

      situation.hints.forEach((hint) => {
        const overlap = longestCommonSubstring(hint.text, actualText)
        expect(
          overlap,
          `${hint.id} partage ${overlap} caractères consécutifs avec la cause réelle de ${situation.id}`,
        ).toBeLessThan(OVERLAP_LIMIT)
      })
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
      // `g2-2`, le voisin de groupe, arrivé sur `main` pendant cette branche.
      // Ce parcours ne mesure que `pilotage-contexte` chez `g2-1` : n'importe
      // quelle lecture conforme suffit ici.
      if (game.type === 'practice-map')
        return correctPracticeMapAnswer(game.config)
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
      /**
       * `g6-2` porte ambiguity-scan depuis la phase 4 de son propre plan :
       * ce test ne mesure pas `pilotage-contexte`, donc n'importe quelle
       * trace conforme suffit — ici, aucun segment signalé.
       */
      if (game.type === 'ambiguity-scan') return { flaggedIds: [] }
      /**
       * `g5-2` porte flow-order depuis la phase 4 de son propre plan : ce
       * test ne mesure pas `pilotage-contexte`, donc n'importe quelle
       * trace conforme suffit — ici, l'ordre de présentation du corpus.
       */
      if (game.type === 'flow-order') {
        const config = flowOrderConfigSchema.parse(game.config)
        return { orderedIds: config.initialOrder }
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
