---
objective: "Le jeu hint-budget se joue de bout en bout à la place du placeholder g2-1, mesure sur la dimension pilotage-contexte si le joueur cadre avant d'interroger et s'il tranche en achetant peu d'indices, et n'oblige aucun contrat existant à bouger."
status: in-progress
---

# Plan: Le jeu `hint-budget`, cadrer avant de demander, payer chaque indice

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Mesurer si un joueur pose le contexte avant d'interroger l'assistant, et s'il résout un incident en achetant le moins d'indices possible |
| **Source** | `aidd_docs/backlog/stories/acheter-des-indices-a-contrecoeur.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` · `config/signature.json` · `DESIGN.md` |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | Les contrats et la lecture pure des situations | [`phase-1.md`](./phase-1.md) |
| 2 | L'évaluateur et ses deux règles | [`phase-2.md`](./phase-2.md) |
| 3 | Le jeu à l'écran : cadrer, acheter, trancher | [`phase-3.md`](./phase-3.md) |
| 4 | Le jeu dans le parcours, et son corpus | [`phase-4.md`](./phase-4.md) |
| 5 | La passe impeccable de la surface | [`phase-5.md`](./phase-5.md) |

## Decisions

| Decision | Why |
| --- | --- |
| Le jeu reprend le gabarit **structurel** posé par `checkpoints` et confirmé par `three-tracks`, `confidence-bet`, `defect-hunt` puis `lie-detector` : schéma de configuration, trace + `parse*Trace`, helper pur partagé entre l'écran et l'évaluateur, évaluateur à règles déclaratives, deux blocs de câblage | Septième jeu du parcours. Un jeu qui structurerait son état autrement obligerait à relire la mécanique de plugin à chaque ajout. Le gabarit est structurel, jamais visuel : la surface de ce jeu se dessine à son tour, en phase 5 |
| Le type du jeu est **`hint-budget`**, pas `hint-market` ni `hint-shop` | Nommer par l'intention, pas par le mécanisme. Ce qui est mesuré est l'économie de la demande, pas la vitrine où l'on clique. `repo-kit` portera plus tard une vraie boutique (`DESIGN.md`, « une boutique suivie de vagues ») : deux noms de commerce voisins auraient brouillé les deux |
| Le geste de cadrage est **la transmission du contexte à l'assistant**, pas un texte libre | Rien de libre n'est notable sans modèle, et le brief interdit tout appel distant pendant une partie. Le cadrage est donc une sélection : parmi les lectures proposées de l'incident, celles que le joueur transmet. C'est exactement le cran `0.35` de `pilotage-contexte` — « cadre la demande avant de générer » |
| Un cadrage est **fondé** quand il retient *toutes* les lectures que le rapport établit et *aucune* qu'il n'établit pas | « Au moins une vraie, aucune fausse » laissait passer la sélection d'une seule ligne au hasard : 3 chances sur 5 par situation, trop peu cher pour un critère qui pèse la moitié du jeu. L'exigence complète tombe à 1/32 par situation en sélection aveugle. Et elle dit la bonne chose : un brief partiel est du contexte manquant, ce que le produit mesure au même titre que du contexte faux |
| Le corpus doit porter, **par situation**, au moins une lecture établie et au moins une non établie | Garde-fou anti-triche du jeu, sur le modèle du mélange d'objections de `lie-detector`. Sans lecture non établie, « tout cocher » est fondé sans lire. Sans lecture établie, « ne rien cocher » l'est. Refus au chargement, pas au verdict |
| Le cadrage reste possible **après** le premier achat, et le jeu n'impose aucun ordre | Le critère porte sur l'ordre (« une contextualisation posée **avant** le premier indice »). Un écran qui forcerait l'ordre ne mesurerait plus rien : il ferait le geste à la place du joueur. La conséquence engage la phase 5 — ni le cadrage ni le marché d'indices ne peut être privilégié par sa seule position |
| La révélation montre la cause réelle, sa vérification et le relevé du coût — **jamais** si le cadrage était fondé | Choix opposé à celui de `lie-detector`, et pour une raison qui lui est propre : là-bas, l'acceptance exigeait que les vraies affirmations soient vérifiables. Ici, noter le cadrage à l'écran annoncerait le critère (`DESIGN.md`, « un jeu ne dit jamais ce qu'il note ») et transformerait les situations 2 et 3 en formalité pour quiconque a lu la première révélation. Le cadrage est un choix enregistré, pas un verdict rendu |
| Le coût d'un indice est **annoncé**, la sanction d'une tranche fausse ne l'est **jamais** | `DESIGN.md` : « Le coût d'un geste est annoncé, sa conséquence ne l'est jamais. » Le prix figure sur chaque indice avant l'achat ; la pénalité de tranche fausse et la surtaxe de tranche à l'aveugle n'apparaissent qu'au relevé, après coup |
| Le schéma refuse une configuration dont la **surtaxe d'aveugle n'excède pas l'indice le plus cher** | C'est le quatrième critère d'acceptation de la story rendu mécanique : « trancher sans aucun indice et se tromper coûte plus cher que d'en avoir acheté un » n'est vrai pour *n'importe quel* indice que si `blindCutSurcharge > max(cost)`. Une propriété d'économie vérifiée au chargement plutôt qu'espérée à la relecture |
| **Trois situations, cinq indices, cinq causes, cinq lectures de cadrage** chacune | « Moins de la moitié » de cinq indices se lit sans calcul : deux au plus. Cinq causes portent la chance d'un tranchage aveugle à 1/5, donc à 10,4 % pour deux situations résolues sur trois — l'ordre de grandeur retenu chez `lie-detector` (15,6 %). Trois situations laissent une situation de marge sur chacun des deux seuils, comme le corpus de `lie-detector` en laissait une sur quatre |
| Les indices sont **prix croissant à mesure qu'ils tranchent** : le vague est bon marché, le décisif est cher | Sans cet écart, acheter est une décision sans arbitrage — on prend le premier de la liste. C'est l'écart de prix qui rend « cadrer d'abord » rentable en fiction, sans que rien à l'écran ne le dise |
| Le cadrage se **verrouille au dépôt**, une fois par situation | Sans verrou, le joueur tâtonne et il n'existe plus de moment où le cadrage a été posé, donc plus d'ordre à lire. Le verrou est annoncé, comme la désignation de `lie-detector` |
| La trace porte, par situation, le cadrage (**ce qui a été retenu** et **combien d'indices étaient déjà achetés** au moment du dépôt), la suite des indices achetés, et la cause tranchée — rien d'autre | Tout le reste — résolu, frugal, cadrage fondé, cadrage premier, coût — se recalcule depuis ces champs et la configuration. `afterHints` est une position, pas un verdict : un champ dérivé de plus ne serait qu'une surface à forger, la leçon de la trace de `defect-hunt` |
| **Aucun chronomètre** dans ce jeu | Le temps de réflexion est précisément ce qu'on veut laisser libre : la ressource rare du jeu est déjà l'indice. Deux ressources rares en concurrence mesureraient laquelle le joueur préfère, pas comment il cadre |
| Le seul agrégat **paramétré** — le compte de résolutions frugales — se calcule dans la règle, pas dans le helper | Sa borne (`share`) est déclarée dans le parcours. Un helper qui l'appliquerait obligerait à lui passer un paramètre de scoring, alors qu'il est aussi lu par l'écran, qui lui ne doit rien savoir des seuils |
| Deux critères, pesés **2 · 2**, tous deux sur la seule dimension `pilotage-contexte` | Le mapping `harness` du placeholder disparaît, comme il a disparu de `g1-2` et `g1-3` : les six premiers groupes portent la signature, seul le septième porte les axes du référentiel officiel. Les deux critères pèsent pareil parce que la story les met sur le même plan — cadrer avant de demander, et trancher sans se faire porter |
