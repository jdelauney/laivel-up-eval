/**
 * La même règle graduée, figée, une fois la mise engagée : le repère du
 * joueur y reste planté, et le repère de la vérité vient se poser à côté.
 * C'est ce voisinage qui rend la calibration lisible — l'écart entre les
 * deux marques est tout ce que le jeu demande de comprendre.
 *
 * Deux formes distinctes plutôt que deux couleurs : triangle plein pour la
 * mise engagée, losange évidé pour la vérité. Le sens tient sans distinguer
 * les teintes.
 *
 * `truthStake` absent veut dire qu'aucune position n'était justifiable :
 * la règle passe en pointillé et ne désigne rien. Poser une marque de vérité
 * au milieu apprendrait au joueur où miser au prochain extrait indécidable,
 * ce qui est exactement ce que le jeu cherche à mesurer.
 */
export const RuleReadout = ({
  stakes,
  neutralStake,
  yourStake,
  truthStake,
}: {
  stakes: readonly number[]
  neutralStake: number
  yourStake: number
  truthStake: number | undefined
}) => {
  const isIndeterminate = truthStake === undefined

  return (
    <div>
      <div className="relative flex items-start">
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
            isIndeterminate
              ? 'border-plane-foreground/30 border-t border-dashed'
              : 'bg-plane-foreground/25'
          }`}
        />

        {stakes.map((stake) => (
          <div
            key={stake}
            className="flex flex-1 flex-col items-center gap-2 pb-1"
          >
            {/* Fût de hauteur fixe : la graduation varie en longueur, les
             * chiffres restent sur une seule ligne de base. */}
            <span aria-hidden className="flex h-7 items-start">
              <span
                className={`w-px bg-plane-foreground/45 ${
                  stake === neutralStake ? 'h-5' : 'h-3'
                } ${stake === yourStake ? 'h-7 w-0.5 bg-plane-foreground' : ''}`}
              />
            </span>
            <span
              className={`text-xs tabular-nums leading-none ${
                stake === yourStake
                  ? 'font-semibold text-plane-foreground'
                  : 'font-medium text-plane-foreground/40'
              }`}
            >
              {stake}
            </span>

            <span className="flex min-h-8 flex-col items-center gap-1 pt-1">
              {stake === yourStake ? (
                <MarkLabel shape="your" label="vous" />
              ) : null}
              {stake === truthStake ? (
                <MarkLabel shape="truth" label="vérité" />
              ) : null}
            </span>
          </div>
        ))}
      </div>

      {isIndeterminate ? (
        <p className="mt-1 text-plane-foreground/60 text-xs">
          Aucune position n'était justifiable sur cette règle.
        </p>
      ) : null}
    </div>
  )
}

const MarkLabel = ({
  shape,
  label,
}: {
  shape: 'your' | 'truth'
  label: string
}) => (
  <span className="flex flex-col items-center gap-1">
    {shape === 'your' ? (
      <span
        aria-hidden
        className="size-0 border-x-[5px] border-x-transparent border-b-[7px] border-b-plane-foreground"
      />
    ) : (
      <span
        aria-hidden
        className="size-2 rotate-45 border border-plane-foreground/70"
      />
    )}
    <span className="font-medium text-[10px] text-plane-foreground/60 uppercase tracking-[0.12em]">
      {label}
    </span>
  </span>
)
