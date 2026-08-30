---
version: 1
slug: "ct-hunt-components-composites-defect-hunt-game-tsx"
primary_target: "src/games/defect-hunt/components/composites/defect-hunt-game.tsx"
related_targets: []
---

# Le jeu `defect-hunt` — la planche de relecture

Quatrième jeu à état du parcours, et le deuxième du groupe « Jugement critique ». Il prend la place du banc d'essai placeholder `g1-2`.

**Chaque jeu a sa propre surface, et cette fiche ne vaut que pour celle-ci.** `checkpoints` est une frise de six étapes ; `three-tracks` une table à quatre colonnes qui se réécrit tour après tour ; `confidence-bet`, son voisin de groupe, un instrument gradué qu'on relève une fois. Celui-ci est une **épreuve d'imprimeur** — une feuille qu'on balaie, dont on frappe la marge, et sur laquelle la vérité vient se tamponner. Le fait de partager un bloc de code avec `confidence-bet` ne fait pas des deux surfaces la même : chez le voisin le code est un objet qu'on regarde, ici c'est une surface qu'on travaille.

Les cinq règles communes à tous les jeux — coût annoncé et conséquence tue, partie dans le composant et trace comme réponse, état porté par une quantité, relevé qui ne chasse pas la décision, avancée discrète — vivent dans [DESIGN.md](../../DESIGN.md), section « La surface d'un jeu ». Elles ne se rediscutent pas ici.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinés.

## Public et métier

Le développeur évalué, seul, à la deuxième situation du parcours. **On ne lui dit ni combien de défauts porte l'extrait, ni lesquels, ni de quelle nature**, et on ne lui propose aucune liste. Il clique les lignes qu'il juge fautives, sous un temps qui court, et rend sa revue quand il l'estime finie.

Il n'a donc **aucune règle d'arrêt**, et c'est délibéré : un compte annoncé lui apprendrait à jouer le nombre plutôt qu'à lire. Ce qui remplace le compte est le barème, annoncé lui — un point par ligne fautive marquée, un de moins par ligne saine marquée, rien pour une ligne laissée de côté. Marquer au hasard se paie mécaniquement, et ne pas savoir n'est jamais puni : seule l'affirmation fausse l'est.

Ce qui est mesuré n'est pas s'il connaît les défauts classiques, mais s'il **lit vraiment le code** au lieu de reconnaître des motifs. Le corpus porte un défaut qui ne se tranche pas dans les lignes montrées — une dépendance qui n'existe pas sur npm — et c'est celui-là qui sépare le lecteur du vérificateur.

## Action et preuve

Il balaie, il frappe, il rend. Une fois. Le succès de l'écran, c'est qu'il ait **lu l'extrait ligne à ligne**, jamais deviné où l'auteur avait posé ses marques.

## Le concept

**La feuille et sa marge.** Un objet, trois bandes, et la marge est l'instrument.

| Bande | Ce qu'elle porte | Pourquoi elle est là |
| --- | --- | --- |
| Tête | L'intitulé de l'extrait, sa langue, le cadran du temps. **Aucun compte de défauts** | Ce que le jeu **donne** |
| Corps | La feuille : marge de frappe, filet du registre, numéros, code | Le travail |
| Pied | Les lignes marquées, puis l'action ; après le rendu, le relevé | Ce que le joueur **produit** |

Cette séparation est la raison d'être de la composition : on ne mélange pas ce que le jeu donne et ce que le joueur rend. Le bouton de rendu vit **dans** le pied de la feuille — la feuille est un objet complet, pas un bloc suivi d'une action détachée.

Le filet vertical entre le numéro et le code court sur toute la hauteur : c'est le filet de marge d'un registre, et il fait de l'empilement de lignes une feuille réglée plutôt qu'une liste.

## Ce qui ne se négocie pas

