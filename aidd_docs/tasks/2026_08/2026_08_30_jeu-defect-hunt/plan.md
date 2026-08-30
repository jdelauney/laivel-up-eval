---
objective: "Le jeu defect-hunt se joue de bout en bout à la place du placeholder g1-2, mesure une revue de code sous chronomètre sur la dimension verification, et n'oblige aucun contrat existant à bouger."
status: implemented
---

# Plan: Le jeu `defect-hunt`, la revue à l'aveugle sous chronomètre

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Mesurer si un joueur lit réellement le code qu'on lui donne — sans lui dire combien de défauts il porte ni de quelle nature, sans aucune liste de choix, et sous un temps qui se voit |
| **Source** | `aidd_docs/backlog/stories/trouver-les-erreurs-sans-liste.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` · `config/signature.json` |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | Les contrats et la lecture pure de la revue | [`phase-1.md`](./phase-1.md) |
| 2 | L'évaluateur et ses quatre règles | [`phase-2.md`](./phase-2.md) |
| 3 | Le jeu à l'écran, ses marques et son chronomètre | [`phase-3.md`](./phase-3.md) |
| 4 | Le jeu dans le parcours | [`phase-4.md`](./phase-4.md) |
| 5 | La passe impeccable de la surface | [`phase-5.md`](./phase-5.md) |

## Decisions

