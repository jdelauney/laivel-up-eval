import type { ReactNode } from 'react'
import type { RepositorySlug } from '@/core/contracts/repository-slug.schema'
import { cn } from '@/lib/utils/cn'

/**
 * Deux plans physiques. Le fond est le monde du groupe, la carte de relevé est
 * un plan d'os constant qui flotte au-dessus. L'état se lit donc toujours
 * contre le même neutre, quel que soit le groupe en cours.
 *
 * Pas de fondu : ce monde avance par crans.
 */

export type HeaderIdentity = {
  playerName: string
  repository?: RepositorySlug | undefined
}

/**
 * Ce que le joueur a saisi à l'accueil, rappelé jusqu'au verdict. Ni majuscule
 * forcée ni chasse fixe : un pseudo et un nom de dépôt sont des noms propres,
 * les déformer les rendrait moins reconnaissables que le reste du bandeau.
 */
const Identity = ({
  playerName,
  repository,
  className,
}: HeaderIdentity & { className?: string }) => (
  <p
    className={cn(
      'min-w-0 flex-1 truncate text-plane-foreground/70 text-xs',
      className,
    )}
  >
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
  action,
  children,
}: {
  status?: string
  identity?: HeaderIdentity | undefined
  /**
   * Un emplacement d'action optionnel, à droite du statut. Le layout le
   * place sans savoir ce qu'il contient : c'est l'appelant qui décide s'il y
   * a quelque chose à y mettre, et quoi.
   */
  action?: ReactNode
  children: ReactNode
}) => {
  /**
   * `action` porte un bouton texte, jamais réductible à une icône : logo et
   * statut à eux seuls tiennent déjà toute la largeur utile d'un écran de
   * 390 px (390 − 2×24 de marge = 342 px), donc une rangée unique portant les
   * quatre cellules déborde toujours, quelle que soit la façon de les
   * répartir. En dessous de `md`, le bandeau se scinde en deux lignes fixes —
   * marque + statut, puis identité + action — recomposées en une seule
   * rangée à partir de `md`, où les quatre cellules ont la place de coexister
   * (mise en page validée par la QA desktop).
   *
   * Le repli est forcé par un séparateur `basis-full` de hauteur nulle : il
   * ne tient aucune ligne visible lui-même, il force seulement les cellules
   * qui le suivent en ordre à retomber sur la ligne suivante.
   */
  const hasSecondRow = identity !== undefined || action !== undefined

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-plane-rule border-b">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-baseline justify-between gap-x-4 gap-y-2 px-6 py-4 md:flex-nowrap md:gap-4">
          <p className="shrink-0 font-semibold text-sm uppercase tracking-[0.18em]">
            laivel<span className="text-plane-foreground/40">-up-eval</span>
          </p>
          {status ? (
            <p className="order-2 shrink-0 font-medium text-plane-foreground/60 text-xs uppercase tracking-[0.14em] tabular-nums md:order-3">
              {status}
            </p>
          ) : null}
          {hasSecondRow ? (
            <span
              aria-hidden="true"
              className="order-3 h-0 basis-full md:hidden"
            />
          ) : null}
          {identity ? (
            <Identity {...identity} className="order-4 md:order-2" />
          ) : null}
          {action ? (
            <div className="order-5 shrink-0 md:order-4">{action}</div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 md:py-14">
        {children}
      </main>
    </div>
  )
}
