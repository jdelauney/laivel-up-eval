---
type: story
status: done
parent: aidd_docs/backlog/epics/deroule-du-parcours.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
order: 2
---

# Story: Retrouver ma place après un rechargement

**As** un développeur évalué
**I want** reprendre exactement où j'en étais quand je recharge la page
**So that** une fermeture d'onglet ne me fasse pas abandonner une partie longue

## Acceptance

- Un rechargement en plein parcours ramène au jeu courant, pas au début du groupe ni du parcours.
- La position vient de l'état persisté, jamais de l'URL : aucun écran n'est adressable par lien.
- Les réponses déjà soumises restent soumises après le rechargement.
