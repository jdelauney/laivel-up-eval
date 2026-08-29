---
type: epic
status: proposed
goal: aidd_docs/product/laivel-eval.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
order: 1
---

# Epic: Une personne entre dans l'évaluation avec ce qu'il faut pour l'évaluer

Une personne ouvre l'outil, se nomme, désigne son dépôt si elle en a un, et entre dans le parcours ; si elle est déjà venue, elle reprend là où elle s'était arrêtée.

## Context and Value

Le développeur évalué arrive seul, volontairement, un peu sur la défensive. La porte d'entrée décide de deux choses : ce que l'outil pourra mesurer, et si la personne ira au bout.

Ce que l'outil pourra mesurer, parce que le dépôt saisi ici est la seule source des axes d'habitude — sans lui, aucun niveau au-dessus de White n'est annonçable, ce qui est lisible dans les conditions de `config/grid.json`. La saisie doit donc porter son enjeu sans le maquiller en formalité.

Si la personne ira au bout, parce qu'un parcours complet est un engagement long. Une partie perdue à la fermeture d'un onglet est une partie abandonnée pour de bon. La reprise existe déjà côté domaine, elle doit se voir à l'entrée.

L'onboarding tient aujourd'hui un seul champ, le pseudo, et il est déclaratif par construction : rien de ce qui est saisi ici n'entre dans un score.

## Boundaries

- Includes : l'identité que la personne se donne, la désignation d'un dépôt Git facultative, et ce qui lui est dit du cadre avant de commencer.
- Includes : la reprise visible d'une partie stockée, et le choix de repartir de zéro.
- Excludes : la saisie d'une clé d'API et tout ce qui touche à l'assistant narratif, repoussés.
- Excludes : tout compte, toute authentification, tout envoi de données hors du navigateur.
- Excludes : l'énoncé des critères de notation. Une personne prévenue de ce qu'on note joue un personnage, et l'outil ne mesure plus rien.

## Success Evidence

Une personne qui ouvre l'outil pour la première fois entre dans le parcours sans hésitation sur ce qu'on lui demande ni pourquoi. Une personne qui revient retrouve sa partie plutôt que d'en recommencer une. Une personne sans dépôt entre quand même, et sait déjà à ce moment-là que son verdict sera plafonné.

## Dependencies and Unknowns

| Item | Kind | Handling |
| --- | --- | --- |
| Les champs se limitent au pseudo et au dépôt Git | décision | Arbitrage du 29/08 |
| Rien de saisi ici n'entre dans un score | décision | Le déclaratif ne monte jamais un niveau |
| Le format attendu pour le dépôt, et ce qui se passe s'il est inaccessible | unknown | Se tranche avec l'épic des preuves du dépôt |
| Dire le plafond dès l'entrée n'incite pas à saisir un dépôt qu'on ne veut pas montrer | assumption | Acceptée ; se vérifie en jouant |
