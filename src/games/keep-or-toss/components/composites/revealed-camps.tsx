import type { ItemRevelation } from '../../hooks/use-keep-or-toss.hook'

/**
 * La révélation reprend la matière propre de ce jeu — douze cartes qui
 * viennent d'être triées sous contrainte de temps vers deux destinations
 * fixes — plutôt que la bande à deux paragraphes empruntée à `practice-map`
 * (`MarkerLine` : `border-plane-rule border-b px-3 py-2 last:border-b-0`
 * plus deux `<p>`). C'était le même objet au caractère près, alors que
 * `DESIGN.md` l'interdit : « Vingt jeux, vingt surfaces. Aucun n'hérite de
 * la composition d'un autre. » Constat de la revue du 31/08, la même faute
 * que ce commit venait de corriger sur `flow-order` (`RevealedTimeline`).
 *
 * Deux camps, l'un à côté de l'autre — Gardées à gauche, Jetées à droite,
 * dans le même ordre que les deux destinations de `SortingDeck` pendant la
 * partie — plutôt qu'une seule liste linéaire : la carte qui vient de
 * trancher entre deux piles se relit comme deux piles, pas comme une seule
 * colonne indifférenciée.
 *
 * **Le titre de chaque camp reste neutre, jamais `--nominal` / `--missed`.**
 * Cette triade note la performance du joueur ailleurs dans le produit
 * (`CountdownBar`, `RuleReadout`…) ; la révélation de `keep-or-toss` ne
 * montre jamais ce que le joueur a répondu, seulement le classement réel —
 * la colorer avec la triade de performance ferait dire à la couleur autre
 * chose que ce qu'elle dit, exactement l'écart que `ClaimCard`
 * (`lie-detector`) et `CauseOption` (`hint-budget`) s'interdisent pour la
 * même raison. Le mot du titre (« Gardées », « Jetées ») porte déjà
 * l'information ; la position (gauche/droite, dans l'ordre des destinations
 * de `SortingDeck`) la double sans recourir à la couleur.
 */
export const RevealedCamps = ({
  revelations,
}: {
  revelations: readonly ItemRevelation[]
}) => {
  const kept = revelations.filter((entry) => entry.keep)
  const tossed = revelations.filter((entry) => !entry.keep)

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <RevealedCamp title="Gardées" entries={kept} />
      <RevealedCamp title="Jetées" entries={tossed} />
    </div>
  )
}

const RevealedCamp = ({
  title,
  entries,
}: {
  title: string
  entries: readonly ItemRevelation[]
}) => (
  <section className="border border-plane-rule bg-plane">
    <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
      {title}
    </header>
    <ol className="flex flex-col divide-y divide-plane-rule p-2.5">
      {entries.map((entry) => (
        <li key={entry.id} className="py-2 first:pt-0 last:pb-0">
          <p className="font-medium text-plane-foreground text-sm">
            {entry.label}
          </p>
          <p className="mt-0.5 text-plane-foreground/60 text-xs leading-snug">
            {entry.reason}
          </p>
        </li>
      ))}
    </ol>
  </section>
)
