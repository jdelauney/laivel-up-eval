import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { parseConfiguration } from '@/core/contracts/helpers/parse-config.helper'
import { WeightedMappingStrategy } from '@/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '@/core/session/game-session.facade'
import { buildDefectHuntAnswer } from '@/games/defect-hunt/actions/build-defect-hunt-answer.action'
import { snippetLines } from '@/games/defect-hunt/helpers/snippet-lines.helper'
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
 * lignes 2 (dépendance hallucinée), 9 (contrat), 10 (logique), 14 (sécurité)
 * et 17 (ressource). Les autres lignes de l'extrait sont saines.
 *
 * Deux contraintes tiennent l'équité de ce corpus, et elles sont toutes deux
 * verrouillées plus bas :
 *
 * 1. Chaque ligne fautive se suffit à elle-même — aucun défaut posé à
 *    l'intérieur d'une construction qui s'étale sur plusieurs lignes.
 * 2. Chaque défaut n'a qu'une seule ligne naturelle où un relecteur le
 *    signalerait. La première écriture posait la fuite de connexion sur le
 *    retour anticipé alors que le geste naturel visait l'appel à `release`
 *    plus bas ; un joueur qui lisait juste encaissait alors un faux positif
 *    ET un défaut manqué. Le jeu mesurait la devinette du découpage.
 */
const DEFECT_LINES = {
  dependency: 2,
  contract: 9,
  logic: 10,
  security: 14,
  resource: 17,
}

/**
 * Dérivé de l'extrait réel, jamais figé : un corpus réécrit plus long
 * laisserait passer un « saturateur » qui ne saturerait plus rien.
 */
const allLines = (config: DefectHuntConfig): number[] =>
  snippetLines(config.snippet.code).map((_, index) => index + 1)

/** Une ligne saine de l'extrait, celle du premier import. */
const FALSE_POSITIVE_LINE = 3

/**
 * Quatre défauts sur cinq, dépendance comprise, une marque posée à côté.
 * Score net : quatre bonnes réponses moins une mauvaise, soit trois — le
 * seuil exact du premier critère.
 */
const FOUR_OF_FIVE_WITH_DEPENDENCY = [
  DEFECT_LINES.dependency,
  DEFECT_LINES.security,
  DEFECT_LINES.resource,
  DEFECT_LINES.contract,
  FALSE_POSITIVE_LINE,
]

/** Quatre défauts sur cinq, la dépendance manquée : le lecteur de motifs. */
const FOUR_OF_FIVE_WITHOUT_DEPENDENCY = [
  DEFECT_LINES.security,
  DEFECT_LINES.resource,
  DEFECT_LINES.contract,
  DEFECT_LINES.logic,
  FALSE_POSITIVE_LINE,
]

/** Cinq défauts sur cinq, et toutes les lignes saines marquées en plus. */
const EVERY_LINE = allLines(realG1_2Config())

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
    // Marquer tout l'extrait rend cinq bonnes réponses et dix-neuf mauvaises :
    // le score net plonge, alors que la couverture reste pleine. C'est le
    // barème seul qui ferme la saturation, sans critère dédié.
    name: 'Le saturateur',
    markedLines: EVERY_LINE,
    elapsedSeconds: 100,
    satisfied: { c1: false, c2: true, c3: true, c4: true },
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

  /**
   * Le cinquième profil, et le plus important : celui qui lit bien.
   *
   * Un relecteur méticuleux trouve les cinq défauts ET signale deux lignes
   * que le corpus ne déclare pas — un point de style, une lecture discutable.
   * Il doit sortir avec le score plein. S'il n'y arrive pas, le jeu
   * récompense celui qui s'arrête au nombre annoncé plutôt que celui qui
   * lit, ce qui est l'inverse exact de ce que la story mesure.
   *
   * C'est le test qui tient la contrainte de rédaction du corpus : au plus
   * deux lignes saines peuvent rester légitimement signalables. La première
   * écriture en portait quatre, et ce profil sortait au score du saturateur.
   */
  it('rewards the exhaustive reviewer: five found plus two debatable marks keeps a full score', () => {
    const exhaustif = verificationDimension(
      playG1_2([...Object.values(DEFECT_LINES), FALSE_POSITIVE_LINE, 1], 100),
    )

    expect(exhaustif.score).toBe(1)
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
      (contribution) => contribution.criterionId === 'g1-2-c2',
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
    const lines = snippetLines(config.snippet.code)

    const expectedSubstringByKind: Record<string, string> = {
      'hallucinated-dependency': 'express-query-guard',
      contract: 'Number(req.query.page)',
      logic: 'page * PAGE_SIZE',
      security: 'req.params.owner',
      resource: 'client.release',
    }

    config.defects.forEach((defect) => {
      const lineContent = lines[defect.line - 1]
      expect(lineContent).toContain(expectedSubstringByKind[defect.kind])

      /**
       * Le marqueur d'un défaut n'apparaît qu'une fois dans tout l'extrait.
       * S'il apparaissait deux fois, le défaut aurait deux domiciles
       * plausibles, et le joueur qui le diagnostique correctement mais
       * clique l'autre encaisserait un faux positif ET un défaut manqué.
       * C'est exactement ce que la première écriture du corpus faisait avec
       * la fuite de connexion, déclarée sur le retour anticipé quand le
       * geste naturel visait l'appel à `release`.
       */
      const homes = lines.filter((line) =>
        line.includes(expectedSubstringByKind[defect.kind]),
      )
      expect(homes).toHaveLength(1)
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
    const lines = snippetLines(config.snippet.code)

    const isBalanced = (line: string): boolean => {
      const opening = (line.match(/[([{]/g) ?? []).length
      const closing = (line.match(/[)\]}]/g) ?? []).length
      return opening === closing
    }

    config.defects.forEach((defect) => {
      expect(isBalanced(lines[defect.line - 1] ?? '')).toBe(true)
    })
  })

  it('covers security, logic and the hallucinated dependency, and declares exactly five defects', () => {
    const config = realG1_2Config()
    const kinds = new Set(config.defects.map((defect) => defect.kind))

    expect(kinds.has('security')).toBe(true)
    expect(kinds.has('logic')).toBe(true)
    expect(kinds.has('hallucinated-dependency')).toBe(true)

    /**
     * Exactement cinq, pas « au moins cinq ». Les trois premiers profils du
     * tableau se posent sur `4 / 5 = 0,80`, la borne exacte du critère de
     * ratio : à six défauts, `4 / 6 = 0,67` les ferait tous échouer et le
     * tableau cesserait de dire ce qu'il prétend. Allonger le corpus est
     * possible, mais alors les profils se dérivent de `defects.length` et
     * ce test change avec eux — il ne doit pas laisser passer l'écart en
     * silence.
     */
    expect(config.defects).toHaveLength(5)
  })
})
