import { z } from 'zod'
import type { ConfidenceBetConfig } from './config.schema'

/**
 * La trace des mises est la réponse, comme la trace des tours pour
 * `three-tracks`. `finalCapital` est le relevé du journal — un journal,
 * jamais une source : l'évaluateur ne le lit jamais, il rejoue la partie
 * depuis les seules mises.
 */

export const betSchema = z.object({
  snippetId: z.string().min(1),
  stake: z.number(),
})

export const confidenceBetAnswerSchema = z.object({
  bets: z.array(betSchema).min(1),
  finalCapital: z.number(),
})

export type Bet = z.infer<typeof betSchema>
export type ConfidenceBetAnswer = z.infer<typeof confidenceBetAnswerSchema>

export class IncompleteTraceError extends Error {
  readonly missingSnippetId: string

  constructor(missingSnippetId: string) {
    super(
      `la trace du jeu confidence-bet ne couvre pas l'extrait « ${missingSnippetId} »`,
    )
    this.name = 'IncompleteTraceError'
    this.missingSnippetId = missingSnippetId
  }
}

export class UnknownSnippetError extends Error {
  readonly snippetId: string

  constructor(snippetId: string) {
    super(
      `une mise vise l'extrait « ${snippetId} », absent de la configuration`,
    )
    this.name = 'UnknownSnippetError'
    this.snippetId = snippetId
  }
}

export class StakeOutOfScaleError extends Error {
  readonly snippetId: string
  readonly stake: number

  constructor(snippetId: string, stake: number) {
    super(
      `la mise ${stake} posée sur l'extrait « ${snippetId} » n'appartient pas à l'échelle déclarée`,
    )
    this.name = 'StakeOutOfScaleError'
    this.snippetId = snippetId
    this.stake = stake
  }
}

/**
 * La couverture (chaque extrait a bien une mise) ne suffit pas : une trace
 * forgée avec des doublons la passerait tout en portant plus de mises que
 * d'extraits déclarés, et la simulation la rejetterait plus loin avec
 * `GameAlreadyOverError`, un nom qui décrit un bug de rejeu, pas une trace
 * malformée. Le refus se fait ici, par son propre nom.
 */
export class TraceLengthMismatchError extends Error {
  readonly betCount: number
  readonly snippetCount: number

  constructor(betCount: number, snippetCount: number) {
    super(
      `la trace porte ${betCount} mise(s) pour ${snippetCount} extrait(s) déclaré(s)`,
    )
    this.name = 'TraceLengthMismatchError'
    this.betCount = betCount
    this.snippetCount = snippetCount
  }
}

/**
 * Le schéma seul ignore quels extraits la partie comptait : la couverture se
 * vérifie contre la configuration, extrait par extrait et dans l'ordre
 * déclaré. Une trace à trous rendrait des critères manqués par défaut, ce qui
 * noterait un bug comme s'il était une pratique.
 */
export const parseConfidenceBetTrace = (
  answer: unknown,
  config: ConfidenceBetConfig,
): ConfidenceBetAnswer => {
  const trace = confidenceBetAnswerSchema.parse(answer)

  config.snippets.forEach((snippet) => {
    const bet = trace.bets.find((entry) => entry.snippetId === snippet.id)
    if (bet === undefined) throw new IncompleteTraceError(snippet.id)
  })

  const declaredStakes = new Set(config.stakes)
  trace.bets.forEach((bet) => {
    const known = config.snippets.some(
      (snippet) => snippet.id === bet.snippetId,
    )
    if (!known) throw new UnknownSnippetError(bet.snippetId)
    if (!declaredStakes.has(bet.stake)) {
      throw new StakeOutOfScaleError(bet.snippetId, bet.stake)
    }
  })

  /**
   * La couverture ci-dessus dit que chaque extrait a au moins une mise, et
   * la boucle précédente dit que chaque mise vise un extrait connu : à ce
   * point, un excédent ne peut venir que d'un doublon. La comparaison de
   * longueur vient après, pour ne pas voler leur nom aux deux refus
   * ci-dessus sur une trace trop courte.
   */
  if (trace.bets.length !== config.snippets.length) {
    throw new TraceLengthMismatchError(
      trace.bets.length,
      config.snippets.length,
    )
  }

  return trace
}
