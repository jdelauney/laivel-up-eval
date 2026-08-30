import { Lock } from 'lucide-react'

/**
 * Un indice du marché : ce sur quoi il porte, son prix — lisible avant
 * l'achat, sans survol ni dépliage — puis son texte une fois acheté. Le
 * prix reste lisible après l'achat.
 *
 * L'achat est unitaire : ce composant ne porte qu'un seul geste, sur un
 * seul indice. Rien ici ne permet d'en acheter plusieurs d'un coup.
 *
 * `interactive` désactive le bouton une fois la situation révélée : sans
 * lui, un indice non acheté gardait un bouton « Acheter » d'apparence
 * active dont le clic ne faisait plus rien, une affordance morte — le même
 * verrou que `FramingLine` applique déjà sur le cadrage.
 */
export const HintCard = ({
  label,
  cost,
  bought,
  interactive,
  text,
  onBuy,
}: {
  label: string
  cost: number
  bought: boolean
  interactive: boolean
  text?: string
  // Absent sur un indice déjà acheté : `HintCard` ne rend alors plus jamais
  // le bouton qui l'appellerait.
  onBuy?: () => void
}) => (
  <div className="border-plane-rule border-b px-3 py-2 last:border-b-0">
    <div className="flex flex-col items-start gap-1.5">
      <span className="text-plane-foreground text-sm">{label}</span>
      {bought ? (
        <span className="flex items-center gap-1 font-medium text-[10px] text-plane-foreground/50 uppercase tabular-nums tracking-[0.14em]">
          <Lock aria-hidden className="size-3" />
          {cost}
        </span>
      ) : (
        <button
          type="button"
          disabled={!interactive}
          onClick={onBuy}
          className="shrink-0 border border-plane-rule px-2.5 py-1 font-medium text-[10px] text-plane-foreground uppercase tabular-nums tracking-[0.14em] hover:border-plane-foreground focus-visible:outline-2 focus-visible:outline-plane-foreground focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:hover:border-plane-rule"
        >
          Acheter · {cost}
        </button>
      )}
    </div>
    {text !== undefined ? (
      <p className="mt-1.5 text-plane-foreground/80 text-xs leading-relaxed">
        {text}
      </p>
    ) : null}
  </div>
)
