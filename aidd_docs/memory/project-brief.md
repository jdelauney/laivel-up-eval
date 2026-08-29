# Project Brief

## Ce que c'est

- Un outil web qui place un développeur sur le référentiel AIDD (sept niveaux, de White à Gold), explique ce qui l'y place, et lui donne le pas suivant.
- Réponse à un sujet de hackathon posé par un CTO fictif : « le niveau AI-Driven Development de toute mon équipe, et un plan de progression pour chacun ».

## Pourquoi il existe

- Le jury lance l'outil sur ses machines, sans clés d'API. **Le niveau se calcule donc sans modèle distant** : toute la chaîne signaux → axes → niveau → progression est déterministe, seuils lus dans du JSON.
- Deux exécutions sur le même faisceau de preuves rendent le même niveau. C'est ce qui rend le verdict opposable, et c'est le premier critère de notation.
- L'outil s'utilise, il ne s'exécute pas sur un dossier : l'entrée produit est une personne qui fait le parcours, pas un chemin passé en argument.

## Langage du domaine

| Terme | Sens |
| --- | --- |
| Axe | Une des dimensions du référentiel officiel : `taille`, `harness`, `intervention`, `parallele` |
| Cran | Une graduation ordinale sur un axe (`S · M · L · XL`, `prompts · context engineering · behavior · boucles`) |
| Règle du minimum | Un niveau n'est atteint que si **tous** ses axes le sont. Chaque cellule est un plancher, pas une valeur |
| Faisceau de preuves | Le format interne normalisé que produit chaque adapter d'entrée. Le moteur ignore d'où viennent les signaux |
| Signal | Une règle de lecture déclarée en JSON : un identifiant, l'axe visé, la lecture, le seuil par cran |
| Statut de mesure | `mesuré` · `inféré` · `non mesuré`. Un axe non mesuré **plafonne** le niveau annonçable, il ne vaut pas zéro |
| Signature | Lecture complémentaire (`verification`, `pilotage-contexte`, `resilience`) qui ne décide **aucun** niveau officiel |
| Parcours | La suite de mises en situation jouées par la personne, groupe après groupe |
| Banc de calibration | Les quatre profils fournis rejoués dans le moteur de production et comparés à leur niveau attendu |
| Mode replay | Réponses pré-enregistrées injectées dans le même pipeline que le jeu interactif |

## Fonctionnalités socle

- Onboarding : présentation, dépôt GitHub facultatif, assistant IA narratif désactivé par défaut.
- Parcours d'évaluation : groupes de mises en situation, critères OUI/NON appliqués au résultat simulé.
- Ingestion de dépôt : lecture tolérante à ce qui manque, avec le rapport du trouvé et du non-trouvé.
- Moteur d'évaluation déterministe : signaux → crans → niveau par la règle du minimum.
- Rapport : verdict, preuves sourcées, confiance par axe, plan de progression. Export JSON et Markdown.
- Assistant IA narratif, optionnel : reçoit la trace, rédige le texte. Ne calcule rien, ne déplace rien.

## Ce que le référentiel met hors périmètre

À ne jamais remonter en signal de niveau : la séniorité, la qualité du code (prérequis, pas axe), le volume d'usage. Commits, PR et tokens sont des **dénominateurs**, jamais des numérateurs.

## Écarts assumés au référentiel

Le sujet invite à bouger la grille. Trois ajouts, chacun justifié :

- Un axe `initiative` : sans lui, Silver et Gold partagent les quatre axes officiels au même cran et la frontière n'est pas calculable.
- La signature : deux profils Copper, l'un qui vérifie et l'autre qui accepte tout, ne sont pas le même développeur.
- Le statut de mesure par axe : la réponse directe au critère « il assume quand il n'est pas sûr ».

## Sources hors dépôt

- Référentiel officiel et quatre profils de calibration (`perceval` Red, `bohort` Blue, `leodagan` Green, `arthur` Copper) : `E:\IA-PULSE\hackaton\ressources\laivel-up-main` (`levels/aidd.md`, `profiles/`, `SUJET.md`). Non versionné ici.
