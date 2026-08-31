import type { RailGroup } from '../composites/group-rail'

/**
 * Deux listes littérales et non une interpolation : Tailwind ne voit que les
 * classes écrites en toutes lettres dans la source.
 *
 * Un groupe non atteint garde sa teinte, en filet plutôt qu'en fond. La rendre
 * grise faisait disparaître six mondes sur sept de l'écran, puisqu'un seul
 * groupe est courant à la fois.
 */
const FILLS = [
  'bg-group-1',
  'bg-group-2',
  'bg-group-3',
  'bg-group-4',
  'bg-group-5',
  'bg-group-6',
  'bg-group-7',
] as const

const EDGES = [
  'border-group-1',
  'border-group-2',
  'border-group-3',
  'border-group-4',
  'border-group-5',
  'border-group-6',
  'border-group-7',
] as const

/**
 * Le mot d'état, en toutes lettres. Porté par un élément lu et non par la
 * seule combinaison couleur/trait de la barre — sans quoi mobile, où le
 * libellé visible tombe, ne dit plus rien de l'état d'un onglet.
 */
const STATE_WORDS: Record<RailGroup['state'], string> = {
  done: 'terminé',
  current: 'en cours',
  pending: 'à venir',
}

/**
 * Le compte de jeux en toutes lettres, source unique de la pluralisation :
 * le nom accessible et le libellé visible la répétaient chacun de leur côté,
 * et l'un des deux aurait fini par diverger de l'autre.
 */
const gameCountLabel = (gameCount: number): string =>
  `${gameCount} ${gameCount > 1 ? 'jeux' : 'jeu'}`

/**
 * Le nom accessible complet d'un onglet : le libellé du groupe, son étendue,
 * son état. Un seul texte, lu quelle que soit la largeur — la rampe ne rend
 * le bloc de libellé visible qu'à partir de `md`, et un élément à
 * `display: none` sort de l'arbre d'accessibilité.
 */
const describeGroup = (group: RailGroup): string =>
  `${group.label}, ${gameCountLabel(group.gameCount)}, ${STATE_WORDS[group.state]}`

/**
 * Un onglet de la rampe. `index` choisit la teinte dans la palette cyclique,
 * indépendamment de l'état du groupe qu'il colore.
 */
export const RailTab = ({
  group,
  index,
}: {
  group: RailGroup
  index: number
}) => {
  const nameId = `group-rail-tab-${group.id}`

  return (
    <li
      aria-labelledby={nameId}
      /* Le plancher tient les deux lignes du libellé — son nom et son
       * compte de jeux — descendantes comprises. À 36 px il les rognait
       * dès que la rampe se comprimait sur une fenêtre courte. */
      className="flex min-w-0 md:min-h-10"
      style={{ flexGrow: group.gameCount, flexBasis: 0 }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:flex-row md:items-stretch md:gap-3">
        <div
          className={`h-2 w-full shrink-0 md:h-full md:w-4 ${
            group.state === 'pending'
              ? `border-2 border-dashed bg-transparent ${EDGES[index % EDGES.length]}`
              : FILLS[index % FILLS.length]
          } ${group.state === 'current' ? 'ring-2 ring-plane-foreground ring-offset-1' : ''}`}
          aria-hidden="true"
        />
        {/*
         * Le nom accessible de l'onglet entier, référencé par `aria-labelledby`
         * ci-dessus : `listitem` ne tire pas son nom de son contenu, la
         * seule présence de ce texte dans le sous-arbre ne suffit pas.
         * Masqué à l'écran, lu partout — c'est lui, et non le bloc visible
         * ci-dessous, qui porte le libellé, l'étendue et l'état.
         */}
        <span id={nameId} className="sr-only">
          {describeGroup(group)}
        </span>
        <div
          aria-hidden="true"
          className="hidden min-w-0 flex-col justify-center py-1 md:flex"
        >
          <span
            className={`truncate text-plane-foreground text-xs ${
              group.state === 'current'
                ? 'font-semibold'
                : 'font-medium text-plane-foreground/60'
            }`}
          >
            {group.label}
          </span>
          <span className="text-[0.6875rem] text-plane-foreground/50 tabular-nums">
            {gameCountLabel(group.gameCount)}
          </span>
        </div>
      </div>
    </li>
  )
}