- **La feuille ne coûte qu'un seul arrêt de tabulation.** Vingt-quatre lignes cliquables feraient vingt-quatre arrêts, et un joueur au clavier devrait traverser tout le code pour atteindre le rendu : conforme ligne à ligne, hostile dans son ensemble. Les lignes sont des `option` d'un `listbox` à sélection multiple, les flèches parcourent, `Début`/`Fin` sautent, l'espace marque. Le focus se pose sur le nœud réel, pas sur un état seul.
- **Le code ne défile jamais horizontalement.** Une ligne longue se replie. Ce jeu se perd si un seul caractère de l'extrait est hors de vue, et une gouttière figée par-dessus une ligne teintée aurait doublé la teinte.
- **Aucune coloration syntaxique.** Elle jugerait à la place du joueur, et elle attirerait l'œil là où la teinte tombe plutôt que là où le défaut est. Aucune dépendance ajoutée pour l'obtenir.
- **Le cadran est un relevé, jamais une jauge.** Une jauge ferait la barre de progression que `DESIGN.md` refuse et pousserait au réflexe — or ce jeu mesure une lecture. Trois libellés, `RESTANT` / `DÉPASSÉ DE` / `RENDUE EN`, et le troisième n'est pas un détail : un cadran figé sur « restant » après le rendu ferait croire que la partie court encore.
- **Le dépassement n'interrompt jamais la partie.** Le compteur passe au vermillon, son poids monte, le libellé change, et le jeu reste jouable. Couper à zéro ferait rater les autres critères par ricochet, et un joueur lent ressortirait indistinguable d'un joueur qui n'a rien vu.
- **Trois verdicts, trois formes, trois places sur la triade.** Trouvé en `--nominal`, manqué en `--missed`, marqué à côté en `--caution` — le faux positif est une erreur plus douce que le défaut laissé passer, et la triade dit exactement ça. Chaque verdict porte son mot à côté de son glyphe : le sens ne tient jamais à la teinte.
- **Le verdict se pose sur l'extrait lui-même**, pas dans un panneau qui le remplace. Le joueur relit le code qu'il vient de lire, avec la vérité dessus. Les annotations en dessous reprennent la même marge, le même glyphe, la même triade.
- **La marge se pré-annonce au survol.** Une frappe fantôme à 25 % sur la ligne survolée dit où l'on frappe sans rien apprendre sur le contenu.

## Ce que l'écran ne dit jamais

Le cadre s'annonce dans la consigne, jamais les critères.

| S'énonce | Se tait |
| --- | --- |
| Que l'extrait contient des défauts | **Combien il en contient** |
| Que leur nature n'est dite nulle part, et qu'aucune liste n'est proposée | Que la dépendance hallucinée porte son propre critère |
| Le barème : un point par ligne fautive, un de moins par ligne saine, rien pour une ligne laissée de côté | Le seuil de score net, et celui de 80 % |
| Que le joueur rend sa revue quand il l'estime finie | Qu'aucun signal ne lui dira qu'elle est complète, parce qu'il n'y en a pas |
| Que le temps court sans interrompre, et que rendre au-delà se voit | Que le dépassement ne coûte qu'un critère sur quatre |
| Le nombre de lignes déjà marquées | Où elles tombent, et lesquelles sont justes |

Le barème s'énonce et n'est pas une fuite : `DESIGN.md` veut le coût d'un geste annoncé **avant** qu'on le pose. Ce qui reste tu, ce sont les seuils qui en font un verdict.

Le total de défauts n'apparaît qu'au pied de la feuille, **une fois la revue verrouillée**. Avant le rendu, le hook n'expose ni ce total, ni la nature d'un défaut, ni sa ligne : ce qui n'est pas exposé ne peut pas fuiter à l'écran. Cette étanchéité est verrouillée par des tests, et la surface ne doit pas rouvrir ce chemin pour un effet visuel.

Trois formulations ont été retirées de la consigne, à la passe de relecture puis à la décision produit, parce qu'elles disaient le barème ou le remplaçaient mal : « au même titre qu'un défaut manqué » (elle donnait l'égalité des poids), « le dépassement vous coûte son propre critère » (elle nommait un critère), et l'annonce du nombre de défauts elle-même (elle donnait la règle d'arrêt).

Si un joueur peut déduire de l'écran **où** chercher plutôt que **lire pour trouver**, la surface est allée trop loin.

## Motion

Une seule exception à l'avancée discrète, et elle tombe sur le seul moment où le joueur apprend quelque chose : les annotations qui entrent après le rendu, décalées de 70 ms l'une de l'autre, depuis un état déjà lisible, sous `motion-safe`. Ni la marge, ni le cadran, ni la bascule de la feuille ne s'animent.

## Vérifié en navigateur

Tournée du 30/08, Chromium, 1440×900 et 390×844, dans [qa/](../../aidd_docs/tasks/2026_08/2026_08_30_jeu-defect-hunt/qa/).

Aucun débordement horizontal à aucun des deux gabarits : `scrollWidth` égale `clientWidth`, 1440 comme 390. Trois défauts trouvés à la première tournée et corrigés à la seconde : le cadran qui annonçait encore un temps « restant » après le rendu, la consigne qui repoussait la feuille sous la ligne de flottaison, et l'entête des annotations à l'étroit sous son propre filet.
