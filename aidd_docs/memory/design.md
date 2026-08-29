# Design

## Système

- Tailwind CSS en classes utilitaires, chargé par le plugin Vite. Aucun fichier de config Tailwind : tout est en CSS-first dans `src/index.css`.
- shadcn/ui en style `base-vega`, sur Base UI, couleur de base `neutral`, variables CSS activées. Icônes Lucide, police Inter Variable.
- Usage maximal des primitives : pas de composant custom quand shadcn suffit.

## Jetons

Tous dans [`src/index.css`](../../src/index.css), en `oklch`. Trois familles portent une intention forte :

- **Les deux plans.** `--plane*` est un os neutre constant sur lequel la carte de relevé flotte ; le panneau du groupe porte la couleur. Les deux canaux ne se croisent jamais, pour que l'état se lise toujours contre le même fond.
- **Les six mondes de groupe.** `--group-1` à `--group-6`, une teinte par groupe, pleine force. **Le vermillon en est tenu à l'écart : jamais un groupe, toujours l'erreur.**
- **La triade d'état.** `--nominal`, `--caution`, `--missed`, sur le plan neutre uniquement. Une couleur, un sens.

Les rayons dérivent tous de `--radius` par multiplication, de `sm` à `4xl`.

## Composants

- `src/components/ui/` vient de la CLI shadcn et **n'est ni linté ni formaté** (exclu dans `biome.json`). Ne pas l'éditer à la main : réinstaller par la CLI.
- L'alias utilitaire est `@/lib/utils/cn`, pas le `@/lib/utils` par défaut de shadcn.

## Thème

**Un seul thème.** Le bloc `.dark` a été retiré : rien ne pose la classe, et une seconde palette non dessinée est un piège, pas une option. La variante `dark` reste **déclarée** parce que sept primitives shadcn générées par la CLI y font référence — la retirer casserait leur compilation. Réintroduire un thème sombre veut dire redéfinir ces jetons, pas basculer une classe.

## Accessibilité

Contour de focus global via `outline-ring/50`. Le sens ne repose jamais sur la seule couleur : la triade d'état s'accompagne du libellé du cran (« L — multi-étapes », pas 75 %).
