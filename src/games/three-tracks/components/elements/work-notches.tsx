/**
 * La jauge d'avancement d'un chantier : un cran par unité de travail, les
 * crans acquis pleins, les restants évidés. Jamais une barre continue — ce
 * monde avance par crans, il ne fond pas.
 *
 * Purement présentationnel : il affiche ce qu'on lui donne, il ne connaît ni
 * le chantier ni son état.
 */
export const WorkNotches = ({
  progress,
  work,
}: {
  progress: number
  work: number
}) => {
  const notchCount = Math.ceil(work)
  const filledCount = Math.min(Math.floor(progress), notchCount)

  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className="flex gap-0.5">
        {Array.from({ length: notchCount }, (_, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: crans anonymes, longueur fixe pour un rendu donné, jamais réordonnés ni filtrés.
            key={index}
            className={
              index < filledCount
                ? 'size-2 bg-plane-foreground'
                : 'size-2 border border-plane-foreground bg-transparent'
            }
          />
        ))}
      </span>
      <span className="text-plane-foreground text-xs tabular-nums">
        {progress} / {work}
      </span>
    </span>
  )
}
