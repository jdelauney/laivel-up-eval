import { z } from 'zod'
import type { ThreeTracksConfig } from './config.schema'

/**
 * La trace du déroulé est la réponse, comme pour `checkpoints`. Un jeu à état
 * garde sa partie chez lui et rend l'historique de ses gestes : ici, les
 * allocations posées à chaque tour.
 *
 * Le journal (chantiers mergés, chantiers perdus, vivants par tour) n'est
 * qu'un relevé de ce que l'écran a affiché. L'évaluateur ne le lit jamais : il
 * rejoue la partie depuis les seules allocations, sur le modèle de
 * `checkpoints` qui ne relit jamais les coûts écrits dans sa trace.
 */

export const allocationSchema = z.object({
  trackId: z.string().min(1),
  attention: z.number().min(0),
})

export const turnTraceSchema = z.object({
  turnNumber: z.number().int().positive(),
  allocations: z.array(allocationSchema),
})

export const threeTracksAnswerSchema = z.object({
  turns: z.array(turnTraceSchema).min(1),
  mergedTrackIds: z.array(z.string().min(1)),
  lostTrackIds: z.array(z.string().min(1)),
  liveTracksPerTurn: z.array(z.number().int().min(0)),
})

export type Allocation = z.infer<typeof allocationSchema>
export type TurnTrace = z.infer<typeof turnTraceSchema>
export type ThreeTracksAnswer = z.infer<typeof threeTracksAnswerSchema>

export class IncompleteTraceError extends Error {
  readonly missingTurnNumber: number

  constructor(missingTurnNumber: number) {
    super(
      `la trace du jeu three-tracks ne couvre pas le tour ${missingTurnNumber}`,
    )
    this.name = 'IncompleteTraceError'
    this.missingTurnNumber = missingTurnNumber
  }
}

export class UnknownTrackError extends Error {
  readonly turnNumber: number
  readonly trackId: string

  constructor(turnNumber: number, trackId: string) {
    super(
      `le tour ${turnNumber} alloue de l'attention au chantier « ${trackId} », absent de la configuration`,
    )
    this.name = 'UnknownTrackError'
    this.turnNumber = turnNumber
    this.trackId = trackId
  }
}

export class TrackAttentionExceededError extends Error {
  readonly turnNumber: number
  readonly trackId: string

  constructor(turnNumber: number, trackId: string) {
    super(
      `le tour ${turnNumber} dépasse le plafond d'attention du chantier « ${trackId} »`,
    )
    this.name = 'TrackAttentionExceededError'
    this.turnNumber = turnNumber
    this.trackId = trackId
  }
}

export class TurnAttentionExceededError extends Error {
  readonly turnNumber: number

  constructor(turnNumber: number) {
    super(`le tour ${turnNumber} dépasse l'attention disponible pour ce tour`)
    this.name = 'TurnAttentionExceededError'
    this.turnNumber = turnNumber
  }
}

/**
 * Le schéma seul ne sait pas combien de tours la partie comptait, ni ce que le
 * parcours autorise à poser sur un chantier ou sur un tour : la complétude et
 * le budget se vérifient contre la configuration, un tour à la fois et dans
 * l'ordre déclaré. Une trace à trous rendrait des critères manqués par défaut,
 * ce qui noterait un bug comme s'il était une pratique.
 */
export const parseThreeTracksTrace = (
  answer: unknown,
  config: ThreeTracksConfig,
): ThreeTracksAnswer => {
  const trace = threeTracksAnswerSchema.parse(answer)
  const knownTrackIds = new Set(config.tracks.map((track) => track.id))

  for (let index = 0; index < config.turns; index += 1) {
    const turnNumber = index + 1
    const turn = trace.turns[index]
    if (turn?.turnNumber !== turnNumber) {
      throw new IncompleteTraceError(turnNumber)
    }

    let turnTotal = 0
    turn.allocations.forEach((allocation) => {
      if (!knownTrackIds.has(allocation.trackId)) {
        throw new UnknownTrackError(turnNumber, allocation.trackId)
      }
      if (allocation.attention > config.maxPerTrack) {
        throw new TrackAttentionExceededError(turnNumber, allocation.trackId)
      }
      turnTotal += allocation.attention
    })

    if (turnTotal > config.attentionPerTurn) {
      throw new TurnAttentionExceededError(turnNumber)
    }
  }

  return trace
}
