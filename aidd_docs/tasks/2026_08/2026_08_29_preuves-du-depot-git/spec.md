# Les preuves du dépôt désigné

## Target

Un dépôt désigné produit des preuves d'habitude sourcées, assorties de la part du dépôt réellement lue, qui lèvent le plafond que le parcours seul impose au niveau annonçable.

## Hard constraints

- La lecture est déterministe et n'appelle aucun modèle, y compris pour interpréter un texte libre.
- La fenêtre d'analyse porte deux bornes qui s'appliquent ensemble : une borne de durée comptée depuis le jour de la lecture, et un plafond de pull requests. La première borne atteinte arrête la lecture.
  - TBD : quelle durée retenir pour la borne de date ?
  - TBD : quel nombre de pull requests retenir pour le plafond, sachant que le budget mesuré n'en autorise qu'environ 55 par heure et par adresse ?
- Un dépôt dont l'activité dépasse une des deux bornes est lu partiellement, jamais refusé. Le rapport dit alors quelle fraction du dépôt il couvre, et sur quelle période.
- Une lecture partielle plafonne le niveau annonçable plus bas qu'une lecture complète. Un dépôt lu pour un cinquième ne vaut pas un dépôt lu en entier.
- Deux lectures d'un dépôt dont l'activité n'a pas changé entre-temps rendent les mêmes valeurs. Une pull request ouverte, fermée ou mergée entre les deux lectures change légitimement le résultat.
- Le budget de requêtes restant est consulté avant de commencer. Une lecture qui ne pourra pas atteindre ses bornes est annoncée comme partielle avant de partir, jamais interrompue en cours de route.
- Un dépôt privé et un dépôt inexistant sont indiscernables sans jeton. Le rapport dit « non lisible », sans nommer la cause ni suggérer laquelle des deux situations le joueur vit.
- L'absence de dépôt reste un cas nominal. Elle produit un verdict plafonné, jamais une erreur.
- Un axe qu'aucune preuve ne couvre plafonne le niveau annonçable et ne vaut pas zéro.
- Quand le dépôt et le parcours parlent d'un même axe, la valeur du dépôt l'emporte, et celle du parcours est conservée comme écartée plutôt que supprimée.

## Non-goals

- Rendre le jeton obligatoire, ou monter un relais pour contourner le budget de requêtes.
- Distinguer un dépôt privé d'un dépôt inexistant.
- Garantir qu'un même dépôt puisse être lu deux fois dans la même heure : le budget sans jeton ne le permet pas, et rien dans le produit ne doit le promettre.
- Figer la fenêtre d'analyse à la première lecture pour la rejouer ensuite. La fenêtre se recalcule à chaque lecture depuis le jour courant.
- Juger la qualité du code du dépôt comme axe de niveau. Elle ne sert qu'à invalider une lecture haute.
- Fixer les seuils par cran, qui restent transposés des données d'exemple et relèvent du réglage.
- Trancher la règle de calcul de « pull request mergée sans édition humaine », laissée ouverte par le spike.
  - TBD : qu'est-ce qui compte comme édition humaine sur une pull request mergée ?
- Traiter le partage d'une même adresse par plusieurs joueurs le jour de la démonstration.

## Done-when

- Une personne qui désigne un dépôt actif et lisible obtient les quatre preuves d'habitude, chacune accompagnée de ce qui la source.
- Le rapport affiche la période couverte et le nombre de pull requests lues, que la lecture ait été complète ou partielle.
- Un dépôt plus actif que les bornes produit un verdict et la mention de sa lecture partielle, jamais un message d'erreur.
- Un dépôt non lisible produit un verdict fondé sur le parcours seul, et la mention « non lisible » sans cause nommée.
- Une même personne, avec et sans dépôt, obtient deux verdicts cohérents : celui avec dépôt est plus précis, jamais contradictoire avec l'autre.
- Deux lectures successives d'un dépôt resté inchangé affichent les mêmes valeurs et la même période.
- Un axe que ni le parcours ni le dépôt ne mesurent apparaît comme non mesuré, et le niveau annoncé porte visiblement le plafond que cela impose.
- Un axe mesuré des deux côtés affiche la valeur du dépôt, et la valeur écartée du parcours reste consultable.

## Stakeholders

- Decider : le porteur du produit, qui a tranché la fenêtre à deux bornes, la lecture partielle annoncée, et la reproductibilité à activité inchangée.
- Owner : l'équipe du parcours d'évaluation.
- Consumer : le développeur évalué, qui lit le verdict et ce qui le fonde.

## Context

- Epic parent : `aidd_docs/backlog/epics/preuves-du-depot-git.md`.
- Spike de faisabilité : `aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md`, résolu le 29/08/2026. Il établit que les quatre preuves sont calculables depuis le navigateur sans jeton, sous un plafond d'environ 55 pull requests par dépôt et par heure, et que ce plafond vient du coût d'un appel par pull request, non contournable sans jeton.

Trois arbitrages produit ont été pris le 29/08/2026 et fondent les contraintes ci-dessus.

| Arbitrage | Retenu | Écarté |
| --- | --- | --- |
| Fenêtre d'analyse | Deux bornes conjointes, date et nombre de pull requests | Une borne de nombre seule, qui fait dire des choses différentes à la même valeur selon l'activité du dépôt ; une borne de date seule, qui rend illisible un dépôt actif |
| Dépôt au-delà du plafond | Lecture partielle annoncée, avec un plafond de niveau plus bas | Le refus, qui contredit l'engagement de l'Epic à produire un verdict plutôt qu'une erreur ; la lecture partielle sans plafond, qui donnerait le même poids à un dépôt lu pour un cinquième |
| Reproductibilité | Même valeurs à activité inchangée | La fenêtre figée à la première lecture, qui laisserait une lecture datée mentir sur l'état du jour ; l'abandon de toute promesse |

La Success Evidence de l'Epic porte aujourd'hui la formulation absolue « deux lectures du même dépôt rendent les mêmes valeurs ». L'arbitrage retenu la qualifie : elle vaut à activité inchangée. L'Epic reste à réaligner sur ce point.
