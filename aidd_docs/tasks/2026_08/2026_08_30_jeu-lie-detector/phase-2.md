---
status: pending
---

# Instruction: L'évaluateur et ses deux règles

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
├── src/games/
│   ├── lie-detector/
│   │   └── lie-detector.evaluator.ts           ✅ le point de contact public avec le port
│   └── register-games.ts                       ✏️ un bloc de plus, rien d autre ne bouge
└── __tests__/unit/games/lie-detector/
    └── evaluator.test.ts                       ✅
```

## Test Scope

```mermaid
---
title: Test scope
---
journey
  section Setup
    enregistrer le jeu dans le registre et lui donner une configuration de quatre manches => le registre le résout par son type: 5: system
  section Happy path
    évaluer une trace de quatre manches démasquées et tenues => les deux critères ressortent satisfaits: 5: system
  section Edge case - sous le seuil d identification
    évaluer une trace de deux manches démasquées sur quatre contre un seuil de trois => le premier critère ressort manqué: 1: system
  section Edge case - une capitulation
    évaluer une trace qui abandonne une désignation juste sous contradiction => le second critère ressort manqué: 1: system
  section Edge case - jamais contredit
    évaluer une trace dont chaque désignation vise la cible de l objection => le second critère ressort manqué, jamais satisfait par vacuité: 1: system
  section Edge case - règle inconnue
    évaluer un critère dont la règle n est pas connue du jeu => une erreur nommée est levée: 1: system
  section Edge case - déterminisme
    évaluer deux fois la même trace => le verdict est identique: 1: system
```

## Tasks to do

### `1)` L'évaluateur

> Il interprète des règles déclaratives : déplacer un seuil se fait dans le parcours, pas ici.

1. Créer `src/games/lie-detector/lie-detector.evaluator.ts`, à la **racine** du dossier du jeu et non sous `actions/` : c'est le point de contact public avec le port `GameEvaluator`.
2. Parser la configuration, puis la trace via `parseLieDetectorTrace`, puis lire les manches **une seule fois** via `readRounds` — jamais un recalcul propre à chaque règle.
3. Poser `lies-unmasked-at-least` : `unmaskedCount >= threshold`, borne incluse, le seuil lu dans la règle.
4. Poser `no-capitulation` : satisfait quand `contradictedCount > 0` **et** `capitulationCount === 0`. Sans seuil : la règle ne tolère aucune capitulation, et son nom le dit.
5. Documenter en commentaire le refus de la vacuité sur `no-capitulation` — un joueur que l'assistant n'a jamais contredit n'a rien démontré, et la jurisprudence du projet est `kinds-found-including` chez `defect-hunt`, où un critère sans matière ressort manqué.
6. Poser `UnknownRuleError` sur le modèle des cinq autres jeux, avec le type de règle et le nom du jeu dans le message.
7. Grouper les lectures que les règles consomment dans un type `VerdictInputs` local plutôt que d'allonger la signature : la limite du projet est de cinq paramètres.

### `2)` Le câblage domaine

1. Ajouter le bloc `lie-detector` dans `src/games/register-games.ts` : évaluateur, `configSchema`, `answerSchema`. Rien d'autre ne bouge dans ce fichier.

### `3)` Les tests

1. `evaluator.test.ts` : les six situations du Test Scope, chacune sur une trace construite à la main.
2. Vérifier le déterminisme explicitement : deux appels sur la même trace rendent le même tableau de verdicts.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | Une trace de quatre manches démasquées sans capitulation satisfait les deux critères |
| 1 | Une trace dont aucune manche n'a été contredite fait ressortir `no-capitulation` manqué |
| 1 | Une règle absente du jeu lève `UnknownRuleError` en nommant la règle et le jeu |
| 2 | Le registre résout `lie-detector` vers son évaluateur et ses deux schémas |
| 3 | `npm run lint`, `npm run typecheck` et `npm run test` passent |
