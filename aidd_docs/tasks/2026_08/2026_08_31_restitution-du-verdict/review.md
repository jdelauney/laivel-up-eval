---
type: review
target: "feat/comprendre-mon-verdict — 2496b26 feat(verdict): tell the player what capped the level and what would raise it"
spec: ./spec.md
verdict: changes-requested
score: 72/100
---

# Review: La restitution du verdict

## Verdict global

**`changes-requested`.**

Le socle est solide et honnête : le repli menteur sur `❖ White` a disparu, le statut ternaire est porté par la donnée et pas par le code, les dix-sept actions vivent bien dans `config/grid.json`, et la chaîne de production du verdict est purement déterministe. Les trois preuves de validation annoncées sont exactes (vérifiées ci-dessous).

Ce qui bloque tient en trois points, tous sur le trajet de lecture le plus exposé :

1. **A3 n'est pas tenue.** L'axe qui plafonne est nommé, mais jamais avec la borne qu'il aurait fallu atteindre — la phase 1 la demandait explicitement, et le code porte encore le commentaire qui reporte le travail « à la phase suivante ». La phase suivante est passée.
2. **Le profil « creux du référentiel », que la spec anticipe nommément en D2, lit une phrase incohérente et un plan qui lui demande de régresser.** C'est un profil très atteignable au jour J.
3. **Un axe mesuré mais entièrement raté n'affiche aucun signal**, alors que `AxisProof.missed` est calculé pour ça et jeté. C'est exactement le lecteur le plus sur la défensive qui reçoit le moins d'explication.

S'y ajoute une absence de test sur trois surfaces livrées (`capping-axis.tsx`, `signature-block.tsx`, `condition-gap-text.helper.ts`), dont celle qui porte l'acceptance non tenue.

---

## Acceptances A1 → A12

