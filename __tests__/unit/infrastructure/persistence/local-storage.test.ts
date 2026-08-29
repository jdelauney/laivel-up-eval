import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocalSessionStorageAdapter } from '../../../../src/infrastructure/persistence/local-session-storage.adapter'

const STORAGE_KEY = 'laivel-eval.session'

/**
 * Le stockage est injecté, et ce double implémente le contrat `Storage` du
 * navigateur. Selon la version de Node, `globalThis.localStorage` est celui de
 * jsdom ou n'existe pas : l'adapter ne doit dépendre ni de l'un ni de l'autre.
 */
class FakeStorage implements Storage {
  private readonly entries = new Map<string, string>()
  failOnWrite = false

  get length(): number {
    return this.entries.size
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    if (this.failOnWrite) throw new Error('quota dépassé')
    this.entries.set(key, value)
  }

  removeItem(key: string): void {
    this.entries.delete(key)
  }

  clear(): void {
    this.entries.clear()
  }
}

describe('local storage persistence', () => {
  let storage: FakeStorage

  beforeEach(() => {
    storage = new FakeStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads back what it wrote', () => {
    const adapter = new LocalSessionStorageAdapter(storage)
    adapter.write({ playerName: 'Alice', groupIndex: 0 })

    expect(adapter.read()).toEqual({ playerName: 'Alice', groupIndex: 0 })
  })

  it('reports nothing when the store is empty', () => {
    expect(new LocalSessionStorageAdapter(storage).read()).toBeUndefined()
  })

  it('reports nothing on an unreadable stored state, instead of throwing', () => {
    storage.setItem(STORAGE_KEY, '{ ceci nest pas du json')

    expect(new LocalSessionStorageAdapter(storage).read()).toBeUndefined()
  })

  it('empties the store on clear', () => {
    const adapter = new LocalSessionStorageAdapter(storage)
    adapter.write({ playerName: 'Alice' })
    adapter.clear()

    expect(adapter.read()).toBeUndefined()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('lets the run continue when the browser refuses to write', () => {
    const adapter = new LocalSessionStorageAdapter(storage)
    storage.failOnWrite = true

    expect(() => adapter.write({ playerName: 'Alice' })).not.toThrow()
  })

  it('stays inert when no storage is available at all', () => {
    /**
     * Un `globalThis.localStorage` bien vivant est posé exprès : si l'adapter
     * retombait dessus, il écrirait et relirait la session, et les deux
     * assertions tomberaient. C'est ce qui distinguait le CI du poste local,
     * une version de Node exposant ce global et l'autre non.
     */
    vi.stubGlobal('localStorage', new FakeStorage())

    const adapter = new LocalSessionStorageAdapter(undefined)

    expect(() => adapter.write({ playerName: 'Alice' })).not.toThrow()
    expect(adapter.read()).toBeUndefined()
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
