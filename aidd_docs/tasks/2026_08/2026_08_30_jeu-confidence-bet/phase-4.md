---
status: done
---

# Instruction: Le jeu dans le parcours

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
├── config/course.json                                      ✏️ g1-1 passe de test-bench à confidence-bet
└── __tests__/integration/course-run/
    └── confidence-bet-run.test.ts                          ✅ le barème contre le moteur, huit profils
```

## User Journey

```mermaid
flowchart TD
  A[le parcours se charge] --> B{les schémas valident g1-1}
  B -->|hors contrat| C[la session ne s ouvre pas et nomme le champ]
  B -->|conforme| D[le joueur atteint le groupe Jugement critique]
  D --> E[il joue les six extraits]
  E --> F[l évaluateur rend quatre verdicts]
  F --> G[la dimension verification reçoit ses contributions]
  G --> H[le relevé montre le score et sa bande]
```

## Test Scope

```mermaid
---
title: Test scope
---
journey
  section Setup
    charger le parcours réel et résoudre le jeu g1-1 => le registre rend l évaluateur et les schémas de confidence-bet: 5: api
  section Happy path
    rejouer les huit profils du tableau à travers le moteur => chacun rend le score attendu sur verification: 5: api
  section Edge case - le joueur qui mise haut partout
    rejouer le profil tout confiant => son score reste sous le premier palier de verification: 1: api
  section Edge case - le joueur qui se retranche au milieu
    rejouer le profil hédgeur => son score est le plus bas des huit: 1: api
  section Edge case - la configuration réelle passe son propre schéma
    valider config/course.json contre les schémas du registre => aucune erreur: 1: api
```

## Tasks to do

### `1)` Le jeu dans `config/course.json`

> `g1-1` cesse d'être un banc d'essai placeholder et devient le jeu de la story. Rien d'autre ne bouge dans le fichier.

1. Remplacer le bloc `g1-1` : `type` passe à `confidence-bet`, `label` à « Quelle confiance accordez-vous à ce code ? ».
2. Écrire la `config` : `statement`, `stakes` `[10, 30, 50, 70, 90]`, `neutralStake` `50`, `startingCapital` `100`, et six extraits — deux `sound`, deux `flawed`, deux `undecidable`.
3. La consigne énonce le cadre, jamais les critères : le nombre d'extraits, le verrouillage de la mise, le sens du gain et de la perte, et le fait que certains extraits ne peuvent pas être tranchés avec ce qui est montré. Elle ne dit ni les seuils, ni la bande, ni que la moyenne par nature compte.
4. Les deux extraits défectueux ne portent pas le même genre de défaut : l'un est un défaut de logique visible à la lecture, l'autre une dépendance qui n'existe pas. Un corpus à défaut unique mesurerait la reconnaissance d'un motif.
5. Les deux extraits indécidables le sont pour une raison **nommée dans leur révélation** : ce qui manque est hors de l'extrait, jamais une subtilité cachée dedans. Sans cela, l'indécidable devient un piège.
6. Écrire les quatre critères, tous rattachés à la seule dimension `verification` :

| id | question | règle | poids |
| --- | --- | --- | --- |
| `g1-1-c1` | La confiance engagée sur les extraits défectueux est-elle restée sous 50 % en moyenne ? | `mean-stake-on-flawed-below` `{ threshold: 50 }` | 2 |
| `g1-1-c2` | La confiance engagée sur les extraits sains a-t-elle dépassé 70 % en moyenne ? | `mean-stake-on-sound-above` `{ threshold: 70 }` | 2 |
| `g1-1-c3` | La calibration globale atteint-elle son seuil ? | `calibration-at-least` `{ threshold: 0.5 }` | 2 |
| `g1-1-c4` | La confiance est-elle restée dans la bande d'incertitude sur chaque extrait qu'on ne peut pas trancher ? | `stake-within-band-on-undecidable` `{ from: 40, to: 60 }` | 1 |

7. Le mapping `intervention` du placeholder disparaît. Six groupes portent la signature, le septième porte les axes : un jeu de jugement critique qui monterait un axe du référentiel officiel brouillerait cette frontière.

### `2)` Le barème vérifié contre le moteur

> Aucun test ne dit si un barème rend le jeu trivial. Rejouer des stratégies dans le moteur le dit.

1. Écrire `__tests__/integration/course-run/confidence-bet-run.test.ts`, sur le modèle de `three-tracks-run.test.ts`.
2. Chaque profil se déclare par ses mises, traverse le moteur réel, et son score sur `verification` est comparé au tableau. Le tableau est le contrat, pas une observation.
3. Les mises sont notées `sains / défectueux / indécidables`. Capital de départ 100, mouvement maximal 40 par extrait tranchable.

| # | Profil | Mises | c1 | c2 | c3 | c4 | Score | Capital |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Calibré, tranché des deux côtés | 90·90 / 10·10 / 50·50 | ✓ | ✓ | ✓ | ✓ | 7/7 = 1.000 | 260 |
| 2 | Calibré, une hésitation de chaque côté | 90·70 / 10·30 / 50·50 | ✓ | ✓ | ✓ | ✓ | 7/7 = 1.000 | 220 |
| 3 | Lit le code, ne sait pas dire qu'il ne sait pas | 90·90 / 10·10 / 90·90 | ✓ | ✓ | ✓ | ✗ | 6/7 = 0.857 | 180 |
| 4 | Discriminant mais tiède | 70·70 / 30·30 / 50·50 | ✓ | ✗ | ✓ | ✓ | 5/7 = 0.714 | 180 |
| 5 | Tout confiant | 90 partout | ✗ | ✓ | ✗ | ✗ | 2/7 = 0.286 | 20 |
| 6 | Tout méfiant | 10 partout | ✓ | ✗ | ✗ | ✗ | 2/7 = 0.286 | 20 |
| 7 | Hédgeur, la mise neutre partout | 50 partout | ✗ | ✗ | ✗ | ✓ | 1/7 = 0.143 | 100 |
| 8 | Confiant à contresens | 90·10 / 90·10 / 50·50 | ✗ | ✗ | ✗ | ✓ | 1/7 = 0.143 | 100 |

4. Ce que le tableau établit, et qu'il faut asserter explicitement :
   - le garde-fou est ce qui sépare le profil 1 du profil 3 : sans lui, savoir lire du code suffirait pour un sans-faute ;
   - les profils 5 et 6, les deux formes d'extrémité, retombent à 0.286, **sous le premier palier de `verification`** (0.4) ;
   - le hédgeur, qui ne se trompe jamais parce qu'il ne s'engage jamais, est le plus bas des huit avec le profil à contresens ;
   - le profil 4 est le cas limite du seuil de calibration : il atterrit exactement sur 0.5, et la borne inclusive le fait passer.
5. Vérifier aussi que le parcours réel se charge : la config de `g1-1` passe le schéma du jeu, et le registre résout son type.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | Le parcours réel se charge sans erreur et le groupe « Jugement critique » ouvre sur `confidence-bet` |
| 1 | Aucun critère du jeu ne vise une autre dimension que `verification` |
| 1 | La consigne ne nomme ni seuil, ni bande, ni moyenne par nature |
| 2 | Les huit profils rendent exactement les scores du tableau |
| 2 | Le profil qui mise haut partout obtient un score strictement inférieur à 0.4 |
| 2 | Le profil qui lit le code mais mise haut sur l'indécidable obtient un score strictement inférieur au profil calibré |
| 2 | Le profil tiède atterrit sur le seuil de calibration exact et le franchit |
