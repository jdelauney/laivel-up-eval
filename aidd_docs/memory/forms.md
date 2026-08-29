# Forms

## Approche

- TanStack Form avec l'adapter Zod natif. **Une seule définition de validation** : le schéma Zod est la source, jamais redéclarée côté formulaire.
- Le schéma d'un formulaire vit dans le `schema/` de son périmètre — `features/<nom>/schema/` ou `games/<jeu>/schema/` — jamais dans le composant.
- La soumission passe par un `action` du même périmètre, testable sans React.

## Où ça sert

L'onboarding, et les jeux structurellement formulaires : texte à trous, choix 2×2, répartition de budget.

## Conventions

- Les clés sont en anglais comme le reste du code ; ce que voit le joueur (`label`, `question`, énoncés, messages d'erreur) est en français.
- La clé d'API saisie à l'onboarding ne quitte pas le LocalStorage local et n'est jamais journalisée.

Aucun formulaire n'est encore écrit : les dépendances et la convention sont posées, l'implémentation suit.
