---
version: 1
slug: "ity-scan-components-composites-ambiguity-scan-game-tsx"
primary_target: "src/games/ambiguity-scan/components/composites/ambiguity-scan-game.tsx"
related_targets: []
---

# Le jeu `ambiguity-scan` — repérer ce qu'un prompt laisse ouvert

Neuvième jeu du parcours, et le second du sixième groupe (« Qualité du prompt »). Il prend la place du banc d'essai placeholder `g6-2`.

**Cette fiche corrige un manque, elle ne documente pas une livraison neuve.** Le jeu est arrivé sans elle, et une revue indépendante (`aidd_docs/tasks/2026_08/2026_08_31_jeu-ambiguity-scan/review.md`, constat 5) a mesuré que son bloc de révélation était identique caractère pour caractère à celui de `practice-map` — même `<div className="flex flex-col gap-3 sm:gap-6">`, même `<section className="border border-plane-rule bg-plane">`, même `<header>` encadré, même liste détachée — hors le libellé de l'en-tête. `DESIGN.md` : « Vingt jeux, vingt surfaces. Aucun n'hérite de la composition d'un autre. » Cette passe redessine ce bloc pour qu'il tienne sur la matière propre du jeu, et ne touche à rien d'autre : l'écran de lecture (`prompt-body.tsx`, `segment-toggle.tsx`) reste tel quel, il n'était pas en cause.

Les cinq règles communes à tous les jeux — coût annoncé et conséquence tue, partie dans le composant et trace comme réponse, état porté par une quantité, relevé qui ne chasse pas la décision, avancée discrète — vivent dans [DESIGN.md](../../DESIGN.md), section « La surface d'un jeu ». Elles ne se rediscutent pas ici.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinées. Seul le bloc `phase === 'revealed'` d'`ambiguity-scan-game.tsx` est repris par cette passe.

## Public et métier

Le développeur évalué, seul, face à un prompt de commande de fonctionnalité en neuf segments continus. Il signale ceux qui laissent une marge d'interprétation à une IA, sans savoir combien il y en a, puis verrouille sa lecture. La révélation qui suit doit lui rendre le même prompt, cette fois annoté à l'endroit exact de chaque ambiguïté — jamais un verdict sur ce qu'il a personnellement signalé.

## Le concept, et ce qu'il refuse explicitement

**Ce n'est ni un plan à deux axes, ni un répartiteur d'attention, ni une frise d'étapes.** La matière propre de ce jeu est un texte continu dont certains passages laissent une marge — une révélation qui l'oublie et affiche à la place une liste encadrée détachée (ce que faisait la version reprise de `practice-map`) perd exactement ce qui rend le jeu lisible : où, dans la phrase, l'ambiguïté se love.

**La révélation redonne le prompt entier, pas un extrait des seuls segments ambigus.** Les cinq segments clairs restent visibles, dans le même bloc, à la même place qu'en lecture — sans eux, un joueur ne peut plus retrouver où il se trouvait pendant le scan, et la révélation devient une liste à mémoriser plutôt qu'un texte à relire.

**Renvoi en exposant plutôt que reprise du texte.** Chaque segment ambigu porte un filet **pointillé** (un signalement, en lecture, reste un filet plein — les deux ne se confondent jamais) et un petit chiffre en exposant, qui le relie à sa lecture dans une bande de renvois sous le prompt, dans l'ordre où les segments apparaissent dans le texte. Le renvoi porte un texte accessible dédié (`sr-only`) plutôt qu'un chiffre nu, pour qu'un lecteur d'écran l'annonce comme une note et non comme un chiffre du prompt lui-même.

## Bandes de l'écran

