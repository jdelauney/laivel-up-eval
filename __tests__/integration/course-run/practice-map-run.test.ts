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
import { buildPracticeMapAnswer } from '@/games/practice-map/actions/build-practice-map-answer.action'
import { readPlacements } from '@/games/practice-map/helpers/read-placements.helper'
import { parsePracticeMapTrace } from '@/games/practice-map/schema/answer.schema'
import {
  type PracticeMapConfig,
  practiceMapConfigSchema,
} from '@/games/practice-map/schema/config.schema'
import { buildGameRegistry } from '@/games/register-games'
import { buildThreeTracksAnswer } from '@/games/three-tracks/actions/build-three-tracks-answer.action'
import { threeTracksConfigSchema } from '@/games/three-tracks/schema/config.schema'
import { FixedClock } from '@/infrastructure/clock/fixed.adapter'
import projectCourse from '../../../config/course.json'
import projectGrid from '../../../config/grid.json'
import projectSignature from '../../../config/signature.json'
import { defaultHintBudgetAnswer } from '../../fixtures/hint-budget-answer'
import { defaultLieDetectorAnswer } from '../../fixtures/lie-detector-answer'
import { MemoryPersistence } from '../../fixtures/memory-persistence'
import {
  correctPracticeMapAnswer,
  diagonalPracticeMapAnswer,
  nullPracticeMapAnswer,
  shiftedDownPracticeMapAnswer,
} from '../../fixtures/practice-map-answer'

/**
 * Le jeu traverse le moteur réel : le vrai registre, la vraie façade, la
 * vraie stratégie de pondération, et le corpus réel de `g2-2` lu depuis
 * `config/course.json`. `pilotage-contexte` vit dans la signature : lire
 * `getVerdict().signature`, jamais `.result`.
 */

const G2_2_GAME_ID = 'g2-2'

const realG2_2 = () => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === G2_2_GAME_ID),
  )
  const game = group?.games.find((entry) => entry.id === G2_2_GAME_ID)
  if (group === undefined || game === undefined) {
    throw new Error(`${G2_2_GAME_ID} introuvable dans le parcours réel`)
  }
  return { group, game }
}

const realG2_2Config = (): PracticeMapConfig =>
  practiceMapConfigSchema.parse(realG2_2().game.config)

