import type { SnippetNature } from '../../schema/config.schema'
import { RuleReadout } from './rule-readout'

const NATURE_LABEL: Record<SnippetNature, string> = {
  sound: 'Code fiable',
  flawed: 'Code défectueux',
  undecidable: 'Indécidable avec ce qui est montré',
}

/**
 * Le sens ne repose jamais sur la seule couleur : le signe du mouvement est
 * déjà écrit (`+`, ou le signe négatif natif), la triade d'état ne fait que
 * l'appuyer. `--nominal` / `--caution` / `--missed` sur le plan neutre,
 * jamais le vermillon d'un groupe.
 */
export const movementToneClassName = (delta: number): string => {
  if (delta > 0) return 'text-nominal'
  if (delta < 0) return 'text-missed'
  return 'text-caution'
}

/**
 * Exportée à côté de `movementToneClassName` : le panneau et le journal
 * lisent tous deux le même mouvement, une seconde implémentation aurait
 * divergé au premier ajustement de signe.
 */
export const formatDelta = (delta: number): string =>
  delta > 0 ? `+${delta}` : `${delta}`

/**
 * Le verdict de l'extrait, posé sur la règle où la mise vient d'être plantée :
 * le joueur lit son écart à la vérité sur l'instrument même qui a servi à
 * l'engager, sans avoir à traduire un chiffre en position.
 *
 * Purement présentationnel : il affiche ce qu'on lui donne, il ne connaît ni
 * le barème ni les critères qui liront ce mouvement.
 */
export const RevealPanel = ({
  nature,
  reveal,
  delta,
  stakes,
  neutralStake,
  stake,
  truthStake,
}: {
  nature: SnippetNature
  reveal: string
  delta: number
  stakes: readonly number[]
  neutralStake: number
  stake: number
  truthStake: number | undefined
}) => (
  <div className="border border-plane-rule bg-plane px-4 pt-4 pb-5">
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <p className="font-semibold text-plane-foreground">
        {NATURE_LABEL[nature]}
      </p>
      <p
        className={`font-semibold text-base tabular-nums ${movementToneClassName(delta)}`}
      >
        {formatDelta(delta)}
      </p>
    </div>

    <p className="mt-2 max-w-[62ch] text-plane-foreground/80 text-sm leading-relaxed">
      {reveal}
    </p>

    <div className="mt-5">
      <RuleReadout
        stakes={stakes}
        neutralStake={neutralStake}
        yourStake={stake}
        truthStake={truthStake}
      />
    </div>
  </div>
)
