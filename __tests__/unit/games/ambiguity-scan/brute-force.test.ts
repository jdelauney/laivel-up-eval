import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { AmbiguityScanEvaluator } from '@/games/ambiguity-scan/ambiguity-scan.evaluator'
import { ambiguityScanConfigSchema } from '@/games/ambiguity-scan/schema/config.schema'
import projectCourse from '../../../../config/course.json'

/**
 * Passage en force brute obligatoire, la leçon de `lie-detector` inscrite
 * dans `BUILD-ORDER.md` : un garde-fou anti-triche se mesure, il ne se
 * déclare pas. Un test unitaire ciblé peut rester vert alors qu'un critère
 * récompense l'inverse de ce qu'il annonce — c'est le passage en force
 * brute de **l'espace complet des traces** qui l'aurait vu.
 *
 * Neuf segments dans le corpus réel de `g6-2` : `2^9 = 512` sous-ensembles,
 * un par trace possible, contre la configuration **du parcours**, pas un
 * fixture. Aucun profil n'est privilégié : chaque sous-ensemble de segments
 * signalés est une trace parfaitement valide au sens du contrat.
 *
 * **Pourquoi une moyenne sur les 512 traces ne suffit pas.** La première
 * version de ce test moyennait les 512 traces comme équiprobables et
 * vérifiait que la part tenant les deux critères restait sous 10 %. Cette
 * moyenne est dominée par les traces à cinq, six, sept signalements,
 * qu'aucun joueur ne produit — ni en lisant, ni en cliquant au hasard. Elle
 * est structurellement incapable de voir qu'un joueur qui clique deux
 * segments au hasard, sans lire une ligne, tient les deux critères une
 * fois sur six (16,67 %), 2,4 fois le plafond que l'ancien test annonçait.
 * Ce fichier mesure donc **profil par profil**, jamais en moyenne : pour
 * chaque nombre `k` de signalements, la part réelle des traces à
 * exactement `k` signalements qui tiennent chaque critère ; puis une
 * sélection de profils de lecture identifiés par leur nombre de vrais
 * repérages (`h`) et de faux positifs (`f`).
 */

const g6_2 = (() => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === 'g6-2'),
  )
  const game = group?.games.find((entry) => entry.id === 'g6-2')
  if (game === undefined)
    throw new Error('g6-2 introuvable dans le parcours réel')
  return game
})()

const config = ambiguityScanConfigSchema.parse(g6_2.config)
const criteria = g6_2.criteria
const evaluator = new AmbiguityScanEvaluator()

const segmentIds = config.segments.map((segment) => segment.id)
const ambiguousIds = config.segments
  .filter((segment) => segment.ambiguous)
  .map((segment) => segment.id)
const clearIds = config.segments
  .filter((segment) => !segment.ambiguous)
  .map((segment) => segment.id)

/** Le sous-ensemble encodé par les bits de `mask`, dans l'ordre de la configuration. */
const subsetFromMask = (mask: number): string[] =>
  segmentIds.filter((_, index) => (mask & (1 << index)) !== 0)

const verdictFor = (flaggedIds: string[]) =>
  evaluator
    .evaluate({ flaggedIds }, config, criteria)
    .reduce<Record<string, boolean>>((acc, result) => {
      acc[result.criterionId] = result.satisfied
      return acc
    }, {})

/**
 * Un profil de lecture, désigné par ce qu'il retient réellement : `h`
 * segments ambigus vus parmi les quatre du corpus, `f` segments clairs
 * signalés à tort parmi les cinq. La trace elle-même — quels segments
 * précisément — n'entre dans aucune règle : seules ces deux quantités
 * comptent (`read-flags.helper.ts`), donc n'importe quelle sélection des
 * `h` premiers ambigus et des `f` premiers clairs rend le même verdict que
 * toute autre combinaison à `h` et `f` égaux.
 */
const readingTrace = (h: number, f: number): string[] => [
  ...ambiguousIds.slice(0, h),
  ...clearIds.slice(0, f),
]

/**
 * Regroupe les 512 traces réelles (pas une formule combinatoire à côté) par
 * nombre de segments signalés, et compte, dans chaque groupe, combien
 * tiennent `c1`, `c2`, les deux. Calculé une seule fois au chargement du
 * fichier, réutilisé par le passage profil par profil ci-dessous et par
 * l'assertion finale qui le compare aux profils de lecture.
 */
const byFlagCount: Map<
  number,
  { total: number; c1: number; c2: number; both: number }
> = (() => {
  const counts = new Map<
    number,
    { total: number; c1: number; c2: number; both: number }
  >()

  for (let mask = 0; mask < 2 ** segmentIds.length; mask++) {
    const flagged = subsetFromMask(mask)
    const k = flagged.length
    const entry = counts.get(k) ?? { total: 0, c1: 0, c2: 0, both: 0 }
    const verdict = verdictFor(flagged)
    entry.total += 1
    if (verdict['g6-2-c1']) entry.c1 += 1
    if (verdict['g6-2-c2']) entry.c2 += 1
    if (verdict['g6-2-c1'] && verdict['g6-2-c2']) entry.both += 1
    counts.set(k, entry)
  }

  return counts
})()

/** La meilleure part, tous `k` confondus, de traces à `k` signalements au hasard qui tiennent les deux critères. */
const bestBlindBothShare = (): number =>
  Math.max(
    ...[...byFlagCount.values()].map((entry) => entry.both / entry.total),
  )

