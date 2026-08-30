import { CheckIcon, CircleIcon, XIcon } from 'lucide-react'
import type { LineVerdict } from '../../hooks/use-defect-hunt.hook'

type SettledVerdict = Exclude<LineVerdict, undefined>

const VERDICT_LABEL: Record<SettledVerdict, string> = {
  found: 'trouvé',
  missed: 'manqué',
  'false-positive': 'à côté',
}

/**
 * Trois verdicts, trois formes tirées de la bibliothèque d'icônes du projet,
 * et trois places sur la triade d'état — jamais la couleur seule : le mot est
 * écrit à côté, et les trois glyphes se distinguent à la forme.
 *
 * Le faux positif est en vigilance, pas en manqué : marquer une ligne saine
 * est une erreur plus douce que laisser passer un défaut, et la triade dit
 * exactement ça.
 */
const VERDICT_TONE: Record<SettledVerdict, { icon: string; row: string }> = {
  found: { icon: 'text-nominal', row: 'bg-nominal/7' },
  missed: { icon: 'text-missed', row: 'bg-missed/7' },
  'false-positive': { icon: 'text-caution', row: 'bg-caution/9' },
}

const VerdictMark = ({ verdict }: { verdict: SettledVerdict }) => {
  const className = `size-3.5 ${VERDICT_TONE[verdict].icon}`

  if (verdict === 'found')
    return <CheckIcon aria-hidden className={className} />
  if (verdict === 'false-positive')
    return <XIcon aria-hidden className={className} />
  return <CircleIcon aria-hidden className={className} />
}

/**
 * Une ligne de l'épreuve : la marge où l'on frappe, le numéro, le code.
 *
 * Avant le rendu, c'est une option d'une liste à sélection multiple — pas un
 * bouton : vingt-cinq boutons feraient vingt-cinq arrêts de tabulation, et un
 * joueur au clavier devrait traverser tout le code pour atteindre le rendu.
 * La liste porte le focus, les flèches parcourent, l'espace marque. Voir
 * `use-roving-focus.hook.ts`.
 *
 * Après le rendu, ce n'est plus un contrôle : une ligne figée qui porte son
 * verdict en toutes lettres, la marge ne fait qu'appuyer.
 *
 * Purement présentationnel : il affiche ce qu'on lui donne, il ne sait ni ce
 * qu'est un défaut ni combien il y en a.
 */
export const CodeLine = ({
  lineNumber,
  rovingIndex,
  code,
  marked,
  verdict,
  active,
  locked,
  onToggle,
  onFocusLine,
}: {
  lineNumber: number
  rovingIndex: number
  code: string
  marked: boolean
  verdict: LineVerdict
  active: boolean
  locked: boolean
  onToggle?: (line: number) => void
  onFocusLine?: (index: number) => void
}) => {
  const tone = verdict === undefined ? undefined : VERDICT_TONE[verdict]

  const rowGround =
    tone?.row ?? (marked && !locked ? 'bg-plane-foreground/6' : '')

  const cells = (
    <>
      {/* La marge de relecture. Vide sur une ligne qu'on laisse passer, elle
       * porte la frappe du joueur avant le rendu, le verdict après. */}
      <span className="flex h-[1.65em] items-center justify-center">
        {verdict !== undefined ? (
          <VerdictMark verdict={verdict} />
        ) : marked ? (
          <CheckIcon
            aria-hidden
            className="size-3.5 text-plane-foreground"
            strokeWidth={2.75}
          />
        ) : (
          !locked && (
            <CheckIcon
              aria-hidden
              className="size-3.5 text-plane-foreground/0 transition-none group-hover/line:text-plane-foreground/25"
              strokeWidth={2.75}
            />
          )
        )}
      </span>

      {/* Le filet du registre : la marge se sépare du corps par un trait qui
       * court sur toute la hauteur de la feuille, filet de ligne après filet
       * de ligne. Le numéro ne part pas à la copie. */}
      <span className="select-none border-plane-rule border-r pr-2 text-right font-mono text-[11px] text-plane-foreground/40 tabular-nums leading-[1.65]">
        {lineNumber}
      </span>

      <span className="whitespace-pre-wrap wrap-break-word pl-1 font-mono text-[13px] text-plane-foreground leading-[1.65]">
        {code}
      </span>

      {verdict !== undefined ? (
        <span
          className={`whitespace-nowrap pl-3 font-medium text-[10px] uppercase tracking-[0.14em] leading-[1.65] ${tone?.icon ?? ''}`}
        >
          {VERDICT_LABEL[verdict]}
        </span>
      ) : null}
    </>
  )

  const columns =
    verdict === undefined
      ? 'grid-cols-[1.5rem_2.25rem_minmax(0,1fr)]'
      : 'grid-cols-[1.5rem_2.25rem_minmax(0,1fr)_auto]'

  // Le verrou tient à `locked`, jamais à la présence d'un verdict : une ligne
  // saine et jamais marquée n'a pas de verdict à porter, mais elle doit tout
  // de même geler avec le reste de l'épreuve une fois la revue rendue.
  if (locked) {
    return (
      <div className={`grid items-start gap-x-2 px-2 ${columns} ${rowGround}`}>
        {cells}
      </div>
    )
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: le clavier est porté par la liste, pas par la ligne — un gestionnaire par ligne rouvrirait les vingt-cinq arrêts de tabulation que le motif à focus glissant ferme.
    <div
      role="option"
      aria-selected={marked}
      /**
       * Le code est DANS le nom accessible, jamais seulement dans le contenu :
       * sur une `option`, `aria-label` remplace le contenu, et un libellé
       * réduit au numéro ferait annoncer « Ligne 3 » sans jamais dire ce
       * qu'elle contient. Le jeu consiste à lire du code — il serait
       * injouable au lecteur d'écran.
       */
      aria-label={`Ligne ${lineNumber} : ${code.trim() === '' ? 'ligne vide' : code.trim()}`}
      data-roving-index={rovingIndex}
      tabIndex={active ? 0 : -1}
      onClick={() => onToggle?.(lineNumber)}
      onFocus={() => onFocusLine?.(rovingIndex)}
      className={`group/line grid cursor-pointer items-start gap-x-2 px-2 outline-plane-foreground -outline-offset-2 focus-visible:outline-2 ${columns} ${rowGround} hover:bg-plane-foreground/4`}
    >
      {cells}
    </div>
  )
}
