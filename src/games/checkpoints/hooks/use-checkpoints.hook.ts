import { useMemo, useRef, useState } from 'react'
import { buildCheckpointsAnswer } from '../actions/build-checkpoints-answer.action'
import { currentStage, replayTrace } from '../helpers/run-simulation.helper'
import type { Decision } from '../schema/answer.schema'
import { type Choice, checkpointsConfigSchema } from '../schema/config.schema'

/**
 * Le cycle de vie React de la partie, et rien d'autre : l'avancée, les coûts et
 * la propagation des défauts vivent dans la simulation.
 *
 * Le journal est en ajout seul. Aucun retour en arrière n'est exposé, donc
 * aucun n'est possible : une décision tranchée est tranchée.
 *
 * Aucune révélation ne s'affiche dans ce jeu entre le dernier choix et le
 * passage au suivant : `choose` écrit la trace (`onLock`) et avance
 * (`onAdvance`) dans le même geste, au sixième choix — rien n'est montré
 * entre les deux qu'un rechargement pourrait exploiter.
 */
export const useCheckpoints = (
  config: unknown,
  onLock: (answer: unknown) => void,
  onAdvance: () => void,
) => {
  // La config ne change pas d'un choix à l'autre : la valider à chaque rendu
  // était du travail jeté.
  const parsed = useMemo(() => checkpointsConfigSchema.parse(config), [config])
  const [choices, setChoices] = useState<readonly Choice[]>([])
  const submitted = useRef(false)

  const state = useMemo(
    () =>
      replayTrace(
        parsed,
        choices.map((choice) => ({ choice })),
      ),
    [parsed, choices],
  )

  const stage = currentStage(parsed, state)

  const choose = (choice: Choice): void => {
    if (stage === undefined || submitted.current) return

    const next = [...choices, choice]
    setChoices(next)

    /** La soumission part au sixième choix, une seule fois. */
    if (next.length < parsed.stages.length) return
    submitted.current = true
    onLock(buildCheckpointsAnswer(parsed, next))
    onAdvance()
  }

  const journal: readonly Decision[] = state.decisions

  return {
    stages: parsed.stages,
    stage,
    stageNumber: state.stageIndex + 1,
    stageCount: parsed.stages.length,
    stageIndex: state.stageIndex,
    budget: state.budget,
    journal,
    choose,
  }
}
