import { z } from 'zod'

/**
 * Le dépôt désigné à l'entrée du parcours, réduit à la seule forme que l'API
 * GitHub sait relire : `proprietaire/depot`.
 *
 * La normalisation vit dans le domaine et non dans le formulaire, parce que le
 * slug est persisté dans l'instantané de session et sera relu par la lecture
 * des preuves du dépôt. Un contrat posé dans `features/` obligerait le domaine
 * à importer une feature, à contresens du sens des dépendances.
 *
 * Ici on valide une **forme**, jamais une existence : aucun appel réseau, et
 * pas de règle de nommage GitHub recopiée en dur — elle serait figée à la date
 * du jour sans rien garantir de plus.
 */

/** Ni `.` ni `..` : ces deux-là désignent un chemin, pas un dépôt. */
const SEGMENT = /^(?!\.{1,2}$)[A-Za-z0-9._-]+$/

/** Le protocole et le `www.` sont facultatifs : on accepte ce qui se colle. */
const GITHUB_URL = /^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+)$/i

const ACCEPTED_FORMS =
  'Indiquez le dépôt sous la forme « proprietaire/depot », ou collez son URL GitHub complète (https://github.com/proprietaire/depot)'

const isSlug = (value: string): boolean => {
  const segments = value.split('/')
  return segments.length === 2 && segments.every((part) => SEGMENT.test(part))
}

/**
 * Un slash final et un suffixe `.git` sont retirés des deux formes : qui copie
 * `proprietaire/depot.git` depuis une commande de clonage désigne le même
 * dépôt que qui tape le slug à la main.
 */
const stripDecorations = (path: string): string =>
  path.replace(/\/+$/, '').replace(/\.git$/i, '')

/**
 * La requête et l'ancre ne désignent rien du dépôt : GitHub lui-même met
 * `?tab=readme-ov-file` dans la barre d'adresse quand on ouvre un dépôt depuis
 * une page de profil. Le chemin, lui, reste jugé entier — `/pull/3` désigne
 * autre chose que le dépôt et doit toujours être refusé.
 */
const stripQuery = (path: string): string => path.split(/[?#]/)[0]

/**
 * Rend le slug, ou `undefined` quand rien n'a été saisi. Une forme non
 * reconnue ressort telle quelle : c'est `isSlug` qui la refuse ensuite, pour
 * que la normalisation n'ait pas à porter deux responsabilités.
 */
const normalize = (raw: string): string | undefined => {
  const trimmed = raw.trim()
  if (trimmed === '') return undefined

  const url = GITHUB_URL.exec(trimmed)
  return url === null
    ? stripDecorations(trimmed)
    : stripDecorations(stripQuery(url[1]))
}

/** La forme de référence, celle que le domaine stocke et relit. */
export const repositorySlugSchema = z.string().refine(isSlug, ACCEPTED_FORMS)

/**
 * Ce que le joueur tape. Deux formes entrent, une seule sort ; un champ laissé
 * vide sort en `undefined`, parce que le dépôt est facultatif.
 */
export const repositoryInputSchema = z
  .string()
  .refine((value) => {
    const slug = normalize(value)
    return slug === undefined || isSlug(slug)
  }, ACCEPTED_FORMS)
  .transform(normalize)

export type RepositorySlug = z.infer<typeof repositorySlugSchema>
