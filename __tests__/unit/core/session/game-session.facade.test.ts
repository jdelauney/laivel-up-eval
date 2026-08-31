import { beforeEach, describe, expect, it } from 'vitest'
import type { Course } from '../../../../src/core/contracts/course.schema'
import type { Grid } from '../../../../src/core/contracts/grid.schema'
import type { PersistenceSessionAdapter } from '../../../../src/core/ports/persistence-session-adapter.interface'
import { UnknownGameTypeError } from '../../../../src/core/registry/game-registry'
import { WeightedMappingStrategy } from '../../../../src/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { buildGameRegistry } from '../../../../src/games/register-games'
import { FixedClock } from '../../../../src/infrastructure/clock/fixed.adapter'
import {
  buildTestFacade,
  course,
  grid,
  signature,
} from '../../../fixtures/configuration'
import { MemoryPersistence } from '../../../fixtures/memory-persistence'

const buildFacade = (
  persistence: PersistenceSessionAdapter = new MemoryPersistence(),
) => buildTestFacade(persistence)

const goodAnswer = { selected: ['p1', 'p3'] }
const badAnswer = { selected: ['p2', 'p4'] }

/**
 * Un parcours minimal, autonome de `config/`, pour prouver qu'une reprise ne
 * perd pas le détail attribuable qu'un jeu a produit. Les sept zones et les
 * sept relations sont celles, déjà éprouvées, de
 * `__tests__/unit/games/practice-map/evaluator.test.ts` : seuls les libellés
 * changent, pour distinguer un libellé résolu d'un `practiceId` brut.
 */
const practiceMapGrid: Grid = {
  version: 'test',
  title: 'Grille de test',
  dimensions: [{ id: 'taille', label: 'Taille', weight: 1 }],
  levels: [
    {
      id: 'low',
      label: 'Low',
      order: 1,
      conditions: [{ dimension: 'taille', min: 0 }],
      nextLevelHint: 'Monter.',
    },
  ],
}

const zone = (
  intensityFrom: number,
  intensityTo: number,
  rigorFrom: number,
  rigorTo: number,
) => ({ intensityFrom, intensityTo, rigorFrom, rigorTo })

const practiceMapConfig = {
  statement: 'Consigne de test.',
  highRigorFrom: 0.6,
  poles: {
    intensityLow: 'vous le faites',
    intensityHigh: "l'agent le fait seul",
    rigorLow: 'rien ne la vérifie',
    rigorHigh: 'un garde-fou la tient sans vous',
  },
  quadrants: {
    highRigorLowIntensity: 'Outillé, à la main',
    highRigorHighIntensity: 'Outillé, délégué',
    lowRigorLowIntensity: 'À la main, sans filet',
    lowRigorHighIntensity: 'Délégué, sans filet',
  },
  practices: [
    {
      id: 'p1',
      label: 'Relire chaque diff avant de l’accepter',
      shortLabel: 'Relire diff',
      expected: zone(0, 0.1, 0, 0.1),
      marker: 'Repère p1.',
    },
    {
      id: 'p2',
      label: 'Écrire le fichier de contexte du dépôt',
      shortLabel: 'Fichier contexte',
      expected: zone(0.15, 0.25, 0.15, 0.25),
      marker: 'Repère p2.',
    },
    {
      id: 'p3',
      label: 'Brancher une boucle qui relance la commande',
      shortLabel: 'Boucle relance',
      expected: zone(0.3, 0.4, 0.3, 0.4),
      marker: 'Repère p3.',
    },
    {
      id: 'p4',
      label: 'Confier une tâche floue à un agent en autonomie',
      shortLabel: 'Tâche autonome',
      expected: zone(0.45, 0.55, 0.45, 0.55),
      marker: 'Repère p4.',
    },
    {
      id: 'p5',
      label: 'Poser un hook qui bloque le commit et rend la main',
      shortLabel: 'Hook bloquant',
      expected: zone(0.6, 0.7, 0.6, 0.7),
      marker: 'Repère p5.',
    },
    {
      id: 'p6',
      label: 'Écrire la fonction soi-même sans rien demander',
      shortLabel: 'Fonction soi-même',
      expected: zone(0.75, 0.85, 0.75, 0.85),
      marker: 'Repère p6.',
    },
    {
      id: 'p7',
      label: 'Relancer le même prompt sans rien changer',
      shortLabel: 'Relance identique',
      expected: zone(0.9, 1, 0, 0.1),
      marker: 'Repère p7.',
    },
  ],
  orderings: [
    { id: 'o1', axis: 'rigor', higherId: 'p5', lowerId: 'p2' },
    { id: 'o2', axis: 'rigor', higherId: 'p6', lowerId: 'p1' },
    { id: 'o3', axis: 'intensity', higherId: 'p7', lowerId: 'p6' },
    { id: 'o4', axis: 'intensity', higherId: 'p5', lowerId: 'p1' },
    { id: 'o5', axis: 'rigor', higherId: 'p4', lowerId: 'p1' },
    { id: 'o6', axis: 'rigor', higherId: 'p3', lowerId: 'p1' },
    { id: 'o7', axis: 'intensity', higherId: 'p2', lowerId: 'p1' },
  ],
}

