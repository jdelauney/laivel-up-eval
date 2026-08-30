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

  it('satisfies both criteria for a profile that frames grounded and first, then solves frugally', () => {
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
  })

  it('sinks both criteria for the eager asker who never frames and buys every hint', () => {
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
  })

  it('satisfies only the framing criterion for the spendthrift framer who frames well but buys every hint', () => {
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
  })

  it('sinks the framing criterion for the profile that retains every reading of every situation', () => {
    const dimension = pilotageContexteDimension(
      playG2_1(checksEverythingAttempts(realG2_1Config())),
    )
    const framingCriterion = dimension.contributions.find(
      (contribution) => contribution.criterionId === 'g2-1-c2',
    )

    expect(framingCriterion?.satisfied).toBe(false)
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