| Bande | Ce qu'elle porte | Pourquoi elle est là |
| --- | --- | --- |
| Consigne | Que le prompt se lit dans son ensemble, que la lecture se verrouille à la soumission | Jamais le nombre de segments ambigus, jamais un seuil |
| Le prompt (scan) | Le bloc continu, chaque segment un bouton `aria-pressed` | Le geste de signalement, sans indice visuel avant l'heure |
| Compteur de signalements | Combien de segments sont signalés | Jamais combien il en reste à trouver |
| Le prompt annoté (révélation) | Le même bloc continu, filet pointillé et renvoi en exposant sur chaque segment ambigu | Le passage se relit dans sa phrase, pas hors contexte |
| Les renvois | La seconde lecture de chaque segment ambigu, numérotée dans l'ordre du texte | Jamais un verdict sur le joueur, jamais son score |
| Pied | « Continuer », l'unique action de la révélation | Fait avancer la partie, ne soumet rien de plus |

## Ce qui a été corrigé dans cette passe

**Le bloc encadré détaché disparaît, remplacé par le prompt lui-même annoté.** L'ancienne révélation itérait `revelations` (les seuls segments ambigus) dans une liste à deux lignes par entrée, sans jamais réafficher les segments clairs ni la position réelle de chaque ambiguïté dans le texte. La nouvelle version réutilise `segments` (l'intégralité du prompt, dans l'ordre de la configuration) et construit une correspondance `id → numéro de renvoi` à partir de `revelations`, qui suit déjà cet ordre par construction du hook (`use-ambiguity-scan.hook.ts`, filtre stable sur `parsed.segments`) — aucun changement de hook n'était nécessaire, la matière existait déjà.

**Mesuré en navigateur réel, pas supposé.** Tournée Chromium via Playwright, harnais hors du dépôt (script jetable, supprimé après capture), sur `npm run dev`, session posée directement sur `g6-2` via `laivel-eval.session`, aux deux gabarits `1440×900` et `390×844`, un segment ambigu réellement signalé avant verrouillage pour atteindre l'écran de révélation avec au moins un renvoi actif.

**Premier rendu, avant resserrage : l'action « Continuer » sortait du premier écran aux deux gabarits.** `document.documentElement.scrollHeight` contre la hauteur de fenêtre, après `window.scrollTo(0, 0)` :

| Gabarit | Hauteur document | Hauteur fenêtre | Dépassement |
| --- | --- | --- | --- |
| Desktop 1440×900 | 1036px | 900px | 136px |
| Mobile 390×844 | 1361px | 844px | 517px |

Cause : réafficher le prompt entier ajoute un bloc de texte que l'ancienne révélation n'avait jamais à rendre — le coût direct de montrer la matière que cette passe devait montrer, pas une régression de mise en page par ailleurs.

**Resserré, remesuré.** Trois changements, chacun justifié par une raison propre à la révélation et non par la seule volonté de gagner de la place : `leading-loose` du prompt annoté redescend à `leading-snug` — l'aération large de `PromptBody` réserve un couloir de clic autour de chaque bouton de segment en lecture, une raison qui disparaît ici puisque les segments ne sont plus interactifs ; le remplissage vertical du prompt annoté passe de `py-3` à `py-2.5` ; chaque ligne de renvoi passe de `py-2` à `py-1.5` et de `leading-relaxed` à `leading-snug`, une bande de référence plutôt que le texte principal de l'écran. Remesuré ensuite :

| Gabarit | Hauteur document | Hauteur fenêtre | Dépassement |
| --- | --- | --- | --- |
| Desktop 1440×900 | 930px | 900px | 0px — le bas du bouton « Continuer » tombe à 874px, dans le premier écran |
| Mobile 390×844 | 1208px | 844px | 364px |