| Decision | Why |
| --- | --- |
| Le jeu reprend le gabarit de `confidence-bet`, son voisin de groupe : schéma de configuration, trace + `parse*Trace`, helper pur partagé entre l'écran et l'évaluateur, évaluateur à règles déclaratives | C'est la ligne posée par `checkpoints`, confirmée par `three-tracks` puis par `confidence-bet`. Un cinquième jeu qui structurerait son état autrement obligerait à relire la mécanique à chaque fois |
| La cible cliquable est **la ligne**, pas un mot ni une région | Une sélection au caractère mesurerait la précision du geste et rendrait la comparaison entre deux joueurs impossible. La ligne est l'unité que tout relecteur de diff manipule déjà, et elle rend le verdict binaire sans arbitrage |
| Un défaut par ligne au plus, refusé au chargement | Deux défauts sur une ligne rendraient une seule marque valable pour deux trouvailles, et le ratio « au moins 80 % » cesserait de décrire ce que le joueur a vu |
| La durée écoulée entre dans la trace comme **donnée mesurée**, produite par l'écran, jamais par le port `Clock` | Le port rend un horodatage ISO de soumission, pas une durée, et `GameComponentProps` vaut `{ config, onSubmit }` : injecter une horloge au composant changerait le contrat des quatre jeux déjà livrés pour un seul besoin. Le déterminisme du rejeu tient quand même, parce que l'évaluateur reste une fonction pure de la trace — rejouer la même trace rend le même verdict. Le non-déterminisme vit à la capture, ce qui est exactement ce que ce jeu mesure |
| La trace ne porte **aucun journal** : les lignes marquées et la durée, rien d'autre | `confidence-bet` porte un capital final que l'évaluateur ne lit jamais. Ici tout — trouvés, manqués, faux positifs, ratio — se recalcule depuis les seules marques. La durée est la seule chose qui ne se recalcule pas : c'est précisément pour ça qu'elle est dans la trace, et le fichier le dit |
| Le chronomètre **n'interrompt jamais** la partie : il passe en dépassement et continue de courir | La story dit « son dépassement fait manquer **son** critère », au singulier. Couper la partie à zéro ferait rater les trois autres critères par ricochet, et un joueur lent ressortirait indistinguable d'un joueur qui n'a rien vu. Le temps coûte un critère, pas la partie |
| Le budget affiché et le budget noté sont **le même nombre**, lu dans la configuration, jamais un seuil séparé dans la règle | Un écran qui montre trois minutes pendant qu'un critère en note deux ment au joueur. La règle `within-time-budget` ne porte donc pas de seuil : elle lit `timeLimitSeconds` de la configuration |
| Quatre critères, pesés **2 · 2 · 2 · 1**, tous sur la seule dimension `verification` | L'epic partage le parcours en deux : six groupes portent la signature, seul le septième porte les axes officiels. Le mapping `intervention` du placeholder disparaît — un jeu de jugement critique qui monterait un axe du référentiel officiel brouillerait cette frontière |
| Le troisième critère porte sur la **dépendance hallucinée** en propre, et il n'est pas annoncé | C'est le seul défaut du corpus qui ne se tranche pas dans les lignes montrées : il faut savoir que le paquet n'existe pas. C'est le défaut spécifiquement produit par une IA, donc le cœur de ce que ce produit mesure. L'annoncer le transformerait en consigne à exécuter ; le taire le laisse mesurer une habitude. Le cadre — « leur nature n'est dite nulle part » — reste annoncé, comme l'exige `DESIGN.md` |
| Le corpus porte **cinq** défauts | Le seuil « au moins 80 % » n'est une proportion qu'à partir de cinq : à quatre défauts il exige les quatre, et le critère cesse de mesurer une proportion pour exiger la perfection. Cette contrainte vit dans le corpus et dans son test d'intégration, pas dans le schéma, qui ignore les seuils du parcours |
| **Le nombre de défauts n'est pas annoncé**, et le barème le remplace : +1 par ligne fautive marquée, −1 par ligne saine marquée, 0 pour une ligne laissée de côté | Décision produit du 30/08, prise après la revue du candidat. Un compte annoncé donne une règle d'arrêt, et le joueur apprend à jouer le nombre plutôt qu'à lire — le profil qui trouve tout puis s'arrête au compte annoncé sortait mieux noté que le relecteur exhaustif. Le point négatif rend le marquage au hasard perdant sans qu'aucun compte n'ait à être donné, et le zéro sur une ligne laissée de côté fait que ne pas savoir n'est jamais puni : seule l'affirmation fausse l'est. Le critère qui comptait séparément les faux positifs disparaît — le barème les fait déjà payer un par un, et le garder les punirait deux fois pour la même marque |
| Le seuil du score net est **3 sur 5**, pas 4 | À 4, un relecteur qui trouve les cinq défauts n'a droit qu'à une seule marque discutable. À 3, il en a deux, ce qui correspond exactement à la tolérance que la rédaction du corpus vise. Le critère de couverture (80 %) tient l'autre bout : on ne peut pas atteindre 3 en marquant trois lignes au hasard |
| Chaque ligne fautive du corpus porte une **instruction complète** : aucun défaut n'est posé à l'intérieur d'un appel ou d'un bloc qui s'étale sur plusieurs lignes | Trouvé à la relecture du premier corpus livré, qui posait l'injection au milieu d'un appel sur trois lignes et la fuite de ressource au milieu d'un bloc de quatre. Un joueur qui lit juste mais clique la ligne voisine payait alors deux fois — un faux positif **et** un défaut manqué — et le jeu mesurait la devinette du découpage plutôt que la lecture. Le garde-fou est un test d'intégration sur l'équilibre des parenthèses et des accolades de chaque ligne fautive, pour que le prochain corpus ne puisse pas rouvrir le trou |
| Un défaut n'a qu'un seul **lieu de correction**, ce qui est plus fort qu'un seul marqueur textuel | Le garde-fou précédent a été contourné par le corpus lui-même à la deuxième écriture : la fuite était déclarée sur `client.release` sans parenthèses, marqueur unique dans le fichier, mais le bloc n'avait pas de `finally` — le correctif complet vivait donc sur deux lignes. Et comme `page` vaut `NaN` sans paramètre, `OFFSET NaN` fait toujours échouer la requête : le chemin d'erreur était le chemin **par défaut**, et la ligne du `release` n'était jamais atteinte. Un relecteur qui marquait les deux sortait à 0, celui qui n'en voyait qu'une sortait à +1. Le jeu payait mieux la lecture superficielle — l'inverse exact de ce qu'il mesure. Le `finally` existe désormais et seules les parenthèses manquent |
| Les lignes saines encore défendables sont **listées et comptées** dans `DEBATABLE_LINES`, et un test casse si on en ajoute une sans bouger le seuil | Un test qui affirmait « le relecteur exhaustif garde son score » en marquant deux imports irréprochables ne vérifiait que `5 − 2 ≥ 3`, de l'arithmétique — il aurait passé à l'identique sur le corpus que la revue avait fait rejeter. Une tolérance qui n'est pas énumérée n'est pas une tolérance, c'est une supposition |
| La frontière avec `confidence-bet` est tenue : la dépendance hallucinée appartient à **ce** jeu | Tranché en phase 4 du plan `confidence-bet` : une dépendance hallucinée ne se juge pas dans les lignes montrées, ce qui est mot pour mot la définition de l'indécidable chez le voisin. Ici, où le joueur balaie tout l'extrait ligne à ligne plutôt que de trancher un verdict global, l'appel est fermé et le défaut redevient trouvable |
