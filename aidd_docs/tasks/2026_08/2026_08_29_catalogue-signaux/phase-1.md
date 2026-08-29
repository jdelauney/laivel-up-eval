---
status: pending
---

# Instruction: Les contrats — faisceau de preuves et catalogue

## Socle en place

> Le domaine et l'infrastructure sont importés et verts (`typecheck`, `lint`, `test`). Cette phase s'y greffe, elle ne les refait pas.

| Acquis | Fichier | Ce que la phase en réutilise |
| --- | --- | --- |
| Frontière de validation | `src/core/contracts/helpers/parse-config.helper.ts` | `ConfigValidationError(source, field, message)`, le chemin de champ, et `parseConfiguration(rawGrid, rawCourse, rawSignature)` qui refuse déjà une dimension de parcours absente de la grille et de la signature |
| Contrat de grille | `src/core/contracts/grid.schema.ts` | `dimensionScaleSchema` porte déjà la règle « part de 0, monte strictement » : les `steps` du catalogue la rejouent, ils ne l'inventent pas |
| Statut de mesure | `src/core/ports/scoring-strategy.interface.ts` | `DimensionScore.measured` distingue déjà « non visée » de « visée et ratée ». Le faisceau de preuves doit produire la même distinction, sous le même mot |
| Modèle de registre | `src/core/registry/game-registry.ts` + `src/games/register-games.ts` | Le registre de règles de la phase 2 en est la copie : `resolve` lève en se nommant, un seul point de câblage |
| Convention de port | `src/core/ports/*.interface.ts` | Interface nue, commentaire d'intention, aucun détail d'implémentation |
| Point de câblage unique | `src/composition-root.ts` | `composeFrom(rawGrid, rawCourse, rawSignature)` charge les JSON et rend `ready` ou `invalid-config` porteur du champ fautif. Le catalogue entre par là, et par nulle autre porte |
| Couture d'adapter | `src/infrastructure/persistence/local-session-storage.adapter.ts` | Sa dépendance externe (`Storage`) est injectée au constructeur, avec le défaut réel en production. L'adapter dossier de la phase 3 injecte son lecteur de fichiers de la même façon |
| Déterminisme | `src/infrastructure/clock/fixed.adapter.ts` | `FixedClock` avance d'un pas constant : c'est l'horloge du banc de la phase 4, aucun `Date` direct |
| Données de configuration | `config/grid.json`, `config/course.json`, `config/signature.json` | La grille officielle et la signature sont sur le disque : les axes que le catalogue peut viser sont déjà connus, ils ne sont plus hypothétiques |

Écarts relevés à l'import, tranchés :

- `parse-config.helper.ts` vit sous `contracts/helpers/`, pas directement sous `contracts/` : l'arbre ci-dessous est aligné sur le disque.
- `src/core/store/session.store.ts` doublonnait `src/store/session.store.ts`. Supprimé : `core/` est le domaine pur, l'état UI Zustand vit sous `src/store/`.
- Les helpers à plat des phases 2 à 4 restent à plat : `helpers/` est réservé au calcul pur partagé (`dimension-band.helper.ts`), tandis qu'`axis-score.ts` et `evidence-precedence.ts` sont des unités de scoring, au même rang que `weighted-mapping.strategy.ts`.
- `src/providers/` est une zone nouvelle, absente de `TECHNICAL.md` §3 et de la carte du code. Elle ne concerne pas cette phase, mais elle doit y entrer.

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
├── config/
│   └── signals.json                                    ✅ squelette versionné, catalogue vide
├── src/
│   ├── composition-root.ts                             ✏️ le catalogue rejoint grille, parcours et signature
│   └── core/
│       ├── contracts/
│       │   ├── evidence-bundle.schema.ts               ✅ le format interne normalisé
│       │   ├── signals-catalog.schema.ts               ✅ le contrat du catalogue
│       │   └── helpers/
│       │       └── parse-config.helper.ts              ✏️ en place avec le socle, étendu au catalogue
│       └── ports/
│           └── evidence-source.interface.ts            ✅ le port d'entrée des adapters
└── __tests__/unit/
    ├── core/contracts/
    │   ├── signals-catalog.schema.test.ts              ✅
    │   ├── evidence-bundle.schema.test.ts              ✅
    │   └── parse-config.helper.test.ts                 ✅ la validation croisée catalogue × grille
    └── composition-root.test.ts                        ✅ un catalogue hors contrat n ouvre pas de session
```

## User Journey

```mermaid
flowchart TD
  A[config/signals.json] --> B[parse-config.helper]
  B -->|valide| C[catalogue typé]
  B -->|invalide| D[erreur nommant le champ fautif]
  E[une source de preuves] --> F[EvidenceSource]
  F --> G[faisceau de preuves normalisé]
