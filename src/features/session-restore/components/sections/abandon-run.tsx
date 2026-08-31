import { useState } from 'react'
import { useSessionFacade } from '@/providers/session-context'
import { Button } from '../../../../components/ui/button'
import { useSessionStore } from '../../../../store/session.store'
import { AbandonRunDialog } from '../composites/abandon-run-dialog'

/**
 * La seule sortie d'une partie en cours ou d'un verdict acquis, depuis que
 * l'accueil ne montre plus de carte de reprise. Sans elle, une partie ouverte
 * devient une impasse : la seule façon de recommencer serait de vider son
 * LocalStorage.
 *
 * Le libellé du déclencheur, le titre et la conséquence du dialogue sont
 * reçus, pas devinés : abandonner une partie en cours et effacer un verdict
 * acquis ne sont pas le même geste, et ce composant n'a aucun moyen fiable de
 * distinguer les deux sans lire l'écran courant — décision que `App` a déjà
 * prise pour l'appeler.
 */
export const AbandonRun = ({
  triggerLabel,
  dialogTitle,
  consequence,
}: {
  triggerLabel: string
  dialogTitle: string
  consequence: string
}) => {
  const facade = useSessionFacade()
  const submitted = useSessionStore((state) => state.progress?.submitted ?? 0)
  const reset = useSessionStore((state) => state.reset)
  const [open, setOpen] = useState(false)

  const confirmAbandon = (): void => {
    facade.resetSession()
    reset()
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <AbandonRunDialog
        open={open}
        submitted={submitted}
        title={dialogTitle}
        consequence={consequence}
        onOpenChange={setOpen}
        onConfirm={confirmAbandon}
      />
    </>
  )
}
