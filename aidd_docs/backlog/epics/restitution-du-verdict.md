---
type: epic
status: done
goal: aidd_docs/product/laivel-eval.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
depends_on:
  - aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
order: 5
---

# Epic: La personne comprend son niveau et sait quoi faire ensuite

À la fin du parcours, la personne lit son niveau, l'axe qui l'a plafonnée, ce qui a produit chaque cran, ce qui n'a pas pu être mesuré, et l'action concrète qui la ferait monter.

## Context and Value

C'est là que le produit tient ou tombe. Un niveau rendu sans justification qu'une personne reconnaît a échoué, et deux des quatre critères du jury portent directement ici : est-ce que ça tombe juste, et est-ce qu'on comprend pourquoi.

La personne arrive sur cet écran sur la défensive. Ce qui la fera accepter le verdict n'est pas le score mais la traçabilité : par axe, le cran atteint, le signal qui l'a fixé, la valeur observée, le seuil franchi ou manqué. Un chiffre seul se conteste ; « L — multi-étapes, parce que votre lot médian livré tenait cinq tranches » se discute.

Deux lectures cohabitent sans se mélanger : le niveau officiel, qui décide, et la signature, qui distingue deux personnes classées pareil sans jamais déplacer leur niveau.

L'écran de résumé existe et affiche des dimensions ; il ne porte ni la confiance, ni la progression, ni les preuves.

## Boundaries

- Includes : le niveau et l'axe qui l'a plafonné, la justification par axe, le statut de mesure, la signature, et le plan de progression.
- Includes : le cas où aucun niveau ne peut être annoncé, dit en clair avec sa raison.
- Excludes : la rédaction du verdict par un modèle. L'assistant narratif viendra par-dessus un texte déjà produit par gabarits.
- Excludes : l'export en fichier, qui appartient à la sauvegarde.
- Excludes : tout classement, tout palmarès, toute comparaison à d'autres joueurs.

## Success Evidence

Une personne lit son verdict et y reconnaît sa pratique sans qu'on le lui explique. Elle sait nommer l'action qui la ferait monter, et comment elle saura qu'elle l'a faite. Une personne dont un axe n'a pas été mesuré comprend pourquoi, et ce qu'elle pourrait fournir pour le lever.

## Dependencies and Unknowns

| Item | Kind | Handling |
| --- | --- | --- |
| Le verdict est calculé, jamais rédigé par un modèle | décision | Contrainte du jury |
| Le niveau et la signature restent séparés jusque dans l'écran | décision | La signature ne décide aucun niveau |
| Le plan de progression est une donnée éditable, pas du code | décision | Porté par la grille, modifiable sans toucher au produit |
| Un axe `inféré` doit se distinguer d'un axe `mesuré` à l'écran | unknown | Le composant existant ne connaît qu'un booléen ; à trancher avant de l'étendre |
| Une personne accepte un verdict qui la situe plus bas qu'elle ne se croit | assumption | Acceptée ; aucun utilisateur réel n'a joué |
