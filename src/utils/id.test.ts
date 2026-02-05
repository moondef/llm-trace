// src/utils/id.test.ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createCryptoIdGenerator } from './id.ts'

describe('createCryptoIdGenerator', () => {
  it('generates ID with given prefix', () => {
    const gen = createCryptoIdGenerator()
    const id = gen.generate('api-users')
    assert.ok(id.startsWith('api-users-'))
  })

  it('generates 6-char random suffix', () => {
    const gen = createCryptoIdGenerator()
    const id = gen.generate('test')
    const suffix = id.slice('test-'.length)
    assert.equal(suffix.length, 6)
  })

  it('generates unique IDs', () => {
    const gen = createCryptoIdGenerator()
    const ids = new Set(Array.from({ length: 100 }, () => gen.generate('t')))
    assert.equal(ids.size, 100)
  })
})
