---
type: review
verdict: changes-requested
scope: "commit 1aa067a, restreint au jeu flow-order"
plan: aidd_docs/tasks/2026_08/2026_08_31_jeu-flow-order/plan.md
story: aidd_docs/backlog/stories/remettre-le-flux-dans-l-ordre.md
score: 62/100
---

# Revue : le jeu `flow-order`

Périmètre : le commit `1aa067a`, restreint à `flow-order`. Le rapport de revue d'`ambiguity-scan` et le fichier de défaut embarqués par le même commit sont hors périmètre, comme les travaux non commités du worktree.

Le défaut connu « la révélation précède le verrou, donc un rechargement la rejoue » ([backlog](../../../backlog/defects/la-revelation-precede-le-verrou-donc-un-rechargement-la-rejoue.md)) n'est pas re-signalé : `flow-order` le reproduit à l'identique, sans l'aggraver.

## Ce qui a été recalculé à la main

Les deux règles ont été **réimplémentées depuis leur énoncé**, sans réutiliser une ligne du jeu, et exécutées sur le corpus réel du slot `g5-2` lu dans `config/course.json`. Scripts hors dépôt : `e:/tmp/flow-order-check.mjs` et `e:/tmp/flow-order-parity.mjs`.

```
n = 7 etapes, 5040 permutations, seuil c2 = 1
c1 (ordre exact)        : 1 / 5040 = 0.0198 %
c2 (a une position pres): 21 / 5040 = 0.4167 %
c1 sans c2 : 0        c2 sans c1 : 20
```

Les chiffres du message de commit sont exacts : une seule permutation tient `c1`, 0,42 % tiennent `c2`. Aucun critère ne récompense l'inverse de ce qu'il annonce — la classe d'échec de `lie-detector` n'est pas reproduite.

Profil par profil, sur le corpus réel :

```
P0 ne touche a rien (initialOrder)             n=   1  c1=  0.00%  c2=  0.00%  points/3=0.000  maxDisp=[2..2]
P1 aveugle uniforme (les 5040)                 n=5040  c1=  0.02%  c2=  0.42%  points/3=0.005  maxDisp=[0..6]
P2 inverse deux voisines (6 cas)               n=   6  c1=  0.00%  c2=100.00%  points/3=1.000  maxDisp=[1..1]
P3 renverse tout                               n=   1  c1=  0.00%  c2=  0.00%  points/3=0.000  maxDisp=[6..6]
P4 deplace une seule carte (36 uniques)        n=  36  c1=  0.00%  c2= 16.67%  points/3=0.167  maxDisp=[1..6]
P5 un cran de travers sur deux etapes          n=  10  c1=  0.00%  c2=100.00%  points/3=1.000  maxDisp=[1..1]
P6 depuis initialOrder, 1 geste au hasard      n=20000  c1=  0.00%  c2=  0.00%  points/3=0.000
P6 depuis initialOrder, 2 gestes au hasard     n=20000  c1=  0.00%  c2=  3.91%  points/3=0.039
P6 depuis initialOrder, 3 gestes au hasard     n=20000  c1=  0.00%  c2=  4.70%  points/3=0.047
P6 depuis initialOrder, 5 gestes au hasard     n=20000  c1=  0.21%  c2=  5.40%  points/3=0.058
```

**Une stratégie aveugle ne bat pas un joueur qui lit.** Le lecteur qui se trompe d'un cran (P2, P5) tient `c2` à 100 %, contre 0,42 % pour l'aveugle uniforme et 5,4 % au mieux pour le tripoteur qui pousse cinq cartes au hasard depuis l'ordre de présentation. Le rapport est d'au moins 18 pour 1. C'est le point le plus important de cette revue, et il tient.

Assertions du projet, sur le périmètre livré :

```
npx vitest run __tests__/unit/games/flow-order  ->  Test Files 7 passed (7) · Tests 50 passed (50)
npm run typecheck                               ->  aucune sortie
npx biome check src/games/flow-order __tests__/unit/games/flow-order  ->  Checked 16 files. No fixes applied.
```

---

## Constats, du plus grave au moins grave

### 1. Majeur — Le garde-fou anti-triche du schéma fige `1` en dur, là où le parcours déclare le seuil

`src/games/flow-order/schema/config.schema.ts:43` et `:130` · `config/course.json:1565-1566`

