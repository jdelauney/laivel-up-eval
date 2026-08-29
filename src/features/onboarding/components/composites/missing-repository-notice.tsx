import type { RepositoryProvenAxis } from '@/core/scoring/helpers/repository-proven-axes.helper'

/**
 * Ce que le verdict ne pourra pas asseoir sur un historique tant que le
 * champ dépôt reste vide. Purement présentationnel : elle reçoit les axes
 * déjà nommés et libellés, elle n'en décide aucun.
 */
const joinAxisLabels = (labels: readonly string[]): string => {
  if (labels.length <= 1) return labels.at(0) ?? ''

  const last = labels.at(-1)
  const leading = labels.slice(0, -1)
  return `${leading.join(', ')} et ${last}`
}

export const MissingRepositoryNotice = ({
  axes,
}: {
  axes: readonly RepositoryProvenAxis[]
}) => {
  if (axes.length === 0) return null

  const labels = joinAxisLabels(axes.map((axis) => axis.label))

  return (
    <p className="border-plane-rule border-l pl-4 text-plane-foreground/70 text-sm">
      Entrer sans dépôt est un usage prévu&nbsp;: le parcours se joue en entier.
      Faute d'historique à lire, {labels} reposeront alors sur ce seul parcours.
      Le verdict le dira, et restera plafonné sur eux.
    </p>
  )
}
