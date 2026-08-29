# Ordre de construction

Ce document dit **quelles commandes AIDD lancer, dans quel ordre**, pour coder le backlog de `laivel-up-eval`. Il ne redit pas le contenu des Epics et des Stories : chaque ligne pointe vers son fichier, qui reste la source.

L'ordre vient du backlog lui-même : le champ `order` de chaque artefact et le champ `depends_on` des Epics. Rien n'est inventé ici.

---

## 1. La boucle, pour chaque Story

C'est la même séquence à chaque fois. Cinq commandes, dans cet ordre.

| # | Commande | Ce qu'elle produit |
| --- | --- | --- |
| 1 | `/aidd-dev:01-plan aidd_docs/backlog/stories/<story>.md` | Un dossier `aidd_docs/tasks/AAAA_MM/AAAA_MM_JJ_<sujet>/` avec `plan.md` et ses `phase-N.md` |
| 2 | `/aidd-dev:02-implement aidd_docs/tasks/<...>/plan.md` | Le code, phase par phase, un commit par phase |
| 3 | `/aidd-dev:03-assert` | Les assertions du projet passent (`npm run lint`, `npm run typecheck`, `npm run test`) |
| 4 | `/aidd-dev:05-review` | Un verdict lecture seule sur le diff : code, conformité au plan, pertinence |
| 5 | `/aidd-vcs:02-pull-request` | La PR en draft, une par jeu ou par Story — voir [vcs.md](aidd_docs/memory/vcs.md) |

Notes sur la boucle :

- `02-implement` commite lui-même à chaque phase. `/aidd-vcs:01-commit` ne sert qu'aux changements hors plan.
- `03-assert` est déjà appelé par `02-implement` à l'intérieur de chaque phase. Le relancer seul sert quand on reprend une phase à froid.
- Une Story qui touche un écran gagne un `/aidd-dev:11-browser-qa` entre 4 et 5, pour la vidéo de démo.
- Une Story dont le comportement n'est pas couvert par le plan gagne un `/aidd-dev:06-test` avant la revue.
- Si la revue trouve du travail à faire : `/aidd-dev:07-refactor` sur son rapport, jamais une correction improvisée.
- Un bug rencontré en cours de route : `/aidd-dev:08-debug`, pas une rustine dans la phase courante.

**Variante autonome.** `/aidd-orchestrator:01-sdlc <story>` enchaîne cadrage, implémentation isolée, revue indépendante et PR en une seule invocation. À réserver aux Stories dont le périmètre est déjà net : elle ne s'arrête pas pour poser de question.

---

## 2. Ce qui passe avant la première Story

Trois choses à faire une fois, dans cet ordre.

### 2.1 ~~Fermer la Story déjà livrée~~ — fait le 29/08

[reprendre-la-main-aux-bons-moments.md](aidd_docs/backlog/stories/reprendre-la-main-aux-bons-moments.md) est `done`, son plan [2026_08_29_jeu-checkpoints/plan.md](aidd_docs/tasks/2026_08/2026_08_29_jeu-checkpoints/plan.md) est `reviewed`, et le jeu tourne dans le groupe 7.

La revue avait déjà tourné avant que ce document ne soit écrit — [review.md](aidd_docs/tasks/2026_08/2026_08_29_jeu-checkpoints/review.md), verdict `changes-requested`, cinq constats. Ce sont eux qui restaient. Ils sont clos : trois corrigés, un reporté en tâche de backlog ([armer-le-typage-strict-que-le-code-suppose.md](aidd_docs/backlog/tasks/armer-le-typage-strict-que-le-code-suppose.md)), un rejeté avec sa raison. Les preuves navigateur que deux d'entre eux exigeaient vivent dans [qa/](aidd_docs/tasks/2026_08/2026_08_29_jeu-checkpoints/qa/).

Les 35 autres Stories restent en `proposed`, ce qui est leur état normal tant qu'elles n'ont pas été acceptées pour livraison.

### 2.2 Corriger le défaut ouvert

[l-accueil-marque-le-premier-groupe-comme-courant.md](aidd_docs/backlog/defects/l-accueil-marque-le-premier-groupe-comme-courant.md) est en `status: ready`, `order: 1`. Il touche l'écran d'accueil, donc tout le monde le voit, à commencer par le jury.

```
/aidd-dev:08-debug aidd_docs/backlog/defects/l-accueil-marque-le-premier-groupe-comme-courant.md
/aidd-dev:03-assert
/aidd-vcs:01-commit
```

### 2.3 Trancher les deux décisions produit laissées ouvertes par le spike

