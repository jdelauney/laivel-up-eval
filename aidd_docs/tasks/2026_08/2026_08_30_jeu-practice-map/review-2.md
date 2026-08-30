# Review 2: Le jeu `practice-map`, contre-vérification du commit de correction

- **Verdict**: changes-requested
- **Diff**: `main...HEAD` (`be70886`, `bcf1762`, `267df44`) — contre-vérification portant sur `bcf1762..267df44`
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_31
- **Findings**: 0 critical, 2 warning, 5 minor

## Phases

### Phase 1 — Les contrats et la lecture pure des placements

- [x] Refus du corpus nommant le champ fautif — inchangé, `schema/config.schema.ts:245-331`
- [x] `IncompletePlacementError` / `UnknownPracticeError` — inchangé
- [x] Bordure lue dedans ; égalité ne tient pas ; **le helper ne lit aucun seuil** — *levé* : `helpers/read-placements.helper.ts:9-20` distingue désormais seuil **de critère** (jamais lu ici, vérifié) et seuil **de configuration** (`highRigorFrom`, lu en `:91`, avec la raison). Le critère `phase-1.md:130` était ambigu ; la clarification le tranche dans le sens que le code applique
- [x] Trace ordonnée, sans champ dérivé — inchangé
- [x] `npm run test` passe, chaque refus a son test — 650 tests

### Phase 2 — L'évaluateur et ses trois règles

- [x] Trois règles binaires, une lecture chacune, type inconnu → erreur — inchangé
- [x] Décalage en bloc → `c1` manqué / `c3` tenu ; empilement → trois manqués — inchangé

### Phase 3 — Le jeu à l'écran : poser, déplacer, soumettre

- [x] Remplacement, verrou de soumission, soumission unique, aucun repère avant révélation — inchangé
- [x] Saisie/déplacement/dépôt au clavier ; **position annoncée en mots** ; aucun état par la couleur seule — *levé* : `hooks/use-practice-map.hook.ts:55` introduit `PLANE_MIDPOINT`, les deux axes basculent au milieu géométrique. Aucune surface ne se formule plus sur `highRigorFrom`
- [x] `npm run test` passe, parcours clavier couvert — le test de régression `use-practice-map.test.ts:290-306` dissocie `highRigorFrom: 0.6` du milieu `0.5`, ce que le fixture commun (`highRigorFrom: 0.5`) rendait impossible

### Phase 4 — Le jeu dans le parcours, et son corpus

- [x] Câblage résolu, rien d'autre déplacé — inchangé
- [x] `course.json` valide, zones disjointes et plafonnées, relations soutenues — inchangé, recalculé
- [x] Empilement et diagonale unique manquent les trois critères — inchangé
- [x] Lecture juste / nulle / décalée ; `npm run test` et `npm run typecheck` passent — inchangé

### Phase 5 — La passe impeccable de la surface

