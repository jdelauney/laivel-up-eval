import { Quote } from 'lucide-react'

/**
 * L'avis de l'assistant : du texte de configuration, présenté avec l'aplomb
 * d'un collègue sûr de lui — jamais l'inquiétude d'une alerte, jamais le
 * murmure d'un aparté. Un seul traitement, qu'il pointe la menteuse ou une
 * vraie affirmation : cette fonction ne reçoit que l'argument, jamais la
 * nature de l'objection, et ne peut donc pas la laisser fuiter par le ton.
 *
 * Le poids typographique porte la confiance — corps plus grand que le reste
 * de la feuille, opacité pleine — jamais une couleur d'état : `--caution`
 * et `--missed` restent hors de cette surface, ils diraient que l'assistant
 * a tort ou raison avant la révélation.
 *
 * Entre comme une réponse qui arrive, sur l'unique animation que
 * `DESIGN.md` tolère : une entrée qui apparaît, jamais un fondu d'écran.
 */
export const ObjectionNote = ({ argument }: { argument: string }) => (
  <div className="relative overflow-hidden bg-plane-foreground/4 px-5 py-4 motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:animate-in motion-safe:fill-mode-backwards motion-safe:duration-500 motion-safe:ease-out">
    <Quote
      aria-hidden
      className="-top-1 pointer-events-none absolute right-4 size-10 text-plane-foreground/[0.07]"
      fill="currentColor"
      strokeWidth={0}
    />
    <p className="font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.16em]">
      L'assistant
    </p>
    <p className="relative mt-2 max-w-[58ch] text-base text-plane-foreground leading-relaxed">
      {argument}
    </p>
  </div>
)
