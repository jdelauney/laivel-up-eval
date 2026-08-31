---
objective: "Le jeu flow-order se joue de bout en bout à la place du placeholder g5-2, mesure sur la dimension pilotage-contexte si le joueur sait où se place chaque geste du flux AIDD, et distingue l'ordre exact de l'ordre presque juste par deux critères séparés."
status: draft
---

# Plan: Le jeu `flow-order`, remettre les étapes du flux dans l'ordre

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Mesurer si un joueur sait situer chaque geste du flux, du cadrage au merge, et distinguer une lecture juste d'une lecture presque juste |
| **Source** | `aidd_docs/backlog/stories/remettre-le-flux-dans-l-ordre.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` · `config/signature.json` · `DESIGN.md` |
| **Slot** | `g5-2` du groupe 5 « Architecture », aujourd'hui un `test-bench` |

Plan court : le gabarit structurel des jeux livrés fait autorité et n'est pas re-décrit. Seul ce qui est propre à ce jeu est écrit ici.

## Phases

### Phase 1 — Les contrats et la lecture pure

`schema/config.schema.ts`, `schema/answer.schema.ts`, `helpers/read-order.helper.ts`.

Configuration : `statement`, `steps[]` (`id`, `label`, `rank: number` — la place attendue, jamais exposée ; `note: string` — ce que l'étape apporte, montré **à la révélation seulement**), `initialOrder: string[]` — l'ordre de présentation, écrit par le corpus et non tiré au hasard, pour que la partie soit reproductible.

Trace : `orderedIds: string[]`, plus `parseFlowOrderTrace(answer, config)` qui refuse un identifiant inconnu, un doublon, et une trace qui ne couvre pas toutes les étapes.

`readOrder` rend `{ exact: boolean, maxDisplacement: number, displacedCount: number }` où `displacement` d'une étape est `|position_jouée - rank_attendu|`. **`maxDisplacement` est une lecture par étape, jamais une distance globale** : c'est ce qui empêche qu'une inversion entre deux voisines soit notée comme une inversion de bout en bout.

**Garde-fous portés par le schéma, en refus au chargement :**

- identifiants uniques, `rank` formant exactement `1..n` sans trou ni doublon ;
- au moins six étapes — sous six, l'ordre exact se tient au hasard trop souvent ;
- `initialOrder` couvre exactement les étapes déclarées ;
- **`initialOrder` ne satisfait aucun des deux critères** : au moins deux étapes y sont déplacées de plus d'une position. Sans ce refus, « soumettre sans rien toucher » tiendrait `c2`, et le jeu ne mesurerait personne.

### Phase 2 — L'évaluateur et ses deux règles

`flow-order.evaluator.ts`.

| Règle | Lit | Question du parcours |
| --- | --- | --- |
| `order-exact` `{}` | `exact` | « La frise est-elle dans l'ordre exact ? » |
| `order-within-displacement` `{maxDisplacement}` | `readOrder.maxDisplacement <= maxDisplacement` | « Chaque étape est-elle à sa place, à une position près ? » |

Les deux critères sont **distincts et évalués séparément**, comme la story l'exige : `c1` ne lit que l'égalité stricte, `c2` ne lit que le déplacement maximal. `c1` implique `c2`, et c'est assumé — un ordre exact vaut les deux, un ordre presque juste vaut le second seul, un ordre approximatif n'en vaut aucun. C'est exactement la gradation que la story demande.

### Phase 3 — Le jeu à l'écran

`components/composites/flow-order-game.tsx`, `composites/flow-timeline.tsx`, `elements/step-card.tsx`, `hooks/use-flow-order.hook.ts`.

Une frise **verticale numérotée** : chaque étape est une carte, la position se lit à gauche. Deux chemins d'entrée, à égalité stricte de précision :

- pointeur : une carte se saisit et se dépose entre deux autres ;
- clavier : la carte est un `button`, `ArrowUp` / `ArrowDown` la déplace d'un cran, et sa nouvelle position est annoncée en `aria-live` (« étape 3 sur 7 »).

`DESIGN.md` §93-94 : l'atteignabilité au clavier d'un glisser-déposer se traite dans le jeu, pas dans une primitive.

Rien n'indique la justesse pendant le jeu : pas de coche, pas de couleur d'état, pas de compteur de bonnes places. Deux temps, `'ordering'` puis `'revealed'` ; la révélation liste **les étapes dans l'ordre attendu avec leur `note`**, ce qui donne le « pourquoi » du flux sans donner au joueur le verdict de sa propre frise.

### Phase 4 — Le jeu dans le parcours

- Un bloc dans `register-games.ts`, un dans `register-components.ts`.
- `config/course.json` : `g5-2` passe à `flow-order`, corpus de **sept étapes** du flux réel du projet (cadrage, plan, implémentation, assertions, revue, PR, merge), libellés écrits pour ne pas se déduire l'un de l'autre par un mot-clé d'ordre.
- Deux critères, pesés **2** (`c1`, ordre exact) et **1** (`c2`, à une position près), tous deux sur `pilotage-contexte` en `measured`. Le mapping `taille` du placeholder disparaît : le groupe 5 porte la signature, pas les axes du référentiel.
- `c2` : `maxDisplacement: 1`.

### Phase 5 — Les tests

`__tests__/unit/games/flow-order/` : `config.schema.test.ts` (chaque refus, dont celui de l'`initialOrder` trop facile), `answer.schema.test.ts`, `read-order.test.ts`, `evaluator.test.ts`, `use-flow-order.test.ts`, `flow-order-game.test.tsx`.

**Passage en force brute obligatoire.** Sept étapes : `7! = 5040` permutations, tout tient en mémoire. Sur la configuration **réelle** de `config/course.json`, vérifier :

- une seule permutation tient `c1` ;
- l'`initialOrder` du corpus ne tient ni `c1` ni `c2` ;
- une inversion de deux étapes **voisines** tient `c2` et manque `c1` ;
- une inversion **de bout en bout** (l'ordre renversé) ne tient aucun des deux ;
- la part de permutations au hasard qui tiennent `c2` reste sous 1 %.

## Decisions

| Decision | Why |
| --- | --- |
| Le type est **`flow-order`** | Nomme ce qui est produit — l'ordre du flux — pas la frise, qui est le support |
| `initialOrder` est **écrit par le corpus**, jamais tiré au hasard au chargement | Une partie doit rendre la même trace d'un joueur à l'autre pour que les seuils veuillent dire quelque chose, et le mode rejeu du projet interdit l'aléatoire non semé |
| Le refus « `initialOrder` ne satisfait pas `c2` » est **dans le schéma** | Sans lui, le corpus futur pourrait ouvrir la fuite la plus bête du jeu : ne rien faire et passer. Un garde-fou se mesure, il ne se déclare pas |
| `maxDisplacement` est lu **par étape** | La story l'exige au mot : « une inversion entre deux étapes voisines n'est pas notée comme une inversion de bout en bout ». Une distance globale (Kendall tau, somme des déplacements) confondrait les deux |
| `c1` implique `c2`, et c'est gardé | Contrairement au recouvrement subi de `practice-map`, celui-ci est la gradation demandée : la story veut deux crans, exact et presque juste. Un `c2` qui exclurait `c1` noterait un joueur parfait comme ayant manqué « presque juste », ce qui n'a pas de sens |
| **Aucun chronomètre**, aucune limite de déplacements | Compter les déplacements mesurerait le tâtonnement, pas la lecture du flux. Le verrou est la soumission, comme chez `practice-map` |
| Sept étapes | Six est le plancher du schéma ; sept laisse une marge sans que la frise déborde de l'écran sur mobile |
| `g5-2` vit dans le groupe libellé « Architecture », mais ses deux critères pèsent sur **`pilotage-contexte`**, jamais sur `verification`, `resilience` ni un axe qui porterait le nom du groupe | Le libellé du groupe organise l'écran et la rampe, pas le référentiel : le groupe 5 porte la **signature**, pas les axes de la grille (voir Phase 4). Ce que ce jeu mesure — savoir où se place chaque geste du flux, du cadrage au merge — est la définition même de `pilotage-contexte` ; aucun autre axe de la signature ne mesure l'ordonnancement d'un processus. La revue indépendante (constat « Le groupe s'annonce Architecture… ») a demandé que ce choix soit assumé par écrit plutôt que redécidé |
