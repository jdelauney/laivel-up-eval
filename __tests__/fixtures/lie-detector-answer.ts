import { buildLieDetectorAnswer } from '@/games/lie-detector/actions/build-lie-detector-answer.action'
import { lieDetectorConfigSchema } from '@/games/lie-detector/schema/config.schema'

/**
 * Une trace `lie-detector` conforme, minimale : la première affirmation de
 * chaque manche, désignée puis maintenue. Sert aux parcours qui traversent
 * tout le référentiel sans mesurer `verification` — `checkpoints-run`,
 * `three-tracks-run` — où seule une réponse valide importe, jamais une
 * bonne réponse.
 *
 * Extrait le 30/08 (revue, F11) : ce bloc était recopié à l'identique dans
 * les deux fichiers, sixième branche du même genre par fichier.
 */
export const defaultLieDetectorAnswer = (config: unknown): unknown => {
  const parsed = lieDetectorConfigSchema.parse(config)
  return buildLieDetectorAnswer(
    parsed,
    parsed.rounds.map((round) => ({
      roundId: round.id,
      firstPickId: round.claims[0].id,
      finalPickId: round.claims[0].id,
    })),
  )
}
