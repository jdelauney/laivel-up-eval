# Document Technique — Outil d'évaluation du niveau AIDD

> Référence d'architecture et de conventions. À déposer dans `aidd_docs/` et à intégrer à la memory bank du projet (`/aidd-context:02-project-memory`). Toute génération de code par IA doit respecter ce document.

---

## 1. Stack technique

| Domaine | Choix | Notes |
|---|---|---|
| Langage | TypeScript (strict) | |
| UI | React + Vite | |
| Styles | Tailwind CSS | |
| Composants | shadcn/ui (Base UI) | Usage maximal, pas de fioriture, pas de composants custom quand shadcn suffit |
| State management | Zustand | Rôle strictement limité (voir §6) |
| Validation | Zod | Schémas de config, réponses, contrats d'export |
| Formulaires | TanStack Form | Adapter Zod natif — pas de double définition de validation |
| Backend | **Aucun** | App 100 % front. La clé API LLM est saisie par le participant à l'onboarding |
| ~~TanStack Query~~ | Non utilisé | Aucun fetching serveur |

Méthode de travail : framework [AI-Driven Dev](https://github.com/ai-driven-dev/framework) (plugins `aidd-context`, `aidd-dev`, `aidd-pm`, `aidd-refine`, `aidd-vcs`) — spec → plan → implement → review → ship.

---

## 2. Principes d'architecture

### 2.1 Full POO + SOLID strict

- **S**RP — une classe/un module = une responsabilité (evaluator ≠ scoring ≠ persistence ≠ UI).
- **O**CP — ajouter un jeu **n'exige la modification d'aucun fichier existant** hors le point de câblage `register-games.ts`.
- **L**SP — tout evaluator est substituable derrière `game-evaluator.interface.ts`.
- **I**SP — interfaces petites et ciblées (un port par besoin, pas d'interface fourre-tout).
- **D**IP — le domaine (`core/`) ne dépend que d'interfaces ; les implémentations concrètes vivent dans `infrastructure/` et sont injectées.

### 2.2 Clean architecture

- `core/` = domaine pur, **zéro dépendance React**, zéro import depuis `features/`, `games/`, `components/`, `infrastructure/`.
- Le sens des dépendances va toujours **vers le domaine** : UI → facade → ports ← adapters.
- **Entities minimalistes** : uniquement là où il y a invariants ou comportement. `game-session.entity.ts` (invariants de progression : on ne passe pas au groupe suivant sans avoir soumis les jeux du groupe courant) et `evaluation-result.entity.ts` (agrégation critères → score jeu → score groupe). Tout le reste = types inférés de Zod (`z.infer`), pas de classes de cérémonie.

### 2.3 Design patterns imposés

| Pattern | Où | Rôle |
|---|---|---|
| **Strategy** | `game-evaluator.interface.ts`, `scoring-strategy.interface.ts` | Chaque jeu implémente `evaluate(answer, config): CriterionResult[]`. Le moteur ne connaît jamais le détail d'un jeu. |
| **Registry** | `games/register-games.ts` (domaine) + `games/register-components.ts` (interface) | `register(type, { evaluator, configSchema, answerSchema })` côté domaine ; le composant est enregistré à part, parce que `core/` n'importe pas React. `core/registry/` ne porte que `game-registry.ts`, la structure ; les deux fichiers de câblage vivent dans `games/`, à côté de ce qu'ils câblent. Ajouter un jeu = 1 dossier + 1 bloc dans chacun de ces deux fichiers, résolus par le même `type`. |
| **Command** | `submit-answer.command.ts`, `history.command.ts` | Chaque réponse soumise = un Command empilé dans l'historique → trace d'audit unique, rendue par `auditTrail()`, servant à l'export JSON **et** au payload de l'assistant IA. |
| **Facade** | `game-session.facade.ts` | Seul point d'entrée de l'UI : `start()`, `submitAnswer()`, `nextGame()`, `getProgress()`, `getVerdict()`, `auditTrail()`, `storedRun()`, `resume()`, `resetSession()`. Cache registry, evaluators, scoring, persistence, horloge. L'export reste à écrire. |
| **Adapter** | `infrastructure/persistence/`, `infrastructure/clock/` | Implémentations swappables des ports : LocalStorage et horloge système en partie jouée, horloge figée en rejeu. `infrastructure/ai-assistant/` (Anthropic/OpenAI interchangeables, le participant peut avoir l'une ou l'autre clé) est prévu, pas écrit. |

### 2.4 Injection de dépendances

Pas de conteneur DI (trop lourd pour le format hackathon). **Composition root** unique :

```typescript
// composition-root.ts — LE seul endroit où tout se câble
export const composeFrom = (rawGrid, rawCourse, rawSignature) => {
  try {
    const { grid, course, signature } = parseConfiguration(rawGrid, rawCourse, rawSignature);
    return {
      status: 'ready',
      facade: new GameSessionFacade({
        registry: buildGameRegistry(),          // games/register-games.ts
        scoring: new WeightedMappingStrategy(),
        persistence: new LocalSessionStorageAdapter(globalThis.localStorage),
        clock: new SystemClock(),
        grid, course, signature,
      }),
    };
  } catch (error) {
    // une configuration hors contrat n'ouvre pas de session : elle nomme le champ fautif
  }
};
```

Injection par constructeur partout, par **objet de dépendances** et non par arguments positionnels : la façade en prend sept, et un ordre positionnel se casserait au premier ajout. L'instance du Facade est exposée à React via un `React.Context` (`providers/session-context.tsx`) ; aucun composant ne l'importe directement. Le domaine ne dépend que d'interfaces (DIP), jamais d'implémentations concrètes.

Deux règles que le câblage porte, et qui ont un coût si on les oublie :

- **Le câblage prend ses données en paramètre.** `composeFrom()` existe à côté de `composeApp()` pour que la branche de refus soit exerçable sans dépendre des fichiers réels. C'est le chemin du jour J si la grille officielle arrive mal formée.
- **Un adapter ne prend aucune dépendance externe par défaut.** `LocalSessionStorageAdapter` reçoit son `Storage` ici, sans valeur de repli : un défaut lisant un global rendrait l'absence inexprimable et ferait dépendre l'adapter du runtime.

---

## 3. Structure des dossiers

```
src/
├── components/                                    # GLOBAL — 1 sous-dossier par composant nommé
│   ├── ui/                                        # primitifs shadcn (installés par la CLI)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── dialog/
│   │   ├── elements/
│   │   │   └── dialog-close-button.tsx
│   │   ├── composites/
│   │   │   └── confirm-dialog.tsx
│   │   └── sections/
│   │       └── dialog-provider.tsx
│   ├── timer/
│   │   └── elements/
│   │       └── timer.tsx
│   ├── score-badge/
│   │   └── elements/
│   │       └── score-badge.tsx
│   ├── error-boundary/
│   │   └── sections/
│   │       └── error-boundary.tsx
│   ├── page-header/
│   │   ├── elements/
│   │   │   └── page-title.tsx
│   │   └── composites/
│   │       └── page-header.tsx
│   ├── hooks/
│   │   ├── use-timer.hook.ts
│   │   └── use-local-storage-state.hook.ts
│   ├── group-rail/
│   │   ├── composites/
│   │   │   └── group-rail.tsx
│   │   └── helpers/
│   │       └── build-rail.helper.ts
│   └── layout/
│       └── app-layout/
│           └── app-layout.tsx                     # sans niveau atomique : ni état, ni frère
│
├── features/                                      # 1 sous-dossier par fonctionnalité
│   ├── onboarding/
│   │   ├── components/
│   │   │   ├── elements/
│   │   │   │   └── api-key-input.tsx
│   │   │   ├── composites/
│   │   │   │   └── profile-form.tsx
│   │   │   └── sections/
│   │   │       └── onboarding-view.tsx
│   │   ├── hooks/
│   │   │   └── use-onboarding.hook.ts
│   │   ├── actions/
│   │   │   └── save-profile.action.ts
│   │   └── schema/
│   │       └── onboarding-form.schema.ts
│   ├── group-navigation/                          # même gabarit interne
│   ├── scoring-summary/                           # même gabarit interne
│   └── ai-assistant/                              # même gabarit interne
│
├── games/                                         # racine, symétrique de features — système de plugins
│   ├── blind-auction/                             # dossier et type en anglais, label joueur en français
│   │   ├── components/
│   │   │   ├── elements/
│   │   │   │   └── confidence-cursor.tsx
│   │   │   └── composites/
│   │   │       └── blind-auction-game.tsx
│   │   ├── hooks/
│   │   │   └── use-blind-auction.hook.ts
│   │   ├── actions/
│   │   │   └── submit-bid.action.ts
│   │   ├── schema/
│   │   │   ├── config.schema.ts
│   │   │   └── answer.schema.ts
│   │   ├── helpers/
│   │   │   └── calibration.helper.ts
│   │   └── blind-auction.evaluator.ts
│   ├── error-hunt/                                # même gabarit interne
│   └── ...                                        # 1 dossier par jeu
│
├── core/                                          # domaine, zéro dépendance React
│   ├── entities/
│   │   ├── game-session.entity.ts                 # invariants de progression
│   │   └── evaluation-result.entity.ts            # agrégation critères → scores
│   ├── contracts/
│   │   ├── grid.schema.ts
│   │   ├── course.schema.ts
│   │   ├── replay-profile.schema.ts
│   │   ├── session-snapshot.schema.ts             # le contrat de ce qui est persisté
│   │   └── helpers/
│   │       └── parse-config.helper.ts             # valide au chargement, nomme le champ fautif
│   ├── ports/
│   │   ├── game-evaluator.interface.ts
│   │   ├── persistence-session-adapter.interface.ts
│   │   ├── clock.interface.ts
│   │   └── scoring-strategy.interface.ts
│   ├── commands/
│   │   ├── submit-answer.command.ts
│   │   └── history.command.ts
│   ├── registry/
│   │   └── game-registry.ts                       # la structure seule, pas le câblage
│   ├── scoring/
│   │   ├── weighted-mapping.strategy.ts           # critères → dimensions, par poids
│   │   └── helpers/
│   │       ├── dimension-band.helper.ts           # score → bande de l'échelle
│   │       └── level-resolver.helper.ts           # règle du minimum, order décroissant
│   └── session/
│       ├── game-session.facade.ts
│       └── run-replay.helper.ts                   # un profil pré-enregistré par la façade de prod
│
├── infrastructure/                                # 1 sous-dossier par port implémenté
│   ├── persistence/
│   │   └── local-session-storage.adapter.ts
│   └── clock/
│       ├── system.adapter.ts                      # partie jouée
│       └── fixed.adapter.ts                       # rejeu et banc, trace reproductible
│
├── providers/
│   └── session-context.tsx                        # le seul chemin de la façade vers React
│
├── store/
│   └── session.store.ts                           # Zustand — état pur, délègue au Facade
│
└── composition-root.ts                            # câblage DI, instancie et injecte tout

__tests__/                                          # racine projet, à côté de src/
├── fixtures/                                      # doubles partagés (MemoryPersistence)
├── unit/                                          # Vitest — groupé par périmètre
│   ├── composition-root.test.ts                   # dont la branche de refus de configuration
│   ├── core/
│   │   ├── entities/
│   │   ├── commands/
│   │   ├── registry/
│   │   ├── scoring/
│   │   └── session/
│   ├── infrastructure/
│   │   └── persistence/
│   ├── games/
│   │   └── test-bench/                            # evaluator + helpers + actions
│   └── features/
│       ├── onboarding/
│       ├── group-navigation/
│       └── scoring-summary/
├── integration/                                   # Vitest — pipeline complet sans UI
│   ├── replay/                                    # profils fictifs → niveau attendu (harnais « ça tombe juste »)
│   └── config-loading/                            # validation Zod grille/parcours malformés
└── e2e/                                           # Playwright — parcours navigateur
    ├── onboarding/
    └── full-course/
```

> Ce qui est écrit à ce jour : `core/` en entier, `infrastructure/{persistence,clock}/`, `providers/`, `store/`, le composition root, les trois features et le jeu `test-bench`. Restent à écrire `infrastructure/ai-assistant/`, l'export, les autres jeux, et `__tests__/{integration/replay,e2e}/`. Les dossiers ci-dessus qui n'existent pas encore disent **où** poser le code, pas ce qui est là.

### Stratégie de test

- **Unit** (Vitest) : evaluators, helpers, actions, entities — tout ce qui est pur et hors React. C'est là que le ratio valeur/temps est maximal au hackathon : chaque evaluator a ses cas OUI/NON couverts.
- **Integration** (Vitest) : le mode replay EST la suite d'intégration principale — chaque profil fictif est un cas de test `profil → pipeline complet → niveau attendu`. S'y ajoute la validation des JSON malformés (grille, parcours).
- **E2E** (Playwright) : minimal au hackathon — un parcours happy path (onboarding → 1 jeu → résumé) suffit pour la démo vidéo. Le reste du budget test va aux units et au replay.
- Groupement par feature/périmètre à l'intérieur de chaque type, en miroir de `src/` — on retrouve un test comme on retrouve son code.

### Règles de placement

- **UI générique sans état métier** → `components/`
- **Spécifique à une fonctionnalité** → `features/<nom>/`
- **Spécifique à un jeu** → `games/<jeu>/`
- **Contrats et orchestration du domaine** → `core/`
- **Implémentations concrètes des ports** → `infrastructure/<port>/`
- Un élément de `features/` ou `games/` réutilisé ailleurs sans modification → signal pour le faire remonter dans `components/`.
- `games/` reste à la racine (pas dans `features/`) : c'est un **système de plugins** avec contrat formel (evaluator + schema + component enregistrés au Registry), pas une feature câblée en dur — un contributeur externe doit voir en 5 secondes où ajouter un jeu.

### Découpage atomique inversé (colocalisation d'abord)

On cherche par **nom**, le niveau atomique vient après, **à l'intérieur** du dossier nommé :

- `components/group-rail/` contient son `composites/` et son `helpers/` — pas des dossiers atomiques à la racine de `components/`.
- `features/onboarding/components/` contient `elements/`, `composites/`, `sections/` — pas à la racine de la feature.
- Un composant simple ne crée que les niveaux réellement utilisés (pas de dossiers vides par principe). `components/layout/app-layout/app-layout.tsx` va jusqu'au bout de cette règle et n'en crée aucun : la coquille de page n'a ni état ni frère à côté de qui se ranger.
- Niveaux : `elements` (dumb atomiques) → `composites` (dumb composés) → `sections` (containers/smart, connectés au store ou au Facade). Découpage smart/dumb strict : la logique ne vit jamais dans un element ou un composite.

### Séparation logique / composants (par feature et par jeu)

```
component (dumb) → hook (état React + orchestration)
                       → action (logique métier, pas de JSX, testable hors React)
                          → helper (fonction pure, zéro effet de bord)
```

- `hooks/` — cycle de vie React uniquement.
- `actions/` — fonctions de logique appelées par les hooks, testables sans composant.
- `helpers/` — calcul pur, partageable entre action et evaluator (ex. `calibration.helper.ts` appelé par `submit-bid.action.ts` pendant le jeu **et** par l'evaluator au scoring — une seule source pour la formule).
- `schema/` — schémas Zod du périmètre (config du jeu, réponse du joueur, formulaire de la feature).
- L'**evaluator** reste à la racine du dossier du jeu (pas dans `actions/`) : c'est le point de contact public avec le port `GameEvaluator`.

---

## 4. Conventions de code

### Nommage des fichiers — kebab-case + suffixe de type

| Type | Convention | Exemples |
|---|---|---|
| Interface (port) | `*.interface.ts` | `game-evaluator.interface.ts`, `persistence-adapter.interface.ts`, `scoring-strategy.interface.ts` |
| Adapter | `<techno>.adapter.ts` dans `infrastructure/<port>/` | `infrastructure/ai-assistant/openai.adapter.ts`, `infrastructure/persistence/local-storage.adapter.ts` |
| Facade | `*.facade.ts` | `game-session.facade.ts` |
| Command | `*.command.ts` | `submit-answer.command.ts`, `history.command.ts` |
| Entity | `*.entity.ts` | `game-session.entity.ts` |
| Store | `*.store.ts` | `session.store.ts` |
| Schéma Zod | `*.schema.ts` | `player-profile.schema.ts`, `config.schema.ts` |
| Evaluator | `<jeu>.evaluator.ts` | `blind-auction.evaluator.ts` |
| Hook | `use-*.hook.ts` | `use-onboarding.hook.ts` |
| Action | `*.action.ts` | `save-profile.action.ts`, `submit-bid.action.ts` |
| Helper | `*.helper.ts` | `calibration.helper.ts` |
| Composant React | `<nom>.tsx` sans suffixe (le dossier atomique porte le rôle) | `confidence-cursor.tsx`, `onboarding-view.tsx` |

Le sous-dossier `infrastructure/<port>/` porte le contexte : les fichiers adapters n'ont **pas de préfixe** (`openai.adapter.ts`, pas `ai-assistant-openai.adapter.ts`).

### Règles d'import

- **Pas de barrel export** : aucun `index.ts` de ré-export. Chaque import pointe vers le fichier réel. Le seul point de câblage centralisé est `core/registry/register-games.ts` (verbosité voulue : composition root du domaine jeux).
- `core/` n'importe jamais depuis React, `features/`, `games/`, `components/`, `infrastructure/`, `store/`.

---

## 5. Formats de données (JSON data-driven)

**Principe : le schéma n'est pas la grille — c'est le format d'accueil de n'importe quelle grille.** La grille des organisateurs décrit *quoi mesurer et quels niveaux existent* ; le parcours décrit *comment le mesurer*. Quatre fichiers découplés, chacun remplaçable sans toucher au code :

```
config/
├── grid.json          # le référentiel officiel : dimensions + niveaux + seuils
├── signature.json     # même format, lecture complémentaire, ne décide aucun niveau
├── course.json        # groupes → jeux → critères → mapping vers grille ET signature
└── profiles/          # profils fictifs (mode replay) — pas encore sur le disque
```

Les trois premiers sont en place. `run-replay.helper.ts` est écrit et testé, mais sur des profils construits en mémoire : tant que `profiles/` est vide, le mode replay n'a pas de données.

**Langue :** les clés sont en anglais comme le reste du code ; les valeurs affichées au joueur (`label`, `title`, `question`, `nextLevelHint`, énoncés) restent en français.

### 5.1 `grid.json` — dimensions et niveaux

Depuis le 19/08, ce fichier porte le référentiel officiel (`laivel-up/levels/aidd.md`) : sept niveaux cumulatifs de White à Gold, quatre axes — taille de la plus grosse feature livrée avec l'IA, harness monté autour du modèle, reprise humaine du travail de l'IA, chantiers en parallèle — plus `initiative`, qui sépare Silver de Gold. Détail de la transposition : `aidd_docs/memory/internal/decisions/grille-officielle-transposition.md`.

```json
{
  "version": "aidd-2026-08-19",
  "title": "Référentiel AIDD — sept niveaux d'adoption",
  "dimensions": [
    {
      "id": "taille",
      "label": "Taille de la plus grosse feature livrée avec l'IA",
      "weight": 1,
      "scale": [
        { "from": 0, "label": "aucune feature livrée avec l'IA" },
        { "from": 0.25, "label": "S — peu de complexité" },
        { "from": 0.5, "label": "M — complexité moyenne" },
        { "from": 0.75, "label": "L — multi-étapes" },
        { "from": 1, "label": "XL — multi-modules" }
      ]
    }
  ],
  "levels": [
    {
      "id": "white",
      "label": "❖ White",
      "order": 1,
      "conditions": [
        { "dimension": "taille", "max": 0 },
        { "dimension": "harness", "max": 0 }
      ],
      "nextLevelHint": "Confier une première feature de taille S à l'IA..."
    },
    {
      "id": "green",
      "label": "🟢 Green",
      "order": 4,
      "conditions": [
        { "dimension": "taille", "min": 0.75 },
        { "dimension": "harness", "min": 0.75 },
        { "dimension": "intervention", "min": 0.75 },
        { "dimension": "parallele", "min": 0.33 }
      ],
      "nextLevelHint": "Mener trois chantiers de front le même jour..."
    }
  ]
}
```

- `conditions` en min/max **par dimension** : absorbe une grille à seuils simples comme une grille à profils croisés (« vibe coder = usage haut MAIS vérification basse »). Toutes les conditions d'un niveau doivent tenir — c'est la règle du référentiel, « un niveau n'est atteint que si tous ses axes le sont ».
- Bornes `min` et `max` **inclusives** : un score posé exactement sur le seuil atteint le niveau.
- `scale` = l'échelle ordinale de l'axe, optionnelle. Un axe du référentiel s'exprime en mots (`S / M / L / XL`, « aux étapes clés », « jamais ») ; le moteur compare des scores dans [0,1]. Les bandes portent la projection **et** le vocabulaire : le verdict affiche « L — multi-étapes », pas 75 %. Validée au chargement : elle commence à 0 et monte strictement.
- Un axe qui décroît dans le référentiel est transposé en **score croissant** — `intervention` mesure l'absence de reprise, 1 = « jamais » — pour que chaque condition reste un `min` et que la lecture aille dans le même sens que les niveaux.
- `nextLevelHint` = donnée, pas code → répond au brief « voir comment atteindre le suivant » et reste éditable par les organisateurs.

### 5.1 bis `signature.json` — la lecture complémentaire

Même schéma que `grid.json`, autre autorité. Le fichier porte nos dimensions (`verification`, `pilotage-contexte`, `resilience`) et nos paliers (« Vibe coder », « AIDD en route », « AIDD confirmé »). Les mêmes critères du parcours sont scorés **une seconde fois** avec ces dimensions.

- La signature ne décide **aucun** niveau officiel : `getVerdict()` rend `level` (grille) et `signature` (lecture), séparés jusque dans l'écran de résultat.
- Une dimension présente dans les deux fichiers est **refusée au chargement** : le même identifiant décrirait un axe du référentiel et une lecture complémentaire, avec deux échelles.
- Le fichier est optionnel. Sans lui, le verdict officiel est identique au caractère près — c'est ce que vérifie le test « leaves the official level untouched when the signature is unplugged ».
- Intérêt : le référentiel mesure l'adoption et met la qualité du code hors périmètre. Deux profils Copper peuvent avoir une rigueur opposée ; la signature est ce qui les distingue sans jamais toucher au niveau.

### 5.2 `course.json` — groupes, jeux, critères, mapping

```json
{
  "version": "1.0",
  "groups": [
    {
      "id": "groupe-harness",
      "label": "Harness",
      "order": 1,
      "games": [
        {
          "id": "blind-auction-1",
          "type": "blind-auction",
          "label": "Ce code IA est-il fiable ?",
          "config": {
            "snippets": [
              { "id": "ex1", "code": "...", "correct": false, "explanation": "Dépendance hallucinée ligne 3" }
            ],
            "timeLimitSeconds": 120
          },
          "criteria": [
            {
              "id": "c1",
              "question": "La confiance misée est-elle < 50% sur les extraits bugués ?",
              "rule": { "type": "low-confidence-on-faulty", "threshold": 0.5 },
              "mapping": [{ "dimension": "harness", "weight": 1.0 }]
            }
          ]
        }
      ]
    }
  ]
}
```

> ⚠️ L'exemple montre le **format**. Le parcours retenu est celui de `BRIEF.md` §4, réécrit le 19/08 sur les axes du référentiel : `scope-break` (gabarit), `repo-kit`, `checkpoints`, `three-tracks`, `task-board`, puis les jeux secondaires et le groupe 6.

- `type` = clé du **GameRegistry** : le JSON dit *quel* jeu instancier, le Registry fournit component + evaluator.
- `config` est **opaque pour le moteur** : validé par le `config.schema.ts` Zod du jeu concerné (schéma discriminé par `type`).
- `rule` = règle **déclarative** (type + paramètres) que l'evaluator du jeu interprète. Modifier un critère = éditer le JSON.
- `mapping` = maillon re-câblable : un critère alimente une ou plusieurs dimensions avec un poids. Si la grille du jour J a des dimensions inattendues → on redistribue les mappings, ni les jeux ni le scoring ne changent. Un mapping visant une dimension que ni la grille ni la signature ne déclarent est refusé **au chargement**, pas au moment du verdict.

### 5.3 Pipeline de scoring — entièrement déterministe

```
réponse joueur → evaluator du jeu → critères OUI/NON
critère "oui" → contribue (weight) aux dimensions mappées
score dimension = Σ contributions obtenues / Σ contributions possibles   ∈ [0,1]
niveau = premier niveau (order décroissant) dont toutes les conditions sont satisfaites
```

Scores normalisés en [0,1] → les seuils de `grid.json` restent comparables même si on ajoute/retire des jeux ou critères en cours de journée.

**L'assistant IA ne calcule jamais le niveau.** Il reçoit la trace structurée (scores par dimension/groupe, critères satisfaits/ratés, `CommandHistory`) et génère uniquement le texte d'explication en français. Le verdict reste reproductible sur les profils de test — critère n°1 du jury.

### 5.4 `profiles/` — mode replay

```json
{
  "id": "junior-vibe",
  "meta": { "label": "Junior vibe-coder", "expectedLevel": "vibe-coder" },
  "answers": [
    { "gameId": "blind-auction-1", "answer": { "bids": [{ "snippetId": "ex1", "confidence": 0.9 }] } }
  ]
}
```

Un profil = réponses pré-enregistrées + niveau attendu, injecté dans **le même pipeline** que le jeu interactif, comparé au `expectedLevel`. Harnais de test exécutable en boucle pendant les ajustements de seuils/mappings.

⚠️ Le format des profils fournis par les organisateurs sera probablement différent (bios narratives ?). La conversion « profil organisateur → profil replay » est une étape assumée du jour J, potentiellement assistée par IA.

Les trois formats sont validés au chargement par les schémas Zod de `core/contracts/` (`grid.schema.ts`, `course.schema.ts`, `replay-profile.schema.ts`) avec messages d'erreur explicites — indispensable pour éditer ces JSON à la main sous pression.

---

## 6. Rôles et limites par brique

| Brique | Fait | Ne fait PAS |
|---|---|---|
| **Zustand** (`session.store.ts`) | État UI : groupe/jeu courant, statut de chargement | Scoring, évaluation, logique métier (tout est délégué au Facade) |
| **Facade** | Orchestration : submit, navigation, scores, résumé, export, reset | Rendu, état React |
| **Evaluators** | Critères OUI/NON à partir de la réponse + config + règles déclaratives | Connaissance des autres jeux, accès au store, side effects |
| **Assistant IA** | Narration du verdict (texte français personnalisé) | Calcul du niveau, du score, des critères |
| **TanStack Form** | Onboarding + jeux structurellement formulaires (texte à trous, 2×2, budget), resolver Zod | — |
| **Zod** | Validation grille/parcours/profils au chargement + export en sortie | — |

---

## 7. Garde-fous (week-end 28–31 août)

1. **Gabarit d'abord** : le premier jeu codé est validé de bout en bout (JSON → UI → evaluator → score → replay) **avant** de dupliquer sur les autres groupes. C'est `test-bench` qui tient ce rôle ; `blind-auction` sert d'exemple dans ce document, il n'est pas écrit.
2. **PR par jeu** : le format week-end permet la granularité fine — ~19 PR (socle + 18 jeux + docs), historique lisible pour le jury.
3. **Grille officielle absorbée avant l'ouverture** : publiée le 19/08, transposée dans `grid.json` et les mappings recalés avant le 28 — le format d'accueil se valide à froid, pas sous pression.
4. **`components/` global gelé** après le socle du vendredi : toute la charge « par jeu » est confinée dans `games/<jeu>/`.
5. **Replay en continu** : la suite tourne à chaque push (hook pre-push Lefthook) — les profils de référence détectent les régressions de scoring à chaque ajustement de seuil/mapping.
6. **Feature freeze dimanche soir** : lundi matin = livrables uniquement (README, méthodo, vidéo), rendu avant 12h.
7. **Un jeu qui dérape > 1h30 est coupé**, ses mappings redistribués — 12 jeux solides valent mieux que 18 bancals.
8. La clé API est saisie par le participant, jamais commitée, jamais persistée hors LocalStorage local — à lui de la révoquer après usage.
