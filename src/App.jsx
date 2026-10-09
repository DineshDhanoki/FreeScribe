import { useState, useRef, useEffect, useReducer } from 'react'
import HomePage from './components/HomePage'
import Header from './components/Header'
import FileDisplay from './components/FileDisplay'
import Information from './components/Information'
import Transcribing from './components/Transcribing'
import { MessageTypes } from './utils/presets'
import { decodeAudioFile } from './services/audio/audio'
import { createTranscriptionMetrics, getDeviceCapabilities, getMemorySnapshot, updateModelCacheState } from './services/evaluation/performance'
import { DEFAULT_SPEECH_MODEL, DEFAULT_TRANSCRIPTION_LANGUAGE, getSpeechModel, getTranscriptionLanguage } from './services/models/modelConfig'
import { isTranscriptionWorkerMessage, WorkerMessageType } from './services/workers/protocol'
import { createWorkerClient } from './services/workers/workerClient'
import {
  createInitialTranscriptionState,
  TranscriptionAction,
  TranscriptionStatus,
  transcriptionReducer,
} from './services/transcription/transcriptionState'

function getInitialTheme() {
  try {
    const savedTheme = typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function'
      ? window.localStorage.getItem('freescribe-theme')
      : null
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  } catch {
    // Storage can be unavailable in privacy-restricted browsers and test environments.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [file, setFile] = useState(null)
  const [audioStream, setAudioStream] = useState(null)
  const [newProjectVersion, setNewProjectVersion] = useState(0)
  const [modelId, setModelId] = useState(DEFAULT_SPEECH_MODEL)
  const [languageId, setLanguageId] = useState(DEFAULT_TRANSCRIPTION_LANGUAGE)
  const [transcription, dispatchTranscription] = useReducer(
    transcriptionReducer,
    undefined,
    createInitialTranscriptionState,
  )

  const isAudioAvailable = file || audioStream

  const worker = useRef(null)
  const workerCleanup = useRef(null)
  const createWorkerRef = useRef(null)
  const runMetrics = useRef(null)
  const submissionGeneration = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      if (typeof window.localStorage?.setItem === 'function') window.localStorage.setItem('freescribe-theme', theme)
    } catch {
      // Continue without persistence when browser storage is unavailable.
    }
  }, [theme])

  function stopWorker() {
    workerCleanup.current?.()
    workerCleanup.current = null
    worker.current = null
  }

  function handleAudioReset() {
    submissionGeneration.current += 1
    runMetrics.current = null
    stopWorker()
    setFile(null)
    setAudioStream(null)
    setNewProjectVersion((version) => version + 1)
    dispatchTranscription({ type: TranscriptionAction.RESET })
  }

  function handleCancel() {
    submissionGeneration.current += 1
    runMetrics.current = null
    worker.current?.send({ type: WorkerMessageType.CANCEL })
    stopWorker()
    dispatchTranscription({ type: TranscriptionAction.CANCEL })
  }

  function handleSelectProject(project) {
    submissionGeneration.current += 1
    runMetrics.current = null
    stopWorker()
    setFile(null)
    setAudioStream(null)
    if (project.modelId) setModelId(project.modelId)
    if (project.languageId) setLanguageId(project.languageId)
    dispatchTranscription({
      type: TranscriptionAction.LOAD_PROJECT,
      output: project.segments || [],
      translation: project.translation,
      translationLanguageId: project.translationLanguageId,
      metrics: project.metrics,
    })
  }

  useEffect(() => {
    const onMessageReceived = async (message) => {
      if (!isTranscriptionWorkerMessage(message)) return
      switch (message.type) {
        case WorkerMessageType.DOWNLOADING:
          if (runMetrics.current) runMetrics.current.cacheState = updateModelCacheState(runMetrics.current.cacheState, message)
          dispatchTranscription({
            type: TranscriptionAction.DOWNLOAD_PROGRESS,
            progress: message.progress,
          })
          break;
        case WorkerMessageType.LOADING:
          if (message.status === 'ready') {
            if (runMetrics.current) runMetrics.current.cacheState = updateModelCacheState(runMetrics.current.cacheState, message)
            dispatchTranscription({ type: TranscriptionAction.MODEL_READY })
          }
          break;
        case WorkerMessageType.INFERENCE_PROGRESS:
          dispatchTranscription({ type: TranscriptionAction.INFERENCE_PROGRESS, phase: message.phase })
          break
        case WorkerMessageType.LANGUAGE_DETECTED:
          setLanguageId(message.languageId)
          dispatchTranscription({
            type: TranscriptionAction.LANGUAGE_DETECTED,
            languageId: message.languageId,
            confidence: message.confidence,
          })
          break;
        case WorkerMessageType.RESULT:
          dispatchTranscription({ type: TranscriptionAction.RESULT, output: message.results })
          break;
        case WorkerMessageType.INFERENCE_DONE:
          dispatchTranscription({
            type: TranscriptionAction.COMPLETE,
            metrics: runMetrics.current
              ? createTranscriptionMetrics({
                ...runMetrics.current,
                elapsedMs: performance.now() - runMetrics.current.startedAt,
                capabilities: getDeviceCapabilities(),
                memoryBefore: runMetrics.current.memoryBefore,
                memoryAfter: getMemorySnapshot(),
              })
              : null,
          })
          break;
        case WorkerMessageType.ERROR:
          dispatchTranscription({ type: TranscriptionAction.ERROR, message: message.message })
          break;
      }
    }

    const onWorkerError = () => {
      stopWorker()
      dispatchTranscription({ type: TranscriptionAction.ERROR, message: 'The transcription worker failed. Please try again.' })
    }

    const createWorker = () => {
      if (worker.current) return worker.current
      const rawWorker = new Worker(new URL('./utils/whisper.worker.js', import.meta.url), {
        type: 'module'
      })
      const client = createWorkerClient(rawWorker)
      const unsubscribe = client.subscribe(onMessageReceived)
      const unsubscribeError = client.onError(onWorkerError)
      worker.current = client
      workerCleanup.current = () => {
        unsubscribe()
        unsubscribeError()
        client.terminate()
        if (worker.current === client) worker.current = null
      }
      return client
    }

    createWorkerRef.current = createWorker
    createWorker()

    return () => {
      createWorkerRef.current = null
      stopWorker()
    }
  }, [])

  async function handleFormSubmission() {
    if (!file && !audioStream) { return }

    const generation = submissionGeneration.current + 1
    submissionGeneration.current = generation

    dispatchTranscription({ type: TranscriptionAction.START })

    try {
      const audio = await decodeAudioFile(file ? file : audioStream)
      if (generation !== submissionGeneration.current) return
      const transcriptionWorker = worker.current || createWorkerRef.current?.()
      if (!transcriptionWorker) throw new Error('The transcription worker is unavailable. Please try again.')
      runMetrics.current = {
        startedAt: performance.now(),
        audioSamples: audio.length,
        sampleRate: 16000,
        modelId,
        modelRevision: getSpeechModel(modelId).revision,
        cacheState: 'unknown',
        memoryBefore: getMemorySnapshot(),
      }
      transcriptionWorker.send({
        type: MessageTypes.INFERENCE_REQUEST,
        audio,
        model_name: modelId,
        language: getTranscriptionLanguage(languageId).whisper || undefined,
      }, [audio.buffer])
    } catch (submissionError) {
      if (generation !== submissionGeneration.current) return
      dispatchTranscription({ type: TranscriptionAction.ERROR, message: submissionError.message })
    }
  }

  return (
    <div className='app-shell'>
      <a className='skip-link' href='#main-content'>Skip to main content</a>
      <section id='main-content' className='min-h-screen flex flex-col' tabIndex='-1'>
        <Header
          onSelectProject={handleSelectProject}
          onNewProject={handleAudioReset}
          theme={theme}
          onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
        />
        {transcription.status === TranscriptionStatus.ERROR ? (
          <main className='workspace-wrap'>
            <div className='error-card' role='alert'>
            <span className='error-icon' aria-hidden='true'><i className='fa-solid fa-triangle-exclamation'></i></span>
            <h1 className='text-3xl font-extrabold text-slate-800'>Something went wrong</h1>
            <p className='mx-auto mt-3 max-w-md leading-7 text-slate-500'>{transcription.error}</p>
            <div className='flex flex-wrap justify-center gap-3'>
              {isAudioAvailable && <button onClick={handleFormSubmission} className='btn-primary mt-6'>Retry transcription</button>}
              <button onClick={handleAudioReset} className='btn-ghost mt-6'>Choose another file</button>
            </div>
            </div>
          </main>
        ) : transcription.output ? (
          <Information output={transcription.output} finished={transcription.status === TranscriptionStatus.SUCCESS} metrics={transcription.metrics} initialTranslation={transcription.translation} initialTranslationLanguage={transcription.translationLanguageId} sourceLanguage={getTranscriptionLanguage(languageId === 'auto' ? 'en' : languageId)} languageConfidence={transcription.languageConfidence} languageWasDetected={transcription.detectedLanguageId !== null} modelId={modelId} audioSource={file || audioStream} />
        ) : [TranscriptionStatus.DECODING, TranscriptionStatus.DOWNLOADING, TranscriptionStatus.TRANSCRIBING].includes(transcription.status) ? (
          <Transcribing status={transcription.status} phase={transcription.phase} downloading={transcription.status === TranscriptionStatus.DOWNLOADING} progress={transcription.progress} onCancel={handleCancel} />
        ) : isAudioAvailable ? (
          <FileDisplay handleFormSubmission={handleFormSubmission} handleAudioReset={handleAudioReset} file={file} audioStream={audioStream} modelId={modelId} setModelId={setModelId} languageId={languageId} setLanguageId={setLanguageId} />
        ) : (
          <HomePage setFile={setFile} setAudioStream={setAudioStream} resetVersion={newProjectVersion} />
        )}
      </section>
    </div>
  )
}

export default App
