// src/readers/ndjson-reader.test.ts
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createNdjsonReader } from './ndjson-reader.ts'

describe('createNdjsonReader', () => {
  let testDir: string
  let logDir: string

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'trace-ai-reader-'))
    logDir = join(testDir, '.trace-ai-logs')
    mkdirSync(logDir)
  })

  afterEach(() => { rmSync(testDir, { recursive: true }) })

  function writeTrace(id: string, events: object[]) {
    writeFileSync(join(logDir, `${id}.ndjson`), events.map((e) => JSON.stringify(e)).join('\n') + '\n')
  }

  it('lists traces', async () => {
    writeTrace('api-1', [
      { type: 'trace:start', id: 'api-1', name: 'api', ts: 1000 },
      { type: 'trace:end', id: 'api-1', duration: 50, status: 'ok', ts: 1050 },
    ])
    const traces = await createNdjsonReader(logDir).listTraces()
    assert.equal(traces.length, 1)
    assert.equal(traces[0].name, 'api')
  })

  it('filters by errors', async () => {
    writeTrace('ok-1', [
      { type: 'trace:start', id: 'ok-1', name: 'ok', ts: 1000 },
      { type: 'trace:end', id: 'ok-1', duration: 10, status: 'ok', ts: 1010 },
    ])
    writeTrace('err-1', [
      { type: 'trace:start', id: 'err-1', name: 'err', ts: 2000 },
      { type: 'trace:end', id: 'err-1', duration: 10, status: 'error', error: { message: 'fail' }, ts: 2010 },
    ])
    const traces = await createNdjsonReader(logDir).listTraces({ errors: true })
    assert.equal(traces.length, 1)
    assert.equal(traces[0].id, 'err-1')
  })

  it('reads full trace tree', async () => {
    writeTrace('t-1', [
      { type: 'trace:start', id: 't-1', name: 'test', ts: 1000 },
      { type: 'span:start', id: 's-1', parent: 't-1', name: 'span1', ts: 1010 },
      { type: 'span:end', id: 's-1', duration: 20, status: 'ok', ts: 1030 },
      { type: 'trace:end', id: 't-1', duration: 50, status: 'ok', ts: 1050 },
    ])
    const tree = await createNdjsonReader(logDir).readTrace('t-1')
    assert.equal(tree.children[0].name, 'span1')
  })
})
