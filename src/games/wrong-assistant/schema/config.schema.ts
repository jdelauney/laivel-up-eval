import { z } from 'zod'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu : la consigne, et un arbre de
 * dialogue déclaré à plat — des nœuds, chacun listant ses réponses possibles,
 * chaque réponse pointant `nextId` vers le nœud suivant ou ne pointant nulle
 * part quand elle clôt le scénario. Aucun modèle n'est appelé pendant la
 * partie : l'arbre entier est écrit ici, à l'avance — contrainte de l'épique,
 * absolue.
 *
 * `flaw` — ce qui cloche dans un tour défectueux — et `consequence` — le
 * dommage qu'un nœud constate — ne sont montrés qu'à la révélation ou une
 * fois le nœud atteint dans le fil : jamais avant, jamais comme indice.
 */

export const replyStanceValues = [
  'accept',
  'challenge',
  'verify',
  'reformulate',
] as const
export const replyStanceSchema = z.enum(replyStanceValues)
export type ReplyStance = z.infer<typeof replyStanceSchema>

/** Une réponse est corrective quand elle vérifie ou reformule — `challenge` repère sans rien en faire. */
const CORRECTIVE_STANCES: ReadonlySet<ReplyStance> = new Set([
  'verify',
  'reformulate',
])

const replySchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  stance: replyStanceSchema,
  // Absent = fin de scénario : cette réponse ferme le fil.
  nextId: z.string().min(1).optional(),
})

const nodeSchema = z.object({
  id: z.string().min(1),
  speaker: z.literal('assistant'),
  message: z.string().min(1),
  // Ce tour porte-t-il une affirmation fausse ?
  flawed: z.boolean(),
  // Ce qui cloche, montré à la révélation seulement. Réservé aux nœuds défectueux.
  flaw: z.string().min(1).optional(),
  // Le dommage que ce nœud constate, s'il en est un. N'importe quel nœud peut
  // le porter — ce qui compte est qui y mène, pas s'il est lui-même défectueux.
  consequence: z.string().min(1).optional(),
  replies: z.array(replySchema).min(1),
})

const baseConfigSchema = z.object({
  statement: z.string().min(1),
  rootId: z.string().min(1),
  nodes: z.array(nodeSchema).min(1),
})

type Node = z.infer<typeof nodeSchema>

/**
 * Suit la chaîne **forcée** — un nœud sans choix réel, une seule réponse —
 * depuis `nodeId` jusqu'à un nœud portant une `consequence`, ou jusqu'à une
 * impasse (branchement réel avant d'en croiser une, ou fin de scénario).
 * `guard` protège contre un cycle que le refus d'acyclicité, plus bas,
 * empêche déjà normalement : filet de sécurité, pas la vérification
 * principale.
 */
const reachesConsequence = (
  nodeId: string,
  nodesById: ReadonlyMap<string, Node>,
  guard: ReadonlySet<string>,
): boolean => {
  if (guard.has(nodeId)) return false
  const node = nodesById.get(nodeId)
  if (node === undefined) return false
  if (node.consequence !== undefined) return true
  if (node.replies.length !== 1) return false

  const only = node.replies[0]
  if (only.nextId === undefined) return false

  return reachesConsequence(only.nextId, nodesById, new Set([...guard, nodeId]))
}

/**
 * Refus au chargement, plutôt qu'au verdict :
 * - identifiants de nœuds et, au sein d'un même nœud, de réponses uniques ;
 * - `rootId` existant, aucun `nextId` pendant ;
 * - **arbre acyclique et atteignable** : tout nœud est joignable depuis
 *   `rootId`, et aucun chemin ne boucle — un DFS avec pile d'appel détecte
 *   les deux d'un même parcours ;
 * - `flaw` obligatoire sur un nœud défectueux, **interdit** sur un nœud sain ;
 * - au moins deux nœuds défectueux, et au moins un nœud sain — sans quoi
 *   « ne jamais accepter » serait la stratégie gagnante sans lecture ;
 * - **chaque nœud défectueux offre au moins une réponse de chaque camp**,
 *   `accept` et non-`accept`, et au moins une `verify` ou `reformulate` :
 *   sans quoi le choix est forcé et ne mesure rien ;
 * - **toute branche `accept` sur un nœud défectueux mène à un nœud portant
 *   une `consequence`**, directement ou par sa suite obligée — le refus qui
 *   rend mécanique la conséquence d'une acceptation à tort, au lieu de la
 *   confier au corpus ;
 * - **aucune réponse qui n'est pas une acceptation d'un nœud défectueux ne
 *   mène à un nœud portant une `consequence`** : sans quoi la conséquence
 *   cesserait d'être le signal d'une acceptation à tort.
 */
