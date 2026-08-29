---
type: spike
status: resolved
parents:
  - aidd_docs/backlog/epics/onboarding-du-joueur.md
  - aidd_docs/backlog/epics/preuves-du-depot-git.md
---

# Spike: Les preuves du dépôt sont-elles calculables depuis le navigateur sans jeton

## Question

Depuis un site statique servi par GitHub Pages, sans backend et sans jeton obligatoire, peut-on tirer d'un dépôt désigné les quatre preuves d'habitude visées, et qu'est-ce que cela impose au champ de saisie de l'accueil ?

Les quatre preuves : médiane des commits correctifs après ouverture de PR, part de PR mergées sans édition humaine, médiane de branches concurrentes menées jusqu'au bout, part de commits co-signés par un assistant.

## Decision

Trois décisions sont bloquées tant que la réponse manque.

Le format accepté par le champ dépôt de l'accueil, et sa règle de validation. Un champ ne peut pas être validé contre un contrat qui n'existe pas.

Le périmètre réel de l'Epic des preuves du dépôt : les quatre preuves tiennent-elles dans le budget de requêtes, ou faut-il en abandonner, en approximer, ou rendre le jeton nécessaire malgré la contrainte du jury.

Ce que l'outil fait d'un dépôt inaccessible. L'absence est un cas nominal ; encore faut-il savoir quels cas se distinguent à l'observation.

## Bounds

- Evidence needed : la limite de requêtes documentée pour l'API REST sans authentification, et la politique CORS de `api.github.com` depuis une origine tierce.
- Evidence needed : le nombre d'appels réellement consommés pour produire chacune des quatre preuves sur un dépôt public existant.
- Evidence needed : le statut observé pour un dépôt privé, un dépôt vide, et un dépôt inexistant, pour savoir si les trois cas se distinguent.
- Evidence needed : la fenêtre d'analyse tenable dans ce budget, exprimée en durée ou en nombre de PR.
- Stop when : un dépôt public réel a rendu les quatre valeurs, ou la raison documentée pour laquelle l'une d'elles ne peut pas l'être, sans dépasser le budget sans jeton ; et les trois cas inaccessibles sont chacun rattachés à un statut observé.

Hors périmètre : les seuils par cran, le format du rapport rendu au joueur, et l'arbitrage entre dépôt et parcours. Ce spike dit ce qui est lisible, pas ce qu'on en conclut.

## Investigation

Mesures prises le 29/08/2026 contre `api.github.com`, sans authentification, depuis le poste de développement.

| Attempt | Evidence | Result |
| ------- | -------- | ------ |
| Lire le budget de requêtes sans jeton | `GET /rate_limit` | `core` plafonne à **60 requêtes par heure et par IP**. `search` à 10 par minute. |
| Vérifier l'échappatoire GraphQL, qui rendrait tout en une requête | `GET /rate_limit`, ressource `graphql` | `limit: 0`. **GraphQL est fermé sans jeton.** Aucun regroupement possible, tout passe par REST. |
| Vérifier que le navigateur peut appeler l'API depuis une autre origine | `GET /repos/{owner}/{repo}` avec en-tête `Origin` tiers | `Access-Control-Allow-Origin: *`. L'appel direct depuis le navigateur fonctionne, aucun relais requis. |
| Vérifier si le budget restant est lisible côté client | En-têtes de la même réponse | `X-RateLimit-Remaining` figure dans `Access-Control-Expose-Headers`. Le budget restant est lisible par l'application. |
| Distinguer un dépôt privé d'un dépôt inexistant | `GET /repos/` sur un nom inventé, puis sur un dépôt privé connu | **Les deux rendent `404`**, corps identique. Les deux cas sont indiscernables sans jeton. |
| Identifier le cas du dépôt vide | Documentation REST « List commits » | `409 Conflict` est une réponse documentée de l'endpoint, sans cause précisée. Non reproduit faute de dépôt vide sous la main. |
| Mesurer le coût de la preuve de co-signature | `GET /repos/{owner}/{repo}/commits?per_page=100` sur `jdelauney/laivel-up-eval` | Le message complet est dans la charge utile. **36 trailers `Co-Authored-By` sur 44 commits, en un seul appel.** Coût : 1 appel par tranche de 100 commits. |
| Mesurer le coût des preuves liées aux PR | `GET /repos/{owner}/{repo}/pulls?state=all&per_page=100` | Rend `created_at`, `merged_at`, `head.ref` pour chaque PR. Suffit seul à la médiane de branches concurrentes. Coût : 1 appel par tranche de 100 PR. |
| Chercher le coût des commits correctifs après ouverture de PR | `GET /repos/{owner}/{repo}/pulls/{n}/commits` | Rend dates et auteurs, donc la preuve est calculable. Mais la liste des PR ne porte pas ses commits : **coût de 1 appel par PR**, non contournable sans jeton. |

