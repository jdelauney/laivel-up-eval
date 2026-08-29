# Forms

## Approche

- TanStack Form avec l'adapter Zod natif. **Une seule définition de validation** : le schéma Zod est la source, jamais redéclarée côté formulaire.
- Le schéma d'un formulaire vit dans le `schema/` de son périmètre — `features/onboarding/schema/onboarding-form.schema.ts` est le modèle en place.
- Le composant ne porte pas la logique : le hook du périmètre (`use-onboarding.hook.ts`) orchestre, l'action fait le métier hors React.

## Où ça sert

L'onboarding est le seul formulaire écrit. Suivent les jeux structurellement formulaires : texte à trous, choix 2×2, répartition de budget.

## Conventions

- Les clés sont en anglais comme le reste du code ; ce que voit le joueur (`label`, `question`, énoncés, messages d'erreur) est en français.
- La clé d'API saisie à l'onboarding ne quitte pas le LocalStorage local et n'est jamais journalisée.
