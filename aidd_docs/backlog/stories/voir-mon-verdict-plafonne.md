---
type: story
status: proposed
parent: aidd_docs/backlog/epics/preuves-du-depot-git.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
order: 3
---

# Story: Voir mon verdict plafonné plutôt que faux

**As** un développeur évalué
**I want** savoir quand un axe n'a pas pu être mesuré et ce que ça empêche d'annoncer
**So that** l'outil assume ce qu'il ignore au lieu de me donner un niveau inventé

## Acceptance

- Chaque axe porte un statut : mesuré, inféré, ou non mesuré.
- Un axe non mesuré pose un plafond de niveau annonçable, et son score n'est pas zéro.
- Le plafond est énoncé en clair avec l'axe qui le cause et ce qui le lèverait.
- L'axe d'intervention reste non mesuré tant que rien ne prouve qu'un assistant est à l'œuvre.
