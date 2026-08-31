---
objective: "Le jeu keep-or-toss se joue de bout en bout à la place du placeholder g4-2, mesure sur la dimension verification ce qu'un joueur sait des pratiques de sécurité sans le temps de le chercher, et ne rend aucun verdict avant la fin du chronomètre."
status: draft
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

`readSorting` rend `{ total, sortedCount, correctCount, unsortedCount, completedInTime, correctShare }` avec :

- `correctShare = correctCount / total` — le dénominateur est le **total**, jamais le nombre trié. C'est ce qui fait qu'un élément non trié compte comme manqué et non comme neutre, exactement ce que la story demande ;
- `completedInTime = sortedCount === total && elapsedSeconds <= durationSeconds`.

**Garde-fous portés par le schéma, en refus au chargement :**

- identifiants uniques, au moins huit items ;
- **les deux verdicts sont représentés, et aucun ne dépasse les deux tiers du lot** : sans quoi « tout garder » ou « tout jeter » tiendrait `c1` d'un seul geste répété ;
- `durationSeconds` strictement positif et **inférieur à deux secondes par item** : au-delà, le chronomètre n'est plus une contrainte et le jeu ne mesure plus « sans le temps de chercher ».

### Phase 2 — L'évaluateur et ses deux règles

`keep-or-toss.evaluator.ts`.

| Règle | Lit | Question du parcours |
| --- | --- | --- |
| `correct-share-at-least` `{threshold}` | `correctShare >= threshold` | « Le taux de bon classement dépasse-t-il le seuil ? » |
| `sorting-completed-in-time` `{}` | `completedInTime` | « Le tri a-t-il été bouclé dans le temps imparti ? » |

Deux lectures différentes : la justesse d'un côté, l'aboutissement de l'autre. Un joueur rapide et faux tient `c2` seul ; un joueur juste et lent tient `c1` seul si sa part de justes reste au-dessus du seuil malgré les non-triés comptés manqués.

### Phase 3 — Le jeu à l'écran

`components/composites/keep-or-toss-game.tsx`, `composites/sorting-deck.tsx`, `composites/countdown-bar.tsx`, `elements/practice-card.tsx`, `hooks/use-keep-or-toss.hook.ts`, `hooks/use-countdown.hook.ts`.

Une pile : une carte à la fois, au centre, deux destinations — **Garder** à gauche, **Jeter** à droite. La carte part vers sa destination et la suivante arrive. Pointeur et clavier à égalité : `ArrowLeft` / `ArrowRight`, plus deux boutons visibles portant les mêmes libellés.

**Aucune validation avant la fin.** Ni coche, ni couleur d'état, ni compteur de justes. Ce qui est visible pendant la partie : le temps restant, le nombre de cartes déjà triées sur le total, et la carte courante. Rien d'autre. C'est le chronomètre qui remplace le retour immédiat, comme la story l'écrit.

Le compte à rebours suit `use-elapsed-seconds.hook.ts` de `defect-hunt` : `Date.now()` dans une ref posée au premier rendu, `setInterval` à 250 ms, et une lecture fraîche au moment du gel — jamais la valeur d'état affichée, qui peut avoir un quart de seconde de retard. Annonce `aria-live="polite"` aux paliers (30 s, 10 s, 5 s), jamais à chaque battement.

Trois temps : `'sorting'`, `'frozen'` — le temps est écoulé ou le lot est trié, plus aucun geste n'est accepté — puis `'revealed'`. La révélation liste **chaque item, son verdict attendu et sa `reason`**, jamais le verdict du joueur ni son score.

Le gel à l'expiration est **le seul chemin** : `sort()` ne fait plus rien une fois `'frozen'` atteint, et le timer est arrêté. Un tri arrivé après la seconde limite n'entre pas dans la trace.

### Phase 4 — Le jeu dans le parcours

- Un bloc dans `register-games.ts`, un dans `register-components.ts`.
- `config/course.json` : `g4-2` passe à `keep-or-toss`, corpus de **douze pratiques** de sécurité, six à garder et six à jeter, écrites pour que le tri se joue sur la connaissance et non sur la formulation — pas de « jamais » ni de « toujours » qui trahiraient la réponse.
- `durationSeconds: 20` — vingt secondes pour douze cartes, sous le plafond des deux secondes par item.
- Deux critères, pesés **2** (`c1`) et **1** (`c2`), tous deux sur `verification` en `measured`. Les mappings `intervention` / `verification` en `inferred` du placeholder disparaissent : le groupe 4 porte la signature, et ce jeu **mesure** ce qu'il note.
- Seuil `c1` : `0.75` — neuf items justes sur douze.

### Phase 5 — Les tests

`__tests__/unit/games/keep-or-toss/` : `config.schema.test.ts` (chaque refus, dont le déséquilibre du lot et le chronomètre trop généreux), `answer.schema.test.ts`, `read-sorting.test.ts`, `evaluator.test.ts`, `use-countdown.test.ts` et `use-keep-or-toss.test.ts` (timers simulés, `vi.useFakeTimers`), `keep-or-toss-game.test.tsx`.

**Passage en force brute obligatoire.** `2^12 = 4096` traces complètes pour le corpus réel, plus les traces partielles échantillonnées. Sur la configuration **réelle** de `config/course.json`, vérifier :

- tout garder ne tient pas `c1` ; tout jeter non plus ;
- une trace parfaite bouclée à temps tient les deux critères ;
- une trace parfaite sur les huit premiers items, les quatre derniers non triés, **manque** `c1` — le non-trié compte comme manqué (`8/12 = 0.67 < 0.75`) — et manque `c2` ;
- la part de traces complètes au hasard qui tiennent `c1` reste sous 5 % ;
- un tri déposé après `durationSeconds` n'apparaît pas dans la trace.

## Decisions

| Decision | Why |
| --- | --- |
| Le type est **`keep-or-toss`** | Nomme le verdict que le joueur produit. `speed-sort` ou `timed-triage` nommeraient le mécanisme |
| Le dénominateur de `correctShare` est le **total**, pas le nombre trié | La story l'exige au mot : « les éléments non triés à la fin comptent comme manqués, pas comme neutres ». Diviser par le nombre trié récompenserait l'abandon précoce — trier trois cartes justes et s'arrêter donnerait 100 % |
| Le chronomètre vit dans **l'interface**, la durée entre dans la trace comme donnée | Précédent `defect-hunt`, déjà tranché et livré. Injecter un port `Clock` dans un composant réintroduirait le temps dans le domaine par la porte de derrière |
| `c2` exige **le lot entier trié** dans le temps, pas seulement le temps tenu | « Tri bouclé dans le temps imparti » : un joueur qui ne trie rien et attend la fin ne l'a pas bouclé. Sans la condition de complétude, ne rien faire tiendrait le critère |
| Le lot est **équilibré par le schéma**, entre un tiers et deux tiers par verdict | Un lot à dix « garder » sur douze rendrait « tout garder » payant à 83 %. Le refus est mécanique, pas une consigne au corpus |
| `durationSeconds` plafonné à **deux secondes par item** par le schéma | Sans plafond, un corpus futur pourrait desserrer le chronomètre jusqu'à annuler la contrainte, et le jeu mesurerait autre chose que ce que sa story annonce |
| **Aucun retour, même différé, pendant la partie** | La story en fait sa première acceptance. Un seul compteur de justes visible et le chronomètre cesse d'être ce qui remplace le retour immédiat |
| La révélation donne le **pourquoi** de chaque pratique, jamais le verdict du joueur | Un jeu déjà soumis peut être rejoué. Choix identique à `practice-map` et `hint-budget` |
