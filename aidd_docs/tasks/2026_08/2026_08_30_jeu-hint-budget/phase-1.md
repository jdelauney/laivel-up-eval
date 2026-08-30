---
status: done
---

# Instruction: Les contrats et la lecture pure des situations

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
├── src/games/hint-budget/
│   ├── schema/
│   │   ├── config.schema.ts                    ✅ ce qu un auteur de parcours écrit, et ses neuf refus
│   │   └── answer.schema.ts                    ✅ la trace du cadrage, des achats et de la tranche
│   └── helpers/
│       └── read-situations.helper.ts           ✅ la lecture pure, partagée par l écran et l évaluateur
└── __tests__/unit/games/hint-budget/
    ├── config.schema.test.ts                   ✅
    ├── answer.schema.test.ts                   ✅
    └── read-situations.test.ts                 ✅
```

## Test Scope

```mermaid
---
title: Test scope
---
journey
  section Setup
    construire une configuration de trois situations, chacune avec une cause réelle et un cadrage mixte => elle passe le schéma: 5: system
  section Happy path
    lire une trace où le joueur cadre juste puis tranche juste avec un indice => la lecture rend une situation résolue, cadrée en premier, fondée, au coût du seul indice: 5: system
  section Edge case - deux causes réelles
    déclarer deux causes actual dans la même situation => le schéma refuse et nomme la situation: 1: system
  section Edge case - aucune cause réelle
    déclarer une situation dont aucune cause n est actual => le schéma refuse et nomme la situation: 1: system
  section Edge case - cadrage d une seule nature
    déclarer une situation dont toutes les lectures sont établies => le schéma refuse et nomme la situation: 1: system
  section Edge case - surtaxe insuffisante
    déclarer une surtaxe d aveugle inférieure ou égale à l indice le plus cher => le schéma refuse et nomme les deux montants: 1: system
  section Edge case - trace incomplète
    omettre une situation de la trace => la lecture refuse et nomme la situation manquante: 1: system
  section Edge case - référence inconnue
    trancher une cause absente de la situation => la lecture refuse et nomme l identifiant: 1: system
  section Edge case - cadrage forgé
    déclarer un cadrage posé après plus d indices qu il n en a été acheté => la lecture refuse: 1: system
  section Edge case - achat en double
    acheter deux fois le même indice dans une situation => le schéma refuse: 1: system
  section Edge case - tranche à l aveugle et fausse
    trancher sans aucun indice et se tromper => le coût dépasse celui de la même erreur après l indice le plus cher: 1: system
  section Edge case - cadrage partiel
    ne retenir qu une partie des lectures établies => le cadrage n est pas fondé: 1: system
  section Edge case - cadrage tardif
    poser un cadrage exact après un premier achat => le cadrage est fondé mais pas premier: 1: system
