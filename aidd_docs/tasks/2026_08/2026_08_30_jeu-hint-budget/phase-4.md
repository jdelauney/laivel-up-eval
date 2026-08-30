---
status: done
---

# Instruction: Le jeu dans le parcours, et son corpus

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
├── config/
│   └── course.json                                     ✏️ g2-1 passe de test-bench à hint-budget, corpus et critères
├── src/games/
│   ├── register-games.ts                               ✏️ un bloc : évaluateur, schéma de config, schéma de trace
│   └── register-components.ts                          ✏️ un bloc : le composant du jeu
└── __tests__/
    ├── fixtures/
    │   └── hint-budget-answer.ts                       ✅ la trace conforme minimale, pour les parcours qui traversent tout
    └── integration/course-run/
        ├── hint-budget-run.test.ts                     ✅ le jeu à travers le moteur réel, sur le corpus réel
        ├── checkpoints-run.test.ts                     ✏️ g2-1 n est plus un test-bench : il lui faut sa trace
        └── three-tracks-run.test.ts                    ✏️ idem
```

## Test Scope

```mermaid
---
title: Test scope
---
journey
  section Setup
    charger le parcours réel et isoler g2-1 => sa configuration passe le schéma du jeu: 5: system
  section Happy path
    jouer un profil qui cadre juste d entrée puis résout les trois situations avec au plus deux indices chacune => les trois critères ressortent satisfaits et pilotage-contexte monte: 5: system
  section Edge case - le demandeur pressé
    jouer un profil qui n ouvre jamais le cadrage et achète tous les indices => les trois critères ressortent manqués: 1: system
  section Edge case - le cadreur dispendieux
    jouer un profil qui cadre juste partout puis achète tous les indices => seul le critère de cadrage ressort satisfait: 1: system
  section Edge case - tout cocher
    jouer un profil qui retient toutes les lectures de chaque situation => le critère de cadrage ressort manqué: 1: system
  section Edge case - politique positionnelle
    trancher systématiquement la première cause de chaque situation => au plus une situation est résolue: 1: system
  section Edge case - le parcours entier
    traverser les sept groupes de bout en bout => aucune soumission n est refusée et le verdict se calcule: 1: system
