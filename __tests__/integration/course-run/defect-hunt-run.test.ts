import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { parseConfiguration } from '@/core/contracts/helpers/parse-config.helper'
import { WeightedMappingStrategy } from '@/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '@/core/session/game-session.facade'
import { buildDefectHuntAnswer } from '@/games/defect-hunt/actions/build-defect-hunt-answer.action'
import {
  type DefectHuntConfig,
  defectHuntConfigSchema,
} from '@/games/defect-hunt/schema/config.schema'
import { buildGameRegistry } from '@/games/register-games'
import { FixedClock } from '@/infrastructure/clock/fixed.adapter'
import projectCourse from '../../../config/course.json'
import projectGrid from '../../../config/grid.json'
import projectSignature from '../../../config/signature.json'
import { MemoryPersistence } from '../../fixtures/memory-persistence'

/**
 * Le jeu traverse le moteur réel : le vrai registre, la vraie façade, la
 * vraie stratégie de pondération, et le barème réel de `g1-2` extrait de
 * `config/course.json`. `verification` vit dans la signature, pas dans la
 * grille officielle — `getVerdict().signature`, jamais `.result`.
 *
 * Le tableau des quatre profils tient sur `g1-2` seul, isolé dans son propre
 * parcours à un jeu : dans le parcours réel, `g1-1`, `g1-3`, `g4-1` et `g4-2`
 * visent aussi `verification`, et leur contribution brouillerait les
 * chiffres du tableau, qui sont ceux de `g1-2` seul. Le chargement du
 * parcours complet — la config de `g1-2` passant son propre schéma, le
 * registre résolvant son type — est vérifié séparément, à la fin de ce
 * fichier.
 */

const G1_2_GAME_ID = 'g1-2'

const realG1_2 = () => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === G1_2_GAME_ID),
  )
  const game = group?.games.find((entry) => entry.id === G1_2_GAME_ID)
  if (group === undefined || game === undefined) {
    throw new Error(`${G1_2_GAME_ID} introuvable dans le parcours réel`)
  }
  return { group, game }
}

const realG1_2Config = (): DefectHuntConfig =>
  defectHuntConfigSchema.parse(realG1_2().game.config)

