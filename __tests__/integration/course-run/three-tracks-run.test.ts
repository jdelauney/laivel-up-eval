import { describe, expect, it } from 'vitest'
import type { Course, Game } from '@/core/contracts/course.schema'
import {
  ConfigValidationError,
  parseConfiguration,
} from '@/core/contracts/helpers/parse-config.helper'
import { WeightedMappingStrategy } from '@/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '@/core/session/game-session.facade'
import { buildCheckpointsAnswer } from '@/games/checkpoints/actions/build-checkpoints-answer.action'
import { checkpointsConfigSchema } from '@/games/checkpoints/schema/config.schema'
import { buildConfidenceBetAnswer } from '@/games/confidence-bet/actions/build-confidence-bet-answer.action'
import { confidenceBetConfigSchema } from '@/games/confidence-bet/schema/config.schema'
import { buildDefectHuntAnswer } from '@/games/defect-hunt/actions/build-defect-hunt-answer.action'
import { defectHuntConfigSchema } from '@/games/defect-hunt/schema/config.schema'
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
 * Le jeu traverse le moteur de production : le vrai parcours, la vraie grille,
 * le vrai registre, la vraie façade. Seules l'horloge et la persistance sont
 * doublées, parce qu'elles sortent du domaine — aucune branche réservée aux
 * tests.
 *
 * Les six parties rejouées ici sont celles vérifiées à la main contre le
 * moteur de la phase 1, consignées dans `phase-4.md` : le tableau est le
 * contrat, ce fichier le reproduit.
 */

const THREE_TRACKS_GAME_ID = 'g7-2'

type PlayedTurn = Readonly<Record<string, number>>

const clone = (course: unknown): Course =>
  JSON.parse(JSON.stringify(course)) as Course

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

/**
 * Le reste du parcours n'a besoin que d'une réponse conforme, jamais d'une
 * bonne réponse : ce test mesure `parallele`, pas les autres axes. Seul le jeu
 * `g7-2` porte l'allocation qui décide de la partie jouée.
 */
const answerFor = (game: Game, allocation: readonly PlayedTurn[]): unknown => {
  if (game.type === 'three-tracks') {
    return buildThreeTracksAnswer(
      threeTracksConfigSchema.parse(game.config),
      allocation,
    )
  }
  if (game.type === 'checkpoints') {
    const config = checkpointsConfigSchema.parse(game.config)
    return buildCheckpointsAnswer(
      config,
      config.stages.map(() => 'laisser-passer'),
    )
  }
  /**
   * `g1-1` porte confidence-bet depuis la phase 4 de son propre plan : ce
   * test mesure `parallele`, jamais `verification`, donc n'importe quelle
   * trace conforme suffit. Chaque extrait reçoit explicitement la mise
   * neutre — le constructeur refuse un extrait sans mise, il ne comble
   * jamais un trou.
   */
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
  /**
   * `g1-2` porte defect-hunt depuis la phase 4 de son propre plan : ce test
   * mesure `parallele`, jamais `verification`, donc n'importe quelle trace
   * conforme suffit — ici, une revue qui ne marque aucune ligne, rendue
   * instantanément.
   */
  if (game.type === 'defect-hunt') {
    const config = defectHuntConfigSchema.parse(game.config)
    return buildDefectHuntAnswer(config, [], 0)
  }
  /**
   * `g1-3` porte lie-detector depuis la phase 4 de son propre plan : ce test
   * mesure `parallele`, jamais `verification`, donc n'importe quelle trace
   * conforme suffit — voir `defaultLieDetectorAnswer`.
   */
  if (game.type === 'lie-detector') return defaultLieDetectorAnswer(game.config)
  return { selected: [] }
}

const playWholeCourse = (
  allocation: readonly PlayedTurn[],
  facade = buildFacade(),
): GameSessionFacade => {
  facade.start('Alice')

  let progress = facade.getProgress()
  while (progress.game !== undefined) {
    facade.submitAnswer(answerFor(progress.game, allocation))
    facade.nextGame()
    progress = facade.getProgress()
  }

  return facade
}

const paralleleDimension = (facade: GameSessionFacade) => {
  const dimension = facade
    .getVerdict()
    .result.dimensions.find((entry) => entry.dimensionId === 'parallele')

  if (dimension === undefined) throw new Error('parallele is not scored')
  return dimension
}

/**
 * Les neuf parties du tableau de `phase-4.md`, reconstruites en allocations
 * d'attention tour par tour. Chaque partie a été rejouée dans
 * `run-simulation.helper.ts` avant d'être écrite ici : les chiffres qu'elle
 * rend (mergés, perdus, médiane) sont ceux du tableau, pas un arrondi.
 */

