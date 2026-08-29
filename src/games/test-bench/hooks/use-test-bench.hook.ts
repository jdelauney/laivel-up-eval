import { useMemo, useState } from 'react'
import { buildTestBenchAnswer } from '../actions/submit-test-bench.action'
import { testBenchConfigSchema } from '../schema/config.schema'

/** L'état React de la saisie. Aucune règle métier ici. */
export const useTestBench = (
  config: unknown,
  onSubmit: (answer: unknown) => void,
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
    onSubmit(
      buildTestBenchAnswer(
        selected,
        parsed.propositions.map((proposition) => proposition.id),
      ),
    )
    setSelected(new Set())
  }

  return {
    statement: parsed.statement,
    propositions: parsed.propositions,
    selected,
    toggle,
    submit,
  }
}
