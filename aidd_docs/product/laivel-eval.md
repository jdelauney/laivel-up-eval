---
objective: "Une personne sait où elle se situe en AI-Driven Development, sur des preuves de ce qu'elle fait, et ce que le cran suivant lui demanderait."
revision: current
---

# Product Brief: laivel-eval

Un outil web, entièrement côté client, qui situe un développeur sur le référentiel AIDD à sept niveaux et lui rend un plan de progression. Il est en construction pendant un hackathon de 72 heures, rendu le 31 août à midi ; le domaine, les écrans et un jeu gabarit tournent, le parcours réel reste à écrire.

## Opportunity

Situer quelqu'un sur son adoption de l'IA se fait aujourd'hui par une grille auto-évaluée ou par l'impression de son manager. La première se triche sans effort — personne ne coche « j'accepte le code sans le lire » — et la seconde ne dit pas quoi faire ensuite. Le référentiel officiel existe depuis le 19 août et décrit sept niveaux sur quatre axes, mais rien ne l'applique : il se lit, il ne se mesure pas.

La conséquence est double. Une personne surestime sa pratique et s'étonne quand un incident la rattrape. Et un lead tech à qui on demande le niveau de son équipe n'a que du déclaratif à remonter.

Le moment tient au hackathon : le référentiel vient d'être publié, il est stable, et le rendu est daté.

## Audience and Context

**Le développeur évalué.** Seul, à sa machine, volontairement. Il ouvre l'outil pour apprendre quelque chose sur lui-même, et il arrive curieux et un peu sur la défensive : l'outil s'apprête à porter un jugement sur sa compétence. Il veut savoir où il en est vraiment, et ce que le cran suivant demanderait de concret.

**Le jury du hackathon.** Il fait le parcours lui-même, sur sa machine, sans clé d'API, en suivant le README seul. Il note sur cinq la justesse, l'explicabilité, la solidité face à un profil incomplet, et la reprenabilité du travail.

Ces deux publics passent par la même porte. Il n'y a pas de seconde interface, pas de mode jury.

## Product Bet

Si le niveau vient de ce que la personne **fait** dans des mises en situation — elle dépense une ressource rare, la simulation répond, des critères mécaniques lisent le résultat — plutôt que de ce qu'elle déclare, et si le verdict se calcule sans modèle et s'explique axe par axe avec la valeur observée et le seuil franchi, alors elle se reconnaît dans le résultat et agit sur le pas suivant au lieu de le contester.

Le corollaire porte autant que le pari : quand une preuve manque, l'outil le dit et plafonne ce qu'il annonce, au lieu de compter zéro et de rendre un niveau faux.

## Evidence and Assumptions

| Claim | Status | Basis or next check |
| --- | --- | --- |
| Le niveau se calcule sans aucun modèle distant | décision | Contrainte du jury, rappelée à l'oral ; l'assistant IA ne fait que raconter un verdict déjà calculé |
| Les évaluateurs font le parcours eux-mêmes, jamais sur des profils prédéfinis | décision | Arbitrage du 29/08 |
| On mesure le comportement, jamais le déclaratif | décision | Principe produit n°1, tenu dans les quatorze jeux du catalogue |
| Le produit situe une personne ; aucune vue d'équipe | décision | Développeur seul ; l'agrégation reste au lecteur des JSON exportés |
| Le référentiel officiel fait seul autorité sur le niveau ; la signature ne décide rien | décision | `config/grid.json` et `config/signature.json`, dimensions disjointes refusées au chargement |
| Sans dépôt, aucun niveau au-dessus de White n'est annonçable | evidence | Conditions lues dans `config/grid.json` : tout niveau à partir de Red exige `intervention` et `parallele` |
| Les axes d'habitude se lisent sur un dépôt par pure arithmétique | evidence | Compteurs et dates dans les données fournies ; recalculables depuis l'API GitHub, sans modèle |
| Le moteur rend deux fois le même verdict sur les mêmes réponses | evidence | Scoring déterministe, horloge injectée, 123 tests verts |
| Un parcours de quelques minutes révèle une pratique habituelle | assumption | Se vérifie en jouant ; aucun jeu du groupe 7 n'existe encore |
| Les seuils tombent juste sur une personne jamais vue | assumption | Plus de banc de calibration ; se cale au jugé et au test manuel avant dimanche soir |
| Une personne se reconnaît dans son verdict | assumption | Aucun utilisateur réel n'a joué le parcours |
| Quatorze jeux tiennent dans le temps restant | assumption | Un jour et demi, cinq jeux à état encore à concevoir |

## Boundaries

- Addresses : situer une personne sur les sept niveaux, nommer l'axe qui l'a plafonnée, donner par axe l'action manquante et la preuve qui la validerait, et distinguer deux profils de même niveau par une lecture de rigueur.
- Addresses : lire un dépôt Git désigné comme source de preuves factuelles, facultative, déterministe.
- Leaves out : la vue d'équipe, l'agrégation, tout compte et tout serveur.
- Leaves out : la qualité du code, la séniorité et le volume d'usage comme axes de niveau — le référentiel les met hors périmètre, et ils servent au plus de contre-preuve.
- Leaves out : tout calcul, tout classement et tout déplacement de seuil par un modèle.

## Success

La personne lit son verdict, y reconnaît sa pratique, et repart avec une action qu'elle peut faire et dont elle saura dire si elle l'a faite — « poser une boucle de relance sur la commande de test » se vérifie, « améliorer son harness » ne se vérifie pas.

Le pari se juge sur deux des quatre critères du jury : la justesse sur un profil jamais vu, et le fait qu'on comprenne pourquoi. Les deux autres — la solidité face à l'incomplet et la reprenabilité — mesurent l'exécution, pas le pari.

## Validation and Feedback

La prochaine vérification porte sur l'hypothèse la plus risquée, celle qu'un parcours court révèle une habitude : jouer le parcours de bout en bout dès que les deux jeux qui débloquent le verdict existent, avant le gel de dimanche soir, et regarder si le niveau rendu correspond à ce que le joueur sait déjà de lui.

Le signal d'après-usage est l'export JSON de chaque partie, relu après coup. Deux parties d'une même personne qui rendent des niveaux différents ne sont pas un défaut d'affichage : c'est le pari de la reproductibilité qui tombe, et cela remet en cause les seuils, pas l'interface.

## Open Decisions

- L'assistant IA narratif reste optionnel et non planifié. Il porte à lui seul la valeur *Outcome over Output*, qu'aucun groupe de jeux ne couvre.
- L'ordre dans lequel on coupe si les quatorze jeux ne tiennent pas n'est pas arrêté, sauf pour les deux jeux qui débloquent le verdict, qui ne peuvent pas l'être.
- Aucun mécanisme ne vérifie à froid que les seuils sont justes. On accepte de les caler au jugé.
