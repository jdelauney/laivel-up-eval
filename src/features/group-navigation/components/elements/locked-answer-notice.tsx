import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '../../../../components/ui/button'

const REASON_ID = 'locked-answer-reason'

/**
 * Le retour refusé, rendu une fois pour tout le parcours, dès la première
 * situation — là où rien n'a encore été soumis. Un avertissement de
 * finalité n'a de valeur qu'AVANT le premier engagement : lu pour la
 * première fois sur la situation 2, il arriverait trop tard pour la
 * réponse 1, déjà définitive. Sans propriété : le verrou ne varie ni par jeu
 * ni par groupe, et une propriété inviterait un jeu à y déroger.
 *
 * Le contrôle est désactivé plutôt qu'absent : un joueur qui ne trouve pas de
 * retour le cherche, il ne conclut pas qu'il n'y en a pas. Sa raison est
 * rattachée par `aria-describedby`, pas seulement posée à côté visuellement.
 *
 * `aria-disabled` plutôt que l'attribut natif `disabled` : ce dernier retire
 * le bouton de l'ordre de tabulation, ce qui refuse le retour par un
 * contrôle absent au clavier — exactement ce que ce composant existe pour
 * éviter. L'apparence désactivée vient des classes ci-dessous, et l'activer
 * ne fait rien.
 */
export const LockedAnswerNotice = () => (
  <div className="flex flex-wrap items-center gap-2 border border-plane-rule border-dashed bg-plane px-4 py-2">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-disabled="true"
      aria-describedby={REASON_ID}
      className="pointer-events-none opacity-50"
      onClick={(event) => event.preventDefault()}
    >
      <ArrowLeftIcon aria-hidden="true" />
      Revenir en arrière
    </Button>
    <span id={REASON_ID} className="text-plane-foreground/60 text-sm">
      Une réponse soumise est définitive
    </span>
  </div>
)
