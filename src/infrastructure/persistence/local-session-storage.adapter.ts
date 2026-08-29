import type { PersistenceSessionAdapter } from '@/core/ports/persistence-session-adapter.interface'

const STORAGE_KEY = 'laivel-eval.session'

/**
 * La session vit dans le navigateur du joueur, elle ne part nulle part.
 *
 * Le stockage est injecté plutôt que lu en dur, et sans valeur par défaut :
 * un défaut lisant `globalThis` rendrait `undefined` inexprimable — l'argument
 * déclencherait le défaut au lieu de dire « pas de stockage » — et le
 * comportement dépendrait alors du runtime. C'est `composition-root.ts` qui
 * désigne le stockage réel, comme pour toute autre dépendance concrète.
 *
 * Une donnée illisible rend `undefined` plutôt que de lever : un stockage
 * abîmé ramène au démarrage, il ne bloque pas une partie.
 */
export class LocalSessionStorageAdapter implements PersistenceSessionAdapter {
  private readonly storage: Storage | undefined

  constructor(storage: Storage | undefined) {
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
