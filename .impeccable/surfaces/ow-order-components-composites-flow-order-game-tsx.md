---
version: 1
slug: "ow-order-components-composites-flow-order-game-tsx"
primary_target: "src/games/flow-order/components/composites/flow-order-game.tsx"
related_targets: ["src/games/flow-order/components/composites/flow-timeline.tsx","src/games/flow-order/components/composites/revealed-timeline.tsx","src/games/flow-order/components/elements/step-card.tsx"]
---

# Le jeu `flow-order` — remettre les étapes du flux dans l'ordre

Dixième jeu du parcours, et le second du cinquième groupe (« Architecture »). Il prend la place du banc d'essai placeholder `g5-2`.

**Cette fiche corrige un manque, elle ne documente pas une livraison neuve.** Le jeu est arrivé sans elle, et une revue indépendante (`aidd_docs/tasks/2026_08/2026_08_31_jeu-flow-order/review.md`, constat « L'écran de révélation est celui d'`ambiguity-scan`, et le jeu n'a pas de fiche de surface ») a mesuré que le bloc de révélation était identique caractère pour caractère à celui d'`ambiguity-scan-game.tsx`, hors le libellé de l'en-tête, et que le bloc de lecture reprenait la mise en espace de `practice-map-game.tsx`. `DESIGN.md` : « Vingt jeux, vingt surfaces. Aucun n'hérite de la composition d'un autre. » Cette passe redessine le bloc de révélation pour qu'il tienne sur la matière propre de ce jeu, et ne touche à rien d'autre : la frise de lecture (`FlowTimeline`, `StepCard`) n'a changé que pour fermer trois défauts distincts déjà signalés par la même revue (l'atteignabilité de la dernière position au pointeur, le relâchement au clavier, le nom accessible qui porte la position) — pas pour cette passe de surface elle-même.

Les cinq règles communes à tous les jeux — coût annoncé et conséquence tue, partie dans le composant et trace comme réponse, état porté par une quantité, relevé qui ne chasse pas la décision, avancée discrète — vivent dans [DESIGN.md](../../DESIGN.md), section « La surface d'un jeu ». Elles ne se rediscutent pas ici.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinées. Seul le bloc `phase === 'revealed'` de `flow-order-game.tsx` — devenu `RevealedTimeline` — est repris par cette passe ; le bloc `phase === 'ordering'` (`FlowTimeline`, `StepCard`) est conservé tel quel dans sa composition visuelle.

## Public et métier

Le développeur évalué, seul, face à sept gestes du flux AIDD de ce dépôt — du cadrage au merge — présentés dans un ordre mélangé. Il les remonte en une frise verticale numérotée, au pointeur ou au clavier, sans savoir combien de positions il tient déjà, puis verrouille sa lecture. La révélation qui suit doit lui rendre la même frise, cette fois dans l'ordre où ce dépôt l'enchaîne réellement, avec ce que chaque étape apporte — jamais un verdict sur l'ordre qu'il a personnellement joué.

## Le concept, et ce qu'il refuse explicitement

**Ce n'est ni un texte continu à scanner, ni un plan à deux axes, ni un répartiteur d'attention.** La matière propre de ce jeu est une frise ordonnée de sept cartes qu'on remonte — une seule dimension, la position, jouée par une seule action à la fois. Une révélation qui l'oublie et affiche à la place une liste encadrée détachée (ce que faisait la version reprise d'`ambiguity-scan`) perd exactement ce qui rend le jeu lisible : que la révélation **est** la même frise, relue dans le bon sens.

**La révélation reprend la frise, elle ne la remplace pas par un gabarit de « liste de notes ».** Chaque ligne révélée porte le même repère visuel que la carte jouée — un rang à gauche, tabulaire, sur le même gabarit de colonne que `StepCard` — puis le libellé, puis la note qui justifie sa place face à sa voisine. Le rang qui, en lecture, portait la **position jouée** (`aria-hidden`, doublé dans le nom accessible du bouton) porte à la révélation le **rang attendu** — la seule fois où ce jeu le montre, et seulement après verrouillage.

**Pas de renvoi en exposant, pas de filet pointillé.** Ces dispositifs appartiennent à la matière propre d'`ambiguity-scan` — annoter un passage précis dans un texte continu qui reste par ailleurs inchangé. Ici il n'y a rien à annoter par-dessus : l'ordre lui-même a changé entre les deux phases, la frise entière se relit.

## Bandes de l'écran

| Bande | Ce qu'elle porte | Pourquoi elle est là |
| --- | --- | --- |
| Consigne | Que la frise se lit de haut en bas, de quel flux il s'agit, que la lecture se verrouille à la soumission | Jamais l'ordre attendu, jamais la tolérance d'une position |
| Annonce clavier (`aria-live`) | La nouvelle position de la dernière étape déplacée, en mots comptés | Le pendant clavier du retour visuel, muet tant qu'aucun geste n'a eu lieu |
| La frise (lecture) | Sept cartes-boutons, rang joué à gauche, saisissables au pointeur ou aux flèches | Le geste d'ordonnancement, sans indice de justesse |
| La frise (révélation) | Les mêmes sept lignes, rang **attendu** à gauche, libellé, puis la note qui la relie à sa voisine | Le pourquoi de l'ordre, jamais un verdict sur la frise jouée |
| Pied | « Verrouiller la frise » en lecture, « Continuer » à la révélation | Une seule action primaire par écran, jamais les deux en même temps |

## Ce qui a été corrigé dans cette passe

**Le bloc encadré détaché disparaît, remplacé par `RevealedTimeline`, qui reprend le gabarit de `StepCard`.** L'ancienne révélation (héritée d'`ambiguity-scan`) rendait chaque étape dans un `<div>` bordé en bas, un numéro suivi d'un point (`1. `), le libellé, puis la note — la forme exacte d'une liste de segments annotés, pas d'une frise. La nouvelle version rend une `<ol>` à filets internes (`divide-y`), chaque `<li>` portant la même colonne de rang tabulaire que la carte jouée (`w-5`, `text-xs`, `tabular-nums`) puis le libellé en médium, puis la note alignée sous le libellé (`pl-8`, calé sur la largeur de la colonne de rang plus l'écart). Aucun changement de hook n'était nécessaire : `revelations` portait déjà `id`, `label`, `note` dans l'ordre attendu.

**Mesuré en navigateur réel, pas supposé.** Tournée Chromium via Playwright, harnais hors du dépôt (script jetable, supprimé après capture), sur `npm run dev`, session posée directement sur `g5-2` via `laivel-eval.session` (`groupIndex: 4`, `gameIndex: 1`), aux deux gabarits `1440×900` et `390×844`, la frise verrouillée sans y toucher pour atteindre l'écran de révélation à chaque mesure.

**Premier rendu, avant resserrage : l'action « Continuer » sortait du premier écran aux deux gabarits, et l'écran de lecture débordait déjà avant tout verrouillage.** `document.documentElement.scrollHeight` contre la hauteur de fenêtre, après `window.scrollTo(0, 0)` :

| Gabarit | Écran | Hauteur document | Hauteur fenêtre | Dépassement |
| --- | --- | --- | --- | --- |
| Desktop 1440×900 | Lecture | 984px | 900px | 84px |
| Desktop 1440×900 | Révélation | 1379px | 900px | 479px |
| Mobile 390×844 | Lecture | 1150px | 844px | 306px |
| Mobile 390×844 | Révélation | 1852px | 844px | 1008px |

Cause du saut entre lecture et révélation : la note de chaque étape ajoute une seconde ligne de texte que la carte jouée n'a jamais à rendre — le coût direct de montrer le « pourquoi » que cette passe devait montrer, pas une régression de mise en page par ailleurs. Le débordement déjà présent en lecture, lui, n'est pas propre à cette passe : il vient de la coquille partagée (en-tête, rampe des sept groupes) et du corpus de sept cartes, hors du périmètre de fichiers confié ici.

**Resserré, remesuré.** Trois changements sur `RevealedTimeline`, chacun justifié par une raison propre à cette révélation : le filet plein par ligne (`border border-plane-rule` sur chaque `<li>`) cède la place à `divide-y` sur la liste — sept boîtes pleinement bordées empilaient l'épaisseur de bordure pour rien, une révélation est une liste continue à relire, pas sept cartes détachées comme en lecture, où le filet complet marque au contraire une cible cliquable distincte ; `leading-relaxed` de la note redescend à `leading-snug` — la note tient en une à deux lignes courtes, l'aération large réservée à un texte long à respirer n'a pas lieu d'être ; le remplissage vertical de la liste et de chaque ligne se resserre d'un cran (`p-3`→`p-2.5`, `mt-1`→`mt-0.5`). La frise de lecture gagne le même resserrage d'espacement entre cartes (`gap-2`→`gap-1.5`, sur `FlowTimeline`), sans toucher au remplissage de chaque `StepCard` — la cible de frappe d'un bouton ne se réduit pas pour gagner de la place. Remesuré ensuite :

| Gabarit | Écran | Hauteur document | Hauteur fenêtre | Dépassement | Variation |
| --- | --- | --- | --- | --- | --- |
| Desktop 1440×900 | Lecture | 972px | 900px | 72px | −14 % |
| Desktop 1440×900 | Révélation | 1155px | 900px | 255px | −47 % |
| Mobile 390×844 | Lecture | 1138px | 844px | 294px | −4 % |
| Mobile 390×844 | Révélation | 1558px | 844px | 714px | −29 % |

**Non tenu aux deux gabarits, mesuré et assumé plutôt que caché.** Le bas du bouton « Continuer » tombe à 1099px sur 900 en desktop, à 1517px sur 844 en mobile — sous la ligne de flottaison dans les deux cas, malgré le resserrage. La coquille partagée — en-tête, rampe des sept groupes, titre de situation, bandeau « une réponse soumise est définitive » — occupe, avant tout contenu propre à ce jeu, une part significative de la fenêtre aux deux gabarits ; aucun de ces éléments n'est dans le périmètre de fichiers confié à cette passe (`flow-order` seul). `ambiguity-scan` — le jeu en deux temps le plus proche de celui-ci — porte la même défaillance à une échelle comparable (364px de dépassement mobile après son propre resserrage, `ity-scan-components-composites-ambiguity-scan-game-tsx.md`), et `practice-map` à une échelle plus large encore (713 à 775px). Cette passe n'ouvre pas de nouveau défaut de backlog — hors du périmètre de fichiers qui lui a été confié, elle le signale ici et dans le compte rendu remis à l'issue de la correction, plutôt que de fabriquer un artefact que personne n'a demandé.

## Ce qui ne se négocie pas

- **Un état est une quantité.** La carte saisie au pointeur se distingue par un poids de texte et un filet plus marqué (`font-medium`, `border-plane-foreground`), jamais par une teinte seule — deux marques structurelles, jamais une couleur seule à porter le sens.
- **Aucune animation.** Le passage de `'ordering'` à `'revealed'` reste un remontage React par cran, sans transition d'écran, sans effet d'apparition sur la frise révélée.
- **Une seule action primaire par écran** : « Verrouiller la frise » en lecture, « Continuer » à la révélation — jamais les deux en même temps.
- **La révélation ne montre jamais un verdict ni un score.** Chaque ligne donne le rang attendu et la raison de sa place, jamais si le joueur l'avait lui-même trouvée. Verrouillé par `flow-order-game.test.tsx`, qui interdit tout texte visible correspondant à `/correctement|manqué|réussi|raté|score|exact/i` sur l'écran révélé.
- **Le rang attendu n'apparaît jamais avant la révélation.** Verrouillé par `use-flow-order.test.ts` (« never exposes rank or note before the revelation »), qui sérialise la surface visible du hook en phase `'ordering'` et vérifie l'absence de `rank`.
- **Le nom accessible porte la position jouée, jamais le rang attendu.** `step-card.tsx` construit `aria-label` à partir de `position` — recalculée à chaque geste, jamais de `step.rank` — le composant n'a d'ailleurs accès à aucun rang avant la révélation.

## Ce que l'écran ne dit jamais

| S'énonce | Se tait |
| --- | --- |
| Que la frise se lit de haut en bas, de quel flux il s'agit | L'ordre attendu, ou la tolérance d'une position |
| Que la lecture se verrouille à la soumission, sans retour possible | Un seuil, ou le nombre de cartes déjà bien placées |
| À la révélation, ce que chaque étape apporte et pourquoi elle suit sa voisine | Si le joueur l'avait lui-même placée là |

## Vérifié

Tournée de navigateur réel — Chromium via Playwright, harnais hors du dépôt (script jetable, supprimé après capture), sur `npm run dev`, aux deux gabarits `1440×900` et `390×844`, session posée directement sur `g5-2` via `laivel-eval.session`, corpus réel de sept étapes. Chaque mesure part de `window.scrollTo(0, 0)`. Le détail chiffré, avant et après resserrage, vit dans « Ce qui a été corrigé dans cette passe » ci-dessus ; les captures elles-mêmes n'ont pas été conservées dans le dépôt, hors du périmètre de fichiers confié à cette passe.

Complété par les assertions Testing Library de `flow-order-game.test.tsx` : la révélation montre le libellé et la note de chaque étape dans l'ordre attendu, ne rend aucun mot de verdict, et la frise de lecture reste une `<ol>`/`<li>` dont chaque bouton porte la position jouée dans son nom accessible. Non couvert par un test — vérifié seulement par la tournée manuelle ci-dessus, à réouvrir si une future passe change ce bloc : que le resserrage de `divide-y` reste lisible (contraste du filet, espacement) une fois rendu à l'œil, pas seulement mesuré en hauteur.

**Non tenu, mesuré et assumé par écrit plutôt que caché** : l'action « Continuer » reste sous la ligne de flottaison aux deux gabarits après resserrage — 199px sous la fenêtre en desktop, 673px en mobile — pour la raison détaillée ci-dessus : une coquille partagée hors du périmètre de cette passe, à l'échelle déjà mesurée et acceptée sur `ambiguity-scan` et `practice-map`.
