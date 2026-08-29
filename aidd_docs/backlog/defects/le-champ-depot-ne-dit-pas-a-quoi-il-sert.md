---
type: defect
status: ready
related_to:
  - aidd_docs/backlog/epics/onboarding-du-joueur.md
  - aidd_docs/backlog/stories/saisir-son-identite-et-son-depot.md
  - aidd_docs/backlog/epics/preuves-du-depot-git.md
order: 2
---

# Defect: Le champ dépôt ne dit pas à quoi il sert, et le dit à la mauvaise personne

## Context

Écran d'accueil, champ « Votre dépôt (facultatif) », rendu par `src/features/onboarding/components/sections/onboarding-view.tsx:165`, et l'annonce qui l'accompagne, `src/features/onboarding/components/elements/missing-repository-notice.tsx`.

Le défaut apparaît une fois l'accueil devenu honnête sur l'état réel du produit. Il n'a pas été créé par cette honnêteté : il était masqué par un sous-entendu faux, retiré le 29/08/2026.

## Expected

Une personne qui lit le champ comprend pourquoi il existe et ce que le remplir lui apporte, aujourd'hui ou plus tard. Une personne qui saisit un dépôt sait que rien ne le lit encore, puisque c'est elle que le fait concerne.

## Actual

Quatre négations de l'utilité du champ s'enchaînent en une quarantaine de mots, sans qu'aucune affirmation les contrebalance : « facultatif » dans l'intitulé, « Rien n'est vérifié à cet instant » dans l'aide, « Aucun dépôt n'est lu pour l'instant » et « dépôt ou pas » dans l'annonce.

Et la seule information qui concerne vraiment celui qui remplit le champ — que sa saisie n'est lue par rien — ne s'affiche que **tant que le champ est vide**. La personne qui vient de taper `alice/atelier` est la seule à qui on ne le dit pas.

## Reproduction

1. Ouvrir l'application sans partie enregistrée. Lire le champ dépôt et l'annonce sous lui.
2. Saisir `alice/atelier`. L'annonce disparaît, et avec elle la seule phrase qui parlait de ce que devient la saisie.

## Impact

Le champ demande une information sans donner de raison de la fournir. Pour une personne « un peu sur la défensive », décrite comme telle par le brief de surface, désigner son dépôt est déjà un pas ; un pas sans contrepartie énoncée ne se franchit pas.

La règle d'affichage est restée celle d'une annonce sur le dépôt manquant — c'est encore le nom du composant — pendant que son texte devenait un fait sur le produit. Un fait sur le produit n'a pas de raison de se cacher de la moitié des lecteurs.

## Evidence

- `src/features/onboarding/components/sections/onboarding-view.tsx:187` — l'annonce est conditionnée à `field.state.value.trim() === ''`, règle héritée de `comprendre-le-cout-de-l-absence-de-depot.md`, dont c'était une ligne d'acceptation quand le texte parlait du dépôt manquant.
- `src/core/session/game-session.facade.ts` — la documentation de `designatedRepository()` le dit déjà : « `getVerdict()` ne le lit pas, et aucun niveau n'en dépend ».
- Aucune occurrence de `repository` dans `src/core/scoring/`, `src/core/entities/evaluation-result.entity.ts` ni `src/features/scoring-summary/`.
- `aidd_docs/backlog/epics/onboarding-du-joueur.md` — le vrai motif y est écrit, jamais à l'écran : « le champ collecte pour l'Epic `preuves-du-depot-git.md`, qui l'exploitera ».
- `.impeccable/surfaces/onboarding-components-sections-onboarding-view-tsx.md` — « The declarative fields beyond the pseudonym. Each must earn its place […] one that does not, goes. »

## Verification

Le champ énonce ce qu'il sert, en une affirmation et non en creux. La phrase qui dit qu'aucun dépôt n'est lu se lit aussi bien le champ rempli que le champ vide.

Deux issues possibles, et le choix est une décision produit qui n'appartient pas à ce défaut : dire à quoi la saisie servira, ou retirer le champ jusqu'à ce que l'Epic `preuves-du-depot-git.md` l'exploite. La seconde est explicitement autorisée par le brief de surface.

Un test couvre la nouvelle règle d'affichage, dans les deux états du champ.
