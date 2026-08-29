import { useSessionFacade } from '@/providers/session-context'
import { Button } from '../../../../components/ui/button'
import { useSessionStore } from '../../../../store/session.store'
import { DimensionRow } from '../composites/dimension-row'

/**
 * Le verdict, et surtout ce qui l'a produit. Le niveau est l'objet le plus
 * grand de l'écran ; le détail remonte la chaîne critère → jeu → groupe telle
 * que l'entité de résultat la porte, sans rien recalculer ici.
 */
export const SummaryView = () => {
  const facade = useSessionFacade()
  const reset = useSessionStore((state) => state.reset)
  const { result, level, signature } = facade.getVerdict()

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <p className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
          Niveau atteint
        </p>
        <h2 className="font-semibold text-5xl leading-[0.95] tracking-tight md:text-7xl">
          {level.level.label}
        </h2>
        <p className="max-w-[54ch] border-plane-rule border-t pt-4 text-plane-foreground/80">
          {level.hint}
        </p>
        {level.nextLevel ? (
          <p className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
            Niveau suivant · {level.nextLevel.label}
          </p>
        ) : null}
      </header>

      <section className="flex flex-col gap-3">
        <h3 className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
          Les axes du référentiel
        </h3>
        <ul className="flex flex-col border-plane-rule border-t">
          {result.dimensions.map((dimension) => (
            <DimensionRow key={dimension.dimensionId} dimension={dimension} />
          ))}
        </ul>
      </section>

      {signature ? (
        <section className="flex flex-col gap-3">
          <h3 className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
            Lecture complémentaire
          </h3>
          <p className="max-w-[54ch] text-plane-foreground/60 text-sm">
            La rigueur du flux, lue sur les mêmes réponses. Elle éclaire le
            niveau, elle ne le décide pas.
          </p>
          <p className="font-semibold text-2xl tracking-tight">
            {signature.level.level.label}
          </p>
          <ul className="flex flex-col border-plane-rule border-t">
            {signature.dimensions.map((dimension) => (
              <DimensionRow key={dimension.dimensionId} dimension={dimension} />
            ))}
          </ul>
        </section>
      ) : null}

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
