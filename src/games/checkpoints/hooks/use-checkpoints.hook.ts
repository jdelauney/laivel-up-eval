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
 */
export const useCheckpoints = (
  config: unknown,
  onSubmit: (answer: unknown) => void,
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
    onSubmit(buildCheckpointsAnswer(parsed, next))
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
