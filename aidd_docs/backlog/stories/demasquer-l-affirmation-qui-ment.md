---
type: story
status: done
parent: aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
order: 5
---

# Story: Démasquer l'affirmation qui ment parmi des vraies

**As** un développeur évalué
**I want** identifier laquelle de plusieurs affirmations sur les bonnes pratiques IA est fausse
**So that** on mesure si je résiste à une fausse information noyée dans du vrai

## Acceptance

- Une seule affirmation est fausse, et les autres sont vraies et vérifiables.
- Le critère « fausse affirmation identifiée » ressort satisfait ou manqué.
- Le critère « choix stable, sans retournement » ressort satisfait ou manqué.
- La désignation se verrouille dès qu'elle est engagée ; le joueur ne tâtonne pas avant d'être contredit.
- L'assistant réagit à la désignation par une objection écrite d'avance, et le joueur peut alors désigner autrement — une fois, et une seule.
- Aucun modèle n'est appelé : l'objection est du texte de configuration, choisi sans lire la désignation du joueur.
- La révélation de fin de manche montre la vérification de **chaque** affirmation, la menteuse comme les vraies.

## La mécanique retenue, et pourquoi le retournement est mesurable

Un critère « choix stable, sans retournement » suppose une occasion de se retourner. Cette story la fabrique : chaque manche se joue en deux temps.

1. **Désigner.** Quatre affirmations, une seule ment. Le joueur en désigne une, et sa désignation se verrouille.
2. **Tenir ou se dédire.** L'assistant répond en pointant une affirmation qu'il croit menteuse, argument à l'appui. Le joueur maintient sa désignation, ou en désigne une autre — n'importe laquelle, pas seulement celle que l'assistant vient de pointer. Puis la manche se révèle.

L'objection est **écrite d'avance dans le corpus** et ne lit jamais la désignation du joueur. Elle est donc tantôt un désaccord, tantôt une confirmation, sans que sa formulation change : l'assistant énonce son avis, il ne réagit pas au joueur.

### Pourquoi l'objection est parfois fondée

Le corpus porte les deux natures, et ne les annonce pas :

- **Objection creuse** : l'assistant pointe une affirmation vraie. La suivre coûte l'identification.
- **Objection fondée** : l'assistant pointe la menteuse. La suivre rattrape une lecture ratée.

Sans ce mélange, une politique fixe emporterait l'identification sans rien lire : « toujours suivre » suffirait si toutes les objections étaient fondées, et « ne jamais bouger » deviendrait strictement dominant si toutes étaient creuses. Le corpus impose au moins une de chaque, et le schéma de configuration refuse un corpus qui n'en porterait qu'une seule nature.

C'est la différence entre mesurer la résistance et mesurer l'entêtement. Un joueur qui ne bouge jamais garde ses erreurs de lecture, et l'immobilité ne lui rapporte rien d'elle-même : la stabilité ne se compte que sur les manches où il avait raison d'entrée, et il lui en faut deux — voir plus bas.

## Ce qui est noté

Deux critères, tous deux sur la seule dimension `verification` de la signature. Le groupe 1 ne porte aucun axe du référentiel officiel — le placeholder `g1-3` mappait `intervention`, ce mapping disparaît, comme il a disparu de `g1-2`.

| Critère | Satisfait quand |
| --- | --- |
| `g1-3-c1` — la fausse affirmation est identifiée | La **première** désignation vise la menteuse dans au moins 3 manches sur 4 |
| `g1-3-c2` — le choix reste stable | Le joueur a eu au moins **deux occasions de capituler**, et n'en a saisi aucune |

**Une capitulation est un abandon du juste, pas un changement d'avis.** Corriger une désignation fausse — vers la menteuse ou vers une autre erreur — ne coûte jamais la stabilité. Ce qui la coûte est d'avoir tenu la vérité puis de l'avoir lâchée sous l'aplomb.

### Une occasion de capituler, et non une contradiction