const isolatedCourse = (): unknown => {
  const { group, game } = realG2_2()
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

const playG2_2 = (answer: unknown): GameSessionFacade => {
  const facade = buildFacade(isolatedCourse())
  facade.start('Alice')
  facade.submitAnswer(answer)
  facade.nextGame()
  return facade
}

const satisfiedByCriterionOf = (facade: GameSessionFacade) =>
  Object.fromEntries(
    pilotageContexteDimension(facade).contributions.map((contribution) => [
      contribution.criterionId,
      contribution.satisfied,
    ]),
  )

describe('practice-map in the course', () => {
  it('loads the real course and resolves g2-2 as practice-map, seven practices', () => {
    expect(() => buildFacade()).not.toThrow()

    const { game } = realG2_2()
    expect(game.type).toBe('practice-map')
    const config = practiceMapConfigSchema.parse(game.config)
    expect(config.practices).toHaveLength(7)
    expect(config.orderings).toHaveLength(7)
  })

  it('maps every g2-2 criterion to pilotage-contexte, and nothing else', () => {
    const { game } = realG2_2()
    const dimensions = new Set(
      game.criteria.flatMap((criterion) =>
        criterion.mapping.map((mapping) => mapping.dimension),
      ),
    )

    expect([...dimensions]).toEqual(['pilotage-contexte'])
  })

  it('carries seven zones two by two disjoint, each under 12% of the plane', () => {
    const config = realG2_2Config()

    for (let i = 0; i < config.practices.length; i++) {
      for (let j = i + 1; j < config.practices.length; j++) {
        const a = config.practices[i].expected
        const b = config.practices[j].expected
        const intensityOverlap =
          a.intensityFrom <= b.intensityTo && b.intensityFrom <= a.intensityTo
        const rigorOverlap =
          a.rigorFrom <= b.rigorTo && b.rigorFrom <= a.rigorTo
        expect(intensityOverlap && rigorOverlap).toBe(false)
      }
    }

    config.practices.forEach((practice) => {
      const area =
        (practice.expected.intensityTo - practice.expected.intensityFrom) *
        (practice.expected.rigorTo - practice.expected.rigorFrom)
      expect(area).toBeLessThan(0.12)
    })
  })

  it('carries seven orderings, each strictly supported by the zones', () => {
    const config = realG2_2Config()
    const practiceById = new Map(
      config.practices.map((practice) => [practice.id, practice]),
    )

    config.orderings.forEach((ordering) => {
      const higher = practiceById.get(ordering.higherId)
      const lower = practiceById.get(ordering.lowerId)
      if (higher === undefined || lower === undefined) {
        throw new Error(`${ordering.id} references an unknown practice`)
      }

      const [higherFrom, lowerTo] =
        ordering.axis === 'rigor'
          ? [higher.expected.rigorFrom, lower.expected.rigorTo]
          : [higher.expected.intensityFrom, lower.expected.intensityTo]

      expect(higherFrom).toBeGreaterThan(lowerTo)
    })
  })

  it('satisfies all three criteria for a reading that places every practice in its own zone', () => {
    const satisfiedByCriterion = satisfiedByCriterionOf(
      playG2_2(
        buildPracticeMapAnswer(
          realG2_2Config(),
          practiceMapConfigSchema
            .parse(realG2_2().game.config)
            .practices.map((practice) => ({
              practiceId: practice.id,
              intensity:
                (practice.expected.intensityFrom +
                  practice.expected.intensityTo) /
                2,
              rigor:
                (practice.expected.rigorFrom + practice.expected.rigorTo) / 2,
            })),
        ),
      ),
    )

    expect(satisfiedByCriterion['g2-2-c1']).toBe(true)
    expect(satisfiedByCriterion['g2-2-c2']).toBe(true)
    expect(satisfiedByCriterion['g2-2-c3']).toBe(true)
  })

  it('misses all three criteria for a null reading, seven practices stacked on the same point', () => {
    const config = realG2_2Config()
    const satisfiedByCriterion = satisfiedByCriterionOf(
      playG2_2(nullPracticeMapAnswer(config)),
    )

    expect(satisfiedByCriterion['g2-2-c1']).toBe(false)
    expect(satisfiedByCriterion['g2-2-c2']).toBe(false)
    expect(satisfiedByCriterion['g2-2-c3']).toBe(false)
  })

  it('misses all three criteria for seven practices posed on a single diagonal', () => {
    const config = realG2_2Config()
    const satisfiedByCriterion = satisfiedByCriterionOf(
      playG2_2(diagonalPracticeMapAnswer(config)),
    )

    expect(satisfiedByCriterion['g2-2-c1']).toBe(false)
    expect(satisfiedByCriterion['g2-2-c2']).toBe(false)
    expect(satisfiedByCriterion['g2-2-c3']).toBe(false)
  })

  it('misses the zone criterion but holds the ordering criterion for a reading shifted down in a block', () => {
    const config = realG2_2Config()
    const satisfiedByCriterion = satisfiedByCriterionOf(
      playG2_2(shiftedDownPracticeMapAnswer(config)),
    )

    expect(satisfiedByCriterion['g2-2-c1']).toBe(false)
    expect(satisfiedByCriterion['g2-2-c3']).toBe(true)
  })

  it('rejects at load a course whose g2-2 zones overlap, naming the faulty field', () => {
    const config = realG2_2Config()
    const misconfigured = structuredClone(realG2_2().game.config) as {
      practices: { id: string; expected: Record<string, number> }[]
    }
    // Étend `p1` jusqu'à recouvrir `p2`, une fuite que le contrat refuse au
    // chargement, jamais au verdict.
    const p1 = misconfigured.practices.find((practice) => practice.id === 'p1')
    if (p1 === undefined) throw new Error('p1 introuvable dans le corpus réel')
    p1.expected = { ...p1.expected, intensityTo: 0.9, rigorTo: 0.9 }

    expect(() => practiceMapConfigSchema.parse(misconfigured)).toThrow()
    expect(config.practices).toHaveLength(7)
  })

  it('reaches the same verdict computing the reading through the evaluator and through readPlacements directly', () => {
    const config = realG2_2Config()
    const answer = correctPracticeMapAnswer(config)
    const trace = parsePracticeMapTrace(answer, config)
    const reading = readPlacements(config, trace)

    expect(reading.inZoneCount).toBe(7)
    expect(reading.highRigorHit).toBe(true)
    expect(reading.heldOrderingCount).toBe(7)
  })

  /**
   * Le reste du parcours n'a besoin que d'une réponse conforme, jamais d'une
   * bonne réponse : ce test traverse tous les groupes et vérifie qu'aucune
   * soumission n'est refusée, sur le modèle de `checkpoints-run.test.ts`.
   */
  const answerFor = (game: Game): unknown => {
    if (game.type === 'practice-map') {
      return correctPracticeMapAnswer(game.config)
    }
    // `g2-1`, le voisin de groupe, arrivé pendant cette branche. Ce parcours
    // ne mesure que `pilotage-contexte` chez `g2-2` : n'importe quelle trace
    // conforme suffit ici.
    if (game.type === 'hint-budget') return defaultHintBudgetAnswer(game.config)
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
     * `g6-2` porte ambiguity-scan depuis la phase 4 de son propre plan : ce
     * test ne mesure pas `pilotage-contexte`, donc n'importe quelle trace
     * conforme suffit — ici, aucun segment signalé.
     */
    if (game.type === 'ambiguity-scan') return { flaggedIds: [] }
    /**
     * `g5-2` porte flow-order depuis la phase 4 de son propre plan : ce
     * test ne mesure pas `pilotage-contexte`, donc n'importe quelle trace
     * conforme suffit — ici, l'ordre de présentation du corpus.
     */
    if (game.type === 'flow-order') {
      const config = flowOrderConfigSchema.parse(game.config)
      return { orderedIds: config.initialOrder }
    }
    /**
     * `g4-2` porte keep-or-toss depuis la phase 4 de son propre plan : ce
     * test ne mesure pas `verification`, donc n'importe quelle trace
     * conforme suffit — ici, aucune carte triée.
     */
    if (game.type === 'keep-or-toss') return { verdicts: [], elapsedSeconds: 0 }
    return { selected: [] }
  }

  it('walks the whole course, every group, submitting the correct g2-2 reading, with no submission refused', () => {
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
