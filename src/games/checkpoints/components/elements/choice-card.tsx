/**
 * Une réponse et son coût. Trois de ces cartes forment la question de l'étape :
 * elles ont le même poids, le même filet et la même surface, et aucune n'est
 * l'action recommandée. Seul le focus clavier prend l'anneau.
 *
 * Hiérarchiser les trois — « laisser passer » en secondaire, « re-cadrer » en
 * dangereuse — orienterait la réponse et fausserait la mesure.
 *
 * Le coût est annoncé, la conséquence de refuser ce coût ne l'est jamais : rien
 * ici ne dit ce que l'étape cache.
 */
export const ChoiceCard = ({
  label,
  cost,
  stageLabel,
  onSelect,
}: {
  label: string
  cost: number
  stageLabel: string
  onSelect: () => void
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-label={`${label} — étape ${stageLabel}, coût ${cost}`}
    className="flex flex-1 flex-col gap-3 border border-plane-rule bg-plane px-4 py-3 text-left transition-none hover:border-plane-foreground focus-visible:outline-2 focus-visible:outline-plane-foreground focus-visible:outline-offset-2"
  >
    <span className="font-medium text-plane-foreground text-sm">{label}</span>
    <span className="text-plane-foreground/60 text-xs uppercase tracking-[0.12em] tabular-nums">
      coût {cost}
    </span>
  </button>
)
