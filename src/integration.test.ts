// src/integration.test.ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createTracer } from './core/tracer.ts'
import type { Writer, TraceEvent, IdGenerator, Clock } from './types.ts'

function createMemoryWriter(): Writer & { allEvents(): TraceEvent[] } {
  const events = new Map<string, TraceEvent[]>()
  return {
    allEvents: () => [...events.values()].flat(),
    isSessionActive: () => true,
    writeEvent(traceId: string, event: TraceEvent) {
      if (!events.has(traceId)) events.set(traceId, [])
      events.get(traceId)!.push(event)
    },
  }
}

function createSeqId(): IdGenerator {
  let c = 0
  return { generate: (p: string) => `${p}-${String(++c).padStart(6, '0')}` }
}

describe('integration: full trace lifecycle', () => {
  it('captures complete trace with spans and checkpoints', async () => {
    const writer = createMemoryWriter()
    const { trace } = createTracer({ writer, idGenerator: createSeqId(), clock: { now: Date.now } })

    await trace('api-test', async (t) => {
      t.checkpoint('input', { x: 1 })
      await t.span('process', async (s) => {
        s.checkpoint('step', { y: 2 })
        await s.span('nested', async (n) => {
          n.checkpoint('deep', { z: 3 })
        })
      })
    })

    const events = writer.allEvents()
    assert.equal(events.length, 9)
    assert.equal(events[0].type, 'trace:start')
    assert.equal(events[1].type, 'checkpoint')
    assert.equal(events[2].type, 'span:start')
    assert.equal(events[3].type, 'checkpoint')
    assert.equal(events[4].type, 'span:start')
    assert.equal(events[5].type, 'checkpoint')
    assert.equal(events[6].type, 'span:end')
    assert.equal(events[7].type, 'span:end')
    assert.equal(events[8].type, 'trace:end')
  })

  it('no-ops when inactive and still returns result', async () => {
    const writer = createMemoryWriter()
    const inactive = { ...writer, isSessionActive: () => false }
    const { trace } = createTracer({ writer: inactive, idGenerator: createSeqId(), clock: { now: Date.now } })

    const result = await trace('test', async (t) => {
      t.checkpoint('data', {})
      await t.span('inner', async () => {})
      return 'result'
    })

    assert.equal(result, 'result')
    assert.equal(writer.allEvents().length, 0)
  })

  it('records errors and re-throws', async () => {
    const writer = createMemoryWriter()
    const { trace } = createTracer({ writer, idGenerator: createSeqId(), clock: { now: Date.now } })

    await assert.rejects(
      () => trace('fail', async () => { throw new Error('intentional') }),
      { message: 'intentional' }
    )

    const events = writer.allEvents()
    const end = events[events.length - 1]
    assert.equal(end.status, 'error')
    assert.equal((end.error as any).message, 'intentional')
  })
})