Le spike [preuves-du-depot-calculables-sans-jeton.md](aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md) est `resolved` : les quatre preuves sont calculables sans jeton, sous un plafond d'environ 55 pull requests par dépôt et par heure. Il laisse deux arbitrages explicitement hors de son périmètre :

- la fenêtre d'analyse retenue — plafonner au nombre de PR lisibles, ou borner par date ;
- le sort d'un dépôt qui dépasse le plafond — lecture partielle annoncée comme telle, ou refus.

Ces deux réponses conditionnent l'Epic 4 et le format du champ dépôt de l'Epic 1. Les fixer avant d'y toucher :

```
/aidd-pm:04-spec aidd_docs/backlog/epics/preuves-du-depot-git.md
```

---

## 3. L'ordre des Epics

Six Epics, ordonnées par leur champ `order`, contraintes par leur `depends_on`.

| Ordre | Epic | Dépend de | Stories |
| --- | --- | --- | --- |
| 1 | [onboarding-du-joueur.md](aidd_docs/backlog/epics/onboarding-du-joueur.md) | — | 3 |
| 2 | [parcours-couvrant-les-axes.md](aidd_docs/backlog/epics/parcours-couvrant-les-axes.md) | — | 20 |
| 3 | [deroule-du-parcours.md](aidd_docs/backlog/epics/deroule-du-parcours.md) | 1, 2 | 3 |
| 4 | [preuves-du-depot-git.md](aidd_docs/backlog/epics/preuves-du-depot-git.md) | 1 | 3 |
| 5 | [restitution-du-verdict.md](aidd_docs/backlog/epics/restitution-du-verdict.md) | 2 | 4 |
| 6 | [sauvegarde-et-reprise.md](aidd_docs/backlog/epics/sauvegarde-et-reprise.md) | 3 | 3 |

Les Epics 1 et 2 n'ont aucune dépendance : elles peuvent être menées en parallèle sur deux branches. Les Epics 4 et 5 ne dépendent pas l'une de l'autre non plus — 4 attend l'onboarding, 5 attend les jeux.

Avant d'ouvrir une Epic, la passer à `ready` et vérifier que ses Stories tiennent debout :

```
/aidd-pm:07-epic aidd_docs/backlog/epics/<epic>.md
/aidd-pm:02-user-stories assess aidd_docs/backlog/epics/<epic>.md
```

Sur les deux Epics qui portent le verdict — la 4 et la 5, celles que le jury regarde le plus — ajouter la relecture à trois voix avant de coder :

```
/aidd-pm:08-three-amigos aidd_docs/backlog/epics/<epic>.md
```

---

## 4. L'ordre des Stories, Epic par Epic

Chaque Story se lance avec la boucle de la section 1. L'ordre à l'intérieur d'une Epic est son champ `order`.

### Epic 1 — Onboarding du joueur

| # | Story |
| --- | --- |
| 1 | [saisir-son-identite-et-son-depot.md](aidd_docs/backlog/stories/saisir-son-identite-et-son-depot.md) |
| 2 | [savoir-a-quoi-je-m-engage.md](aidd_docs/backlog/stories/savoir-a-quoi-je-m-engage.md) |
| 3 | [comprendre-le-cout-de-l-absence-de-depot.md](aidd_docs/backlog/stories/comprendre-le-cout-de-l-absence-de-depot.md) |

La Story 1 attend la décision de la section 2.3 : le champ accepte une URL GitHub ou une forme `proprietaire/depot`, et normalise vers la seconde.

### Epic 2 — Parcours couvrant les axes

Vingt Stories, une par jeu. C'est le gros du travail et le cœur du produit.

