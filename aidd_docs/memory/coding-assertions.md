# Coding Assertions

Câblées par Lefthook (`lefthook.yml`), donc réellement exécutées.

## Avant commit

| Ordre | Commande | Vérifie |
| --- | --- | --- |
| 1 | `npx biome check --write --no-errors-on-unmatched <staged>` | lint, format, tri des imports, corrigés puis restagés |

Le glob porte sur `{src,__tests__,config}/**/*.{ts,tsx,json}`. `src/components/ui` est exclu par `biome.json` : les primitifs shadcn viennent de la CLI et ne se reformatent pas.

## Avant push

| Ordre | Commande | Vérifie |
| --- | --- | --- |
| 1 | `npm run typecheck` | `tsc -b --noEmit` |
| 2 | `npm run test` | `vitest run` |

Les deux tournent en parallèle. Quand le banc de calibration existera, il tourne ici : les profils de référence détectent une régression de scoring à chaque ajustement de seuil ou de mapping.

## Conventions vérifiées par la config

- Guillemets simples, point-virgules seulement quand nécessaires, indentation en espaces.
- `noUnusedVariables` et `noExplicitAny` en `error`.
- Fichiers en kebab-case avec suffixe de type : `*.interface.ts`, `*.adapter.ts`, `*.facade.ts`, `*.command.ts`, `*.entity.ts`, `*.store.ts`, `*.schema.ts`, `*.evaluator.ts`, `use-*.hook.ts`, `*.action.ts`, `*.helper.ts`. Un composant React n'a pas de suffixe : son dossier atomique porte le rôle.
- Un adapter ne préfixe pas son port : `infrastructure/ai-assistant/openai.adapter.ts`, jamais `ai-assistant-openai.adapter.ts`.

## Comportement

S'il faut corriger, lancer un agent par assertion en échec (typecheck / tests / règles UI = 3 agents).
