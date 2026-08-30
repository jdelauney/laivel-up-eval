/**
 * Le découpage en lignes d'un extrait de code, écrit une seule fois. Il prend
 * une chaîne, jamais la configuration, pour que le schéma puisse l'appeler
 * sans cycle d'import : le schéma, l'écran et les tests comptent alors les
 * lignes de la même façon — un `split` refait sur place ailleurs pourrait
 * diverger d'un caractère et rendre un défaut introuvable sans que rien ne le
 * signale.
 */
export const snippetLines = (code: string): readonly string[] =>
  code.split('\n')