| # | Statut | Preuve |
| --- | --- | --- |
| **A1** — libellé officiel du niveau atteint | **tenue** | `src/features/scoring-summary/components/composites/level-block.tsx:28-31` rend `level.level.label` en `h2`. Tests : `__tests__/unit/features/scoring-summary/level-block.test.tsx:71`, `__tests__/unit/features/scoring-summary/summary-view.test.tsx:72` (`heading level 2` = `🥈 Silver`). |
| **A2** — aucun niveau annonçable dit et expliqué, jamais « White » par défaut | **partielle** | Le repli est bien mort : `src/core/scoring/helpers/level-resolver.helper.ts:127-142` rend `level: undefined` sans `?? byOrder[0]`. Tests `__tests__/unit/core/scoring/level-resolver.test.ts:91` et `:103`, `level-block.test.tsx:80` (« never announces White by default »). **Mais** la raison rendue est incohérente sur une borne `max`, qui est l'une des deux causes que D2 nomme — voir DB-2. La phase 1 demandait en outre « chaque axe en cause, **sa borne exigée** » : la borne n'est jamais écrite. |
| **A3** — l'axe qui plafonne est nommé **avec la borne qu'il aurait fallu atteindre** | **non tenue** | `src/features/scoring-summary/components/composites/capping-axis.tsx:18-20` délègue à `describeConditionGap`, qui rend « … la condition demande un cran plus haut » — direction, jamais borne ni cran visé (`src/features/scoring-summary/helpers/condition-gap-text.helper.ts:24-28`). Aucun test ne couvre `CappingAxis` (`grep -rn "plafonne\|CappingAxis" __tests__/` → 0 résultat). Voir DB-1. |
| **A4** — cran, signal qui l'a fixé, valeur observée, seuil franchi et seuil manqué | **partielle** | Cran, valeur et deux seuils : `axis-proof-row.tsx:29-56`, adossés à `axis-proof.helper.ts:96-116` et testés en `__tests__/unit/core/scoring/axis-proof.test.ts:62,74,88`. **Le signal manque** dès que `held` est vide (`axis-proof-row.tsx:23,39`) — voir DB-3. |
| **A5** — l'axe inféré porte une marque distincte de l'axe mesuré | **tenue** | `src/features/scoring-summary/components/elements/measurement-mark.tsx:20-42` : trois mots distincts (`mesuré` / `inféré` / `non mesuré`) et trois formes distinctes (barre pleine `h-8`, barre hachurée `h-5`, contour tireté). Aucun état n'emprunte la forme d'un autre. Tests `axis-proof-row.test.tsx:87,93,100`. Le marquage des données est conforme au tableau de D1, vérifié par agrégation de `config/course.json` (voir « Ce que j'ai vérifié »). |
| **A6** — l'axe non mesuré le dit et n'affiche aucun chiffre bas | **tenue** | `axis-proof-row.tsx:30-32` remplace le cran par « aucun critère ne mesure cet axe », et `:45` supprime toute la ligne chiffrée. `weighted-mapping.strategy.ts:66` laisse `band: undefined` quand `possible === 0`. Tests `axis-proof-row.test.tsx:108` (« renders no figure at all »), `summary-view.test.tsx:133`. |
| **A7** — aucun pourcentage d'axe à l'écran | **tenue, avec réserve** | `dimension-row.tsx` est supprimé et n'est plus référencé nulle part (`grep -rn "DimensionRow\|dimension-row" src __tests__` → 0). `grep -rn "percent\|toFixed" src/` ne renvoie plus rien dans `scoring-summary`. Test `summary-view.test.tsx:148` : `container.textContent` ne matche pas `/%/`. Réserve : des décimales nues subsistent (`franchi 0.25`), voir SUG-1. |
| **A8** — deux blocs distincts, et l'écran écrit que la signature ne déplace aucun niveau | **tenue** | `sections/summary-view.tsx:19-30` : deux `div` frères, chacun avec son propre `rounded-2xl border`. `composites/signature-block.tsx:24-27` porte la phrase. Tests `summary-view.test.tsx:72` (les deux titres n'ont pas le même conteneur) et `:88`. |
| **A9** — sans fichier de signature, le niveau seul, sans mention d'une lecture absente | **tenue** | `summary-view.tsx:24` : le bloc n'est rendu que si `signature !== undefined`. Test `summary-view.test.tsx:106` : `container.textContent` ne matche pas `/signature/i`. Test `:115` confirme que le niveau annoncé est identique avec et sans signature. |
| **A10** — chaque axe bloquant porte une action et la preuve qui la validerait | **partielle** | `progression-step.tsx:23-33` rend l'action et la preuve verbatim ; `grid.test.ts:142` garde la grille réelle (toute bande `from > 0` porte les deux). **Mais** sur une condition à borne `max`, la bande cible résolue est la bande `from: 0`, qui n'a par construction ni action ni preuve : l'écran retombe sur « La grille ne porte pas d'action pour ce cran ». D4 l'autorise ; l'épique (« elle sait nommer l'action qui la ferait monter ») ne s'en satisfait pas. Voir DB-2. |
| **A11** — le texte des actions vient de `config/grid.json`, sans toucher au code | **tenue** | `progression-plan.helper.ts:89-90` : `action: target?.action`, `proof: target?.proof`, aucun littéral joueur dans le fichier. Test `__tests__/unit/core/scoring/progression-plan.test.ts:201` (« changes the rendered action when only the grid object changes, the code untouched ») et `:184` (aucun texte inventé sur une bande sans action). |
| **A12** — aucun réseau, aucun modèle, aucune horloge dans la chaîne | **tenue** | `grep -rn "Date\|Math.random\|fetch\|now()" src/core/scoring/` → aucun résultat. `game-session.facade.ts:257-268` : `getVerdict()` n'appelle jamais `this.clock`. Tests de déterminisme dans les trois helpers : `level-resolver.test.ts:118`, `axis-proof.test.ts:171`, `progression-plan.test.ts:282`. |

**Décompte** : 8 tenues, 3 partielles, 1 non tenue.

---

## Constats

### `deal-breaker`

#### DB-1 — L'axe qui plafonne ne nomme jamais la borne qu'il aurait fallu atteindre

**Fichiers** : `src/features/scoring-summary/helpers/condition-gap-text.helper.ts:9-12` et `:24-28`, consommé par `src/features/scoring-summary/components/composites/capping-axis.tsx:18-20`.

Le commentaire du helper l'écrit noir sur blanc :

```
 * La résolution du libellé exact de la borne visée (le futur « axis proof »)
 * n'est pas construite ici : elle appartient à la phase suivante.
```

La phase suivante — la 2, puis la 4 — a livré exactement l'objet manquant : `PlanStep.target = { label, from }`, résolu dans `progression-plan.helper.ts:53-70`. Il n'a jamais été rebranché sur le bloc du plafond. Le joueur lit donc :

> Harness monté autour du modèle — actuellement « prompts », la condition demande un cran plus haut

au lieu de « … la condition demande « context engineering » ». Phase 1 §4 exigeait pourtant : « `capping-axis.tsx` reçoit `capping` et nomme l'axe, **sa borne exigée et la valeur observée** ».

**Pourquoi ça compte** : A3 est l'acceptance de la story n°1 de l'épique, sur l'écran où le produit tient ou tombe, et elle porte le critère de jury n°2. « Un cran plus haut » ne dit ni où l'on est ni où il faut aller ; le joueur doit descendre dans une autre section pour recoller l'information. Le commentaire reste par ailleurs faux dans le code livré — item « pas de contradiction docs-vs-code » du checklist.

#### DB-2 — Le profil « creux du référentiel » lit une phrase impossible et un plan qui lui demande de régresser

**Fichiers** : `condition-gap-text.helper.ts:24-25`, `progression-plan.helper.ts:63-67`, données `config/grid.json` (niveau `white` : `{ "dimension": "taille", "max": 0 }`, `{ "dimension": "harness", "max": 0 }`).

Scénario reproductible, celui-là même que D2 anticipe (« le profil tombe dans un creux du référentiel ») : un joueur qui réussit `g5-1`/`g5-2` (`taille ≈ 0.5`) et rate entièrement `g7-2` (`parallele = 0`, mesuré) échoue à White (`taille > 0`) et à Red (`parallele < 0.33`) → non classé. `blocking` = les conditions `max: 0` de White.

Ce qu'il lit alors, trois fois :

- bloc niveau (`level-block.tsx:56`) : « Taille de la plus grosse feature livrée avec l'IA — actuellement « M — complexité moyenne », **la condition demande un cran plus bas** » ;
- bloc plafond (`capping-axis.tsx:20`) : **la même phrase, mot pour mot** — `resolveLevel` pose `unranked === blocking` et `capping === gaps[0]` (`level-resolver.helper.ts:133-138`), donc `LevelBlock` liste déjà l'élément que `CappingAxis` re-rend ;
- section « Ce qui vous ferait monter » : `resolveTargetBand` sur une borne `max: 0` renvoie la bande `from: 0`, soit « **aucune feature livrée avec l'IA** », sans `action` ni `proof` → « Taille … → aucune feature livrée avec l'IA » + « La grille ne porte pas d'action pour ce cran. »

Cas voisin, plus absurde encore : à `taille = 0.2`, `bandFor` rend la bande `from: 0`, donc la phrase devient « actuellement « aucune feature livrée avec l'IA », la condition demande un cran plus bas » — on demande au joueur de descendre sous le plancher de l'échelle.

**Pourquoi ça compte** : la *Success Evidence* de l'épique est « elle sait nommer l'action qui la ferait monter, et comment elle saura qu'elle l'a faite ». Ce profil-là reçoit l'inverse : une injonction à défaire son travail, une section de progression vide de sens, et la même phrase répétée deux fois à dix lignes d'écart (item « pas de duplication d'information » du checklist). C'est un état que la spec a explicitement prévu, pas un cas limite exotique.

Note connexe sur le même code : `describeConditionGap:24-25` choisit la direction sur `condition.min !== undefined`. Une condition portant les deux bornes, que `levelConditionSchema` autorise (`grid.schema.ts:52-64`), annoncerait « un cran plus haut » sur une violation de `max`. La grille actuelle n'en porte aucune, donc c'est latent — mais le contrat, lui, l'autorise.

#### DB-3 — Un axe mesuré entièrement raté n'affiche aucun signal, et `missed` est calculé pour rien

**Fichiers** : `src/features/scoring-summary/components/composites/axis-proof-row.tsx:23` (`const decisiveSignal = proof.held[0]`) et `:39-43`.

Quand un axe est mesuré mais qu'aucune contribution n'est tenue, `held` est vide : la ligne « fixé par « … » » disparaît entièrement. Le joueur voit le cran plancher (« rien », « aucun ») et « 0 sur 6 contributions », sans qu'aucune question ne lui soit nommée. `AxisProof.missed` — trié par poids décroissant, `criterionId` en départage (`axis-proof.helper.ts:83-86,127`) — contient exactement l'information qui manque, et n'est utilisé que pour `.length` (`axis-proof-row.tsx:24`).

**Pourquoi ça compte** : A4 demande « le signal qui l'a fixé » pour **chaque** axe. Un zéro est un cran fixé par quelque chose. C'est précisément le lecteur qui va contester — celui à qui l'épique promet « discuter le verdict sur des faits plutôt que le subir » — qui reçoit le moins de faits. Et c'est du calcul domaine livré puis jeté, item « pas de code mort » du checklist.

---

### `suggestion`

#### SUG-1 — Des décimales nues à côté d'une fraction d'une autre échelle

`axis-proof-row.tsx:46-55` rend, sur une seule ligne : `3 sur 8 contributions · franchi 0.25 · manqué 0.5 → context engineering`.

Aucun `%`, donc A7 tient. Mais `3/8` et `0.25` sont deux échelles que rien ne relie visuellement, et `0.25` n'a ni unité ni référent. `design.md:30` pose que le sens ne repose jamais sur la seule couleur et s'accompagne du libellé du cran ; ici le libellé du cran franchi n'est pas rendu alors que `AxisProof.crossed` pourrait être remplacé par le label de la bande atteinte, déjà connu. Ce serait cohérent avec le traitement du seuil manqué, qui, lui, porte son label.

#### SUG-2 — `PlanStep.observed` et `PlanStep.required` sont calculés et jamais rendus

`progression-plan.helper.ts:91-92` produit les deux champs ; aucun composant ne les lit (`grep -rn "\.observed\|\.required" src/` → 0 résultat, un seul usage en test). Le wireframe de `phase-4.md` les demandait explicitement : « (4) La valeur observée face à la borne exigée, dans les mots de la grille — *Lu à 2 chantiers, le cran demande 3 chantiers et plus.* », et le journey mermaid de la phase porte la même branche.

Deux issues cohérentes : soit rendre la ligne (elle réglerait aussi une partie de DB-1), soit retirer les deux champs. `requiredBound()` (`:38-46`), qui n'existe que pour alimenter `required`, disparaîtrait avec la seconde.

#### SUG-3 — Champs de signal transportés puis abandonnés

`AxisSignal` porte `gameId`, `weight` et `evidence` (`axis-proof.helper.ts:23-30`) ; seul `question` est rendu. Aucun de ces trois n'apparaît dans `src/features` ni `src/components`. Même remarque pour `LevelVerdict.satisfiedConditions` — qui, lui, préexistait au diff et reste non lu. Généralité spéculative, item « pas d'abstraction inutilisée ».

#### SUG-4 — Trois surfaces livrées sans test

`capping-axis.tsx`, `signature-block.tsx` et `condition-gap-text.helper.ts` n'ont aucun fichier de test dédié, et aucune assertion indirecte : `grep -rn "plafonne\|CappingAxis\|describeConditionGap" __tests__/` ne renvoie que des occurrences de `level-resolver` côté domaine. C'est la seule zone du diff où le filet est absent — et c'est celle qui porte l'acceptance non tenue (DB-1). `testing.md` demande une couverture par surface rendue.

#### SUG-5 — Le libellé « aucun niveau » est dupliqué en littéral

`signature-block.tsx:6` (`const NO_LEVEL_LABEL = 'Aucun niveau ne peut être annoncé'`) reproduit mot pour mot le texte de `level-block.tsx:50`. Deux sources pour une même phrase produit ; item DRY du checklist.

Question de fond sous-jacente : `config/signature.json` peut légitimement rendre un verdict non classé (`vibe-coder` exige `verification ≤ 0.4`, `aidd-en-route` exige `verification ≥ 0.4` **et** `pilotage-contexte ≥ 0.35` — un profil à `0.5 / 0.2` ne tient ni l'un ni l'autre). Le bloc signature affiche alors « Aucun niveau ne peut être annoncé » **sans aucune raison**, à côté du bloc officiel qui, lui, en donne une. Une lecture dont le rôle est de distinguer deux profils classés pareil ne devrait pas pouvoir se taire ainsi.

#### SUG-6 — Deux styles d'import cohabitent dans le même dossier

`level-resolver.helper.ts:1-2` importe en `@/core/...`, `axis-proof.helper.ts:1-3` et `progression-plan.helper.ts:1-6` en relatif `../../...`. Trois fichiers voisins, deux conventions. Biome ne tranche pas ; le lecteur, si.

#### SUG-7 — `ReachedLevel` masque son invariant

`level-block.tsx:29-31` : `{level.level?.label}` alors que le branchement appelant (`:23-26`) garantit `level.level !== undefined`. L'optional chaining transforme un invariant en silence potentiel — une régression de branchement rendrait un titre `h2` vide au lieu de casser. Un type de props plus étroit (`{ level: Level; hint; nextLevel }`) le supprimerait.

---

### `correct`

- **Le repli menteur est mort, et bien mort.** `level-resolver.helper.ts:120-142` : plus de `?? byOrder[0]`, `level: Level | undefined` assumé jusque dans le type. C'est le point le plus important du diff et il est net.
- **Le statut de mesure est porté par la donnée, pas par le code.** `evidence` sur le mapping (`course.schema.ts:9-20`), résolu en `weighted-mapping.strategy.ts:20-33` sans jamais consulter `satisfied` — la distinction « comment la valeur a été obtenue » vs « ce qu'elle vaut » est tenue. L'agrégation réelle de `config/course.json` correspond au tableau de D1, ligne pour ligne.
- **Extensions de schéma réellement additives.** `evidence` a un `.default('measured')`, `action`/`proof` sont `.optional()`. Une grille tierce charge toujours ; les tests de rejet de `grid.test.ts:84-138` restent verts.
- **Tri des conditions bloquantes déterministe.** `level-resolver.helper.ts:96-113` : comparateur total (`unmeasured` d'abord, puis écart décroissant, puis ordre de la grille), départage explicite à écart flottant égal par `rank`. Aucune dépendance à la stabilité du `sort`. Testé en `level-resolver.test.ts:163,174,187`. Même rigueur sur `sortByWeightThenId` (`axis-proof.helper.ts:83-86`), départagé par `criterionId`.
- **`src/core/` reste du domaine pur.** `grep -rn "from 'react'\|@/features\|@/components\|@/store\|@/games\|@/infrastructure\|@/providers" src/core/` → aucun résultat.
- **Aucun barrel export.** `find src -name "index.ts" -o -name "index.tsx"` → aucun résultat.
- **Smart/Dumb tenu.** `summary-view.tsx` (section) est le seul à appeler `facade.getVerdict()` ; les cinq composites et l'élément livrés ne reçoivent que des props et ne portent aucun appel de façade, de store ou de hook métier.
- **Le prefix d'échelle est garanti par le schéma.** `resolveThresholds` (`axis-proof.helper.ts:105-108`) fait l'hypothèse que les bandes franchies forment un préfixe de `scale` ; `dimensionScaleSchema` (`grid.schema.ts:31-46`) l'impose (départ à 0, strictement croissante). L'hypothèse est adossée au contrat, pas à la donnée.
- **Le garde-fou sur la grille réelle est le bon réflexe.** `grid.test.ts:142-159` casse la construction si une bande `from > 0` perd son action ou sa preuve. C'est ce qui protège le jour J d'une édition JSON hâtive.
- **Les dix-sept actions et preuves tiennent la contrainte de rédaction de D4.** Chacune nomme un geste à l'infinitif et un artefact repérable — « Poser une boucle de relance qui rejoue l'IA tant qu'une commande du projet échoue » / « Un script versionné dans le dépôt, et une exécution où il relance au moins deux fois avant le vert ». Aucune intention déguisée du type « améliorer son harness ». Les deux plus faibles sont `intervention@0.5` (« Des PR où seule une partie des fichiers modifiés porte une relecture manuelle après coup » — difficilement traçable dans un dépôt) et `harness@0.5` (« … et la tenir à jour », habitude plutôt que geste ponctuel) ; les deux restent adossées à un fichier ou une PR qu'on peut aller regarder. Elles passent.
- **La dette du référentiel est consignée là où elle se lit.** `aidd_docs/memory/architecture.md:50` note que `taille`, `harness` et `initiative` montent sur des bancs de jugement, et que la dette se solde en construisant les trois jeux manquants, pas en changeant la règle. La tension de D1 n'est pas enterrée.

---

## Ce que j'ai vérifié moi-même

| Vérification | Commande | Résultat |
| --- | --- | --- |
| Périmètre du diff | `git diff main...HEAD --stat` | 54 fichiers, +3081 / −296, un seul commit `2496b26` |
| Typage | `npm run typecheck` | propre, aucune sortie **confirmé** |
| Tests | `npm run test` | `Test Files 90 passed (90)` · `Tests 821 passed (821)` **confirmé** |
| Lint / format | `npx biome check src __tests__ config` | `Checked 242 files in 74ms. No fixes applied.` **confirmé** |
| Pureté du domaine | `grep -rn "from 'react'\|@/features\|@/components\|@/store\|@/games\|@/infrastructure\|@/providers" src/core/` | aucun résultat |
| Déterminisme | `grep -rn "Date\|Math.random\|fetch\|now()" src/core/scoring/` | aucun résultat |
| Absence de barrel | `find src -name "index.ts" -o -name "index.tsx"` | aucun résultat |
| Absence de pourcentage | `grep -rn "percent\|toFixed\|Math.round" src/` | plus rien dans `scoring-summary` ; restes légitimes dans `practice-map` (messages de schéma) et `onboarding` (arrondi de durée) |
| Suppression effective de `dimension-row` | `ls .../composites/` + `grep -rn "DimensionRow\|dimension-row" src __tests__` | fichier absent, zéro référence |
| Conformité du marquage `evidence` au tableau D1 | agrégation node sur `config/course.json` | `taille` inféré (0 mes. / 6 inf.), `harness` inféré (0/14), `initiative` inféré (0/2), `resilience` inféré (0/6), `intervention` mesuré (3/4, via `g7-1`), `parallele` mesuré (4/0, via `g7-2`), `verification` mesuré (10/4), `pilotage-contexte` mesuré (6/2) — **conforme ligne pour ligne** |
| Bande rendue sur une borne `max: 0` violée | résolution manuelle de `bandFor` sur `config/grid.json` à `taille = 0.2` | rend `aucune feature livrée avec l'IA` → confirme l'incohérence DB-2 |
| Couverture des surfaces livrées | `ls __tests__/unit/features/scoring-summary/` + `grep -rn "plafonne\|CappingAxis\|describeConditionGap" __tests__/` | 4 fichiers de test ; `capping-axis`, `signature-block` et `condition-gap-text` non couverts |
| Champs calculés non rendus | `grep -rn "\.observed\|\.required\|satisfiedConditions" src/` | zéro usage en couche de rendu |

## Score

**72 / 100.**

Le calcul, à défaut de pondération fournie par la spec : 8 acceptances tenues, 3 partielles, 1 non tenue → 9,5 / 12 ≈ 79. Retrait pour la sévérité de DB-2 (état anticipé par la spec, rendu incohérent sur l'écran décisif, avec duplication de la phrase) et pour l'absence totale de test sur la surface qui porte l'acceptance non tenue.

Aucune violation dure — pas d'atteinte à la pureté du domaine, pas de rupture Smart/Dumb, pas de non-déterminisme, pas d'appel modèle — donc pas de mise à zéro.

Le seuil de passage appartient à l'appelant.
