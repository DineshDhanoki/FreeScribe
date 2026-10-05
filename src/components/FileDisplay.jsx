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
        <main className='flex-1  p-4 flex flex-col gap-3 text-center sm:gap-4 justify-center pb-20 w-full max-w-prose mx-auto'>
            <h1 className='font-semibold text-4xl sm:text-5xl md:text-6xl'>Your <span className='text-blue-400 bold'>File</span></h1>
            <div className=' flex flex-col text-left my-4'>
                <h3 className='font-semibold'>Name</h3>
                <p className='truncate'>{file ? file?.name : 'Custom audio'}</p>
            </div>
            <div className='flex flex-col mb-2'>
                <audio ref={audioRef} className='w-full' controls>
                    Your browser does not support the audio element.
                </audio>
            </div>
            <label className='flex flex-col gap-1 text-left'>
                <span className='text-xs font-medium text-slate-500'>Transcription model</span>
                <select aria-label='Transcription model' value={modelId} onChange={handleModelChange} className='rounded border border-slate-200 bg-white p-2'>
                    {SPEECH_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>{model.label} — {model.approximateSize}</option>
                    ))}
                </select>
                <span className='text-xs text-slate-500'>{selectedModel.description}</span>
            </label>
            <label className='flex flex-col gap-1 text-left'>
                <span className='text-xs font-medium text-slate-500'>Spoken language</span>
                <select aria-label='Spoken language' value={languageId} onChange={(event) => setLanguageId(event.target.value)} className='rounded border border-slate-200 bg-white p-2'>
                    {TRANSCRIPTION_LANGUAGES.map((language) => (
                        <option key={language.id} value={language.id} disabled={!selectedModel.supportsMultilingual && language.id !== 'en'}>{language.label}{!selectedModel.supportsMultilingual && language.id !== 'en' ? ' — choose a multilingual model' : ''}</option>
                    ))}
                </select>
                <span className='text-xs text-slate-500'>Auto-detect uses a local speech-language model and then starts transcription.</span>
            </label>
            <div className='flex items-center justify-between gap-4'>
                <button onClick={handleAudioReset} className='text-slate-400 hover:text-blue-600 duration-200'>Reset</button>
                <button onClick={handleFormSubmission} className='specialBtn  px-3 p-2 rounded-lg text-blue-400 flex items-center gap-2 font-medium '>
                    <p>Transcribe</p>
                    <i className="fa-solid fa-pen-nib"></i>
                </button>
            </div>
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
