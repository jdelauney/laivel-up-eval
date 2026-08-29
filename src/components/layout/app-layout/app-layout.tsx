import type { ReactNode } from 'react'

/**
 * Deux plans physiques. Le fond est le monde du groupe, la carte de relevé est
 * un plan d'os constant qui flotte au-dessus. L'état se lit donc toujours
 * contre le même neutre, quel que soit le groupe en cours.
 *
 * Pas de fondu : ce monde avance par crans.
 */
export const AppLayout = ({
  status,
  children,
}: {
  status?: string
  children: ReactNode
}) => (
  <div className="flex min-h-svh flex-col bg-background text-foreground">
    <header className="border-plane-rule border-b">
      <div className="mx-auto flex w-full max-w-4xl items-baseline justify-between gap-4 px-6 py-4">
        <p className="font-semibold text-sm uppercase tracking-[0.18em]">
          laivel<span className="text-plane-foreground/40">-up-eval</span>
        </p>
        {status ? (
          <p className="font-medium text-plane-foreground/60 text-xs uppercase tracking-[0.14em] tabular-nums">
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
