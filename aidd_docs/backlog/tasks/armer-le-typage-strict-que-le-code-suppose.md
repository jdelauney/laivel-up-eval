---
type: task
status: ready
related_to:
  - aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
order: 2
---

# Task: Armer le typage strict que le code suppose déjà tenu

## Context

`tsconfig.app.json` n'active ni `strict` ni `noUncheckedIndexedAccess`. Le compilateur ne vérifie donc aucune des gardes que le code écrit à la main, et `npm run typecheck` passe au vert sur des accès qui pourraient rendre `undefined`.

Relevé le 29/08 par la revue du jeu `checkpoints`, qui l'a classé mineur et renvoyé à un lot séparé : c'est une bascule d'outillage qui touche tout l'arbre, pas une correction de ce jeu. Le code du jeu s'appuie pourtant dessus, et chaque jeu suivant héritera du même terrain.

## Outcome

Le compilateur tient les gardes que le code tient aujourd'hui par discipline, et une régression de nullité casse `npm run typecheck` au lieu de casser une partie.

## Scope

- Inclus : activer `strict` et `noUncheckedIndexedAccess` dans `tsconfig.app.json`, puis corriger les sites que le compilateur révèle.
- Inclus : traiter chaque site par une garde explicite ou un affinage de type, jamais par une assertion non nulle qui déplacerait le problème à l'exécution.
- Exclu : toute réécriture de logique. Un site révélé se corrige au typage, pas en changeant ce que le code fait.
- Exclu : `tsconfig.node.json` et la configuration de build, hors du périmètre applicatif.

## Evidence

- `tsconfig.app.json:21` — la section `/* Linting */` porte `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, et rien de plus.
- `src/games/checkpoints/helpers/run-simulation.helper.ts:53` — un type `Stage | undefined` que rien n'oblige à garder.
- `src/games/checkpoints/checkpoints.evaluator.ts:72` — `decisions[heaviest].cost`, accès indexé non gardé. La garde tient parce que `heaviest` vient d'un `forEach` sur ce même tableau, pas parce que le compilateur l'exige.
- `aidd_docs/tasks/2026_08/2026_08_29_jeu-checkpoints/review.md` — constat mineur `conform`, avec le renvoi au lot séparé.

## Done When

- `strict` et `noUncheckedIndexedAccess` sont actifs et `npm run typecheck` passe au vert.
- `npm run test` passe au vert sans qu'un test ait été assoupli.
- Aucune assertion non nulle (`!`) n'a été ajoutée pour faire taire le compilateur.
