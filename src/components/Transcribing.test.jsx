import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Transcribing from './Transcribing'

describe('transcription progress messaging', () => {
  it('distinguishes audio decoding from local inference', () => {
    const { rerender } = render(<Transcribing status='decoding' onCancel={() => {}} />)
    expect(screen.getByText('decoding audio locally')).toBeInTheDocument()

    rerender(<Transcribing status='transcribing' onCancel={() => {}} />)
    expect(screen.getByText('transcribing audio locally')).toBeInTheDocument()
  })
})
