---
type: defect
status: ready
related_to:
  - aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
order: 2
---

# Defect: La révélation d'une manche pousse son action hors de l'écran

## Context

Deux jeux du groupe 1, au moment de leur révélation — l'état terminal où le joueur lit ce qu'il vient de jouer avant de passer à la suite.

- `lie-detector` (`g1-3`), `src/games/lie-detector/components/composites/lie-detector-game.tsx` : la révélation déplie les quatre vérifications d'une manche, puis l'action « Manche suivante ».
- `defect-hunt` (`g1-2`), `src/games/defect-hunt/components/composites/defect-hunt-game.tsx:90-114` : même structure — la liste des défauts révélés, puis l'action de passage.

Relevé pendant la tournée navigateur de `lie-detector`, aux deux gabarits. Le défaut est antérieur à ce jeu : il est arrivé avec `defect-hunt` et n'avait pas été vu par sa propre tournée.

## Expected

`DESIGN.md`, section « La surface d'un jeu » : « Un relevé qui s'allonge ne pousse jamais la décision courante hors de l'écran. Un journal, une pile de tours, une liste de choix passés se plafonne et se replie. Sans ça, le dernier tour d'une partie longue oblige à faire défiler pour agir. »

L'action de passage reste atteignable sans défiler, quelle que soit la longueur de ce que la révélation déplie.

## Actual

L'action passe sous la ligne de flottaison dès que la révélation est ouverte.

| Gabarit | Dépassement sur `lie-detector`, manche `r1` |
| --- | --- |
| 390 × 844 | **597 px**, mesuré à `scrollY = 0` vérifié |
| 1440 × 900 | 383 px, **mesure à refaire** — prise au repère contaminé, cf. ci-dessous |

**Les premiers chiffres étaient faux, et de beaucoup.** La tournée annonçait 185 px sur mobile. Le navigateur piloté fait défiler la page pour amener un bouton hors écran dans sa zone cliquable avant de le cliquer, et ce décalage survivait au passage de manche puisque l'application ne recharge jamais. Toutes les lectures étaient donc courtes de l'offset accumulé. Reprise au bon repère, la mesure mobile est plus de trois fois pire.

## Reproduction

1. Ouvrir le parcours, atteindre le groupe « Jugement critique ».
2. Jouer une manche de `g1-3` jusqu'à sa révélation, ou rendre la revue de `g1-2`.
3. Chercher l'action de passage sans faire défiler.

## Impact

**Relevé après correction de la mesure.** Le premier triage disait « modéré » sur la foi de 185 px, soit un cinquième d'écran. Le chiffre réel est 597 px sur mobile : sept dixièmes d'une hauteur d'écran séparent la fin de la lecture de l'action qui la clôt. Ce n'est plus une gêne de défilement, c'est une sortie hors champ.

Ce qui ne change pas : **le verdict n'est pas faussé.** Le joueur lit avant d'agir, aucun critère ne dépend de la position du bouton, et rien ne se perd s'il défile. C'est la règle du produit qui est enfreinte, pas la mesure. Le report en backlog plutôt qu'une correction dans la branche du jeu tient donc toujours, pour la raison énoncée plus bas : la correction ne peut pas être locale à un jeu.

Ce qui change : sur mobile, rien à l'écran n'indique qu'une action attend en dessous. Un joueur qui a fini de lire ses quatre vérifications peut raisonnablement croire la manche terminée et chercher ailleurs comment continuer. C'est le premier écran du produit où la sortie est réellement introuvable sans geste exploratoire, et c'est ce qui justifie de ne pas le laisser dormir.

La règle existe précisément pour ça : une liste qui s'allonge finit par cacher la sortie. Les deux jeux concernés ont une révélation de taille bornée aujourd'hui ; un corpus plus fourni l'allonge sans que rien n'alerte.

## Ce que la correction ne doit pas être

Un traitement dans un seul des deux jeux. La structure est identique chez les deux, et `aidd_docs/tasks/2026_08/2026_08_30_jeu-lie-detector/qa/README.md` établit qu'il s'agit du même motif, pas de deux défauts qui se ressemblent. Une barre d'action collante posée pour un seul jeu introduirait un motif d'interface que le produit n'a nulle part ailleurs.

## Evidence

- `aidd_docs/tasks/2026_08/2026_08_30_jeu-lie-detector/qa/README.md` — les mesures et leurs captures, aux deux gabarits.
- `DESIGN.md`, « La surface d'un jeu » — la règle enfreinte, énoncée pour les vingt jeux.
