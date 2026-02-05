import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { stopSession } from './stop.ts'

describe('stopSession', () => {
  let testDir: string
  beforeEach(() => { testDir = mkdtempSync(join(tmpdir(), 'trace-ai-stop-')) })
  afterEach(() => { rmSync(testDir, { recursive: true }) })

  it('deletes .trace-ai-logs', async () => {
    mkdirSync(join(testDir, '.trace-ai-logs'))
    const r = await stopSession(testDir)
    assert.equal(r.stopped, true)
    assert.equal(existsSync(join(testDir, '.trace-ai-logs')), false)
  })

  it('reports no session', async () => {
    const r = await stopSession(testDir)
    assert.equal(r.noSession, true)
  })
})
