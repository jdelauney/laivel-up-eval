import type { ComponentType } from 'react'

/**
 * Le contrat d'affichage d'un jeu. Il vit ici et non dans
 * `core/registry/game-registry.ts` : le domaine n'importe pas React, et cette
 * règle prime sur l'exemple de TECHNICAL.md §2.3 qui logeait le composant dans
 * le contrat enregistré.
 *
 * Un jeu a donc deux points d'entrée symétriques : son évaluateur côté domaine,
 * son composant côté interface, tous deux résolus par le même `type`.
 *
 * Deux rappels, jamais un seul : `onLock` évalue, empile et **écrit** la
 * trace — c'est `GameSessionFacade.submitAnswer`, sans avancer — et
 * `onAdvance` passe au jeu suivant. Un jeu à révélation appelle `onLock` au
 * moment où il bascule en phase de révélation, et `onAdvance` sur son geste
 * « Continuer » ; un jeu sans révélation appelle les deux à la suite, dans le
 * même geste. Séparer les deux évite qu'un rechargement pendant la
 * révélation ne rejoue le jeu sans qu'aucune trace n'ait été écrite —
 * `aidd_docs/backlog/defects/la-revelation-precede-le-verrou-donc-un-rechargement-la-rejoue.md`.
 */
export type GameComponentProps = {
  config: unknown
  onLock: (answer: unknown) => void
  onAdvance: () => void
}

export type GameComponent = ComponentType<GameComponentProps>
