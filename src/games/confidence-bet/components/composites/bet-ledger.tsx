import type { LedgerEntry } from '../../hooks/use-confidence-bet.hook'
import { movementToneClassName } from '../elements/reveal-panel'

const formatDelta = (delta: number): string =>
  delta > 0 ? `+${delta}` : `${delta}`

/**
 * Les extraits déjà joués, en ajout seul, sur le modèle du journal de
 * `checkpoints` : le plus récent en bas, aucun retour en arrière n'est
 * offert — ni actif, ni grisé, ni caché.
 *
 * Chaque ligne porte la même règle graduée qu'à l'engagement, en réduction.
 * Alignées les unes sous les autres, les marques dessinent la dispersion des
 * mises de la partie : c'est la calibration rendue visible sans qu'aucun
 * chiffre de notation ne soit énoncé.
 */
export const BetLedger = ({
  entries,
  stakes,
  neutralStake,
}: {
  entries: readonly LedgerEntry[]
  stakes: readonly number[]
  neutralStake: number
}) => {
  if (entries.length === 0) return null

  return (
    <section className="border-plane-rule border-t pt-3">
      <h2 className="font-medium text-[11px] text-plane-foreground/45 uppercase tracking-[0.16em]">
        Mises engagées
      </h2>
      <ul className="mt-2 flex flex-col gap-2">
        {entries.map((entry) => (
          <li
            key={entry.snippetId}
            className="grid animate-in grid-cols-[minmax(0,1fr)_5.5rem_2.5rem] items-center gap-3 text-plane-foreground/70 text-xs duration-200 fade-in sm:grid-cols-[minmax(0,1fr)_8rem_2.5rem]"
          >
            <span className="truncate">
              {entry.label}
              <span className="sr-only"> · mise {entry.stake}</span>
            </span>
            <MiniRule
              stakes={stakes}
              neutralStake={neutralStake}
              stake={entry.stake}
            />
            <span
              className={`text-right tabular-nums ${movementToneClassName(entry.delta)}`}
            >
              {formatDelta(entry.delta)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * La règle en réduction : le filet, l'origine, et la seule marque engagée.
 * Ni chiffre ni libellé — à cette taille ils seraient illisibles. Entièrement
 * décorative : la valeur de la mise est déjà portée en texte par la ligne,
 * une seconde annonce ferait doublon au lecteur d'écran.
 */
const MiniRule = ({
  stakes,
  neutralStake,
  stake,
}: {
  stakes: readonly number[]
  neutralStake: number
  stake: number
}) => (
  <span aria-hidden className="relative flex items-start">
    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-plane-foreground/20" />
    {stakes.map((entry) => (
      <span key={entry} className="flex h-3 flex-1 items-start justify-center">
        <span
          className={`w-px ${
            entry === stake
              ? 'h-3 w-0.5 bg-plane-foreground'
              : entry === neutralStake
                ? 'h-2 bg-plane-foreground/35'
                : 'h-1 bg-plane-foreground/20'
          }`}
        />
      </span>
    ))}
  </span>
)
