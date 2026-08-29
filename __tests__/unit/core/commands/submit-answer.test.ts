import { describe, expect, it } from 'vitest'
import { CommandHistory } from '../../../../src/core/commands/history.command'
import { SubmitAnswerCommand } from '../../../../src/core/commands/submit-answer.command'

const at = (seconds: number) => `2026-01-01T00:00:0${seconds}.000Z` as const

describe('command history', () => {
  it('keeps the commands in submission order', () => {
    const history = new CommandHistory()
    history.push(new SubmitAnswerCommand('g1', { selected: [] }, [], at(0)))
    history.push(new SubmitAnswerCommand('g2', { selected: ['p1'] }, [], at(1)))

    expect(history.entries().map((command) => command.gameId)).toEqual([
      'g1',
      'g2',
    ])
  })

  it('carries the answer, its criterion results and its instant', () => {
    const history = new CommandHistory()
    history.push(
      new SubmitAnswerCommand(
        'g1',
        { selected: ['p1'] },
        [{ criterionId: 'c1', satisfied: true }],
        at(0),
      ),
    )

    const [command] = history.entries()
    expect(command.answer).toEqual({ selected: ['p1'] })
    expect(command.results).toEqual([{ criterionId: 'c1', satisfied: true }])
    expect(command.submittedAt).toBe(at(0))
  })

  it('hands out a copy, so a caller cannot rewrite the trail', () => {
    const history = new CommandHistory()
    history.push(new SubmitAnswerCommand('g1', {}, [], at(0)))

    const entries = history.entries() as SubmitAnswerCommand[]
    entries.push(new SubmitAnswerCommand('forged', {}, [], at(1)))

    expect(history.entries()).toHaveLength(1)
  })

  it('empties on clear, for a session reset', () => {
    const history = new CommandHistory()
    history.push(new SubmitAnswerCommand('g1', {}, [], at(0)))
    history.clear()

    expect(history.entries()).toHaveLength(0)
  })
})
