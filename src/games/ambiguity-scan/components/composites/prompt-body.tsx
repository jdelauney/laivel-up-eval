import type { SegmentView } from '../../hooks/use-ambiguity-scan.hook'
import { SegmentToggle } from '../elements/segment-toggle'

/**
 * Le prompt s'affiche en un bloc continu, jamais en liste : chaque segment
 * est un bouton inline dans le flux de texte. Rien ne distingue un segment
 * ambigu d'un segment clair avant la révélation — seul l'état signalé se
 * voit, sur le modèle du garde-fou déjà posé par `practice-token.tsx`.
 */
export const PromptBody = ({
  title,
  segments,
  onToggle,
}: {
  title: string
  segments: readonly SegmentView[]
  onToggle: (segmentId: string) => void
}) => (
  <section className="border border-plane-rule bg-plane">
    <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
      {title}
    </header>
    <p className="px-3 py-3 text-plane-foreground text-sm leading-loose">
      {segments.map((segment, index) => (
        <span key={segment.id}>
          <SegmentToggle
            text={segment.text}
            flagged={segment.flagged}
            onToggle={() => onToggle(segment.id)}
          />
          {index < segments.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  </section>
)
