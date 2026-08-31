import { useSessionFacade } from '@/providers/session-context'
import { Button } from '../../../../components/ui/button'
import { useSessionStore } from '../../../../store/session.store'
import { AxisProofRow } from '../composites/axis-proof-row'
import { CappingAxis } from '../composites/capping-axis'
import { LevelBlock } from '../composites/level-block'
import { ProgressionStep } from '../composites/progression-step'
import { SignatureBlock } from '../composites/signature-block'

/**
 * Le verdict, et surtout ce qui l'a produit. Le niveau et la signature sont
 * deux blocs de même rang, chacun dans son propre cadre : le second éclaire
 * le premier, il ne le subordonne pas. Le détail remonte la chaîne
 * critère → jeu → groupe telle que l'entité de résultat la porte, sans rien
 * recalculer ici.
 */
export const SummaryView = () => {
  const facade = useSessionFacade()
  const reset = useSessionStore((state) => state.reset)
  const { result, level, proof, plan, unrankedReason, signature } =
    facade.getVerdict()

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex flex-1 flex-col gap-8 rounded-2xl border border-plane-rule p-6">
          <LevelBlock level={level} unrankedReason={unrankedReason} />
          <CappingAxis capping={plan[0]} />
        </div>
        {signature !== undefined ? (
          <div className="flex flex-1 rounded-2xl border border-plane-rule p-6">
            <SignatureBlock signature={signature} />
          </div>
        ) : null}
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
          Ce qui vous ferait monter
        </h3>
        {plan.length === 0 ? (
          <p className="text-plane-foreground/80 text-sm">
            Le sommet du référentiel est atteint : il n'y a plus de cran à
            ouvrir.
          </p>
        ) : (
          <ul className="flex flex-col border-plane-rule border-t">
            {plan.map((step) => (
              <ProgressionStep key={step.dimensionId} step={step} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
          Les axes du référentiel
        </h3>
        <ul className="flex flex-col border-plane-rule border-t">
          {proof.map((axisProof) => (
            <AxisProofRow key={axisProof.dimensionId} proof={axisProof} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
          Ce qui a produit ce niveau
        </h3>
        <div className="flex flex-col gap-8">
          {result.groups.map((group) => (
            <article key={group.groupId} className="flex flex-col gap-3">
              <h4 className="font-semibold text-plane-foreground">
                {group.label}
              </h4>
              {group.games.map((game) => (
                <div key={game.gameId} className="flex flex-col">
                  <p className="text-plane-foreground/60 text-sm">
                    {game.label}
                  </p>
                  <ul className="mt-1 flex flex-col">
                    {game.criteria.map((criterion) => (
                      <li
                        key={criterion.criterionId}
                        className="flex items-baseline gap-3 border-plane-rule border-b py-2"
                      >
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 ${
                            criterion.satisfied
                              ? 'bg-nominal'
                              : 'border-2 border-missed'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="flex-1 text-plane-foreground text-sm">
                          {criterion.question}
                        </span>
                        <span
                          className={`font-medium text-xs uppercase tracking-[0.12em] ${
                            criterion.satisfied ? 'text-nominal' : 'text-missed'
                          }`}
                        >
                          {criterion.satisfied ? 'tenu' : 'manqué'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            facade.resetSession()
            reset()
          }}
        >
          Repartir de zéro
        </Button>
      </div>
    </div>
  )
}
