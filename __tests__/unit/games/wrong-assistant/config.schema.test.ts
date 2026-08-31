import { describe, expect, it } from 'vitest'
import type { ReplyStance } from '@/games/wrong-assistant/schema/config.schema'
import { wrongAssistantConfigSchema } from '@/games/wrong-assistant/schema/config.schema'

/**
 * Un arbre minimal, mais couvrant les deux garde-fous structurels : deux
 * nœuds défectueux (`a`, `c`), trois nœuds sains dont deux de conséquence
 * (`consA`, `consB`), chaque acceptation d'un nœud défectueux menant
 * directement à sa propre conséquence.
 */
const reply = (
  id: string,
  stance: ReplyStance,
  nextId?: string,
  text?: string,
) => ({ id, text: text ?? `Réponse ${id}.`, stance, nextId })

const node = (
  id: string,
  flawed: boolean,
  replies: ReturnType<typeof reply>[],
  extra: { flaw?: string; consequence?: string } = {},
) => ({
  id,
  speaker: 'assistant' as const,
  message: `Message ${id}.`,
  flawed,
  replies,
  ...extra,
})

const validConfig = () => ({
  statement: 'Consigne de test.',
  rootId: 'a',
  nodes: [
    node(
      'a',
      true,
      [
        reply('a-accept', 'accept', 'consA'),
        reply('a-challenge', 'challenge', 'b'),
        reply('a-verify', 'verify', 'b'),
      ],
      { flaw: 'Ce qui cloche en a.' },
    ),
    node('b', false, [
      reply('b-1', 'accept', 'c'),
      reply('b-2', 'challenge', 'c'),
      reply('b-3', 'verify', 'c'),
    ]),
    node(
      'c',
      true,
      [
        reply('c-accept', 'accept', 'consB'),
        reply('c-challenge', 'challenge'),
        reply('c-reformulate', 'reformulate'),
      ],
      { flaw: 'Ce qui cloche en c.' },
    ),
    node(
      'consA',
      false,
      [
        reply('consA-2', 'verify'),
        reply('consA-1', 'accept'),
        reply('consA-3', 'challenge'),
      ],
      { consequence: 'Dommage A.' },
    ),
    node(
      'consB',
      false,
      [
        reply('consB-2', 'challenge'),
        reply('consB-3', 'reformulate'),
        reply('consB-1', 'accept'),
      ],
      { consequence: 'Dommage B.' },
    ),
  ],
})

