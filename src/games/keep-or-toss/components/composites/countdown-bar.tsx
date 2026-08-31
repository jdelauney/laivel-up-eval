import { formatDuration } from '../../../defect-hunt/helpers/format-duration.helper'

/**
 * Le temps qui reste, en trait qui se retire — jamais un cadran comme
 * `defect-hunt` : ce jeu n'a pas de budget qu'on peut dépasser, il a un
 * lot qui doit passer avant que le trait n'atteigne le bord. Le retrait du
 * trait est la quantité elle-même, `DESIGN.md` : « un état est une
 * quantité », jamais une couleur seule.
 *
 * Le chiffre et le trait portent la même lecture, jamais deux sources : le
 * trait est dérivé de `remainingSeconds` par simple proportion, sans état
 * propre.
 *
 * `aria-live="polite"` ne porte que l'annonce de palier fournie par
 * `useCountdown` — jamais le chiffre lui-même, qui changerait au battement
 * et noierait un lecteur d'écran sous vingt messages par minute.
 */
export const CountdownBar = ({
  remainingSeconds,
  durationSeconds,
  announcement,
}: {
  remainingSeconds: number
  durationSeconds: number
  announcement: string
}) => {
  const share = Math.max(0, Math.min(1, remainingSeconds / durationSeconds))
  const low = remainingSeconds <= 5

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-medium text-[10px] text-plane-foreground/45 uppercase tracking-[0.18em]">
          Temps restant
        </span>
        <span
          className={`text-lg tabular-nums ${
            low
              ? 'font-semibold text-missed'
              : 'font-medium text-plane-foreground/85'
          }`}
        >
          {formatDuration(remainingSeconds)}
        </span>
      </div>
      <div className="h-1.5 w-full bg-plane-rule">
        <div
          className={`h-full ${low ? 'bg-missed' : 'bg-plane-foreground/70'}`}
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
