// src/core/handle.test.ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHandle, createNoopHandle } from './handle.ts'
import type { Writer, TraceEvent, IdGenerator, Clock } from '../types.ts'

function createMemoryWriter(): Writer & { events: Map<string, TraceEvent[]> } {
  const events = new Map<string, TraceEvent[]>()
  return {
    events,
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

function createFakeClock(start = 1000): Clock & { advance(ms: number): void } {
  let t = start
  return { now: () => t, advance: (ms: number) => { t += ms } }
}

describe('createHandle', () => {
  it('checkpoint writes event with correct parent', () => {
    const writer = createMemoryWriter()
    const h = createHandle({ writer, idGenerator: createSeqId(), clock: createFakeClock() }, 't-1', 't-1')
    h.checkpoint('data', { x: 1 })
    const events = writer.events.get('t-1')!
    assert.equal(events.length, 1)
    assert.equal(events[0].type, 'checkpoint')
    assert.equal(events[0].parent, 't-1')
    assert.equal(events[0].name, 'data')
    assert.deepEqual(events[0].data, { x: 1 })
  })

  it('span writes start/end and creates child handle', async () => {
    const writer = createMemoryWriter()
    const clock = createFakeClock()
    const h = createHandle({ writer, idGenerator: createSeqId(), clock }, 't-1', 't-1')
    await h.span('db-query', async (s) => {
      clock.advance(25)
      s.checkpoint('result', { rows: 5 })
    })
    const events = writer.events.get('t-1')!
    assert.equal(events.length, 3) // span:start, checkpoint, span:end
    assert.equal(events[0].type, 'span:start')
    assert.equal(events[0].parent, 't-1')
    assert.equal(events[1].type, 'checkpoint')
    assert.equal(events[1].parent, 's-000001') // parented to span
    assert.equal(events[2].type, 'span:end')
    assert.equal(events[2].duration, 25)
    assert.equal(events[2].status, 'ok')
  })

  it('span records error and re-throws', async () => {
    const writer = createMemoryWriter()
    const h = createHandle({ writer, idGenerator: createSeqId(), clock: createFakeClock() }, 't-1', 't-1')
    await assert.rejects(
      () => h.span('fail', async () => { throw new Error('boom') }),
      { message: 'boom' }
    )
    const events = writer.events.get('t-1')!
    const end = events[events.length - 1]
    assert.equal(end.status, 'error')
    assert.equal((end.error as any).message, 'boom')
  })

  it('nested spans create correct parent chain', async () => {
    const writer = createMemoryWriter()
    const h = createHandle({ writer, idGenerator: createSeqId(), clock: createFakeClock() }, 't-1', 't-1')
    await h.span('outer', async (s) => {
      await s.span('inner', async (s2) => {
        s2.checkpoint('deep', {})
      })
    })
    const events = writer.events.get('t-1')!
    const outerStart = events.find((e) => e.name === 'outer')!
    const innerStart = events.find((e) => e.name === 'inner')!
    const cp = events.find((e) => e.name === 'deep')!
    assert.equal(outerStart.parent, 't-1')
    assert.equal(innerStart.parent, 's-000001')
    assert.equal(cp.parent, 's-000002')
  })

  it('span returns callback result', async () => {
    const h = createHandle(
      { writer: createMemoryWriter(), idGenerator: createSeqId(), clock: createFakeClock() },
      't-1', 't-1'
    )
    const result = await h.span('q', async () => [1, 2, 3])
    assert.deepEqual(result, [1, 2, 3])
  })
})

describe('createNoopHandle', () => {
  it('runs callbacks without writing events', async () => {
    const h = createNoopHandle()
    let ran = false
    await h.span('test', async (s) => {
      s.checkpoint('data', {})
      ran = true
    })
    assert.equal(ran, true)
  })
})
