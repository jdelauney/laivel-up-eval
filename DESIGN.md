# Design

Le contrat visuel de laivel-eval. Écrit depuis ce qui est construit, pas depuis ce qui était espéré. Tout écran suivant s'y conforme ou le modifie explicitement.

Le cadrage produit vit dans [PRODUCT.md](PRODUCT.md). La stratégie propre à l'accueil vit dans [.impeccable/surfaces/onboarding-components-sections-onboarding-view-tsx.md](.impeccable/surfaces/onboarding-components-sections-onboarding-view-tsx.md).

## Le monde

**Le carnet de vol.** Un pilote est jugé sur ce qu'il a fait aux commandes, contre des critères objectifs, dans le seul métier où se mentir à soi-même tue. Le débriefing raconte le vol sans jamais changer ce qui s'est passé — c'est exactement « l'IA raconte le verdict, elle ne le calcule jamais », rendu en objet.

Ce que ce monde refuse : la carte centrée sur un dégradé doux, la barre de progression, les confettis, la gamification. Ce monde avance par crans, il ne fond pas.

## Deux plans, deux canaux de couleur

La règle structurante, celle dont tout le reste découle.

| Plan | Rôle | Jetons |
| --- | --- | --- |
| Panneau | Le monde du groupe en cours. Porte la couleur, pleine force. | `--group-1` à `--group-7` |
| Relevé | La carte d'os qui flotte au-dessus. Constante, quel que soit le groupe. | `--plane`, `--plane-foreground`, `--plane-rule` |

Les deux canaux ne se croisent jamais. Conséquence directe : un état se lit toujours contre le même neutre, jamais contre six fonds différents. C'est ce qui rend la couleur d'état fiable sur l'ensemble du parcours.

## Couleur

Stratégie **engagée** : sept teintes de groupe pleine force, plus un neutre d'os. Ce n'est pas un accent posé sur du gris.

- Sept mondes de groupe : orange oxyde, jaune de chrome, herbe, sarcelle, outremer, violet, magenta. Un groupe, une teinte, pour tout le produit.
- Les sept teintes parcourent la roue dans l'ordre des groupes, du chaud au froid puis retour vers le magenta. Le pas entre deux voisines ne descend jamais sous une trentaine de degrés : c'est ce qui garde deux groupes distincts sur la rampe, vus de loin et en périphérie.
- **Le septième monde s'est ajouté après coup**, quand le parcours a pris un groupe portant les axes du référentiel officiel. Il est posé en `oklch(0.52 0.168 338)`, entre le violet du groupe 6 et le vermillon d'erreur, plus près du violet que du vermillon — un monde ne doit jamais se confondre avec une faute.
- **Le vermillon est tenu à l'écart.** Jamais un groupe, toujours l'erreur. C'est ce qui lui garde son pouvoir de signal.
- Triade d'état, sur le plan de relevé uniquement : `--nominal` vert, `--caution` ambre, `--missed` vermillon. Une couleur, un sens, dans tout le produit.

Fond clair. La scène qui l'impose : un développeur à son bureau le soir, lumière de pièce allumée, un onglet ouvert délibérément pour apprendre quelque chose sur lui-même. Un poste de travail éclairé, et un monde fait d'imprimé sous lumière de travail.

**Un seul thème.** Le bloc `.dark` a été retiré de [src/index.css](src/index.css). La variante `dark` y reste déclarée parce que sept primitives shadcn générées par la CLI y font référence et que la retirer casse leur compilation. Réintroduire un thème sombre veut dire redéfinir ces jetons, pas basculer une classe.

## Typographie

Inter Variable, sur `--font-sans` et `--font-heading`. Un seul caractère : c'est une surface Operate, une face de labeur y sert la tâche mieux qu'une face à point de vue.

| Rôle | Traitement |
| --- | --- |
| Titre d'écran | `text-3xl` à `text-4xl`, `font-semibold`, interlignage serré, une seule occurrence par écran |
| Marque et libellés d'état | `text-xs`, majuscules, interlettrage `0.12em` à `0.18em` |
| Chiffres | `tabular-nums`, toujours — un score qui change ne doit pas déplacer ce qui l'entoure |
| Support | Corps courant, `--plane-foreground` à 70 % d'opacité |

## L'état est une quantité physique

