# Review: La saisie d'identité et de dépôt à l'entrée du parcours

- **Verdict**: approve
- **Diff**: `main...feat/saisie-identite-et-depot`
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_29
- **Findings**: 0 critical, 0 warning, 6 minor

## Phases

### Phase 1 — Le contrat du dépôt désigné

- [x] `proprietaire/depot` accepté ; un seul segment, trois segments, un segment vide refusés — `__tests__/unit/core/contracts/repository-slug.test.ts:14`
- [x] Un segment avec espace ou réduit à un marqueur de chemin est refusé — `__tests__/unit/core/contracts/repository-slug.test.ts:24`
- [x] Chaîne vide ou espaces seuls rendent l'absence, sans erreur — `__tests__/unit/core/contracts/repository-slug.test.ts:42`
- [x] Les décorations d'URL (`http`, `www.`, `.git`, slash final, requête, ancre) rendent toutes `o/d` — `__tests__/unit/core/contracts/repository-slug.test.ts:47`
- [x] `https://github.com/o/d/pull/3` est refusé, avec ou sans requête — `__tests__/unit/core/contracts/repository-slug.test.ts:65`
- [x] Autre hébergeur ou texte libre refusé — `__tests__/unit/core/contracts/repository-slug.test.ts:87`
- [x] Message de refus en français citant les deux formes — `src/core/contracts/repository-slug.schema.ts:23`
- [x] Normalisation idempotente — `__tests__/unit/core/contracts/repository-slug.test.ts:106`

### Phase 2 — Le dépôt traverse la session

- [x] Un instantané sans champ `repository` est accepté — `src/core/contracts/session-snapshot.schema.ts:34`
- [x] Un `repository` non normalisé est rejeté, la façade repart sans lever — `__tests__/unit/core/session/game-session.facade.test.ts:262`
- [x] Une session avec dépôt le rend normalisé dans son instantané — `src/core/entities/game-session.entity.ts:69`
- [x] Une session sans dépôt produit un instantané sans dépôt — `__tests__/unit/core/entities/game-session.test.ts:146`
- [x] Une session restaurée retrouve dépôt, pseudo et position — `src/core/entities/game-session.entity.ts:55`
- [x] `designatedRepository()` rend `undefined` sans dépôt désigné — `src/core/session/game-session.facade.ts:208`
- [x] `storedRun()` expose le dépôt de la partie enregistrée — `src/core/session/game-session.facade.ts:166`
- [x] Deux parties aux mêmes réponses rendent le même niveau et les mêmes dimensions — `__tests__/unit/core/session/game-session.facade.test.ts:278`

### Phase 3 — La saisie à l'accueil

- [x] Le schéma du formulaire délègue la forme au contrat du domaine — `src/features/onboarding/schema/onboarding-form.schema.ts:26`
- [x] Champ vide : le parcours s'ouvre sans erreur — `__tests__/unit/features/onboarding/onboarding-view.test.tsx:72`
- [x] URL complète : le parcours s'ouvre sur le slug — `__tests__/unit/features/onboarding/onboarding-view.test.tsx:58`
- [x] Forme refusée : message donnant la forme attendue, parcours fermé — `__tests__/unit/features/onboarding/onboarding-view.test.tsx:85`
- [x] Le champ refusé porte `aria-invalid` — `src/features/onboarding/components/sections/onboarding-view.tsx:158`
- [x] Le message du pseudo reste inchangé — `__tests__/unit/features/onboarding/onboarding-view.test.tsx:103`
- [x] Le store porte pseudo et dépôt après démarrage — `src/store/session.store.ts:39`
- [x] Une reprise remet le dépôt dans le store — `src/features/onboarding/hooks/use-onboarding.hook.ts:43`
- [x] La carte de reprise affiche le dépôt, et rien de plus sans lui — `src/features/onboarding/components/composites/resume-run.tsx:30`
- [x] Démarrer avec un dépôt ne déclenche aucun appel réseau — `__tests__/unit/features/onboarding/onboarding-view.test.tsx:115`

### Phase 4 — La saisie visible pendant la partie

