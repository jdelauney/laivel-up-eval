/**
 * Une ligne de la légende permanente de la réserve : le numéro qui résout
 * le badge du plan, le libellé entier, et le geste de saisir cette
 * pratique — posée ou non. Ne connaît ni le hook, ni la configuration, ni
 * la coordonnée d'un jeton — la position sur le plan est l'affaire du
 * composite qui l'y place.
 *
 * Deux états, deux quantités distinctes, jamais une teinte seule :
 * - **saisi** se porte par le filet de la ligne (plein, plus épais) et le
 *   poids du texte ;
 * - **posé** se porte par le marqueur rond à gauche du numéro — plein une
 *   fois posé, évidé tant que la pratique reste en réserve. Une pratique
 *   posée ne quitte jamais la légende : c'est ce marqueur qui change, pas
 *   la liste elle-même.
 */
export const PracticeToken = ({
  number,
  label,
  placed,
  held,
  onHold,
}: {
  number: number
  label: string
  placed: boolean
  held: boolean
  onHold: () => void
}) => (
  <button
    type="button"
    aria-pressed={held}
    aria-label={label}
    onClick={onHold}
    className={`flex items-start gap-2 border px-2.5 py-1.5 text-left text-plane-foreground text-sm outline-plane-foreground -outline-offset-2 focus-visible:outline-2 ${
      held
        ? 'border-plane-foreground font-medium'
        : 'border-plane-rule hover:border-plane-foreground'
    }`}
  >
    <span
      aria-hidden
      className={`mt-1 size-2.5 shrink-0 rounded-full border ${
        placed
          ? 'border-plane-foreground bg-plane-foreground'
          : 'border-plane-rule bg-transparent'
      }`}
    />
    {/* Flux normal, jamais flex : un conteneur flex hérite d'un
     * `min-width: auto` qui refusait de rétrécir sous la largeur non
     * repliée du libellé, forçant chaque ligne à plusieurs fois sa hauteur
     * réelle. Le texte s'enroule normalement dans un flux de bloc. */}
    <span className="min-w-0">
      <span aria-hidden className="tabular-nums">
        {number}.
      </span>{' '}
      <span>{label}</span>
    </span>
  </button>
)