export const wrongAssistantConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    const nodesById = new Map(config.nodes.map((node) => [node.id, node]))

    config.nodes.forEach((node, index) => {
      const firstIndex = config.nodes.findIndex(
        (candidate) => candidate.id === node.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['nodes', index, 'id'],
        message: `le nœud « ${node.id} » est déclaré plusieurs fois`,
      })
    })

    if (!nodesById.has(config.rootId)) {
      context.addIssue({
        code: 'custom',
        path: ['rootId'],
        message: `le nœud racine « ${config.rootId} » est absent de l'arbre`,
      })
    }

    config.nodes.forEach((node, nodeIndex) => {
      node.replies.forEach((reply, replyIndex) => {
        const firstIndex = node.replies.findIndex(
          (candidate) => candidate.id === reply.id,
        )
        if (firstIndex === replyIndex) return

        context.addIssue({
          code: 'custom',
          path: ['nodes', nodeIndex, 'replies', replyIndex, 'id'],
          message: `la réponse « ${reply.id} » est déclarée plusieurs fois dans le nœud « ${node.id} »`,
        })
      })

      node.replies.forEach((reply, replyIndex) => {
        if (reply.nextId === undefined) return
        if (nodesById.has(reply.nextId)) return

        context.addIssue({
          code: 'custom',
          path: ['nodes', nodeIndex, 'replies', replyIndex, 'nextId'],
          message: `la réponse « ${reply.id} » du nœud « ${node.id} » vise le nœud « ${reply.nextId} », absent de l'arbre`,
        })
      })

      if (node.flawed && node.flaw === undefined) {
        context.addIssue({
          code: 'custom',
          path: ['nodes', nodeIndex, 'flaw'],
          message: `le nœud défectueux « ${node.id} » ne porte pas de \`flaw\``,
        })
      }
      if (!node.flawed && node.flaw !== undefined) {
        context.addIssue({
          code: 'custom',
          path: ['nodes', nodeIndex, 'flaw'],
          message: `le nœud sain « ${node.id} » porte un \`flaw\`, réservé aux nœuds défectueux`,
        })
      }

      if (node.flawed) {
        const hasAccept = node.replies.some(
          (reply) => reply.stance === 'accept',
        )
        const hasNonAccept = node.replies.some(
          (reply) => reply.stance !== 'accept',
        )
        const hasCorrective = node.replies.some((reply) =>
          CORRECTIVE_STANCES.has(reply.stance),
        )

        if (!hasAccept) {
          context.addIssue({
            code: 'custom',
            path: ['nodes', nodeIndex, 'replies'],
            message: `le nœud défectueux « ${node.id} » n'offre aucune réponse \`accept\``,
          })
        }
        if (!hasNonAccept) {
          context.addIssue({
            code: 'custom',
            path: ['nodes', nodeIndex, 'replies'],
            message: `le nœud défectueux « ${node.id} » n'offre aucune réponse hors \`accept\``,
          })
        }
        if (!hasCorrective) {
          context.addIssue({
            code: 'custom',
            path: ['nodes', nodeIndex, 'replies'],
            message: `le nœud défectueux « ${node.id} » n'offre ni \`verify\` ni \`reformulate\``,
          })
        }
      }
    })

    if (nodesById.has(config.rootId)) {
      const visited = new Set<string>()
      const onStack = new Set<string>()
      let cyclic = false

      const visit = (nodeId: string): void => {
        if (onStack.has(nodeId)) {
          cyclic = true
          return
        }
        if (visited.has(nodeId)) return

        visited.add(nodeId)
        onStack.add(nodeId)
        nodesById.get(nodeId)?.replies.forEach((reply) => {
          if (reply.nextId !== undefined && nodesById.has(reply.nextId)) {
            visit(reply.nextId)
          }
        })
        onStack.delete(nodeId)
      }
      visit(config.rootId)

      if (cyclic) {
        context.addIssue({
          code: 'custom',
          path: ['nodes'],
          message: `l'arbre porte un cycle, atteignable depuis « ${config.rootId} »`,
        })
      }

      config.nodes.forEach((node, index) => {
        if (visited.has(node.id)) return

        context.addIssue({
          code: 'custom',
          path: ['nodes', index, 'id'],
          message: `le nœud « ${node.id} » n'est jamais atteignable depuis « ${config.rootId} »`,
        })
      })
    }

    const flawedCount = config.nodes.filter((node) => node.flawed).length
    const healthyCount = config.nodes.length - flawedCount

    if (flawedCount < 2) {
      context.addIssue({
        code: 'custom',
        path: ['nodes'],
        message: `${flawedCount} nœud(s) défectueux déclaré(s), au moins 2 requis`,
      })
    }
    if (healthyCount < 1) {
      context.addIssue({
        code: 'custom',
        path: ['nodes'],
        message: 'aucun nœud sain déclaré, au moins 1 requis',
      })
    }

    config.nodes.forEach((node, nodeIndex) => {
      node.replies.forEach((reply, replyIndex) => {
        const isFlawedAccept = node.flawed && reply.stance === 'accept'

        if (isFlawedAccept) {
          const reaches =
            reply.nextId !== undefined &&
            reachesConsequence(reply.nextId, nodesById, new Set())
          if (!reaches) {
            context.addIssue({
              code: 'custom',
              path: ['nodes', nodeIndex, 'replies', replyIndex, 'nextId'],
              message: `l'acceptation « ${reply.id} » du nœud défectueux « ${node.id} » ne mène à aucun nœud de conséquence`,
            })
          }
        }

        if (reply.nextId === undefined) return
        const target = nodesById.get(reply.nextId)
        if (target === undefined) return

        if (target.consequence !== undefined && !isFlawedAccept) {
          context.addIssue({
            code: 'custom',
            path: ['nodes', nodeIndex, 'replies', replyIndex, 'nextId'],
            message: `la réponse « ${reply.id} » du nœud « ${node.id} » mène au nœud de conséquence « ${target.id} » sans être l'acceptation d'un nœud défectueux`,
          })
        }
      })
    })
  },
)

export type Reply = z.infer<typeof replySchema>
export type WrongAssistantNode = z.infer<typeof nodeSchema>
export type WrongAssistantConfig = z.infer<typeof wrongAssistantConfigSchema>
