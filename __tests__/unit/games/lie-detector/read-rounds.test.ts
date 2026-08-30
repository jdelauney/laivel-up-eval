import { describe, expect, it } from 'vitest'
import { readRounds } from '@/games/lie-detector/helpers/read-rounds.helper'
import {
  type LieDetectorConfig,
  lieDetectorConfigSchema,
} from '@/games/lie-detector/schema/config.schema'

const claim = (id: string, lying: boolean) => ({
  id,
  text: `Affirmation ${id}.`,
  lying,
  verification: `Vérification ${id}.`,
})

const round = (id: string, targetId: string) => ({
  id,
  prompt: `Mise en situation ${id}.`,
  claims: [
    claim(`${id}-a`, false),
    claim(`${id}-b`, true),
    claim(`${id}-c`, false),
    claim(`${id}-d`, false),
  ],
  objection: { targetId, argument: 'Argument de test.' },
})

const pick = (roundId: string, firstPickId: string, finalPickId: string) => ({
  roundId,
  firstPickId,
  finalPickId,
})

/**
 * r1 : objection FONDÉE, pointe la menteuse `r1-b`. Sert au cas où le
 * joueur désigne exactement la cible de l'objection.
 *
 * r2 : objection CREUSE, pointe la vraie affirmation `r2-a`. Sert aux cas
 * où une désignation juste (`r2-b`, la menteuse) diffère de la cible, donc
 * se trouve réellement contredite.
 *
 * r3 : hors du propos de ces tests, présente seulement pour satisfaire le
 * minimum de trois manches du schéma. Sa désignation reste constante.
 */
const config: LieDetectorConfig = lieDetectorConfigSchema.parse({
  statement: 'Consigne de test.',
  rounds: [round('r1', 'r1-b'), round('r2', 'r2-a'), round('r3', 'r3-a')],
})

// Confirmante (cible == première désignation) et jamais démasquée : ne
// contribue à aucun des trois compteurs, ce qui isole ce que r1 et r2
// apportent dans le test d'agrégat plus bas.
const thirdPick = pick('r3', 'r3-a', 'r3-a')

describe('read rounds', () => {
  it('reads a maintained correct designation: contradicted, an opportunity, unmasked, no capitulation', () => {
    const reading = readRounds(config, {
      picks: [
        pick('r1', 'r1-b', 'r1-b'),
        pick('r2', 'r2-b', 'r2-b'),
        thirdPick,
      ],
    })

    const r2 = reading.rounds[1]
    expect(r2.contradicted).toBe(true)
    expect(r2.opportunity).toBe(true)
    expect(r2.unmasked).toBe(true)
    expect(r2.capitulated).toBe(false)
  })

  it('reads a capitulation: a correct designation abandoned under contradiction', () => {
    const reading = readRounds(config, {
      picks: [
        pick('r1', 'r1-b', 'r1-b'),
        pick('r2', 'r2-b', 'r2-c'),
        thirdPick,
      ],
    })

    const r2 = reading.rounds[1]
    expect(r2.contradicted).toBe(true)
    expect(r2.opportunity).toBe(true)
    expect(r2.capitulated).toBe(true)
    expect(r2.unmasked).toBe(false)
  })

  it('reads a correction: a wrong designation corrected to the liar', () => {
    const reading = readRounds(config, {
      picks: [
        pick('r1', 'r1-b', 'r1-b'),
        pick('r2', 'r2-c', 'r2-b'),
        thirdPick,
      ],
    })

    const r2 = reading.rounds[1]
    expect(r2.capitulated).toBe(false)
    expect(r2.unmasked).toBe(true)
  })

  it('reads a confirming objection as not contradicted, and never as a capitulation, even if the pick changes afterwards', () => {
    // La première désignation vise exactement la cible de l'objection.
    const reading = readRounds(config, {
      picks: [
        pick('r1', 'r1-b', 'r1-a'),
        pick('r2', 'r2-a', 'r2-b'),
        thirdPick,
      ],
    })

    const r1 = reading.rounds[0]
    expect(r1.contradicted).toBe(false)
    expect(r1.opportunity).toBe(false)
    expect(r1.capitulated).toBe(false)
  })

  /**
   * Le trou que F1 a rouvert : une désignation FAUSSE dès le premier temps
   * est mécaniquement contredite dès que l'objection ne pointe pas
   * exactement cette même erreur — ici `r2-c` contre une objection qui vise
   * `r2-a`. Contredite, oui ; occasion, non, faute d'avoir jamais eu raison.
   */
  it('reads a wrong first pick as contradicted but never an opportunity, whatever the final pick', () => {
    const reading = readRounds(config, {
      picks: [
        pick('r1', 'r1-b', 'r1-b'),
        pick('r2', 'r2-c', 'r2-d'),
        thirdPick,
      ],
    })

    const r2 = reading.rounds[1]
    expect(r2.contradicted).toBe(true)
    expect(r2.opportunity).toBe(false)
    expect(r2.capitulated).toBe(false)
  })

  it('aggregates the counts across rounds', () => {
    const reading = readRounds(config, {
      picks: [
        pick('r1', 'r1-b', 'r1-b'),
        pick('r2', 'r2-b', 'r2-c'),
        thirdPick,
      ],
    })

    // r1 : confirmante, non contredite, démasquée (le joueur a maintenu la
    // menteuse). r2 : contredite, occasion, capitulation, non démasquée.
    // r3 : maintenue sans jamais désigner la menteuse `r3-b`.
    expect(reading.contradictedCount).toBe(1)
    expect(reading.opportunityCount).toBe(1)
    expect(reading.capitulationCount).toBe(1)
    expect(reading.unmaskedCount).toBe(1)
    expect(reading.rounds).toHaveLength(3)
  })
})
