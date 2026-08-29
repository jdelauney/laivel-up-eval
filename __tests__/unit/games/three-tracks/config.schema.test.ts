import { describe, expect, it } from 'vitest'
import { threeTracksConfigSchema } from '@/games/three-tracks/schema/config.schema'

const track = (id: string, work: number) => ({
  id,
  label: id,
  brief: `chantier ${id}`,
  work,
})

const validConfig = () => ({
  turns: 5,
  attentionPerTurn: 3,
  maxPerTrack: 2,
  driftAfter: 1,
  diesAfter: 2,
  tracks: [track('a', 3), track('b', 5), track('c', 2), track('d', 10)],
})

const firstIssue = (config: unknown) => {
  const result = threeTracksConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('three-tracks config schema', () => {
  it('accepts a four track config', () => {
    const parsed = threeTracksConfigSchema.parse(validConfig())

    expect(parsed.tracks.map((track) => track.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('rejects a config with fewer than two tracks', () => {
    const config = validConfig()
    config.tracks = [track('solo', 3)]

    expect(firstIssue(config).path).toContain('tracks')
  })

  it('rejects two tracks sharing the same id, naming the field', () => {
    const config = validConfig()
    config.tracks[1] = track('a', 5)

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['tracks', 1, 'id'])
    expect(issue.message).toContain('a')
  })

  it('rejects a per track cap above the attention available each turn', () => {
    const config = validConfig()
    config.maxPerTrack = config.attentionPerTurn + 1

    expect(firstIssue(config).path).toContain('maxPerTrack')
  })

  it('rejects a death threshold that does not strictly follow drift, naming the field', () => {
    const config = validConfig()
    config.driftAfter = 2
    config.diesAfter = 2

    expect(firstIssue(config).path).toContain('diesAfter')
  })

  it('rejects a death threshold lower than the drift threshold', () => {
    const config = validConfig()
    config.driftAfter = 3
    config.diesAfter = 1

    expect(firstIssue(config).path).toContain('diesAfter')
  })

  it('keeps the settings declared by the author, never a constant', () => {
    const config = validConfig()
    config.turns = 12
    config.attentionPerTurn = 7

    const parsed = threeTracksConfigSchema.parse(config)
    expect(parsed.turns).toBe(12)
    expect(parsed.attentionPerTurn).toBe(7)
  })
})