```

## Le corpus de `g2-1`

Trois situations, chacune un incident sur du code que l'assistant vient de livrer. Le format est fixe : un symptôme, un rapport de deux à quatre faits déjà en main, cinq lectures de cadrage, cinq indices, cinq causes.

Les trois situations à écrire, énoncées par leur incident :

| # | L'incident |
| --- | --- |
| `s1` | Une requête authentifiée renvoie `401` depuis la mise en production de la veille, alors qu'elle passe en local |
| `s2` | Un total de facture est faux d'un centime, sur certaines lignes seulement |
| `s3` | Une suite de tests passe en local et échoue en intégration continue, sans message utile |

Les règles d'écriture, qu'aucun test ne peut rattraper :

1. **Le rapport doit suffire à écarter deux causes sur cinq**, jamais plus. En dessous, le cadrage n'a pas de matière ; au-dessus, le jeu se résout sans acheter et la frugalité cesse d'être un arbitrage.
2. ~~Le prix d'un indice suit ce qu'il tranche. Le plus cher désigne la cause ; les moins chers écartent une piste chacun.~~ **Corrigé le 30/08, après revue : cette règle contredisait la règle 4 et a produit la faille qu'elle décrit.** Le corpus initial suivait cette version : `h5` de chaque situation paraphrasait la cause réelle mot pour mot (`s1-h5` ≈ `s1-c-clock`), rendant « acheter le seul indice le plus cher puis trancher » une stratégie qui tenait `c1` 3/3 à l'aveugle — exactement la délégation totale que l'épique nomme comme triche à bloquer. La règle qui tient est la 4 : **l'indice le plus cher est celui qui écarte le plus d'alternatives, jamais celui qui livre la réponse.** Prix retenus, inchangés : `5 · 10 · 15 · 20 · 25`.

   **Périmé au tour 5.** « Le plus cher écarte le plus d'alternatives » ne tient plus depuis la cardinalité exacte du tour 3 : chaque indice écarte exactement une cause (`hint.eliminates.length === 1`), quel que soit son prix. Sur le corpus livré, l'indice qui écarte encore une cause en lice — le seul « utile » depuis le plancher du tour 4 — coûte `5` sur `s1`, `25` sur `s2`, `20` sur `s3` : ni le rang ni le prix ne suivent plus ce qui tranche. Voir `plan.md`, décision du tour 5, pour l'arbitrage assumé plutôt que corrigé.
3. **Une lecture de cadrage établie est une reformulation de ce que le rapport dit**, jamais une déduction. Une supposition est une phrase qui *sonne* juste et que rien à l'écran n'appuie — c'est là que se joue la lecture.
4. **Un indice ne peut dire que « ce n'est pas X ».** Il écarte une cause, une seule, nommée, et jamais la cause réelle. Il ne décrit jamais le mécanisme de celle qui reste.

   **Reformulée le 30/08, tour 3 de revue, et cette fois portée par le contrat.** La règle disait auparavant « aucun indice ne nomme une cause candidate », et elle n'a pas tenu : le contrat du tour 2 bornait ce qu'un indice *écarte*, jamais ce qu'il *confirme*. Les six indices déclarés `eliminates: []` n'étaient donc contraints par rien, et trois d'entre eux énonçaient la réponse — `s1-h3` la donnait sur quatre-vingts caractères consécutifs, deux fois plus que la paraphrase que le tour 1 avait sanctionnée sur `s1-h5`. Le défaut n'avait pas été supprimé, il avait été déplacé d'un cran, et le garde-fou posé sur la position qu'il venait de quitter. `eliminates` porte désormais **exactement un** identifiant : aucun indice n'est plus *à propos* de la bonne réponse, et la confirmation devient inexprimable au lieu d'être interdite par une consigne.
5. La cause réelle **ne tombe pas au même rang** dans les trois situations, et l'ensemble des rangs des lectures établies **diffère** d'une situation à l'autre. Les deux se vérifient par test.
6. Ni le symptôme, ni le rapport, ni une lecture de cadrage ne dit ce qui est noté.
7. **Corrigé le 30/08, après revue — règle ajoutée : le texte d'une cause ne trahit jamais laquelle est réelle par sa forme.** Le corpus initial faisait de la cause `actual` le texte le plus long des cinq, dans les trois situations, avec une marge considérable (135 vs 62/52/52/44 caractères sur `s1`, par exemple) : « trancher la cause la plus longue, n'acheter aucun indice, ne rien cadrer » tenait `c1` 3/3 sans lire une ligne. Les cinq `causes[].text` d'une situation restent désormais à moins d'un quart d'écart entre le plus long et le plus court (`longest - shortest <= longest / 4`, le même seuil que `lie-detector` applique à ses affirmations), et la cause réelle n'est jamais ni la plus longue ni la plus courte. L'explication causale complète — qui, elle, peut varier en longueur sans trahir rien — vit dans `verification`, montrée seulement à la révélation, jamais dans `text`.
8. **Corrigé le 30/08, tour 2 de revue — règle ajoutée : le rang de longueur de la cause réelle diffère d'une situation à l'autre, pas seulement les extrêmes.** La règle 7 fermait les deux extrêmes (jamais la plus longue, jamais la plus courte), mais un canal résiduel restait ouvert : la cause réelle occupait le même rang intermédiaire (le 2ᵉ plus court) dans deux situations sur trois — assez pour qu'une politique « trancher la 2ᵉ plus courte » gagne 3/3 sans lire une ligne, à 1/125 de probabilité par hasard. Le garde-fou est étendu au balayage complet du rang plutôt qu'aux seuls extrêmes (`hint-budget-run.test.ts`, « never lets a "cut the k-th longest cause" policy solve more than one of the three situations, for every k » — titre corrigé au tour 4, la version citée ici auparavant n'existait dans aucun fichier de test). Sur le corpus livré, les rangs de longueur de la cause réelle valent `2 · 3 · 4` — trois valeurs distinctes.
9. **Ajoutée le 30/08, tour 2 de revue — le graphe d'élimination des causes, en contrat plutôt qu'en consigne.** Les deux tours de revue ont montré le même motif sur ce point précis : fermer un canal de fuite en ouvre un autre, parce qu'une consigne d'écriture ne borne rien de mécanique. `config.schema.ts` porte désormais le graphe en dur (`causeSchema.ruledOutByReport`, `hintSchema.eliminates`, sept refus au chargement — détail dans `phase-1.md`).

   **Complété le 30/08, tour 3 de revue.** L'économie décrite ici était arithmétiquement impossible : elle annonçait « deux indices visent des causes déjà écartées, trois visent les causes encore en lice », alors que cinq causes dont une réelle et deux écartées par le rapport ne laissent que **deux** causes en lice. Cinq indices à cible unique et distincte réclamaient cinq cibles valides pour quatre existantes — impossible par principe des tiroirs. L'économie tenue, et vérifiée par test :

   ```
   5 causes = 1 réelle + 2 écartées par le rapport + 2 encore en lice
   5 indices, chacun écarte exactement 1 cause non réelle :
      2 utiles    -> les 2 causes encore en lice, cibles distinctes obligatoires
      3 gaspillés -> les 2 causes déjà écartées par le rapport, doublon toléré
   Identifier = écarter les 2 causes encore en lice  => 2 achats
   Seuil de frugalité = moins de la moitié de 5      => au plus 2
   ```

   La règle de non-doublon porte sur les causes **encore en lice**, et n'a donc pas d'exception : deux indices qui reconfirment une cause que le rapport a déjà écartée ne fuitent rien — le rapport l'annonçait gratuitement — et paient deux fois la même information. C'est le mécanisme du jeu : l'achat gaspillé est le prix de ne pas avoir lu le rapport, et le `label` de chaque indice permet de savoir de quelle piste il parle avant de payer.

   **Périmé au tour 4, voir « Le plancher élargi au tour 5 » plus bas.** L'encadré ci-dessus décrit l'économie du tour 3 (2 indices utiles, un champ ramené à une seule cause) : le plancher de deux causes du tour 4 l'a remplacée par une économie à **un seul** indice utile par situation, aux positions `1` sur `s1`, `5` sur `s2`, `4` sur `s3` — distinctes, donc aucune position fixe n'est utile deux fois. Trancher frugalement exige de lire *lequel* des cinq indices écarte encore une cause en lice, jamais d'en acheter deux au rang habituel.

Les deux montants de l'économie : `wrongCutPenalty` à `40`, `blindCutSurcharge` à `30`. La surtaxe excède strictement l'indice le plus cher (`25`), ce que le schéma vérifie au chargement — c'est le quatrième critère d'acceptation de la story.

**Correction du 30/08, après revue — `s1` était techniquement faux.** `s1-h3` disait l'horloge du serveur « en avance » de quatre minutes, `s1-h5` disait qu'elle « retardait » — deux indices de la même situation affirmant deux dérives opposées, `s1-h5` se contredisant même dans sa propre phrase. `s1-h4` (rejet pour date d'émission future) exigeait une horloge en retard ; `s1-c-clock` (jetons invalides avant leur expiration réelle) exigeait une horloge en avance : les deux causes du même bug ne pouvaient pas être vraies ensemble. Et quatre minutes de dérive dans une fenêtre de validité de quinze minutes ne produit aucun `401` dans un sens comme dans l'autre. Tranché en faveur d'une horloge **en retard**, à hauteur de **vingt minutes** — largement au-delà de la fenêtre de quinze minutes et de l'écart réel entre émission et appel (quatre minutes), donc suffisant pour faire systématiquement échouer la vérification d'émission plutôt qu'un cas limite improbable. `s1-h3`, `s1-h4`, `s1-h5`, `s1-c-clock` et sa `verification` portent désormais tous la même direction et la même mesure.

## Les trois critères de `g2-1`

**Correction du 30/08, après revue.** `g2-1-c2` portait initialement l'ordre et le fondement à la fois (poids `2`), sous une question qui ne parlait que d'ordre — un joueur cadrant juste en premier, mais de façon incomplète, lisait « manqué » sur un critère que sa question ne laissait pas deviner. Décision produit : `c2` scindé en deux.

| Critère | Question | Règle | Mapping |
| --- | --- | --- | --- |
| `g2-1-c1` | Les incidents ont-ils été résolus en achetant moins de la moitié des indices ? | `frugal-solves-at-least` · `share: 0.5` · `threshold: 3` | `pilotage-contexte` · poids `2` |
| `g2-1-c2` | Le contexte a-t-il été posé avant le premier indice ? | `framed-first-at-least` · `threshold: 2` | `pilotage-contexte` · poids `1` |
| `g2-1-c3` | Ce contexte était-il fondé sur le rapport ? | `grounded-framings-at-least` · `threshold: 2` | `pilotage-contexte` · poids `1` |

Le mapping `harness` du placeholder disparaît : les six premiers groupes portent la signature, seul le septième porte les axes du référentiel officiel. C'est la même coupe que celle faite chez `g1-2` et `g1-3`. Le poids `2 · 1 · 1` garde l'équilibre initial entre trancher frugalement (`2`) et cadrer (`1 + 1`).

**Le seuil de `c1` est passé de deux à trois situations sur trois au tour 4** (`plan.md`, décision du tour 4) : le plancher de deux causes retire aux indices tout pouvoir de discrimination final, donc toute marge laissée sur ce seuil se traduit directement en marge de chance plutôt qu'en marge d'erreur de lecture. `c1` n'a donc plus aucune marge : une seule situation manquée le fait tomber. Le détail des probabilités de chance, recalculé sur le corpus courant, vit dans « Quatre politiques mesurées, non arrondies (tour 3, recalculées au tour 4) » plus bas.

## Les politiques aveugles, recalculées sur le corpus du tour 2 (30/08)

**Corrigé le 30/08, tour 2 de revue (W2).** Le tableau du tour 1 mélangeait, dans une même ligne, un cadrage aveugle (« tout cocher ») et une tranche qui *savait* la cause réelle (« tranche juste ») — un triplet qui n'était donc pas entièrement aveugle, et attribuait `c1` 3/3 à une politique qui n'y avait pas droit. La phrase de clôture qui suivait (« aucune politique véritablement aveugle ne tient un critère ») était en plus réfutée par la ligne juste au-dessus d'elle.

Neuf politiques, chacune définie **entièrement** par son triplet **cadrage × achat × tranche**, sans qu'aucune ne lise le rapport, le texte d'un indice ou celui d'une cause — la tranche, en particulier, est toujours mécanique (un rang déclaré fixe, ou un extrême de longueur), jamais « la bonne cause ». Simulées sur le corpus réécrit de `config/course.json` (rapport, indices et causes après le tour 2).

| Politique (cadrage × achat × tranche) | `c1` frugalité (2/3) | `c2` ordre (2/3) | `c3` fondement (2/3) |
| --- | --- | --- | --- |
| Aucun cadrage · aucun achat · la cause la plus longue | manqué (0/3) | manqué (0/3) | manqué (0/3) |
| Aucun cadrage · aucun achat · la cause la plus courte | manqué (0/3) | manqué (0/3) | manqué (0/3) |
| Aucun cadrage · aucun achat · rang fixe (toujours la première cause déclarée) | manqué (1/3) | manqué (0/3) | manqué (0/3) |
| Cadrage jamais transmis · aucun achat · rang fixe | manqué (1/3) | manqué (0/3) | manqué (0/3) |
| Aucun cadrage · le premier indice seul (`h1`) · rang fixe | manqué (1/3) | manqué (0/3) | manqué (0/3) |
| Aucun cadrage · les cinq indices · rang fixe | manqué (0/3) | manqué (0/3) | manqué (0/3) |
| Cadrage vide posé en premier · aucun achat · rang fixe | manqué (1/3) | manqué (0/3) | manqué (0/3) |
| Toutes les lectures cochées, posé en premier · aucun achat · rang fixe | manqué (1/3) | **tenu (3/3)** | manqué (0/3) |
| Aucun cadrage · l'indice le plus cher (`h5`) seul · rang fixe | manqué (1/3) | manqué (0/3) | manqué (0/3) |

**Une politique tient encore un critère, et le tableau le dit plutôt que de l'écarter : « toutes les lectures cochées » tient `c2` 3/3.** Cocher chaque case ne demande aucune lecture — c'est un geste mécanique, aussi aveugle que n'en cocher aucune — et il satisfait par construction « un cadrage posé, non vide, avant le premier achat », exactement ce que `framed-first-at-least` lit. Ce n'est pas une fuite non traitée : c'est la conséquence assumée de la scission du 30/08, qui a délibérément fait de `c2` un critère à un seul axe, l'ordre, laissant `c3` (le fondement) sanctionner seul l'absence de lecture. Et c3 le fait ici sans exception : `manqué (0/3)`, parce que cocher tout retient des suppositions que le rapport n'établit pas.

**Ligne à part, hors tableau : `h5` seul ne tient plus rien, et le chemin frugal légitime n'est plus aveugle.** Avant le tour 2, « `h5` seul » figurait dans ce tableau comme la politique la moins chère *encore légitime*, parce que lire son texte (qui nommait quatre causes sur cinq) suffisait à trancher par élimination. Depuis le graphe d'élimination du contrat, `h5` ne fait plus qu'une chose : reconfirmer une exclusion déjà gratuite du rapport. Acheté seul, il ne réduit jamais le champ — la ligne du tableau le confirme, `manqué (1/3)`, identique à n'importe quel autre indice seul. Le chemin frugal qui reste (deux indices, sous le seuil de `c1`) tient `c1` 3/3, mais il exige de lire *lequel* des cinq indices écarte *quelle* cause, ce qu'aucun triplet aveugle ne peut produire. Il n'a donc pas sa place dans ce tableau.

Sur ce corpus, **aucune politique aveugle ne tient `c1` ni `c3`.** Une seule en tient un — `c2`, par la ligne ci-dessus — et c'est nommé, pas caché.

## Quatre politiques mesurées, non arrondies (tour 3, recalculées au tour 4)

Le tableau ci-dessus répond à « une politique mécanique gagne-t-elle ». Il ne répond pas à « quelle est la part de chance ». Mesuré sur le corpus du tour 3, contre `c1`, qui pèse 2 des 4 points du jeu :

**Recalculé au tour 4, après le plancher de deux causes et le passage du seuil de `c1` à 3 sur 3.** Les chiffres du tour 3 sont conservés en seconde colonne : ils disaient vrai d'un corpus où les indices pouvaient isoler la cause réelle.

| Politique | `c1` aujourd'hui | `c1` au tour 3 |
| --- | --- | --- |
| Rang fixe, rien lu — **aveugle au sens strict** | **0 %** | 0 % |
| Balayage des intitulés : barrer les causes nommées, trancher la survivante | **12,5 %** | **100 %** |
| Lit le rapport, n'achète rien, devine parmi les survivants | **3,7 %** | 25,9 % |
| Achète deux indices à positions fixes, puis déduit | 12,5 % | 66,7 % |

Le balayage des intitulés est la fuite que le tour 4 a trouvée, et elle valait certitude : les refus d'alors forçaient les indices à couvrir toutes les causes en lice sauf la réelle, et les intitulés — publics avant l'achat — publiaient ce complément. Le plancher de deux causes le ramène à un pile ou face par situation, donc à 12,5 % sur trois situations exigées.

Les quatre politiques passent désormais sous les 15,6 % retenus chez `lie-detector`. Le prix payé est nommé : `c1` n'a plus de marge d'erreur, une situation manquée le fait tomber.

La quatrième ligne (« Achète deux indices à positions fixes, puis déduit ») **n'est pas une politique aveugle** : atteindre le plancher exige de lire lequel des cinq indices écarte encore une cause en lice, et les cinq causes elles-mêmes. C'est le jeu joué correctement, et son taux dit seulement que le jeu est gagnable quand on le joue — à ce niveau, gagnable au pile ou face par situation, plus depuis le plancher du tour 4. Elle figure ici parce qu'elle se mémorise depuis une soluce — la seule parade tenable étant que la position de l'indice utile diffère d'une situation à l'autre (`1` sur `s1`, `5` sur `s2`, `4` sur `s3`), ce qui fait qu'aucune position fixe n'est utile plus d'une fois.

## Tasks to do

### `1)` Le câblage

1. `src/games/register-games.ts` : un bloc `registry.register('hint-budget', { evaluator, configSchema, answerSchema })`, à la suite des six autres.
2. `src/games/register-components.ts` : une entrée `'hint-budget': HintBudgetGame`.
3. Rien d'autre ne bouge. Si un troisième fichier doit changer, le contrat de plugin a une fuite — la signaler plutôt que la contourner.

### `2)` Le corpus

1. Remplacer, dans `config/course.json`, le `type`, la `config` et les `criteria` de `g2-1`. Le `label` (« Combien d'indices vous faut-il ? ») ne change pas : il décrit déjà ce jeu.
2. Écrire les trois situations selon les six règles ci-dessus.
3. Écrire le `statement` : il annonce que le cadre se transmet une seule fois, que chaque indice a un prix affiché, et que l'ordre des deux gestes est libre. Il ne dit **ni** que l'ordre est noté, **ni** qu'il existe une pénalité de tranche fausse.

### `3)` Les parcours qui traversent tout

1. Créer `__tests__/fixtures/hint-budget-answer.ts` : `defaultHintBudgetAnswer(config)`, une trace conforme minimale — aucun cadrage, aucun achat, la première cause tranchée. Les parcours qui mesurent `intervention` ou `parallele` n'ont besoin que d'une trace **valide**, jamais d'une bonne réponse.
2. Brancher la fixture dans `checkpoints-run.test.ts` et `three-tracks-run.test.ts`, à côté de `defaultLieDetectorAnswer` : `g2-1` n'est plus un `test-bench`, et sans elle ces deux parcours refusent la soumission.

### `4)` Le test d'intégration du jeu

1. Créer `__tests__/integration/course-run/hint-budget-run.test.ts`, sur le gabarit de `lie-detector-run.test.ts` : vrai registre, vraie façade, vraie stratégie de pondération, corpus réel de `g2-1` lu depuis `config/course.json`.
2. Les profils se construisent **depuis le corpus lu**, jamais depuis des identifiants écrits en dur : une réécriture du corpus ne doit pas casser ce test pour la mauvaise raison.
3. Quatre profils : le cadreur frugal, le demandeur pressé, le cadreur dispendieux, et celui qui coche tout.
4. Trois garde-fous de corpus, vérifiés sur le corpus réel :
   - la cause `actual` n'occupe pas le même rang dans les trois situations ;
   - l'ensemble des rangs des lectures `established` diffère d'une situation à l'autre ;
   - pour chaque situation et chaque indice, une tranche fausse à l'aveugle coûte strictement plus qu'une tranche fausse après l'achat de cet indice.
5. `verification` vit dans la signature, `pilotage-contexte` aussi : lire `getVerdict().signature`, jamais `.result`.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | Ajouter le jeu n'a demandé que les deux blocs de câblage |
| 2 | Le parcours réel se charge sans refus, et `g2-1` passe `hintBudgetConfigSchema` |
| 3 | `checkpoints-run` et `three-tracks-run` traversent les sept groupes sans refus de soumission |
| 4 | Un profil qui cadre juste d'entrée et résout les trois situations avec au plus deux indices chacune satisfait les trois critères |
| 4 | Un profil qui ne cadre jamais et achète tous les indices manque les trois |
| 4 | Trancher systématiquement la première cause de chaque situation résout au plus une situation |
| 4 | Retenir toutes les lectures de chaque situation satisfait `c2` (l'ordre : cadré en premier) et manque `c3` (le fondement : rien n'appuie une sélection totale) — cf. Amendements ci-dessous |
| 4 | `npm run lint`, `npm run typecheck` et `npm run test` passent |

### Amendements du 30/08, après revue

- Le `statement` a perdu sa phrase « Les deux gestes se jouent dans l'ordre qui vous convient » : elle rassurait sur la dimension exacte que `c2` note, à contresens de la règle de `DESIGN.md:77` — « Un jeu ne dit jamais ce qu'il note » exige le silence sur ce qui est noté, pas une phrase qui oriente à contresens. Il dit désormais ce que le joueur peut faire — transmettre le cadre, interroger l'assistant — et quand trancher, sans plus rien dire de l'ordre.
- Retenir toutes les lectures de chaque situation ne satisfait plus « aucun » critère de cadrage — c'était vrai du critère combiné d'origine. Depuis la scission, ce profil satisfait `c2` (l'ordre : il cadre en premier) et manque `c3` (le fondement : il retient plus que ce que le rapport établit). C'est exactement le décalage que la scission corrige — voir le tableau de politiques aveugles ci-dessus et `hint-budget-run.test.ts`, « satisfies the order criterion but sinks the grounding criterion ».
- Deux garde-fous de longueur ajoutés à `hint-budget-run.test.ts`, sur le modèle de `lie-detector-run.test.ts:398,417` : la cause réelle n'est jamais le texte le plus long ni le plus court de sa situation, et l'écart entre le plus long et le plus court reste sous un quart du plus long.
- Un garde-fou de recouvrement ajouté : la plus longue sous-chaîne commune entre un indice et (le texte de la cause réelle + sa vérification) reste sous 20 caractères, dans les trois situations — casse si un futur indice paraphrase la réponse plutôt que de l'entourer. **Généralisé au tour 3** : posé ici sur le seul indice le plus cher, il couvre désormais **tous** les indices de chaque situation — un garde-fou qui ne surveille que la position que le défaut venait de quitter ne garde rien. Détail : `phase-1.md`, section « La cardinalité exacte, ajoutée au tour 3 ».

## L'économie du tour 4 : le plancher de deux causes

L'encadré du tour 3 est périmé. Il décrivait deux indices utiles par situation et un champ ramené à une seule cause — c'est exactement ce qui rendait la réponse lisible par soustraction. La structure tenue :

```
5 causes = 1 réelle + 2 écartées par le rapport + 2 encore en lice
5 indices, chacun écarte exactement 1 cause non réelle :
   1 utile     -> l'une des deux causes encore en lice
   4 gaspillés -> les 2 causes déjà écartées par le rapport