Un changement d'état déplace le poids, la taille ou l'épaisseur du filet — jamais une couleur seule, jamais une opacité réduite.

- Un groupe non atteint prend une **marque structurelle** : filet pointillé, fond évidé. Il reste lisible, on ne le devine pas.
- Le groupe courant prend un anneau et un poids de texte plus fort.
- Une erreur prend un filet supérieur épais en vermillon sur une plaque bordée. Jamais un liseré latéral : `border-l-4` est le tic le plus reconnaissable des interfaces générées, et le détecteur du projet le refuse.

## Composition

- Coquille : en-tête avec la marque à gauche, un emplacement d'état à droite. Zone principale centrée, `max-w-4xl`.
- L'accueil et le parcours partagent une grille à deux colonnes : la rampe des groupes à gauche tient l'axe vertical, le relevé à droite porte le contenu. Sur mobile, la rampe passe à l'horizontale au-dessus.
- **La rampe remplace la barre de progression.** La hauteur d'un onglet encode l'étendue de son groupe. Une barre dit combien il reste ; la rampe dit de quoi c'est fait. Elle est pilotée par `course.json` et prendra sa forme complète quand les sept groupes existeront.
- Un seul pas d'espacement, plus d'air au-dessus d'un titre qu'en dessous.
- Une seule action primaire par écran.

## La surface d'un jeu

Vingt jeux, vingt surfaces. Aucun n'hérite de la composition d'un autre : une frise de six étapes, un répartiteur d'attention sur quatre pistes et une boutique suivie de vagues ne se rangent pas pareil. Chacun a sa fiche sous [.impeccable/surfaces/](.impeccable/surfaces/), et chacun se dessine à son tour.

Ce qui ne se redécide pas, en revanche, et qui vaut pour les vingt :

- **Le coût d'un geste est annoncé, sa conséquence ne l'est jamais.** Un joueur qui connaît le prix de son erreur avant de la commettre joue les règles, pas la situation, et le jeu ne mesure plus rien.
- **La partie vit dans le composant du jeu ; ce qui est soumis est la trace du déroulé.** Le contrat de plugin n'expose qu'une soumission par jeu — un jeu à état garde donc son avancée chez lui, et rend l'historique de ses gestes comme réponse.
- **Un état est une quantité** : le remplissage, la taille, l'épaisseur du filet. Jamais une couleur seule, jamais une opacité réduite. La règle générale du produit s'applique ici sans exception, y compris sur un compteur qui passe en négatif.
- **Un relevé qui s'allonge ne pousse jamais la décision courante hors de l'écran.** Un journal, une pile de tours, une liste de choix passés se plafonne et se replie. Sans ça, le dernier tour d'une partie longue oblige à faire défiler pour agir.
- **L'avancée est un changement discret.** Ce monde avance par crans, il ne fond pas : aucune animation d'étape, aucun compteur qui s'anime, aucun retour de satisfaction. Une entrée qui apparaît en bas d'une liste est la seule exception tolérée.

Un jeu ne dit jamais ce qu'il note. Le contrat annonce le cadre, jamais les critères.

## Adresse

Vouvoiement. Phrases courtes. Aucun point d'exclamation. L'outil pose un diagnostic, il n'encourage pas.

Le contrat énonce le cadre — durée, format, le fait que rien n'est déclaratif — **jamais les critères**. Un joueur prévenu de ce qu'on note joue un personnage, et le produit ne mesure plus rien.

## Composants

- [src/components/ui/](src/components/ui/) est généré par la CLI shadcn, exclu de Biome, jamais édité à la main. Pour changer une primitive, relancer la CLI ou l'envelopper.
- Découpage atomique à l'intérieur du dossier nommé : `elements` (atomes muets) → `composites` (compositions muettes) → `sections` (connectés au store ou à la façade).
- Un composant partagé entre écrans vit dans `src/components/` ; la rampe des groupes en est le premier exemple.

## Accessibilité

- Les primitives Base UI portent la gestion du focus, le clavier et l'ARIA. Construire dessus plutôt qu'à côté.
- Les jeux chronométrés et les glissers-déposers sont l'exception : leur interaction est propre, donc l'atteignabilité au clavier et l'annonce du minuteur sont à traiter dans le jeu lui-même.
- L'état n'est jamais porté par la couleur seule : le poids, le filet ou la marque structurelle le disent aussi.
