import PropTypes from 'prop-types'

export default function Transcribing(props) {
    const { status, phase, downloading, progress, onCancel } = props
    const phaseLabel = status === 'decoding'
        ? 'decoding audio locally'
        : downloading
            ? 'downloading model'
            : phase === 'detecting'
                ? 'detecting spoken language locally'
            : 'transcribing audio locally'


    return (
        <main role='status' aria-live='polite' className='workspace-wrap'>
          <section className='status-card'>
            <span className='status-icon' aria-hidden='true'><i className='fa-solid fa-wave-square'></i></span>
            <h1 className='status-title'>Working on it</h1>
            <p className='status-subtitle'>{phaseLabel}</p>
            {typeof progress === 'number' && <div className='mt-7'>
                <div className='mb-2 flex justify-between text-xs font-semibold text-slate-500'><span>Model download</span><span>{Math.round(progress)}%</span></div>
                <div role='progressbar' aria-label='Model download progress' aria-valuemin='0' aria-valuemax='100' aria-valuenow={Math.round(progress)} className='progress-track'><div className='progress-fill' style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}></div></div>
            </div>}
            <div className='processing-lines'>
                {[0, 1, 2].map(val => {
                    return (
                        <div key={val} className={'rounded-full h-2 loading ' + `loading${val}`}></div>
                    )
                })}
            </div>
            <button onClick={onCancel} className='btn-ghost mx-auto'>Cancel</button>
          </section>
        </main>
    )
}

Transcribing.propTypes = {
    status: PropTypes.string,
    downloading: PropTypes.bool,
    phase: PropTypes.string,
    progress: PropTypes.number,
    onCancel: PropTypes.func.isRequired,
}