- [ ] Plan carré **[x]** ; **la réserve pleine ne pousse pas l'action primaire hors de l'écran [ ]** — inchangé, défaut de backlog ouvert et arbitré
- [x] Fiche de surface — inchangée
- [x] Captures aux deux gabarits, `test` et `typecheck` verts — inchangés

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟡 | code | 3 | `src/games/practice-map/hooks/use-practice-map.hook.ts:137-147` (`nudge`) | `clamp01(current[axis] + direction * NUDGE_STEP)` accumule la dérive flottante : le treillis clavier compte **25 valeurs distinctes pour 11 positions**. Conséquence mesurée, silencieuse et notée : la coordonnée atteinte dépend du **chemin**, pas de la case visée. `p5`, zone d'intensité `[0.8, 1]` — 3× Droite depuis le centre donne `0.7999999999999999`, lu **HORS ZONE** ; 7× Droite (butée à `1`) puis 2× Gauche donne `0.8`, lu **EN ZONE**. Même colonne visée, même annonce en mots, deux verdicts. Idem `p1` rigueur `[0, 0.2]` : 3× Bas → `0.20000000000000004` hors zone, 6× Bas puis 2× Haut → `0.2` en zone. Cinq bords de zone concernés (`p1` rigueur, `p2` rigueur, `p5` intensité, `p6` intensité et rigueur). Le joueur souris n'a aucun piège équivalent. **Portée honnête** : toute zone reste atteignable au clavier par au moins une valeur sûre, et les cibles naturelles (centre de zone, extrémités d'axe) ne sont pas touchées — seul est puni celui qui se gare pile sur un bord | Arrondir au pas : `Math.round((current[axis] + direction * NUDGE_STEP) * 10) / 10`, ou porter un compteur entier de crans et n'en dériver la fraction qu'au dépôt |
| 🟡 | functional | 5 | `aidd_docs/backlog/defects/practice-map-pousse-la-soumission-hors-de-l-ecran-mobile.md` | Critère `phase-5.md:92` toujours non tenu. Reporté pour que le compte soit juste, pas comme une découverte | Rien dans cette PR ; le défaut porte la suite |
| 🟢 | rot | 1 | `src/games/practice-map/helpers/read-placements.helper.ts:77`, `:107` | Toujours ouvert depuis la revue 1 : les commentaires annoncent « le `find` ci-dessous » là où le code utilise `Map.get` (`:79`, `:110`) | Écrire `get` |
| 🟢 | code | 3 | `src/games/practice-map/hooks/use-practice-map.hook.ts:243-244` | Toujours ouvert : `parsed.poles as Poles` et `parsed.quadrants as Quadrants` sont des assertions sans effet sur un `parsed` déjà typé `PracticeMapConfig` | Retirer les deux `as` |
| 🟢 | rot | 5 | `aidd_docs/tasks/2026_08/2026_08_30_jeu-practice-map/phase-5.md:98` | Toujours ouvert : le bloc « Tenu, mesuré » affirme « Aucune ligne de quadrant » et « La réserve se plafonne à trois entrées visibles », tous deux faux du code livré et annulés plus bas (`:115`, `:136`) sans annotation sur place | Annoter le bloc `:98`, comme `:115` le fait pour la contrainte qu'il annule |
| 🟢 | code | 3 | `src/games/practice-map/components/composites/practice-plane.tsx:154-156` | Toujours ouvert : après un dépôt, le focus reste sur un conteneur redevenu `tabIndex=-1` ; le joueur au clavier retraverse les badges posés pour revenir à la réserve | Rendre le focus à la ligne de légende de la pratique posée |
| 🟢 | rot | 1/3 | `src/games/practice-map/schema/config.schema.ts:139` et `hooks/use-practice-map.hook.ts:55` | `INTENSITY_MIDPOINT = 0.5` (validation du corpus) et `PLANE_MIDPOINT = 0.5` (formulation de l'annonce) sont deux déclarations indépendantes de la même moitié géométrique. Elles doivent rester égales pour que l'annonce ne se remette pas à suivre une valeur de validation. Aucun test ne le tient. C'est la forme qu'aurait la prochaine fuite de cette classe, cette fois symétrique sur les deux axes, donc invisible au test de régression actuel | Une seule constante partagée, ou un test qui affirme leur égalité |

## Verification

| Metric        | Value |
| ------------- | ----- |
| Verified      | 94 % (16/17) |
| Files checked | `src/games/practice-map/hooks/use-practice-map.hook.ts`, `helpers/read-placements.helper.ts`, `schema/config.schema.ts`, `components/composites/practice-plane.tsx`, `components/composites/practice-tray.tsx`, `components/composites/practice-map-game.tsx`, `components/elements/practice-token.tsx`, `components/elements/marker-line.tsx`, `practice-map.evaluator.ts`, `config/course.json`, `__tests__/fixtures/practice-map-answer.ts`, `__tests__/unit/games/practice-map/use-practice-map.test.ts`, `aidd_docs/tasks/2026_08/2026_08_30_jeu-practice-map/{plan,phase-1,phase-3,phase-4,phase-5}.md` |
| Unchecked     | `phase-5.md:92` clause « la réserve pleine ne pousse pas l'action primaire hors de l'écran » — fix, défaut de backlog déjà ouvert et arbitré. Les deux clauses levées par ce commit (`phase-1.md:130`, `phase-3.md:164`) sont désormais fixed |
| Unplanned     | none — le commit `267df44` ne touche que les points relevés par la revue 1, plus le rapport `review.md` mis sous suivi |
