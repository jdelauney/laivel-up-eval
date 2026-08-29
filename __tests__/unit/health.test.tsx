import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils/cn'

/**
 * Test de santé de la chaîne de test : il ne couvre aucune fonctionnalité
 * produit, il vérifie que vitest, jsdom, l'alias `@` et les matchers jest-dom
 * sont correctement câblés. S'il casse, c'est la configuration qui est en
 * cause, pas le code applicatif.
 */
describe('health', () => {
  it('resout l alias @ vers src', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('rend un composant React dans jsdom avec les matchers jest-dom', () => {
    render(<p>pulse</p>)

    expect(screen.getByText('pulse')).toBeInTheDocument()
  })
})
