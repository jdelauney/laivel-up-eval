/**
 * Port étroit : lire, écrire, effacer un état de session. L'implémentation
 * concrète arrive en phase 4 ; le domaine ne connaît que ce contrat.
 *
 * `read` rend `undefined` quand rien n'est stocké ou quand la donnée est
 * illisible. Un stockage abîmé ne doit pas bloquer un joueur.
 */
export interface PersistenceSessionAdapter {
  read(): unknown | undefined
  write(state: unknown): void
  clear(): void
}
