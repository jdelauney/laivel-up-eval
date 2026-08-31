import type { LevelVerdict } from '@/core/scoring/helpers/level-resolver.helper'
import type { PlanStep } from '@/core/scoring/helpers/progression-plan.helper'
import { describePlanStep } from '../../helpers/condition-gap-text.helper'

type LevelBlockProps = Readonly<{
  level: LevelVerdict
  /** Les conditions non tenues du niveau le plus bas, transformées en étapes de plan. */
  unrankedReason: readonly PlanStep[] | undefined
}>

/** Le seul libellé pour l'état « aucun niveau annonçable », partagé avec `SignatureBlock`. */
export const NO_LEVEL_LABEL = 'Aucun niveau ne peut être annoncé'

/**
 * Le niveau, ou l'absence de niveau et sa raison. Le repli silencieux sur le
 * niveau le plus bas a disparu : un profil qui ne tient aucune condition lit
 * pourquoi, jamais un niveau qu'il n'a pas atteint.
 */
export const LevelBlock = ({ level, unrankedReason }: LevelBlockProps) => (
  <header className="flex flex-col gap-4">
    <p className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
      {level.level === undefined ? 'Niveau' : 'Niveau atteint'}
    </p>
    {level.level === undefined ? (
      <UnrankedReason unranked={unrankedReason ?? []} />
    ) : (
      <ReachedLevel level={level} />
    )}
  </header>
)

type ReachedLevelProps = Readonly<{ level: LevelVerdict }>

const ReachedLevel = ({ level }: ReachedLevelProps) => (
  <>
    <h2 className="font-semibold text-5xl leading-[0.95] tracking-tight md:text-7xl">
      {level.level?.label}
    </h2>
    {level.hint !== undefined ? (
      <p className="max-w-[54ch] border-plane-rule border-t pt-4 text-plane-foreground/80">
        {level.hint}
      </p>
    ) : null}
    {level.nextLevel !== undefined ? (
      <p className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
        Niveau suivant · {level.nextLevel.label}
      </p>
    ) : null}
  </>
)

type UnrankedReasonProps = Readonly<{ unranked: readonly PlanStep[] }>

const UnrankedReason = ({ unranked }: UnrankedReasonProps) => (
  <>
    <h2 className="font-semibold text-4xl leading-[0.95] tracking-tight md:text-5xl">
      {NO_LEVEL_LABEL}
    </h2>
    <p className="max-w-[54ch] border-plane-rule border-t pt-4 text-plane-foreground/80">
      Le référentiel demande, pour son premier cran :
    </p>
    <ul className="flex flex-col gap-1 text-plane-foreground/80 text-sm">
      {unranked.map((step) => (
        <li key={step.dimensionId}>{describePlanStep(step)}</li>
      ))}
    </ul>
  </>
)
