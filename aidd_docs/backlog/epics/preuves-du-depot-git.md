---
type: epic
status: proposed
goal: aidd_docs/product/laivel-eval.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
depends_on:
  - aidd_docs/backlog/epics/onboarding-du-joueur.md
order: 4
---

# Epic: Le dépôt désigné lève le plafond du verdict

Quand une personne a désigné un dépôt, l'outil en tire des preuves factuelles sur ses axes d'habitude et annonce un niveau que le parcours seul ne pouvait pas confirmer.

## Context and Value

Le parcours mesure ce qu'une personne fait dans une situation ; il ne peut pas observer ce qu'elle fait habituellement depuis six mois. Or tout niveau à partir de Red exige `intervention` et `parallele`, deux axes d'habitude. Sans dépôt, l'outil ne peut annoncer qu'un plancher.

Le dépôt les rend lisibles sans aucune compréhension : médiane des commits correctifs après ouverture de PR, part de PR mergées sans édition humaine, médiane de branches concurrentes menées jusqu'au bout, part de commits co-signés par un assistant. Ce sont des dates et des compteurs. La contrainte « pas de modèle » ne coûte donc rien ici.

Quand les deux sources parlent d'un même axe, le dépôt tranche : il est factuel là où le parcours est simulé.

## Boundaries

- Includes : la lecture d'un dépôt désigné, la production de preuves sourcées, et le rapport de ce qui a été trouvé et de ce qui ne l'a pas été.
- Includes : la préséance du dépôt sur le parcours quand les deux parlent d'un même axe, et la trace de ce qui a été écarté.
- Includes : le statut de mesure par axe, et le plafond qu'un axe non mesuré impose au niveau annonçable.
- Excludes : toute lecture nécessitant un modèle, y compris celle d'un texte libre.
- Excludes : la qualité du code comme axe de niveau ; elle ne sert qu'à invalider une lecture haute.
- Excludes : l'obligation de fournir un dépôt. L'absence est un cas nominal, jamais une erreur.

## Success Evidence

Une même personne, avec et sans dépôt, obtient deux verdicts cohérents : le second est plus précis, jamais contradictoire. Un dépôt auquel il manque des pièces produit un verdict et la liste de ce qui manquait, pas une erreur. Deux lectures du même dépôt rendent les mêmes valeurs.

## Dependencies and Unknowns

| Item | Kind | Handling |
| --- | --- | --- |
| La lecture est déterministe et sans modèle | décision | Contrainte du jury, rappelée à l'oral |
| Un axe non mesuré plafonne le niveau et ne vaut pas zéro | décision | C'est la réponse au critère « il assume quand il n'est pas sûr » |
| 60 requêtes par heure et par IP sans jeton, soit environ 55 PR par lecture | décision | Mesuré par `aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md`. Le jeton reste facultatif |
| GraphQL est fermé sans jeton, tout passe par REST au coût d'un appel par PR | décision | Mesuré ; c'est ce terme qui fixe le plafond |
| Une lecture pleine consomme le budget de l'heure | décision | Deux lectures du même dépôt dans l'heure sont impossibles sans jeton |
| La fenêtre d'analyse retenue, et le sort d'un dépôt au-delà du plafond | unknown | Décision produit, ouverte |
| Un dépôt privé et un dépôt inexistant rendent le même `404` | décision | Le rapport dit « non lisible » sans nommer la cause |
| Le cas du dépôt vide | unknown | `409` documenté sur les commits, non reproduit ; se confirme contre un vrai dépôt vide |
| Les seuils par cran, transposés des données d'exemple | assumption | Acceptée ; aucune vérification à froid ne les couvre |