```

## Test Scope

```mermaid
---
title: Test scope
---
journey
  section Setup
    charger un grid.json et un signals.json minimaux => schémas prêts: 5: system
  section Happy path
    valider un catalogue bien formé => catalogue typé, chaque signal porte son axe et ses seuils: 5: system
    valider un faisceau de preuves complet => chaque signal porte sa valeur et sa source: 5: system
  section Edge case - axe inconnu
    un signal vise une dimension absente de la grille et de la signature => valider le catalogue => refus au chargement nommant le signal et la dimension: 1: system
  section Edge case - seuils non croissants
    les crans d un signal ne montent pas => valider le catalogue => refus au chargement nommant le signal: 1: system
  section Edge case - valeur flottante
    une mediane vaut 251.5 => valider le faisceau => acceptee sans arrondi: 1: system
  section Edge case - preuve absente
    aucune valeur pour un axe => valider le faisceau => statut non mesure, jamais zero: 1: system
```

## Tasks to do

### `1)` Le schéma du faisceau de preuves

> Le format interne que tout adapter produit, et la seule chose que le moteur sait lire.

1. Créer `evidence-bundle.schema.ts` : un faisceau porte une période, une liste d'observations, et rien d'autre.
2. Une observation porte : `signalId`, `value` (nombre, booléen, ou liste de chemins), `source` (le fichier ou l'artefact d'où elle sort), `family` (`repo` ou `course`).
3. Accepter les valeurs flottantes pour toute médiane.
4. Exporter les types par `z.infer`, aucune classe — comme `grid.schema.ts` et `course.schema.ts`.
5. L'absence d'observation se dit par l'absence d'entrée, jamais par une valeur sentinelle : c'est ce que la phase 3 relit pour poser `measured`, au sens de `DimensionScore.measured`.

### `2)` Le schéma du catalogue

> Un signal est une règle de lecture déclarée, jamais du code.

1. Créer `signals-catalog.schema.ts` : un signal porte `id`, `axis`, `rule` (type discriminant + paramètres), `steps` (la valeur seuil par cran, avec le libellé du cran), `family`, et `confidence`.
2. Les `steps` montent strictement, comme les échelles de la grille.
3. Discriminer les paramètres de `rule` par le type, pour qu'un paramètre étranger soit refusé.

### `3)` Le port d'entrée

> Le moteur ignore d'où viennent les preuves.

1. Créer `evidence-source.interface.ts` : une méthode qui rend un faisceau de preuves, et le nom de la source.
2. Interface petite et ciblée, aucun détail de dossier ni de réseau.

### `4)` La validation au chargement

> Ces JSON s'éditent à la main sous pression : l'erreur doit nommer le champ.

1. Ajouter `parseSignalsCatalog` à `contracts/helpers/parse-config.helper.ts`, sur le `validate` + `fail` déjà en place : l'erreur reste une `ConfigValidationError` portant `source` et `field`.
2. Ouvrir `parseConfiguration` à un quatrième argument optionnel `rawSignals`, et croiser les axes du catalogue contre le `knownDimensions` déjà calculé — la même passe qui contrôle les mappings de parcours, pas une seconde.
3. Refuser au chargement un signal dont l'axe n'est déclaré ni par la grille ni par la signature, en nommant les deux.
4. Refuser au chargement des `steps` qui ne montent pas.
5. Poser `config/signals.json` à côté de `grid.json`, `course.json` et `signature.json`, avec sa version et un catalogue vide, valide contre le schéma.
6. Élargir `composeFrom` au catalogue et le charger dans `composeApp`. C'est le seul fichier à toucher hors `core/` : la branche `invalid-config` existe déjà et rattrape la `ConfigValidationError` sans être réécrite.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | Un faisceau sans observation pour un axe se charge et laisse cet axe sans valeur, il ne le pose pas à zéro |
| 1 | Une médiane à `251.5` traverse le schéma sans perte |
| 2 | Un signal dont les crans décroissent est refusé, le message nomme le signal |
| 2 | Un paramètre qui n'appartient pas au type de règle déclaré est refusé |
| 3 | Le moteur compile sans importer aucun adapter concret |
| 4 | Un signal visant `qualite` alors que ni la grille ni la signature ne la déclarent est refusé au chargement, le message nomme le signal et la dimension |
| 4 | `config/signals.json` vide se charge sans erreur |
| 4 | `parseConfiguration` appelé sans catalogue se comporte exactement comme avant : les appels du socle ne changent pas |
| 4 | Un `signals.json` hors contrat rend `composeFrom` en `invalid-config` portant le champ fautif, sans lever, exactement comme une grille malformée |
