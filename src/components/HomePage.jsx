import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { AUDIO_LIMITS, getSupportedRecordingMimeType } from '../services/audio/audio'

export default function HomePage(props) {
    const { setAudioStream, setFile } = props

    const [recordingStatus, setRecordingStatus] = useState('inactive')
    const [duration, setDuration] = useState(0)
    const [recordingError, setRecordingError] = useState(null)

    const mediaRecorder = useRef(null)
    const recordingStream = useRef(null)
    const audioChunks = useRef([])
    const durationRef = useRef(0)

    async function startRecording() {
        setRecordingError(null)
        try {
            recordingStream.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            })
        } catch (err) {
            console.error(err)
            setRecordingError('Microphone access was denied or is unavailable.')
            return
        }

        const mimeType = getSupportedRecordingMimeType()
        if (!mimeType) {
            recordingStream.current.getTracks().forEach((track) => track.stop())
            recordingStream.current = null
            setRecordingError('This browser does not support a compatible recording format.')
            return
        }

        const media = new MediaRecorder(recordingStream.current, { mimeType })
        mediaRecorder.current = media
        audioChunks.current = []

        media.ondataavailable = (event) => {
            if (event.data?.size) audioChunks.current.push(event.data)
        }
        media.onerror = () => {
            setRecordingError('The recording failed. Please try again.')
            setRecordingStatus('inactive')
            if (media.state === 'recording') media.stop()
        }
        media.onstop = () => {
            const audioBlob = new Blob(audioChunks.current, { type: mimeType })
            setAudioStream(audioBlob)
            audioChunks.current = []
            recordingStream.current?.getTracks().forEach((track) => track.stop())
            recordingStream.current = null
            mediaRecorder.current = null
            durationRef.current = 0
            setDuration(0)
        }

        media.start()
        setRecordingStatus('recording')
    }

    async function stopRecording() {
        setRecordingStatus('inactive')
        if (mediaRecorder.current?.state === 'recording') mediaRecorder.current.stop()
    }

    useEffect(() => {
        if (recordingStatus === 'inactive') { return }

        const interval = setInterval(() => {
            const nextDuration = durationRef.current + 1
            durationRef.current = nextDuration
            setDuration(nextDuration)
            if (nextDuration >= AUDIO_LIMITS.maxDurationSeconds && mediaRecorder.current?.state === 'recording') {
                setRecordingStatus('inactive')
                mediaRecorder.current.stop()
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [recordingStatus])

    useEffect(() => () => {
        if (mediaRecorder.current?.state === 'recording') mediaRecorder.current.stop()
        recordingStream.current?.getTracks().forEach((track) => track.stop())
    }, [])


    return (
        <main className='hero'>
            <section className='hero-copy'>
                <p className='eyebrow'><span className='eyebrow-dot'></span>Private, multilingual AI</p>
                <h1 className='hero-title'>
                    <span className='sr-only'>FreeScribe</span>
                    <span aria-hidden='true'>Your voice,<br /><span className='accent'>clearly written.</span></span>
                </h1>
                <p className='hero-subtitle'>Add audio, create an editable transcript, and translate it into the language you need—all directly in your browser.</p>
                <div className='workflow' aria-label='FreeScribe workflow'>
                    <span><i className='fa-solid fa-microphone mr-2 text-blue-500'></i>Record</span>
                    <span><i className='fa-solid fa-wand-magic-sparkles mr-2 text-indigo-500'></i>Transcribe</span>
                    <span><i className='fa-solid fa-language mr-2 text-violet-500'></i>Translate</span>
                </div>
            </section>

            <section className='capture-card' aria-labelledby='capture-heading'>
                <h2 id='capture-heading' className='capture-heading'>Start with your audio</h2>
                <p className='capture-copy'>Use your microphone or choose an audio file from this device.</p>
                <button aria-label={recordingStatus === 'recording' ? 'Stop recording' : 'Start recording'} onClick={recordingStatus === 'recording' ? stopRecording : startRecording} className={'record-button ' + (recordingStatus === 'recording' ? 'recording' : '')}>
                    <span>{recordingStatus === 'inactive' ? 'Start recording' : 'Stop recording'}</span>
                    <span className='flex items-center gap-3'>
                        {duration !== 0 && <span className='text-sm font-semibold tabular-nums'>{duration}s</span>}
                        <span className='record-icon'><i className='fa-solid fa-microphone'></i></span>
                    </span>
                </button>
                {recordingError && <p role='alert' className='rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600'>{recordingError}</p>}
                <div className='divider'>or</div>
                <label className='upload-zone' htmlFor='audio-upload'>
                    <span className='upload-icon' aria-hidden='true'><i className='fa-solid fa-arrow-up-from-bracket'></i></span>
                    <span>
                        <span className='upload-title'>Upload an audio file</span>
                        <span className='upload-meta'>MP3, WAV, M4A, WebM and more</span>
                    </span>
                    <input id='audio-upload' aria-label='Upload an audio file' onChange={(event) => setFile(event.target.files?.[0] || null)} className='sr-only' type='file' accept='audio/*' />
                </label>
                <p className='privacy-note'><i className='fa-solid fa-shield-halved text-emerald-500'></i><span>Audio stays on your device · </span><span>Recordings are limited to {Math.round(AUDIO_LIMITS.maxDurationSeconds / 60)} minutes and 200 MB.</span></p>
            </section>
        </main>
    )
}

HomePage.propTypes = {
    setAudioStream: PropTypes.func.isRequired,
    setFile: PropTypes.func.isRequired,
}
