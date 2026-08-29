import { CommandHistory } from '../commands/history.command'
import { SubmitAnswerCommand } from '../commands/submit-answer.command'
import type { Course, Game } from '../contracts/course.schema'
import type { Grid } from '../contracts/grid.schema'
import type { RepositorySlug } from '../contracts/repository-slug.schema'
import {
  type SessionSnapshot,
  sessionSnapshotSchema,
} from '../contracts/session-snapshot.schema'
import {
  buildGameOutcome,
  buildGroupOutcome,
  type CriterionOutcome,
  EvaluationResult,
  type GroupOutcome,
} from '../entities/evaluation-result.entity'

import { GameSession } from '../entities/game-session.entity'
import type { Clock } from '../ports/clock.interface'
import type { PersistenceSessionAdapter } from '../ports/persistence-session-adapter.interface'

import type {
  DimensionScore,
  ScoringStrategy,
} from '../ports/scoring-strategy.interface'
import type { GameRegistry } from '../registry/game-registry'
import {
  type LevelVerdict,
  resolveLevel,
} from '../scoring/helpers/level-resolver.helper'

/**
 * Le seul point d'entrée applicatif. Il cache le registre, les évaluateurs, le
 * scoring et la persistance : l'interface ne parle qu'à lui, et le rejeu
 * emprunte exactement le même chemin.
 */

export type Progress = {
  group: { id: string; label: string; index: number; total: number } | undefined
  game: Game | undefined
  submitted: number
  total: number
  finished: boolean
}

export type Verdict = {
  result: EvaluationResult
  level: LevelVerdict
  /**
   * La seconde lecture des mêmes critères, quand une signature est câblée.
   * Elle décrit la rigueur du flux ; elle ne pèse sur aucun niveau officiel.
   */
  signature: SignatureReading | undefined
}

export type SignatureReading = {
  level: LevelVerdict
  dimensions: readonly DimensionScore[]
}

/**
 * Sept dépendances passées à la suite se confondent à l'appel. L'objet nommé
 * les rend lisibles au câblage et permet d'en ajouter une — la signature — sans
 * réécrire chaque site de construction.
 */
export type SessionDependencies = {
  registry: GameRegistry
  scoring: ScoringStrategy
  persistence: PersistenceSessionAdapter
  clock: Clock
  grid: Grid
  course: Course
  signature?: Grid | undefined
}

export class NoActiveSessionError extends Error {
  constructor() {
    super('aucune session ouverte')
    this.name = 'NoActiveSessionError'
  }
}

export class GameSessionFacade {
  private readonly registry: GameRegistry
  private readonly scoring: ScoringStrategy
  private readonly persistence: PersistenceSessionAdapter
  private readonly clock: Clock
  private readonly grid: Grid
  private readonly course: Course
  private readonly signature: Grid | undefined
  private readonly history: CommandHistory
  private session: GameSession | undefined

  constructor(dependencies: SessionDependencies) {
    this.registry = dependencies.registry
    this.scoring = dependencies.scoring
    this.persistence = dependencies.persistence
    this.clock = dependencies.clock
    this.grid = dependencies.grid
    this.course = dependencies.course
    this.signature = dependencies.signature
    this.history = new CommandHistory()
    this.assertEveryGameTypeIsRegistered()
  }

  /**
   * Un type déclaré dans les données mais absent du registre est signalé ici,
   * au câblage, et jamais ignoré en silence au milieu d'un parcours.
   */
  private assertEveryGameTypeIsRegistered(): void {
    for (const group of this.course.groups) {
      for (const game of group.games) {
        this.registry.resolve(game.type)
      }
    }
  }

  start(playerName: string, repository?: RepositorySlug | undefined): void {
    this.session = new GameSession(this.course, playerName, repository)
    this.history.clear()
    this.persistence.write(this.session.snapshot())
  }

  /**
   * La forme du parcours, avant qu'aucune session n'existe : ce que l'accueil
   * montre pour dire de quoi l'évaluation est faite.
   */
  courseShape(): { id: string; label: string; gameCount: number }[] {
    return [...this.course.groups]
      .sort((a, b) => a.order - b.order)
      .map((group) => ({
        id: group.id,
        label: group.label,
        gameCount: group.games.length,
      }))
  }

  /**
   * L'état stocké sort du navigateur : il entre par son contrat, comme la
   * grille et le parcours. Un stockage lisible mais structurellement faux est
   * ignoré, pas casté — sinon la restauration lève et l'écran reste blanc.
   */
  private storedSnapshot(): SessionSnapshot | undefined {
    const parsed = sessionSnapshotSchema.safeParse(this.persistence.read())
    return parsed.success ? parsed.data : undefined
  }