Acheter TOUS les indices laisse encore 2 causes debout :
   la réelle, et l'autre cause encore en lice
```

Le geste décisif n'est donc plus un achat mais une lecture : entre les deux dernières causes, c'est le symptôme et le rapport qui tranchent. Les trois discriminations, chacune inférentielle et jamais énoncée comme une exclusion :

| Situation | Les deux dernières | Ce qui départage, dans le rapport |
| --- | --- | --- |
| `s1` | horloge du serveur · cache CDN | « chaque appel reçoit un refus calculé à la volée, jamais deux fois la même réponse servie à l'identique » — un cache resservirait la même |
| `s2` | arrondi par ligne · double calcul du total | « l'écart n'apparaît que sur les lignes dont la quantité comporte une décimale » — un double calcul frapperait toutes les lignes |
| `s3` | parallélisme sans isolation · cache de dépendances corrompu | « l'échec ne porte jamais sur les mêmes tests d'une exécution à l'autre » — un cache corrompu échouerait de façon déterministe |

C'est la part du corpus que le contrat ne peut pas vérifier : le schéma garantit qu'il **reste** deux causes, pas que le rapport permette de les départager. La qualité de ces trois inférences reste éditoriale. Le plafond d'exploitation, lui, est mécanique : sans la lecture, le mieux qu'une politique obtienne est un pile ou face par situation.

## Le plancher élargi au tour 5 : le panneau de cadrage nomme des causes aussi

Le plancher du tour 4 ne portait que sur les cibles d'indices. Le panneau de cadrage nomme des causes lui aussi : une lecture `established` reformule ce que le rapport écarte, une supposition non surveillée pouvait déguiser une hypothèse de diagnostic. Sur `s2`, les cinq lectures et les cinq intitulés du marché nommaient ensemble quatre causes sur cinq — le complément était redevenu un singleton, exactement le canal que le tour 4 venait de fermer côté indices, rouvert sur une seconde surface publique du même écran.

Fermé en contrat, pas en consigne, sur le modèle du tour 2 : `framingSchema` porte désormais `refersTo: string | null`, la cause candidate qu'une lecture désigne nommément — sur le modèle exact de `hint.eliminates`. Une garde lexicale (plus longue sous-chaîne commune) ne pouvait pas suffire : elle compte aussi les locutions partagées entre lecture et cause (« de l'agent CI ») et rejetterait un corpus sain tout en laissant passer une paraphrase. Le plancher de deux causes se recalcule désormais sur **l'union** de tout ce que l'écran nomme — exclusions du rapport, éliminations d'indice, références de cadrage — plutôt que sur les seules éliminations d'indice. Détail du contrat : `phase-1.md`, section « Le plancher élargi à tout ce que l'écran nomme ».

Six suppositions ont été réécrites pour qu'aucune ne désigne plus une cause candidate par accident — une supposition reste une phrase qui *sonne* juste sans jamais nommer un diagnostic, jamais une hypothèse de panne déguisée : `s1-f3` (limite de débit du proxy, plutôt que le pare-feu qui évoquait `s1-c-header`), `s1-f4` (tunnel réseau ajouté cette semaine, plutôt que le jeton mis en cache côté client), `s2-f3` (format d'affichage des montants, plutôt que le taux de change figé qui évoquait `s2-c-vat`), `s2-f5` (modèle de facture refait par l'assistant, plutôt que le job asynchrone qui évoquait `s2-c-double`), `s3-f1` (pipeline CI migré vers un nouveau fournisseur, plutôt que l'image reconstruite chaque nuit), `s3-f4` (journaux de la CI tronqués, plutôt que le dépôt de paquets interne qui évoquait `s3-c-cache`). Les six lectures `established` (deux par situation) gardent leur texte : seule leur cible se déclare, `refersTo` égal à la cause que leur reformulation du rapport écarte déjà.

## Les trois `verification` du plancher, recitées sur le rapport plutôt que sur un indice supprimé, au tour 6

Les trois `verification` des causes que le plancher laisse debout (`s1-c-cdn`, `s2-c-double`, `s3-c-cache`) écartaient leur cause en citant un fait qui n'existait plus nulle part à l'écran : les indices qui portaient jadis ce fait avaient été supprimés deux commits plus tôt (la réécriture à une élimination par indice, tour 3). Le joueur ne pouvait obtenir cette clôture par aucun geste du jeu — ni le rapport, ni un indice achetable, ni une lecture de cadrage ne la portait. Recitées sur la ligne de rapport que la table ci-dessus (« Ce qui départage, dans le rapport ») désignait déjà mot pour mot : `s1-c-cdn` sur « jamais deux fois la même réponse servie à l'identique », `s2-c-double` sur « l'écart n'apparaît que sur les lignes dont la quantité comporte une décimale », `s3-c-cache` sur « l'échec ne porte jamais sur les mêmes tests d'une exécution à l'autre ». Le fait cité existe désormais à l'écran ; l'inférence à en tirer reste au joueur — c'est `ruledOutByReport: false` sur ces trois causes qui le garantit, voir `phase-1.md`, section « Le plancher testé, et `ruledOutByReport` écrit noir sur blanc, au tour 6 ».
