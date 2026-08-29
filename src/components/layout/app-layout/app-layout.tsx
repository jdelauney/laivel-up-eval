import type { ReactNode } from 'react'

/**
 * Deux plans physiques. Le fond est le monde du groupe, la carte de relevé est
 * un plan d'os constant qui flotte au-dessus. L'état se lit donc toujours
 * contre le même neutre, quel que soit le groupe en cours.
 *
 * Pas de fondu : ce monde avance par crans.
 */

export type HeaderIdentity = {
  playerName: string
  repository?: string | undefined
}

/**
 * Ce que le joueur a saisi à l'accueil, rappelé jusqu'au verdict. Ni majuscule
 * forcée ni chasse fixe : un pseudo et un nom de dépôt sont des noms propres,
 * les déformer les rendrait moins reconnaissables que le reste du bandeau.
 */
const Identity = ({ playerName, repository }: HeaderIdentity) => (
  <p className="min-w-0 flex-1 truncate text-plane-foreground/70 text-xs">
    <span className="font-medium text-foreground">{playerName}</span>
    {repository ? (
      <>
        <span className="text-plane-foreground/40"> · </span>
        <span>{repository}</span>
      </>
    ) : null}
  </p>
)

export const AppLayout = ({
  status,
  identity,
  children,
}: {
  status?: string
  identity?: HeaderIdentity | undefined
  children: ReactNode
}) => (
  <div className="flex min-h-svh flex-col bg-background text-foreground">
    <header className="border-plane-rule border-b">
      <div className="mx-auto flex w-full max-w-4xl items-baseline justify-between gap-4 px-6 py-4">
        <p className="shrink-0 font-semibold text-sm uppercase tracking-[0.18em]">
          laivel<span className="text-plane-foreground/40">-up-eval</span>
        </p>
        {identity ? <Identity {...identity} /> : null}
        {status ? (
          <p className="shrink-0 font-medium text-plane-foreground/60 text-xs uppercase tracking-[0.14em] tabular-nums">
            {status}
          </p>
        ) : null}
      </div>
    </header>

    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 md:py-14">
      {children}
    </main>
  </div>
)
