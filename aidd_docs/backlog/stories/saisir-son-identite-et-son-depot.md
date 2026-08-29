---
type: story
status: ready
parent: aidd_docs/backlog/epics/onboarding-du-joueur.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
related_to:
  - aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md
order: 1
---

# Story: Saisir mon identité et mon dépôt

**As** un développeur évalué
**I want** me nommer et désigner mon dépôt avant de commencer
**So that** l'outil sache qui il évalue et sur quelles preuves il pourra s'appuyer

## Acceptance

- Le pseudo est requis, entre 2 et 40 caractères, et son message d'erreur est en français.
- Le dépôt est facultatif : on entre dans le parcours sans en donner.
- Le champ accepte une URL GitHub complète ou la forme `proprietaire/depot`, et retient la seconde.
- Une saisie d'une autre forme est refusée à l'entrée, avec un message qui donne la forme attendue.
- La saisie n'est pas confrontée à GitHub ici : entrer dans le parcours n'attend aucun réseau.
- Rien de ce qui est saisi ici n'entre dans un score.
- La saisie est conservée et reste visible pendant toute la partie.
