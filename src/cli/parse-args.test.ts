// src/cli/parse-args.test.ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseCliArgs } from './parse-args.ts'

describe('parseCliArgs', () => {
  it('parses command', () => {
    assert.equal(parseCliArgs(['start']).command, 'start')
  })

  it('parses show with ID', () => {
    const r = parseCliArgs(['show', 'api-abc'])
    assert.equal(r.command, 'show')
    assert.equal(r.id, 'api-abc')
  })

  it('parses flags and options', () => {
    const r = parseCliArgs(['list', '--errors', '--name', 'api*', '--last', '5'])
    assert.equal(r.options.errors, true)
    assert.equal(r.options.name, 'api*')
    assert.equal(r.options.last, '5')
  })

  it('defaults to help', () => {
    assert.equal(parseCliArgs([]).command, 'help')
  })
})
