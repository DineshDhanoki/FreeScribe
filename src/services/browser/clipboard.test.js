import { describe, expect, it, vi } from 'vitest'
import { copyText } from './clipboard'

describe('clipboard service', () => {
  it('uses the modern clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    await copyText('hello')
    expect(writeText).toHaveBeenCalledWith('hello')
  })
})

