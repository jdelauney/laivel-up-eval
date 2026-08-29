import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * L'auto-nettoyage de Testing Library ne s'installe que si `afterEach` est
 * global. La suite tourne avec `globals: false`, donc le nettoyage se déclare
 * ici — sans lui, le DOM d'un test fuit dans le suivant et les requêtes
 * trouvent des éléments en double.
 */
afterEach(cleanup)