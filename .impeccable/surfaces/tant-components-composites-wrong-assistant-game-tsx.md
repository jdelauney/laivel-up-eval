---
version: 1
slug: "tant-components-composites-wrong-assistant-game-tsx"
primary_target: "src/games/wrong-assistant/components/composites/wrong-assistant-game.tsx"
related_targets:
  - "src/games/wrong-assistant/components/composites/exchange-thread.tsx"
  - "src/games/wrong-assistant/components/elements/assistant-turn.tsx"
  - "src/games/wrong-assistant/components/elements/reply-choice.tsx"
---

# Le jeu `wrong-assistant` — réagir à une IA qui se trompe avec aplomb

Dixième jeu du parcours, et le premier du troisième groupe (« Résilience »). Il prend la place du banc d'essai placeholder `g3-1`.

**Chaque jeu a sa propre surface, et cette fiche ne vaut que pour celle-ci.** `lie-detector` est une feuille de manches qu'on rejoue une à une ; `ambiguity-scan` un texte continu qu'on bascule segment par segment ; `keep-or-toss` une pile qu'on tranche sous le chronomètre. Celui-ci n'est aucun des trois : un **fil de conversation qui s'allonge**, une réponse à la fois, où revenir en arrière n'existe pas — pas de manche qui recommence, pas de pile qui se vide, un seul chemin qui s'écrit devant le joueur et ne s'efface jamais.

Les cinq règles communes à tous les jeux — coût annoncé et conséquence tue, partie dans le composant et trace comme réponse, état porté par une quantité, relevé qui ne chasse pas la décision, avancée discrète — vivent dans [DESIGN.md](../../DESIGN.md), section « La surface d'un jeu ». Elles ne se rediscutent pas ici.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinées.

## Public et métier

Le développeur évalué, seul, face à un assistant qui vient de rendre un travail et commente ce qu'il a fait — trois affirmations sur cinq tours de profondeur, dont trois portent une erreur qu'il ne signale jamais comme telle. Le joueur répond tour après tour : accepter, contester sans agir, vérifier, ou demander une reformulation. Ce qu'il ne sait pas — et que le contrat ne lui dit jamais — c'est qu'accepter une affirmation fausse porte une conséquence qui tombe plus loin dans le scénario, jamais au tour même où l'erreur est commise.

## Le concept, et ce qu'il refuse explicitement

**Ce n'est ni une manche qu'on rejoue, ni un texte qu'on annote, ni une pile qu'on trie.** La matière propre de ce jeu est le temps : un fil qui s'allonge, où le tour de trois échanges plus tôt reste la seule preuve de ce qui a été dit avant que la conséquence ne tombe. Une révélation qui l'oublierait et ne montrerait qu'un extrait perdrait exactement ce que le jeu mesure — la mémoire du joueur sur son propre fil, pas un instantané.

**Rien ne distingue un tour défectueux d'un tour sain.** `AssistantTurn` ne reçoit jamais `flawed`, `flaw`, `consequence` ni `stance` avant l'heure — le hook les retient jusqu'à ce qu'ils soient dus (`use-wrong-assistant.hook.ts`). Même cadre, même label « L'assistant », même poids typographique, qu'un tour mente ou non.

**Rien ne classe les réponses par `stance`.** `ReplyChoice` reçoit un texte et rien d'autre : pas d'icône, pas d'ordre stable (les réponses restent dans l'ordre où le corpus les déclare), pas de couleur. Le corpus réel est vérifié en force brute (`brute-force.test.ts`) : dans un même nœud, aucune réponse de camp différent ne partage son premier mot.

**Un choix est irréversible.** `useWrongAssistant.reply()` avance le fil vers `nextId` ou clôt le scénario — aucune branche ne permet de revenir sur un pas déjà posé, sur le modèle du verrou de `useLieDetector`.

## Bandes de l'écran

| Bande | Ce qu'elle porte | Pourquoi elle est là |
| --- | --- | --- |
| Consigne | Qu'un choix ne revient jamais en arrière, que le fil se relit en entier | Jamais qu'un tour sur trois ment, jamais le seuil de réponses correctives attendu |
| Le fil (`ExchangeThread`) | Chaque tour joué, le tour courant, en zone bornée et défilante | Le joueur doit pouvoir remonter le fil pour juger le tour courant, sans jamais perdre la matière |
| Les réponses | Un pied fixe, hors de la zone qui défile | La décision reste toujours à portée, quelle que soit la longueur du fil au-dessus |
| La révélation | Les tours défectueux **rencontrés sur ce fil précis**, et ce qui clochait | Jamais un score, jamais lesquels le joueur avait laissé passer |

## Ce qui ne se négocie pas

