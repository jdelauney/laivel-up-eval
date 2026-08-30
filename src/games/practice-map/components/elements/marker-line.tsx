/**
 * Une pratique et son repère, à la révélation : ce que la pratique demande
 * réellement, jamais sa place attendue, jamais un verdict de placement.
 */
export const MarkerLine = ({
  label,
  marker,
}: {
  label: string
  marker: string
}) => (
  <div className="border-plane-rule border-b px-3 py-2 last:border-b-0">
    <p className="text-plane-foreground text-sm leading-snug">{label}</p>
    <p className="mt-1 text-plane-foreground/75 text-sm leading-relaxed">
      {marker}
    </p>
  </div>
)
