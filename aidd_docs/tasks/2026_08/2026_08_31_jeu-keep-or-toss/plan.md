---
objective: "Le jeu keep-or-toss se joue de bout en bout à la place du placeholder g4-2, mesure sur la dimension verification ce qu'un joueur sait des pratiques de sécurité sans le temps de le chercher, et ne rend aucun verdict avant la fin du chronomètre."
status: reviewed
---

# Plan: Le jeu `keep-or-toss`, trier des pratiques de sécurité sous le chronomètre

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Mesurer ce qu'un joueur sait des pratiques de sécurité quand le temps lui retire la possibilité de chercher, sans lui donner le moindre retour avant la fin |
| **Source** | `aidd_docs/backlog/stories/trier-sous-le-chronometre.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` · `config/signature.json` · `DESIGN.md` §93-94 |
| **Slot** | `g4-2` du groupe 4 « Sécurité et responsabilité », aujourd'hui un `test-bench` |

Plan court : le gabarit structurel des jeux livrés fait autorité. Seul ce qui est propre à ce jeu est écrit ici.

## Phases

### Phase 1 — Les contrats et la lecture pure

`schema/config.schema.ts`, `schema/answer.schema.ts`, `helpers/read-sorting.helper.ts`.

Configuration : `statement`, `durationSeconds: number`, `items[]` (`id`, `label`, `keep: boolean` — la réponse attendue, jamais exposée ; `reason: string` — pourquoi, montré **à la révélation seulement**).

Trace : `verdicts: { itemId, kept: boolean }[]` **et** `elapsedSeconds: number`. La durée entre dans la trace comme donnée mesurée, produite par l'écran — précédent explicite de `defect-hunt`, dont le plan écrit « la durée écoulée entre dans la trace comme donnée mesurée, produite par l'écran, jamais par le port `Clock` ». Le domaine reste sans horloge.

`parseKeepOrTossTrace(answer, config)` refuse un `itemId` inconnu, un doublon, et une durée négative. Il **n'exige pas** la couverture de tous les items : un tri inachevé est une trace valide, c'est le sujet même du jeu.

`readSorting` rend `{ total, sortedCount, correctCount, unsortedCount, completedInTime, correctShare, maxSingleGestureShare }` avec :

- `correctShare = correctCount / total` — le dénominateur est le **total**, jamais le nombre trié. C'est ce qui fait qu'un élément non trié compte comme manqué et non comme neutre, exactement ce que la story demande ;
- `completedInTime = sortedCount === total && elapsedSeconds <= durationSeconds` ;
- `maxSingleGestureShare = max(nombre de « garder », nombre de « jeter ») / total` — la part que le geste unique répété (tout garder ou tout jeter) obtient mécaniquement sur *ce* corpus, sans lire une carte. Ajouté par la revue du 31/08 (constat 1) : ce plancher se **calcule** depuis le corpus déclaré, jamais un nombre écrit à la main à côté — un seuil déclaré dans `course.json` peut dériver d'un caractère sans qu'aucun test ne rougisse, un plancher dérivé du corpus lui-même ne le peut pas.

**Garde-fous portés par le schéma, en refus au chargement :**

- identifiants uniques, au moins huit items ;
- **les deux verdicts sont représentés, et aucun ne dépasse les deux tiers du lot** : sans quoi « tout garder » ou « tout jeter » tiendrait `c1` d'un seul geste répété ;
- `durationSeconds` strictement positif et **inférieur à trois secondes par item** : au-delà, le chronomètre n'est plus une contrainte et le jeu ne mesure plus « sans le temps de chercher ». *(Corrigé de deux à trois secondes par item par la revue du 31/08, constat 2 : deux secondes par item exigeait 351 mots/minute soutenus sur le corpus réel, au-dessus de la vitesse de lecture silencieuse courante — le jeu mesurait la vitesse de lecture, pas la connaissance.)*

### Phase 2 — L'évaluateur et ses deux règles

`keep-or-toss.evaluator.ts`.

