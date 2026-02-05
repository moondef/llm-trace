// src/cli/formatter.test.ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatTraceList, formatTraceTree } from './formatter.ts'

describe('formatTraceList', () => {
  it('outputs JSON by default', () => {
    const traces = [{ id: 'api-1', name: 'api', status: 'ok' as const, duration: 50, spans: 3, ts: 1000 }]
    assert.equal(JSON.parse(formatTraceList(traces, false))[0].id, 'api-1')
  })

  it('outputs human-readable with flag', () => {
    const traces = [{ id: 'api-1', name: 'api', status: 'ok' as const, duration: 50, spans: 3, ts: 1000 }]
    const output = formatTraceList(traces, true)
    assert.ok(output.includes('api-1'))
    assert.ok(output.includes('50ms'))
  })
})

describe('formatTraceTree', () => {
  it('outputs JSON by default', () => {
    const tree = { type: 'trace' as const, name: 'test', status: 'ok' as const, duration: 100, ts: 1000, children: [] }
    assert.equal(JSON.parse(formatTraceTree(tree, false)).name, 'test')
  })
})
