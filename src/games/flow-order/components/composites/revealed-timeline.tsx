import type { StepRevelation } from '../../hooks/use-flow-order.hook'

/**
 * La révélation reprend la frise elle-même — même cadre, même en-tête muet,
 * même colonne de rang à gauche que `FlowTimeline` — plutôt qu'une liste
 * encadrée détachée empruntée à un autre jeu. La matière de ce jeu est une
 * frise qu'on remonte ; la révéler comme une frise, cette fois dans l'ordre
 * attendu et avec ce que chaque étape apporte, est ce qui la relie à ce que
 * le joueur vient de jouer plutôt que de le renvoyer vers un gabarit
 * générique (`DESIGN.md`, « Vingt jeux, vingt surfaces »).
 *
 * Le numéro qui ouvrait chaque ligne en lecture change de sens sans changer
 * de place : ce n'était pas la place attendue, c'est maintenant le rang —
 * la seule fois où ce jeu la montre.
 */
export const RevealedTimeline = ({
  revelations,
}: {
  revelations: readonly StepRevelation[]
}) => (
  <section className="border border-plane-rule bg-plane">
    <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
      La frise, dans l'ordre où elle se joue réellement
    </header>
    {/* `divide-y` plutôt qu'un filet complet par ligne : sept boîtes
     * pleinement bordées empilent l'épaisseur de bordure pour rien, une
     * révélation est une liste continue à relire, pas sept cartes
     * détachées. `leading-snug` sur la note — deux lignes courantes ici,
     * contre une ligne pour le libellé — plutôt que `leading-relaxed`,
     * réservé aux textes longs à respirer : mesuré en navigateur réel, ce
     * seul changement réduit le débordement mobile de bout en écran de
     * plus d'un tiers (voir la fiche de surface). */}
    <ol className="flex flex-col divide-y divide-plane-rule p-2.5">
      {revelations.map((entry, index) => (
        <li key={entry.id} className="py-2 first:pt-0 last:pb-0">
          <p className="flex items-baseline gap-3 text-plane-foreground text-sm">
            <span
              aria-hidden
              className="w-5 shrink-0 text-left text-plane-foreground/55 text-xs tabular-nums"
            >
              {index + 1}
            </span>
            <span className="min-w-0 font-medium">{entry.label}</span>
          </p>
          <p className="mt-0.5 pl-8 text-plane-foreground/60 text-xs leading-snug">
            {entry.note}
          </p>
        </li>
      ))}
    </ol>
  </section>
)