**Correction du 30/08, après la revue du candidat.** La première écriture de ce critère demandait « au moins une manche où l'assistant a contredit le joueur ». C'était le mauvais dénominateur, et il ouvrait un trou : être contredit ne suppose que d'avoir désigné autre chose que la cible de l'objection, ce qu'un joueur qui se trompe partout fait mécaniquement. Il était donc contredit quatre fois sur quatre, ne pouvait capituler nulle part — capituler exige d'avoir eu raison d'abord — et décrochait le critère sans avoir lu une ligne. Deux points sur `verification` pour rien.

Une **occasion de capituler** est une manche qui réunit les deux conditions : la première désignation visait la menteuse, et l'assistant a pointé ailleurs. C'est le seul cas où l'aplomb s'exerce contre une lecture juste, donc le seul où tenir démontre quelque chose.

**Un joueur sans occasion rate `g1-3-c2`.** Il ne le satisfait pas par vacuité : c'est la jurisprudence de `kinds-found-including` chez `g1-2`, où un critère sans matière à mesurer noterait sans mesurer.

### Deux occasions, et non une seule

**Second arbitrage du 30/08, après le challenge du candidat.** Le seuil était à une occasion. Passé en force brute sur les 256 parties possibles d'un joueur qui désigne au hasard et ne bouge jamais, ce seuil laissait passer **57,8 %** d'entre elles. Une seule occasion sur quatre tirages à un contre quatre n'est pas une épreuve, c'est une formalité pour qui reste immobile — et l'immobilité n'est pas de la vérification. L'échelle de `verification` va de « accepte ce que l'IA affirme » à « vérification outillée » ; ne pas bouger n'y a aucune place, et ce critère pèse la moitié du jeu.

À deux occasions, le même joueur au hasard tombe à **15,6 %**, et un lecteur qui démasque trois manches sur quatre en garde assez pour satisfaire le critère sans marge acrobatique. Le corpus en offre trois à un lecteur parfait : le seuil prend deux de ces trois, il ne les exige pas toutes.

Ce que ce seuil ne corrige pas, et qu'il faut dire : un joueur chanceux passe encore une fois sur six. Un jeu à quatre choix ne distingue pas deviner juste de lire juste, et aucun réglage de seuil ne le fera — seul un corpus plus long y parviendrait. `verification` est nourrie par cinq situations, et c'est à ce niveau-là que le bruit d'une situation se dilue.

### Pourquoi `g1-3-c1` se lit sur la première désignation

**Même arbitrage, même jour.** Le critère se lisait sur la désignation finale. Cette lecture inversait le verdict pour le profil même que ce jeu existe pour attraper : un lecteur parfait — quatre menteuses désignées d'entrée — qui se laisse retourner deux fois sortait avec « la fausse affirmation n'a pas été identifiée ». Il l'avait identifiée quatre fois sur quatre. Le jeu lui reprochait une ignorance qu'il n'avait pas, et taisait la faiblesse qu'il avait.

Lire `c1` sur la première désignation sépare proprement les deux critères : **`c1` mesure ce que le joueur a lu, `c2` ce qu'il en a fait sous pression.** Aucun des deux ne mord sur l'autre, et le second geste n'influence plus l'identification — ce qui rend `c1` insensible à toute politique de réponse à l'objection, donc plus résistant à la triche que la lecture finale, que « toujours suivre » pouvait infléchir.

Le coût, assumé : un joueur qui lit mal puis se corrige vers la menteuse ne touche plus le crédit d'identification. C'est voulu, et la raison vaut pour les quatre manches : **`c1` mesure la lecture non assistée.** Le second temps est assisté par construction, puisqu'un avis vient d'être montré — peu importe que cet avis soit juste ou creux, il a été vu. Créditer la seconde désignation reviendrait à noter au même prix ce qui a été trouvé seul et ce qui a été trouvé après consultation.

Le motif à ne pas retenir, parce qu'il ne tient que sur un quart du corpus : « se corriger revient à suivre l'assistant ». C'est vrai de `r2`, la seule manche à objection fondée. Sur `r1`, `r3` et `r4`, l'objection pointe une affirmation vraie, donc un joueur qui se corrige vers la menteuse va précisément là où l'assistant n'a pas pointé. C'est une relecture indépendante, pas une obéissance — elle reste non créditée, mais pour la raison générale, pas pour celle-là.

## Ce que ce jeu mesure, et ce qu'il ne mesure pas