## Outcome

- Result : **oui, les quatre preuves sont calculables depuis le navigateur sans jeton, sous un plafond d'environ 55 pull requests par dépôt et par heure.**

Le coût total d'une lecture se décompose ainsi : 1 appel pour le dépôt, 1 appel par tranche de 100 PR, 1 appel par tranche de 100 commits, et 1 appel par PR. Ce dernier terme domine et fixe le plafond. Avec 60 requêtes par heure et par IP, un dépôt de plus de 55 PR ne peut pas être lu en entier sans jeton, et une lecture pleine consomme le budget de l'heure : **une seconde lecture du même dépôt dans l'heure est impossible.**

Trois faits contraignent la conception au-delà du budget.

`Access-Control-Allow-Origin: *` autorise l'appel direct depuis le navigateur. L'absence de backend n'est donc pas un obstacle, et aucun relais n'a à être monté.

`X-RateLimit-Remaining` est exposé aux scripts. L'application peut lire son budget restant avant de partir, donc refuser proprement une lecture qu'elle ne pourra pas finir plutôt que de s'arrêter au milieu.

Un dépôt privé et un dépôt inexistant rendent tous deux `404`, corps identique. **L'outil ne peut pas dire au joueur laquelle des deux situations il vit** ; il ne peut annoncer que « non lisible sans jeton ».

- Confidence : haute sur le budget, le CORS, la fermeture de GraphQL, l'indiscernabilité `404` et le coût par preuve — tous mesurés en direct contre l'API, pas déduits. Moyenne sur le plafond de 55 PR, qui suppose un dépôt de moins de 100 commits et de moins de 100 PR ; au-delà, les pages supplémentaires rabaissent le plafond d'autant.

- Remaining uncertainty :
  - Le cas du dépôt vide n'a pas été reproduit. `409` est documenté sur « List commits » sans cause explicite ; la signature attendue est `200` sur le dépôt et `409` sur ses commits, à confirmer contre un vrai dépôt vide.
  - La définition de « PR mergée sans édition humaine » n'est pas tranchée côté produit. Les données nécessaires sont là, la règle de calcul ne l'est pas.
  - Le comportement quand plusieurs joueurs partagent une IP le jour du jury : le budget de 60 est par IP, pas par personne.

## Follow-up

Sur `onboarding-du-joueur.md`, l'inconnue du format se lève : l'API exige un couple propriétaire et dépôt, donc le champ accepte une URL GitHub ou une forme `proprietaire/depot`, et normalise vers cette dernière. L'inconnue de l'inaccessibilité se lève aussi, mais moins bien qu'espéré : privé et inexistant ne se distinguent pas.

Sur `preuves-du-depot-git.md`, l'inconnue du quota se lève avec un chiffre, et la fenêtre d'analyse devient une décision produit à prendre : plafonner au nombre de PR lisibles, ou borner par date. Le fait qu'une lecture consomme l'heure entière touche directement la règle « deux lectures du même dépôt rendent les mêmes valeurs ».

Deux décisions produit restent ouvertes et n'appartiennent pas à ce spike : la fenêtre d'analyse retenue, et le sort d'un dépôt dépassant le plafond — lecture partielle annoncée comme telle, ou refus.
