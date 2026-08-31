---
type: review
verdict: changes-requested
scope: commit c362a02 — feat(games) let the player show where a prompt leaves room to guess
reviewed_at: 2026-08-31
score: 62/100
---

# Revue : le jeu `ambiguity-scan` dans le slot `g6-2`

## Ce qui a été vérifié à la main

Le chiffre de 7,03 % annoncé par le commit a été refait indépendamment, sans importer une ligne du
jeu, par un script de force brute écrit dans `e:\tmp\ambiguity-scan-bruteforce.mjs` qui relit
`config/course.json` et réimplémente les deux règles depuis leur énoncé. Les 512 traces du corpus
réel donnent :

```
--- FORCE BRUTE 512 traces (toutes équiprobables) ---
c1 seul tenu      : 46 = 8.9844%
c2 seul tenu      : 96 = 18.7500%
c1 ET c2 tenus    : 36 = 7.0313%
```

Le chiffre du commit est exact. Ce qu'il mesure ne l'est pas — voir le constat 4.

Le reste tient : `npx vitest run __tests__/unit/games/ambiguity-scan __tests__/integration/course-run`
rend `15 passed (15) / 155 passed (155)`, `npm run typecheck` ne sort rien, et
`npx biome check src/games/ambiguity-scan __tests__/unit/games/ambiguity-scan` rend
`Checked 17 files. No fixes applied.`

---

## Constats, du plus grave au moins grave

### 1. Majeur — La révélation puis un rechargement de page donnent le corrigé exact, sans qu'aucune trace ait été écrite

**Fichiers** : `src/games/ambiguity-scan/hooks/use-ambiguity-scan.hook.ts:54-85` et
`src/core/session/game-session.facade.ts:150-156, 189-208`.

**Ce qui casse.** Le joueur signale un segment quelconque — le minimum que `canSubmit`
(hook:69) exige — et clique « Verrouiller mes signalements ». `submit` (hook:72-76) ne fait que
basculer `phase` à `'revealed'` en état React local. L'écran liste alors exactement les quatre
segments ambigus du parcours, `s3`, `s5`, `s6`, `s8`, avec leur seconde lecture
(`ambiguity-scan-game.tsx:39-56`). Rien n'a encore été persisté : la seule écriture du parcours est
`this.persistence.write(session.snapshot())` en fin de `submitAnswer` (facade:207), et
`submitAnswer` n'est atteint que par `advance()` (hook:79-85), c'est-à-dire par le bouton
« Continuer ». Le joueur recharge la page à ce moment. `resume()` (facade:150-156) rejoue
`snapshot.submissions`, qui ne contient rien pour `g6-2` ; la session repart sur `g6-2`, le composant
se remonte, `useState` repart à `'scanning'`. Le joueur signale alors les quatre segments qu'on
vient de lui montrer :

- `c1` = `(4 − 0) / 4` = `1.0` ≥ `0.5` → tenu ;
- `c2` = `(5 − 0) / 5` = `1.0` ≥ `0.8` → tenu.

Soit 3 points de poids sur `pilotage-contexte`, sans avoir lu une ligne du prompt.
`aidd_docs/backlog/epics/parcours-couvrant-les-axes.md`, *Success Evidence* : « Un joueur qui tente
de tricher un jeu […] n'obtient pas un cran supérieur. » Ici il l'obtient de façon déterministe, pas
probabiliste.

**Preuve.** `grep -n "persistence.write" src/core/session/game-session.facade.ts` ne rend que les
lignes `121`, `207`, `213` — aucune n'est atteinte entre `submit()` et `advance()`. Aucun test du
commit ne parcourt ce chemin : `use-ambiguity-scan.test.ts:151-168` vérifie que `toggle` est verrouillé
**après** la révélation dans la même instance du hook, jamais qu'une seconde instance ne repart de zéro.