Le plan décide que le refus « `initialOrder` ne satisfait pas `c2` » vit dans le schéma, avec pour raison : « Un garde-fou se mesure, il ne se déclare pas. » Le code fait l'inverse : il **déclare** le seuil.

```ts
// config.schema.ts:43
const DISPLACEMENT_THRESHOLD = 1
```

Le commentaire qui le précède admet le couplage sans le fermer : « Aligné sur le `maxDisplacement` que le parcours attache à `order-within-displacement` ». Le schéma d'une configuration n'a aucun accès aux critères ; il ne lit donc jamais `course.json:1566`. Les deux valeurs sont indépendantes et rien ne les compare — ni un test, ni une assertion de démarrage.

**Ce qui casse.** Un auteur de parcours desserre la tolérance à `maxDisplacement: 2` dans `config/course.json` — une modification d'un seul caractère, exactement le geste que le schéma est censé rendre sans effet. Le schéma continue d'accepter le corpus (trois étapes y sont déplacées de plus d'une position, le plancher de deux est tenu), et la fuite la plus bête du jeu se rouvre en silence :

```
initialOrder acceptes par le schema : 4943 / 5040
... dont satisfaisant deja c2 (seuil 1) : 0
... dont satisfaisant c2 si le parcours ecrivait maxDisplacement=2 : 111
initialOrder du corpus satisfait c2 a maxDisplacement=2 ? true
```

Le joueur ouvre `g5-2`, ne touche à rien, clique « Verrouiller la frise » et empoche `c2`, soit 1 point sur 3 et 1 unité de poids sur `pilotage-contexte`. Le refus livré ne ferme pas ce que le plan dit qu'il ferme : il ferme le cas où le parcours vaut exactement `1`.

Que le seuil du parcours soit libre est par ailleurs prouvé par le jeu lui-même — `__tests__/unit/games/flow-order/evaluator.test.ts:80-96` fait tourner la même trace à `maxDisplacement: 0` puis `5` et attend deux verdicts différents. Le code traite donc bien deux seuils séparés ; seul le corpus actuel les fait coïncider, et aucun test ne couvre leur divergence.

---

### 2. Majeur — Le pointeur n'atteint pas la dernière position ; le clavier si

`src/games/flow-order/hooks/use-flow-order.hook.ts:110-122` (pointeur) et `:131-146` (clavier)

Le docblock du hook (`:47`) et le message de commit affirment tous deux « deux chemins d'entrée, à égalité **stricte** de précision ». C'est faux. Le geste pointeur est « déposer **juste avant** la carte visée » :

```ts
const targetIndex = withoutGrabbed.indexOf(stepId)
const next = [
  ...withoutGrabbed.slice(0, targetIndex),
  grabbedId,
  ...withoutGrabbed.slice(targetIndex),
]
```

`withoutGrabbed` compte `n-1` cartes, donc `targetIndex` vaut au plus `n-2`, et la carte saisie atterrit au plus en position `n-1`. Il n'existe aucune carte « après la dernière » devant laquelle déposer. Positions atteignables par carte, sur sept étapes :

```
carte a (pos 1) : pointeur -> [1,2,3,4,5,6]   clavier -> [1,2,3,4,5,6,7]   manquant au pointeur : [7]
carte d (pos 4) : pointeur -> [1,2,3,4,5,6]   clavier -> [1,2,3,5,6,7]     manquant au pointeur : [7]
carte g (pos 7) : pointeur -> [1,2,3,4,5,6]   clavier -> [1,2,3,4,5,6,7]   manquant au pointeur : [7]
```

**Ce qui casse.** Sur le corpus réel, l'ordre attendu se termine par `merge` en position 7, et l'ordre de présentation place `merge` en position 5 (`config/course.json:1537-1545`). Le joueur à la souris qui a compris le flux saisit `merge` et cherche à le poser en dernier : ce dépôt n'existe pas. Il doit inverser son raisonnement et déplacer `assertions` puis `pr` **au-dessus** de `merge` pour que celui-ci retombe en queue. Le joueur au clavier fait deux `ArrowDown` sur `merge`. L'ordre exact reste atteignable au pointeur, mais pas le geste, et l'écran n'explique nulle part que la dernière position se gagne indirectement.

Aucun test ne couvre le dépôt en dernière position — pour cause : `__tests__/unit/games/flow-order/use-flow-order.test.ts:135-157` et `flow-order-game.test.tsx:77-91` ne testent que des dépôts vers le haut.

---

### 3. Majeur — La position jouée, seul état du jeu, est invisible à l'assistance technique

`src/games/flow-order/components/elements/step-card.tsx:36-40` et `:58-65` · `src/games/flow-order/components/composites/flow-timeline.tsx:27-38`

La carte porte `aria-label={label}`, ce qui **remplace** son contenu comme nom accessible, et le numéro de position est explicitement retiré par `aria-hidden` :

```tsx
aria-label={label}
...
<span aria-hidden className="w-5 shrink-0 ...">{position}</span>
```

La pile de cartes est un `<div className="flex flex-col gap-2 p-3">` sans sémantique de liste : ni `<ol>`/`<li>`, ni `role="list"`, ni `aria-posinset`/`aria-setsize`. Le lecteur d'écran n'a donc **aucune** source pour la position d'une carte. La seule annonce positionnelle du jeu est la région `aria-live` (`flow-order-game.tsx:87-92`), qui ne se remplit qu'**après** un déplacement.

Le test livré en fait lui-même la preuve : `flow-order-game.test.tsx:45-53` lit `textContent` et obtient `"1" + label`, tandis que `:66-68` retrouve la même carte par `getByRole('button', { name: config.steps[2].label })`, sans le `1`. Le voyant lit la position, l'assistance technique ne la lit pas.

**Ce qui casse.** Un joueur au lecteur d'écran arrive sur `g5-2` et tabule : sept boutons, sept libellés, aucune position, aucun « 3 sur 7 ». Pour connaître l'arrangement courant il doit déplacer une carte — donc modifier sa réponse — puis écouter la région live, et recommencer pour chaque carte. Il ne peut pas relire sa frise avant de la verrouiller. `DESIGN.md:94` charge explicitement le jeu de l'atteignabilité clavier d'un glisser-déposer ; la moitié annonce est traitée, la moitié lecture ne l'est pas.

---

### 4. Majeur — Le corrigé est la convention interne de ce dépôt, et le joueur ne l'a jamais lue

`config/course.json:1492` (consigne) et `:1493-1536` (rangs) · `BUILD-ORDER.md:14-19`

L'ordre attendu — cadrage, plan, implémentation, assertions, revue, PR, merge — est la boucle en cinq commandes de `BUILD-ORDER.md:14-19`, prolongée de la PR et du merge. La consigne dit : « Remettez ces sept gestes du flux dans l'ordre où ils se jouent réellement **sur ce projet**. » Le joueur n'a jamais vu `BUILD-ORDER.md` : le contrat d'accueil énonce le cadre, jamais les conventions du dépôt évaluateur. Et « ce projet » est ambigu — le sien, ou celui qui l'évalue ? Selon la lecture, la consigne demande soit une convention inaccessible, soit une réponse que le corpus n'a aucun moyen de juger.

**Ce qui casse.** Un praticien du flux GitHub le plus répandu — on ouvre la PR, la revue et la CI se jouent **dans** la PR — range `pr` en 4 ou 5. Résultat mesuré :

```
ordre canonique du corpus                              c1=true  c2=true  points=3/3
PR ouverte avant la revue (CI+revue dans la PR)        c1=false c2=false points=0/3
PR ouverte juste apres le code, revue puis assertions  c1=false c2=false points=0/3
revue de plan avant le code (plan review)              c1=false c2=false points=0/3
initialOrder (rien touche)                             c1=false c2=false points=0/3
renverse tout                                          c1=false c2=false points=0/3
```

Ce joueur obtient exactement le score de celui qui n'a rien touché et de celui qui a tout renversé. Le corpus ne l'aide pas non plus à comprendre : parmi les sept `note` révélées, aucune ne justifie l'adjacence contestable revue → PR. Celle de `revue` (`:1522`) explique ce qu'est une revue, pas quand elle se place ; celle de `pr` (`:1528`) explique ce qu'est une PR ; seule celle de `merge` (`:1534`) ordonne quelque chose (« Le merge acte une revue tenue »), et elle porte sur un autre couple.

C'est aussi le seul jeu du parcours sans ressource rare et sans réponse de la simulation, contrairement à la règle uniforme que l'épique pose (« le joueur dépense une ressource rare, la simulation répond »). Trois unités de poids sur les dix-sept de `pilotage-contexte` — la dimension qui garde `aidd-en-route` à `min 0.35` et `aidd-confirmé` à `min 0.6` — se jouent sur la restitution d'une séquence, pas sur une pratique.

---

### 5. Majeur — L'écran de révélation est celui d'`ambiguity-scan`, et le jeu n'a pas de fiche de surface

`src/games/flow-order/components/composites/flow-order-game.tsx:33-72` · `DESIGN.md:67` · `BUILD-ORDER.md:145`

`DESIGN.md:67` : « Vingt jeux, vingt surfaces. **Aucun n'hérite de la composition d'un autre.** Chacun a sa fiche sous `.impeccable/surfaces/`. » `BUILD-ORDER.md:145`, règle propre à l'épique : « ne pas dupliquer un écran existant pour aller plus vite. »

Le bloc `phase === 'revealed'` est le bloc d'`ambiguity-scan-game.tsx:33-64`, au caractère près sur les classes :

```
$ diff -u <(sed -n '33,64p' .../ambiguity-scan-game.tsx) <(sed -n '33,72p' .../flow-order-game.tsx)
-            Ce que ces segments laissaient ouvert
+            Ce que chaque étape apporte au flux
-            {revelations.map((entry) => (
+            {revelations.map((entry, index) => (
-                <p className="text-plane-foreground text-sm">{entry.text}</p>
+                <p className="text-plane-foreground text-sm">
+                  <span aria-hidden className="tabular-nums text-plane-foreground/55">{index + 1}. </span>
+                  {entry.label}
+                </p>
-                  {entry.reading}
+                  {entry.note}
```

Le bloc de phase `'ordering'` est de même celui de `practice-map-game.tsx:95-114`, à `tabular-nums` près — le commentaire livré le dit lui-même : « sur le modèle de `practice-map-game.tsx` ».

`.impeccable/surfaces/` ne contient aucune fiche pour `flow-order` :

```
$ ls .impeccable/surfaces/
budget-...hint-budget-game-tsx.md   ce-map-...practice-map-game-tsx.md
ct-hunt-...   ence-bet-...   kpoints-...   onboarding-...   tector-...   tracks-...
```

**Ce qui casse.** Le dixième jeu sort avec la troisième instance du même écran de révélation et sans le document qui devait justifier ses écarts. Concrètement : la passe visuelle suivante n'a aucune ligne de base propre à ce jeu, et la première correction portée sur l'écran d'`ambiguity-scan` — ou de `practice-map` — devra être recopiée ici à la main, ou divergera sans que rien ne le signale. C'est la répétition littérale du constat 5 de la revue d'`ambiguity-scan`, dans le même commit.

---

### 6. Majeur — `release()` n'est câblé nulle part, et sortir d'une carte saisie ramène à la déplacer

`src/games/flow-order/hooks/use-flow-order.hook.ts:125-129` et `:185` · `src/games/flow-order/components/composites/flow-order-game.tsx:20-31`

Le hook expose `release`, documenté « le pendant pointeur d'Échap ». Aucune touche `Escape` n'est écoutée dans `flow-order` (`grep -rn "Escape" src/games/` ne remonte que `practice-map/.../practice-plane.tsx:189`), et `FlowOrderGame` ne déstructure pas `release` :

```tsx
const { statement, steps, heldId, phase, announcement,
        activate, move, submit, advance, revelations } = useFlowOrder(config, onSubmit)
```

Le seul appelant est un test — `use-flow-order.test.ts:181-196` — qui donne à la fonction une couverture verte pour un chemin qu'aucun joueur ne peut emprunter. Code mort au sens de la checklist du projet.

**Ce qui casse.** Le joueur clique une carte pour la saisir, se ravise et décide d'utiliser les flèches. `move` ne touche pas à `heldId` (`:132-146`), donc la carte reste saisie, en gras et bordée, après avoir été déplacée au clavier. Il clique alors une autre carte pour « désélectionner » : `activate` voit `heldId !== undefined` et **téléporte** la carte saisie juste avant celle qu'il vient de cliquer. Sa frise est modifiée là où il croyait annuler. Les seules sorties sont de recliquer exactement la carte saisie, ou `Escape` — qui n'est pas branché.

---

### 7. Mineur — Le groupe s'annonce « Architecture » au joueur et le score tombe sur « Pilotage du contexte »

`config/course.json:1488-1571` · `src/components/group-rail/elements/rail-tab.tsx:57` et `:111`

`g5-2` vit dans `groupe-architecture`, libellé « Architecture ». Ce libellé est rendu dans la rampe (`rail-tab.tsx:111`) et lu dans le nom accessible de l'onglet (`:57`). Les deux critères du jeu pointent sur `pilotage-contexte` (`:1556`, `:1570`), la dimension du **groupe 2**, dont le troisième slot `g2-3` est encore un `test-bench`.

**Ce qui casse.** Le joueur ouvre l'onglet « Architecture » et reçoit une question sur l'ordre du pipeline de développement ; la restitution attribue ensuite son résultat à « Pilotage du contexte et de la délégation ». Le plan (Phase 4) justifie le retrait du mapping `taille` — « le groupe 5 porte la signature, pas les axes du référentiel » — mais ne dit jamais **quelle** dimension de la signature, ni pourquoi celle-ci plutôt que `verification` ou `resilience`. Le total de `taille` passe de 9 à 6 sans régression (`g5-1` et `g7-4` l'alimentent encore), et `pilotage-contexte` de 14 à 17.

---

### 8. Mineur — Le passage en force brute s'arrête à la moyenne uniforme

`__tests__/unit/games/flow-order/brute-force.test.ts:97-112`

L'unique assertion de population est `expect(c2Count / total).toBeLessThan(0.01)` sur les 5040 permutations tirées uniformément. `BUILD-ORDER.md:147` exige le passage de l'espace complet **« profil par profil »** ; le test livré couvre quatre traces nommées (ordre exact, `initialOrder`, une inversion voisine, le renversement) puis une moyenne uniforme, qui ne décrit aucun joueur réel.

**Ce qui casse.** Le garantie annoncée par le test — « moins de 1 % » — ne vaut que pour un tirage uniforme. Le profil que le corpus expose vraiment est le joueur qui pousse quelques cartes depuis l'ordre de présentation, et sa réussite sur `c2` monte à 5,40 % (voir P6 ci-dessus), soit treize fois la valeur mesurée par le test. Le jeu tient largement — l'écart avec le lecteur reste d'un facteur 18 — mais le test n'en apporte pas la preuve, et un corpus futur dont l'`initialOrder` serait plus proche de l'ordre attendu passerait ce test en dégradant ce rapport sans que rien ne le voie. Le profil « déplace une seule carte » (P4, `c2` à 16,67 %) n'est mesuré nulle part non plus.

---

### 9. Mineur — Le message du refus le plus important affirme quelque chose de faux

`src/games/flow-order/schema/config.schema.ts:44-52` et `:133-138` · `__tests__/unit/games/flow-order/config.schema.test.ts:115-124`

```
« initialOrder » ne déplace que ${displacedCount} étape(s) de plus d'une position,
au moins ${MIN_INITIAL_DISPLACED_STEPS} sont requises pour qu'il ne tienne aucun des deux critères
```

Une seule étape déplacée de plus d'une position suffit déjà à faire échouer `c2` : `maxDisplacement` est un maximum, pas un compte. Le plancher de deux est un choix de robustesse — le commentaire `:46-51` l'assume — mais le message le présente comme la condition nécessaire, ce qu'il n'est pas.

**Ce qui casse.** L'auteur de parcours qui écrit `['s2','s3','s1','s4','s5','s6']` reçoit un refus lui disant que sa configuration tiendrait l'un des deux critères. Elle ne les tient ni l'un ni l'autre (`s1` est déplacé de 2, `maxDisplacement = 2`). Il ira chercher une fuite qui n'existe pas au lieu de lire la vraie raison, qui est une marge de sécurité. Le test `:115-124` fige la phrase avec `expect(issue.message).toContain('aucun des deux critères')`.

---

## Ce qui tient, vérifié

- **Les trois acceptances de la story sont tenues.** Ordre exact et ordre à une position près acceptés séparément (1 et 21 permutations sur 5040) ; deux règles distinctes lisant deux champs distincts (`flow-order.evaluator.ts:33-53`) ; une inversion voisine donne `maxDisplacement = 1` et non 6, recalculé hors du code livré.
- **Aucun critère ne récompense l'inverse de ce qu'il annonce.** Recalcul indépendant sur les 5040 permutations : `c1` sans `c2` = 0, `c2` sans `c1` = 20, exactement la gradation que le plan assume.
- **La `question` de chaque critère décrit ce que la règle calcule.** « La frise est-elle dans l'ordre exact ? » lit `exact` ; « Chaque étape est-elle à sa place, à une position près ? » lit `maxDisplacement <= 1`. Aucun écart part brute / part nette du type trouvé sur `ambiguity-scan`.
- **Aucune valeur de seuil n'est lue ni entendue par le joueur pendant la partie.** La consigne (`course.json:1492`) n'annonce ni l'ordre exact ni la tolérance ; l'annonce `aria-live` ne dit que « étape N sur 7 » ; les `question` des critères ne sont rendues que dans `summary-view.tsx:96`, après le parcours.
- **Aucune fuite du corrigé avant la révélation.** Ni `rank` ni `note` ne traversent le hook en phase `'ordering'` (`use-flow-order.hook.ts:163-176`, `StepView` ne porte que `id`/`label`/`position`) ; aucun `data-*`, aucun `title`, aucun `aria-*` porteur du rang ; l'ordre de rendu est l'ordre joué, jamais celui de `config.steps` ; `revelations` reste vide tant que la phase n'est pas `'revealed'`. Le test `use-flow-order.test.ts:49-70` sérialise la surface du hook et le vérifie.
- **Les libellés ne trahissent pas leur place par un mot d'ordre.** Deux renvois croisés existent — « phase par phase » dans `implementation` renvoie au `plan`, « confronte le résultat au plan » dans `revue` aussi — mais ils désignent l'antériorité du plan sans donner l'ordre des cinq autres. Le renvoi le plus fort, « demande de fusion » → merge, porte sur le couple le moins contesté.
- **Les autres refus du schéma ferment ce que le plan dit.** Identifiants uniques, `rank` formant exactement `1..n`, plancher de six étapes, couverture exacte de `initialOrder` : chacun est exercé par un test et par une lecture du code. Seul le refus n° 5 est incomplet (constat 1).
- **Le domaine reste pur.** `read-order.helper.ts`, `flow-order.evaluator.ts`, `answer.schema.ts`, `config.schema.ts` : aucun import React, aucun appel à `Date`, aucun aléa, aucune E/S. Le seuil de tolérance n'est pas dans le helper.
- **La lecture est faite une fois pour les deux règles** (`flow-order.evaluator.ts:66`), pas recalculée par critère.
- **`initialOrder` est écrit par le corpus, jamais tiré**, comme la décision du plan l'exige — la partie est reproductible.
- **Smart/Dumb tenu à l'intérieur du jeu** : seul `FlowOrderGame` connaît le hook et `GameComponentProps` ; `FlowTimeline` et `StepCard` sont des vues pures sans état. Le placement d'un composant connecté dans `composites/` plutôt que `sections/` suit la convention déjà établie par `practice-map` et `ambiguity-scan` — pas un écart propre à ce jeu.
- **Les cinq phases du plan sont livrées**, y compris les six fichiers de tests annoncés en Phase 5 et les quatre tests d'intégration de parcours mis à jour.
- **Les assertions du projet passent** sur le périmètre : 50 tests, typecheck muet, Biome sans correction.

Observation sans scénario de casse, donc hors constats : `announcePosition` appelle `setAnnouncement` **à l'intérieur** de l'updater passé à `setOrder` (`use-flow-order.hook.ts:119` et `:143`). Un updater React doit être pur. La valeur écrite étant idempotente, aucune double-invocation observable n'a pu être produite — mais l'idiome reste à corriger si le calcul de l'annonce se complexifie.

---

## Score

**62 / 100.**

Les trois acceptances de la story sont tenues et vérifiées par recalcul indépendant, ce qui vaut le socle. Le jeu mesure bien ce qu'il annonce et résiste au joueur aveugle avec une marge de 18 pour 1.

Sont retirés : le garde-fou central du plan, qui déclare son seuil au lieu de le mesurer et se rouvre sur une modification d'un caractère du parcours (constat 1) ; l'égalité de précision entre pointeur et clavier, affirmée trois fois et fausse (constat 2) ; la lisibilité de l'état du jeu à l'assistance technique, absente (constat 3) ; la pertinence du corrigé, qui impose une convention interne non montrée au joueur (constat 4) ; la surface propre du jeu, qui est celle de deux autres et n'a pas de fiche (constat 5) ; une fonction morte doublée d'un piège d'interaction (constat 6).

Verdict : `changes-requested`.
