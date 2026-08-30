---
status: done
---

# Instruction: L'évaluateur et ses deux règles

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
├── src/games/hint-budget/
│   └── hint-budget.evaluator.ts                ✅ le point de contact public avec le port
└── __tests__/unit/games/hint-budget/
    └── evaluator.test.ts                       ✅
```

## Test Scope

```mermaid
---
title: Test scope
---
journey
  section Setup
    construire une configuration de trois situations et deux critères déclaratifs => l évaluateur les accepte: 5: system
  section Happy path
    évaluer une trace où deux situations sont résolues avec au plus deux indices sur cinq et cadrées d entrée => les deux critères ressortent satisfaits: 5: system
  section Edge case - résolu mais dispendieux
    résoudre les trois situations en achetant quatre indices sur cinq => le critère de frugalité ressort manqué: 1: system
  section Edge case - frugal mais faux
    trancher sans indice et se tromper partout => le critère de frugalité ressort manqué: 1: system
  section Edge case - cadrage tardif
    poser un cadrage exact après le premier achat dans les trois situations => le critère de cadrage ressort manqué: 1: system
  section Edge case - cadrage jamais posé
    ne jamais poser de cadrage => le critère de cadrage ressort manqué: 1: system
  section Edge case - seuil de partage strict
    résoudre en achetant exactement la moitié des indices => la situation ne compte pas comme frugale: 1: system
  section Edge case - règle inconnue
    déclarer un critère dont le type n est pas connu du jeu => l évaluateur lève une erreur nommée: 1: system
```

## Tasks to do

### `1)` L'évaluateur

> Il interprète des règles déclaratives : déplacer un seuil se fait dans le parcours, jamais ici.

1. Créer `src/games/hint-budget/hint-budget.evaluator.ts`, à la **racine** du dossier du jeu et non sous `actions/` : c'est le point de contact public avec le port `GameEvaluator`.
2. Implémenter `HintBudgetEvaluator implements GameEvaluator`. `evaluate(answer, config, criteria)` parse la configuration, parse la trace contre elle (`parseHintBudgetTrace`), lit les situations **une seule fois** avec `readSituations`, puis applique chaque règle sur cette lecture.
3. Poser `frugalSolvesAtLeast(situations, rule)` : la règle lit `share` et `threshold`. Une situation compte quand elle est **résolue** et que `hintsBought < hintsTotal * share`. L'inégalité est **stricte** : la story dit « moins de la moitié », pas « au plus la moitié ». Documenter que les deux membres sont exigés — un joueur qui n'achète rien et se trompe partout serait autrement le plus frugal du parcours.
4. Poser `groundedFramingsAtLeast(groundedFramingCount, rule)` : la règle lit `threshold`, le compte vient de `Reading.groundedFramingCount`, qui n'agrège que les situations à la fois cadrées d'entrée et fondées.
5. Documenter pourquoi le compte frugal se calcule ici et pas dans le helper : sa borne (`share`) est déclarée dans le parcours, et le helper est aussi lu par l'écran, qui ne doit rien savoir des seuils. C'est le seul agrégat paramétré du jeu.
6. Valider chaque `rule` par un schéma Zod local, sur le modèle de `lie-detector` : `z.object({ share: z.number().positive(), threshold: z.number() })` et `z.object({ threshold: z.number() })`.
7. Lever `UnknownRuleError` sur un type de règle inconnu, avec le nom du jeu dans le message.
8. Déclarer le type local `VerdictInputs` : tout ce qu'une règle peut lire, et rien de plus.

### `2)` Les tests

1. `evaluator.test.ts` : les deux règles sur leur cas satisfait et leur cas manqué, la borne stricte du partage vérifiée à la valeur exacte, la règle inconnue, et une trace incohérente qui remonte l'erreur du parse plutôt qu'un verdict.
2. Un test doit casser si `frugal-solves-at-least` cesse d'exiger la résolution : une trace à zéro indice et zéro bonne réponse ne doit jamais satisfaire le critère.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | Une trace qui achète exactement la moitié des indices d'une situation ne fait pas compter cette situation comme frugale |
| 1 | Une trace sans aucun achat et sans aucune bonne cause ne satisfait pas le critère de frugalité |
| 1 | Un cadrage exact mais posé après un achat ne fait pas compter la situation pour le critère de cadrage |
| 1 | Un critère dont le `rule.type` est inconnu lève une erreur nommée qui cite le type et le jeu |
| 2 | `npm run lint`, `npm run typecheck` et `npm run test` passent |
