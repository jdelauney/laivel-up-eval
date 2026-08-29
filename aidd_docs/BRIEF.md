# Brief Produit — Outil d'évaluation du niveau AI-Driven Development

> Document de cadrage produit. Réécrit le 29/08 après publication du sujet officiel (`SUJET.md`, vendredi 28 août 12h). Le parcours interactif reste la mécanique de l'outil ; les dossiers de profils fournis par les organisateurs servent de banc de calibration interne, §8.

---

## 1. Le sujet, tel qu'il est posé

> **CTO** : « Il me faut le niveau AI-Driven Development de toute ton équipe ainsi qu'un plan de progression pour chacun d'eux. Pour vendredi. »

On est Lead Tech. On dispose de dépôts Git, d'historiques de PR, de code, d'analyse statique, et de ce que les gens racontent d'eux-mêmes. Il faut construire l'outil qui décide **quelles informations prendre en compte** pour placer un profil sur **le bon niveau** et **l'aider à progresser**.

```
Un profil (ce qu'on sait de quelqu'un)  →  l'outil  →  son niveau · pourquoi · comment progresser
```

Ces trois sorties sont le minimum exigé.

**Cadre officiel :**

| Aspect | Détail |
|---|---|
| Livrables | Dépôt public MIT, sans clé d'API dans le code ni dans l'historique · l'outil qui tourne en suivant le README seul · la méthode en une page · une vidéo de 2 min max |
| Échéance | Lundi 31 août 12h, via le formulaire de rendu (sa date fait foi) |
| Format de rendu | Libre : app, CLI, questionnaire, GitHub Action, skill, agent |
| Données d'entrée | `levels/aidd.md` (la grille) + 4 dossiers de profils fictifs avec leur niveau attribué |
| Participation | Solo, 100 % distanciel |
| Langue | Français |

**Critères de jugement, chacun noté sur 5 :**

1. **Ça tombe juste ?** — passage sur des profils jamais vus, y compris incomplets.
2. **On comprend pourquoi ?** — sur quelles informations l'outil se base, comment c'est évalué, et pourquoi.
3. **C'est solide ?** — ne plante pas sur un profil incomplet, et **assume quand il n'est pas sûr**.
4. **On peut le reprendre ?** — code lançable, lisible, repris par quelqu'un d'autre. Le harnais monté autour du modèle et le flow suivi sont eux aussi regardés.

Bonus explicitement mentionné : un outil agréable, avec un peu de jeu.

---

## 2. Les deux contraintes qui décident de l'architecture

### 2.1 Aucun modèle distant requis

> « On n'aura pas tes clés d'API. On lance ton outil sur nos machines, avec ce que dit ta doc et rien d'autre. S'il a besoin d'un modèle distant pour tourner, on ne pourra pas le passer sur les profils. »

**Conséquence, non négociable : le niveau se calcule sans IA.** Toute la chaîne signaux → axes → niveau → plan de progression est déterministe, en code, sur des seuils lus dans du JSON. L'assistant IA devient une **option désactivée par défaut**, activable à l'onboarding avec la clé du joueur, et strictement narrative : il reformule un verdict déjà calculé, il ne le calcule jamais et ne peut pas le déplacer. Sans clé, l'outil produit la même sortie, rédigée par des gabarits.

C'est aussi ce qui rend le résultat reproductible : deux exécutions sur le même dossier donnent le même niveau, à la virgule.

### 2.2 L'outil s'utilise, il ne s'exécute pas sur un dossier

**Le jury ne lancera pas l'outil sur les dossiers de profils fictifs.** L'entrée reste l'usage direct : la personne fait l'onboarding, désigne son dépôt GitHub, parcourt l'évaluation, obtient son niveau. Les quatre profils fournis servent en interne, à calibrer les seuils et à prouver que l'outil tombe juste (§8) : ce sont des données de vérification, pas une voie d'entrée produit.

Le socle déjà construit — grille data-driven, résolution de niveau par seuils, mode replay, façade de session — est conservé tel quel et reste la colonne vertébrale. Ce qui s'ajoute, c'est une seconde source de preuves à côté du parcours : le dépôt lui-même.

