import { CheckIcon, CircleIcon } from 'lucide-react'
import type { DefectKind } from '../../schema/config.schema'

const KIND_LABEL: Record<DefectKind, string> = {
  security: 'Sécurité',
  logic: 'Logique',
  'hallucinated-dependency': 'Dépendance hallucinée',
  contract: 'Contrat',
  resource: 'Ressource',
}

/**
 * Ce qu'un défaut était : sa ligne, sa nature, la phrase qui explique pourquoi
 * c'en est un. N'existe qu'après le rendu — c'est ce que le joueur emporte du
 * jeu, et la seule contrepartie honnête au fait qu'on ne lui ait rien dit
 * avant.
 *
 * L'annotation reprend la marge de la feuille : même glyphe, même place, même
 * triade. Le joueur retrouve d'un coup d'œil laquelle de ses frappes a porté,
 * sans avoir à faire l'aller-retour avec l'extrait.
 *
 * Purement présentationnel : il affiche ce qu'on lui donne, il ne connaît ni
 * le barème ni les critères qui liront ce défaut.
 */
export const DefectReveal = ({
  line,
  kind,
  reveal,
  found,
  order,
}: {
  line: number
  kind: DefectKind
  reveal: string
  found: boolean
  order: number
}) => (
  <div
    // Le seul moment animé du jeu, et l'exception que `DESIGN.md` tolère :
    // une entrée qui apparaît. Le verdict se pose, décalé défaut par défaut,
    // depuis un état déjà lisible — jamais un fondu qui masque le contenu.
    style={{ animationDelay: `${order * 70}ms` }}
    className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-x-2 border-plane-rule border-t px-4 py-3 motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:animate-in motion-safe:fill-mode-backwards motion-safe:duration-500 motion-safe:ease-out"
  >
    <span className="flex h-[1.4rem] items-center justify-center">
      {found ? (
        <CheckIcon aria-hidden className="size-3.5 text-nominal" />
      ) : (
        <CircleIcon aria-hidden className="size-3.5 text-missed" />
      )}
    </span>

    <div>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-plane-foreground text-sm tabular-nums">
          Ligne {line}
        </span>
        <span className="font-medium text-[10px] text-plane-foreground/50 uppercase tracking-[0.16em]">
          {KIND_LABEL[kind]}
        </span>
        <span
          className={`font-semibold text-[10px] uppercase tracking-[0.16em] ${
            found ? 'text-nominal' : 'text-missed'
          }`}
        >
          {found ? 'trouvé' : 'manqué'}
        </span>
      </p>

      <p className="mt-1.5 max-w-[68ch] text-plane-foreground/80 text-sm leading-relaxed">
        {reveal}
      </p>
    </div>
  </div>
)
