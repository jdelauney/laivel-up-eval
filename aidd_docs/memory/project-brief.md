# Project Brief

## Ce que c'est

- Un outil web qui place un développeur sur le référentiel AIDD (sept niveaux, de White à Gold), explique ce qui l'y place, et lui donne le pas suivant.
- Réponse à un sujet de hackathon posé par un CTO fictif : « le niveau AI-Driven Development de toute mon équipe, et un plan de progression pour chacun ».

## Pourquoi il existe

- Le jury lance l'outil sur ses machines, sans clés d'API. **Le niveau se calcule donc sans modèle distant** : toute la chaîne signaux → axes → niveau → progression est déterministe, seuils lus dans du JSON.
- Deux exécutions sur le même faisceau de preuves rendent le même niveau. C'est ce qui rend le verdict opposable, et c'est le premier critère de notation.
- L'outil s'utilise, il ne s'exécute pas sur un dossier : l'entrée produit est une personne qui fait le parcours, pas un chemin passé en argument.
- **Les évaluateurs ne testeront pas l'application avec des profils prédéfinis.** Ils font le parcours eux-mêmes. Aucun dossier de profil n'est une voie d'entrée, ni une modalité d'évaluation du rendu.

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

## Ce qui tourne aujourd'hui

- Onboarding, avec reprise d'une session stockée.
- Parcours groupe → jeu, progression visible, un seul jeu écrit (`test-bench`, le gabarit).
- Moteur d'évaluation déterministe : critères → dimensions → niveau par la règle du minimum, plus la signature séparée.
- Résumé à l'écran : verdict, dimensions et bandes.
- Refus de configuration : une grille ou un parcours hors contrat n'ouvre pas de session et nomme le champ fautif.
- Trace d'audit des réponses soumises, rendue par la façade.

## Ce qui reste à construire

- L'ingestion d'un dépôt et le catalogue de signaux qui l'exploite.
- Le statut de mesure par axe, et le plafonnement qu'il entraîne.
- Le plan de progression par axe.
- L'export JSON et Markdown.
- L'assistant IA narratif, optionnel, qui ne calcule rien et ne déplace rien.
- Le banc de calibration sur les quatre profils fournis.

## Ce que le référentiel met hors périmètre

À ne jamais remonter en signal de niveau : la séniorité, la qualité du code (prérequis, pas axe), le volume d'usage. Commits, PR et tokens sont des **dénominateurs**, jamais des numérateurs.

## Écarts assumés au référentiel

Le sujet invite à bouger la grille. Trois ajouts, chacun justifié :

- Un axe `initiative` : sans lui, Silver et Gold partagent les quatre axes officiels au même cran et la frontière n'est pas calculable.
- La signature : deux profils Copper, l'un qui vérifie et l'autre qui accepte tout, ne sont pas le même développeur.
- Le statut de mesure par axe : la réponse directe au critère « il assume quand il n'est pas sûr ».

## Sources hors dépôt

- Référentiel officiel et quatre profils de calibration (`perceval` Red, `bohort` Blue, `leodagan` Green, `arthur` Copper) : `E:\IA-PULSE\hackaton\ressources\laivel-up-main` (`levels/aidd.md`, `profiles/`, `SUJET.md`). Non versionné ici.
