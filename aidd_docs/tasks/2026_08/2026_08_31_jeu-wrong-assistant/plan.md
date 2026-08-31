---
objective: "Le jeu wrong-assistant se joue de bout en bout à la place du placeholder g3-1, mesure sur la dimension resilience si le joueur détecte une affirmation fausse avant de l'accepter et ce qu'il fait ensuite, et fait porter à une acceptation à tort une conséquence visible plus loin dans le scénario."
status: draft
---

# Plan: Le jeu `wrong-assistant`, réagir à une IA qui se trompe avec aplomb

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Mesurer si un joueur repère l'erreur d'un interlocuteur simulé avant de l'accepter, et s'il reformule ou vérifie plutôt que de subir |
| **Source** | `aidd_docs/backlog/stories/repondre-a-une-ia-qui-se-trompe.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` · `config/signature.json` |
| **Slot** | `g3-1` du groupe 3 « Résilience », aujourd'hui un `test-bench` |

Plan court : le gabarit structurel des jeux livrés fait autorité. Seul ce qui est propre à ce jeu est écrit ici.

**Contrainte d'épique, absolue** : « Excludes : tout appel à un modèle pendant une partie. Les dialogues à personas sont des arbres écrits à l'avance. » L'arbre est en configuration, le jeu ne fait aucun appel réseau, et rien dans le code ne construit une réponse d'assistant à la volée.

## Phases

### Phase 1 — Les contrats et la lecture pure

`schema/config.schema.ts`, `schema/answer.schema.ts`, `helpers/read-exchange.helper.ts`.

Configuration — un arbre de dialogue, nœuds et arêtes déclarés à plat :

```
statement: string
rootId: string
nodes: [{
  id: string
  speaker: 'assistant'
  message: string
  flawed: boolean          // ce tour porte une affirmation fausse
  flaw?: string            // ce qui cloche, montré À LA RÉVÉLATION SEULEMENT
  consequence?: string     // le dommage que ce nœud constate, s'il en est un
  replies: [{
    id: string
    text: string
    stance: 'accept' | 'challenge' | 'verify' | 'reformulate'
    nextId?: string        // absent = fin de scénario
  }]
}]
```

Trace : `steps: { nodeId, replyId }[]`, plus `parseWrongAssistantTrace(answer, config)` qui refuse un nœud inconnu, une réponse qui n'appartient pas à son nœud, un premier pas hors du `rootId`, et un chaînage rompu — chaque pas doit suivre le `nextId` du précédent. **Aucun champ dérivé dans la trace** : ce qui est jugé se recalcule depuis l'arbre.

`readExchange` rend `{ flawedNodesMet, flawedNodesCaught, allFlawsCaughtBeforeAccepting, correctiveRepliesCount, consequencesHit }` où :

- un nœud défectueux est **repéré** quand la réponse choisie sur ce nœud n'est pas `accept` ;
- `allFlawsCaughtBeforeAccepting` est vrai quand tous les nœuds défectueux rencontrés ont reçu autre chose qu'un `accept` — l'ordre est porté par l'arbre, pas recalculé ;
- une réponse **corrective** est `verify` ou `reformulate` ; `challenge` est un refus sans suite, qui repère l'erreur sans rien en faire.

**Garde-fous portés par le schéma, en refus au chargement :**

- identifiants de nœuds et de réponses uniques, `rootId` existant, aucun `nextId` pendant ;
- **arbre acyclique** et atteignable : tout nœud est joignable depuis `rootId`, et aucun chemin ne boucle ;
- au moins **deux nœuds défectueux**, et au moins un nœud sain — sans quoi « ne jamais accepter » serait la stratégie gagnante sans lecture ;
- un nœud défectueux porte un `flaw` ; un nœud sain n'en porte pas ;
- **chaque nœud défectueux offre au moins une réponse de chaque camp**, `accept` et non-`accept`, et au moins une `verify` ou `reformulate` : sans quoi le choix est forcé et ne mesure rien ;
- **toute branche `accept` sur un nœud défectueux mène à un nœud portant une `consequence`**, directement ou par sa suite obligée. C'est le refus qui rend mécanique la troisième acceptance de la story, au lieu de la confier au corpus ;
- **aucun nœud sain ne mène à une `consequence`** : sans quoi la conséquence cesserait d'être le signal d'une acceptation à tort ;
- les libellés de réponse ne trahissent pas leur `stance` par un mot-clé commun — vérifié au test, pas au schéma.

### Phase 2 — L'évaluateur et ses deux règles

`wrong-assistant.evaluator.ts`.

| Règle | Lit | Question du parcours |
| --- | --- | --- |
| `flaws-caught-before-accepting` `{}` | `allFlawsCaughtBeforeAccepting && flawedNodesMet > 0` | « L'erreur a-t-elle été repérée avant d'être acceptée ? » |
| `corrective-replies-at-least` `{threshold}` | `correctiveRepliesCount >= threshold` | « La branche reformuler ou vérifier a-t-elle été choisie ? » |

Deux lectures différentes : la première dit si l'erreur a été vue, la seconde ce que le joueur en a fait. Un joueur qui refuse tout sans jamais vérifier tient `c1` et manque `c2` ; c'est le sens de la distinction `challenge` / `verify`|`reformulate`.

`flawedNodesMet > 0` ferme le cas dégénéré d'un chemin qui ne croise aucun nœud défectueux : le critère sortirait « satisfait » sans rien avoir mesuré. Le schéma ne peut pas garantir qu'un tel chemin n'existe pas sans contraindre la forme de l'arbre au-delà du raisonnable ; la règle le ferme, et le test en force brute vérifie qu'aucun chemin du corpus réel n'y tombe.

