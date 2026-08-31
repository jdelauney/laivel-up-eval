import { describe, expect, it } from 'vitest'
import {
  parseAmbiguityScanTrace,
  UnknownSegmentError,
} from '@/games/ambiguity-scan/schema/answer.schema'
import {
  type AmbiguityScanConfig,
  ambiguityScanConfigSchema,
} from '@/games/ambiguity-scan/schema/config.schema'

const segment = (id: string, ambiguous: boolean) => ({
  id,
  text: `Texte de ${id}.`,
  ambiguous,
  ...(ambiguous ? { reading: `Lecture de ${id}.` } : {}),
})

const config: AmbiguityScanConfig = ambiguityScanConfigSchema.parse({
  statement: 'Consigne de test.',
  promptTitle: 'Titre du prompt',
  segments: [
    segment('s1', false),
    segment('s2', false),
    segment('s3', true),
    segment('s4', true),
    segment('s5', true),
    segment('s6', false),
  ],
})

describe('ambiguity-scan answer schema', () => {
  it('accepts an empty trace, no segment flagged', () => {
    const trace = parseAmbiguityScanTrace({ flaggedIds: [] }, config)

    expect(trace.flaggedIds).toEqual([])
  })

  it('accepts a trace flagging a subset of known segments', () => {
    const trace = parseAmbiguityScanTrace({ flaggedIds: ['s3', 's4'] }, config)

    expect(trace.flaggedIds).toEqual(['s3', 's4'])
  })

  it('rejects a trace flagging the same segment twice', () => {
    const call = () =>
      parseAmbiguityScanTrace({ flaggedIds: ['s3', 's3'] }, config)

    expect(call).toThrow()
  })

  it('rejects a flag aiming at a segment absent from the configuration, naming it with UnknownSegmentError', () => {
    const call = () =>
      parseAmbiguityScanTrace({ flaggedIds: ['introuvable'] }, config)

    expect(call).toThrow(UnknownSegmentError)
    expect(call).toThrow('introuvable')
  })
})
