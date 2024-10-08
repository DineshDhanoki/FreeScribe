import React, {useState} from 'react'
import Transcription from './Transcription'
import Translation from './Translation'

export default function Information(props) {
    const {output} = props

    const [tab, setTab] = useState('transcription')
    const [translation, setTranslation] = useState(null)
    const [toLanguage, setToLanguage] = useState('Select language')
    const [translating, setTranslating] = useState(null)


    function handleCopy() {
        navigator.clipboard.writeText()
    }

    function handleDownload () {
        const element = document.createElement('a')
        const file = new Blob([], {type: 'text/plain'})
        element.href = URL.createObjectURL(file)
        element.download(`Freescribe_${(newDate()).toDateString()}.txt`)
        document.body.appendchild(element)
        element.click()
    }

    function generateTranslation () {

    }

    const textElement = tab === 'transcription' ? output.map(val => val.text) : ''

  return (
    <main className='flex-1 p-4 flex flex-col gap-3 text-center sm:gap-4 justify-center pb-20 max-w-prose w-full mx-auto'>
        <h1 className='font-semibold text-4xl sm:text-5xl md:text-6xl whitespace-nowrap'>Your <span className='text-blue-400 bold'>Transcription</span></h1> 
        <div className='grid grid-cols-2 mx-auto bg-white border-2 border-solid border-blue-400 shadow rounded-full overflow-hidden items-center'>
        <button onClick={() => setTab('transcription')} className={'px-4 rounded duration-200 py-1 ' + (tab === 'transcription' ? ' bg-blue-300 text-white' : ' text-blue-400 hover:text-blue-600')}>Transcription</button>
        <button onClick={() => setTab('translation')} className={'px-4 rounded duration-200 py-1  ' + (tab === 'translation' ? ' bg-blue-300 text-white' : ' text-blue-400 hover:text-blue-600')}>Translation</button>
        </div>
     <div className='my-8 flex flex-col'>  
  {tab === 'transcription' ? (
    <Transcription {...props} textElement={textElement}/>
  ) : (
    <Translation {...props} toLanguage={toLanguage} translating={translating} translation={translation} setToLanguage={setToLanguage} setTranslating={setTranslating} setTranslation={setTranslation} />
  )}
  </div> 
  <div className='flex items-center gap-4 mx-auto text-base'>
    <button title='Copy' className='specialBtn p-2 rounded px-4'><i className="fa-solid fa-copy"></i></button>
    <button title='Download' className='specialBtn p-2 rounded px-4'><i className="fa-solid fa-download"></i></button>
  </div>
    </main>
    )}


