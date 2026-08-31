/**
 * La carte au centre de la pile : un libellé, rien d'autre. Ni coche, ni
 * couleur d'état, ni indice de ce que la réponse attendue pourrait être —
 * `DESIGN.md`, « Aucune validation, aucun retour, aucun compteur de justes
 * avant la fin. »
 *
 * `aria-live="polite"` porte le libellé lui-même, jamais seulement le
 * chronomètre : la carte remplace son contenu en place à chaque tri (même
 * position dans l'arbre, aucun démontage), donc un lecteur d'écran annonce
 * la carte suivante sans que le joueur n'ait à quitter le bouton pour aller
 * la chercher. Avant ce correctif, seul `CountdownBar` portait un
 * `aria-live` : un joueur au clavier ne pouvait que marteler une flèche au
 * hasard, faute de savoir ce sur quoi son geste suivant portait — constat de
 * la revue du 31/08.
 *
 * `onClick` ne trie rien : la carte reste inerte au clic, elle ne devient
 * pas un contrôle. Il sert uniquement à restaurer le focus sur un bouton de
 * tri quand le joueur clique la carte elle-même — geste naturel, on clique
 * ce qu'on regarde — ce qui déplaçait sinon le focus vers `<body>` et tuait
 * les flèches en silence, sans le moindre signal. Voir `SortingDeck`.
 *
 * Pas d'équivalent clavier à ce geste, et c'est volontaire : un joueur au
 * clavier atteint déjà les deux boutons directement, sans jamais passer par
 * la carte — lui donner un `role` et une écoute clavier prétendrait à tort
 * qu'elle est un contrôle, alors qu'elle rattrape un seul effet de bord de
 * la souris, rien de plus.
 *
 * Purement présentationnel : elle affiche ce qu'on lui donne, elle ne
 * connaît ni le hook ni la configuration.
 */
export const PracticeCard = ({
  label,
  onClick,
}: {
  label: string
  onClick?: () => void
}) => (
  // biome-ignore lint/a11y/noStaticElementInteractions: rattrape un effet de bord de la souris (le clic qui vole le focus), jamais une action que le clavier devrait aussi déclencher — voir le docblock.
  // biome-ignore lint/a11y/useKeyWithClickEvents: aucun équivalent clavier à fournir : le clavier n'a jamais besoin de cliquer la carte, il atteint les boutons directement.
  <div
    aria-live="polite"
    onClick={onClick}
    className="flex min-h-32 items-center justify-center border border-plane-rule bg-plane px-6 py-8 text-center sm:min-h-40"
  >
    <p className="max-w-[42ch] text-lg text-plane-foreground leading-relaxed">
      {label}
    </p>
  </div>
)