| # | Story | État |
| --- | --- | --- |
| 1 | [reprendre-la-main-aux-bons-moments.md](aidd_docs/backlog/stories/reprendre-la-main-aux-bons-moments.md) | **livrée** (jeu `checkpoints`) |
| 2 | [mener-plusieurs-chantiers-de-front.md](aidd_docs/backlog/stories/mener-plusieurs-chantiers-de-front.md) | **livrée** (jeu `three-tracks`) |
| 3 | [miser-ma-confiance-a-l-aveugle.md](aidd_docs/backlog/stories/miser-ma-confiance-a-l-aveugle.md) | |
| 4 | [trouver-les-erreurs-sans-liste.md](aidd_docs/backlog/stories/trouver-les-erreurs-sans-liste.md) | |
| 5 | [demasquer-l-affirmation-qui-ment.md](aidd_docs/backlog/stories/demasquer-l-affirmation-qui-ment.md) | |
| 6 | [acheter-des-indices-a-contrecoeur.md](aidd_docs/backlog/stories/acheter-des-indices-a-contrecoeur.md) | |
| 7 | [placer-les-pratiques-sur-deux-axes.md](aidd_docs/backlog/stories/placer-les-pratiques-sur-deux-axes.md) | |
| 8 | [repartir-un-budget-de-projet.md](aidd_docs/backlog/stories/repartir-un-budget-de-projet.md) | |
| 9 | [repondre-a-une-ia-qui-se-trompe.md](aidd_docs/backlog/stories/repondre-a-une-ia-qui-se-trompe.md) | |
| 10 | [tenir-une-suite-de-decisions.md](aidd_docs/backlog/stories/tenir-une-suite-de-decisions.md) | |
| 11 | [reconstituer-un-incident.md](aidd_docs/backlog/stories/reconstituer-un-incident.md) | |
| 12 | [refuser-le-raccourci-dangereux.md](aidd_docs/backlog/stories/refuser-le-raccourci-dangereux.md) | |
| 13 | [trier-sous-le-chronometre.md](aidd_docs/backlog/stories/trier-sous-le-chronometre.md) | |
| 14 | [reconstituer-une-architecture.md](aidd_docs/backlog/stories/reconstituer-une-architecture.md) | |
| 15 | [remettre-le-flux-dans-l-ordre.md](aidd_docs/backlog/stories/remettre-le-flux-dans-l-ordre.md) | |
| 16 | [completer-un-prompt-incomplet.md](aidd_docs/backlog/stories/completer-un-prompt-incomplet.md) | |
| 17 | [reperer-les-segments-ambigus.md](aidd_docs/backlog/stories/reperer-les-segments-ambigus.md) | |
| 18 | [confier-une-tache-en-autonomie.md](aidd_docs/backlog/stories/confier-une-tache-en-autonomie.md) | |
| 19 | [decouper-une-feature-en-lots.md](aidd_docs/backlog/stories/decouper-une-feature-en-lots.md) | |
| 20 | [equiper-le-depot-avant-les-vagues.md](aidd_docs/backlog/stories/equiper-le-depot-avant-les-vagues.md) | |

Trois règles propres à cette Epic :

- Les jeux 1 et 2 portent les axes `intervention` et `parallele`. Sans eux, **aucun niveau à partir de Red n'est annonçable** : ils passent avant tout autre, et le 1 est déjà livré.
- Le jeu `checkpoints` est le gabarit des jeux à état, pas des autres. Chaque jeu garde sa propre surface — ne pas dupliquer un écran existant pour aller plus vite.
- Chaque jeu porte ses garde-fous anti-triche, dans sa Story. Un jeu livré sans garde-fou est un jeu qui se joue au lieu de mesurer.

Les vingt Stories sont indépendantes les unes des autres. Pour en mener plusieurs de front :

```
/aidd-dev:10-todo <story-a> <story-b> <story-c>
```

Un agent exécuteur par Story, en parallèle. À n'utiliser qu'entre jeux dont les surfaces ne se touchent pas.

### Epic 3 — Déroulé du parcours

| # | Story |
| --- | --- |
| 1 | [avancer-en-sachant-ou-j-en-suis.md](aidd_docs/backlog/stories/avancer-en-sachant-ou-j-en-suis.md) |
| 2 | [retrouver-ma-place-apres-un-rechargement.md](aidd_docs/backlog/stories/retrouver-ma-place-apres-un-rechargement.md) |
| 3 | [revenir-sur-un-jeu-deja-soumis.md](aidd_docs/backlog/stories/revenir-sur-un-jeu-deja-soumis.md) |

### Epic 4 — Preuves du dépôt Git

| # | Story |
| --- | --- |
| 1 | [voir-mon-depot-lu-et-ce-qui-manque.md](aidd_docs/backlog/stories/voir-mon-depot-lu-et-ce-qui-manque.md) |
| 2 | [voir-le-depot-trancher.md](aidd_docs/backlog/stories/voir-le-depot-trancher.md) |
| 3 | [voir-mon-verdict-plafonne.md](aidd_docs/backlog/stories/voir-mon-verdict-plafonne.md) |

Deux incertitudes du spike restent ouvertes et se lèveront en codant : le cas du dépôt vide, jamais reproduit, et la définition de « PR mergée sans édition humaine », dont les données existent mais pas la règle. Le budget de 60 requêtes par heure est **par IP** — le jour du jury, plusieurs joueurs derrière la même connexion le partagent.

### Epic 5 — Restitution du verdict

