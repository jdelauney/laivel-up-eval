import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'

/**
 * L'échelle de mise dessinée comme un instrument de mesure, pas comme une
 * liste de choix : un filet gradué qui va du doute à la certitude, une
 * graduation par valeur déclarée, un repère à planter.
 *
 * Construite directement sur la primitive Base UI, sur le modèle de
 * `AttentionCell` de `three-tracks` : le wrapper `components/ui/radio-group.tsx`
 * code sa pastille sur les jetons de thème shadcn, que la surface d'un jeu
 * n'emploie pas.
 *
 * L'état est une quantité — la hauteur et l'épaisseur de la graduation, le
 * poids du chiffre — jamais une couleur seule. La graduation de la mise
 * neutre est plus haute que ses voisines : c'est l'origine de la mesure, et
 * la lire ne demande pas de compter.
 */
export const StakeRule = ({
  stakes,
  neutralStake,
  snippetId,
  snippetLabel,
  value,
  onChange,
}: {
  stakes: readonly number[]
  neutralStake: number
  snippetId: string
  snippetLabel: string
  value: number | undefined
  onChange: (value: number) => void
}) => (
  <fieldset>
    <legend className="sr-only">Mise sur {snippetLabel}</legend>

    <div className="flex items-baseline justify-between font-medium text-[11px] text-plane-foreground/45 uppercase tracking-[0.16em]">
      <span>Doute</span>
      <span>Certitude</span>
    </div>

    <RadioGroupPrimitive
      name={`stake-${snippetId}`}
      aria-label={`Mise sur ${snippetLabel}`}
      value={value}
      onValueChange={(next) => onChange(Number(next))}
      className="relative mt-2 flex items-start"
    >
      {/* Le filet et ses deux embouts : la règle existe avant qu'on y pose
       * quoi que ce soit, et elle ne s'arrête pas à la graduation extrême. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-plane-foreground/25"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 h-2 w-px bg-plane-foreground/25"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-2 w-px bg-plane-foreground/25"
      />

      {stakes.map((stake) => (
        <RadioPrimitive.Root
          key={stake}
          value={stake}
          aria-label={`Mise ${stake} sur ${snippetLabel}`}
          className="group flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-sm pt-0 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-plane-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-plane"
        >
          {/* Le fût est de hauteur fixe, la graduation y pend depuis le
           * filet : c'est ce qui garde tous les chiffres sur la même ligne
           * de base pendant que la graduation, elle, varie en longueur. */}
          <span aria-hidden className="flex h-7 items-start">
            <span
              className={`w-px bg-plane-foreground/45 transition-none group-hover:bg-plane-foreground group-data-checked:h-7 group-data-checked:w-0.5 group-data-checked:bg-plane-foreground ${
                stake === neutralStake ? 'h-5' : 'h-3'
              }`}
            />
          </span>
          <span className="font-medium text-plane-foreground/55 text-xs tabular-nums leading-none group-hover:text-plane-foreground group-data-checked:font-semibold group-data-checked:text-plane-foreground">
            {stake}
          </span>
        </RadioPrimitive.Root>
      ))}
    </RadioGroupPrimitive>
  </fieldset>
)
