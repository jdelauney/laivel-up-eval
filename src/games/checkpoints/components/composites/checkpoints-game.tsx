import type { GameComponentProps } from '../../../types/game-component'
import { useCheckpoints } from '../../hooks/use-checkpoints.hook'
import type { Decision } from '../../schema/answer.schema'
import { CHOICES, type Choice, type Stage } from '../../schema/config.schema'
import { ChoiceCard } from '../elements/choice-card'
import { StageTrack } from '../elements/stage-track'

/**
 * Le premier jeu à état du parcours. Une seule décision à l'écran à la fois,
 * posée sur un relevé qui s'allonge derrière elle : le passé s'accumule, le
 * présent est unique, l'avenir n'est pas montré.
 *
 * Le moment focal est la sortie de l'IA. Position, budget, frise et journal sont
 * de l'appareillage périphérique : ils se lisent sans être regardés.
 */

const CHOICE_LABELS: Record<Choice, string> = {
  'laisser-passer': 'Laisser passer',
  corriger: 'Corriger',
  're-cadrer': 'Re-cadrer',
}

/** Au-delà, le journal pousserait les choix hors de l'écran au sixième tour. */
const VISIBLE_JOURNAL_ENTRIES = 4

const olderEntriesLine = (count: number): string =>
  count > 1 ? `${count} étapes plus anciennes` : `${count} étape plus ancienne`

export const CheckpointsGame = ({
  config,
  onLock,
  onAdvance,
}: GameComponentProps) => {
  const {
    stages,
    stage,
    stageNumber,
    stageCount,
    stageIndex,
    budget,
    journal,
    choose,
  } = useCheckpoints(config, onLock, onAdvance)

  if (stage === undefined) return null

  return (
    <div className="flex flex-col gap-6">
      <PositionLine
        stageNumber={stageNumber}
        stageCount={stageCount}
        budget={budget}
      />

      <StageTrack stages={stages} currentIndex={stageIndex} />

      <AiOutput stage={stage} />

      <fieldset className="flex flex-col gap-3 md:flex-row">
        <legend className="sr-only">
          Votre réponse pour l'étape {stage.label}
        </legend>
        {CHOICES.map((choice) => (
          <ChoiceCard
            key={choice}
            label={CHOICE_LABELS[choice]}
            cost={stage.costs[choice]}
            stageLabel={stage.label}
            onSelect={() => choose(choice)}
          />
        ))}
      </fieldset>

      <Journal entries={journal} stages={stages} />
    </div>
  )
}

/**
 * Le budget sous zéro est une dette : il porte le signe, le poids et `--missed`.
 * Jamais la couleur seule — le signe et la graisse le disent aussi.
 */
const PositionLine = ({
  stageNumber,
  stageCount,
  budget,
}: {
  stageNumber: number
  stageCount: number
  budget: number
}) => (
  <p
    aria-live="polite"
    className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em] tabular-nums"
  >
    Étape {stageNumber} sur {stageCount} · Budget{' '}
    <span
      className={
        budget < 0
          ? 'font-bold text-missed'
          : 'font-semibold text-plane-foreground'
      }
    >
      {budget}
    </span>
  </p>
)

/**
 * Cadre neutre, quoi que l'étape porte. Aucune marque, aucune teinte, aucune
 * icône ne varie selon qu'un défaut s'y cache : le code des étapes techniques
 * est propre et sert de leurre, et c'est le sujet du jeu.
 */
const AiOutput = ({ stage }: { stage: Stage }) => (
  <div className="border border-plane-rule bg-plane p-4">
    <p className="max-w-[62ch] text-plane-foreground leading-relaxed">
      {stage.output.prose}
    </p>
    {stage.output.code === undefined ? null : (
      <pre className="mt-3 max-h-54 overflow-auto border-plane-rule border-t pt-3 font-mono text-plane-foreground/85 text-xs leading-4.5">
        <code>{stage.output.code}</code>
      </pre>
    )}
  </div>
)

/**
 * En ajout seul, la plus récente en bas. Aucun retour en arrière n'est offert :
 * ni actif, ni grisé, ni caché.
 *
 * Le journal ne porte que les coûts des choix du joueur ; la ligne de position
 * porte le budget réel, surcoûts compris. L'écart est voulu, et n'est jamais
 * expliqué avant le verdict.
 */
const Journal = ({
  entries,
  stages,
}: {
  entries: readonly Decision[]
  stages: readonly Stage[]
}) => {
  if (entries.length === 0) return null

  const hidden = Math.max(entries.length - VISIBLE_JOURNAL_ENTRIES, 0)
  const labelOf = (stageId: string): string =>
    stages.find((stage) => stage.id === stageId)?.label ?? stageId

  return (
    <div className="flex flex-col gap-1 border-plane-rule border-t pt-3">
      {hidden === 0 ? null : (
        <p className="text-plane-foreground/40 text-xs tabular-nums">
          {olderEntriesLine(hidden)}
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {entries.slice(hidden).map((entry) => (
          <li
            key={entry.stageId}
            className="flex animate-in items-baseline justify-between gap-4 text-plane-foreground/70 text-xs duration-200 fade-in"
          >
            <span>
              {labelOf(entry.stageId)} · {CHOICE_LABELS[entry.choice]}
            </span>
            <span className="tabular-nums">{entry.cost}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
