---
objective: "Le jeu lie-detector se joue de bout en bout à la place du placeholder g1-3, mesure la désignation d'une affirmation menteuse puis sa tenue sous contradiction sur la dimension verification, et n'oblige aucun contrat existant à bouger."
status: implemented
---

# Plan: Le jeu `lie-detector`, désigner la menteuse puis tenir sa ligne

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Mesurer si un joueur repère la fausse affirmation d'un lot de vraies, puis s'il la tient quand l'assistant le contredit avec aplomb |
| **Source** | `aidd_docs/backlog/stories/demasquer-l-affirmation-qui-ment.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` · `config/signature.json` · `DESIGN.md` |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | Les contrats et la lecture pure des manches | [`phase-1.md`](./phase-1.md) |
| 2 | L'évaluateur et ses deux règles | [`phase-2.md`](./phase-2.md) |
| 3 | Le jeu à l'écran, sa désignation et son objection | [`phase-3.md`](./phase-3.md) |
| 4 | Le jeu dans le parcours, et son corpus | [`phase-4.md`](./phase-4.md) |
| 5 | La passe impeccable de la surface | [`phase-5.md`](./phase-5.md) |

## Decisions

| Decision | Why |
| --- | --- |
| Le jeu reprend le gabarit posé par `checkpoints` et confirmé par `three-tracks`, `confidence-bet` puis `defect-hunt` : schéma de configuration, trace + `parse*Trace`, helper pur partagé entre l'écran et l'évaluateur, évaluateur à règles déclaratives | Sixième jeu du parcours. Un jeu qui structurerait son état autrement obligerait à relire la mécanique de plugin à chaque ajout. Le gabarit est **structurel**, jamais visuel : la surface de ce jeu se dessine à son tour, en phase 5 |
| La manche se joue en **deux temps** — désigner, puis tenir ou se dédire — et la désignation se verrouille entre les deux | Sans occasion de se retourner, le critère « choix stable, sans retournement » ne mesure rien. Sans verrou sur la première désignation, le joueur tâtonne et il n'existe plus de « première » désignation à comparer à la finale |
| L'objection est **écrite dans le corpus** et ne lit jamais la désignation du joueur | Une objection calculée depuis la désignation serait un adversaire adaptatif, donc un modèle de comportement dans la chaîne de décision — exactement ce que le brief interdit. Écrite d'avance, elle reste du texte, et l'évaluateur reste une fonction pure de la trace |
| Le corpus porte les deux natures d'objection, **fondée** (elle pointe la menteuse) et **creuse** (elle pointe une vraie), et le schéma refuse un corpus qui n'en porterait qu'une | C'est le garde-fou anti-triche du jeu. Toutes creuses, « ne jamais bouger » gagne sans lire ; toutes fondées, « toujours suivre » gagne sans lire. Vérifié en force brute sur les 65536 traces possibles du corpus : le mélange fait perdre **`c1`** à toute politique positionnelle fixe (« toujours la deuxième tuile », « toujours la troisième » tombent à 2/4 contre un seuil de 3) — mais ne suffit pas seul à forcer la lecture, puisque **`c2`** n'exige que d'avoir désigné la menteuse d'entrée au moins une fois sur quatre manches, ce qu'une politique fixe peut atteindre par chance sur un lot de quatre |
| L'identification se lit sur la **première** désignation, la stabilité sur le passage de la première à la finale | Inversé le 30/08 après le challenge. La lecture finale contaminait `c1` par la capitulation : un lecteur parfait retourné deux fois ressortait « n'a pas identifié », alors qu'il avait identifié quatre fois sur quatre. Lire `c1` d'entrée sépare les deux critères — ce qui a été lu, ce qui en a été fait sous pression — et rend `c1` insensible à toute politique de réponse à l'objection. Le coût accepté : une correction vers la menteuse ne crédite plus l'identification, parce que dans la manche à objection fondée elle revient à suivre l'assistant qui vient de donner la réponse |
| La stabilité exige **deux occasions** tenues, pas une | Un joueur au hasard qui ne bouge jamais franchissait le seuil d'une occasion dans 57,8 % des parties — mesuré en force brute sur les 256 possibles. À deux, il tombe à 15,6 %, et un lecteur qui démasque trois manches sur quatre garde de quoi satisfaire le critère. L'immobilité n'est pas de la vérification, et ce critère pèse la moitié du jeu |
| **Une capitulation est l'abandon d'une désignation juste**, jamais un changement d'avis quelconque | Un critère qui punirait tout changement mesurerait l'entêtement et l'appellerait rigueur. Corriger une erreur ne coûte rien ; lâcher la vérité sous l'aplomb coûte |
| La stabilité se mesure sur les **occasions de capituler** — première désignation juste **et** objection qui pointe ailleurs — et un joueur sans aucune occasion **rate** le critère | Corrigé le 30/08 après la revue. Prendre « avoir été contredit » comme dénominateur ouvrait un trou béant : se tromper suffit à être contredit, et qui se trompe partout ne peut capituler nulle part, donc décrochait le critère sans lire. Seule une manche où l'aplomb s'exerce contre une lecture juste démontre quelque chose. La satisfaction par vacuité reste refusée, comme `kinds-found-including` chez `g1-2` |
| La trace porte, par manche, la **première** et la **dernière** désignation, et rien d'autre | Tout le reste — démasquée, contredite, capitulation — se recalcule depuis ces deux identifiants et la configuration. Un champ dérivé de plus ne serait qu'une surface à forger, la leçon de la trace de `defect-hunt` |
| **Aucun chronomètre** dans ce jeu | Le voisin `g1-2` porte déjà le temps dans ce groupe. Ici le temps de réflexion est précisément ce qu'on veut laisser libre : presser une décision qu'on mesure sous contradiction mesurerait le réflexe, pas la tenue |
| Deux critères, pesés **2 · 2**, tous deux sur la seule dimension `verification` | Le mapping `intervention` du placeholder disparaît, comme il a disparu de `g1-2` : les six premiers groupes portent la signature, seul le septième porte les axes du référentiel officiel. Les deux critères pèsent pareil parce que la story les met sur le même plan — savoir, et tenir ce qu'on sait |
| Le corpus tient **quatre manches de quatre affirmations** | Le seuil « au moins 3 sur 4 » laisse une manche de marge, ce qui correspond à ce qu'un lot d'affirmations proches autorise. À trois manches, le seuil devient « deux erreurs interdites sur trois » et le critère cesse d'être une proportion |
| La révélation de fin de manche montre la vérification de **toutes** les affirmations, pas seulement de la menteuse | L'acceptance exige que les vraies soient vérifiables. Ne révéler que la menteuse laisserait le joueur croire que les trois autres sont vraies sur parole, ce qui est exactement l'habitude que ce produit mesure |