  /**
   * Regarde s'il existe une partie enregistrée, sans l'ouvrir. L'accueil montre
   * ce qu'elle contient et laisse le joueur choisir : reprendre est une
   * décision, pas un effet de bord du chargement.
   */
  storedRun():
    | {
        playerName: string
        repository: RepositorySlug | undefined
        submitted: number
        total: number
      }
    | undefined {
    const snapshot = this.storedSnapshot()
    if (snapshot === undefined) return undefined

    return {
      playerName: snapshot.playerName,
      repository: snapshot.repository,
      submitted: snapshot.submissions.length,
      total: this.course.groups.reduce(
        (sum, group) => sum + group.games.length,
        0,
      ),
    }
  }

  /** Rend `true` quand une session enregistrée a pu être reprise. */
  resume(): boolean {
    const snapshot = this.storedSnapshot()
    if (snapshot === undefined) return false

    this.session = GameSession.restore(this.course, snapshot)
    this.history.clear()
    for (const submission of snapshot.submissions) {
      this.history.push(
        new SubmitAnswerCommand(
          submission.gameId,
          submission.answer,
          submission.results,
          submission.submittedAt,
        ),
      )
    }
    return true
  }

  hasSession(): boolean {
    return this.session !== undefined
  }

  /** Le pseudo saisi au démarrage, retrouvé tel quel après une reprise. */
  playerName(): string | undefined {
    return this.session?.playerName
  }

  /**
   * Le dépôt désigné au démarrage, sous sa forme normalisée. Il est déclaratif
   * comme le pseudo : `getVerdict()` ne le lit pas, et aucun niveau n'en dépend.
   */
  designatedRepository(): RepositorySlug | undefined {
    return this.session?.repository
  }

  /**
   * Valide la réponse contre le contrat du jeu AVANT d'empiler quoi que ce
   * soit : une réponse hors contrat ne laisse aucune trace.
   */
  submitAnswer(answer: unknown): void {
    const session = this.requireSession()
    const game = session.currentGame()
    if (game === undefined) throw new NoActiveSessionError()

    const contract = this.registry.resolve(game.type)
    const validAnswer = contract.answerSchema.parse(answer)
    const results = contract.evaluator.evaluate(
      validAnswer,
      game.config,
      game.criteria,
    )

    const submittedAt = this.clock.now()
    session.submit(game.id, validAnswer, results, submittedAt)
    this.history.push(
      new SubmitAnswerCommand(game.id, validAnswer, results, submittedAt),
    )
    this.persistence.write(session.snapshot())
  }

  nextGame(): void {
    const session = this.requireSession()
    session.advance()
    this.persistence.write(session.snapshot())
  }

  getProgress(): Progress {
    const session = this.requireSession()
    const group = session.currentGroup()
    const counters = session.progress()

    return {
      group:
        group === undefined
          ? undefined
          : {
              id: group.id,
              label: group.label,
              index: this.course.groups.findIndex(
                (candidate) => candidate.id === group.id,
              ),
              total: this.course.groups.length,
            },
      game: session.currentGame(),
      submitted: counters.submitted,
      total: counters.total,
      finished: session.isFinished(),
    }
  }

  getVerdict(): Verdict {
    const session = this.requireSession()

    const groups: GroupOutcome[] = []
    for (const group of [...this.course.groups].sort(
      (a, b) => a.order - b.order,
    )) {
      const games = group.games.flatMap((game) => {
        const submission = session.submissionFor(game.id)
        return submission === undefined
          ? []
          : [buildGameOutcome(game, submission.results)]
      })
      if (games.length > 0) groups.push(buildGroupOutcome(group, games))
    }

    const criteria = groups
      .flatMap((group) => group.games)
      .flatMap((game) => game.criteria)
    const dimensions = this.scoring.score(criteria, this.grid.dimensions)

    return {
      result: new EvaluationResult(groups, dimensions),
      level: resolveLevel(this.grid, dimensions),
      signature: this.readSignature(criteria),
    }
  }

  /**
   * Les mêmes critères, lus une seconde fois avec les dimensions de la
   * signature. Deux scorings distincts plutôt qu'un seul jeu de dimensions
   * mélangées : un axe du référentiel et une lecture complémentaire n'ont ni
   * la même autorité ni la même échelle.
   */
  private readSignature(
    criteria: readonly CriterionOutcome[],
  ): SignatureReading | undefined {
    if (this.signature === undefined) return undefined

    const dimensions = this.scoring.score(criteria, this.signature.dimensions)
    return { level: resolveLevel(this.signature, dimensions), dimensions }
  }

  auditTrail(): readonly SubmitAnswerCommand[] {
    return this.history.entries()
  }

  resetSession(): void {
    this.session = undefined
    this.history.clear()
    this.persistence.clear()
  }

  private requireSession(): GameSession {
    if (this.session === undefined) throw new NoActiveSessionError()
    return this.session
  }
}
