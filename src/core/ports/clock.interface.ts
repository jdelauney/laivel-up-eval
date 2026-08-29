/**
 * Le temps n'entre dans le domaine que par ce port. Aucun appel direct à
 * `Date` sous `core/` : le mode rejeu injecte une horloge figée pour que la
 * trace d'audit d'un profil reste identique d'une exécution à l'autre.
 */
export interface Clock {
  /** Un instant au format ISO-8601, prêt pour la persistance et l'export. */
  now(): string
}