---

## 3. Le référentiel officiel

Sept niveaux cumulatifs — `White`, `Red`, `Blue`, `Green`, `Copper`, `Silver`, `Gold` — sur quatre axes :

| Axe | Ce qu'il mesure | Crans |
|---|---|---|
| **Taille** | La taille **habituelle** des features livrées avec l'IA, pas la plus grosse jamais faite | S · M · L · XL |
| **Harness** | Ce qui est monté autour du modèle | prompts · context engineering · behavior · boucles |
| **Intervention** | Quand la personne reprend le travail de l'IA | après coup sur la majorité · sur une partie · aux étapes clés · jamais |
| **En parallèle** | Combien de chantiers avancent **habituellement** en même temps, un pic isolé ne compte pas | 0 · 1 · 3 |

**La règle du minimum : un niveau n'est atteint que si tous ses axes le sont.** Chaque cellule est un plancher, pas une valeur exacte. La colonne « ce qu'on observe » illustre, elle ne décide pas.

**Hors périmètre, à ne surtout pas remonter en signal :** la séniorité, la qualité du code (prérequis, pas axe), le volume d'usage. Le nombre de commits, de PR ou de tokens ne monte donc jamais un niveau : ce sont des **dénominateurs**, jamais des numérateurs.

### 3.1 Ce qu'on ajoute au référentiel, et pourquoi

Le sujet invite explicitement à bouger la grille (« ajouter un axe, déplacer un niveau, mesurer autrement, vas-y, dis-nous pourquoi »). Trois écarts assumés :

1. **Un axe `initiative`.** Silver et Gold partagent les quatre axes officiels au même cran ; seule la colonne d'observation les sépare (« les agents prennent les tâches en autonomie, plusieurs PR par jour »). Sans axe dédié, la frontière Silver/Gold n'est pas calculable. `initiative` la rend décidable.
2. **Une lecture complémentaire, la signature** (`config/signature.json`) : `verification`, `pilotage-contexte`, `resilience`. Elle **ne pèse sur aucun niveau** et sert le « comment progresser ». Deux profils Copper, l'un qui vérifie et l'autre qui accepte tout, ne sont pas le même développeur ; la grille leur donne pourtant le même niveau, et c'est cohérent puisqu'elle annonce la qualité comme prérequis.
3. **Un statut de mesure par axe** : `mesuré` / `inféré` / `non mesuré`. Un axe non mesuré n'est pas compté à zéro : il **plafonne** le niveau annonçable et le verdict le dit. C'est la réponse directe au critère « il assume quand il n'est pas sûr ».

---

## 4. Ce que l'outil prend en entrée

Quatre sources, un seul format interne normalisé (le *faisceau de preuves*), un seul moteur derrière.

| Source | Adapter | Quand | Rôle |
|---|---|---|---|
| **Parcours d'évaluation** | mises en situation où la personne agit, le jeu simule le résultat, les critères portent sur ce résultat | toujours | **entrée principale**, et la seule qui couvre les axes qu'un dépôt ne prouve pas |
| **Dépôt GitHub** | nom `owner/repo` saisi à l'onboarding, API GitHub en lecture (token optionnel pour le quota) | si la personne en désigne un | preuves factuelles, elles priment sur le déclaratif |
| **Dépôt local** | `git log` et arborescence, zéro réseau | mode hors ligne | repli du précédent |
| **Dossier au format organisateurs** | lecture de `profile.json`, `git-activity.json`, `pull-requests.json`, `sonar-measures.json`, `repo-context/`, `code/`, `declaratif.md`, `session.md` | banc de calibration | **usage interne**, pas une voie d'entrée produit |

Le format interne est le contrat : chaque adapter produit des **signaux typés et sourcés**, le moteur ne sait pas d'où ils viennent. Ajouter une source ne touche pas le moteur.

**Aucune source n'est complète.** Un dépôt sans PR, un parcours interrompu, un profil sans dépôt : l'absence est un cas nominal, jamais une erreur. Elle se traduit en statut de mesure (§3.1), pas en zéro.

---

## 5. Le catalogue de signaux

