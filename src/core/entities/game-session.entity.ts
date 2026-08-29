import type { Course, Game, Group } from '../contracts/course.schema'
import type { RepositorySlug } from '../contracts/repository-slug.schema'
import type {
  SessionSnapshot,
  Submission,
} from '../contracts/session-snapshot.schema'
import type { CriterionResult } from '../ports/game-evaluator.interface'

/**
 * Les invariants de progression. La position n'est pas une conséquence de
 * l'affichage : on ne passe pas au groupe suivant tant que les jeux du groupe
 * courant ne sont pas soumis.
 */

export type { SessionSnapshot, Submission }

export class GroupNotCompleteError extends Error {
  readonly groupId: string

  constructor(groupId: string) {
    super(
      `le groupe « ${groupId} » n'est pas terminé, le groupe suivant reste fermé`,
    )
    this.name = 'GroupNotCompleteError'
    this.groupId = groupId
  }
}

const orderedGroups = (course: Course): Group[] =>
  [...course.groups].sort((a, b) => a.order - b.order)

export class GameSession {
  readonly playerName: string
  /** Le dépôt désigné à l'entrée, facultatif ; il ne pèse sur aucun calcul. */
  readonly repository: RepositorySlug | undefined
  private readonly groups: Group[]
  private groupIndex: number
  private gameIndex: number
  private readonly submissions: Submission[]

  constructor(
    course: Course,
    playerName: string,
    repository?: RepositorySlug | undefined,
  ) {
    this.playerName = playerName
    this.repository = repository
    this.groups = orderedGroups(course)
    this.groupIndex = 0
    this.gameIndex = 0
    this.submissions = []
  }

  static restore(course: Course, snapshot: SessionSnapshot): GameSession {
    const session = new GameSession(
      course,
      snapshot.playerName,
      snapshot.repository,
    )
    session.groupIndex = snapshot.groupIndex
    session.gameIndex = snapshot.gameIndex
    session.submissions.push(...snapshot.submissions)
    return session
  }

  snapshot(): SessionSnapshot {
    return {
      playerName: this.playerName,
      repository: this.repository,
      groupIndex: this.groupIndex,
      gameIndex: this.gameIndex,
      submissions: [...this.submissions],
    }
  }

  currentGroup(): Group | undefined {
    return this.groups[this.groupIndex]
  }

  currentGame(): Game | undefined {
    return this.currentGroup()?.games[this.gameIndex]
  }

  isFinished(): boolean {
    return this.groupIndex >= this.groups.length
  }

  submissionFor(gameId: string): Submission | undefined {
    return this.submissions.find((submission) => submission.gameId === gameId)
  }

  allSubmissions(): readonly Submission[] {
    return [...this.submissions]
  }

  /** Une seconde soumission sur le même jeu remplace la première. */
  submit(
    gameId: string,
    answer: unknown,
    results: readonly CriterionResult[],
    submittedAt: string,
  ): void {
    const existing = this.submissions.findIndex(
      (submission) => submission.gameId === gameId,
    )
    const submission: Submission = {
      gameId,
      answer,
      results: [...results],
      submittedAt,
    }
    if (existing >= 0) {
      this.submissions[existing] = submission
      return
    }
    this.submissions.push(submission)
  }

  isGroupComplete(groupIndex: number): boolean {
    const group = this.groups[groupIndex]
    if (group === undefined) return false
    return group.games.every(
      (game) => this.submissionFor(game.id) !== undefined,
    )
  }

  /** Avance d'un jeu, et bascule de groupe seulement quand le groupe est fini. */
  advance(): void {
    const group = this.currentGroup()
    if (group === undefined) return

    if (this.gameIndex + 1 < group.games.length) {
      this.gameIndex += 1
      return
    }

    this.openNextGroup()
  }

  openNextGroup(): void {
    const group = this.currentGroup()
    if (group === undefined) return

    if (!this.isGroupComplete(this.groupIndex)) {
      throw new GroupNotCompleteError(group.id)
    }

    this.groupIndex += 1
    this.gameIndex = 0
  }

  progress(): { submitted: number; total: number } {
    const total = this.groups.reduce(
      (sum, group) => sum + group.games.length,
      0,
    )
    return { submitted: this.submissions.length, total }
  }
}
