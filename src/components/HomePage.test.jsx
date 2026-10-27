import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage'

describe('HomePage recording flow', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('collects recorded chunks, creates an audio Blob, and releases the stream', async () => {
    const stopTrack = vi.fn()
    const stream = { getTracks: () => [{ stop: stopTrack }] }
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })

    class FakeMediaRecorder {
      static isTypeSupported = () => true
      state = 'inactive'
      start() { this.state = 'recording' }
      stop() {
        this.state = 'inactive'
        this.ondataavailable?.({ data: new Blob(['recorded audio'], { type: 'audio/webm' }) })
        this.onstop?.()
      }
    }
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder)

    const setAudioStream = vi.fn()
    render(<HomePage setAudioStream={setAudioStream} setFile={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Start recording' }))
    await screen.findByRole('button', { name: 'Stop recording' })
    fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true, video: false })
    expect(setAudioStream).toHaveBeenCalledWith(expect.any(Blob))
    expect(setAudioStream.mock.calls[0][0].size).toBeGreaterThan(0)
    expect(stopTrack).toHaveBeenCalled()
  })

  it('shows the recording safety limit', () => {
    render(<HomePage setAudioStream={vi.fn()} setFile={vi.fn()} />)
    expect(screen.getByText('Recordings are limited to 30 minutes and 200 MB.')).toBeInTheDocument()
  })

  it('keeps a recorder failure visible instead of opening an empty audio review', async () => {
    const stopTrack = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) },
    })

    class FailingMediaRecorder {
      static isTypeSupported = () => true
      static current
      state = 'inactive'
      constructor() { FailingMediaRecorder.current = this }
      start() { this.state = 'recording' }
      stop() {
        this.state = 'inactive'
        this.onstop?.()
      }
    }
    vi.stubGlobal('MediaRecorder', FailingMediaRecorder)

    const setAudioStream = vi.fn()
    render(<HomePage setAudioStream={setAudioStream} setFile={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start recording' }))
    await screen.findByRole('button', { name: 'Stop recording' })
    await act(async () => FailingMediaRecorder.current.onerror?.())

    expect(await screen.findByRole('alert')).toHaveTextContent('The recording failed. Please try again.')
    expect(setAudioStream).not.toHaveBeenCalled()
    expect(stopTrack).toHaveBeenCalled()
  })

  it('exposes an accessible audio upload control', () => {
    render(<HomePage setAudioStream={vi.fn()} setFile={vi.fn()} />)
    expect(screen.getByLabelText('Upload an audio file')).toHaveAttribute('accept', 'audio/*')
  })
})
