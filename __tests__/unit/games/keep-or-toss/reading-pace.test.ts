import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { keepOrTossConfigSchema } from '@/games/keep-or-toss/schema/config.schema'
import projectCourse from '../../../../config/course.json'

/**
 * Constat 2 (A2) de la revue du 31/08. Un garde-fou de temps se mesure, il
 * ne se déclare pas — même leçon que le passage en force brute de
 * `brute-force.test.ts`, appliquée cette fois au débit de lecture plutôt
 * qu'à l'espace des traces.
 *
 * L'ancien corpus (douze libellés, 117 mots) sous un budget de 20 s exigeait
 * 351 mots/minute soutenus, plus un verdict par carte — au-dessus de la
 * vitesse de lecture silencieuse d'une prose non fictionnelle courante,
 * mesurée autour de 240 mots/minute. Le jeu mesurait alors la vitesse de
 * lecture, pas la connaissance de sécurité — l'inverse de ce que la story
 * demande (« on mesure ce que je sais sans le temps de le chercher »).
 *
 * Ce test compte les mots du corpus **réel** de `config/course.json`, pas
 * un fixture, et vérifie qu'un lecteur à 240 mots/minute qui connaît déjà
 * chaque réponse boucle le lot avec de la marge, jugement par carte compris.
 * Sans ce test, un futur corpus plus bavard resserrerait le débit exigé en
 * silence, exactement la fuite que cette revue a fermée.
 */

const READING_WORDS_PER_MINUTE = 240
const READING_WORDS_PER_SECOND = READING_WORDS_PER_MINUTE / 60

/**
 * Temps de jugement par carte : décider garder/jeter et appuyer sur une
 * flèche, une fois le libellé lu. Valeur conservatrice — plus courte
 * qu'une vraie décision délibérée — posée pour que la marge mesurée reste
 * honnête plutôt que gonflée par un budget de jugement irréaliste.
 */
const JUDGMENT_SECONDS_PER_ITEM = 0.5

const g4_2 = (() => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === 'g4-2'),
  )
  const game = group?.games.find((entry) => entry.id === 'g4-2')
  if (game === undefined)
    throw new Error('g4-2 introuvable dans le parcours réel')
  return game
})()

const config = keepOrTossConfigSchema.parse(g4_2.config)

const countWords = (label: string): number =>
  label.trim().split(/\s+/).filter(Boolean).length

describe('keep-or-toss reading pace over the real g4-2 corpus', () => {
  it('pins the real word count of the twelve labels', () => {
    const totalWords = config.items.reduce(
      (sum, item) => sum + countWords(item.label),
      0,
    )

    expect(totalWords).toBe(80)
  })

  it('a reader at 240 words/minute who already knows every answer clears the lot with margin, judgment time included', () => {
    const totalWords = config.items.reduce(
      (sum, item) => sum + countWords(item.label),
      0,
    )

    const readingSeconds = totalWords / READING_WORDS_PER_SECOND
    const judgmentSeconds = config.items.length * JUDGMENT_SECONDS_PER_ITEM
    const requiredSeconds = readingSeconds + judgmentSeconds
    const marginSeconds = config.durationSeconds - requiredSeconds

    // Chiffres réels épinglés : 80 mots / 4 mots-seconde = 20 s de lecture,
    // + 12 × 0,5 s = 6 s de jugement, soit 26 s requises contre un budget
    // de 30 s — 4 s de marge.
    expect(readingSeconds).toBeCloseTo(20, 10)
    expect(judgmentSeconds).toBe(6)
    expect(requiredSeconds).toBeCloseTo(26, 10)
    expect(marginSeconds).toBeCloseTo(4, 10)
    expect(requiredSeconds).toBeLessThan(config.durationSeconds)
  })

  it('required reading pace stays under 240 words/minute even before accounting for judgment time', () => {
    const totalWords = config.items.reduce(
      (sum, item) => sum + countWords(item.label),
      0,
    )
    const requiredWordsPerMinute = totalWords / (config.durationSeconds / 60)

    expect(requiredWordsPerMinute).toBeLessThan(READING_WORDS_PER_MINUTE)
  })
})
