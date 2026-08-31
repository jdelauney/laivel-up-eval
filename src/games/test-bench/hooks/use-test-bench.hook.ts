import { useMemo, useState } from 'react'
import { buildTestBenchAnswer } from '../actions/submit-test-bench.action'
import { testBenchConfigSchema } from '../schema/config.schema'

/**
 * L'état React de la saisie. Aucune règle métier ici.
 *
 * Aucune révélation ne s'affiche dans ce jeu : `submit` écrit la trace
 * (`onLock`) et avance (`onAdvance`) dans le même geste.
 */
export const useTestBench = (
  config: unknown,
  onLock: (answer: unknown) => void,
  onAdvance: () => void,
) => {
  // La config ne change pas d'une frappe à l'autre : la valider à chaque
  // rendu était du travail jeté.
  const parsed = useMemo(() => testBenchConfigSchema.parse(config), [config])
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const toggle = (propositionId: string): void => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(propositionId)) next.delete(propositionId)
      else next.add(propositionId)
      return next
    })
  }

  const submit = (): void => {
    onLock(
      buildTestBenchAnswer(
        selected,
        parsed.propositions.map((proposition) => proposition.id),
      ),
    )
    setSelected(new Set())
    onAdvance()
  }

  return {
    statement: parsed.statement,
    propositions: parsed.propositions,
    selected,
    toggle,
    submit,
  }
}
