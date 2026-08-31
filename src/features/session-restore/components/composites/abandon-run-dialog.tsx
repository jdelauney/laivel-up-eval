import { Button } from '../../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'

/**
 * La phrase entière bascule au singulier ou au pluriel, jamais ses seuls
 * suffixes : à `submitted === 1`, « Les 1 réponse... seront » gardait
 * l'article et le verbe au pluriel pour un compte singulier.
 */
const submittedClause = (submitted: number): string => {
  if (submitted === 0) return ''
  if (submitted === 1) return 'La réponse déjà soumise sera effacée. '
  return `Les ${submitted} réponses déjà soumises seront effacées. `
}

/**
 * La confirmation, sans savoir ce qu'elle détruit : elle reçoit un compte de
 * réponses, le titre et la conséquence à afficher, et deux gestes — jamais
 * la façade ni le store. Le titre et la conséquence diffèrent entre le
 * parcours et le verdict ; ils sont décidés à l'appel, pas ici. « Effacer »
 * n'est pas l'action par défaut du dialogue — la fermeture au clavier
 * annule, elle ne détruit rien.
 *
 * `showCloseButton={false}` : `DialogContent` porte par défaut un bouton de
 * fermeture au libellé anglais (« Close ») — le dialogue a déjà son bouton
 * « Annuler ».
 */
export const AbandonRunDialog = ({
  open,
  submitted,
  title,
  consequence,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  submitted: number
  title: string
  consequence: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {submittedClause(submitted)}
          {consequence}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Annuler
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm}>
          Effacer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
