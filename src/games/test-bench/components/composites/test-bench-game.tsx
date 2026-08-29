import { Button } from '../../../../components/ui/button'
import { Checkbox } from '../../../../components/ui/checkbox'
import type { GameComponentProps } from '../../../types/game-component'
import { useTestBench } from '../../hooks/use-test-bench.hook'

/**
 * Le banc d'essai, rendu muet. Une proposition retenue prend du poids et un
 * filet plein ; une proposition laissée de côté garde son filet fin. L'état
 * est une quantité, jamais une opacité.
 */
export const TestBenchGame = ({ config, onSubmit }: GameComponentProps) => {
  const { statement, propositions, selected, toggle, submit } = useTestBench(
    config,
    onSubmit,
  )

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-[52ch] text-lg text-plane-foreground leading-relaxed">
        {statement}
      </p>

      <ul className="flex flex-col">
        {propositions.map((proposition) => {
          const isSelected = selected.has(proposition.id)
          return (
            <li key={proposition.id}>
              <label
                htmlFor={`proposition-${proposition.id}`}
                className={`flex cursor-pointer items-start gap-3 border-plane-rule border-b py-3 ${
                  isSelected
                    ? 'border-b-2 border-b-plane-foreground font-medium'
                    : ''
                }`}
              >
                <Checkbox
                  id={`proposition-${proposition.id}`}
                  checked={isSelected}
                  onCheckedChange={() => toggle(proposition.id)}
                  className="mt-0.5"
                />
                <span className="text-plane-foreground">
                  {proposition.text}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      <div>
        <Button type="button" size="lg" onClick={submit}>
          Valider
        </Button>
      </div>
    </div>
  )
}
