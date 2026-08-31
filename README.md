# Laivel Up Eval

Un outil web qui situe un développeur sur le référentiel **AI-Driven Development**, explique ce qui l'y place, et lui dit ce que le cran suivant demanderait.

**[Faire le parcours →](https://jdelauney.github.io/laivel-up-eval/)**

## Le problème

> **CTO** : « Il me faut le niveau AI-Driven Development de toute ton équipe ainsi qu'un plan de progression pour chacun d'eux. Pour vendredi. »

On dispose de dépôts Git, d'historiques de pull requests, de code, et de ce que les gens racontent d'eux-mêmes. Il faut l'outil qui décide quelles informations retenir pour placer un profil au bon niveau et l'aider à progresser.

```
Une personne  →  l'outil  →  son niveau · pourquoi · comment progresser
```

## Les deux partis pris

**Le niveau se calcule sans IA.** Toute la chaîne — signaux, axes, niveau, plan de progression — est déterministe : du code, et des seuils lus dans du JSON. Aucun modèle distant n'est requis pour obtenir un verdict, et deux exécutions sur les mêmes réponses rendent le même niveau au caractère près. C'est ce qui rend le résultat opposable, et c'est aussi une contrainte pratique : l'outil doit tourner sur une machine qui n'a pas de clé d'API.

**La personne agit, elle ne se déclare jamais.** On ne lui demande pas d'estimer son niveau. Chaque situation la met en jeu — elle dépense une ressource rare, une simulation répond, et des critères mécaniques lisent le résultat. Ce qu'on mesure est ce qu'elle a **réussi à livrer**, pas ce qu'elle a tenté ni ce qu'elle sait nommer.

## Comment le verdict se construit

Le parcours traverse sept groupes de situations. Chaque situation produit des critères OUI/NON ; chaque critère alimente un ou plusieurs **axes** du référentiel avec un poids.

| Axe | Ce qu'il mesure |
| --- | --- |
| `taille` | La plus grosse feature livrée avec l'IA |
| `harness` | Ce qui est monté autour du modèle : contexte, règles, boucles |
| `intervention` | La reprise humaine du travail de l'IA |
| `parallele` | Les chantiers menés de front |
| `initiative` | Ce que les agents entreprennent sans qu'on les lance |

Sept niveaux se succèdent — **White, Red, Blue, Green, Copper, Silver, Gold** — et la **règle du minimum** s'applique : un niveau n'est atteint que si *tous* ses axes le sont. Chaque seuil est un plancher, jamais une moyenne. Un axe qui reste bas plafonne le niveau, et l'écran le nomme.

Trois choses distinguent ce verdict d'un score :

- **Le statut de mesure est ternaire.** Un axe est `mesuré`, `inféré` ou `non mesuré`. Un axe qu'aucun critère ne vise ne vaut pas zéro : il n'a pas été mesuré, et l'outil le dit plutôt que de deviner. Un axe inféré compte, mais ne se déguise pas en mesure directe.
- **La signature est séparée du niveau.** Une seconde lecture — jugement critique, pilotage du contexte, résilience — distingue deux personnes classées pareil. Elle ne déplace **aucun** niveau, et l'écran l'écrit.
- **Le plan de progression vient de la grille, pas du code.** Chaque cran porte l'action qui y fait entrer et la preuve qui la validerait. Les changer, c'est éditer un JSON.

Quand aucun niveau ne peut être annoncé, l'outil le dit et nomme les axes en cause. Il ne retombe jamais sur le niveau le plus bas par défaut.

## Le parcours

Vingt situations, réparties en sept groupes.

| # | Groupe | Les situations |
| --- | --- | --- |
| 1 | Jugement critique | *Quelle confiance accordez-vous à ce code ?* · *Combien d'erreurs voyez-vous ?* · *Laquelle de ces affirmations ment ?* |
| 2 | Pilotage du contexte | *Combien d'indices vous faut-il ?* · *Où placez-vous ces pratiques ?* · *Comment répartissez-vous le temps ?* |
| 3 | Résilience | *L'IA se trompe. Et vous ?* · *Tenez-vous votre ligne ?* · *D'où vient cet incident ?* |
| 4 | Sécurité et responsabilité | *Acceptez-vous ce raccourci ?* · *Garder ou jeter ?* |
| 5 | Architecture | *Remettez cette architecture debout* · *Dans quel ordre travaille-t-on ?* |
| 6 | Qualité du prompt | *Qu'est-ce qui manque à ce prompt ?* · *Qu'est-ce qui est ambigu ici ?* |
| 7 | Les axes du référentiel | *La facturation récurrente, de bout en bout* · *Où passez-vous votre attention ?* · *Que confiez-vous sans surveiller ?* · *Comment découpez-vous cette feature ?* · *Qu'installez-vous avant de lâcher l'IA ?* |

Huit jeux sont écrits à ce jour : `confidence-bet`, `defect-hunt`, `lie-detector`, `hint-budget`, `practice-map`, `checkpoints`, `three-tracks`, et `test-bench`. Ce dernier tient lieu de banc de jugement là où le jeu dédié n'existe pas encore — les axes qu'il alimente s'affichent `inféré`, et l'écran de verdict le dit en toutes lettres plutôt que de le taire.

## Démarrer

Prérequis : **Node 20 ou plus** (les workflows d'intégration tournent sur Node 24) et npm.

```bash
git clone https://github.com/jdelauney/laivel-up-eval.git
cd laivel-up-eval
npm install
npm run dev
```

Aucune clé d'API, aucune variable d'environnement, aucun service à démarrer : l'application est entièrement front et ne parle à personne.

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Vérification de types puis build de production |
| `npm run preview` | Sert le build de production en local |
| `npm run test` | Suite Vitest |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | Biome — lint, format et tri des imports |

Les mêmes vérifications sont câblées en hooks Git par Lefthook : Biome avant chaque commit, types et tests avant chaque push.

## Configurer sans toucher au code

Trois fichiers gouvernent le fond, chacun validé par un schéma Zod au chargement :

| Fichier | Ce qu'il porte |
| --- | --- |
| `config/grid.json` | Les axes, leurs échelles, les niveaux et leurs seuils, les actions de progression |
| `config/course.json` | Les groupes, les situations, les critères et leur poids sur chaque axe |
| `config/signature.json` | La lecture complémentaire, optionnelle |

Remplacer la grille par une autre ne demande aucune modification du code : le schéma n'est pas *la* grille, c'est le format d'accueil de n'importe quelle grille. Une configuration hors contrat n'ouvre pas de session — l'écran nomme le champ fautif au lieu de planter.

## Sous le capot

TypeScript strict, React 19 et Vite. Tailwind CSS et shadcn/ui pour l'interface, Zod pour tous les contrats, Zustand pour l'état d'écran. Vitest pour les tests, Biome pour le lint et le format, Lefthook pour les garde-fous.

Aucun backend : l'application est déployée en statique sur GitHub Pages, et une prévisualisation est publiée par pull request.

L'architecture sépare un domaine pur — `src/core/`, qui n'importe ni React ni rien de l'interface — d'un système de plugins où chaque jeu est un dossier autonome derrière un contrat formel. Ajouter un jeu, c'est un dossier et deux blocs d'enregistrement.

La documentation de conception, les décisions d'architecture et le backlog vivent dans [`aidd_docs/`](./aidd_docs/).

## Feuille de route

- [x] Onboarding, parcours groupe par groupe, reprise d'une session interrompue
- [x] Moteur d'évaluation déterministe : critères → axes → niveau par la règle du minimum
- [x] Signature séparée du niveau officiel
- [x] Restitution du verdict : axe qui plafonne, preuve par axe, statut de mesure, plan de progression
- [x] Détail attribuable : un critère manqué nomme ce qui l'a manqué
- [ ] Les trois jeux qui manquent au septième groupe : `scope-break`, `repo-kit`, `task-board`
- [ ] Lecture d'un dépôt Git comme seconde source de preuves
- [ ] Export du verdict en JSON et en Markdown
- [ ] Banc de calibration sur des profils de référence
- [ ] Assistant narratif optionnel, qui reformule un verdict déjà calculé sans jamais le déplacer

## Licence

MIT — voir [`LICENCE.md`](./LICENCE.md).
