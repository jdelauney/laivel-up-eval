---
type: story
status: ready
parent: aidd_docs/backlog/epics/onboarding-du-joueur.md
source: aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md
order: 4
---

# Story: Savoir en jouant que mon dépôt n'est pas lisible

**As** un développeur évalué
**I want** savoir pendant le parcours que le dépôt que j'ai désigné n'est pas lisible
**So that** je sache à quoi m'attendre au verdict au lieu de le découvrir à la fin

## Acceptance

- Après l'entrée dans le parcours, la lisibilité du dépôt désigné est vérifiée sans que le joueur ait à attendre.
- Un dépôt illisible déclenche un avertissement pendant le parcours, et pas seulement sur l'écran de verdict.
- L'avertissement dit que le dépôt n'est pas lisible sans prétendre dire pourquoi : un dépôt privé et un dépôt inexistant sont indiscernables sans jeton.
- Il rappelle la conséquence : le verdict sera plafonné comme si aucun dépôt n'avait été désigné.
- Il n'ouvre aucune correction. Le dépôt désigné ne change pas en cours de partie, et l'avertissement ne le laisse pas croire.
- Un dépôt lisible ne produit aucun message.
- Une panne de réseau ne se présente pas comme un dépôt illisible.
