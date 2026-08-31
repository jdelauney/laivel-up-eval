import { useSessionFacade } from '@/providers/session-context'
import { Button } from '../../../../components/ui/button'
import { useSessionStore } from '../../../../store/session.store'
import { AxisProofRow } from '../composites/axis-proof-row'
import { CappingAxis, UNREACHABLE_MESSAGE } from '../composites/capping-axis'
import { CriteriaTrail } from '../composites/criteria-trail'
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
          {/*
           * F2 — sans niveau atteint, `plan[0]` peut être le même axe que
           * celui que `LevelBlock` vient déjà de nommer dans sa raison
           * d'état non classé (`unrankedReason`) : quand le niveau le plus
           * bas échoue sans violer de borne `max` — un axe non mesuré, par
           * exemple — `resolveClimbTarget` le retient comme cible, et
           * `blocking` coïncide avec `unranked`. Répéter la ligne sous
           * « Ce qui plafonne » n'ajoute rien et se lit comme deux faits
           * distincts. `LevelBlock` porte déjà les axes en cause : ce bloc
           * ne se rend que pour un profil classé.
           */}
          {level.level !== undefined ? (
            <CappingAxis
              capping={plan[0]}
              noNextLevelReason={level.noNextLevelReason}
            />
          ) : null}
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
          // F4 — « aucun cran au-dessus n'est atteignable » n'a qu'une
          // source à l'écran, `CappingAxis` (import ci-dessus). Elle ne s'y
          // rend que pour un profil classé (F2) : ici, on ne la répète que
          // pour le profil non classé, où `CappingAxis` est absent et où
          // la raison doit malgré tout être dite quelque part. La paire
          // « sommet atteint » garde ses deux phrases distinctes et
          // complémentaires, correcte telle quelle.
          level.level !== undefined &&
          level.noNextLevelReason === 'unreachable' ? null : (
            <p className="text-plane-foreground/80 text-sm">
              {level.noNextLevelReason === 'unreachable'
                ? UNREACHABLE_MESSAGE
                : "Le sommet du référentiel est atteint : il n'y a plus de cran à ouvrir."}
            </p>
          )
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

      <CriteriaTrail groups={result.groups} />

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