const firstIssue = (config: unknown) => {
  const result = wrongAssistantConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('wrong-assistant config schema', () => {
  it('accepts the minimal valid tree, two flawed nodes and two consequences', () => {
    const parsed = wrongAssistantConfigSchema.parse(validConfig())

    expect(parsed.nodes).toHaveLength(5)
  })

  it('rejects two nodes sharing the same id, naming the node', () => {
    const config = validConfig()
    config.nodes[1] = { ...config.nodes[1], id: 'a' }

    const issue = firstIssue(config)
    expect(issue.message).toContain('« a »')
  })

  it('rejects two replies sharing the same id within a node, naming both', () => {
    const config = validConfig()
    config.nodes[0].replies[1] = {
      ...config.nodes[0].replies[1],
      id: 'a-accept',
    }

    const issue = firstIssue(config)
    expect(issue.message).toContain('a-accept')
    expect(issue.message).toContain('« a »')
  })

  it('rejects a rootId absent from the tree, naming it', () => {
    const config = validConfig()
    config.rootId = 'introuvable'

    const issue = firstIssue(config)
    expect(issue.message).toContain('introuvable')
  })

  it('rejects a dangling nextId, naming the reply and its target', () => {
    const config = validConfig()
    config.nodes[1].replies[0] = {
      ...config.nodes[1].replies[0],
      nextId: 'nulle-part',
    }

    const issue = firstIssue(config)
    expect(issue.message).toContain('b-1')
    expect(issue.message).toContain('nulle-part')
  })

  it('rejects a cycle reachable from rootId', () => {
    const config = validConfig()
    // consA referme sur `a` : un cycle atteignable depuis la racine.
    config.nodes[3] = node('consA', false, [reply('consA-1', 'accept', 'a')], {
      consequence: 'Dommage A.',
    })

    const issue = firstIssue(config)
    expect(issue.message).toContain('cycle')
  })

  it('rejects a node never reachable from rootId, naming it', () => {
    const config = validConfig()
    config.nodes.push(node('orphelin', false, [reply('orphelin-1', 'accept')]))

    const issue = firstIssue(config)
    expect(issue.message).toContain('orphelin')
    expect(issue.message).toContain('atteignable')
  })

  it('rejects a flawed node with no flaw, naming it', () => {
    const config = validConfig()
    config.nodes[0] = { ...config.nodes[0], flaw: undefined }

    const issue = firstIssue(config)
    expect(issue.message).toContain('défectueux')
    expect(issue.message).toContain('« a »')
  })

  it('rejects a healthy node carrying a flaw, naming it', () => {
    const config = validConfig()
    config.nodes[1] = { ...config.nodes[1], flaw: 'Interdit ici.' }

    const issue = firstIssue(config)
    expect(issue.message).toContain('sain')
    expect(issue.message).toContain('« b »')
  })

  it('rejects a corpus with fewer than two flawed nodes', () => {
    const config = validConfig()
    config.nodes[2] = { ...config.nodes[2], flawed: false, flaw: undefined }
    // `c` accepté doit toujours mener à une conséquence quand il reste
    // défectueux : ici il ne l'est plus, donc la contrainte d'acceptation
    // disparaît avec lui, seul le compte de nœuds défectueux est visé.

    const issue = firstIssue(config)
    expect(issue.message).toContain('nœud(s) défectueux')
  })

  // Un arbre 100 % défectueux entre aussi en conflit avec la garantie de
  // conséquence (une acceptation ne peut jamais terminer la chaîne sans
  // nœud sain qui la referme) : cette mutation produit donc plusieurs
  // refus à la fois, et le test cherche le sien dans l'ensemble plutôt que
  // de supposer sa position.
  it('rejects a corpus with no healthy node', () => {
    const config = {
      statement: 'Consigne de test.',
      rootId: 'a',
      nodes: [
        node(
          'a',
          true,
          [
            reply('a-accept', 'accept'),
            reply('a-challenge', 'challenge'),
            reply('a-verify', 'verify'),
          ],
          { flaw: 'Ce qui cloche en a.' },
        ),
      ],
    }

    const result = wrongAssistantConfigSchema.safeParse(config)
    if (result.success) throw new Error('the config should have been rejected')
    expect(
      result.error.issues.some((issue) => issue.message.includes('nœud sain')),
    ).toBe(true)
  })

  it('rejects a flawed node offering no accept reply', () => {
    const config = validConfig()
    config.nodes[0].replies = [
      reply('a-challenge', 'challenge', 'b'),
      reply('a-verify', 'verify', 'b'),
    ]

    const issue = firstIssue(config)
    expect(issue.message).toContain('aucune réponse `accept`')
  })

  it('rejects a flawed node offering only accept replies', () => {
    const config = validConfig()
    config.nodes[0].replies = [reply('a-accept', 'accept', 'consA')]

    const issue = firstIssue(config)
    expect(issue.message).toContain('hors `accept`')
  })

  it('rejects a flawed node with no verify nor reformulate among its replies', () => {
    const config = validConfig()
    config.nodes[0].replies = [
      reply('a-accept', 'accept', 'consA'),
      reply('a-challenge', 'challenge', 'b'),
    ]

    const issue = firstIssue(config)
    expect(issue.message).toContain('ni `verify` ni `reformulate`')
  })
})

/**
 * Retirer le seul chemin vers une conséquence, ou en détourner un autre,
 * laisse en général un nœud orphelin ailleurs dans l'arbre — un second
 * refus, sur l'atteignabilité, qui n'est pas celui que le test vise. Les
 * quatre tests qui suivent cherchent donc leur message dans l'ensemble des
 * refus plutôt que de supposer sa position.
 */
const hasIssueContaining = (config: unknown, fragment: string): boolean => {
  const result = wrongAssistantConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues.some((issue) => issue.message.includes(fragment))
}

describe('wrong-assistant config schema — consequence guarantees', () => {
  it('rejects a flawed accept reply with no nextId, a dead end with no consequence', () => {
    const config = validConfig()
    config.nodes[0].replies[0] = {
      ...config.nodes[0].replies[0],
      nextId: undefined,
    }

    expect(
      hasIssueContaining(config, 'ne mène à aucun nœud de conséquence'),
    ).toBe(true)
  })

  it('rejects a flawed accept reply leading to a node with no consequence', () => {
    const config = validConfig()
    config.nodes[0].replies[0] = { ...config.nodes[0].replies[0], nextId: 'b' }

    expect(
      hasIssueContaining(config, 'ne mène à aucun nœud de conséquence'),
    ).toBe(true)
  })

  it('rejects a non-accept reply leading directly to a consequence node', () => {
    const config = validConfig()
    config.nodes[0].replies[1] = {
      ...config.nodes[0].replies[1],
      nextId: 'consA',
    }

    expect(hasIssueContaining(config, 'mène au nœud de conséquence')).toBe(true)
  })

  it('rejects a healthy node reply leading directly to a consequence node', () => {
    const config = validConfig()
    config.nodes[1].replies[0] = {
      ...config.nodes[1].replies[0],
      nextId: 'consA',
    }

    expect(hasIssueContaining(config, 'mène au nœud de conséquence')).toBe(true)
  })
})