- **Un relevé qui s'allonge ne pousse jamais la décision courante hors de l'écran** (`DESIGN.md`). Réponse propre à ce jeu, différente de celle de `checkpoints` : le journal de `CheckpointsGame` **replie** ses entrées les plus anciennes derrière une ligne de compte — il ne porte que des coûts déjà lisibles ailleurs (la ligne de budget). Ici, le fil **est** la matière du jeu : rien ne se replie ni ne disparaît. La zone défile en interne, bornée en hauteur (`max-h-[13vh] sm:max-h-[28vh]`), et c'est le pied des réponses — posé **hors** de cette zone, jamais entraîné vers le bas par elle — qui reste toujours atteignable. Mesuré au navigateur, voir « Vérifié » plus bas.
- **La révélation porte le même traitement.** Sur un chemin qui rencontre les trois nœuds défectueux, le fil complet (toujours rendu au-dessus, pour se relire) et la liste des tours défectueux cumulaient assez de hauteur pour repousser « Continuer » hors de l'écran — mesuré pendant cette passe, avant resserrage (voir « Vérifié »). La liste de révélation porte donc la même zone bornée et défilante que le fil, avec son propre pied fixe.
- **Aucune animation d'étape.** Le passage d'un tour au suivant, et de `'talking'` à `'revealed'`, reste un remontage React par cran, sans transition d'écran. La seule exception tolérée par `DESIGN.md` — une entrée qui apparaît en bas d'une liste — n'est pas utilisée ici : un nouveau tour n'a besoin d'aucun mouvement, sa seule apparition suffit à le signaler, portée par `aria-live="polite"`.
- **Une seule action à la fois.** Les réponses possibles pendant le fil, « Continuer » à la révélation — jamais les deux ensemble.
- **La révélation donne ce qui clochait, jamais qui avait été laissé passer.** Un jeu déjà soumis peut être rejoué : donner la correction ferait du second passage une recopie. Choix identique à `lie-detector` et `ambiguity-scan`.
- **La révélation ne porte que les tours défectueux rencontrés sur ce fil**, pas l'intégralité du corpus : deux joueurs empruntant des branches différentes ne voient jamais la même révélation, puisqu'ils n'ont pas rencontré les mêmes tours.

## Ce que l'écran ne dit jamais

| S'énonce | Se tait |
| --- | --- |
| Qu'un choix est définitif, que le fil se relit en entier | Qu'un tour sur trois porte une affirmation fausse |
| Les quatre réponses possibles à chaque tour | Laquelle repère l'erreur, laquelle n'est qu'un refus sans suite |
| À la révélation, ce qui clochait dans les tours défectueux rencontrés | Si le joueur les avait repérés, lesquels il a acceptés à tort |

## Accessibilité

- Chaque réponse est un `<button>` natif (`ReplyChoice`) : Tab, Entrée et Espace l'activent nativement, exactement comme un clic — aucun geste bespoke à câbler, donc aucune divergence possible entre clavier et pointeur.
- Un nouveau tour s'annonce en `aria-live="polite"` (la zone de fil porte l'attribut) et déplace le focus sur la première réponse : les boutons de réponse sont remontés à chaque tour (`key` par identifiant de réponse), donc `autoFocus` s'exécute à nouveau à chaque tour, pas seulement au montage de l'écran.
- Le nom accessible de chaque réponse est son texte visible, sans rien y concaténer — aucun `aria-label` qui écraserait ce que l'œil lit.

## Vérifié

Tournée de navigateur réel — Chromium via Playwright, harnais hors du dépôt (script jetable, supprimé après capture), sur `npm run dev`, aux deux gabarits `1440×900` et `390×844`, session posée directement sur `g3-1` via `laivel-eval.session`. Trois états mesurés à chaque gabarit : l'écran initial (fil vide), le tour le plus long avant réponse (`n5`, quatre tours déjà joués dans le fil), et la révélation après un chemin qui rencontre les trois nœuds défectueux.

**Avant resserrage**, les deux zones (fil et révélation) n'étaient bornées qu'à `45vh`/`55vh` (fil) et pas bornée du tout (révélation) :

| Gabarit | État | Hauteur document | Fenêtre | Décision (bas du dernier bouton) |
| --- | --- | --- | --- | --- |
| 1440×900 | fil le plus long | 1076px | 900px | 1003px — **103px sous la ligne de flottaison** |
| 1440×900 | révélation | 1456px | 900px | 1270px — **370px sous la ligne de flottaison** |
| 390×844 | fil le plus long | 1119px | 844px | 1062px — **218px sous la ligne de flottaison** |
| 390×844 | révélation | 1564px | 844px | 1283px — **439px sous la ligne de flottaison** |

**Resserré** — le fil à `max-h-[13vh] sm:max-h-[28vh]`, la liste de révélation à `max-h-[10vh] sm:max-h-[14vh]`, paddings et espacements réduits en proportion — et **remesuré** :

| Gabarit | État | Hauteur document | Fenêtre | Décision (bas du dernier bouton) |
| --- | --- | --- | --- | --- |
| 1440×900 | initial | 900px | 900px | 613px — visible |
| 1440×900 | fil le plus long | 900px | 900px | 756px — visible |
| 1440×900 | révélation | 967px | 900px | 898px — visible |
| 390×844 | initial | 844px | 844px | 744px — visible |
| 390×844 | fil le plus long | 844px | 844px | 784px — visible |
| 390×844 | révélation | 889px | 844px | 836px — visible |

La décision courante — les réponses en cours de fil, « Continuer » à la révélation — reste atteignable sans défiler de page aux six mesures, aux deux gabarits. La hauteur totale du document dépasse encore de quelques pixels la fenêtre sur deux des six états (`900` vs `900` tient exactement, `967` et `889` restent proches) : ce n'est jamais la décision qui en pâtit, seulement une marge de respiration sous le pied fixe, jamais mesurée comme un défaut par `DESIGN.md` qui vise la décision, pas le défilement.

Complété par les assertions Testing Library de `wrong-assistant-game.test.tsx` : le fil progresse tour après tour sans jamais perdre les tours précédents, la révélation ne montre aucun mot de verdict (`/correctement|manqué|réussi|raté|score|repéré/i`), aucune marque ne distingue un tour défectueux d'un tour sain dans le DOM (`/flawed|flaw|défectueux|sain/i`), et chaque réponse est un `<button>` natif focusable — le même contrôle pour le pointeur et le clavier.

## Hors périmètre

L'écran de verdict, et les jeux voisins du même groupe (`g3-2`, `g3-3`) — qui gardent chacun leur propre surface, jamais celle-ci recopiée.
