import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Transcription from './Transcription'
import Translation from './Translation'
import { hasLikelyHallucination, normalizeSegments, serializeTranscript, transcriptToText } from '../services/transcription/transcript'
import { saveProject } from '../services/storage/projectStore'
import { copyText } from '../services/browser/clipboard'
import { createWorkerClient } from '../services/workers/workerClient'
import { createPerformanceExport } from '../services/evaluation/export'
import { isTranslationWorkerMessage, TranslationMessageType, WorkerMessageType } from '../services/workers/protocol'

export default function Information(props) {
    const { output, finished, metrics, initialTranslation, initialTranslationLanguage, sourceLanguage, languageConfidence, languageWasDetected, modelId, audioSource } = props
    const [tab, setTab] = useState('transcription')
    const [segments, setSegments] = useState(() => normalizeSegments(output))
    const [translation, setTranslation] = useState(initialTranslation || null)
    const [toLanguage, setToLanguage] = useState(initialTranslationLanguage || 'Select language')
    const [translating, setTranslating] = useState(null)
    const [translationProgress, setTranslationProgress] = useState(null)
    const [translationError, setTranslationError] = useState(null)
    const [saveState, setSaveState] = useState('idle')
    const [copyState, setCopyState] = useState('idle')
    const [benchmarkExportState, setBenchmarkExportState] = useState('idle')
    const [audioUrl, setAudioUrl] = useState(null)
    const [activeSegmentIndex, setActiveSegmentIndex] = useState(null)
    const projectId = useRef(null)
    const translationActive = useRef(false)
    const audioRef = useRef(null)

    useEffect(() => {
        if (!audioSource) {
            setAudioUrl(null)
            return undefined
        }
        const nextAudioUrl = URL.createObjectURL(audioSource)
        setAudioUrl(nextAudioUrl)
        return () => URL.revokeObjectURL(nextAudioUrl)
    }, [audioSource])
    useEffect(() => {
        setSegments(normalizeSegments(output))
        setTranslation(initialTranslation || null)
        setToLanguage(initialTranslationLanguage || 'Select language')
        projectId.current = null
        setSaveState('idle')
    }, [output, initialTranslation, initialTranslationLanguage])

    const worker = useRef()

    useEffect(() => {
        if (!worker.current) {
            const rawWorker = new Worker(new URL('../utils/translate.worker.js', import.meta.url), {
                type: 'module'
            })
            worker.current = createWorkerClient(rawWorker)
        }

        const onMessageReceived = (message) => {
            if (!isTranslationWorkerMessage(message)) return
            switch (message.type) {
                case TranslationMessageType.INITIATE:
                    setTranslationProgress(null)
                    break;
                case TranslationMessageType.PROGRESS:
                    setTranslationProgress(message.progress)
                    break;
                case TranslationMessageType.UPDATE:
                    if (translationActive.current) setTranslation(message.output)
                    break;
                case TranslationMessageType.COMPLETE:
                    if (translationActive.current) {
                        translationActive.current = false
                        setTranslating(false)
                        setTranslationProgress(null)
                    }
                    break;
                case TranslationMessageType.ERROR:
                    if (translationActive.current) {
                        translationActive.current = false
                        setTranslating(false)
                        setTranslationProgress(null)
                        setTranslationError(message.message || 'Translation failed.')
                    }
                    break;
            }
        }

        const onWorkerError = () => {
            translationActive.current = false
            setTranslating(false)
            setTranslationError('The translation worker failed. Please try again.')
        }

        const unsubscribe = worker.current.subscribe(onMessageReceived)
        const unsubscribeError = worker.current.onError(onWorkerError)

        return () => {
            translationActive.current = false
            unsubscribe()
            unsubscribeError()
            worker.current?.send({ type: WorkerMessageType.CANCEL })
            worker.current?.terminate()
            worker.current = null
        }
    }, [])

    const transcriptText = transcriptToText(segments)
    const transcriptLooksUnreliable = hasLikelyHallucination(segments)
    const textElement = tab === 'transcription' ? transcriptText : translation || ''

    function handleSegmentChange(index, text) {
        if (translationActive.current) {
            translationActive.current = false
            worker.current?.send({ type: WorkerMessageType.CANCEL })
            setTranslating(false)
        }
        setSegments((current) => current.map((segment, segmentIndex) => (
            segmentIndex === index ? { ...segment, text } : segment
        )))
        setTranslation(null)
        setTranslationError(null)
    }

    function handleAudioTimeUpdate(event) {
        const currentTime = event.currentTarget.currentTime
        const nextIndex = segments.findIndex((segment, index) => {
            const nextSegment = segments[index + 1]
            const end = segment.end ?? nextSegment?.start ?? Number.POSITIVE_INFINITY
            return currentTime >= segment.start && currentTime < end
        })
        setActiveSegmentIndex(nextIndex === -1 ? null : nextIndex)
    }

    function handleSegmentSeek(index) {
        const segment = segments[index]
        if (!audioRef.current || !segment) return
        audioRef.current.currentTime = segment.start
        audioRef.current.play().catch(() => {})
    }

    async function handleCopy() {
        try {
            await copyText(textElement)
            setCopyState('copied')
        } catch (error) {
            console.error(error)
            setCopyState('error')
        }
    }

    async function handleSaveProject() {
        setSaveState('saving')
        try {
            const saved = await saveProject({
                id: projectId.current,
                name: segments[0]?.text?.slice(0, 40) || 'Untitled transcript',
                segments,
                translation,
                translationLanguageId: toLanguage === 'Select language' ? null : toLanguage,
                modelId,
                languageId: sourceLanguage.id,
                metrics,
            })
            projectId.current = saved.id
            setSaveState('saved')
        } catch (error) {
            console.error(error)
            setSaveState('error')
        }
    }

    function handleDownload() {
        const format = document.getElementById('transcript-format')?.value || 'txt'
        const exportPayload = format === 'txt'
            ? { content: textElement, extension: 'txt', mimeType: 'text/plain' }
            : serializeTranscript(segments, format)
        const element = document.createElement('a')
        const file = new Blob([exportPayload.content], { type: exportPayload.mimeType })
        element.href = URL.createObjectURL(file)
        element.download = `freescribe-transcript.${exportPayload.extension}`
        document.body.appendChild(element)
        element.click()
        URL.revokeObjectURL(element.href)
        element.remove()
    }

    function handleBenchmarkExport() {
        try {
            const exportPayload = createPerformanceExport(metrics)
            const element = document.createElement('a')
            const file = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
            element.href = URL.createObjectURL(file)
            element.download = 'freescribe-performance-run.json'
            document.body.appendChild(element)
            element.click()
            URL.revokeObjectURL(element.href)
            element.remove()
            setBenchmarkExportState('exported')
        } catch (error) {
            console.error(error)
            setBenchmarkExportState('error')
        }
    }

    function generateTranslation() {
        if (translating || toLanguage === 'Select language') {
            return
        }

        translationActive.current = true
        setTranslating(true)
        setTranslationProgress(null)
        setTranslationError(null)

        worker.current.send({
            text: transcriptText,
            src_lang: sourceLanguage.nllb,
            tgt_lang: toLanguage
        })
    }

    function cancelTranslation() {
        translationActive.current = false
        worker.current?.send({ type: WorkerMessageType.CANCEL })
        setTranslating(false)
        setTranslationProgress(null)
        setTranslationError(null)
    }

    function handleTabKeyDown(event, targetTab) {
        const tabOrder = ['transcription', 'translation']
        const currentIndex = tabOrder.indexOf(targetTab)
        let nextIndex = currentIndex
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % tabOrder.length
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length
        if (event.key === 'Home') nextIndex = 0
        if (event.key === 'End') nextIndex = tabOrder.length - 1
        if (nextIndex === currentIndex) return
        event.preventDefault()
        const nextTab = tabOrder[nextIndex]
        setTab(nextTab)
        document.getElementById(`${nextTab}-tab`)?.focus()
    }




    return (
        <main className='result-layout'>
          <header className='result-header'>
            <p className='eyebrow'><span className='eyebrow-dot'></span>Ready to review</p>
            <h1 className='result-title mt-3'>Your <span>transcription</span></h1>
            {sourceLanguage?.label && sourceLanguage.id !== 'auto' && (
                <div role='status' className='language-badge'>
                    <i className='fa-solid fa-language text-blue-500' aria-hidden='true'></i>
                    You spoke: <span className='text-blue-600'>{sourceLanguage.label}</span>
                    {languageWasDetected && typeof languageConfidence === 'number' && ` · ${Math.round(languageConfidence * 100)}% confidence`}
                    {!languageWasDetected && <span className='font-normal text-slate-500'> · selected manually</span>}
                </div>
            )}
            {languageWasDetected && typeof languageConfidence === 'number' && languageConfidence < 0.6 && (
                <p role='alert' className='notice mx-auto mt-4 max-w-2xl'>Low-confidence language guess. Select the spoken language manually and try again if the transcript looks wrong.</p>
            )}
            {modelId === 'Xenova/whisper-tiny' && sourceLanguage?.id !== 'en' && (
                <p className='mt-3 text-xs text-slate-500'>For better non-English accuracy, choose Whisper Base Multilingual before transcribing.</p>
            )}
            {transcriptLooksUnreliable && (
                <p role='alert' className='notice mx-auto mt-4 max-w-2xl'>This transcript contains suspicious repetition and may be a model hallucination. Retry with Whisper Base Multilingual and confirm the spoken language.</p>
            )}
            {metrics && <p className='mt-3 text-xs text-slate-500'>Processed {metrics.audioDurationSeconds.toFixed(1)}s of audio in {(metrics.elapsedMs / 1000).toFixed(1)}s{typeof metrics.realTimeFactor === 'number' && ` · ${metrics.realTimeFactor.toFixed(2)}× real time`}{typeof metrics.memory?.deltaBytes === 'number' && ` · heap Δ ${(metrics.memory.deltaBytes / (1024 * 1024)).toFixed(1)} MB`}</p>}
          </header>

          <section className='result-card'>
            {audioUrl && <div className='audio-review'>
              <div className='audio-review-heading'>
                <span><i className='fa-solid fa-headphones' aria-hidden='true'></i> Review with audio</span>
                <span className='audio-review-help'>Click a timestamp to jump here</span>
              </div>
              <audio ref={audioRef} src={audioUrl} aria-label='Transcription audio' controls preload='metadata' onTimeUpdate={handleAudioTimeUpdate} />
            </div>}
            <div className='text-center'>
              <div role='tablist' aria-label='Transcript views' className='tab-list'>
                <button id='transcription-tab' role='tab' tabIndex={tab === 'transcription' ? 0 : -1} aria-selected={tab === 'transcription'} aria-controls='transcription-panel' onKeyDown={(event) => handleTabKeyDown(event, 'transcription')} onClick={() => setTab('transcription')} className='tab-button'>Transcription</button>
                <button id='translation-tab' role='tab' tabIndex={tab === 'translation' ? 0 : -1} aria-selected={tab === 'translation'} aria-controls='translation-panel' onKeyDown={(event) => handleTabKeyDown(event, 'translation')} onClick={() => setTab('translation')} className='tab-button'>Translation</button>
              </div>
            </div>
            <div id={tab === 'transcription' ? 'transcription-panel' : 'translation-panel'} role='tabpanel' aria-labelledby={tab === 'transcription' ? 'transcription-tab' : 'translation-tab'} tabIndex='0' className='result-panel'>
                {(!finished || translating) && (
                    <div className='mb-4 grid place-items-center text-blue-500'>
                        <i className='fa-solid fa-spinner animate-spin'></i>
                    </div>
                )}
                {tab === 'transcription' ? (
                    <Transcription segments={segments} onSegmentChange={handleSegmentChange} onSegmentSeek={handleSegmentSeek} activeSegmentIndex={activeSegmentIndex} />
                ) : (
                    <Translation {...props} toLanguage={toLanguage} translating={translating} translationProgress={translationProgress} translationError={translationError} textElement={textElement} setTranslating={setTranslating} setTranslation={setTranslation} setToLanguage={setToLanguage} generateTranslation={generateTranslation} cancelTranslation={cancelTranslation} />
                )}
            </div>
            <div className='action-bar'>
                <button onClick={handleSaveProject} disabled={saveState === 'saving'} className='btn-secondary'>
                    <i className='fa-regular fa-floppy-disk' aria-hidden='true'></i>
                    {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved locally' : 'Save locally'}
                </button>
                <select id='transcript-format' aria-label='Export format' className='form-control export-select'>
                    <option value='txt'>TXT</option>
                    <option value='json'>JSON</option>
                    <option value='srt'>SRT</option>
                    <option value='vtt'>VTT</option>
                </select>
                <button onClick={handleCopy} aria-label='Copy transcript' title='Copy' className='icon-button'>
                    <i className="fa-solid fa-copy"></i>
                </button>
                <button onClick={handleDownload} aria-label='Download transcript' title='Download' className='icon-button'>
                    <i className="fa-solid fa-download"></i>
                </button>
                {metrics && <button onClick={handleBenchmarkExport} aria-label='Export benchmark run' title='Export benchmark run' className='icon-button'>
                    <i className="fa-solid fa-chart-line"></i>
                </button>}
            </div>
            <div className='mt-3 text-center'>
              {saveState === 'error' && <p role='alert' className='text-sm text-rose-500'>Could not save this project locally.</p>}
              {copyState === 'copied' && <p role='status' className='text-sm text-emerald-600'>Transcript copied.</p>}
              {copyState === 'error' && <p role='alert' className='text-sm text-rose-500'>Could not copy the transcript.</p>}
              {benchmarkExportState === 'exported' && <p role='status' className='text-sm text-emerald-600'>Benchmark run exported. It contains metrics only.</p>}
              {benchmarkExportState === 'error' && <p role='alert' className='text-sm text-rose-500'>Could not export benchmark metrics.</p>}
            </div>
          </section>
        </main>
    )
}

Information.propTypes = {
    output: PropTypes.arrayOf(PropTypes.shape({ text: PropTypes.string })).isRequired,
    finished: PropTypes.bool.isRequired,
    metrics: PropTypes.shape({
        audioDurationSeconds: PropTypes.number.isRequired,
        elapsedMs: PropTypes.number.isRequired,
        realTimeFactor: PropTypes.number,
        memory: PropTypes.shape({ deltaBytes: PropTypes.number }),
    }),
    initialTranslation: PropTypes.string,
    initialTranslationLanguage: PropTypes.string,
    sourceLanguage: PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string, nllb: PropTypes.string.isRequired }).isRequired,
    languageConfidence: PropTypes.number,
    languageWasDetected: PropTypes.bool,
    modelId: PropTypes.string.isRequired,
    audioSource: PropTypes.object,
}
