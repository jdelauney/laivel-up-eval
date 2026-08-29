/**
 * Vocabulaire de notation, nommé forme par forme plutôt qu'en radical : un
 * radical trop court confondrait « critère » et « critique », un libellé de
 * groupe légitime. La comparaison porte sur des mots entiers.
 *
 * Partagé entre le balayage de l'écran (`onboarding-view.test.tsx`) et celui
 * du parcours réel (`integration/config-loading/course.test.ts`) : les deux
 * gardes protègent la même règle produit.
 */
export const SCORING_VOCABULARY = [
  'note',
  'notes',
  'noté',
  'notée',
  'notés',
  'notées',
  'notation',
  'notations',
  'score',
  'scores',
  'point',
  'points',
  'barème',
  'barèmes',
  'coefficient',
  'coefficients',
  'critère',
  'critères',
  'seuil',
  'seuils',
] as const
