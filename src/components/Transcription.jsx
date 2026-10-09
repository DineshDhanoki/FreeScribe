import PropTypes from 'prop-types'

export default function Transcription({ segments, onSegmentChange, onSegmentSeek, activeSegmentIndex }) {
    return (
        <div className='segment-list text-left'>
            {segments.map((segment, index) => (
                <div key={`${segment.index}-${index}`} className={`segment-row ${activeSegmentIndex === index ? 'active' : ''}`}>
                    <button type='button' className='segment-time' onClick={() => onSegmentSeek(index)} aria-label={`Jump to transcript segment ${index + 1}`} aria-current={activeSegmentIndex === index ? 'true' : undefined}>
                        {segment.start.toFixed(1)}s
                    </button>
                    <textarea
                        aria-label={`Transcript segment ${index + 1}`}
                        value={segment.text}
                        onChange={(event) => onSegmentChange(index, event.target.value)}
                        rows={Math.max(1, Math.ceil(segment.text.length / 70))}
                        className='segment-editor'
                    />
                </div>
            ))}
            {segments.length === 0 && <p className='text-slate-500'>No transcript text was produced.</p>}
        </div>
    )
}

Transcription.propTypes = {
    segments: PropTypes.arrayOf(PropTypes.shape({
        index: PropTypes.number.isRequired,
        text: PropTypes.string.isRequired,
        start: PropTypes.number.isRequired,
    })).isRequired,
    onSegmentChange: PropTypes.func.isRequired,
    onSegmentSeek: PropTypes.func.isRequired,
    activeSegmentIndex: PropTypes.number,
}