const practiceMapCourse: Course = {
  version: 'test',
  groups: [
    {
      id: 'groupe-pratiques',
      label: 'Groupe pratiques',
      order: 1,
      games: [
        {
          id: 'practice-map-1',
          type: 'practice-map',
          label: 'Où placez-vous ces pratiques ?',
          config: practiceMapConfig,
          criteria: [
            {
              id: 'c1',
              question:
                'Assez de pratiques sont-elles situées là où elles se tiennent ?',
              rule: { type: 'placements-in-zone-at-least', threshold: 4 },
              mapping: [
                { dimension: 'taille', weight: 1, evidence: 'measured' },
              ],
            },
          ],
        },
      ],
    },
  ],
}

/** Deux pratiques dans leur zone, cinq posées au même coin, hors de toutes. */
const practiceMapAnswer = () => ({
  placements: [
    { practiceId: 'p1', intensity: 0.05, rigor: 0.05 },
    { practiceId: 'p2', intensity: 0.2, rigor: 0.2 },
    { practiceId: 'p3', intensity: 0.05, rigor: 0.95 },
    { practiceId: 'p4', intensity: 0.05, rigor: 0.95 },
    { practiceId: 'p5', intensity: 0.05, rigor: 0.95 },
    { practiceId: 'p6', intensity: 0.05, rigor: 0.95 },
    { practiceId: 'p7', intensity: 0.05, rigor: 0.95 },
  ],
})

const buildPracticeMapFacade = (
  persistence: PersistenceSessionAdapter = new MemoryPersistence(),
) =>
  new GameSessionFacade({
    registry: buildGameRegistry(),
    scoring: new WeightedMappingStrategy(),
    persistence,
    clock: new FixedClock(),
    grid: practiceMapGrid,
    course: practiceMapCourse,
  })

