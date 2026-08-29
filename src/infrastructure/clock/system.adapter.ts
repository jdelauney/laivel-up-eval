import type { Clock } from '../../core/ports/clock.interface'

/** L'horloge réelle, câblée pour une partie jouée. */
export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString()
  }
}
