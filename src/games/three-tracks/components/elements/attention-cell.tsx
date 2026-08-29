import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'

/**
 * La cellule ouverte d'un chantier : un groupe radio de `maxPerTrack + 1`
 * pastilles, de zéro au plafond. Construite directement sur la primitive
 * Base UI plutôt que sur le wrapper `components/ui/radio-group.tsx` : celui-ci
 * code sa pastille sur les jetons de thème shadcn (`primary`, `input`), que le
 * registre n'a pas le droit d'employer — seuls `--plane`, `--plane-foreground`
 * et `--plane-rule` sont autorisés sur ce plan.
 *
 * Le zéro est une pastille comme les autres, jamais une absence : le joueur
 * doit voir qu'il a le droit de ne rien poser sur un chantier. Une valeur que
 * l'attention restante ne permet plus se désactive par une marque
 * structurelle — un filet plus pâle — jamais par un grisé.
 *
 * Chaque pastille porte aussi son chiffre à l'écran, zéro compris : un
 * joueur voyant doit lire ce qu'il pose sans dépendre du nom accessible, qui
 * reste la source de vérité pour un lecteur d'écran et ne change pas. Le
 * chiffre est donc `aria-hidden`, il ne duplique jamais l'annonce portée par
 * `aria-label`.
 *
 * Le marquage de la sélection change de mécanique pour lui laisser sa place :
 * un point de deux pixels au centre de la pastille se confondrait avec un
 * chiffre qui occupe le même centre. La pastille sélectionnée se remplit donc
 * en totalité plutôt que de loger un point en son cœur — un remplissage,
 * la quantité physique que `DESIGN.md` autorise pour porter un état — et le
 * chiffre s'inverse sur `--plane` pour rester lisible sur le fond plein. La
 * pastille indisponible garde son filet pâle existant et reprend le même
 * jeton, `--plane-rule`, pour son chiffre : jamais une opacité réduite.
 */

const unitLabel = (value: number): string => {
  if (value === 0) return 'zéro unité'
  if (value === 1) return 'une unité'
  return `${value} unités`
}

/**
 * Zéro au plafond inclus, en tableau plutôt qu'en `Array.from` inline : les
 * valeurs qui en sortent sont la donnée elle-même, pas la position d'une
 * itération, et peuvent servir de clé sans se confondre avec un index.
 */
const options = (maxPerTrack: number): readonly number[] =>
  Array.from({ length: maxPerTrack + 1 }, (_, option) => option)

export const AttentionCell = ({
  trackId,
  trackLabel,
  turnNumber,
  maxPerTrack,
  value,
  maxSelectable,
  onChange,
}: {
  trackId: string
  trackLabel: string
  turnNumber: number
  maxPerTrack: number
  value: number
  maxSelectable: number
  onChange: (value: number) => void
}) => (
  <RadioGroupPrimitive
    name={`attention-${trackId}-${turnNumber}`}
    aria-label={`Attention sur ${trackLabel}, tour ${turnNumber}`}
    value={value}
    onValueChange={(next) => onChange(Number(next))}
    className="flex flex-row flex-nowrap items-center gap-1.5"
  >
    {options(maxPerTrack).map((option) => {
      const disabled = option > maxSelectable

      return (
        <RadioPrimitive.Root
          key={option}
          value={option}
          disabled={disabled}
          aria-label={`${unitLabel(option)} sur ${trackLabel}, tour ${turnNumber}`}
          className={`group flex size-5 shrink-0 items-center justify-center rounded-full border outline-none transition-none focus-visible:ring-2 focus-visible:ring-plane-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-plane disabled:cursor-not-allowed disabled:opacity-100 data-checked:bg-plane-foreground ${
            disabled ? 'border-plane-rule' : 'border-plane-foreground'
          }`}
        >
          <span
            aria-hidden="true"
            className={`font-medium text-[10px] leading-none tabular-nums group-data-checked:text-plane ${
              disabled ? 'text-plane-rule' : 'text-plane-foreground'
            }`}
          >
            {option}
          </span>
        </RadioPrimitive.Root>
      )
    })}
  </RadioGroupPrimitive>
)