C'est le cœur du produit et la matière du critère « on comprend pourquoi ». Chaque signal est du JSON : un identifiant, l'axe visé, la règle de lecture, le seuil par cran. Déplacer un seuil ne touche pas une ligne de code.

Deux familles alimentent les mêmes axes et se renforcent : les **signaux de dépôt**, factuels, décrits ci-dessous, et les **critères de parcours**, qui portent sur ce que la personne a fait dans une mise en situation. Quand les deux parlent, le dépôt tranche. Quand le dépôt est muet sur un axe, le parcours le couvre, avec une confiance moindre et affichée.

### 5.1 Axe `taille`

| Signal | Lecture | Source |
|---|---|---|
| Distribution des tailles de PR | La classe **habituelle**, pas le maximum : le plus haut cran qui pèse au moins un quart des PR de la période | `git-activity.json`, ou reconstruit depuis `changed_files` et `additions/deletions` par PR |
| Médiane de fichiers et de lignes modifiés | Repli quand la distribution manque, seuils par cran dans le JSON | `git-activity.json`, GitHub, `git log` |
| Étendue du périmètre | Une PR qui traverse plusieurs modules compte XL ; une PR volumineuse dans un seul dossier reste L | chemins des fichiers |

Le garde-fou porte le mot « habituelle » : une seule PR XL dans un semestre de PR S ne fait pas un profil XL.

### 5.2 Axe `harness`

L'escalier se lit par présence **et substance** des artefacts, jamais par leur simple nom de fichier.

| Cran | Ce qui le déclenche |
|---|---|
| prompts | Usage d'un assistant attesté (co-auteur sur les commits, mention d'outil) sans aucun artefact versionné |
| context engineering | Mémoire projet présente **et maintenue** : `CLAUDE.md`, `AGENTS.md`, instructions d'éditeur, ou un dossier de contexte (architecture, conventions, glossaire, testing, vcs, stack, brief produit, PRD) |
| behavior | Règles, agents, hooks, skills, guardrails versionnés : dossiers de règles, d'agents, de hooks, fichiers `SKILL.md`, réglages d'outil |
| boucles | Un mécanisme qui **relance l'assistant tant qu'une commande du projet échoue** : script de boucle, hook de relance, job qui itère jusqu'au vert |

Quatre précautions, chacune coûte cher si on l'oublie :

- **Neutralité d'outil.** « Ce qui compte, c'est ce qui est en place, jamais la marque. » Le catalogue reconnaît des **familles** d'artefacts par motif de chemin, déclarées en JSON : Claude Code, Cursor, Copilot, Windsurf, Aider, framework maison. Reconnaître un seul outil, c'est perdre le critère de justesse sur un profil qui en utilise un autre.
- **Substance avant présence.** Un fichier de contexte de trois lignes jamais mis à jour n'est pas du context engineering. Chaque artefact est pondéré par sa taille utile et par sa fraîcheur (`last_updated`, date du dernier commit qui l'a touché). Compter des fichiers récompense le cargo cult, et le jury cherche précisément ce piège.
- **Un hook n'est pas une boucle.** Un hook de vérification bloque ; une boucle relance. Le cran `boucles` exige la preuve de la relance automatique, sinon Silver tombe à tort. C'est le point qui sépare Copper de Silver.
- **Le nom du dossier d'un `SKILL.md` compte**, mais pour le plan de progression, pas pour le niveau : il dit quels moments du flux sont outillés (planification, migration, revue, rollback) et donc lesquels ne le sont pas.

### 5.3 Axe `intervention`

| Signal | Lecture |
|---|---|
| Commits correctifs après ouverture de PR (médiane) | Le plus discriminant : beaucoup = « après coup sur la majorité », zéro = « aux étapes clés » ou mieux |
| Part de PR mergées sans aucune édition humaine après ouverture | Le passage à « jamais » exige une part dominante, pas un tiers |
| Commentaires de revue reçus (médiane) et taux de revert | Contre-preuve : reprendre peu mais casser souvent n'est pas un niveau supérieur |
| Répartition auteur humain / co-auteur IA sur les commits d'une PR | Un commit humain après ouverture ferme Silver |

