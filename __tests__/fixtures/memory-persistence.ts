import type { PersistenceSessionAdapter } from '@/core/ports/persistence-session-adapter.interface'

/**
 * Le port de persistance en mémoire, partagé par les tests. La sérialisation
 * est volontairement réelle : elle reproduit ce qu'un vrai stockage fait subir
 * à l'état, et attrape ce qu'un objet passé par référence masquerait.
 */
export class MemoryPersistence implements PersistenceSessionAdapter {
  private state: unknown | undefined

  read(): unknown | undefined {
    return this.state
  }

  write(state: unknown): void {
    this.state = JSON.parse(JSON.stringify(state))
  }

  clear(): void {
    this.state = undefined
  }
}
