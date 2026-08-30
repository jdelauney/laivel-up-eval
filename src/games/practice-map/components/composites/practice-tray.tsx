import type { PracticeToken as PracticeTokenView } from '../../hooks/use-practice-map.hook'
import { PracticeToken } from '../elements/practice-token'

/**
 * La réserve des pratiques encore à poser, et ce qu'il en reste — en clair,
 * pour que la réserve dise elle-même ce qui manque quand la soumission
 * reste indisponible.
 */
export const PracticeTray = ({
  tokens,
  heldId,
  onHold,
}: {
  tokens: readonly PracticeTokenView[]
  heldId: string | undefined
  onHold: (practiceId: string) => void
}) => (
  <section className="border border-plane-rule bg-plane">
    <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
      La réserve
    </header>
    <div className="flex flex-col gap-2 p-3">
      {tokens.map((token) => (
        <PracticeToken
          key={token.id}
          label={token.label}
          held={token.id === heldId}
          onHold={() => onHold(token.id)}
        />
      ))}
    </div>
    <p
      aria-live="polite"
      className="border-plane-rule border-t px-3 py-2 font-medium text-[10px] text-plane-foreground/50 uppercase tabular-nums tracking-[0.14em]"
    >
      {tokens.length === 0
        ? 'Toutes les pratiques sont posées.'
        : `Il reste ${tokens.length} pratique${tokens.length > 1 ? 's' : ''} à poser.`}
    </p>
  </section>
)
