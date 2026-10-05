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
    const { output, finished, metrics, initialTranslation, initialTranslationLanguage, sourceLanguage, languageConfidence, languageWasDetected, modelId } = props
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
    const projectId = useRef(null)
    const translationActive = useRef(false)
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
        <main className='flex-1  p-4 flex flex-col gap-3 text-center sm:gap-4 justify-center pb-20 max-w-prose w-full mx-auto'>
            <h1 className='font-semibold text-4xl sm:text-5xl md:text-6xl whitespace-nowrap'>Your <span className='text-blue-400 bold'>Transcription</span></h1>
            {sourceLanguage?.label && sourceLanguage.id !== 'auto' && (
                <div role='status' className='mx-auto rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-slate-700'>
                    You spoke: <span className='text-blue-600'>{sourceLanguage.label}</span>
                    {languageWasDetected && typeof languageConfidence === 'number' && ` · ${Math.round(languageConfidence * 100)}% confidence`}
                    {!languageWasDetected && <span className='font-normal text-slate-500'> · selected manually</span>}
                </div>
            )}
            {languageWasDetected && typeof languageConfidence === 'number' && languageConfidence < 0.6 && (
                <p role='alert' className='text-sm font-medium text-amber-700'>Low-confidence language guess. Select the spoken language manually and try again if the transcript looks wrong.</p>
            )}
            {modelId === 'Xenova/whisper-tiny' && sourceLanguage?.id !== 'en' && (
                <p className='text-xs text-slate-500'>For better non-English accuracy, choose Whisper Base Multilingual before transcribing.</p>
            )}
            {transcriptLooksUnreliable && (
                <p role='alert' className='rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800'>This transcript contains suspicious repetition and may be a model hallucination. Retry with Whisper Base Multilingual and confirm the spoken language.</p>
            )}
            {metrics && <p className='text-xs text-slate-500'>Processed {metrics.audioDurationSeconds.toFixed(1)}s of audio in {(metrics.elapsedMs / 1000).toFixed(1)}s{typeof metrics.realTimeFactor === 'number' && ` · ${metrics.realTimeFactor.toFixed(2)}× real time`}{typeof metrics.memory?.deltaBytes === 'number' && ` · heap Δ ${(metrics.memory.deltaBytes / (1024 * 1024)).toFixed(1)} MB`}</p>}

            <div role='tablist' aria-label='Transcript views' className='grid grid-cols-2 sm:mx-auto bg-white  rounded overflow-hidden items-center p-1 blueShadow border-[2px] border-solid border-blue-300'>
                <button id='transcription-tab' role='tab' tabIndex={tab === 'transcription' ? 0 : -1} aria-selected={tab === 'transcription'} aria-controls='transcription-panel' onKeyDown={(event) => handleTabKeyDown(event, 'transcription')} onClick={() => setTab('transcription')} className={'px-4 rounded duration-200 py-1 ' + (tab === 'transcription' ? ' bg-blue-300 text-white' : ' text-blue-400 hover:text-blue-600')}>Transcription</button>
                <button id='translation-tab' role='tab' tabIndex={tab === 'translation' ? 0 : -1} aria-selected={tab === 'translation'} aria-controls='translation-panel' onKeyDown={(event) => handleTabKeyDown(event, 'translation')} onClick={() => setTab('translation')} className={'px-4 rounded duration-200 py-1  ' + (tab === 'translation' ? ' bg-blue-300 text-white' : ' text-blue-400 hover:text-blue-600')}>Translation</button>
            </div>
            <div id={tab === 'transcription' ? 'transcription-panel' : 'translation-panel'} role='tabpanel' aria-labelledby={tab === 'transcription' ? 'transcription-tab' : 'translation-tab'} tabIndex='0' className='my-8 flex flex-col-reverse max-w-prose w-full mx-auto gap-4'>
                {(!finished || translating) && (
                    <div className='grid place-items-center'>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                    </div>
                )}
                {tab === 'transcription' ? (
                    <Transcription segments={segments} onSegmentChange={handleSegmentChange} />
                ) : (
                    <Translation {...props} toLanguage={toLanguage} translating={translating} translationProgress={translationProgress} translationError={translationError} textElement={textElement} setTranslating={setTranslating} setTranslation={setTranslation} setToLanguage={setToLanguage} generateTranslation={generateTranslation} cancelTranslation={cancelTranslation} />
                )}
            </div>
            <div className='flex items-center gap-4 mx-auto '>
                <button onClick={handleSaveProject} disabled={saveState === 'saving'} className='specialBtn rounded-lg px-3 py-2 text-sm text-blue-400 disabled:opacity-50'>
                    {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved locally' : 'Save locally'}
                </button>
                <select id='transcript-format' aria-label='Export format' className='rounded bg-white px-2 py-1 text-sm text-slate-600'>
                    <option value='txt'>TXT</option>
                    <option value='json'>JSON</option>
                    <option value='srt'>SRT</option>
                    <option value='vtt'>VTT</option>
                </select>
                <button onClick={handleCopy} aria-label='Copy transcript' title="Copy" className='bg-white  hover:text-blue-500 duration-200 text-blue-300 px-2 aspect-square grid place-items-center rounded'>
                    <i className="fa-solid fa-copy"></i>
                </button>
                <button onClick={handleDownload} aria-label='Download transcript' title="Download" className='bg-white  hover:text-blue-500 duration-200 text-blue-300 px-2 aspect-square grid place-items-center rounded'>
                    <i className="fa-solid fa-download"></i>
                </button>
                {metrics && <button onClick={handleBenchmarkExport} aria-label='Export benchmark run' title="Export benchmark run" className='bg-white hover:text-blue-500 duration-200 text-blue-300 px-2 aspect-square grid place-items-center rounded'>
                    <i className="fa-solid fa-chart-line"></i>
                </button>}
            </div>
            {saveState === 'error' && <p role='alert' className='text-sm text-rose-500'>Could not save this project locally.</p>}
            {copyState === 'copied' && <p role='status' className='text-sm text-emerald-600'>Transcript copied.</p>}
            {copyState === 'error' && <p role='alert' className='text-sm text-rose-500'>Could not copy the transcript.</p>}
            {benchmarkExportState === 'exported' && <p role='status' className='text-sm text-emerald-600'>Benchmark run exported. It contains metrics only.</p>}
            {benchmarkExportState === 'error' && <p role='alert' className='text-sm text-rose-500'>Could not export benchmark metrics.</p>}
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
}
