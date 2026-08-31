---
objective: "Les trois derniers axes du référentiel cessent de monter sur des bancs de jugement : `scope-break`, `repo-kit` et `task-board` mettent le joueur en situation et mesurent ce qu'il a réussi à livrer."
status: draft
---

# Plan: Les trois jeux qui manquent au septième groupe

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Solder la dette rendue visible par la restitution : `taille`, `harness` et `initiative` passent de `inféré` à `mesuré` |
| **Source** | `aidd_docs/backlog/stories/decouper-une-feature-en-lots.md` · `equiper-le-depot-avant-les-vagues.md` · `confier-une-tache-en-autonomie.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` |
| **Dette** | `aidd_docs/memory/architecture.md`, note ajoutée le 31/08 : trois axes montent sur des bancs faute de ces jeux |

## Phases

| # | Phase | Jeu | Axe | File |
| --- | --- | --- | --- | --- |
| 1 | Découper une feature en lots | `scope-break` | `taille` | [`phase-1.md`](./phase-1.md) |
| 2 | Équiper le dépôt avant les vagues | `repo-kit` | `harness` | [`phase-2.md`](./phase-2.md) |
| 3 | Confier une tâche en autonomie | `task-board` | `initiative` | [`phase-3.md`](./phase-3.md) |
| 4 | Le câblage et la bascule de la grille | — | — | [`phase-4.md`](./phase-4.md) |

Les phases 1 à 3 sont **indépendantes** : chaque jeu vit dans son dossier. La phase 4 les câble ensemble et bascule `config/course.json` — elle vient après les trois.

## Decisions

| Decision | Why |
| --- | --- |
| **Chaque jeu a sa propre surface visuelle. Aucun n'est le gabarit d'un autre** | Les huit jeux livrés ont chacun leur passe. Un neuvième qui recopierait la mise en page d'un autre se verrait immédiatement, et c'est exactement ce qu'un jury regarde. Les trois sont écrits en parallèle : la consigne doit être portée par chaque phase, pas supposée |
| **Le joueur agit, il ne se déclare jamais** | Contrainte du brainstorm et raison d'être de ces trois jeux. Un banc de jugement — « retenez les propositions vraies » — est précisément ce qu'ils remplacent. Chacun dépense une ressource rare et la simulation répond |
| **On mesure ce qui a été livré, pas ce qui a été tenté** | Chaque jeu porte son garde-fou : un lot géant qui revient cassé ne fait pas un profil XL, tout confier en autonomie fait exploser le tableau, acheter le hook ne vaut pas la boucle |
| **Chaque évaluateur remplit `attributions` dès l'écriture** | Le port le porte depuis le 31/08. Écrire un neuvième évaluateur qui jette son détail rouvrirait le défaut qu'on vient de fermer |
| **Les seuils de critère vivent dans `config/course.json`, jamais dans le code** | Règle en place pour les huit jeux livrés : la `rule` d'un critère est déclarative, le helper de lecture ne connaît aucun seuil de notation |
| **La bascule de `config/course.json` se fait en une seule phase, à la fin** | Les trois jeux écrivent chacun leur dossier ; trois agents qui éditeraient le même JSON et les deux fichiers de registre entreraient en collision. Le câblage est un travail à part, fait une fois |

## Ce que ça change au verdict

Après la phase 4, les mappings de `g7-3`, `g7-4` et `g7-5` passent de `inferred` à `measured` : `taille`, `harness` et `initiative` s'affichent `mesuré`.

**`resilience` reste `inféré`** et cette livraison ne l'adresse pas : le groupe 3 est composé de trois `test-bench`, et aucun jeu réel n'est prévu pour lui dans le brainstorm. C'est une dette distincte, à ouvrir séparément.

## Validation

À chaque phase : `npm run typecheck`, `npm run test`, `biome check`. Aucune phase close sur du rouge.
