// src/writers/http-writer.test.ts
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { createHttpWriter } from './http-writer.ts'

describe('createHttpWriter', () => {
  let server: http.Server
  let port: number
  let received: string[]

  beforeEach(async () => {
    received = []
    server = http.createServer((req, res) => {
      let body = ''
      req.on('data', (c) => { body += c })
      req.on('end', () => { received.push(body); res.writeHead(200); res.end() })
    })
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => {
      port = (server.address() as any).port; r()
    }))
  })

  afterEach(async () => {
    await new Promise<void>((r) => server.close(() => r()))
  })

  it('always reports session active', () => {
    const writer = createHttpWriter(`http://127.0.0.1:${port}`)
    assert.equal(writer.isSessionActive(), true)
  })

  it('batches and flushes events', async () => {
    const writer = createHttpWriter(`http://127.0.0.1:${port}`)
    writer.writeEvent('t-1', { type: 'trace:start', id: 't-1', ts: 1000 })
    writer.writeEvent('t-1', { type: 'trace:end', id: 't-1', ts: 1050 })
    await writer.flush()
    assert.equal(received.length, 1)
    assert.equal(received[0].trim().split('\n').length, 2)
  })

  it('auto-flushes on trace:end', async () => {
    const writer = createHttpWriter(`http://127.0.0.1:${port}`)
    writer.writeEvent('t-1', { type: 'trace:start', id: 't-1', ts: 1000 })
    writer.writeEvent('t-1', { type: 'trace:end', id: 't-1', ts: 1050 })
    await new Promise((r) => setTimeout(r, 200))
    assert.ok(received.length >= 1)
  })

  it('warns once when server not reachable', async () => {
    const writer = createHttpWriter('http://127.0.0.1:1') // unreachable port
    const warnings: string[] = []
    const origWarn = console.warn
    console.warn = (msg: string) => warnings.push(msg)
    writer.writeEvent('t-1', { type: 'trace:end', id: 't-1', ts: 1000 })
    await writer.flush()
    writer.writeEvent('t-2', { type: 'trace:end', id: 't-2', ts: 2000 })
    await writer.flush()
    console.warn = origWarn
    assert.equal(warnings.length, 1) // warned only once
    assert.ok(warnings[0].includes('trace-ai'))
  })
})
