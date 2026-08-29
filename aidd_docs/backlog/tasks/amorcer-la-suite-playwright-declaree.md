---
type: task
status: ready
related_to:
  - aidd_docs/backlog/epics/onboarding-du-joueur.md
order: 1
---

# Task: Amorcer la suite Playwright que le projet déclare déjà tenir

## Context

`aidd_docs/memory/testing.md` annonce une suite E2E Playwright « volontairement minimale, un happy path onboarding → un jeu → résumé, suffisant pour la vidéo de démo ». Le dépôt ne la porte pas. `@playwright/test` est bien en dépendance de développement et `npm run test:e2e` existe dans `package.json`, mais aucun `playwright.config.*` n'a jamais été committé et aucun spec n'existe.

Constaté le 29/08 en voulant faire tourner le garde-fou E2E sur le lot « cadre avant de commencer ». Le garde-fou a été levé pour ce lot, dont la portée est une tuile de bandeau et un helper pur, couverts par les tests jsdom de l'écran.

## Outcome

`npm run test:e2e` lance un parcours réel dans un navigateur et échoue quand il casse.

## Scope

- Inclus : la configuration Playwright, le serveur de développement lancé par la configuration, et un spec unique couvrant accueil → une situation → résumé.
- Inclus : cantonner la découverte des specs à leur dossier, faute de quoi Playwright ramasse les suites Vitest et celles des plugins installés.
- Exclu : la couverture E2E des vingt situations. Le happy path suffit à ce que la mémoire projet annonce.
- Exclu : toute exécution en CI, non demandée à ce stade.

## Evidence

- `package.json:15` — `"test:e2e": "playwright test"`, et `@playwright/test` en dépendance.
- Aucun `playwright.config.*` dans l'arbre hors `node_modules`, et aucun spec sous `__tests__/`.
- `git log --diff-filter=D --all -- '*playwright*' '*e2e*'` ne rend rien : ces fichiers n'ont jamais existé, ils n'ont pas été supprimés.
- Lancé sans configuration, Playwright balaie tout l'arbre avec son `testMatch` par défaut, ramasse les suites Vitest et casse sur `Cannot read properties of undefined (reading 'config')`.

## Done When

- `npm run test:e2e` passe au vert sur un dépôt fraîchement cloné, après `npx playwright install`.
- La commande échoue quand l'accueil ne mène plus au parcours.
- `aidd_docs/memory/testing.md` décrit ce qui tourne réellement.
