import { Button } from '../../../../components/ui/button'

/**
 * Une partie en cours n'est plus reprise en silence. Elle se montre, et le
 * joueur décide. C'est le seul endroit du produit où « repartir de zéro » a
 * un sens, et le seul endroit où la promesse « une partie survit à une
 * interruption » devient visible plutôt que supposée.
 */
export const ResumeRun = ({
  playerName,
  repository,
  submitted,
  total,
  onResume,
  onDiscard,
}: {
  playerName: string
  repository?: string | undefined
  submitted: number
  total: number
  onResume: () => void
  onDiscard: () => void
}) => (
  <section className="border border-plane-rule border-t-4 border-t-plane-foreground bg-plane px-5 py-4">
    <p className="font-medium text-plane-foreground/60 text-xs uppercase tracking-[0.14em]">
      Partie en cours
    </p>
    <p className="mt-2 text-plane-foreground">
      <span className="font-semibold">{playerName}</span>
      {repository ? (
        <>
          <span className="text-plane-foreground/60"> · </span>
          <span className="text-plane-foreground/80">{repository}</span>
        </>
      ) : null}
      <span className="text-plane-foreground/60"> · </span>
      <span className="tabular-nums">
        {submitted} jeu{submitted > 1 ? 'x' : ''} sur {total}
      </span>
    </p>
    <div className="mt-4 flex flex-wrap gap-2">
      <Button type="button" onClick={onResume}>
        Reprendre
      </Button>
      <Button type="button" variant="ghost" onClick={onDiscard}>
        Repartir de zéro
      </Button>
    </div>
  </section>
)