| Règle | Lit | Question du parcours |
| --- | --- | --- |
| `correct-share-at-least` `{threshold}` | `correctShare >= threshold` | « La part de pratiques bien classées sur l'ensemble du lot, cartes non triées comprises, atteint-elle le seuil ? » |
| `sorting-completed-beyond-blind-floor` `{}` | `completedInTime && correctShare > maxSingleGestureShare` | « Le lot a-t-il été trié en entier avant la fin du temps imparti, avec un classement qui dépasse ce qu'un seul geste répété sur tout le lot aurait obtenu ? » |

*(Règle renommée par la revue du 31/08, constat 1 : `sorting-completed-in-time` ne lisait que `completedInTime`, et « tout garder » — le geste unique répété, aucune carte lue — la tenait en quelques secondes, battant strictement un lecteur honnête qui n'avait pas le temps de finir. Le nom porte désormais ce qu'elle calcule réellement, comparaison stricte à `maxSingleGestureShare`.)*

Deux lectures différentes : la justesse d'un côté, l'aboutissement conditionné à la justesse de l'autre. Un joueur rapide mais dont le classement ne dépasse pas le plancher du geste unique ne tient plus `c2` ; un joueur juste et lent tient `c1` seul si sa part de justes reste au-dessus du seuil malgré les non-triés comptés manqués.

### Phase 3 — Le jeu à l'écran

`components/composites/keep-or-toss-game.tsx`, `composites/sorting-deck.tsx`, `composites/countdown-bar.tsx`, `composites/frozen-panel.tsx`, `composites/revealed-camps.tsx`, `elements/practice-card.tsx`, `hooks/use-keep-or-toss.hook.ts`, `hooks/use-countdown.hook.ts`.

