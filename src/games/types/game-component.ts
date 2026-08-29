import type { ComponentType } from 'react'

/**
 * Le contrat d'affichage d'un jeu. Il vit ici et non dans
 * `core/registry/game-registry.ts` : le domaine n'importe pas React, et cette
 * règle prime sur l'exemple de TECHNICAL.md §2.3 qui logeait le composant dans
 * le contrat enregistré.
 *
 * Un jeu a donc deux points d'entrée symétriques : son évaluateur côté domaine,
 * son composant côté interface, tous deux résolus par le même `type`.
 */
export type GameComponentProps = {
  config: unknown
  onSubmit: (answer: unknown) => void
}

export type GameComponent = ComponentType<GameComponentProps>
