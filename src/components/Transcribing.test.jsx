import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Transcribing from './Transcribing'

describe('transcription progress messaging', () => {
  it('distinguishes audio decoding from local inference', () => {
    const { rerender } = render(<Transcribing status='decoding' onCancel={() => {}} />)
    expect(screen.getByText('Preparing your audio locally')).toBeInTheDocument()

    rerender(<Transcribing status='transcribing' onCancel={() => {}} />)
    expect(screen.getByText('Transcribing your audio locally')).toBeInTheDocument()
  })

  it('explains the first model download', () => {
    render(<Transcribing status='downloading' downloading progress={25} model={{ label: 'Whisper Base Multilingual', approximateSize: '145 MB' }} onCancel={() => {}} />)
    expect(screen.getByText(/cached for faster future runs/i)).toBeInTheDocument()
    expect(screen.getByText(/approximately 145 MB/i)).toBeInTheDocument()
  })
})