- [x] L'en-tête affiche pseudo et dépôt quand les deux sont fournis — `src/components/layout/app-layout/app-layout.tsx:21`
- [x] Avec le pseudo seul, aucun séparateur orphelin — `__tests__/unit/components/layout/app-layout.test.tsx:22`
- [x] Sans identité, l'en-tête est celui d'avant le lot — `__tests__/unit/components/layout/app-layout.test.tsx:31`
- [ ] Un pseudo de 40 caractères et un dépôt long laissent l'avancement lisible sur une seule bande — la tenue en page ne s'observe pas sous jsdom ; seule la mécanique (`truncate`, `shrink-0`) est vérifiée
- [x] La saisie reste lisible pendant le parcours — `__tests__/unit/app.test.tsx:38`
- [x] Elle l'est encore sur le verdict — `__tests__/unit/app.test.tsx:45`
- [x] Rien sur l'accueil ni sur la configuration refusée — `__tests__/unit/app.test.tsx:58`

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟢 | rot | 3 | `src/features/onboarding/schema/onboarding-form.schema.ts:30` | `OnboardingFormInput` est exporté et n'est utilisé nulle part ; `noUnusedVariables` ne voit pas un export mort | Le supprimer, ou s'en servir pour typer les `defaultValues` du formulaire |
| 🟢 | rot | 3 | `src/features/onboarding/components/sections/onboarding-view.tsx:113` | Le bloc Label + Input + erreur est dupliqué presque à l'identique pour le pseudo et pour le dépôt (`:140`) ; seule la ligne d'erreur a été factorisée | Extraire un élément `text-field` (Label, Input, aide, erreurs) et le rendre deux fois |
| 🟢 | conform | 3 | `src/features/onboarding/components/composites/resume-run.tsx:18` | `repository` est typé `string` ici et dans `app-layout.tsx:13`, alors que le reste de la chaîne porte `RepositorySlug` ; le type nommé se perd à l'arrivée à l'écran | Importer `RepositorySlug` dans les deux props |
| 🟢 | code | 4 | `src/App.tsx:51` | La chaîne vide sert de sentinelle d'absence pour décider s'il y a une identité à rappeler ; deux représentations du vide cohabitent (`''` et `undefined`) | Faire porter au store une `identity` qui vaut `undefined` tant que rien n'est saisi |
| 🟢 | code | 4 | `__tests__/unit/components/layout/app-layout.test.tsx:60` | Le test assied son assertion sur des classes Tailwind (`truncate`, `shrink-0`) : un renommage d'utilitaire le casse sans que le comportement change | Confier la tenue en page au QA navigateur et retirer l'assertion, ou la remplacer par une capture de référence |
| 🟢 | code | 3 | `src/features/onboarding/components/composites/resume-run.tsx:30` | La branche « partie enregistrée sans dépôt » de la carte de reprise n'est couverte par aucun test ; seule celle avec dépôt l'est | Ajouter le cas sans dépôt et vérifier qu'aucun séparateur n'apparaît |

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 97% (32/33)                                       |
| Files checked | `src/core/contracts/repository-slug.schema.ts`, `src/core/contracts/session-snapshot.schema.ts`, `src/core/entities/game-session.entity.ts`, `src/core/session/game-session.facade.ts`, `src/store/session.store.ts`, `src/features/onboarding/schema/onboarding-form.schema.ts`, `src/features/onboarding/hooks/use-onboarding.hook.ts`, `src/features/onboarding/components/sections/onboarding-view.tsx`, `src/features/onboarding/components/composites/resume-run.tsx`, `src/components/layout/app-layout/app-layout.tsx`, `src/App.tsx` |
| Unchecked     | Un pseudo de 40 caractères et un dépôt long laissent l'avancement lisible sur une seule bande — not-applicable (non observable en revue statique ; à voir au QA navigateur) |
| Unplanned     | `__tests__/unit/app.test.tsx` créé hors projection, pour prouver le critère « lisible pendant le parcours et au verdict » que la phase 4 ne couvrait que sur `AppLayout` ; `__tests__/unit/features/group-navigation/use-course.test.ts` retouché, forcé par la nouvelle signature d'`openCourse` ; les tolérances de l'URL vont au-delà de la phase 1, qui ne prévoyait ni requête ni ancre, et qui ne prévoyait `.git` et slash final que sur l'URL — la requête et l'ancre ont été ajoutées en correction de la revue précédente (`8ac3f27`) |
