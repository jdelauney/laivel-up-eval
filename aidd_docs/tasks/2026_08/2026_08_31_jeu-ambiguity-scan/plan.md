---
objective: "Le jeu ambiguity-scan se joue de bout en bout à la place du placeholder g6-2, mesure sur la dimension pilotage-contexte si le joueur voit l'ambiguïté d'un prompt avant qu'une IA ne l'exploite, et ne fait bouger aucun contrat existant."
status: draft
---

# Plan: Le jeu `ambiguity-scan`, repérer ce qui est ambigu dans un prompt

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Mesurer si un joueur repère les segments d'un prompt qui laissent une marge d'interprétation, sans lui dire lesquels et sans qu'un surlignage total ne tienne le critère |
| **Source** | `aidd_docs/backlog/stories/reperer-les-segments-ambigus.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` · `config/signature.json` · `DESIGN.md` |
| **Slot** | `g6-2` du groupe 6 « Qualité du prompt », aujourd'hui un `test-bench` |

Ce plan est **volontairement court** : le gabarit structurel des huit jeux déjà livrés fait autorité, il n'est pas re-décrit ici. Les phases disent ce qui est propre à ce jeu.

## Phases

### Phase 1 — Les contrats et la lecture pure

`src/games/ambiguity-scan/schema/config.schema.ts`, `schema/answer.schema.ts`, `helpers/read-flags.helper.ts`.

Configuration : `statement`, `promptTitle`, `segments[]` (`id`, `text`, `ambiguous: boolean`, `reading: string` — la seconde lecture possible, montrée **à la révélation seulement**), `threshold` porté par les règles du parcours et non par la config.

Trace : `flaggedIds: string[]`, plus `parseAmbiguityScanTrace(answer, config)` qui refuse un identifiant inconnu et un identifiant en double. Aucun champ dérivé dans la trace : le compte de justes et de faux positifs se recalcule dans le helper.

`readFlags` rend `{ ambiguousCount, clearCount, hitCount, falsePositiveCount, netHits }` avec `netHits = hitCount - falsePositiveCount`.

**Garde-fous portés par le schéma, en refus au chargement** — jamais par une consigne au corpus :

- au moins trois segments ambigus et au moins autant de segments clairs que d'ambigus, `clearCount >= ambiguousCount` : c'est ce refus qui rend « tout surligner » mécaniquement perdant, `netHits <= 0` ;
- identifiants uniques ;
- `reading` obligatoire sur un segment ambigu, **interdit** sur un segment clair — un champ présent d'un seul côté serait une fuite si l'écran le rendait par erreur ;
- au moins six segments au total.

### Phase 2 — L'évaluateur et ses deux règles

`src/games/ambiguity-scan/ambiguity-scan.evaluator.ts`, règles déclaratives sur le modèle de `practice-map.evaluator.ts`.

| Règle | Lit | Question du parcours |
| --- | --- | --- |
| `ambiguity-net-share-at-least` `{threshold}` | `netHits / ambiguousCount >= threshold` | « La part des segments ambigus réellement repérés dépasse-t-elle le seuil ? » |
| `clear-segments-spared-at-least` `{threshold}` | `(clearCount - falsePositiveCount) / clearCount >= threshold` | « Les segments clairs ont-ils été laissés tranquilles ? » |

Les deux règles lisent deux choses différentes, et aucune ne lit ce que lit l'autre : la première la couverture nette, la seconde la retenue. Surligner tout tient la seconde à `0` et la première à `<= 0`. Ne rien surligner tient la seconde à `1` et la première à `0`.

### Phase 3 — Le jeu à l'écran

`components/composites/ambiguity-scan-game.tsx`, `composites/prompt-body.tsx`, `elements/segment-toggle.tsx`, `hooks/use-ambiguity-scan.hook.ts`.

Le prompt s'affiche en un bloc continu ; chaque segment est un `button` inline, `aria-pressed`, qui bascule le signalement. Rien ne distingue un segment ambigu d'un segment clair avant la révélation : même fonte, même fond, seul l'état signalé/non signalé se voit. Un compteur dit combien de segments sont signalés, jamais combien il en reste à trouver.

Deux temps, comme `practice-map` : `'scanning'` puis `'revealed'`. La révélation liste **les segments ambigus et leur seconde lecture** — jamais un verdict sur le joueur, jamais son score. Bouton « Continuer » qui appelle `onSubmit` une seule fois (`submittedRef`).

Soumission possible dès un segment signalé, et **jamais** avec zéro : sans quoi le joueur tient `c2` en ne jouant pas.

### Phase 4 — Le jeu dans le parcours

- `src/games/register-games.ts` et `src/games/register-components.ts` : un bloc chacun.
- `config/course.json` : `g6-2` passe de `test-bench` à `ambiguity-scan`, avec un corpus de **neuf segments** dont **quatre ambigus** — un prompt de commande de feature réaliste, écrit en français, où les quatre ambiguïtés sont des choses qu'une IA tranchera seule si on ne les tranche pas.
- Deux critères, pesés **2** et **1**, tous deux sur `pilotage-contexte` en `measured`. Le mapping `harness` du placeholder disparaît : les six premiers groupes portent la signature, seul le septième porte les axes du référentiel.
- Seuils : `0.5` pour `c1` (deux ambiguïtés nettes sur quatre), `0.8` pour `c2` (au plus un faux positif sur cinq segments clairs).

### Phase 5 — Les tests

`__tests__/unit/games/ambiguity-scan/` : `config.schema.test.ts` (chaque refus), `answer.schema.test.ts`, `read-flags.test.ts`, `evaluator.test.ts`, `use-ambiguity-scan.test.ts`, `ambiguity-scan-game.test.tsx`.

**Passage en force brute obligatoire** — la leçon de `lie-detector` inscrite dans `BUILD-ORDER.md` : l'espace des traces vaut `2^9 = 512` sous-ensembles pour le corpus réel. Un test parcourt les 512 et vérifie, sur la configuration **du parcours** et non sur un fixture :

- aucune trace qui signale tous les segments ne tient `c1` ;
- aucune trace qui ne signale rien ne tient `c1` ;
- la trace parfaite (les quatre ambigus, rien d'autre) tient les deux critères ;
- la part de traces au hasard qui tiennent `c1` **et** `c2` reste sous 10 %.

## Decisions

| Decision | Why |
| --- | --- |
| Le type est **`ambiguity-scan`** | Nomme ce que le joueur produit — une lecture de l'ambiguïté — pas le geste de surligner |
| Le garde-fou « tout surligner ne passe pas » vit dans la **règle** (`netHits`) **et** dans le **schéma** (`clearCount >= ambiguousCount`), pas dans une note au corpus | Deux tours de revue sur `hint-budget` ont montré qu'une consigne d'écriture ne borne rien. Ici l'exploit est rendu inexprimable quel que soit le corpus futur |
| **Aucun chronomètre** | La story ne le demande pas, et `hint-budget` a déjà tranché : deux ressources rares en concurrence mesurent laquelle le joueur préfère |
| La révélation donne la **seconde lecture** d'un segment ambigu, jamais le verdict du joueur | Un jeu déjà soumis peut être rejoué : afficher la correction ferait du second passage une recopie. Choix identique à `practice-map` et `hint-budget` |
| Le seuil `c1` à `0.5` et non plus haut | Quatre ambiguïtés seulement : à `0.75`, un seul faux positif fait tomber le critère malgré une lecture correcte, et le critère mesurerait la retenue — ce que `c2` mesure déjà |
