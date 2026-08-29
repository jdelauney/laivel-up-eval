import type { PersistenceSessionAdapter } from '@/core/ports/persistence-session-adapter.interface'

const STORAGE_KEY = 'laivel-eval.session'

/**
 * La session vit dans le navigateur du joueur, elle ne part nulle part.
 *
 * Le stockage est injecté plutôt que lu en dur : jsdom n'expose pas
 * `window.localStorage`, et une couture vaut mieux qu'un comportement de
 * persistance non testé. En production, le défaut est bien celui du
 * navigateur.
 *
 * Une donnée illisible rend `undefined` plutôt que de lever : un stockage
 * abîmé ramène au démarrage, il ne bloque pas une partie.
 */
export class LocalSessionStorageAdapter implements PersistenceSessionAdapter {
  private readonly storage: Storage | undefined

  constructor(storage: Storage | undefined = globalThis.localStorage) {
    this.storage = storage
  }

  read(): unknown | undefined {
    if (this.storage === undefined) return undefined
    try {
      const raw = this.storage.getItem(STORAGE_KEY)
      if (raw === null) return undefined
      return JSON.parse(raw)
    } catch {
      return undefined
    }
  }

  write(state: unknown): void {
    if (this.storage === undefined) return
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Stockage plein ou refusé : la partie continue, elle ne survivra
      // simplement pas à un rechargement.
    }
  }

  clear(): void {
    if (this.storage === undefined) return
    try {
      this.storage.removeItem(STORAGE_KEY)
    } catch {
      // L'état en mémoire a déjà été remis à zéro, il n'y a rien de plus à faire.
    }
  }
}