**Il mesure deux choses distinctes, et c'est voulu.** Le premier critère mesure la connaissance des pratiques IA — savoir que le contexte transféré compte, que le code qui compile n'est pas le code correct. Le second ne mesure aucune connaissance : il mesure ce que le joueur fait de la sienne quand on la conteste avec aplomb. Un développeur qui sait mais se dédit ressort avec le premier critère et sans le second, et c'est exactement le profil que la signature `verification` doit distinguer d'un développeur qui sait et tient.

**La séniorité n'entre pas ici**, contrairement au voisin `g1-2` où elle fuit par la connaissance d'un framework. Les affirmations portent sur des pratiques d'usage de l'IA, pas sur une pile technique : un développeur de quinze ans qui n'a jamais outillé un assistant n'y a aucun avantage.

**Le corpus est unique, figé et publié**, comme celui de `g1-2` : `config/course.json` porte en clair les affirmations, leur véracité et les objections dans un dépôt public. Rejouer le parcours ne mesure plus rien sur cette situation une fois le corpus mémorisé. C'est le prix d'un outil entièrement côté client, à énoncer sur la page méthodologie.

## La frontière avec les deux jeux voisins

Trois situations de ce backlog mettent le joueur face à une IA qui affirme. Elles ne mesurent pas la même chose, et la limite est écrite ici plutôt que découverte devant le jury.

| Situation | Le geste demandé | Ce qui décide |
| --- | --- | --- |
| `g1-1` `confidence-bet` | Miser une confiance sur un extrait, sans le trancher | La calibration : miser haut sur du sain, bas sur du défectueux, neutre sur l'indécidable |
| `g1-3` — cette story | Désigner la menteuse d'un lot, puis tenir ou se dédire | La lecture, puis la tenue sous contradiction |
| `g3-1` `répondre à une IA qui se trompe` | Conduire un dialogue à branches, dont les choix ont des conséquences plus loin | La résilience : ce qu'on fait **après** avoir vu l'erreur — reformuler, vérifier, accepter |

La confusion à éviter est avec `g3-1`. Ici, l'échange est un unique aller-retour, sans branche et sans conséquence différée : la manche se révèle et la suivante repart à zéro. Là-bas, une branche acceptée à tort revient plus loin dans le scénario. Un jeu mesure la tenue d'un instant, l'autre la conduite d'une réparation.

## Contrainte de rédaction du corpus

Une affirmation vraie doit être **vraie sans discussion**, pas seulement défendable. Le joueur n'a qu'une désignation par manche : une affirmation vraie mais discutable transforme la manche en pari, et le jeu mesure alors la tolérance au risque, pas la lecture.

Quatre garde-fous, à tenir dans le test d'intégration du corpus :

1. Chaque affirmation vraie porte sa **vérification** : une phrase qui dit à quoi on la vérifie, montrée à la révélation. Une affirmation vraie qu'on ne saurait pas vérifier n'a rien à faire dans le corpus, l'acceptance l'exige.
2. La menteuse porte sa **réfutation**, qui dit pourquoi elle est fausse — jamais un simple « faux ».
3. **La menteuse n'est pas repérable à sa forme.** Ni plus longue, ni plus catégorique, ni seule à porter un absolu. Un joueur qui trouve par la mise en forme ne lit pas.
4. **L'argument d'une objection creuse tient debout.** Une objection visiblement stupide ne teste aucune résistance, elle teste la lecture d'un piège. L'aplomb est la matière du jeu.

## Ce qui s'énonce, ce qui se tait

`DESIGN.md` : « Un jeu ne dit jamais ce qu'il note. Le contrat annonce le cadre, jamais les critères. »

| S'énonce | Se tait |
| --- | --- |
| Qu'une seule affirmation ment par manche | Laquelle, et à quoi elle se repère |
| Que la désignation se verrouille dès qu'elle est engagée | Que la première désignation n'est pas ce qui est noté |
| Que l'assistant donnera son avis ensuite, et qu'on pourra désigner autrement une fois | Que l'assistant se trompe parfois, et à quelle fréquence |
| Le nombre de manches, et la manche courante | Les seuils, et le fait qu'un retournement se paie |
