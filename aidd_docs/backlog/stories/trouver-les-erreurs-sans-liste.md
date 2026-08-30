---
type: story
status: proposed
parent: aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
order: 4
---

# Story: Trouver les erreurs d'un extrait sans qu'on me les liste

**As** un développeur évalué
**I want** cliquer les défauts d'un extrait sans qu'on me dise combien il y en a, et rendre ma revue quand je l'estime finie
**So that** on mesure si je lis vraiment le code au lieu de reconnaître des motifs

## Acceptance

- Ni le nombre d'erreurs, ni leur nature ne sont annoncés, et aucune liste de choix n'est fournie.
- Les erreurs couvrent au moins la sécurité, la logique et la dépendance hallucinée.
- Le joueur décide seul quand rendre sa revue : rien ne lui dit qu'elle est complète.
- Le barème est **+1 par ligne fautive marquée, −1 par ligne saine marquée, 0 pour une ligne laissée de côté**, et il est annoncé.
- Le critère « au moins 80 % des erreurs trouvées » ressort satisfait ou manqué.
- Le temps imparti est visible et son dépassement fait manquer son critère.

## Décision du 30/08 : le nombre n'est plus annoncé

La première écriture de cette story annonçait le nombre de défauts. Il ne l'est plus.

Un compte annoncé donne au joueur une **règle d'arrêt** : il sait quand s'arrêter de chercher, et il apprend à jouer le nombre plutôt qu'à lire. Le retirer supprime cette béquille — le joueur ne sait jamais s'il a fini, exactement comme en revue réelle.

Ce qui le remplace est le barème lui-même. Le point négatif par affirmation fausse rend le marquage au hasard perdant sans qu'aucun compte n'ait à être donné, et le zéro sur une ligne laissée de côté fait que **ne pas savoir n'est jamais puni : seule l'affirmation fausse l'est**.

Conséquence directe : l'ancien critère qui comptait les faux positifs contre un seuil séparé a disparu. Le barème les fait déjà payer un par un, et un second critère les aurait punis deux fois pour la même marque.

## Seuils retenus

Câblés dans `config/course.json`, situation `g1-2`, et verrouillés par
`__tests__/integration/course-run/defect-hunt-run.test.ts` :

- Score net : au moins **3** points sur les 5 défauts du corpus (`net-score-at-least`, 3). Autrement dit trouver au moins quatre défauts sur cinq sans affirmer plus de deux choses fausses.
- Ratio de défauts trouvés : au moins **80 %** (`found-ratio-at-least`, 0.8).
- La dépendance hallucinée, seul défaut de nature IA du corpus, porte son propre critère (`kinds-found-including`).
- Temps imparti : **trois minutes** (`timeLimitSeconds: 180`), lu par `within-time-budget`, sans seuil propre à la règle.
- Le dépassement du temps ne coûte que son propre critère (`g1-2-c4`) : la partie ne s'arrête pas, et les trois autres critères gardent leur verdict.

## Ce que ce jeu mesure, et ce qu'il ne mesure pas

À écrire ici plutôt qu'à découvrir devant le jury.

**Sur les sept points de la situation, cinq mesurent la relecture de code, deux mesurent la vérification face à une IA.** Quatre défauts sur cinq — coercition silencieuse, décalage de pagination, injection SQL, appel sans parenthèses — sont des défauts humains classiques, sur les grilles de revue depuis quinze ans. Un développeur qui n'a jamais ouvert un assistant et relit des routeurs pour vivre sort au score plein. Seule la dépendance hallucinée est de nature IA, et c'est exactement pourquoi elle porte son propre critère à poids 2.

Ce n'est pas un défaut de conception : `verification` est nourrie par cinq situations, et les deux voisines du même groupe visent l'IA de front — `g1-1` calibre la confiance sur des affirmations vraies, fausses ou indécidables, `g1-3` demande laquelle de ces affirmations ment. Celle-ci est la jambe « sais-tu réellement lire » d'un trépied.

Ce qu'il faut donc dire, et ne pas dire : **« ce jeu mesure si vous attrapez les défauts d'un code que vous n'avez pas écrit, dont un défaut de forme IA »** — pas « ce jeu mesure votre pratique de vérification de l'IA ».

**La séniorité fuit dans la mesure.** Un développeur rigoureux qui relit chaque diff mais connaît mal Express rate le décalage de pagination. `PRODUCT.md` met la séniorité hors périmètre de la **grille officielle** ; `verification` vit dans la signature, qui n'est pas couverte par cette exclusion. Le niveau officiel ne bouge pas, la signature si.

**Le corpus est unique, figé, et publié.** Deux conséquences assumées : rejouer le parcours ne mesure plus rien sur cette situation une fois l'extrait mémorisé, et `config/course.json` porte les lignes, les natures et les explications en clair dans un dépôt public. C'est le prix d'un outil entièrement côté client, où « ce qui est mesuré est de la donnée ». À énoncer sur la page méthodologie.

## Contrainte de rédaction du corpus

Sans compte annoncé, chaque hésitation du joueur se paie. L'extrait doit donc être **sans ambiguïté** : chaque défaut n'a qu'un seul endroit où on le corrige, et les lignes saines encore défendables sont listées, comptées, et tenues sous la tolérance du seuil.

Trois garde-fous le tiennent, tous dans le test d'intégration :

1. Chaque ligne fautive porte une instruction complète — équilibre des parenthèses et des accolades.
2. Le marqueur de chaque défaut n'apparaît qu'une fois dans tout l'extrait.
3. Les lignes saines encore défendables vivent dans une liste nommée, revue à la main, et un test casse dès qu'on lui en ajoute une sans bouger le seuil.

Le troisième est né d'un échec des deux premiers, et le corpus a dû être réécrit trois fois avant de tenir.

La fuite de connexion a d'abord été posée sur un retour anticipé, puis sur un `release` sans parenthèses dans un bloc sans `finally` : dans les deux cas le correctif complet vivait sur deux lignes, et un relecteur qui diagnostiquait juste en marquant les deux sortait **moins bien noté** que celui qui n'en voyait que la moitié. Un marqueur textuel unique ne prouve pas un lieu de correction unique.

La troisième écriture a fait apparaître la même forme sur l'injection SQL : lier un paramètre oblige à toucher aussi le site d'appel, donc la requête et son appel devaient tenir sur la même ligne. La leçon est générale — **un défaut dont le correctif s'étale sur deux lignes n'a rien à faire dans ce corpus**, quelle que soit sa nature.
