import React, {useState, useEffect, useRef} from 'react'

export default function HomePage(props) {
    const {setFile, setAudioStream} = props

    const[recordingStatus, setRecordingStatus] = useState('')
    const[audioChunks, setAudioChunks] = useState([])
    const[duration, setDuration] = useState(0)

    const mediaRecorder = useRef(null)

    const mimeType = 'audio/webm'

    async function startRecording() {
        let tempStream
        console.log('Start Recording')
        try {
            const streamData = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            })
            tempStream = streamData
        } catch (error) {
            console.log(error.message)          
            return
        }
        setRecordingStatus('recording')
    

    // create new media recorder instance using the stream

    const media = new MediaRecorder(tempStream, {type: mimeType})
    mediaRecorder.current = media

    mediaRecorder.current.start()
    let localAudioChunks = []
    mediaRecorder.current.ondataavailable = (event) => {
        if (typeof event.data === 'undefined') {return}
        if (event.data.size === 0) {return}
        localAudioChunks.push(event.data)
    }
    setAudioChunks(localAudioChunks)
    }

    async function stopRecording() {
        setRecordingStatus('inactive')
        console.log('Stop Recording')

        mediaRecorder.current.stop()
        mediaRecorder.current.onstop = () => {
            const audioBlob = new Blob(audioChunks, {type: mimeType})
            setAudioStream(audioBlob)
            setAudioChunks([])
            setDuration(0)
        }
    }

    useEffect(() => {
        if (recordingStatus === 'inactive') {return}

        const interval = setInterval(() => {
            setDuration(curr => curr + 1)
        }, 1000)

        return () => clearInterval(interval)
    })


  return (
    <main className='flex-1 bg-yellow-200 p-4 flex flex-col gap-3 text-center sm:gap-4 justify-center pd-20'>
        <h1 className='font-semibold text-5xl sm:text-6xl md:text-7xl'>Free<span className='text-blue-400 bold'>Scribe</span></h1>
        <h3 className='font-medium md:text-lg'>Record 
        <span className='text-blue-400'> &rArr; </span>Transcribe 
        <span className='text-blue-400'> &rArr; </span>Translate</h3>
        <button onClick={recordingStatus === 'recording' ? stopRecording : startRecording} className='flex specialBtn px-4 py-2 rounded-xl items-center text-base justify-between gap-4 mx-auto w-72 max-w-full my-4'>
            <p className='text-blue-400'>{recordingStatus === 'inactive' ? 'Record' : `Stop Recording`}</p>
            <div className='flex items-center gap-2'>
            {duration && (
                <p className='sm'>{duration}s</p>
            )}
            <i className={"fa-solid duration-200 fa-microphone" + (recordingStatus === 'recording' ? 'text-rose-400' : "")}></i>
            </div>
        </button>
        <p className='text-base'>Or <label className='text-blue-600 cursor-pointer hover:text-red-600 duration-200'>upload 
        <input onChange={(e) => {
            const tempFile = e.target.files[0]
            setFile(tempFile)
        }} className='hidden' type='file' accept='.mp3,.wave'/></label> a .mp3 file</p>
        <p className='italic text-slate-400'>Free Now & Free Forever</p>
    </main>
  )
}
