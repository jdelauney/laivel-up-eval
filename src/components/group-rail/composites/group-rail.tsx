import { RailTab } from '../elements/rail-tab'

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

export const GroupRail = ({
  groups,
  accessibleName,
}: {
  groups: readonly RailGroup[]
  /**
   * Le nom accessible de la liste, décidé à l'appel : le parcours y lit une
   * progression, l'accueil n'y lit qu'une forme, sept groupes tous à venir.
   * Un même « Progression dans le parcours » codé ici mentirait sur l'écran
   * d'accueil.
   */
  accessibleName: string
}) => (
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
  <ol
    aria-label={accessibleName}
    className="flex min-w-0 flex-row gap-1 md:h-[30rem] md:max-h-[90vh] md:flex-col md:gap-1.5"
  >
    {groups.map((group, index) => (
      <RailTab key={group.id} group={group} index={index} />
    ))}
  </ol>
)
