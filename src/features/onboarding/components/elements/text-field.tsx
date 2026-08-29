import type { ReactNode } from 'react'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'

/**
 * Un champ texte de l'accueil : son intitulé, sa saisie, son aide et ses
 * erreurs, au même endroit et dans le même ordre à chaque fois.
 *
 * Purement présentationnel : il ne connaît ni le formulaire ni le schéma. Deux
 * champs tenus alignés à la main auraient divergé au premier ajustement, et
 * c'est exactement ce qui commençait à arriver entre le pseudo et le dépôt.
 */

/** Ce que TanStack Form range dans `meta.errors` : une chaîne, ou un objet. */
type FieldError = string | { message?: string } | undefined

const readError = (error: FieldError): string | undefined =>
  typeof error === 'string' ? error : error?.message

export const TextField = ({
  name,
  label,
  value,
  invalid,
  errors,
  help,
  placeholder,
  onChange,
  onBlur,
}: {
  name: string
  label: string
  value: string
  invalid: boolean
  errors: readonly FieldError[]
  help?: ReactNode
  placeholder?: string
  onChange: (value: string) => void
  onBlur: () => void
}) => {
  const helpId = help === undefined ? undefined : `${name}-aide`

  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label
        htmlFor={name}
        className="text-plane-foreground/60 text-xs uppercase tracking-[0.12em]"
      >
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        placeholder={placeholder}
        aria-describedby={helpId}
        aria-invalid={invalid}
      />
      {help === undefined ? null : (
        <p id={helpId} className="text-plane-foreground/60 text-sm">
          {help}
        </p>
      )}
      {invalid ? (
        <p className="font-medium text-missed text-sm">
          {errors.map(readError).join(', ')}
        </p>
      ) : null}
    </div>
  )
}
