import PropTypes from 'prop-types'

export default function Transcribing(props) {
    const { status, downloading, progress, onCancel } = props
    const phaseLabel = status === 'decoding'
        ? 'decoding audio locally'
        : downloading
            ? 'downloading model'
            : 'transcribing audio locally'


    return (
        <div role='status' aria-live='polite' className='flex items-center flex-1 flex-col justify-center gap-10 md:gap-14 text-center pb-24 p-4'>
            <div className='flex flex-col gap-2 sm:gap-4'>

                <h1 className='font-semibold text-4xl sm:text-5xl md:text-6xl'><span className='text-blue-400 bold'>Transcribing</span></h1>
                <p>{phaseLabel}</p>
                {typeof progress === 'number' && <div role='progressbar' aria-label='Model download progress' aria-valuemin='0' aria-valuemax='100' aria-valuenow={Math.round(progress)} className='text-sm text-slate-500'>{Math.round(progress)}%</div>}
            </div>
            <div className='flex flex-col gap-2 sm:gap-3 max-w-[400px] mx-auto w-full'>
                {[0, 1, 2].map(val => {
                    return (
                        <div key={val} className={'rounded-full h-2 sm:h-3 bg-slate-400 loading ' + `loading${val}`}></div>
                    )
                })}
            </div>
            <button onClick={onCancel} className='text-sm text-slate-500 hover:text-blue-600'>Cancel</button>
        </div>
    )
}

Transcribing.propTypes = {
    status: PropTypes.string,
    downloading: PropTypes.bool,
    progress: PropTypes.number,
    onCancel: PropTypes.func.isRequired,
}
