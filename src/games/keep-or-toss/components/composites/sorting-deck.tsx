import { Button } from '../../../../components/ui/button'
import type { CurrentItem } from '../../hooks/use-keep-or-toss.hook'
import { PracticeCard } from '../elements/practice-card'
import { CountdownBar } from './countdown-bar'

/**
 * La pile de tri : le temps qui reste, le compte de cartes déjà triées sur
 * le total, la carte courante, et les deux destinations. Rien d'autre n'est
 * visible pendant la partie — `DESIGN.md`, « Aucune validation, aucun
 * retour, aucun compteur de justes avant la fin. »
 *
 * **Pointeur et clavier atteignent exactement les mêmes états.** Les deux
 * boutons visibles et les flèches `ArrowLeft` / `ArrowRight` appellent la
 * même fonction `onSort` — jamais deux chemins qui divergeraient, la faute
 * relevée sur `flow-order` où le pointeur n'atteignait pas la dernière
 * position que le clavier atteignait. L'écoute vit sur les deux boutons
 * eux-mêmes, déjà interactifs et déjà focusables : aucun conteneur muet à
 * rendre interactif par un `tabIndex` posé à côté, et le focus initial
 * (`autoFocus` sur « Garder ») rend les flèches actives dès l'arrivée sur
 * l'écran, sans exiger un premier clic.
 *
 * Purement présentationnel : elle affiche ce qu'on lui donne, elle ne
 * connaît ni le hook ni la configuration.
 */
export const SortingDeck = ({
  currentItem,
  sortedCount,
  total,
  remainingSeconds,
  durationSeconds,
  announcement,
  onSort,
}: {
  currentItem: CurrentItem | undefined
  sortedCount: number
  total: number
  remainingSeconds: number
  durationSeconds: number
  announcement: string
  onSort: (kept: boolean) => void
}) => {
  const onArrowSort = (event: React.KeyboardEvent): void => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onSort(true)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      onSort(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <CountdownBar
        remainingSeconds={remainingSeconds}
        durationSeconds={durationSeconds}
        announcement={announcement}
      />

      <p className="font-medium text-plane-foreground/60 text-xs uppercase tabular-nums tracking-[0.14em]">
        {sortedCount} sur {total} triée{sortedCount === 1 ? '' : 's'}
      </p>

      {currentItem === undefined ? null : (
        <PracticeCard label={currentItem.label} />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          autoFocus
          disabled={currentItem === undefined}
          onClick={() => onSort(true)}
          onKeyDown={onArrowSort}
        >
          Garder
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={currentItem === undefined}
          onClick={() => onSort(false)}
          onKeyDown={onArrowSort}
        >
          Jeter
        </Button>
      </div>
    </div>
  )
}
