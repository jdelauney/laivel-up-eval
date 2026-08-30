import { z } from 'zod'
import { snippetLines } from '../helpers/snippet-lines.helper'
import type { DefectHuntConfig } from './config.schema'

/**
 * La revue rendue est la réponse : les lignes marquées, et la durée qu'elle a
 * prise.
 *
 * Aucun journal. Tout — trouvés, manqués, faux positifs, ratio — se recalcule
 * depuis les seules marques ; la durée est la seule chose qui ne se recalcule
 * pas, et c'est exactement pourquoi elle est portée par la trace. Un champ
 * dérivé de plus ne serait qu'une surface à forger.
 */

export const defectHuntAnswerSchema = z.object({
  markedLines: z.array(z.number().int().min(1)),
  elapsedSeconds: z.number().finite().min(0),
})

export type DefectHuntAnswer = z.infer<typeof defectHuntAnswerSchema>

/**
 * Une marque qui vise une ligne au-delà de l'extrait est une trace forgée,
 * jamais un faux positif : confondre les deux ferait noter un bug comme une
 * pratique de revue.
 */
export class MarkedLineOutOfSnippetError extends Error {
  readonly line: number

  constructor(line: number) {
    super(`la marque à la ligne ${line} vise une ligne absente de l'extrait`)
    this.name = 'MarkedLineOutOfSnippetError'
    this.line = line
  }
}

export class DuplicateMarkedLineError extends Error {
  readonly line: number

  constructor(line: number) {
    super(`la ligne ${line} est marquée deux fois`)
    this.name = 'DuplicateMarkedLineError'
    this.line = line
  }
}

/**
 * Le schéma seul ignore quel extrait la partie montrait : les marques se
 * vérifient contre la configuration. Une revue sans aucune marque est
 * recevable — ne rien trouver est un résultat, pas une trace malformée. C'est
 * la différence avec `confidence-bet`, où un extrait sans mise était un refus.
 */
export const parseDefectHuntTrace = (
  answer: unknown,
  config: DefectHuntConfig,
): DefectHuntAnswer => {
  const trace = defectHuntAnswerSchema.parse(answer)
  const lineCount = snippetLines(config.snippet.code).length

  const seen = new Set<number>()
  trace.markedLines.forEach((line) => {
    if (line > lineCount) throw new MarkedLineOutOfSnippetError(line)
    if (seen.has(line)) throw new DuplicateMarkedLineError(line)
    seen.add(line)
  })

  return trace
}