*(`frozen-panel.tsx` et `revealed-camps.tsx` ajoutés par la revue du 31/08, constat 5 : la révélation reprenait `MarkerLine` de `practice-map` classe pour classe, ce que `DESIGN.md` interdit. `RevealedCamps` redessine la révélation sur la matière propre du jeu — douze cartes triées, en deux camps « Gardées » / « Jetées » — et `FrozenPanel` extrait l'écran de gel pour la même raison : une vue de phase par fichier, jamais une fonction de plus de cent lignes qui les porterait toutes les trois.)*

Une pile : une carte à la fois, au centre, deux destinations — **Garder** à gauche, **Jeter** à droite. La carte part vers sa destination et la suivante arrive. Pointeur et clavier à égalité : `ArrowLeft` / `ArrowRight`, plus deux boutons visibles portant les mêmes libellés.

**Aucune validation avant la fin.** Ni coche, ni couleur d'état, ni compteur de justes. Ce qui est visible pendant la partie : le temps restant, le nombre de cartes déjà triées sur le total, et la carte courante. Rien d'autre. C'est le chronomètre qui remplace le retour immédiat, comme la story l'écrit.

Le compte à rebours suit `use-elapsed-seconds.hook.ts` de `defect-hunt` : `Date.now()` dans une ref posée au premier rendu, `setInterval` à 250 ms, et une lecture fraîche au moment du gel — jamais la valeur d'état affichée, qui peut avoir un quart de seconde de retard. Annonce `aria-live="polite"` aux paliers (30 s, 10 s, 5 s), jamais à chaque battement. La carte courante porte elle aussi son propre `aria-live="polite"` : avant la revue du 31/08 (constat 3), seul le chronomètre était annoncé, et un joueur au clavier n'avait aucun moyen de savoir ce sur quoi son geste suivant portait.

Trois temps : `'sorting'`, `'frozen'` — le temps est écoulé ou le lot est trié, plus aucun geste n'est accepté — puis `'revealed'`. La révélation liste **chaque item, son verdict attendu et sa `reason`**, jamais le verdict du joueur ni son score.

Le gel à l'expiration se déclenche par **deux chemins**, jamais un troisième : l'effet passif sur `expired` (au tick suivant de `useCountdown`, jusqu'à 250 ms de retard), et `sort()` lui-même, qui relit le temps frais à chaque geste et gèle immédiatement s'il tombe après la limite. *(Le second chemin ajouté par la revue du 31/08, constat 8 : `sort()` ne se gardait que sur `phase`, qui ne bascule qu'au tick suivant — un tri déposé dans cette fenêtre de 250 ms entrait dans la trace.)* Un tri arrivé après la seconde limite n'entre donc jamais dans la trace, y compris dans ce quart de seconde.

### Phase 4 — Le jeu dans le parcours

- Un bloc dans `register-games.ts`, un dans `register-components.ts`.
- `config/course.json` : `g4-2` passe à `keep-or-toss`, corpus de **douze pratiques** de sécurité, six à garder et six à jeter, écrites pour que le tri se joue sur la connaissance et non sur la formulation — pas de « jamais » ni de « toujours » qui trahiraient la réponse, **et pas de polarité de ton qui trahirait la réponse non plus** : au moins la moitié des libellés opposent la polarité de surface au verdict attendu (une pratique dangereuse qui s'annonce comme prudente, une pratique sûre qui sonne contraignante). *(Contrainte renforcée par la revue du 31/08, constat 2 : le premier corpus se résolvait 12/12 par le seul verbe de tête, sans lire le fond — le tell n'était pas dans « jamais »/« toujours », il était dans le ton du verbe.)*
- `durationSeconds: 30` — trente secondes pour douze cartes, sous le plafond des trois secondes par item, mesuré pour laisser un lecteur à 240 mots/minute boucler le lot avec une marge d'environ quatre secondes, jugement par carte compris (voir `reading-pace.test.ts`).
- Deux critères, pesés **2** (`c1`) et **1** (`c2`), tous deux sur `verification` en `measured`. Les mappings `intervention` / `verification` en `inferred` du placeholder disparaissent : le groupe 4 porte la signature, et ce jeu **mesure** ce qu'il note.
- Seuil `c1` : `0.75` — neuf items justes sur douze. Le plancher de `c2` (`maxSingleGestureShare`) ne se déclare pas : il se calcule depuis l'équilibre 6/6 du corpus, et vaut `0.5`.

### Phase 5 — Les tests

`__tests__/unit/games/keep-or-toss/` : `config.schema.test.ts` (chaque refus, dont le déséquilibre du lot et le chronomètre trop généreux), `answer.schema.test.ts`, `read-sorting.test.ts` (dont `maxSingleGestureShare`), `evaluator.test.ts` (dont le refus d'un seuil qui ne dépasse pas le plancher), `use-countdown.test.ts` et `use-keep-or-toss.test.ts` (timers simulés, `vi.useFakeTimers`, dont la fenêtre de 250 ms entre l'expiration réelle et le tick suivant), `keep-or-toss-game.test.tsx`, `brute-force.test.ts`, `reading-pace.test.ts`, `corpus-separability.test.ts`.

*(`reading-pace.test.ts` et `corpus-separability.test.ts` ajoutés par la revue du 31/08 : le premier compte les mots du corpus réel et vérifie qu'un lecteur à 240 mots/minute boucle le lot avec de la marge (constat 2 partie temps) ; le second calcule, sur le corpus réel, qu'aucun lexème unique — premier mot compris — ne partitionne parfaitement le lot par verdict (constat 2 partie corpus). Un garde-fou de cette nature se mesure, il ne se relit pas à l'œil.)*

**Passage en force brute obligatoire.** `2^12 = 4096` traces complètes pour le corpus réel, plus les traces partielles échantillonnées. Sur la configuration **réelle** de `config/course.json`, vérifier :

- tout garder ne tient ni `c1` ni `c2` ; tout jeter non plus — le geste unique répété est désormais exclu des deux axes, pas seulement de `c1` ;
- une trace parfaite bouclée à temps tient les deux critères ;
- une trace parfaite sur les huit premiers items, les quatre derniers non triés, **manque** `c1` — le non-trié compte comme manqué (`8/12 = 0.67 < 0.75`) — et manque `c2` ;
- la part de traces complètes au hasard qui tiennent `c1` reste sous 5 % ;
- la part de traces complètes qui tiennent `c2` — `1586/4096`, loin du « toujours vrai » d'avant le correctif ;
- le meilleur profil aveugle mesuré (garder tout, jeter tout, alterner, moitié-moitié) reste strictement sous le pire profil de lecture correcte qui passe encore, sur les deux critères ;
- un tri déposé après `durationSeconds` n'apparaît pas dans la trace, y compris dans la fenêtre de 250 ms avant le tick suivant.

## Decisions

| Decision | Why |
| --- | --- |
| Le type est **`keep-or-toss`** | Nomme le verdict que le joueur produit. `speed-sort` ou `timed-triage` nommeraient le mécanisme |
| Le dénominateur de `correctShare` est le **total**, pas le nombre trié | La story l'exige au mot : « les éléments non triés à la fin comptent comme manqués, pas comme neutres ». Diviser par le nombre trié récompenserait l'abandon précoce — trier trois cartes justes et s'arrêter donnerait 100 % |
| Le chronomètre vit dans **l'interface**, la durée entre dans la trace comme donnée | Précédent `defect-hunt`, déjà tranché et livré. Injecter un port `Clock` dans un composant réintroduirait le temps dans le domaine par la porte de derrière |
| `c2` exige **le lot entier trié** dans le temps, pas seulement le temps tenu | « Tri bouclé dans le temps imparti » : un joueur qui ne trie rien et attend la fin ne l'a pas bouclé. Sans la condition de complétude, ne rien faire tiendrait le critère |
| `c2` exige en plus un classement qui **dépasse strictement `maxSingleGestureShare`** | Revue du 31/08, constat 1 : sans ce plancher, « tout garder » ou « tout jeter » — le geste unique répété, aucune carte lue — tenait `c2` en quelques secondes, battant strictement un lecteur honnête qui n'avait pas le temps de finir. Le plancher se **calcule** depuis l'équilibre réel du corpus (`max(garder, jeter) / total`), jamais un nombre déclaré à côté : un seuil déclaré peut dériver sans qu'un test ne rougisse, un plancher dérivé du corpus ne le peut pas. Comparaison stricte : à égalité, le geste unique tiendrait encore |
| Le lot est **équilibré par le schéma**, entre un tiers et deux tiers par verdict | Un lot à dix « garder » sur douze rendrait « tout garder » payant à 83 %. Le refus est mécanique, pas une consigne au corpus |
| Le seuil de `correct-share-at-least` est **borné à `[0, 1]`, et refusé s'il ne dépasse pas `maxSingleGestureShare`** | Revue du 31/08, constat 9 : `threshold: z.number()` n'était borné ni dans `[0, 1]` ni au-dessus de ce qu'un geste unique obtient — abaisser le seuil du parcours de `0.75` à `0.65` aurait rendu « tout garder » gagnant sans qu'aucun test ne rougisse. Le refus se fait dans l'évaluateur, seul endroit où le seuil déclaré et le corpus réel se rencontrent |
| `durationSeconds` plafonné à **trois secondes par item** par le schéma (corrigé de deux à trois) | Revue du 31/08, constat 2 : un plafond de deux secondes par item exigeait, sur le corpus réel, 351 mots/minute soutenus plus un verdict par carte — au-dessus de la vitesse de lecture silencieuse courante (environ 240 mots/minute). Le jeu mesurait la vitesse de lecture, pas la connaissance. Trois secondes par item laisse la place à une lecture réelle, mesurée avec marge par `reading-pace.test.ts`, sans annuler la pression de temps |
| Le corpus interdit aussi la **polarité de ton** comme signal, pas seulement « jamais »/« toujours » | Revue du 31/08, constat 2 : le premier corpus se résolvait 12/12 par le seul verbe de tête (vertueux = garder, relâchement = jeter), sans lire le fond. Au moins la moitié des libellés opposent désormais la polarité de surface au verdict attendu, et `corpus-separability.test.ts` calcule qu'aucun lexème unique ne partitionne plus le lot |
| **Aucun retour, même différé, pendant la partie** | La story en fait sa première acceptance. Un seul compteur de justes visible et le chronomètre cesse d'être ce qui remplace le retour immédiat |
| La révélation donne le **pourquoi** de chaque pratique, jamais le verdict du joueur | Un jeu déjà soumis peut être rejoué. Choix identique à `practice-map` et `hint-budget` |
| La révélation se redessine en **deux camps** (`RevealedCamps`), jamais la bande à deux paragraphes de `practice-map` | Revue du 31/08, constat 5 : `MarkerLine` recopiée classe pour classe, ce que `DESIGN.md` interdit (« Vingt jeux, vingt surfaces »). Deux camps — Gardées / Jetées — reprennent la matière propre du jeu : douze cartes qui viennent d'être triées vers deux destinations |
