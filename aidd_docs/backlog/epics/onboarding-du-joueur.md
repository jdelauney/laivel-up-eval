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

Ce que l'outil pourra mesurer, parce que le dépôt saisi ici est la seule source factuelle de deux axes : la reprise du travail de l'IA et les chantiers menés en parallèle. Ce sont les deux seuls que les quatre preuves lisibles sans jeton atteignent, d'après `aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md`. La saisie doit donc porter son enjeu sans le maquiller en formalité.

**Corrigé le 29/08/2026.** Cette section affirmait que sans dépôt, aucun niveau au-dessus de White n'était annonçable. C'est faux contre le code : `config/course.json` alimente les cinq dimensions de la grille, et `src/core/scoring/helpers/level-resolver.helper.ts` ne pose aucun plafond. Le parcours seul rend les cinq axes mesurés. Le dépôt apporte de la preuve factuelle là où le parcours n'apporte que de la mise en situation ; il ne débloque aucun niveau.

Si la personne ira au bout, parce qu'un parcours complet est un engagement long. Une partie perdue à la fermeture d'un onglet est une partie abandonnée pour de bon. La reprise existe déjà côté domaine, elle doit se voir à l'entrée.

L'onboarding tient aujourd'hui un seul champ, le pseudo, et il est déclaratif par construction : rien de ce qui est saisi ici n'entre dans un score.

## Boundaries

- Includes : l'identité que la personne se donne, la désignation d'un dépôt Git facultative, et ce qui lui est dit du cadre avant de commencer.
- Includes : la reprise visible d'une partie stockée, et le choix de repartir de zéro.
- Excludes : la saisie d'une clé d'API et tout ce qui touche à l'assistant narratif, repoussés.
- Excludes : tout compte, toute authentification, tout envoi de données hors du navigateur.
- Excludes : l'énoncé des critères de notation. Une personne prévenue de ce qu'on note joue un personnage, et l'outil ne mesure plus rien.

## Success Evidence

Une personne qui ouvre l'outil pour la première fois entre dans le parcours sans hésitation sur ce qu'on lui demande ni pourquoi. Une personne qui revient retrouve sa partie plutôt que d'en recommencer une. Une personne sans dépôt entre quand même, et sait déjà à ce moment-là quels axes un dépôt aurait servis.

L'annonce du verdict plafonné faisait partie de cette preuve. Elle en est retirée le 29/08/2026 : aucun plafond n'existe dans le code, et l'accueil ne promet pas ce que la sortie contredit. Elle revient avec `aidd_docs/backlog/stories/voir-mon-verdict-plafonne.md`.

## Dependencies and Unknowns

| Item | Kind | Handling |
| --- | --- | --- |
| Les champs se limitent au pseudo et au dépôt Git | décision | Arbitrage du 29/08 |
| Rien de saisi ici n'entre dans un score | décision | Le déclaratif ne monte jamais un niveau |
| Le champ accepte une URL GitHub ou la forme `proprietaire/depot`, et normalise vers la seconde | décision | Tranché par `aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md` ; l'API n'accepte pas d'autre forme |
| Un dépôt privé et un dépôt inexistant sont indiscernables sans jeton | décision | Les deux rendent `404`. L'outil annonce « non lisible », jamais la cause |
| Dire le plafond dès l'entrée n'incite pas à saisir un dépôt qu'on ne veut pas montrer | assumption | Sans objet depuis le 29/08/2026 : le plafond n'est plus dit à l'entrée. À reprendre avec `voir-mon-verdict-plafonne.md` |
| Le dépôt saisi n'est lu par aucun calcul à ce jour | fait | `getVerdict()` ne lit pas `repository` ; le champ collecte pour l'Epic `preuves-du-depot-git.md`, qui l'exploitera. L'accueil ne lui prête donc aucun effet au futur |
