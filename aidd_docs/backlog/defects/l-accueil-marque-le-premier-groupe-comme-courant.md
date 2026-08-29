---
type: defect
status: ready
related_to:
  - aidd_docs/backlog/epics/onboarding-du-joueur.md
order: 1
---

# Defect: Au repos, l'accueil marque le premier groupe comme courant

## Context

Écran d'accueil, avant tout démarrage de partie. La rampe des groupes est rendue par `src/features/onboarding/components/sections/onboarding-view.tsx:36`. Le défaut se produit aussi bien à la première visite qu'au retour avec une partie enregistrée.

Le parcours n'est pas concerné : il passe déjà sa position réelle, dans `src/features/group-navigation/hooks/use-course.hook.ts:19`.

## Expected

Au repos, les sept groupes sont tous `pending` : filet en pointillés, libellé en demi-teinte, aucun anneau. La rampe donne la forme de ce qui va être mesuré, pas une position dans le parcours.

## Actual

Le groupe 1 « Jugement critique » est rendu `current` : pavé plein `bg-group-1`, anneau `ring-2 ring-plane-foreground`, libellé en `font-semibold`. Les six autres restent `pending`. L'écran affiche donc une progression entamée alors que le joueur n'a pas encore saisi son nom.

## Reproduction

1. Ouvrir l'application sans partie enregistrée.
2. Regarder la rampe des groupes, colonne de gauche.

Le premier onglet porte l'anneau et le libellé gras.

## Impact

Le seul rôle de la rampe sur cet écran est de donner la forme du parcours avant la première question. Un groupe marqué courant convertit cette lecture en lecture de progression, et suggère qu'une partie est déjà commencée. C'est précisément la confusion que l'accueil doit lever pour une personne qui arrive déjà sur la défensive.

## Evidence

- `src/features/onboarding/hooks/use-onboarding.hook.ts:20` — `buildRail(facade.courseShape(), 0)` : l'index courant est un littéral, sans condition.
- `src/components/group-rail/helpers/build-rail.helper.ts:16-21` — le helper ne connaît que `done`, `current` et `pending` ; `index === currentIndex` rend `current`. Aucun état « non démarré ».
- `src/components/group-rail/composites/group-rail.tsx:68` et `:73-77` — le rendu `current` ajoute l'anneau et le gras.
- `src/components/group-rail/helpers/build-rail.helper.ts:3-7` — le commentaire déclare le défaut résolu : « l'accueil marquait toujours le premier comme courant ». La factorisation dans le helper a bien eu lieu, l'appelant est resté sur `0`.
- `.impeccable/surfaces/onboarding-components-sections-onboarding-view-tsx.md` — « The tab rail at rest: […] every one still pending ».
- Aucun test ne couvre la rampe aujourd'hui.

## Verification

Sur l'accueil, sans partie enregistrée puis avec une partie enregistrée, aucun onglet ne porte l'anneau ni le libellé gras : les sept sont en filet pointillé. Après « Commencer l'évaluation », le groupe 1 passe courant.

Un test couvre les deux états de la rampe, au repos et en parcours. Sans lui, la régression déjà survenue une fois reste ouverte.
