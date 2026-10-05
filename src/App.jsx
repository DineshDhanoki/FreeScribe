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

function App() {
  const [file, setFile] = useState(null)
  const [audioStream, setAudioStream] = useState(null)
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
          setFile(null)
          setAudioStream(null)
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
    <div className='flex flex-col max-w-[1000px] mx-auto w-full'>
      <section className='min-h-screen flex flex-col'>
        <Header onSelectProject={handleSelectProject} onNewProject={handleAudioReset} />
        {transcription.status === TranscriptionStatus.ERROR ? (
          <main className='flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center'>
            <h1 className='font-semibold text-4xl'>Something went wrong</h1>
            <p className='text-slate-500'>{transcription.error}</p>
            <div className='flex flex-wrap justify-center gap-3'>
              {isAudioAvailable && <button onClick={handleFormSubmission} className='specialBtn px-3 py-2 rounded-lg text-blue-400'>Retry transcription</button>}
              <button onClick={handleAudioReset} className='rounded-lg px-3 py-2 text-slate-500 hover:text-blue-600'>Choose another file</button>
            </div>
          </main>
        ) : transcription.output ? (
          <Information output={transcription.output} finished={transcription.status === TranscriptionStatus.SUCCESS} metrics={transcription.metrics} initialTranslation={transcription.translation} initialTranslationLanguage={transcription.translationLanguageId} sourceLanguage={getTranscriptionLanguage(languageId === 'auto' ? 'en' : languageId)} languageConfidence={transcription.languageConfidence} languageWasDetected={transcription.detectedLanguageId !== null} modelId={modelId} />
        ) : [TranscriptionStatus.DECODING, TranscriptionStatus.DOWNLOADING, TranscriptionStatus.TRANSCRIBING].includes(transcription.status) ? (
          <Transcribing status={transcription.status} phase={transcription.phase} downloading={transcription.status === TranscriptionStatus.DOWNLOADING} progress={transcription.progress} onCancel={handleCancel} />
        ) : isAudioAvailable ? (
          <FileDisplay handleFormSubmission={handleFormSubmission} handleAudioReset={handleAudioReset} file={file} audioStream={audioStream} modelId={modelId} setModelId={setModelId} languageId={languageId} setLanguageId={setLanguageId} />
        ) : (
          <HomePage setFile={setFile} setAudioStream={setAudioStream} />
        )}
      </section>
      <footer></footer>
    </div>
  )
}

export default App
