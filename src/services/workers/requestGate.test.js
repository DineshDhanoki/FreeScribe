import { describe, expect, it } from 'vitest'
import { createRequestGate } from './requestGate'

describe('request gate', () => {
  it('invalidates cancelled generations and accepts only the latest request', () => {
    const gate = createRequestGate()
    const firstRequest = gate.begin()
    expect(gate.isActive(firstRequest)).toBe(true)

    gate.invalidate()
    expect(gate.isActive(firstRequest)).toBe(false)

    const secondRequest = gate.begin()
    expect(secondRequest).not.toBe(firstRequest)
    expect(gate.isActive(secondRequest)).toBe(true)
    expect(gate.isActive(firstRequest)).toBe(false)
  })
})
