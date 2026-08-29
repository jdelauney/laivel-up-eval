---
type: story
status: proposed
parent: aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
order: 19
---

# Story: Découper une feature en lots que je confierais d'un coup

**As** un développeur évalué
**I want** regrouper des tranches atomiques en lots, puis voir chaque lot exécuté
**So that** on mesure la taille que je livre réellement, pas celle que je tente

## Acceptance

- Les tranches arrivent avec leurs dépendances, et un lot qui les viole échoue sèchement.
- Un lot trop gros revient cassé et coûte des passes de réparation ; un lot minuscule en gaspille.
- Le cran retenu vient du lot médian livré sans réparation, jamais du lot le plus gros tenté.
- Le critère « feature entière livrée dans le budget de passes » ressort satisfait ou manqué.
