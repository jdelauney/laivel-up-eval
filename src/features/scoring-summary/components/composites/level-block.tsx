import type {
  ConditionGap,
  LevelVerdict,
} from '@/core/scoring/helpers/level-resolver.helper'
import { describeConditionGap } from '../../helpers/condition-gap-text.helper'

type LevelBlockProps = Readonly<{ level: LevelVerdict }>

/**
 * Le niveau, ou l'absence de niveau et sa raison. Le repli silencieux sur le
 * niveau le plus bas a disparu : un profil qui ne tient aucune condition lit
 * pourquoi, jamais un niveau qu'il n'a pas atteint.
 */
export const LevelBlock = ({ level }: LevelBlockProps) => (
  <header className="flex flex-col gap-4">
    <p className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
      {level.level === undefined ? 'Niveau' : 'Niveau atteint'}
    </p>
    {level.level === undefined ? (
      <UnrankedReason unranked={level.unranked ?? []} />
    ) : (
      <ReachedLevel level={level} />
    )}
  </header>
)

const ReachedLevel = ({ level }: LevelBlockProps) => (
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

type UnrankedReasonProps = Readonly<{ unranked: readonly ConditionGap[] }>

const UnrankedReason = ({ unranked }: UnrankedReasonProps) => (
  <>
    <h2 className="font-semibold text-4xl leading-[0.95] tracking-tight md:text-5xl">
      Aucun niveau ne peut être annoncé
    </h2>
    <p className="max-w-[54ch] border-plane-rule border-t pt-4 text-plane-foreground/80">
      Le référentiel demande, pour son premier cran :
    </p>
    <ul className="flex flex-col gap-1 text-plane-foreground/80 text-sm">
      {unranked.map((gap) => (
        <li key={gap.condition.dimension}>{describeConditionGap(gap)}</li>
      ))}
    </ul>
  </>
)
