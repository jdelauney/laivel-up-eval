/**
 * La carte au centre de la pile : un libellé, rien d'autre. Ni coche, ni
 * couleur d'état, ni indice de ce que la réponse attendue pourrait être —
 * `DESIGN.md`, « Aucune validation, aucun retour, aucun compteur de justes
 * avant la fin. »
 *
 * Purement présentationnel : elle affiche ce qu'on lui donne, elle ne
 * connaît ni le hook ni la configuration.
 */
export const PracticeCard = ({ label }: { label: string }) => (
  <div className="flex min-h-32 items-center justify-center border border-plane-rule bg-plane px-6 py-8 text-center sm:min-h-40">
    <p className="max-w-[42ch] text-lg text-plane-foreground leading-relaxed">
      {label}
    </p>
  </div>
)
