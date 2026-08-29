import type { DimensionScore } from '../../../../core/ports/scoring-strategy.interface'

/**
 * Une dimension. Le chiffre est l'objet le plus grand de la ligne : un score
 * n'est pas une annotation, c'est le verdict lui-même.
 *
 * Une dimension non mesurée prend une marque structurelle — filet pointillé,
 * mention explicite — jamais une opacité réduite. Un score inconnu n'est pas
 * un score bas, et le lecteur doit pouvoir faire la différence.
 *
 * Sous le libellé vient le mot de la grille — « L — multi-étapes », « jamais » —
 * parce que c'est celui que le joueur retrouvera dans le référentiel, pas le
 * pourcentage.
 */
/** Le filet d'état, en pixels : sa hauteur porte le score. */
const RULE_MIN_HEIGHT_PX = 8
const RULE_FULL_HEIGHT_PX = 32

export const DimensionRow = ({ dimension }: { dimension: DimensionScore }) => {
  const percent = Math.round(dimension.score * 100)
  const ruleHeight = Math.max(
    RULE_MIN_HEIGHT_PX,
    (percent / 100) * RULE_FULL_HEIGHT_PX,
  )

  return (
    <li className="flex items-baseline gap-5 border-plane-rule border-b py-4">
      <span className="w-16 shrink-0 text-right font-semibold text-3xl tabular-nums leading-none md:w-20 md:text-4xl">
        {dimension.measured ? percent : '—'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-plane-foreground">
          {dimension.label}
        </span>
        {dimension.measured && dimension.band !== undefined ? (
          <span className="block text-plane-foreground/80 text-sm">
            {dimension.band}
          </span>
        ) : null}
        <span className="block text-plane-foreground/60 text-sm tabular-nums">
          {dimension.measured ? (
            <>
              {dimension.earned} sur {dimension.possible} points de contribution
            </>
          ) : (
            'aucun critère ne mesure cette dimension'
          )}
        </span>
      </span>
      <span
        className={`h-8 w-1.5 shrink-0 ${
          dimension.measured
            ? 'bg-plane-foreground'
            : 'border-2 border-plane-rule border-dashed'
        }`}
        style={dimension.measured ? { height: `${ruleHeight}px` } : undefined}
        aria-hidden="true"
      />
    </li>
  )
}
