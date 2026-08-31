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

/**
 * L'entête du référentiel officiel, jamais empruntée par une autre grille :
 * `SignatureBlock` nomme la sienne (F1 — la revue a relevé la phrase codée en
 * dur ici, contredite trois lignes plus bas par « la signature ne déplace
 * aucun niveau »).
 */
const REFERENTIAL_UNRANKED_HEADING =
  'Le référentiel demande, pour son premier cran :'

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
    <UnrankedReasonList
      unranked={unranked}
      heading={REFERENTIAL_UNRANKED_HEADING}
    />
  </>
)

type UnrankedReasonListProps = Readonly<{
  unranked: readonly PlanStep[]
  /**
   * La phrase d'introduction, propre à l'appelant : le référentiel officiel
   * et la signature ne nomment pas la même grille, et ne doivent jamais
   * emprunter le mot de l'autre (F1 — la signature écrivait « le référentiel
   * demande » alors qu'elle ne juge que sa propre échelle).
   */
  heading: string
}>

/**
 * La raison de l'état non classé, sans le titre : le paragraphe et la liste
 * des axes en cause. Partagée avec `SignatureBlock`, qui porte son propre
 * titre en `h3` et sa propre entête — la signature rend la raison sous la
 * même forme que le niveau officiel, sans dupliquer le texte ni emprunter
 * le nom de la grille qui n'est pas la sienne.
 */
export const UnrankedReasonList = ({
  unranked,
  heading,
}: UnrankedReasonListProps) => (
  <>
    <p className="max-w-[54ch] border-plane-rule border-t pt-4 text-plane-foreground/80">
      {heading}
    </p>
    <ul className="flex flex-col gap-1 text-plane-foreground/80 text-sm">
      {unranked.map((step) => (
        <li key={step.dimensionId}>{describePlanStep(step)}</li>
      ))}
    </ul>
  </>
)
