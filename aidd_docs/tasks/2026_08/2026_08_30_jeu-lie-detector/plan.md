---
objective: "Le jeu lie-detector se joue de bout en bout à la place du placeholder g1-3, mesure la désignation d'une affirmation menteuse puis sa tenue sous contradiction sur la dimension verification, et n'oblige aucun contrat existant à bouger."
status: pending
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
| Le corpus porte les deux natures d'objection, **fondée** (elle pointe la menteuse) et **creuse** (elle pointe une vraie), et le schéma refuse un corpus qui n'en porterait qu'une | C'est le garde-fou anti-triche du jeu. Toutes creuses, « ne jamais bouger » gagne sans lire ; toutes fondées, « toujours suivre » gagne sans lire. Le mélange rend toute politique fixe perdante, et c'est la seule chose qui force à lire les affirmations |
| L'identification se lit sur la désignation **finale**, la stabilité sur le passage de la première à la finale | Deux critères, deux lectures de la même trace. Lire l'identification sur la première désignation punirait une correction juste ; ne lire que la finale rendrait le retournement invisible |
| **Une capitulation est l'abandon d'une désignation juste**, jamais un changement d'avis quelconque | Un critère qui punirait tout changement mesurerait l'entêtement et l'appellerait rigueur. Corriger une erreur ne coûte rien ; lâcher la vérité sous l'aplomb coûte |
| Une manche où l'objection pointe ce que le joueur a désigné **ne compte pas** pour la stabilité, et un joueur jamais contredit **rate** le critère | L'assistant n'y exerce aucune pression : il confirme. Compter cette manche comme une résistance noterait sans mesurer. Et la satisfaction par vacuité est refusée, comme `kinds-found-including` chez `g1-2` — un critère sans matière ressort manqué |
| La trace porte, par manche, la **première** et la **dernière** désignation, et rien d'autre | Tout le reste — démasquée, contredite, capitulation — se recalcule depuis ces deux identifiants et la configuration. Un champ dérivé de plus ne serait qu'une surface à forger, la leçon de la trace de `defect-hunt` |
| **Aucun chronomètre** dans ce jeu | Le voisin `g1-2` porte déjà le temps dans ce groupe. Ici le temps de réflexion est précisément ce qu'on veut laisser libre : presser une décision qu'on mesure sous contradiction mesurerait le réflexe, pas la tenue |
| Deux critères, pesés **2 · 2**, tous deux sur la seule dimension `verification` | Le mapping `intervention` du placeholder disparaît, comme il a disparu de `g1-2` : les six premiers groupes portent la signature, seul le septième porte les axes du référentiel officiel. Les deux critères pèsent pareil parce que la story les met sur le même plan — savoir, et tenir ce qu'on sait |
| Le corpus tient **quatre manches de quatre affirmations** | Le seuil « au moins 3 sur 4 » laisse une manche de marge, ce qui correspond à ce qu'un lot d'affirmations proches autorise. À trois manches, le seuil devient « deux erreurs interdites sur trois » et le critère cesse d'être une proportion |
| La révélation de fin de manche montre la vérification de **toutes** les affirmations, pas seulement de la menteuse | L'acceptance exige que les vraies soient vérifiables. Ne révéler que la menteuse laisserait le joueur croire que les trois autres sont vraies sur parole, ce qui est exactement l'habitude que ce produit mesure |
