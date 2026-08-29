---
type: epic
status: proposed
goal: aidd_docs/product/laivel-eval.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
order: 2
---

# Epic: Les mises en situation mesurent les cinq axes et les trois dimensions de rigueur

Le parcours contient assez de jeux, répartis sur sept groupes, pour qu'un joueur produise des preuves sur chacun des cinq axes du référentiel et sur les trois dimensions de la signature.

## Context and Value

C'est le cœur du produit et la matière du critère « on comprend pourquoi ». Aujourd'hui le parcours porte un seul jeu, un banc d'essai dont les deux critères pèsent à plat sur tous les axes : il valide le moteur, il ne mesure personne. Deux joueurs différents en sortent au même endroit.

Chaque jeu applique la même règle : le joueur dépense une ressource rare, la simulation répond, des critères mécaniques lisent le résultat. Ce qui est mesuré est ce qu'il a réussi à livrer, jamais ce qu'il a tenté ni ce qu'il déclare.

Six groupes portent le manifeste AI-Driven Development et alimentent la signature. Un septième porte les axes officiels, et il n'est pas optionnel : tout niveau à partir de Red exige `intervention` et `parallele`, que rien d'autre n'atteint.

## Boundaries

- Includes : les jeux des sept groupes, leur configuration en données, et le rattachement de leurs critères aux dimensions.
- Includes : les garde-fous anti-triche propres à chaque jeu, sans lesquels un joueur monte son niveau en jouant le système plutôt que la situation.
- Excludes : l'enchaînement des groupes et la progression, qui appartiennent au déroulé.
- Excludes : la restitution du verdict.
- Excludes : toute question portant sur la pratique déclarée du joueur.
- Excludes : tout appel à un modèle pendant une partie. Les dialogues à personas sont des arbres écrits à l'avance.

## Success Evidence

Deux joueurs de pratiques opposées qui font le même parcours en ressortent avec des scores d'axes différents, et l'écart s'explique par les critères qu'ils ont satisfaits ou manqués. Un joueur qui tente de tricher un jeu — un lot géant, une délégation totale, quatre chantiers ouverts puis abandonnés — n'obtient pas un cran supérieur.

## Dependencies and Unknowns

| Item | Kind | Handling |
| --- | --- | --- |
| Le catalogue des quatorze jeux et de leurs critères | décision | Arrêté le 29/08, consigné dans la source |
| Les deux jeux qui débloquent le verdict passent avant tout autre | décision | Sans `intervention` ni `parallele`, aucun niveau n'est annonçable |
| Les cinq jeux du septième groupe portent un état qui évolue, contrairement à tous les autres | unknown | Le premier construit sert de gabarit aux quatre suivants |
| Les seuils de chaque critère | unknown | Se calent au jugé et au test manuel ; rien ne les vérifie à froid |
| Un parcours de quelques minutes révèle une pratique habituelle | assumption | Acceptée ; c'est le pari central du produit |
| Quatorze jeux tiennent dans le temps restant | assumption | Acceptée ; l'ordre de coupe reste ouvert |
