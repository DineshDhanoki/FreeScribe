import { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { getSpeechModel, SPEECH_MODELS, TRANSCRIPTION_LANGUAGES } from '../services/models/modelConfig'

export default function FileDisplay(props) {
    const { handleAudioReset, file, audioStream, handleFormSubmission, modelId, setModelId, languageId, setLanguageId } = props
    const audioRef = useRef()
    const selectedModel = getSpeechModel(modelId)

    function handleModelChange(event) {
        const nextModelId = event.target.value
        setModelId(nextModelId)
        if (!getSpeechModel(nextModelId).supportsMultilingual && languageId !== 'en') setLanguageId('en')
    }

    useEffect(() => {
        if (!file && !audioStream) { return }
        let objectUrl
        if (file) {
            objectUrl = URL.createObjectURL(file)
        } else {
            objectUrl = URL.createObjectURL(audioStream)
        }
        audioRef.current.src = objectUrl
        return () => URL.revokeObjectURL(objectUrl)
    }, [audioStream, file])


    return (
        <main className='workspace-wrap'>
          <section className='workspace-card text-center'>
            <p className='eyebrow justify-center'><span className='eyebrow-dot'></span>Ready to process</p>
            <h1 className='workspace-title mt-3'>Review your <span>audio</span></h1>
            <p className='mt-3 text-sm leading-6 text-slate-500'>Listen once, then choose the model and spoken language that best match your recording.</p>
            <div className='file-summary'>
                <span className='file-icon' aria-hidden='true'><i className='fa-solid fa-file-audio'></i></span>
                <span className='min-w-0'>
                    <span className='block text-xs font-bold uppercase tracking-wider text-slate-400'>Audio file</span>
                    <span className='block truncate font-semibold text-slate-700'>{file ? file?.name : 'Microphone recording'}</span>
                </span>
            </div>
            <div className='mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3'>
                <audio ref={audioRef} aria-label='Selected audio preview' className='w-full' controls preload='metadata'>
                    Your browser does not support the audio element.
                </audio>
            </div>
            <div className='form-grid'>
            <label className='text-left'>
                <span className='field-label'>Transcription model</span>
                <select aria-label='Transcription model' value={modelId} onChange={handleModelChange} className='form-control'>
                    {SPEECH_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>{model.label} — {model.approximateSize}{model.recommended ? ' — recommended' : ''}</option>
                    ))}
                </select>
                <span className='field-help'>{selectedModel.description}</span>
            </label>
            <label className='text-left'>
                <span className='field-label'>Spoken language</span>
                <select aria-label='Spoken language' value={languageId} onChange={(event) => setLanguageId(event.target.value)} className='form-control'>
                    {TRANSCRIPTION_LANGUAGES.map((language) => (
                        <option key={language.id} value={language.id} disabled={!selectedModel.supportsMultilingual && language.id !== 'en'}>{language.label}{!selectedModel.supportsMultilingual && language.id !== 'en' ? ' — choose a multilingual model' : ''}</option>
                    ))}
                </select>
                <span className='field-help'>Auto-detect identifies the spoken language locally before transcription begins.</span>
            </label>
            </div>
            <div className='workspace-actions'>
                <button onClick={handleAudioReset} className='btn-ghost'><i className='fa-solid fa-arrow-left'></i>Choose another file</button>
                <button onClick={handleFormSubmission} className='btn-primary'>
                    <span>Transcribe audio</span>
                    <i className='fa-solid fa-arrow-right'></i>
                </button>
            </div>
          </section>
        </main>
    )
}

FileDisplay.propTypes = {
    handleAudioReset: PropTypes.func.isRequired,
    handleFormSubmission: PropTypes.func.isRequired,
    file: PropTypes.shape({ name: PropTypes.string }),
    audioStream: PropTypes.object,
    modelId: PropTypes.string.isRequired,
    setModelId: PropTypes.func.isRequired,
    languageId: PropTypes.string.isRequired,
    setLanguageId: PropTypes.func.isRequired,
}
