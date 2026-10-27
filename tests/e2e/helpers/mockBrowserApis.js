export async function mockBrowserApis(page, options = {}) {
  const {
    permission = 'granted',
    recordingSupported = true,
    pauseTranscriptionAtDownload = false,
  } = options

  await page.addInitScript(({ permission, recordingSupported, pauseTranscriptionAtDownload }) => {
    // 1. Microphone mock
    window.__microphoneStopped = false

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          if (permission === 'denied') {
            throw new DOMException(
              'Permission denied',
              'NotAllowedError'
            )
          }

          return {
            getTracks: () => [{
              stop: () => {
                window.__microphoneStopped = true
              },
            }],
          }
        },
      },
    })

    // 2. MediaRecorder mock
    class MockMediaRecorder {
      constructor(stream, options = {}) {
        this.stream = stream
        this.mimeType = options.mimeType || 'audio/webm'
        this.state = 'inactive'
      }

      static isTypeSupported() {
        return recordingSupported
      }

      start() {
        this.state = 'recording'
      }

      stop() {
        this.state = 'inactive'
        this.ondataavailable?.({
          data: new Blob(['synthetic recording'], {
            type: this.mimeType,
          }),
        })
        this.onstop?.()
      }
    }

    window.MediaRecorder = MockMediaRecorder

    // 3. AudioContext mock
    class MockAudioContext {
      async decodeAudioData() {
        return {
          duration: 1,
          sampleRate: 16000,
          length: 16000,
          numberOfChannels: 1,
          getChannelData: () => new Float32Array(16000),
        }
      }

      async close() {}
    }

    window.AudioContext = MockAudioContext

    // 4. Whisper / NLLB Worker mock
    class MockWorker {
      constructor(url) {
        this.isTranslation = String(url).includes(
          'translate.worker'
        )
        this.listeners = new Map()
        if (!this.isTranslation) window.__transcriptionWorker = this
      }

      addEventListener(type, listener) {
        if (!this.listeners.has(type)) {
          this.listeners.set(type, new Set())
        }
        this.listeners.get(type).add(listener)
      }

      removeEventListener(type, listener) {
        this.listeners.get(type)?.delete(listener)
      }

      emit(data) {
        this.listeners.get('message')?.forEach((listener) => {
          listener({ data })
        })
      }

      postMessage(message) {
        if (message.type === 'CANCEL') return

        if (!this.isTranslation &&
            message.type === 'INFERENCE_REQUEST') {
          queueMicrotask(() => {
            if (pauseTranscriptionAtDownload) {
              this.emit({ type: 'DOWNLOADING', progress: 37 })
              return
            }
            this.emit({ type: 'LOADING', status: 'ready' })
            this.emit({
              type: 'RESULT',
              results: [{
                index: 0,
                text: 'Synthetic mobile transcript',
                start: 0,
                end: 1,
              }],
            })
            this.emit({ type: 'INFERENCE_DONE' })
          })
        }

        if (this.isTranslation && message.text) {
          queueMicrotask(() => {
            this.emit({
              type: 'TRANSLATION_UPDATE',
              output: 'Transcription mobile synthétique',
            })
            this.emit({
              type: 'TRANSLATION_COMPLETE',
              output: 'Transcription mobile synthétique',
            })
          })
        }
      }

      terminate() {
        this.listeners.clear()
      }
    }

    window.Worker = MockWorker
  }, { permission, recordingSupported, pauseTranscriptionAtDownload })
}