L'axe est scoré comme **absence de reprise**. Attention au piège symétrique : quelqu'un qui n'utilise pas l'IA n'a rien à reprendre. Un `intervention` élevé n'a de sens que si l'assistant est effectivement à l'œuvre.

### 5.4 Axe `parallele`

| Signal | Lecture |
|---|---|
| Branches concurrentes, **médiane** sur la période | La grille dit « habituellement, un pic isolé ne compte pas » : le maximum est affiché, il ne décide pas |
| PR ouvertes le même jour et menées jusqu'au merge | Reconstruit depuis les dates d'ouverture et de merge |
| Chantiers abandonnés | Trois branches ouvertes dont deux mortes ne font pas trois chantiers |

### 5.5 Axe `initiative`

| Signal | Lecture |
|---|---|
| PR ouvertes par un compte agent ou portant une signature d'agent | Le cran haut : l'agent ouvre la PR lui-même |
| Plusieurs PR abouties le même jour sans commit humain | Le cran Gold |
| Cadence et régularité des livraisons agents | Distingue l'automatisation installée du coup d'éclat |

### 5.6 Signaux transverses

| Signal | Ce qu'il sert |
|---|---|
| Conformité des messages de commit à une convention | **Pas un axe.** Indice de discipline, pour la signature et le plan de progression |
| Présence de README, LICENSE, CI | Idem : hygiène de dépôt, jamais un cran de niveau |
| Analyse statique (couverture, dette, complexité) | Hors périmètre pour le niveau. Sert de **contre-preuve** : la qualité est le prérequis, un dépôt en ruine invalide une lecture haute plutôt qu'il ne la produit |
| Écart déclaratif / observé | Le déclaratif ne monte jamais un niveau. Il alimente une ligne du rapport : « se décrit avancé, les faits disent Red » |
| Transcript de session (`session.md`) | Lecture lexicale déterministe : cadrage, arrêt sur dépendance croisée, pilotage du contexte. Faible confiance assumée, marquée comme telle |

---

## 6. Ce que l'outil produit

