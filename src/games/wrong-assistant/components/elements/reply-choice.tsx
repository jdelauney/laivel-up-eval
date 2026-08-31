import { Button } from '../../../../components/ui/button'

/**
 * Une réponse possible au tour courant. Purement présentationnel : elle
 * reçoit un texte et rien d'autre — jamais `stance`, jamais un ordre stable
 * qui la classerait. `WrongAssistantGame` les pose dans l'ordre où le corpus
 * les déclare, et cet ordre ne varie jamais d'un joueur à l'autre — un ordre
 * qui se réordonnerait selon la nature de la réponse serait déjà un indice.
 *
 * Bouton natif pour l'atteignabilité au clavier native, sur le modèle de
 * `ClaimCard` : un arrêt de tabulation par réponse, sans hook de focus
 * glissant.
 */
export const ReplyChoice = ({
  text,
  autoFocus,
  onSelect,
}: {
  text: string
  autoFocus?: boolean
  onSelect: () => void
}) => (
  <Button
    type="button"
    variant="outline"
    size="lg"
    autoFocus={autoFocus}
    onClick={onSelect}
    className="h-auto justify-start whitespace-normal text-left"
  >
    {text}
  </Button>
)
