---
objective: "Un développeur évalué lit son niveau, l'axe qui l'a plafonné, la preuve derrière chaque axe, sa signature dans un bloc séparé, et l'action vérifiable qui le ferait monter — le tout calculé, jamais rédigé."
status: implemented
---

# Plan: La restitution du verdict

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Rendre le verdict traçable : le niveau et son plafond, la preuve par axe, la signature séparée, le plan de progression |
| **Source** | [`spec.md`](./spec.md) · quatre stories de `aidd_docs/backlog/epics/restitution-du-verdict.md` |

## Phases

| # | Phase | Story | File |
| --- | --- | --- | --- |
| 1 | Le niveau assume ce qu'il ignore, et nomme son plafond | `lire-mon-niveau-et-l-axe-qui-plafonne` | [`phase-1.md`](./phase-1.md) |
| 2 | Chaque axe porte sa preuve et son statut de mesure | `voir-la-preuve-derriere-chaque-axe` | [`phase-2.md`](./phase-2.md) |
| 3 | La signature tient son propre bloc | `lire-ma-signature-a-cote-du-niveau` | [`phase-3.md`](./phase-3.md) |
| 4 | Le plan de progression, écrit dans la grille | `savoir-quelle-action-me-ferait-monter` | [`phase-4.md`](./phase-4.md) |

Les phases sont **séquentielles** : les quatre touchent `summary-view.tsx`, et 2, 3, 4 s'appuient sur les types que 1 déplace.

## Decisions

Tranchées dans [`spec.md`](./spec.md), rappelées ici pour qu'on n'ait pas à y revenir.

| Decision | Why |
| --- | --- |
| **`measured: boolean` devient `measurement: 'measured' \| 'inferred' \| 'unmeasured'`**, déduit d'un champ `evidence` déclaré sur le *mapping* | Un même critère est une mesure pour un axe et une inférence pour un autre — `g2-3-c1` mesure `pilotage-contexte` et infère `harness`. Seul le mapping peut porter la distinction. Lève l'inconnue de l'épique : « Le composant existant ne connaît qu'un booléen ; à trancher avant de l'étendre » |
| **Un axe inféré satisfait les conditions comme un axe mesuré** | Trois des cinq axes du référentiel n'ont aujourd'hui aucun jeu dédié — `scope-break`, `repo-kit` et `task-board` n'existent pas. Les refuser mettrait tout le référentiel hors d'atteinte. L'écran doit le *dire*, pas le déguiser |
| **`resolveLevel` cesse de retomber sur le niveau le plus bas** | Le repli actuel annonce « ❖ White » à un profil qui n'y a pas droit, sur l'écran où le produit tient ou tombe. `level` devient optionnel, `unranked` porte la raison |
| **L'axe qui plafonne se lit sur les conditions non tenues du cran suivant**, `unmeasured` d'abord, puis écart décroissant, puis ordre de la grille | Un axe non mesuré ne s'ouvre par aucune action : il passe devant. Entre deux axes actionnables, celui qui manque le plus est celui à travailler |
| **Le texte des actions vit sur la bande de la grille (`action`, `proof`)**, jamais dans le code | Acceptance explicite de la story 4, et décision de l'épique : « Le plan de progression est une donnée éditable, pas du code » |
| **Le libellé du cran remplace le pourcentage dans la ligne d'axe** | Acceptance de la story 1, et `design.md` : « la triade d'état s'accompagne du libellé du cran (« L — multi-étapes », pas 75 %) » |
| **La signature remonte à côté du niveau, dans son propre cadre** | Story 3 : « deux blocs distincts à l'écran, jamais mélangés ». Sa position actuelle — entre les axes et les critères — la donne pour une note de bas de page |
| **Le défaut « nommer le geste qui a manqué un critère » n'est pas soldé ici** | Il demande d'élargir le port `GameEvaluator`, partagé par huit jeux. La preuve rendue s'arrête au critère et à son poids, ce qui suffit aux quatre acceptances |

## Contradictions levées

| Où | Ce qui devient faux |
| --- | --- |
| `src/features/scoring-summary/components/composites/dimension-row.tsx` | « Le chiffre est l'objet le plus grand de la ligne » — le fichier est remplacé en phase 2 |
| `src/core/scoring/helpers/level-resolver.helper.ts` | Le repli implicite `?? byOrder[0]` — réécrit en phase 1 |
| `src/core/ports/scoring-strategy.interface.ts` | « `measured` distingue une dimension qu'aucun critère ne vise d'une dimension visée mais entièrement ratée » — la distinction reste, elle devient ternaire |
| `aidd_docs/memory/architecture.md` | « Le déclaratif ne monte jamais un niveau » — la règle tient comme intention ; l'écran montre désormais que trois axes montent sur des bancs de jugement. Note ajoutée en phase 2, la dette se solde en construisant les trois jeux manquants |
| `__tests__/unit/core/scoring/level-resolver.test.ts` | « falls back to the lowest level when no condition holds at all » — le repli disparaît, le test devient celui de l'état non classé |

## Validation

À chaque phase : `npm run typecheck` et `npm run test`. Aucune phase n'est close sur du rouge.
