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
        <main className='flex-1  p-4 flex flex-col gap-3 text-center sm:gap-4  justify-center pb-20'>
            <h1 className='font-semibold text-5xl sm:text-6xl md:text-7xl'>Free<span className='text-blue-400 bold'>Scribe</span></h1>
            <h3 className='font-medium md:text-lg'>Record <span className='text-blue-400'>&rarr;</span> Transcribe <span className='text-blue-400'>&rarr;</span> Translate</h3>
            <button aria-label={recordingStatus === 'recording' ? 'Stop recording' : 'Start recording'} onClick={recordingStatus === 'recording' ? stopRecording : startRecording} className='flex specialBtn px-4 py-2 rounded-xl items-center text-base justify-between gap-4 mx-auto w-72 max-w-full my-4'>
                <p className='text-blue-400'>{recordingStatus === 'inactive' ? 'Record' : `Stop recording`}</p>
                <div className='flex items-center gap-2'>
                    {duration !== 0 && <p className='text-sm'>{duration}s</p>}
                    <i className={"fa-solid duration-200 fa-microphone " + (recordingStatus === 'recording' ? ' text-rose-300' : "")}></i>
                </div>
            </button>
            {recordingError && <p role='alert' className='text-sm text-rose-500'>{recordingError}</p>}
            <p className='text-base'>Or <label className='text-blue-400 cursor-pointer hover:text-blue-600 duration-200'>upload <input onChange={(e) => {
                const tempFile = e.target.files[0]
                setFile(tempFile)
            }} className='hidden' type='file' accept='audio/*' /></label> an audio file</p>
            <p className='text-xs text-slate-400'>Recordings are limited to {Math.round(AUDIO_LIMITS.maxDurationSeconds / 60)} minutes and 200 MB.</p>
            <p className='italic text-slate-400'>Free now free forever</p>
        </main>
    )
}

HomePage.propTypes = {
    setAudioStream: PropTypes.func.isRequired,
    setFile: PropTypes.func.isRequired,
}
