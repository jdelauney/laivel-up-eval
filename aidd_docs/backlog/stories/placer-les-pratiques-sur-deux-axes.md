---
type: story
status: in-progress
parent: aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
order: 7
---

# Story: Situer des pratiques sur les axes intensité et rigueur

**As** un développeur évalué
**I want** placer chaque pratique sur une matrice à deux axes plutôt que dans une case
**So that** on mesure si ma lecture des pratiques tient debout et reste cohérente avec le reste du parcours

## Acceptance

- Chaque pratique se pose n'importe où sur la matrice, sans case prédéfinie.
- Le critère « au moins une pratique placée en quadrant haute rigueur » ressort satisfait ou manqué.
- La cohérence du placement avec les autres jeux du parcours est évaluée, pas seulement le placement seul.

> **Ce que « cohérence avec les autres jeux » veut dire ici.** Tranché le 30/08 avant construction. Le port `GameEvaluator` ne passe à un jeu que sa propre réponse, sa config et ses critères ; aucun evaluator ne voit la trace des autres, et c'est une décision d'architecture consignée. Une lecture littérale du critère — comparer le placement déclaré aux comportements observés ailleurs — obligerait à élargir le port pour un seul jeu, et resterait fragile : ce jeu est en groupe 2, `checkpoints` et `three-tracks` en groupe 7, donc pas encore joués au moment du verdict. Le critère sortirait « non mesuré » pour la plupart des joueurs.
>
> Retenu : les pratiques posées sur la matrice **sont** les sujets des autres jeux du parcours — reprendre la main, déléguer, découper, vérifier, outiller. La cohérence se mesure donc **dans le jeu seul**, sur des relations d'ordre déclarées en configuration : une pratique doit être placée plus rigoureuse, ou plus intense, qu'une autre. Le joueur qui les inverse a une lecture des pratiques qui ne tient pas debout, et le critère le dit. Aucun changement d'architecture, aucune dépendance à l'ordre de jeu, vérifiable à froid.
