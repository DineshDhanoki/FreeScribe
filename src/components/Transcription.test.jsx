import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Transcription from './Transcription'

describe('Transcription component', () => {
  it('renders accessible editable segments', () => {
    const onSegmentChange = vi.fn()
    render(<Transcription
      segments={[{ index: 0, text: 'Hello world', start: 1.25 }]}
      onSegmentChange={onSegmentChange}
    />)

    const editor = screen.getByRole('textbox', { name: 'Transcript segment 1' })
    expect(editor).toHaveValue('Hello world')
    fireEvent.change(editor, { target: { value: 'Edited text' } })
    expect(onSegmentChange).toHaveBeenCalledWith(0, 'Edited text')
  })
})