describe('ambiguity-scan brute force over the real g6-2 corpus', () => {
  it('shapes the real corpus as nine segments, four ambiguous and five clear', () => {
    expect(segmentIds).toHaveLength(9)
    expect(ambiguousIds).toHaveLength(4)
    expect(clearIds).toHaveLength(5)
  })

  it('never satisfies c1 for the trace that flags every segment', () => {
    const verdict = verdictFor(segmentIds)
    expect(verdict['g6-2-c1']).toBe(false)
  })

  it('never satisfies c1 for the trace that flags nothing', () => {
    const verdict = verdictFor([])
    expect(verdict['g6-2-c1']).toBe(false)
  })

  it('satisfies both criteria for the perfect trace, the four ambiguous segments alone', () => {
    const verdict = verdictFor(ambiguousIds)
    expect(verdict['g6-2-c1']).toBe(true)
    expect(verdict['g6-2-c2']).toBe(true)
  })

  describe('profil par profil : k segments signalés au hasard, k de 1 à 9', () => {
    /**
     * Chiffres réels épinglés, pas un plafond mou : recalculés à la main
     * (combinatoire `C(4,h) × C(5,f)` sur les couples `h + f = k`) et
     * confirmés par l'énumération des 512 traces ci-dessus. Un futur
     * ajustement de seuil qui déplace n'importe laquelle de ces valeurs
     * fait échouer ce test, qu'il rende un profil aveugle plus payant ou
     * moins.
     */
    const expected: Record<
      number,
      { total: number; c1: number; c2: number; both: number }
    > = {
      1: { total: 9, c1: 0, c2: 9, both: 0 },
      2: { total: 36, c1: 6, c2: 26, both: 6 },
      3: { total: 84, c1: 4, c2: 34, both: 4 },
      4: { total: 126, c1: 21, c2: 21, both: 21 },
      5: { total: 126, c1: 5, c2: 5, both: 5 },
      6: { total: 84, c1: 10, c2: 0, both: 0 },
      7: { total: 36, c1: 0, c2: 0, both: 0 },
      8: { total: 9, c1: 0, c2: 0, both: 0 },
      9: { total: 1, c1: 0, c2: 0, both: 0 },
    }

    it.each(Object.entries(expected))(
      'k=%s traces signalées au hasard',
      (k, counts) => {
        expect(byFlagCount.get(Number(k))).toEqual(counts)
      },
    )

    it('the best blind profile — k=2 or k=4 — holds both criteria exactly one time in six', () => {
      expect(bestBlindBothShare()).toBeCloseTo(1 / 6, 10)
    })
  })

  describe('profils de lecture (h segments ambigus vus, f faux positifs)', () => {
    /**
     * `h` et `f` sont les seules quantités que les règles lisent
     * (`read-flags.helper.ts`) : la trace canonique de `readingTrace(h, f)`
     * rend donc le même verdict que n'importe quelle autre sélection de
     * `h` ambigus et `f` clairs. Chiffres recalculés à la main sur le seuil
     * réel du parcours (`0.5` pour `c1`, `0.8` pour `c2`) puis confirmés
     * par l'évaluateur — deux d'entre eux (`h=4,f=2` et `h=4,f=3`) montrent
     * volontairement qu'une lecture bruyante finit par manquer, plutôt que
     * de ne garder que les profils qui gagnent.
     */
    const profiles: Array<{
      h: number
      f: number
      c1: boolean
      c2: boolean
    }> = [
      { h: 2, f: 0, c1: true, c2: true },
      { h: 3, f: 0, c1: true, c2: true },
      { h: 3, f: 1, c1: true, c2: true },
      { h: 4, f: 0, c1: true, c2: true },
      { h: 4, f: 1, c1: true, c2: true },
      { h: 4, f: 2, c1: true, c2: false },
      { h: 4, f: 3, c1: false, c2: false },
    ]

    it.each(profiles)('h=$h f=$f -> c1=$c1 c2=$c2', ({ h, f, c1, c2 }) => {
      const verdict = verdictFor(readingTrace(h, f))
      expect(verdict['g6-2-c1']).toBe(c1)
      expect(verdict['g6-2-c2']).toBe(c2)
    })

    /**
     * L'assertion qui compte, calculée plutôt que recopiée : le meilleur
     * profil aveugle — `bestBlindBothShare()`, la même valeur mesurée par
     * le bloc précédent sur les 512 traces réelles — reste strictement en
     * dessous du **pire** profil de lecture qui tient encore les deux
     * critères. `h` et `f` déterminent le verdict seuls (`read-flags.helper.ts`) :
     * un profil de lecture qui tient les tient donc avec certitude, `1`,
     * jamais une part — c'est ce `1` que ce test compare au meilleur
     * partage obtenu au hasard. Si un futur ajustement de seuil rendait un
     * profil aveugle aussi certain qu'une lecture correcte (`bestBlindBothShare()`
     * atteignant `1`), cette comparaison cesserait d'être strictement
     * inférieure et le test échouerait — que la dérive vienne d'un seuil
     * relâché ou d'un corpus affaibli.
     */
    it('the best blind profile stays strictly below the certainty of a passing correct read', () => {
      const passingProfiles = profiles.filter(
        (profile) => profile.c1 && profile.c2,
      )
      expect(passingProfiles.length).toBeGreaterThan(0)

      for (const profile of passingProfiles) {
        const verdict = verdictFor(readingTrace(profile.h, profile.f))
        const readingCertainty =
          verdict['g6-2-c1'] && verdict['g6-2-c2'] ? 1 : 0

        expect(readingCertainty).toBe(1)
        expect(bestBlindBothShare()).toBeLessThan(readingCertainty)
      }
    })
  })
})
