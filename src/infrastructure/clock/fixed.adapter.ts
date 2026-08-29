import type { Clock } from '../../core/ports/clock.interface'

/**
 * L'horloge du mode rejeu et des tests. Elle avance d'un pas constant à chaque
 * appel, ce qui garde les soumissions ordonnées et lisibles sans jamais rendre
 * deux exécutions différentes.
 */
export class FixedClock implements Clock {
  private readonly stepMs: number
  private current: number

  constructor(start = '2026-01-01T00:00:00.000Z', stepMs = 1000) {
    this.current = Date.parse(start)
    this.stepMs = stepMs
  }

  now(): string {
    const instant = new Date(this.current).toISOString()
    this.current += this.stepMs
    return instant
  }
}