/** Rotation soignée : les trois chantiers menés au merge tournent, le quatrième est visité assez pour ne jamais mourir. */
const ROTATION_SOIGNEE: PlayedTurn[] = [
  { migration: 1, panier: 1, 'api-v2': 1 },
  { migration: 1, panier: 1, 'api-v2': 1 },
  { migration: 1, panier: 1, affichage: 1 },
  { migration: 1, panier: 1, 'api-v2': 1 },
  { panier: 1, 'api-v2': 2 },
  { affichage: 1 },
  {},
]

/** Une unité partout, à tour de rôle : chaque tour sert trois des quatre chantiers, en changeant lequel est laissé de côté. */
const UNE_UNITE_PARTOUT: PlayedTurn[] = [
  { migration: 1, panier: 1, 'api-v2': 1 },
  { migration: 1, panier: 1, affichage: 1 },
  { migration: 1, 'api-v2': 1, affichage: 1 },
  { panier: 1, 'api-v2': 1, affichage: 1 },
  { migration: 1, panier: 1, 'api-v2': 1 },
  { migration: 1, panier: 1, affichage: 1 },
  { migration: 1, 'api-v2': 1, affichage: 1 },
]

/** Deux chantiers à la fois, en série : l'attention se concentre sur une paire, puis passe à la suivante. */
const DEUX_A_LA_FOIS_EN_SERIE: PlayedTurn[] = [
  { migration: 2, panier: 1 },
  { migration: 2, panier: 1 },
  { panier: 2, affichage: 1 },
  { panier: 1, 'api-v2': 2 },
  { 'api-v2': 2, affichage: 1 },
  { 'api-v2': 2, affichage: 1 },
  {},
]

/** Étale, mais en perd un : trois chantiers reçoivent une unité chacun, le quatrième n'en reçoit jamais et meurt de négligence. */
const ETALE_EN_PERD_UN: PlayedTurn[] = [
  { migration: 1, panier: 1, 'api-v2': 1 },
  { migration: 1, panier: 1, 'api-v2': 1 },
  { migration: 1, panier: 1, 'api-v2': 1 },
  { migration: 1, panier: 1, 'api-v2': 1 },
  { panier: 1, 'api-v2': 1 },
  { panier: 1, 'api-v2': 1 },
  {},
]

/** Ouvre quatre, en lâche trois : deux chantiers mènent au merge, les deux autres ne sont jamais servis et meurent tôt. */
const OUVRE_QUATRE_EN_LACHE_TROIS: PlayedTurn[] = [
  { migration: 2, panier: 1 },
  { migration: 2, panier: 1 },
  { panier: 2 },
  { panier: 1 },
  {},
  {},
  {},
]

/** Ne place rien de la partie : aucune unité d'attention posée sur aucun tour. */
const NE_PLACE_RIEN: PlayedTurn[] = [{}, {}, {}, {}, {}, {}, {}]

/**
 * Ne place rien, ne perd rien : une seule unité par tour, en rotation sur les
 * quatre chantiers, jamais assez pour en merger un, toujours assez pour
 * qu'aucun ne meure. Le meilleur score atteignable sans le moindre merge — la
 * médiane et le garde-fou seuls, aucun palier de merge.
 */
const ROTATION_MINIMALE: PlayedTurn[] = [
  { migration: 1 },
  { panier: 1 },
  { 'api-v2': 1 },
  { affichage: 1 },
  { migration: 1 },
  { panier: 1 },
  { 'api-v2': 1 },
]

/**
 * Un merge, trois pertes : toute l'attention va sur `migration` jusqu'à son
 * merge au tour 2, les trois autres chantiers ne reçoivent jamais rien et
 * meurent de négligence. Le pire score atteignable avec un seul merge.
 */
const UN_MERGE_TROIS_PERTES: PlayedTurn[] = [
  { migration: 2 },
  { migration: 2 },
  {},
  {},
  {},
  {},
  {},
]

/**
 * Un merge, rien de perdu : `migration` est mené au merge dès le tour 2, le
 * reste de l'attention tourne juste assez sur les trois autres chantiers
 * pour qu'aucun ne dérive jusqu'à la mort ni ne merge à son tour.
 */
const UN_MERGE_RIEN_PERDU: PlayedTurn[] = [
  { migration: 2, panier: 1 },
  { migration: 2, 'api-v2': 1 },
  { affichage: 1 },
  { panier: 1 },
  { 'api-v2': 1 },
  { affichage: 1 },
  {},
]

