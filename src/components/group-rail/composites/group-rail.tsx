/**
 * La rampe des groupes. Au repos, elle porte tout le sens de l'écran d'accueil :
 * la forme de ce qui va être mesuré est lisible avant la première question.
 *
 * La hauteur d'un onglet encode son étendue — un groupe de trois jeux occupe
 * plus de rampe qu'un groupe de deux. Elle remplace la barre de progression :
 * une barre dit combien il reste, la rampe dit de quoi c'est fait.
 *
 * Un groupe non atteint prend une marque structurelle, jamais une opacité
 * réduite : on doit pouvoir le lire, pas le deviner.
 */

export type RailGroup = {
  id: string
  label: string
  gameCount: number
  state: 'done' | 'current' | 'pending'
}

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

export const GroupRail = ({ groups }: { groups: readonly RailGroup[] }) => (
  /**
   * `flex-grow` proportionnel sur une base nulle, et non un `flex-basis` en
   * pourcentage : sept groupes totalisaient 400 % et la rampe débordait de
   * l'écran. Ici les onglets se partagent une hauteur bornée, quel qu'en soit
   * le nombre, et le plancher garde un petit groupe cliquable.
   *
   * La hauteur est plafonnée à 90 % de la fenêtre : les 30 rem visés étaient
   * une constante posée à sept groupes, et un écran court la faisait déborder
   * sous la ligne de flottaison. Le plancher de 90 % laisse voir qu'il y a une
   * page en dessous.
   *
   * `min-w-0` sur la liste elle-même : en rangée, sa largeur minimale est
   * celle de son contenu, et une colonne de grille vaut `auto` — donc bornée
   * par ce minimum, jamais par la fenêtre. C'est ce qui élargissait toute la
   * page à 390 px, la rampe imposant son minimum au reste de l'écran.
   */
  <ol className="flex min-w-0 flex-row gap-1 md:h-[30rem] md:max-h-[90vh] md:flex-col md:gap-1.5">
    {groups.map((group, index) => (
      <li
        key={group.id}
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
          <div className="hidden min-w-0 flex-col justify-center py-1 md:flex">
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
              {group.gameCount} {group.gameCount > 1 ? 'jeux' : 'jeu'}
            </span>
          </div>
        </div>
      </li>
    ))}
  </ol>
)
