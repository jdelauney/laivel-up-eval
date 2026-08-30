---
type: defect
status: ready
related_to:
  - aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
  - aidd_docs/backlog/defects/la-revelation-pousse-l-action-hors-de-l-ecran.md
order: 3
---

# Defect: L'ouverture d'une situation de `hint-budget` pousse le tranchage hors de l'écran

## Context

`hint-budget` (`g2-1`), `src/games/hint-budget/components/composites/hint-budget-game.tsx`. Une situation ouvre sur quatre blocs empilés : le rapport, la paire cadrage/marché, puis les cinq causes candidates — le geste de trancher.

Relevé pendant la tournée navigateur du 30/08 (`aidd_docs/tasks/2026_08/2026_08_30_jeu-hint-budget/qa/README.md`), aux deux gabarits, en pages pleines mesurées à `scrollY = 0` vérifié.

## Ce que ce défaut n'est pas

`aidd_docs/backlog/defects/la-revelation-pousse-l-action-hors-de-l-ecran.md` couvre un défaut voisin mais distinct : chez `lie-detector` et `defect-hunt`, c'est l'**état de révélation** qui pousse l'**action de passage** hors de l'écran. Ici, c'est l'**ouverture** de la situation — avant tout achat, avant tout cadrage — qui pousse le **tranchage**, le geste que `g2-1-c1` note (`frugal-solves-at-least` lit `solved`), hors de l'écran. Deux moments différents, deux gestes différents ; le ticket existant ne cite pas `hint-budget` et son Impact s'appuie explicitly sur le fait qu'aucun critère ne dépend du geste retardé, ce qui ne vaut pas ici sans nuance : `trancher` est bien celui que `c1` observe (indirectement, via `solved`), même si sa position à l'écran ne change rien à son verdict une fois posé.

## Expected

`DESIGN.md`, section « La surface d'un jeu » : la densité d'un écran ne doit pas retarder le geste central au point de le rendre introuvable sans exploration.

## Actual

Mesuré à l'ouverture de `s1`, page pleine, `scrollY = 0` vérifié :

| Gabarit | Sommet du panneau des causes | Hauteur de viewport | Dépassement |
| --- | --- | --- | --- |
| Desktop 1440×900 | 1177px | 900px | **277px** |
| Mobile 390×844 | 1741px | 844px | **897px** |

Le panneau des causes — l'unique action primaire de l'écran — n'est visible à l'ouverture d'aucun des deux gabarits sans défiler. Sur mobile, il faut plus d'un écran de défilement rien que pour l'atteindre.

## Reproduction

1. Ouvrir le parcours, atteindre le groupe « Pilotage du contexte ».
2. Ouvrir `g2-1`, une situation quelconque.
3. Chercher le panneau des causes sans faire défiler.

## Impact

Un joueur qui ouvre une situation ne voit ni les causes, ni le geste qui les tranche, sans défiler d'abord — sur mobile, largement plus d'un écran de défilement. Contrairement au défaut de révélation, où le joueur a déjà lu ce qu'il lui reste à faire, ici rien à l'écran n'indique qu'un geste de tranchage attend en dessous avant que le joueur n'ait lu le rapport, le cadrage et le marché.

Le verdict n'est pas faussé : aucun critère ne lit la position d'un bouton, seulement s'il a été cliqué et quand (`afterHints`). Ce n'est donc pas un défaut de mesure, mais le même principe transverse que le ticket voisin enfreint sous une autre forme : un écran dense retarde le geste qu'il doit provoquer.

## Ce que la correction ne doit pas être

Un raccourci propre à ce seul jeu (bouton flottant, barre d'action collante) qui introduirait un motif d'interface que le reste du parcours ne porte pas. La phase 5 de `hint-budget` a déjà tranché que la densité du corpus (rapport + deux colonnes + trois causes) est un plancher fixé en phase 4, que la passe de surface ne peut pas réduire sans rouvrir le corpus — ce défaut est donc reporté au même titre que son voisin, pas corrigé localement dans cette branche.

## Evidence

- `aidd_docs/tasks/2026_08/2026_08_30_jeu-hint-budget/qa/README.md` — mesures et captures en page pleine, aux deux gabarits.
- `aidd_docs/tasks/2026_08/2026_08_30_jeu-hint-budget/phase-5.md` — le constat consigné, décoché.