const TABLE_FROM_PHASE_4 = [
  {
    name: 'Ne place rien, ne perd rien (rotation minimale)',
    allocation: ROTATION_MINIMALE,
    score: 0.25,
    band: 'aucun',
  },
  {
    name: 'Ne place jamais rien',
    allocation: NE_PLACE_RIEN,
    score: 0,
    band: 'aucun',
  },
  {
    name: '1 merge, trois pertes',
    allocation: UN_MERGE_TROIS_PERTES,
    score: 0.375,
    band: '1 chantier',
  },
  {
    name: 'Ouvre quatre, en lâche trois',
    allocation: OUVRE_QUATRE_EN_LACHE_TROIS,
    score: 0.375,
    band: '1 chantier',
  },
  {
    name: '1 merge, rien de perdu',
    allocation: UN_MERGE_RIEN_PERDU,
    score: 0.625,
    band: '1 chantier',
  },
  {
    name: 'Étale, mais en perd un',
    allocation: ETALE_EN_PERD_UN,
    score: 0.875,
    band: '2 chantiers',
  },
  {
    name: 'Rotation soignée',
    allocation: ROTATION_SOIGNEE,
    score: 1,
    band: '3 chantiers et plus',
  },
  {
    name: 'Une unité partout, à tour de rôle',
    allocation: UNE_UNITE_PARTOUT,
    score: 1,
    band: '3 chantiers et plus',
  },
  {
    name: 'Deux chantiers à la fois, en série',
    allocation: DEUX_A_LA_FOIS_EN_SERIE,
    score: 1,
    band: '3 chantiers et plus',
  },
] as const

describe('three-tracks in the course', () => {
  it('loads the augmented course and resolves every declared game type', () => {
    expect(() => buildFacade()).not.toThrow()
  })

  it.each(TABLE_FROM_PHASE_4)(
    'scores "$name" at $score, band "$band"',
    ({ allocation, score, band }) => {
      const dimension = paralleleDimension(playWholeCourse(allocation))

      expect(dimension.score).toBeCloseTo(score, 3)
      expect(dimension.band).toBe(band)
    },
  )

  it('reaches the top band by three different routes: the axis measures a practice, not one solution', () => {
    const routes = [
      ROTATION_SOIGNEE,
      UNE_UNITE_PARTOUT,
      DEUX_A_LA_FOIS_EN_SERIE,
    ]

    for (const route of routes) {
      const dimension = paralleleDimension(playWholeCourse(route))
      expect(dimension.score).toBe(1)
      expect(dimension.band).toBe('3 chantiers et plus')
    }
  })

  it('makes merges dominate the score: the best score without a single merge stays below the worst score with one', () => {
    const bestWithoutAMerge = paralleleDimension(
      playWholeCourse(ROTATION_MINIMALE),
    )
    const worstWithAMerge = paralleleDimension(
      playWholeCourse(UN_MERGE_TROIS_PERTES),
    )

    expect(bestWithoutAMerge.score).toBeCloseTo(0.25, 3)
    expect(worstWithAMerge.score).toBeCloseTo(0.375, 3)
    expect(bestWithoutAMerge.score).toBeLessThan(worstWithAMerge.score)
  })

  it('holds the guard rail: three merges with one lost track never reach the top band, at equal merge count', () => {
    const noLoss = paralleleDimension(playWholeCourse(UNE_UNITE_PARTOUT))
    const oneLoss = paralleleDimension(playWholeCourse(ETALE_EN_PERD_UN))

    expect(noLoss.contributions.filter((c) => c.satisfied)).toHaveLength(4)
    expect(oneLoss.band).not.toBe(noLoss.band)
    expect(oneLoss.band).toBe('2 chantiers')
    expect(oneLoss.score).toBeLessThan(noLoss.score)
  })

  it('falls to one third when four tracks are opened and three are dropped, despite two merges showing', () => {
    const dimension = paralleleDimension(
      playWholeCourse(OUVRE_QUATRE_EN_LACHE_TROIS),
    )

    expect(dimension.band).toBe('1 chantier')
    expect(dimension.band).not.toBe('3 chantiers et plus')
  })

  it('measures parallele at the end of the run instead of capping the announceable level', () => {
    const played = paralleleDimension(playWholeCourse(NE_PLACE_RIEN))

    expect(played.measured).toBe(true)
    expect(played.possible).toBeGreaterThan(0)
  })

  it('refuses at load a game configuration that falls outside its own contract', () => {
    const invalid = clone(projectCourse)
    invalid.groups[6].games[1].criteria[0].mapping[0].dimension = 'inconnue'

    expect(() => buildFacade(invalid)).toThrow(ConfigValidationError)
    try {
      buildFacade(invalid)
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigValidationError)
      expect((error as ConfigValidationError).field).toContain(
        'groups[6].games[1]',
      )
    }
  })

  it('resumes on the same game after a reload in the middle of the group', () => {
    const persistence = new MemoryPersistence()
    const facade = buildFacade(projectCourse, persistence)
    facade.start('Alice')

    let progress = facade.getProgress()
    while (
      progress.game !== undefined &&
      progress.game.id !== THREE_TRACKS_GAME_ID
    ) {
      facade.submitAnswer(answerFor(progress.game, NE_PLACE_RIEN))
      facade.nextGame()
      progress = facade.getProgress()
    }

    const reloaded = buildFacade(projectCourse, persistence)

    expect(reloaded.resume()).toBe(true)
    expect(reloaded.getProgress().game?.id).toBe(THREE_TRACKS_GAME_ID)
  })
})