**Non tenu sur mobile, mesuré et assumé plutôt que caché.** Le dépassement mobile recule de 517px à 364px (−30 %), mais reste net. La coquille partagée — en-tête, rampe des groupes, titre de situation, bandeau de consigne (« coût annoncé, conséquence tue ») — occupe à elle seule environ 340px des 844px de la fenêtre mobile avant qu'aucun contenu de ce jeu ne s'affiche ; aucun de ces éléments n'est dans le périmètre de cette passe (`ambiguity-scan-game.tsx` seul). Resserrer davantage le prompt annoté ou les renvois entamerait la lisibilité (contraste, taille de cible, interlignage) pour un gain marginal, et supprimer le prompt réaffiché reviendrait sur la correction même que cette passe apporte. `practice-map` — le jeu en deux temps le plus proche de celui-ci — porte la même défaillance à une échelle plus large (713 à 775px de dépassement mobile, `ce-map-components-composites-practice-map-game-tsx.md`) et a été accepté par le chef avec un défaut de backlog écrit plutôt que bloqué. Cette passe n'ouvre pas de nouveau défaut de backlog : hors du périmètre de fichiers qui lui a été confié, elle le signale ici et dans le compte rendu remis à l'issue de la correction, plutôt que de fabriquer un artefact que personne n'a demandé.

## Ce qui ne se négocie pas

- **Un état est une quantité.** Un segment ambigu se distingue par un filet **pointillé**, jamais par une teinte : le même segment, en lecture, porte un filet plein s'il a été signalé — deux marques structurelles, jamais une couleur seule à porter le sens.
- **Aucune animation.** Le passage de `'scanning'` à `'revealed'` reste un remontage React par cran, sans transition d'écran, sans effet d'apparition sur le prompt annoté ou les renvois.
- **Une seule action primaire par écran** : « Verrouiller mes signalements » en lecture, « Continuer » à la révélation — jamais les deux en même temps.
- **La révélation ne montre jamais un verdict ni un score.** Les renvois donnent la seconde lecture d'un passage, jamais si le joueur l'avait repérée. Verrouillé par `ambiguity-scan-game.test.tsx`, qui interdit tout texte visible correspondant à `/correctement|manqué|réussi|raté|score/i` sur l'écran révélé.
- **Le prompt entier reste visible à la révélation, segments clairs compris.** Verrouillé par un test dédié (`ambiguity-scan-game.test.tsx`) : chaque segment clair du corpus reste retrouvable par son texte exact une fois la lecture verrouillée, preuve que la révélation ne s'est pas repliée sur un extrait.

## Ce que l'écran ne dit jamais

| S'énonce | Se tait |
| --- | --- |
| Que le prompt se lit dans son ensemble, avant de signaler quoi que ce soit | Combien de segments laissent une marge d'interprétation |
| Que la lecture se verrouille à la soumission, sans retour possible | Un seuil, ou la part de segments qu'il faudrait repérer |
| À la révélation, ce que chaque passage laissait ouvert | Si le joueur l'avait lui-même repéré |

## Vérifié

Tournée de navigateur réel — Chromium via Playwright, harnais hors du dépôt (script jetable, supprimé après capture), sur `npm run dev`, aux deux gabarits `1440×900` et `390×844`, session posée directement sur `g6-2` via `laivel-eval.session`, corpus réel de neuf segments dont quatre ambigus. Chaque mesure part de `window.scrollTo(0, 0)`, `window.scrollY` vérifié à `0` avant lecture. Le détail chiffré, avant et après resserrage, vit dans « Ce qui a été corrigé dans cette passe » ci-dessus ; les captures elles-mêmes n'ont pas été conservées dans le dépôt, hors du périmètre de fichiers confié à cette passe.

Complété par les assertions Testing Library de `ambiguity-scan-game.test.tsx` : la révélation montre le texte et la lecture de chaque segment ambigu, montre aussi le texte de chaque segment clair (le prompt entier, pas un extrait), et ne rend aucun mot de verdict. Non couvert par un test — vérifié seulement par la tournée manuelle ci-dessus, à réouvrir si une future passe change ce bloc : que le renvoi en exposant relie visuellement le bon segment à la bonne ligne de la bande de renvois.

**Non tenu, mesuré et assumé par écrit plutôt que caché** : l'action « Continuer » reste sous la ligne de flottaison sur mobile, 364px de dépassement après resserrage (517px avant), pour la raison détaillée ci-dessus — une coquille partagée hors du périmètre de cette passe, qui occupe à elle seule 40 % de la fenêtre mobile avant tout contenu propre au jeu.
