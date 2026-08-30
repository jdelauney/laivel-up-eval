import { Check } from 'lucide-react'

/**
 * Une lecture proposée du rapport, à retenir ou non, désactivée une fois le
 * cadre déposé.
 *
 * Purement présentationnel : il ne reçoit jamais `established`, seulement
 * `text` — une lecture établie et une supposition se rendent donc
 * **exactement pareil**, par construction plutôt que par discipline.
 */
export const FramingLine = ({
  text,
  retained,
  locked,
  onToggle,
}: {
  text: string
  retained: boolean
  locked: boolean
  onToggle: () => void
}) => (
  <button
    type="button"
    aria-pressed={retained}
    disabled={locked}
    onClick={onToggle}
    className="flex w-full items-start gap-2 border-plane-rule border-b px-3 py-2 text-left last:border-b-0 hover:bg-plane-foreground/4 focus-visible:outline-2 focus-visible:outline-plane-foreground focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:hover:bg-transparent"
  >
    <span
      aria-hidden
      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center border ${
        retained
          ? 'border-plane-foreground bg-plane-foreground text-plane'
          : 'border-plane-rule'
      }`}
    >
      {retained ? <Check className="size-3" strokeWidth={2.5} /> : null}
    </span>
    <span className="text-plane-foreground text-sm leading-snug">{text}</span>
  </button>
)
