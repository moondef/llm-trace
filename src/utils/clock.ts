import type { Clock } from '../types.ts'

export function createSystemClock(): Clock {
  return {
    now(): number {
      return Date.now()
    },
  }
}
