/**
 * L'écran du gel : un état neutre entre la partie et la révélation. Ni
 * couleur, ni compte de justes — seulement le fait que le tri est arrêté et
 * combien de cartes ont reçu un verdict, sur `total`. Extrait de
 * `KeepOrTossGame` pour la même raison que `RevealedCamps` : une vue de
 * phase par fichier, jamais une fonction qui porte les trois à la fois.
 *
 * Ne porte pas le bouton « Voir la révélation » : `KeepOrTossGame` le pose
 * dans son propre `<div>`, hors de ce bloc encadré, sur le même modèle que
 * le bouton « Continuer » de l'écran révélé — une seule action primaire par
 * écran, jamais nichée dans la plaque qu'elle referme.
 */
export const FrozenPanel = ({
  sortedCount,
  total,
}: {
  sortedCount: number
  total: number
}) => (
  <section className="flex flex-col items-start gap-3 border border-plane-rule bg-plane px-4 py-6">
    <p className="font-medium text-plane-foreground/70 text-xs uppercase tracking-[0.14em]">
      Le tri est figé
    </p>
    <p className="text-plane-foreground text-sm leading-relaxed">
      {sortedCount} carte{sortedCount === 1 ? '' : 's'} sur {total} ont reçu un
      verdict.
    </p>
  </section>
)
