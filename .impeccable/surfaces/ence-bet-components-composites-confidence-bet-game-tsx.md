---
version: 1
slug: "ence-bet-components-composites-confidence-bet-game-tsx"
primary_target: "src/games/confidence-bet/components/composites/confidence-bet-game.tsx"
related_targets: []
---

# Le jeu `confidence-bet` — la règle graduée

Troisième jeu à état du parcours, et le premier du groupe « Jugement critique ». Il prend la place du banc d'essai placeholder `g1-1`.

**Chaque jeu a sa propre surface, et cette fiche ne vaut que pour celle-ci.** `checkpoints` est une frise de six étapes avec une décision unique à l'écran ; `three-tracks` est une table à quatre colonnes fixes qui se réécrit tour après tour ; celui-ci est un **instrument de mesure** — une règle graduée sur laquelle on plante un repère, une fois, sans reprise. Rien des deux fiches précédentes ne se reprend ici.

Les cinq règles communes à tous les jeux — coût annoncé et conséquence tue, partie dans le composant et trace comme réponse, état porté par une quantité, relevé qui ne chasse pas la décision, avancée discrète — vivent dans [DESIGN.md](../../DESIGN.md), section « La surface d'un jeu ». Elles ne se rediscutent pas ici.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinés.

## Public et métier

Le développeur évalué, seul, au premier jeu du parcours. Il lit six extraits de code produits par un assistant et engage sur chacun la confiance qu'il leur accorde, **avant** toute révélation. Ce qui est mesuré n'est pas s'il a raison, mais si son engagement est à la hauteur de ce qu'il peut réellement établir.

Ce qu'il doit saisir en trois secondes sur chaque extrait : ce que le code fait, et où il se situe entre le doute et la certitude.

## Action et preuve

Il place un repère sur la règle, il engage, la vérité vient se poser à côté de sa marque, il passe. Six fois. Le succès de l'écran, c'est qu'il ait **jugé le code**, jamais deviné un barème.

Vrai ici et nulle part ailleurs : certains extraits ne peuvent pas être tranchés avec ce qui est montré, et la consigne le dit. C'est le seul jeu du parcours où l'aveu d'ignorance est un geste disponible et payant.

## Le concept

**La règle graduée est le jeu.** Pas cinq boutons alignés : un filet gradué qui va du doute à la certitude, avec ses embouts, ses graduations de longueur inégale, et une origine plus haute que ses voisines. On y plante un repère comme on relève une mesure.

Trois moments, un seul instrument :

| Moment | Ce que la règle porte |
| --- | --- |
| Avant l'engagement | Les graduations, l'origine, aucun repère. Le geste est de choisir une position |
| Après l'engagement | Le repère du joueur, planté et figé, et à côté celui de la vérité. L'écart entre les deux est tout ce qu'il y a à comprendre |
| Dans le relevé | La même règle en réduction, une par extrait joué, alignées les unes sous les autres — la colonne de marques dessine la dispersion de la partie |

Deux formes distinctes, jamais deux couleurs : **triangle plein** pour la mise engagée, **losange évidé** pour la vérité. Le sens tient sans distinguer les teintes.

## Ce qui ne se négocie pas

- **L'échelle cède la place à la révélation, elle ne se grise pas.** Une mise engagée ne se reprend jamais ; laisser le contrôle à l'écran, même désactivé, laisserait croire le contraire.
- **Sur un extrait indécidable, la règle passe en pointillé et ne désigne rien.** Poser un repère de vérité au milieu apprendrait au joueur où miser au prochain extrait indécidable — exactement ce que le jeu cherche à mesurer.
- **Les chiffres de la règle partagent une seule ligne de base.** La graduation varie en longueur dans un fût de hauteur fixe. Sans ce fût, l'origine plus haute décale son chiffre et la règle cesse de se lire comme un instrument. Défaut trouvé en navigateur à la première passe, corrigé à la seconde.
- **Le code est le moment focal.** Il est le contenu le plus lisible de l'écran ; position, capital et relevé sont de l'appareillage qui se lit sans être regardé. Le capital reste une ligne discrète en haut — en faire un compteur tenu pousserait vers la gamification que `DESIGN.md` refuse.
- **La sélection et l'ascenseur du bloc de code sont habillés sur les jetons du plan.** Deux surfaces que le navigateur dessine par défaut, et une seule suffit à trahir un écran assemblé plutôt que dessiné.

## Ce que l'écran ne dit jamais

Le cadre s'annonce dans la consigne, jamais les critères.

| S'énonce | Se tait |
| --- | --- |
| Six extraits, un par un | Que la moyenne des mises par nature est lue |
| La mise se verrouille une fois engagée | Les deux seuils de 50 % et de 70 % |
| Un extrait sain rapporte à hauteur de la mise, un défectueux coûte autant | Le seuil de calibration |
| Certains extraits ne peuvent pas être tranchés, et s'en écarter y coûte | Les bornes de la bande d'incertitude |
| Le capital courant, et le mouvement du dernier extrait | Que rester dans la bande est un critère à part entière |

Si un joueur peut déduire de l'écran quelle mise poser **pour bien noter** plutôt que quelle confiance il accorde réellement, la surface est allée trop loin.

## Motion

Une seule exception à l'avancée discrète : l'entrée qui apparaît dans le relevé après un engagement. Ni le repère, ni le capital, ni la bascule vers la révélation ne s'animent.

## Vérifié en navigateur

Tournée du 30/08, Chromium, 1440×900 et 390×844, dans [qa/](../../aidd_docs/tasks/2026_08/2026_08_30_jeu-confidence-bet/qa/).

Aucun débordement horizontal imputable à ce jeu, aux deux gabarits. Le débordement observé à 390 vient de la rampe des groupes et persiste avec la colonne du jeu entièrement masquée : il est suivi par [la-rampe-deborde-sur-mobile.md](../../aidd_docs/backlog/defects/la-rampe-deborde-sur-mobile.md).
