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

const HUES = [
  'bg-group-1',
  'bg-group-2',
  'bg-group-3',
  'bg-group-4',
  'bg-group-5',
  'bg-group-6',
  'bg-group-7',
] as const

export const GroupRail = ({ groups }: { groups: readonly RailGroup[] }) => {
  const largest = Math.max(1, ...groups.map((group) => group.gameCount))

  return (
    <ol className="flex flex-row gap-1 md:h-full md:min-h-96 md:flex-col md:gap-1.5">
      {groups.map((group, index) => (
        <li
          key={group.id}
          className="flex min-w-0 flex-1 md:flex-none"
          style={{ flexBasis: `${(group.gameCount / largest) * 100}%` }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:flex-row md:items-stretch md:gap-3">
            <div
              className={`h-2 w-full shrink-0 md:h-full md:w-2.5 ${HUES[index % HUES.length]} ${
                group.state === 'pending'
                  ? 'border-2 border-plane-rule border-dashed bg-transparent'
                  : ''
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
}