| # | Story |
| --- | --- |
| 1 | [lire-mon-niveau-et-l-axe-qui-plafonne.md](aidd_docs/backlog/stories/lire-mon-niveau-et-l-axe-qui-plafonne.md) |
| 2 | [voir-la-preuve-derriere-chaque-axe.md](aidd_docs/backlog/stories/voir-la-preuve-derriere-chaque-axe.md) |
| 3 | [lire-ma-signature-a-cote-du-niveau.md](aidd_docs/backlog/stories/lire-ma-signature-a-cote-du-niveau.md) |
| 4 | [savoir-quelle-action-me-ferait-monter.md](aidd_docs/backlog/stories/savoir-quelle-action-me-ferait-monter.md) |

Deux des quatre critères du jury se jouent ici. Après la dernière Story, passer l'écran au crible plutôt que de le déclarer fini :

```
/aidd-refine:02-challenge
/aidd-dev:11-browser-qa
```

### Epic 6 — Sauvegarde et reprise

| # | Story |
| --- | --- |
| 1 | [telecharger-ma-partie.md](aidd_docs/backlog/stories/telecharger-ma-partie.md) |
| 2 | [recharger-une-partie-pour-la-reprendre.md](aidd_docs/backlog/stories/recharger-une-partie-pour-la-reprendre.md) |
| 3 | [refuser-un-fichier-hors-contrat.md](aidd_docs/backlog/stories/refuser-un-fichier-hors-contrat.md) |

---

## 5. Avant le rendu

```
/aidd-dev:04-audit
/aidd-dev:06-test e2e
/aidd-vcs:03-release-tag
```

L'audit passe les sept piliers en lecture seule. Ses trouvailles se corrigent avec `/aidd-dev:07-refactor` sur son rapport, pas à la main.

**Contrainte éliminatoire** rappelée par [vcs.md](aidd_docs/memory/vcs.md) : aucune clé d'API, ni dans le code ni dans l'historique. À vérifier sur l'historique complet, pas seulement sur le dernier diff.

---

## 6. Un tradeoff à connaître sur cet ordre

L'ordre ci-dessus est celui du backlog : les vingt jeux (Epic 2) avant le déroulé (Epic 3) et avant le verdict (Epic 5). Il construit la matière avant la mise en scène, ce qui est cohérent avec les dépendances déclarées.

Il a un coût dans un format court : **rien n'est démontrable de bout en bout avant la fin de l'Epic 5.** Une équipe qui manque de temps le découvre trop tard.

L'alternative, si le temps se tend : livrer les jeux 1 et 2, puis les Epics 3 et 5, puis revenir remplir l'Epic 2 jeu par jeu. Le parcours est alors court mais complet, et chaque jeu ajouté l'enrichit sans rien casser. C'est un arbitrage de calendrier, pas une correction du backlog — il se prend en connaissance de cause, et il ne change aucune dépendance déclarée.

---

## 7. Aide-mémoire des commandes

| Commande | Quand |
| --- | --- |
| `/aidd-orchestrator:02-backlog` | Poser une question au backlog, le trier, le réparer |
| `/aidd-pm:07-epic` | Cadrer ou reprendre une Epic |
| `/aidd-pm:02-user-stories` | Découper, évaluer, ordonner des Stories |
| `/aidd-pm:04-spec` | Figer un contrat avant de coder |
| `/aidd-pm:08-three-amigos` | Relire une Epic sous trois angles avant de l'ouvrir |
| `/aidd-pm:09-defect` | Consigner un écart constaté |
| `/aidd-pm:05-spike` | Lever une incertitude qui bloque l'estimation |
| `/aidd-dev:01-plan` | Story → plan en phases |
| `/aidd-dev:02-implement` | Plan → code, phase par phase |
| `/aidd-dev:03-assert` | Faire passer les assertions du projet |
| `/aidd-dev:06-test` | Ajouter de la couverture, ou valider un parcours |
| `/aidd-dev:05-review` | Juger un diff avant de le pousser |
| `/aidd-dev:11-browser-qa` | Preuve vidéo d'un parcours navigateur |
| `/aidd-dev:07-refactor` | Appliquer un rapport d'audit ou de revue |
| `/aidd-dev:08-debug` | Reproduire et corriger un bug |
| `/aidd-dev:10-todo` | Mener plusieurs Stories indépendantes en parallèle |
| `/aidd-dev:04-audit` | Bilan de santé du code, lecture seule |
| `/aidd-refine:02-challenge` | Contester le travail qui vient d'être fait |
| `/aidd-vcs:01-commit` | Commit atomique hors boucle de plan |
| `/aidd-vcs:02-pull-request` | Ouvrir la PR en draft |
| `/aidd-vcs:03-release-tag` | Couper la version du rendu |
| `/aidd-context:10-learn` | Consigner une décision ou un piège découvert en route |
