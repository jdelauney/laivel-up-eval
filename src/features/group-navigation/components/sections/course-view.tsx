import { GroupRail } from '../../../../components/group-rail/composites/group-rail'
import { resolveGameComponent } from '../../../../games/register-components'
import { useCourse } from '../../hooks/use-course.hook'

/**
 * Le parcours ne connaît aucun jeu : il résout le type déclaré dans les
 * données et rend le composant que le registre interface lui donne.
 *
 * Un type non résolu se nomme à l'écran et laisse le reste debout.
 */
export const CourseView = () => {
  const { progress, rail, submit } = useCourse()
  const game = progress === undefined ? undefined : progress.game

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(11rem,16rem)_1fr] md:gap-12">
      <div className="md:pt-1">
        <p className="mb-3 font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
          {progress?.group?.label ?? 'Le parcours'}
        </p>
        <GroupRail groups={rail} />
      </div>

      <div className="flex flex-col gap-8">
        {progress === undefined || game === undefined ? (
          <p className="text-plane-foreground/70">Aucune situation en cours.</p>
        ) : (
          <>
            <header className="flex flex-col gap-2">
              <p className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em] tabular-nums">
                Situation {progress.submitted + 1} sur {progress.total}
              </p>
              <h2 className="max-w-[26ch] font-semibold text-2xl leading-tight tracking-tight md:text-3xl">
                {game.label}
              </h2>
            </header>

            <GameSurface
              gameType={game.type}
              config={game.config}
              onSubmit={submit}
            />
          </>
        )}
      </div>
    </div>
  )
}

const GameSurface = ({
  gameType,
  config,
  onSubmit,
}: {
  gameType: string
  config: unknown
  onSubmit: (answer: unknown) => void
}) => {
  const Game = resolveGameComponent(gameType)

  if (Game === undefined) {
    return (
      <div className="border border-plane-rule border-t-4 border-t-missed bg-plane p-4">
        <p className="font-medium text-missed text-sm">
          Aucun affichage enregistré pour le type de jeu «&nbsp;{gameType}
          &nbsp;».
        </p>
        <p className="mt-1 text-plane-foreground/70 text-sm">
          Le parcours le déclare, l'interface ne le connaît pas. Câblage à
          compléter dans <code>games/register-components.ts</code>.
        </p>
      </div>
    )
  }

  return <Game config={config} onSubmit={onSubmit} />
}