### Phase 3 — Le jeu à l'écran

`components/composites/wrong-assistant-game.tsx`, `composites/exchange-thread.tsx`, `elements/assistant-turn.tsx`, `elements/reply-choice.tsx`, `hooks/use-wrong-assistant.hook.ts`.

Un fil de conversation qui s'allonge : chaque tour de l'assistant s'ajoute au-dessus, les réponses possibles s'affichent en bas. Le fil **reste lisible en entier** — le joueur doit pouvoir relire ce qui a été dit trois tours plus tôt, c'est la matière du jeu. Nouveau tour annoncé en `aria-live="polite"`, focus déplacé sur le premier choix.

Rien ne distingue un tour défectueux d'un tour sain : même cadre, même ton, même aplomb. Rien ne classe les réponses par `stance` — pas d'icône, pas d'ordre stable, pas de couleur. Un choix est **irréversible** : le fil ne revient jamais en arrière, comme une vraie conversation.

Quand un nœud porte une `consequence`, elle s'affiche **dans le fil, à sa place**, comme un constat de l'assistant — jamais comme un verdict sur le joueur, jamais avec le mot « erreur » adressé à lui.

Deux temps : `'talking'` puis `'revealed'` quand le scénario atteint un nœud sans suite. La révélation liste **les tours défectueux et leur `flaw`** — ce qui clochait, pour de vrai — jamais le score du joueur, jamais lesquels il a laissé passer.

### Phase 4 — Le jeu dans le parcours

- Un bloc dans `register-games.ts`, un dans `register-components.ts`.
- `config/course.json` : `g3-1` passe à `wrong-assistant`, corpus d'un arbre de **cinq tours de profondeur** avec **trois nœuds défectueux** sur les chemins principaux, deux nœuds de conséquence, et un scénario cohérent — un assistant qui rend un travail et affirme des choses sur lui.
- Deux critères, pesés **2** (`c1`) et **1** (`c2`), tous deux sur `resilience` en `measured`. Le mapping `harness` en `inferred` du placeholder disparaît : le groupe 3 porte la signature, et ce jeu **mesure** ce qu'il note.
- `c2` : `threshold: 2`.

### Phase 5 — Les tests

`__tests__/unit/games/wrong-assistant/` : `config.schema.test.ts` (chaque refus, dont le cycle, la branche `accept` sans conséquence, la conséquence accrochée à un nœud sain), `answer.schema.test.ts` (chaînage rompu, réponse étrangère au nœud), `read-exchange.test.ts`, `evaluator.test.ts`, `use-wrong-assistant.test.ts`, `wrong-assistant-game.test.tsx`.

**Passage en force brute obligatoire, sur l'espace complet des chemins** — l'arbre est fini et acyclique, donc énumérable. Sur la configuration **réelle** de `config/course.json`, énumérer tous les chemins de la racine à une feuille et vérifier :

- tout chemin qui accepte un tour défectueux manque `c1` ;
- tout chemin qui accepte un tour défectueux atteint un nœud portant une `consequence` ;
- aucun chemin ne rencontre zéro nœud défectueux ;
- le chemin « accepter systématiquement » manque les deux critères ;
- le chemin « refuser systématiquement, sans jamais vérifier » tient `c1` et manque `c2` ;
- la part de chemins au hasard qui tiennent les deux critères reste sous 25 %.

Un test lit aussi le corpus réel et vérifie qu'aucun mot ne permet de deviner la `stance` d'une réponse sans la lire : les quatre `stance` ne partagent aucun préfixe ni verbe d'attaque commun au sein d'un même nœud.

## Decisions

| Decision | Why |
| --- | --- |
| Le type est **`wrong-assistant`** | Nomme la situation mesurée. `dialogue-tree` nommerait la structure de données, `persona-chat` le décor |
| L'arbre entier vit en **configuration**, jamais en code | L'épique l'exige : aucun modèle appelé pendant une partie. Un arbre en configuration se relit, se rejoue à l'identique, et son espace complet s'énumère au test — un arbre en code ne se relirait que par le code |
| Quatre `stance`, dont `challenge` distinct de `verify`/`reformulate` | La story sépare « détecter l'erreur » de « ce que je fais ensuite ». Sans un troisième camp qui refuse sans agir, les deux critères se confondraient : tout ce qui repère vaudrait aussi correctif |
| La conséquence d'une acceptation à tort est **garantie par le schéma**, pas écrite au jugé dans le corpus | La story en fait sa quatrième acceptance. Un garde-fou se mesure, il ne se déclare pas — leçon inscrite dans `BUILD-ORDER.md` après `lie-detector` |
| Aucune `consequence` sur un nœud sain, refusé au chargement | Sinon la conséquence deviendrait du décor, et un joueur qui la voit après un bon choix apprendrait à l'ignorer — le signal se détruit lui-même |
| `flawedNodesMet > 0` dans la règle `c1` | Un chemin sans erreur rencontrée rendrait « satisfait » sans mesure. Fermé dans la règle parce que le schéma ne peut pas l'interdire sans contraindre la forme de l'arbre |
| Le choix est **irréversible**, le fil ne revient pas en arrière | Le jeu mesure la réaction, pas le tâtonnement. Un retour arrière transformerait l'arbre en exploration exhaustive, et la mesure en épreuve de patience |
| La révélation donne **ce qui clochait**, jamais lesquels le joueur a laissé passer | Un jeu déjà soumis peut être rejoué : donner la correction ferait du second passage une recopie. Choix identique aux trois jeux précédents |
| **Aucun chronomètre** | La story ne le demande pas. Le temps de lecture d'un dialogue est ce qu'on veut laisser au joueur : chronométrer mesurerait sa vitesse de lecture |
