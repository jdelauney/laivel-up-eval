import type { GroupOutcome } from '@/core/entities/evaluation-result.entity'
import { AttributionList } from '../elements/attribution-list'

/**
 * La trace critère → jeu → groupe qui a produit le niveau, telle que
 * `EvaluationResult` la porte : rien n'est recalculé ici. Un critère qui
 * porte un détail attribuable le montre en dessous, sous la forme des
 * gestes qui l'ont produit ; un critère sans détail s'affiche exactement
 * comme avant cette extraction.
 */
type CriteriaTrailProps = Readonly<{ groups: readonly GroupOutcome[] }>

export const CriteriaTrail = ({ groups }: CriteriaTrailProps) => (
  <section className="flex flex-col gap-3">
    <h3 className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
      Ce qui a produit ce niveau
    </h3>
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <article key={group.groupId} className="flex flex-col gap-3">
          <h4 className="font-semibold text-plane-foreground">{group.label}</h4>
          {group.games.map((game) => (
            <div key={game.gameId} className="flex flex-col">
              <p className="text-plane-foreground/60 text-sm">{game.label}</p>
              <ul className="mt-1 flex flex-col">
                {game.criteria.map((criterion) => (
                  <li
                    key={criterion.criterionId}
                    className="flex flex-col gap-2 border-plane-rule border-b py-2"
                  >
                    <div className="flex items-baseline gap-3">
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
                    </div>
                    {criterion.attributions !== undefined &&
                    criterion.attributions.length > 0 ? (
                      <AttributionList attributions={criterion.attributions} />
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </article>
      ))}
    </div>
  </section>
)