```

## Tasks to do

### `1)` Le schéma de configuration

> Ce qu'un auteur de parcours écrit pour ce jeu, et rien de plus.

1. Créer `src/games/hint-budget/schema/config.schema.ts`.
2. Poser `framingSchema` : `id` non vide, `text` non vide, `established` booléen. Documenter le sens des deux valeurs — `established` marque une lecture que le rapport d'incident soutient, l'autre marque une supposition que rien à l'écran n'établit. Les deux se présentent **exactement pareil** au joueur.
3. Poser `hintSchema` : `id` non vide, `label` non vide (ce sur quoi l'indice porte, jamais son contenu), `cost` entier strictement positif, `text` non vide (révélé à l'achat seulement).
4. Poser `causeSchema` : `id` non vide, `text` non vide, `actual` booléen, `verification` non vide — pourquoi cette cause est la bonne, ou pourquoi celle-ci ne l'est pas. Montrée à la révélation uniquement.
5. Poser `situationSchema` : `id` non vide, `symptom` non vide, `report` (au moins 2 lignes non vides — les faits déjà en main, gratuits), `framings` (au moins 3), `hints` (au moins 3), `causes` (au moins 3).
6. Poser le schéma de base : `statement` non vide — même nom que les six autres jeux —, `wrongCutPenalty` entier strictement positif, `blindCutSurcharge` entier strictement positif, `situations` (au moins 2).
7. Ajouter les neuf refus au chargement, en `superRefine`, chacun avec son `path` et sa phrase en français :
   - deux situations de même `id` ;
   - deux indices de même `id` dans une situation ;
   - deux causes de même `id` dans une situation ;
   - deux lectures de cadrage de même `id` dans une situation ;
   - une situation sans aucune cause `actual` — il n'y a rien à résoudre ;
   - une situation à plusieurs causes `actual` — la tranche devient ambiguë ;
   - une situation sans aucune lecture `established` ;
   - une situation sans aucune lecture non `established` ;
   - `blindCutSurcharge` inférieure ou égale au coût de l'indice le plus cher du corpus.
8. Documenter les deux avant-derniers refus comme le **garde-fou anti-triche du cadrage** : sans lecture non établie, « tout cocher » est un cadrage fondé sans avoir rien lu ; sans lecture établie, « ne rien cocher » l'est aussi. C'est le mélange des deux natures qui force à lire le rapport.
9. Documenter le dernier refus comme la **mise en mécanique du quatrième critère d'acceptation** de la story : « trancher sans aucun indice et se tromper coûte plus cher que d'en avoir acheté un » n'est vrai pour n'importe quel indice que si la surtaxe excède strictement le plus cher d'entre eux. Le message nomme les deux montants.
10. Exporter les types `Framing`, `Hint`, `Cause`, `Situation`, `HintBudgetConfig`.

### `2)` Le schéma de trace

> Ce que le joueur a posé, acheté et tranché, dans cet ordre.

1. Créer `src/games/hint-budget/schema/answer.schema.ts`.
2. Poser `framingEntrySchema` : `retainedIds` (tableau de chaînes non vides, possiblement vide — un cadrage qui ne retient rien reste un cadrage posé), `afterHints` entier positif ou nul.
3. Poser `attemptSchema` : `situationId` non vide, `framing` (`framingEntrySchema` ou `null` — `null` veut dire jamais posé), `boughtHintIds` (tableau, possiblement vide, dans **l'ordre d'achat**), `cutCauseId` non vide.
4. Poser `hintBudgetAnswerSchema` : `attempts`, au moins une entrée, plus trois refus de schéma — une situation présente deux fois dans la trace, un indice acheté deux fois dans la même situation, une lecture retenue deux fois dans le même cadrage. Ce sont des défauts de la trace elle-même, indépendants de toute configuration : ils se refusent au niveau du schéma, sur le modèle des doublons de `lie-detector`.
5. Documenter qu'aucun champ dérivé n'entre dans la trace : résolu, frugal, cadrage fondé, cadrage premier et coût se recalculent depuis ces champs et la configuration. `afterHints` est une **position dans le déroulé**, pas un verdict.
6. Poser cinq erreurs nommées : `IncompleteTraceError` (une situation de la configuration n'est pas couverte), `UnknownSituationError`, `UnknownCauseError` (porte l'identifiant fautif **et** la situation), `UnknownHintError` (idem), `UnknownFramingError` (idem), et `ForgedFramingError` — `afterHints` dépasse le nombre d'indices réellement achetés, ce qu'aucun déroulé ne peut produire.
7. Poser `parseHintBudgetTrace(answer, config)` : parse le schéma, puis vérifie la trace contre la configuration — une entrée par situation exactement, chaque identifiant connu de sa situation, `afterHints` cohérent avec les achats.
8. Documenter pourquoi une situation sans tranche n'est pas recevable : trancher est le geste qui clôt une situation, l'écran ne laisse jamais passer une situation sans tranche, donc une trace qui en porte une est forgée.

### `3)` La lecture pure des situations

> Une seule lecture, que l'écran et l'évaluateur partagent.

1. Créer `src/games/hint-budget/helpers/read-situations.helper.ts`.
2. Exporter `SituationReading` : `situationId`, `actualCauseId`, `cutCauseId`, `solved`, `hintsBought`, `hintsTotal`, `blindCut`, `framedFirst`, `framingGrounded`, `framedAndGrounded`, `hintCost`, `cost`.
3. Définir chaque lecture en une ligne de code et une ligne de commentaire :
   - `solved` : la cause tranchée est la cause `actual` ;
   - `blindCut` : aucun indice acheté dans cette situation ;
   - `framedFirst` : un cadrage a été posé, et `afterHints` vaut zéro ;
   - `framingGrounded` : le cadrage retient **exactement** l'ensemble des lectures `established` — toutes, et aucune autre ;
   - `framedAndGrounded` : les deux à la fois, le seul cas qui vaut quelque chose au scoring ;
   - `hintCost` : la somme des `cost` des indices achetés ;
   - `cost` : `hintCost`, plus `wrongCutPenalty` si la tranche est fausse, plus `blindCutSurcharge` si elle est fausse **et** aveugle.
4. Documenter pourquoi `framingGrounded` exige l'ensemble exact et non « au moins une établie, aucune supposée » : la version faible laissait passer la sélection d'une seule ligne au hasard, trop peu cher pour un critère qui pèse la moitié du jeu ; et un brief partiel est du contexte manquant, ce que le produit mesure au même titre que du contexte faux.
5. Documenter pourquoi la surtaxe d'aveugle ne s'applique **que** sur une tranche fausse : la story la conditionne à l'erreur (« trancher sans aucun indice **et se tromper** »). Trancher juste sans indice est une lecture réussie, pas une imprudence.
6. Exporter `Reading` : `situations`, `groundedFramingCount` (le compte de `framedAndGrounded`), `totalCost`.
7. Documenter que le compte de résolutions frugales n'est **pas** ici : sa borne est déclarée dans la règle du parcours, et ce helper est aussi lu par l'écran, qui ne doit rien savoir des seuils.
8. Exporter `readSituations(config, trace): Reading`.

### `4)` Les tests

1. `config.schema.test.ts` : une configuration valide passe ; chacun des neuf refus est vérifié séparément, sur son message et son `path`.
2. `answer.schema.test.ts` : une trace complète passe ; les six erreurs nommées sont levées sur leur cas ; les trois refus de schéma sont vérifiés.
3. `read-situations.test.ts` : cadrage exact posé en premier, cadrage exact posé tard, cadrage partiel, cadrage avec une supposition, cadrage jamais posé, tranche juste, tranche fausse, tranche fausse et aveugle — plus les agrégats. Un test compare explicitement le coût d'une tranche fausse à l'aveugle à celui de la même erreur après l'indice le plus cher.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | Une situation dont toutes les lectures de cadrage sont établies est refusée au chargement, en nommant la situation |
| 1 | Une situation à zéro ou deux causes `actual` est refusée, en nommant la situation |
| 1 | Une configuration dont la surtaxe d'aveugle n'excède pas l'indice le plus cher est refusée, en nommant les deux montants |
| 2 | Une trace qui omet une situation, qui tranche une cause inconnue, ou dont `afterHints` dépasse les achats, lève l'erreur nommée qui porte l'identifiant fautif |
| 2 | Une trace qui achète deux fois le même indice dans une situation est refusée par le schéma |
| 3 | Un cadrage qui retient toutes les lectures établies et aucune supposition rend `framingGrounded: true` ; en retirer une seule établie, ou en ajouter une supposée, le rend `false` |
| 3 | Un cadrage exact posé après un achat rend `framingGrounded: true` et `framedFirst: false`, donc `framedAndGrounded: false` |
| 3 | Une tranche fausse sans aucun indice coûte strictement plus qu'une tranche fausse après l'achat de l'indice le plus cher de la situation |
| 4 | `npm run lint`, `npm run typecheck` et `npm run test` passent |
