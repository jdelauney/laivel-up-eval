import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { keepOrTossConfigSchema } from '@/games/keep-or-toss/schema/config.schema'
import projectCourse from '../../../../config/course.json'

/**
 * Constat 2 (B) de la revue du 31/08. L'ancien corpus se résolvait 12/12
 * sans une once de connaissance : le premier verbe de chaque libellé
 * suffisait — un ton qui prescrit un contrôle (« Chiffrer », « Valider »…)
 * contre un ton qui décrit un relâchement (« Stocker… dans le dépôt »,
 * « Désactiver »…). Le plan avait interdit « jamais » et « toujours » ; le
 * tell était ailleurs, dans le verbe de tête, jamais testé.
 *
 * « Relire » le nouveau corpus et juger à l'œil qu'aucun tell ne subsiste
 * ne prouve rien — c'est exactement ce qui a laissé passer l'ancien. Ce
 * fichier **calcule** : pour chaque lexème du corpus réel (tout mot d'un
 * libellé, position quelconque, pas seulement le premier), on regarde s'il
 * partitionne parfaitement le lot entre « garder » et « jeter ». Un lexème
 * qui apparaît uniquement dans des items « garder » (et jamais dans un item
 * « jeter », ou l'inverse) serait un tell mécanique, exploitable sans lire
 * le fond. Le calcul porte sur le corpus **réel** de `config/course.json`,
 * jamais un fixture.
 */

const STOPWORDS = new Set([
  'les',
  'des',
  'une',
  'par',
  'sur',
  'non',
  'tout',
  'pour',
  'avec',
  'dans',
  'son',
  'sa',
  'ses',
  'que',
  'qui',
  'aux',
  'ce',
  'cette',
  'du',
  'de',
  'un',
  'le',
  'la',
  'et',
  'ou',
  'en',
  'au',
  'si',
])

const tokenize = (label: string): string[] =>
  label
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))

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

/**
 * Le meilleur classifieur possible fondé sur « ce lexème apparaît-il dans
 * le libellé ? » : prédit, pour chaque item, la valeur majoritaire de son
 * groupe (contient / ne contient pas). Rend le nombre d'items bien
 * classés — `12` signifierait une séparation parfaite, exploitable sans
 * lire une seule carte.
 */
const bestAccuracyByPresence = (
  predicate: (item: (typeof config.items)[number]) => boolean,
): number => {
  const containing = config.items.filter(predicate)
  const notContaining = config.items.filter((item) => !predicate(item))

  const majorityCorrect = (group: typeof config.items): number => {
    if (group.length === 0) return 0
    const keepCount = group.filter((item) => item.keep).length
    const tossCount = group.length - keepCount
    return Math.max(keepCount, tossCount)
  }

  return majorityCorrect(containing) + majorityCorrect(notContaining)
}

describe('keep-or-toss corpus separability over the real g4-2 corpus', () => {
  it('shapes the real corpus as twelve short labels', () => {
    expect(config.items).toHaveLength(12)
  })

  it('no single lexeme, anywhere in a label, perfectly partitions the lot by keep', () => {
    const allTokens = new Set(
      config.items.flatMap((item) => tokenize(item.label)),
    )
    expect(allTokens.size).toBeGreaterThan(0)

    const offenders = [...allTokens]
      .map((token) => ({
        token,
        accuracy: bestAccuracyByPresence((item) =>
          tokenize(item.label).includes(token),
        ),
      }))
      .filter((entry) => entry.accuracy === config.items.length)

    expect(offenders).toEqual([])
  })

  it('the lead verb (first word) of each label does not perfectly partition the lot by keep', () => {
    const leadVerbs = new Set(
      config.items.map((item) => item.label.split(/\s+/)[0].toLowerCase()),
    )

    const offenders = [...leadVerbs]
      .map((verb) => ({
        verb,
        accuracy: bestAccuracyByPresence(
          (item) => item.label.split(/\s+/)[0].toLowerCase() === verb,
        ),
      }))
      .filter((entry) => entry.accuracy === config.items.length)

    expect(offenders).toEqual([])
  })

  /**
   * Contre-exemple direct : le même verbe de tête, « Désactiver », ouvre à
   * la fois une pratique à garder (verrouiller un compte après des échecs)
   * et une pratique à jeter (désactiver TLS pour aller plus vite). Un
   * classifieur fondé sur le seul verbe ne peut pas trancher ces deux
   * items — la preuve la plus directe qu'aucun ton de tête ne suffit.
   */
  it('the same lead verb opens both a keep item and a toss item', () => {
    const byLeadVerb = new Map<string, boolean[]>()
    config.items.forEach((item) => {
      const verb = item.label.split(/\s+/)[0].toLowerCase()
      byLeadVerb.set(verb, [...(byLeadVerb.get(verb) ?? []), item.keep])
    })

    const mixedVerbs = [...byLeadVerb.entries()].filter(
      ([, keeps]) => new Set(keeps).size > 1,
    )

    expect(mixedVerbs.length).toBeGreaterThan(0)
  })
})
