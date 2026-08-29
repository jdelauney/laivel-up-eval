---
status: implemented
---

# Instruction: L'évaluateur et ses quatre règles

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
├── src/games/three-tracks/
│   ├── helpers/
│   │   └── median.helper.ts                  ✅ la médiane, isolée parce qu elle est la mesure
│   └── three-tracks.evaluator.ts             ✅ le point de contact avec le port GameEvaluator
└── __tests__/unit/games/three-tracks/
    ├── median.test.ts                        ✅
    └── evaluator.test.ts                     ✅
```

## User Journey

```mermaid
flowchart TD
  A[le moteur passe la trace, la config et les critères] --> B[la partie est rejouée depuis les allocations]
  B --> C{la règle du critère}
  C -->|merged-at-least| D[le nombre de chantiers mergés atteint-il le palier]
  C -->|no-abandoned-track| E[aucun chantier n est perdu]
  C -->|median-live-tracks-at-least| F[la médiane des vivants atteint-elle le palier]
  C -->|règle inconnue| G[une erreur nommée]
  D --> H[un verdict binaire par critère]
  E --> H
  F --> H
```

## Test Scope

```mermaid
---
title: Test scope
---
journey
  section Setup
    construire une configuration de quatre chantiers et une trace jouee => la partie est rejouable: 5: api
  section Happy path
    evaluer une partie ou trois chantiers sont merges sans perte => les quatre criteres sont satisfaits: 5: api
  section Edge case - quatre ouverts puis trois abandonnes
    jouer un seul chantier jusqu au merge et laisser mourir les trois autres => seul le palier d un chantier est satisfait: 1: api
  section Edge case - la mediane ignore le pic
    garder quatre chantiers vivants sur les deux premiers tours puis n en tenir qu un => le critere de mediane n est pas satisfait: 1: api
  section Edge case - la trace ne decide rien
    forger les compteurs du journal dans la trace => le verdict est celui des allocations rejouees: 1: api
  section Edge case - une regle inconnue
    evaluer un critere dont la regle n existe pas dans ce jeu => une erreur nommee est levee: 1: api
```

## Tasks to do

### `1)` La médiane

> Elle porte la mesure du jeu. Elle vit dans son propre helper, pour se tester seule.

1. Créer `helpers/median.helper.ts` : la médiane d'une suite de nombres.
2. Trier une copie, ne jamais muter l'entrée.
3. Nombre pair de valeurs : la moyenne des deux du milieu. Le nombre de tours vient du parcours, il n'est pas forcément impair.
4. Documenter pourquoi la médiane et pas le maximum : le référentiel dit « habituellement », et un pic isolé ne compte pas.

### `2)` L'évaluateur

> Le point de contact public avec le port. Il interprète des règles déclaratives, il ne les code pas en dur.

1. Créer `three-tracks.evaluator.ts` à la racine du dossier du jeu, jamais sous `actions/`.
2. Parser la configuration, parser la trace contre elle, puis **rejouer** la partie depuis les seules allocations.
3. Ne jamais lire les compteurs du journal de la trace : une trace forgée ne doit changer aucun verdict.
4. Implémenter `merged-at-least`, paramétrée par un palier : le nombre de chantiers mergés l'atteint-il.
5. Implémenter `no-abandoned-track` : aucun chantier n'est perdu. C'est le garde-fou, celui qui coupe la voie du joueur qui ouvre large et lâche.
6. Implémenter `median-live-tracks-at-least`, paramétrée par un palier : la médiane du relevé de vivants par tour l'atteint-elle.
7. Une règle inconnue lève une erreur nommée, sur le modèle de `UnknownRuleError` de `checkpoints`.
8. Valider les paramètres de chaque règle par un schéma Zod local, comme le fait `checkpoints` pour `stage` et `threshold`.
9. Aucun accès au store, aucun effet de bord, aucune connaissance des autres jeux.

### `3)` Les tests

1. Une partie à trois merges sans perte satisfait les quatre critères.
2. Le piège : un merge et trois morts ne satisfait que le palier d'un chantier.
3. Le pic : quatre vivants sur les premiers tours puis un seul jusqu'à la fin ne satisfait pas la médiane.
4. Une trace dont les compteurs de journal sont faux rend le même verdict qu'une trace honnête aux mêmes allocations.
5. Une règle inconnue lève, elle ne rend pas un critère manqué.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | La médiane d'un nombre pair de valeurs est la moyenne des deux du milieu |
| 1 | La suite passée n'est pas mutée |
| 2 | Un joueur qui ouvre quatre chantiers et n'en mène qu'un au merge ne satisfait que le palier d'un chantier |
| 2 | Un pic de quatre chantiers vivants sur deux tours ne satisfait pas le critère de médiane |
| 2 | Le verdict ne change pas quand les compteurs du journal de la trace sont forgés |
| 2 | Un chantier perdu fait manquer le critère de garde-fou, même si trois autres sont mergés |
| 2 | Une règle absente du jeu lève une erreur qui la nomme |