| Bloc | Contenu |
|---|---|
| **Le niveau** | Un des sept, avec l'axe qui l'a plafonné nommé explicitement |
| **Pourquoi** | Par axe : le cran atteint, le signal qui l'a fixé, la valeur observée, le seuil franchi ou manqué, le fichier d'où ça vient |
| **La confiance** | Par axe : mesuré, inféré, non mesuré. Un axe non mesuré plafonne le verdict et le rapport le dit en clair |
| **Comment progresser** | Pour chaque axe sous le cran du niveau suivant : l'action concrète manquante **et la preuve qui la validerait**. « Poser une boucle de relance sur la commande de test » se vérifie ; « améliorer son harness » ne se vérifie pas |
| **La signature** | La lecture complémentaire, hors niveau, qui distingue deux profils classés pareil |
| **Export** | JSON complet (trace d'audit rejouable) et Markdown lisible |

L'export JSON est la trace qui rend le verdict opposable : on rejoue le même faisceau de preuves, on retombe sur le même niveau.

---

## 7. Fonctionnalités socle

| Fonctionnalité | Description |
|---|---|
| **Onboarding** | Présentation de la personne, **nom du dépôt GitHub à analyser** (facultatif, le parcours fonctionne sans), et **case à cocher pour l'assistant IA narratif** avec saisie de sa propre clé, désactivée par défaut, à révoquer après usage |
| **Parcours d'évaluation** | Déroulé groupe → mise en situation → mise en situation, progression visible, critères OUI/NON appliqués mécaniquement au résultat simulé |
| **Ingestion du dépôt** | Lecture du dépôt désigné, tolérante à ce qui manque, avec le rapport de ce qui a été trouvé et de ce qui ne l'a pas été |
| **Moteur d'évaluation** | Signaux → crans par axe → niveau par la règle du minimum. Entièrement déterministe, seuils en JSON |
| **Rapport** | Verdict, preuves, confiance, plan de progression. Rendu à l'écran, exportable en JSON et en Markdown |
| **Assistant IA narratif** | Optionnel. Reçoit la trace structurée et rédige l'explication en français. Ne calcule rien, ne déplace rien. Repli par gabarits sans clé |
| **Banc de calibration** | Les quatre profils fournis, leur niveau attendu, un test automatisé qui échoue si un mapping dérive |

---

## 8. Le banc de calibration

Le banc est un outil de développement, pas une fonctionnalité livrée. Il prend les quatre profils fournis, les convertit en faisceau de preuves, les passe dans le moteur de production et compare au niveau attendu. C'est ce qui permet d'affirmer que les seuils tombent juste sans attendre le verdict du jury.

Les quatre profils fournis, avec le niveau attribué par les organisateurs, et la lecture que les règles ci-dessus en font :

| Profil | Attendu | Taille | Harness | Intervention | Parallèle | Ce qui plafonne |
|---|---|---|---|---|---|---|
| `perceval` | 🔺 Red | S (54 % de PR S/XS) | prompts (aucun artefact) | 4 commits correctifs médians | 1 | Tout converge vers Red |
| `bohort` | 🔹 Blue | M (50 % de PR M) | context engineering (mémoire seule) | 2 correctifs médians | 1 | Le harness : pas de behavior |
| `leodagan` | 🟢 Green | L (56 % de PR L/XL) | behavior (règles, agents, hooks, skills) | 0 correctif, 52 % sans édition | 1 | Le parallélisme : un seul chantier |
| `arthur` | 🥉 Copper | L-XL (73 %) | behavior (skills, agents, pas de boucle) | 1 correctif médian, 30 % sans édition | 4 | L'absence de boucle et le taux d'édition |

Les quatre tombent juste avec les règles décrites, sans cas particulier et sans modèle. C'est le socle de non-régression : toute modification de seuil rejoue ce banc.

Trois pièges annoncés par les organisateurs, et la réponse de l'outil :

- **Croire le déclaratif** → il ne monte jamais un niveau (`perceval` se décrit avancé, il est Red).
- **S'arrêter aux métriques** → la couverture de tests est hors périmètre, elle sert de contre-preuve.
- **Confondre richesse et niveau** → `bohort` a le dossier le plus fourni et le niveau le plus bas des trois qui parlent d'eux-mêmes. Le moteur compte des crans, pas des fichiers.

---

## 9. Planning restant (samedi 29 → lundi 31, 12h)

| Créneau | Contenu |
|---|---|
| Sam 29 | Catalogue de signaux en JSON, mapping des quatre axes, banc de calibration au vert sur les quatre profils |
| Sam 29 soir | Adapter GitHub, statut de confiance par axe, plan de progression par axe |
| Dim 30 | Parcours d'évaluation : les mises en situation, en commençant par les axes que le dépôt ne prouve pas. Rapport à l'écran, export. **Feature freeze dimanche soir** |
| Lun 31 matin | README lançable sans clé, méthode en une page, vidéo de 2 min, licence MIT, vérification qu'aucune clé ne traîne dans l'historique |

Discipline : le banc de calibration passe au vert **avant** d'ajouter la moindre mise en situation. Les seuils du moteur sont ce que le jury teste en premier ; une mise en situation de plus ne rattrape pas un seuil faux.

---

## 10. Décisions ouvertes

1. **Nombre de mises en situation.** Le socle est construit, aucune situation métier ne l'est. Priorité aux axes qu'un dépôt ne prouve pas : le harness au cran `boucles`, l'intervention au moment du cadrage, l'initiative. Deux situations solides valent mieux que six bancales.
2. **Quota GitHub.** L'API non authentifiée est limitée ; la fenêtre d'analyse est bornée (six mois, dernières PR) et les réponses mises en cache. Un token reste optionnel et jamais requis.
3. **Lecture des artefacts en prose** (`declaratif.md`, `session.md`) sans modèle : extraction lexicale, confiance basse assumée et affichée. C'est le seul endroit où l'absence d'IA coûte de la finesse, et le rapport le dit plutôt que de le maquiller.
4. **Seuil du cran `boucles`.** Le plus difficile à prouver depuis des données seules. Tant que la preuve manque, le cran n'est pas accordé : mieux vaut un Copper justifié qu'un Silver optimiste.
