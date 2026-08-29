import { useEffect, useState } from 'react'

/**
 * `768px`, la valeur de `--breakpoint-md` de Tailwind (`node_modules/tailwindcss/theme.css`),
 * non redéfinie dans `src/index.css`. Le registre choisit sa structure sur la
 * même frontière que celle où `md:` bascule le reste de l'écran, pour que la
 * coupure visuelle et la coupure de structure tombent au même endroit.
 */
const NARROW_VIEWPORT_BREAKPOINT_PX = 768

const isNarrowViewport = (): boolean =>
  window.innerWidth < NARROW_VIEWPORT_BREAKPOINT_PX

/**
 * Le registre rend soit un tableau, soit une liste de blocs, jamais les deux
 * à la fois : un lecteur d'écran qui recevrait les deux structures — l'une
 * masquée en CSS — lirait le registre en double. Le choix se fait donc en
 * JS, sur la largeur de fenêtre réelle, plutôt qu'en CSS sur deux arbres
 * rendus en parallèle.
 *
 * `window.innerWidth` plutôt que `matchMedia` : jsdom, l'environnement de la
 * suite Vitest, n'implémente pas `matchMedia` et lève à l'appel — le
 * réimplémenter dans le setup global pour ce seul écran aurait été plus de
 * surface que la largeur de fenêtre, déjà présente et déjà mesurable sans
 * polyfill.
 */
export const useIsNarrowViewport = (): boolean => {
  const [isNarrow, setIsNarrow] = useState(isNarrowViewport)

  useEffect(() => {
    const onResize = () => setIsNarrow(isNarrowViewport())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return isNarrow
}