const isolatedCourse = (): unknown => {
  const { group, game } = realG1_2()
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

const verificationDimension = (facade: GameSessionFacade) => {
  const dimension = facade
    .getVerdict()
    .signature?.dimensions.find((entry) => entry.dimensionId === 'verification')

  if (dimension === undefined) throw new Error('verification is not scored')
  return dimension
}

const playG1_2 = (
  markedLines: readonly number[],
  elapsedSeconds: number,
): GameSessionFacade => {
  const facade = buildFacade(isolatedCourse())
  facade.start('Alice')
  facade.submitAnswer(
    buildDefectHuntAnswer(realG1_2Config(), markedLines, elapsedSeconds),
  )
  facade.nextGame()
  return facade
}

/**
 * Les lignes du corpus réel de `config/course.json` : cinq défauts, sur les
 * lignes 2 (dépendance hallucinée), 12 (sécurité), 15 (ressource), 17
 * (contrat) et 18 (logique). Les autres lignes de l'extrait de vingt-cinq
 * lignes sont saines.
 *
 * Chacune de ces cinq lignes se suffit à elle-même : aucun défaut n'est posé
 * à l'intérieur d'une construction qui s'étale sur plusieurs lignes. Sans
 * cette contrainte, un joueur qui lit juste mais clique la ligne voisine
 * encaisserait à la fois un faux positif et un défaut manqué, et le jeu
 * mesurerait la devinette du découpage plutôt que la lecture.
 */
const DEFECT_LINES = {
  dependency: 2,
  security: 12,
  resource: 15,
  contract: 17,
  logic: 18,
}
const ALL_LINES = Array.from({ length: 25 }, (_, index) => index + 1)

/** Quatre défauts sur cinq, dépendance comprise, une marque posée à côté. */
const FOUR_OF_FIVE_WITH_DEPENDENCY = [
  DEFECT_LINES.dependency,
  DEFECT_LINES.security,
  DEFECT_LINES.resource,
  DEFECT_LINES.contract,
  1,
]

/** Quatre défauts sur cinq, la dépendance manquée : le lecteur de motifs. */
const FOUR_OF_FIVE_WITHOUT_DEPENDENCY = [
  DEFECT_LINES.security,
  DEFECT_LINES.resource,
  DEFECT_LINES.contract,
  DEFECT_LINES.logic,
  1,
]

/** Cinq défauts sur cinq, et toutes les lignes saines marquées en plus. */
const EVERY_LINE = ALL_LINES

const TABLE_FROM_PHASE_4 = [
  {
    name: 'Le relecteur',
    markedLines: FOUR_OF_FIVE_WITH_DEPENDENCY,
    elapsedSeconds: 100,
    satisfied: { c1: true, c2: true, c3: true, c4: true },
  },
  {
    name: 'Le lecteur de motifs',
    markedLines: FOUR_OF_FIVE_WITHOUT_DEPENDENCY,
    elapsedSeconds: 100,
    satisfied: { c1: true, c2: true, c3: false, c4: true },
  },
  {
    name: 'Le saturateur',
    markedLines: EVERY_LINE,
    elapsedSeconds: 100,
    satisfied: { c1: true, c2: false, c3: true, c4: true },
  },
  {
    name: 'Le lent',
    markedLines: FOUR_OF_FIVE_WITH_DEPENDENCY,
    elapsedSeconds: 200,
    satisfied: { c1: true, c2: true, c3: true, c4: false },
  },
] as const

describe('defect-hunt in the course', () => {
  it.each(TABLE_FROM_PHASE_4)(
    'scores "$name" as the table decides',
    ({ markedLines, elapsedSeconds, satisfied }) => {
      const dimension = verificationDimension(
        playG1_2(markedLines, elapsedSeconds),
      )

      const satisfiedByCriterion = Object.fromEntries(
        dimension.contributions.map((contribution) => [
          contribution.criterionId,
          contribution.satisfied,
        ]),
      )

      expect(satisfiedByCriterion['g1-2-c1']).toBe(satisfied.c1)
      expect(satisfiedByCriterion['g1-2-c2']).toBe(satisfied.c2)
      expect(satisfiedByCriterion['g1-2-c3']).toBe(satisfied.c3)
      expect(satisfiedByCriterion['g1-2-c4']).toBe(satisfied.c4)
    },
  )

  it('separates the four profiles exactly as the table decides: each misses only its own criterion', () => {
    const relecteur = verificationDimension(
      playG1_2(FOUR_OF_FIVE_WITH_DEPENDENCY, 100),
    )
    const lecteurDeMotifs = verificationDimension(
      playG1_2(FOUR_OF_FIVE_WITHOUT_DEPENDENCY, 100),
    )
    const saturateur = verificationDimension(playG1_2(EVERY_LINE, 100))
    const lent = verificationDimension(
      playG1_2(FOUR_OF_FIVE_WITH_DEPENDENCY, 200),
    )

    // Le relecteur satisfait tout : il porte le score le plus haut.
    expect(relecteur.score).toBe(1)
    // Les trois autres manquent chacun exactement un poids de deux sur sept,
    // sauf le lent qui ne manque que le poids d'un sur sept — le seul
    // critère qui pèse 1 dans le barème de `g1-2`.
    expect(lecteurDeMotifs.score).toBeCloseTo(5 / 7, 3)
    expect(saturateur.score).toBeCloseTo(5 / 7, 3)
    expect(lent.score).toBeCloseTo(6 / 7, 3)
  })

  it('loads the real course and opens the Jugement critique group on the second situation, defect-hunt', () => {
    expect(() => buildFacade()).not.toThrow()

    const { game } = realG1_2()
    expect(game.type).toBe('defect-hunt')
    expect(() => defectHuntConfigSchema.parse(game.config)).not.toThrow()
  })

  it('maps every g1-2 criterion to verification, and nothing else', () => {
    const { game } = realG1_2()
    const dimensions = new Set(
      game.criteria.flatMap((criterion) =>
        criterion.mapping.map((mapping) => mapping.dimension),
      ),
    )

    expect([...dimensions]).toEqual(['verification'])
  })

  it('carries no threshold of its own on the time criterion: it reads the configured budget', () => {
    const { game } = realG1_2()
    const timeCriterion = game.criteria.find(
      (criterion) => criterion.id === 'g1-2-c4',
    )

    expect(timeCriterion?.rule).toEqual({ type: 'within-time-budget' })
  })

  it('keeps the statement silent about the defect count, the thresholds and the budget', () => {
    const { game } = realG1_2()
    const statement = (
      game.config as { statement: string }
    ).statement.toLowerCase()

    expect(statement).not.toMatch(
      /\bcinq\b|\b5\b|80\s?%|\b2\b|180|trois minutes|sécurité|logique|hallucin/,
    )
  })

  it('still satisfies the ratio criterion when a defect out of five is missed: the threshold is a proportion, not perfection', () => {
    const missesOneDefect = [
      DEFECT_LINES.dependency,
      DEFECT_LINES.security,
      DEFECT_LINES.resource,
      DEFECT_LINES.contract,
    ]

    const dimension = verificationDimension(playG1_2(missesOneDefect, 100))
    const ratioSatisfied = dimension.contributions.find(
      (c) => c.criterionId === 'g1-2-c1',
    )?.satisfied

    expect(ratioSatisfied).toBe(true)
  })

  /**
   * Le garde-fou le plus probable de tout le lot (cf. les points de
   * vigilance du cadrage) : chaque numéro de ligne déclaré doit tomber sur
   * le contenu réel que son `reveal` décrit, vérifié contre la chaîne
   * découpée aux `\n`, jamais contre une intention.
   */
  it('locks the corpus: each declared defect lands on a line whose content matches what its reveal describes', () => {
    const config = realG1_2Config()
    const lines = config.snippet.code.split('\n')

    const expectedSubstringByKind: Record<string, string> = {
      'hallucinated-dependency': 'express-query-guard',
      security: 'SELECT',
      resource: 'return',
      contract: 'Number(req.query.page)',
      logic: 'page * PAGE_SIZE',
    }

    config.defects.forEach((defect) => {
      const lineContent = lines[defect.line - 1]
      expect(lineContent).toContain(expectedSubstringByKind[defect.kind])
    })
  })

  /**
   * Le garde-fou d'équité du corpus : un défaut posé au milieu d'un appel ou
   * d'un bloc qui s'étale sur plusieurs lignes ferait payer deux fois — un
   * faux positif et un défaut manqué — un joueur qui a lu juste mais cliqué
   * la ligne voisine. Chaque ligne fautive doit donc porter à elle seule une
   * instruction complète, ce qui se lit à son équilibre de parenthèses et
   * d'accolades.
   */
  it('locks the corpus: every defect line carries a self-contained statement', () => {
    const config = realG1_2Config()
    const lines = config.snippet.code.split('\n')

    const isBalanced = (line: string): boolean => {
      const opening = (line.match(/[([{]/g) ?? []).length
      const closing = (line.match(/[)\]}]/g) ?? []).length
      return opening === closing
    }

    config.defects.forEach((defect) => {
      expect(isBalanced(lines[defect.line - 1] ?? '')).toBe(true)
    })
  })

  it('covers security, logic and the hallucinated dependency, and declares at least five defects', () => {
    const config = realG1_2Config()
    const kinds = new Set(config.defects.map((defect) => defect.kind))

    expect(kinds.has('security')).toBe(true)
    expect(kinds.has('logic')).toBe(true)
    expect(kinds.has('hallucinated-dependency')).toBe(true)
    expect(config.defects.length).toBeGreaterThanOrEqual(5)
  })
})