describe('game session facade', () => {
  let facade: GameSessionFacade

  beforeEach(() => {
    facade = buildFacade()
    facade.start('Alice')
  })

  it('opens a session on the first game of the course', () => {
    const progress = facade.getProgress()

    expect(progress.game?.id).toBe('test-bench-1')
    expect(progress.group?.label).toBe("Banc d'essai du moteur")
    expect(progress.submitted).toBe(0)
    expect(progress.total).toBe(1)
  })

  it('turns a good answer into a level, with the chain that explains it', () => {
    facade.submitAnswer(goodAnswer)

    const { result, level } = facade.getVerdict()

    expect(result.dimension('taille')?.score).toBe(1)
    expect(result.dimension('harness')?.score).toBe(1)
    expect(result.groups[0].games[0].criteria).toHaveLength(2)
    expect(level.level?.id).toBeDefined()
    expect(level.hint).toBe(level.level?.nextLevelHint)
  })

  it('drops the level when the answer misses every criterion', () => {
    facade.submitAnswer(badAnswer)

    const { result, level } = facade.getVerdict()

    expect(result.dimension('taille')?.score).toBe(0)
    expect(level.level?.id).toBe('white')
  })

  it('leaves an unmeasured dimension out of the score, without failing', () => {
    facade.submitAnswer(goodAnswer)

    expect(
      facade.getVerdict().result.dimension('initiative')?.measurement,
    ).toBe('unmeasured')
  })

  it('refuses an answer outside the game contract, leaving no trace', () => {
    expect(() => facade.submitAnswer({ selected: 'p1' })).toThrow()
    expect(facade.auditTrail()).toHaveLength(0)
    expect(facade.getProgress().submitted).toBe(0)
  })

  it('stacks one command per submitted answer', () => {
    facade.submitAnswer(goodAnswer)

    expect(facade.auditTrail()).toHaveLength(1)
    expect(facade.auditTrail()[0].gameId).toBe('test-bench-1')
  })

  it('stamps each submission with the injected clock', () => {
    facade.submitAnswer(goodAnswer)

    expect(facade.auditTrail()[0].submittedAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('keeps the audit trail identical across two runs of the same answers', () => {
    facade.submitAnswer(goodAnswer)

    const other = buildFacade()
    other.start('Alice')
    other.submitAnswer(goodAnswer)

    expect(other.auditTrail()).toEqual(facade.auditTrail())
  })

  it('carries the stored timestamp through a resume, it does not restamp', () => {
    const persistence = new MemoryPersistence()
    const first = buildFacade(persistence)
    first.start('Alice')
    first.submitAnswer(goodAnswer)
    const stamped = first.auditTrail()[0].submittedAt

    const second = buildFacade(persistence)
    second.resume()

    expect(second.auditTrail()[0].submittedAt).toBe(stamped)
  })

  it('reaches the end of the course once the last game is submitted', () => {
    facade.submitAnswer(goodAnswer)
    facade.nextGame()

    expect(facade.getProgress().finished).toBe(true)
  })

  it('resumes a stored session, position and answers included', () => {
    const persistence = new MemoryPersistence()
    const first = buildFacade(persistence)
    first.start('Alice')
    first.submitAnswer(goodAnswer)

    const second = buildFacade(persistence)

    expect(second.resume()).toBe(true)
    expect(second.getProgress().submitted).toBe(1)
    expect(second.auditTrail()).toHaveLength(1)
    expect(second.getVerdict().result.dimension('taille')?.score).toBe(1)
  })

  it('reports nothing to resume when the store is empty', () => {
    expect(buildFacade().resume()).toBe(false)
  })

  it('describes the course shape before any session exists', () => {
    const shape = buildFacade().courseShape()

    expect(shape).toEqual([
      {
        id: 'groupe-banc-essai',
        label: "Banc d'essai du moteur",
        gameCount: 1,
      },
    ])
  })

  it('ignores a stored state that is readable but out of contract', () => {
    const persistence = new MemoryPersistence()
    persistence.write({ playerName: 'Alice' })

    const facade = buildFacade(persistence)

    expect(() => facade.resume()).not.toThrow()
    expect(facade.resume()).toBe(false)
  })

  it('ignores a stored submission whose shape does not hold', () => {
    const persistence = new MemoryPersistence()
    persistence.write({
      playerName: 'Alice',
      groupIndex: 0,
      gameIndex: 0,
      submissions: [{ gameId: 'test-bench-1' }],
    })

    expect(buildFacade(persistence).resume()).toBe(false)
  })

  it('clears the store on reset', () => {
    const persistence = new MemoryPersistence()
    const running = buildFacade(persistence)
    running.start('Alice')
    running.submitAnswer(goodAnswer)
    running.resetSession()

    expect(persistence.read()).toBeUndefined()
    expect(running.hasSession()).toBe(false)
  })

  it('produces the same verdict on two runs of the same answers', () => {
    facade.submitAnswer(goodAnswer)
    const first = facade.getVerdict()

    const other = buildFacade()
    other.start('Alice')
    other.submitAnswer(goodAnswer)

    expect(other.getVerdict()).toEqual(first)
  })

  it('reports no designated repository until one is given', () => {
    expect(facade.designatedRepository()).toBeUndefined()
  })

  it('opens a session under a repository and finds it again on resume', () => {
    const persistence = new MemoryPersistence()
    const played = buildFacade(persistence)
    played.start('Alice', 'alice/atelier')
    played.submitAnswer(goodAnswer)

    const resumed = buildFacade(persistence)

    expect(resumed.resume()).toBe(true)
    expect(resumed.designatedRepository()).toBe('alice/atelier')
    expect(resumed.playerName()).toBe('Alice')
  })

  it('resumes a run stored before the repository field existed', () => {
    const persistence = new MemoryPersistence()
    persistence.write({
      playerName: 'Alice',
      groupIndex: 0,
      gameIndex: 0,
      submissions: [],
    })

    const facadeOnOldStore = buildFacade(persistence)

    expect(facadeOnOldStore.resume()).toBe(true)
    expect(facadeOnOldStore.designatedRepository()).toBeUndefined()
  })

  it('ignores a stored repository that is not normalised', () => {
    const persistence = new MemoryPersistence()
    persistence.write({
      playerName: 'Alice',
      repository: 'https://github.com/alice/atelier',
      groupIndex: 0,
      gameIndex: 0,
      submissions: [],
    })

    const facadeOnBadStore = buildFacade(persistence)

    expect(facadeOnBadStore.resume()).toBe(false)
  })

  it('scores the same verdict with and without a designated repository', () => {
    facade.submitAnswer(goodAnswer)

    const withRepository = buildFacade()
    withRepository.start('Alice', 'alice/atelier')
    withRepository.submitAnswer(goodAnswer)

    expect(withRepository.getVerdict()).toEqual(facade.getVerdict())
  })

  it('refuses a course declaring a game type absent from the registry', () => {
    const ghostCourse: Course = {
      ...course,
      groups: [
        {
          ...course.groups[0],
          games: [{ ...course.groups[0].games[0], type: 'ghost-game' }],
        },
      ],
    }

    expect(
      () =>
        new GameSessionFacade({
          registry: buildGameRegistry(),
          scoring: new WeightedMappingStrategy(),
          persistence: new MemoryPersistence(),
          clock: new FixedClock(),
          grid,
          course: ghostCourse,
          signature,
        }),
    ).toThrow(UnknownGameTypeError)
  })

  it('keeps a criterion attributable detail across a resume, on a new facade over the same storage', () => {
    const persistence = new MemoryPersistence()
    const first = buildPracticeMapFacade(persistence)
    first.start('Alice')
    first.submitAnswer(practiceMapAnswer())

    const second = buildPracticeMapFacade(persistence)
    expect(second.resume()).toBe(true)

    const criterion = second
      .getVerdict()
      .result.allCriteria()
      .find((entry) => entry.criterionId === 'c1')

    expect(criterion?.satisfied).toBe(false)
    expect(criterion?.attributions).toHaveLength(7)
    expect(
      criterion?.attributions?.find(
        (entry) => entry.label === 'Relire chaque diff avant de l’accepter',
      ),
    ).toEqual({ label: 'Relire chaque diff avant de l’accepter', held: true })
    expect(
      criterion?.attributions?.find(
        (entry) =>
          entry.label === 'Poser un hook qui bloque le commit et rend la main',
      ),
    ).toEqual({
      label: 'Poser un hook qui bloque le commit et rend la main',
      held: false,
    })
    // Jamais un `practiceId` brut.
    expect(criterion?.attributions?.some((entry) => entry.label === 'p1')).toBe(
      false,
    )
  })

  it('resumes a run stored before the attributions field existed, leaving them absent', () => {
    const persistence = new MemoryPersistence()
    persistence.write({
      playerName: 'Alice',
      groupIndex: 0,
      gameIndex: 0,
      submissions: [
        {
          gameId: 'practice-map-1',
          answer: practiceMapAnswer(),
          results: [{ criterionId: 'c1', satisfied: false }],
          submittedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })

    const resumed = buildPracticeMapFacade(persistence)
    expect(resumed.resume()).toBe(true)

    const criterion = resumed
      .getVerdict()
      .result.allCriteria()
      .find((entry) => entry.criterionId === 'c1')
    expect(criterion?.attributions).toBeUndefined()
  })

  it('ignores a stored submission whose attribution is out of contract', () => {
    const persistence = new MemoryPersistence()
    persistence.write({
      playerName: 'Alice',
      groupIndex: 0,
      gameIndex: 0,
      submissions: [
        {
          gameId: 'practice-map-1',
          answer: practiceMapAnswer(),
          results: [
            {
              criterionId: 'c1',
              satisfied: false,
              attributions: [{ label: '', held: true }],
            },
          ],
          submittedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })

    expect(buildPracticeMapFacade(persistence).resume()).toBe(false)
  })
})
