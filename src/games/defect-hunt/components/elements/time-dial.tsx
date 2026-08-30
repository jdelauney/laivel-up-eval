import { formatDuration } from '../../helpers/format-duration.helper'

/**
 * Le temps, en cadran de relevé : un nombre qu'on lit, jamais une jauge qui se
 * vide. Une jauge ferait la barre de progression que `DESIGN.md` refuse, et
 * elle pousserait au réflexe — or ce jeu mesure une lecture.
 *
 * Trois états, trois libellés, jamais la seule teinte : le temps qui reste, le
 * dépassement, et la durée qu'a prise la revue une fois rendue. Ce dernier
 * n'est pas un détail : un cadran figé sur « restant » après le rendu ferait
 * croire que la partie court encore. Le chiffre passe au vermillon et son
 * poids monte au dépassement — l'état est une quantité.
 *
 * Le cadran est hors du flux annoncé : un `aria-live` sur un compteur à la
 * seconde noierait un lecteur d'écran. Il reste lisible sur demande.
 */
export const TimeDial = ({
  elapsedSeconds,
  timeLimitSeconds,
  locked,
}: {
  elapsedSeconds: number
  timeLimitSeconds: number
  locked: boolean
}) => {
  const remaining = timeLimitSeconds - elapsedSeconds
  const isOverBudget = remaining < 0
  const alarming = isOverBudget && !locked

  const { value, label } = locked
    ? { value: elapsedSeconds, label: 'Rendue en' }
    : {
        value: Math.abs(remaining),
        label: isOverBudget ? 'Dépassé de' : 'Restant',
      }

  return (
    <p className="flex flex-col items-end gap-0.5 leading-none">
      <span
        className={`text-2xl tabular-nums ${
          alarming
            ? 'font-semibold text-missed'
            : 'font-medium text-plane-foreground/85'
        }`}
      >
        {formatDuration(value)}
      </span>
      <span
        className={`font-medium text-[10px] uppercase tracking-[0.18em] ${
          alarming ? 'text-missed' : 'text-plane-foreground/45'
        }`}
      >
        {label}
      </span>
    </p>
  )
}