**Nuance honnête.** `practice-map` porte la même mécanique en deux temps et la même absence de
persistance de la phase. La différence est de nature : la révélation de `practice-map`
(`practice-map-game.tsx:42-68`) rend un `marker` textuel par pratique sur un plan continu, ce qui
n'autorise pas un score parfait par recopie. Ici la révélation **est** l'ensemble-réponse exact.
L'exploit passe d'approximatif à déterministe, et il naît de la forme de révélation choisie par ce
plan (*Decisions*, « La révélation donne la seconde lecture d'un segment ambigu »).

---

### 2. Majeur — `c1` ne récompense pas ce que sa `question` du parcours affirme mesurer

**Fichiers** : `config/course.json:1704` contre `src/games/ambiguity-scan/ambiguity-scan.evaluator.ts:44`.

La question affichée au joueur est « La part des segments ambigus réellement repérés dépasse-t-elle
le seuil ? ». La règle calcule `inputs.netHits / inputs.ambiguousCount`, c'est-à-dire
`(hitCount − falsePositiveCount) / ambiguousCount` (`read-flags.helper.ts:49`). Le mot **nette**,
présent partout dans le plan et dans les commentaires du code, est absent de la seule phrase que le
joueur lit.

**Ce qui casse.** Un joueur signale `s3` et `s5` — deux des quatre segments ambigus, soit exactement
la moitié annoncée par le seuil — et se trompe une fois sur `s1`. Le relevé de fin de parcours
(`src/features/scoring-summary/components/sections/summary-view.tsx:96`, qui rend `criterion.question`
suivi de `tenu` / `manqué`) lui affiche :

> La part des segments ambigus réellement repérés dépasse-t-elle le seuil ? — **manqué**

alors que la part qu'il a réellement repérée est `2/4 = 0.5`, précisément le seuil. Le code lit
`(2 − 1)/4 = 0.25`.

**Preuve chiffrée**, sur les 512 traces, en comparant la règle du code à la lecture littérale de sa
propre question :

```
--- c1 lu selon sa QUESTION (h/ambigus >= 0.5) au lieu du code ((h-f)/ambigus) ---
traces tenant c1 selon la question : 352 = 68.7500%
divergences code vs question       : 306 traces (59.7656%)
exemples de divergence (question=vrai, code=faux) :
   s1+s3+s5 h=2 f=1
   s2+s3+s5 h=2 f=1
   s1+s2+s3+s5 h=2 f=2
   s3+s4+s5 h=2 f=1
```

Les divergences sont toutes dans le même sens : la règle du code est un sous-ensemble strict de sa
question, donc **59,77 % des traces s'entendent dire « manqué » sur une question à laquelle elles
répondent oui**. C'est la classe d'échec inscrite dans `BUILD-ORDER.md:147` — un critère qui ne
récompense pas ce qu'il annonce. Ce n'est pas une inversion comme sur `lie-detector`, mais un objet
mesuré différent de l'objet annoncé, et aucun des sept fichiers de test ne compare la `question` à
la règle.

L'acceptance 2 de `aidd_docs/backlog/stories/reperer-les-segments-ambigus.md` nomme le critère
« part de segments identifiés au-dessus du seuil ». La règle livrée n'est pas celle-là.

Le correctif tient en un mot dans `config/course.json:1704` — la règle, elle, est défendable telle
quelle.

---

### 3. Majeur — Les deux règles lisent bien la même chose, contrairement à ce que le plan affirme, et la facturent deux fois sur la même dimension

**Fichiers** : `src/games/ambiguity-scan/ambiguity-scan.evaluator.ts:44` et `:59-62`,
`src/games/ambiguity-scan/helpers/read-flags.helper.ts:49`, contre
`aidd_docs/tasks/2026_08/2026_08_31_jeu-ambiguity-scan/plan.md`, Phase 2 : « Les deux règles lisent
deux choses différentes, **et aucune ne lit ce que lit l'autre** ».

`netHits` **contient** `falsePositiveCount`. `c1` et `c2` lisent donc tous deux les faux positifs, et
les deux critères pointent sur `pilotage-contexte` avec les poids 2 et 1 (`config/course.json:1709-1712`
et `1723-1726`).

**Ce qui casse.** Deux joueurs, même parcours :

| Joueur | Ambigus vus | Clairs signalés à tort | c1 | c2 | Poids obtenu |
| --- | --- | --- | --- | --- | --- |
| A | 4 sur 4 | 3 | `(4−3)/4 = 0.25` → manqué | `2/5 = 0.4` → manqué | **0 / 3** |
| B | 2 sur 4 | 0 | `2/4 = 0.5` → tenu | `5/5 = 1.0` → tenu | **3 / 3** |

Le joueur qui a vu **toutes** les ambiguïtés sort à zéro sur `pilotage-contexte` ; celui qui en a vu
la moitié sort au maximum. La grille complète, recalculée à la main sur les cinq clairs et quatre
ambigus du corpus réel :

```
h\f  f=0   f=1   f=2   f=3   f=4   f=5
h=0   c2    c2    --    --    --    --
h=1   c2    c2    --    --    --    --
h=2   OK    c2    --    --    --    --
h=3   OK    OK    --    --    --    --
h=4   OK    OK    c1    --    --    --
```

La colonne `f=2` et au-delà est morte quel que soit `h` : au-delà d'un faux positif, aucune qualité
de lecture ne rattrape rien. La *Decisions* du plan justifie le seuil de `0.5` en disant qu'à `0.75`
« le critère mesurerait la retenue — ce que `c2` mesure déjà » ; abaisser le seuil ne retire pas la
double facturation, il la déplace d'une case.

Ce n'est pas nécessairement un mauvais choix produit, mais le plan et les commentaires du code
(`evaluator.ts:47-53`, « Lit la **retenue**, jamais la couverture : distincte par construction »)
affirment le contraire de ce que fait le code. À trancher : soit `c1` cesse de lire les faux
positifs, soit le plan cesse de prétendre qu'il ne les lit pas.

---

### 4. Majeur — Le passage en force brute mesure une population qu'aucun joueur ne tire

**Fichier** : `__tests__/unit/games/ambiguity-scan/brute-force.test.ts:73-84`.

Le test parcourt bien les 512 sous-ensembles, mais les traite comme équiprobables
(`expect(share).toBeLessThan(0.1)` sur la moyenne du cube entier). Cette moyenne est dominée par les
traces à 5, 6, 7 signalements, qu'aucun joueur ne produit. La question posée par
`BUILD-ORDER.md:147` est autre : « le passage en force brute de l'espace complet des parties
possibles […] **profil par profil** : celui qui ne lit pas, celui qui suit toujours, celui qui ne
bouge jamais, celui qui lit juste puis se dédit ».

**Ce qui casse.** Le profil « celui qui ne lit pas » n'est pas la moyenne uniforme : c'est un joueur
qui signale un petit nombre fixe de segments au hasard. Recalculé :

```
--- Meilleure stratégie AVEUGLE : signaler k segments au hasard ---
  k=2 : 6/36   = 16.67%
  k=3 : 4/84   =  4.76%
  k=4 : 21/126 = 16.67%
  k=5 : 5/126  =  3.97%
  k>=6         =  0.00%
```

Un joueur qui clique deux segments au hasard, sans lire une ligne, tient **les deux critères une
fois sur six** — 2,4 fois le 7,03 % que le commit présente comme la mesure du garde-fou. Le test
livré est structurellement incapable de le voir : si un futur ajustement de seuil faisait monter le
taux du profil `k=2` à 40 %, la moyenne uniforme resterait sous 10 % et le test resterait vert.

Ce que le test ne couvre pas non plus : le profil « lit correctement mais imparfaitement », le seul
qui prouve que lire paie. Il est vérifié ici à la main et il tient — `h=3, f=1`, `h=2, f=0`,
`h=3, f=0`, `h=4, f≤1` tiennent tous les deux critères, contre 16,67 % au mieux pour l'aveugle. **Le
garde-fou fait ce qu'on lui demande ; c'est sa mesure et le chiffre du message de commit qui
décrivent autre chose.**

---

### 5. Majeur — Le neuvième jeu passe sans sa fiche de surface, et son écran de révélation est celui de `practice-map`

**Fichiers** : `.impeccable/surfaces/` (aucune entrée pour `ambiguity-scan`),
`src/games/ambiguity-scan/components/composites/ambiguity-scan-game.tsx:33-64` contre
`src/games/practice-map/components/composites/practice-map-game.tsx:42-68`.

`DESIGN.md:66` : « Vingt jeux, vingt surfaces. **Aucun n'hérite de la composition d'un autre** […]
Chacun a sa fiche sous `.impeccable/surfaces/`, et chacun se dessine à son tour. » Les huit jeux déjà
livrés ont chacun la leur ; `ls .impeccable/surfaces/` ne rend rien pour celui-ci. La Phase 3 du plan
ne la demande jamais.

**Ce qui casse.** Un joueur qui a traversé `g2-2` puis arrive sur `g6-2` voit deux fois le même
écran. Le `diff` du bloc de révélation le montre — seuls le libellé de l'en-tête et le contenu des
lignes changent, l'enveloppe est identique caractère pour caractère :

```
$ diff <(sed -n '43,69p' src/games/practice-map/components/composites/practice-map-game.tsx) \
       <(sed -n '33,64p' src/games/ambiguity-scan/components/composites/ambiguity-scan-game.tsx)
8c9
<             Les repères
---
>             Ce que ces segments laissaient ouvert
```

Même `<div className="flex flex-col gap-3 sm:gap-6">`, même `<p className="max-w-[54ch] …">`, même
`<section className="border border-plane-rule bg-plane">`, même `<header>` en `text-[10px] …
tracking-[0.14em]`, même `<Button type="button" size="lg" onClick={advance}>Continuer</Button>`.

La chaîne de classes de l'en-tête encadré est un idiome déjà partagé par sept endroits du dépôt
avant ce commit — ce n'est pas elle le constat. Le constat est le bloc entier, repris tel quel, sans
la passe `impeccable` que `DESIGN.md` rend obligatoire pour chaque jeu.

---

### 6. Mineur — Le refus du schéma ne ferme « tout surligner » que si le seuil est strictement positif, alors que le fichier affirme le contraire

**Fichiers** : `src/games/ambiguity-scan/schema/config.schema.ts:39-53` et
`src/games/ambiguity-scan/ambiguity-scan.evaluator.ts:22, 44`.

Le commentaire du schéma promet « une part nette jamais positive, donc […] **quel que soit le seuil
retenu par le parcours** ». La règle compare avec `>=`, et le seuil est déclaré
`z.object({ threshold: z.number() })`, sans borne.

**Ce qui casse.** Un auteur de parcours écrit `"threshold": 0` sur un futur slot dont le corpus a
`clearCount === ambiguousCount` — la configuration minimale que le schéma accepte, et que
`config.schema.test.ts:20-31` utilise justement comme fixture valide. Tout signaler donne
`netHits = 3 − 3 = 0`, donc `0 / 3 = 0 >= 0` → `c1` **tenu**. Le refus du schéma, présenté comme
mécanique, dépend d'une valeur que rien ne contraint.

`src/games/checkpoints/checkpoints.evaluator.ts:29` borne déjà exactement cette classe de règle avec
`z.number().min(0).max(1)`, et `src/games/three-tracks/three-tracks.evaluator.ts:27-30` borne aussi.
Aucune casse aujourd'hui : `g6-2` porte `0.5`.

---

### 7. Mineur — La Phase 4 du plan décrit un état du parcours que le commit n'atteint pas

**Fichier** : `plan.md`, Phase 4 : « Le mapping `harness` du placeholder disparaît : les six premiers
groupes portent la signature, seul le septième porte les axes du référentiel. »

Le retrait de `harness` sur `g6-2` est fait et correct. La conclusion, elle, est fausse après le
commit :

```
groupe-pilotage    -> pilotage-contexte, harness
groupe-resilience  -> harness, resilience
groupe-securite    -> intervention, verification
groupe-architecture-> taille
groupe-prompt      -> harness, pilotage-contexte
```

Quatre des six premiers groupes portent encore un axe du référentiel, dont `groupe-prompt` lui-même
via `g6-1`.

**Ce qui casse.** Le prochain auteur qui lit cette ligne pour savoir si les six premiers groupes sont
propres cesse d'auditer, et laisse cinq mappings en place. Les poids par dimension, avant et après,
ne bougent d'ailleurs que d'un cran : `harness` 21 → 18, `pilotage-contexte` 11 → 14, aucune
dimension vidée.

---

### 8. Mineur — La justification chiffrée du plancher de trois segments ambigus est arithmétiquement fausse

**Fichier** : `src/games/ambiguity-scan/schema/config.schema.ts:24-28`.

> « Au moins trois segments ambigus : en dessous, un seul faux positif suffirait à faire basculer
> `netHits` au négatif ».

Avec deux segments ambigus, un joueur à `h=2, f=1` a `netHits = 1`, positif ; il faut **trois** faux
positifs pour passer sous zéro.

**Ce qui casse.** Un auteur qui envisage d'abaisser le plancher à deux lit une raison qui ne tient
pas, la vérifie, la trouve fausse, et abaisse le plancher — alors que la vraie raison est ailleurs :
avec deux ambigus, la part nette ne prend que trois valeurs (`1`, `0.5`, `0`), et le critère devient
un tirage à trois faces. Constat de documentation seule, le plancher lui-même est bon.

---

## Ce qui tient, vérifié

**Acceptance 1 — les segments problématiques sont connus à l'avance et ne sont pas signalés au
joueur.** Tenue en jeu, avec la réserve du constat 1 sur le rechargement.

- Le hook n'expose jamais `ambiguous` ni `reading` : `SegmentView` (hook:17-21) ne porte que
  `id`, `text`, `flagged`, et `revelations` reste `[]` tant que la phase n'est pas `'revealed'`
  (hook:93-111).
- Aucun attribut DOM ne distingue les deux familles : `SegmentToggle` (`segment-toggle.tsx:20-31`)
  rend un `<button type="button" aria-pressed>` avec une seule alternative de classes, qui dépend de
  `flagged` et de rien d'autre. Pas de `title`, pas de `data-*`, pas d'`id` dans le DOM — le
  `segment.id` de `prompt-body.tsx:25` est une `key` React, jamais émise.
- **Pas de fuite par la longueur** : ambigus `[57, 58, 40, 37]`, clairs `[51, 58, 70, 42, 41]`. Les
  plages se recouvrent. Signaler les quatre plus courts (`s8`, `s6`, `s9`, `s7`) donne `h=2, f=2`,
  `netHits = 0` → `c1` manqué.
- **Pas de fuite par la ponctuation** : signaler les sept segments terminés par une virgule donne
  `h=4, f=3`, `netHits = 1` → `c1` manqué.
- **Pas de fuite par la position** : ambigus en 3, 5, 6, 8 — aucun motif.
- **Pas de fuite par un champ présent d'un seul côté à l'écran** : le schéma interdit `reading` sur
  un segment clair (`config.schema.ts:77-83`), et l'écran ne lit ce champ que dans la branche
  `phase === 'revealed'`.

**Acceptance 3 — surligner tout le prompt ne satisfait pas le critère.** Vérifiée hors des tests du
commit : les neuf segments donnent `h=4, f=5`, `netHits = −1`, `c1 = −0.25 < 0.5` manqué et
`c2 = 0/5 = 0 < 0.8` manqué.

**Aucun seuil ne sort par une surface lue ou entendue.** Le piège de `practice-map` — un
`positionLabel` qui bascule sur `highRigorFrom` — n'est pas rejoué :

- `statement` (`config/course.json:1647`) et `promptTitle` ne portent aucun nombre, et disent
  explicitement « sans savoir combien il y en a » ;
- le compteur `aria-live` (`ambiguity-scan-game.tsx:77-84`) n'annonce que le nombre de segments
  signalés, jamais un reste ni un total ;
- la révélation ne rend aucun verdict ni score — `ambiguity-scan-game.test.tsx:89-90` le pin, et le
  code ne dispose d'aucune donnée de verdict pour le faire ;
- `grep -rn "question" src/features` ne rend qu'un seul point de rendu,
  `summary-view.tsx:96`, atteint après le parcours, et ni `0.5` ni `0.8` n'apparaissent dans les
  deux libellés.

**Les tests ne font coïncider aucun seuil.** `c1` à `0.5` sur quatre ambigus se réduit à
`netHits >= 2` ; `c2` à `0.8` sur cinq clairs se réduit à `falsePositives <= 1`. Deux nombres
distincts, deux réductions distinctes, et `evaluator.test.ts:82-92` épingle les deux directions
séparément (`c1` sans `c2`, puis `c2` sans `c1`). Le piège qui a masqué la fuite de `practice-map`
n'est pas reproduit.

**Les refus du schéma ferment ce que la Phase 1 dit qu'ils ferment**, et chaque test les isole. Le
cas « moins de trois ambigus » (`config.schema.test.ts:87-97`) garde `clearCount >= ambiguousCount`
tenu, et le cas « moins de clairs que d'ambigus » (`:99-110`) garde le plancher de trois tenu — aucun
des deux ne passe pour la mauvaise raison. Six refus, six tests : total minimal, identifiants
uniques, `reading` obligatoire côté ambigu, `reading` interdit côté clair, plancher d'ambigus,
répartition.

**Le domaine est pur.** `grep -rn "react|Date|Math\.random|window|localStorage"` sur `schema/`,
`helpers/`, `actions/` et l'évaluateur ne rend rien. Aucun seuil n'y vit non plus : les deux règles
lisent `rule.threshold`, et `evaluator.test.ts:94-109` prouve que deux seuils rendent deux verdicts
sur la même trace.

**Le découpage Smart/Dumb tient.** `useAmbiguityScan` porte l'état, la phase et le verrou
`submittedRef` ; `AmbiguityScanGame` est le seul à connaître le hook et `GameComponentProps` ;
`PromptBody` et `SegmentToggle` ne reçoivent que des props et n'importent ni le hook ni le schéma.

**Le branchement au parcours est complet.** Les deux registres sont à jour, et
`assertEveryGameTypeIsRegistered` (`game-session.facade.ts:110-116`) ferait tomber le démarrage
sinon. Les quatre tests d'intégration de parcours ont été mis à jour plutôt que laissés à deviner un
type inconnu.

**La trace est déterministe et sans champ dérivé.** `buildAmbiguityScanAnswer` réordonne selon la
configuration et déduplique par `Set` (`build-ambiguity-scan-answer.action.ts:22-27`) : deux parties
aux mêmes gestes rendent la même trace, et l'ordre des clics ne fuit pas dans la donnée soumise.

---

## Score

62 / 100.

Aucun barème n'est défini par la story ni par le plan ; la note est la proportion de critères tenus,
corrigée par la gravité.

- **Acceptances de la story** : 1 tenue (« tout surligner ne passe pas »), 2 partielles — la première
  tient en jeu mais tombe sur le rechargement (constat 1), la seconde ressort bien satisfaite ou
  manquée mais ne mesure pas la part qu'elle nomme (constat 2).
- **Phases du plan** : 1 et 4 tenues, 2 tenue mais mal décrite (constat 3), 3 tenue moins la passe de
  surface (constat 5), 5 tenue moins le passage profil par profil (constat 4).
- **Checklist du projet** : pas de duplication d'information nouvelle, pas de code mort, pas de trace
  de débogage, pas d'abstraction spéculative. Deux incohérences documentation-contre-code (constats 3
  et 6) et une troisième plan-contre-réalité (constat 7).

Les quatre constats majeurs se corrigent séparément et aucun ne demande de refonte : le constat 2
tient en un mot de `course.json`, le 3 en un arbitrage à consigner, le 4 en trois assertions de plus
dans le test de force brute, le 5 en une passe de surface. Le constat 1 est le seul qui appelle une
décision de portée : il vaut pour ce jeu plus fort que pour les huit précédents, et rien dans le
dépôt ne le couvre aujourd'hui.
