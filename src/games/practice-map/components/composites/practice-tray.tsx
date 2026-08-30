import type { LegendEntry } from '../../hooks/use-practice-map.hook'
import { PracticeToken } from '../elements/practice-token'

/**
 * La légende permanente des sept pratiques — jamais un repli, jamais un
 * plafond. Une pratique posée n'y disparaît plus : elle y reste, marquée
 * posée, parce que le plan n'affiche plus qu'un numéro sur chaque badge.
 *
 * **Révision du 30/08, après que la réserve s'est mise à plafonner et
 * replier ses entrées à trois visibles.** Ce plafonnement répondait à un
 * risque réel — sept entrées pleines poussant le plan et l'action de
 * soumission hors de l'écran — mais il supposait une réserve qui se vide au
 * fil de la partie, une file d'actions qui rétrécit. Avec des badges
 * numérotés, la réserve devient une légende : sa mission change du tout au
 * tout, elle doit résoudre un numéro **instantanément**, au moment précis
 * où le joueur relit son plan avant de soumettre. Une légende qu'il faut
 * déplier pour lire un numéro déjà sous les yeux introduit une friction que
 * l'ancienne réserve, simple file de gestes à faire, n'avait pas : replier
 * la ligne qui répond justement à la question qu'on se pose est le pire
 * moment pour le faire. Le plafond est donc retiré ici ; le risque de
 * hauteur qu'il neutralisait est réel mais distinct — mesuré et suivi dans
 * le défaut de backlog sur la soumission mobile, qui portait déjà le gros
 * du dépassement avant même que cette réserve n'existe.
 */
export const PracticeTray = ({
  entries,
  heldId,
  onHold,
}: {
  entries: readonly LegendEntry[]
  heldId: string | undefined
  onHold: (practiceId: string) => void
}) => {
  const remaining = entries.filter((entry) => !entry.placed).length

  return (
    <section className="border border-plane-rule bg-plane">
      <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
        La réserve
      </header>
      <div className="flex flex-col gap-2 p-3">
        {entries.map((entry) => (
          <PracticeToken
            key={entry.id}
            number={entry.number}
            label={entry.label}
            placed={entry.placed}
            held={entry.id === heldId}
            onHold={() => onHold(entry.id)}
          />
        ))}
      </div>
      <p
        aria-live="polite"
        className="border-plane-rule border-t px-3 py-2 font-medium text-[10px] text-plane-foreground/50 uppercase tabular-nums tracking-[0.14em]"
      >
        {remaining === 0
          ? 'Toutes les pratiques sont posées.'
          : `Il reste ${remaining} pratique${remaining > 1 ? 's' : ''} à poser.`}
      </p>
    </section>
  )
}
