import PropTypes from 'prop-types'

export default function Transcription({ segments, onSegmentChange }) {
    return (
        <div className='segment-list text-left'>
            {segments.map((segment, index) => (
                <label key={`${segment.index}-${index}`} className='segment-row'>
                    <span className='segment-time'>
                        {segment.start.toFixed(1)}s
                    </span>
                    <textarea
                        aria-label={`Transcript segment ${index + 1}`}
                        value={segment.text}
                        onChange={(event) => onSegmentChange(index, event.target.value)}
                        rows={Math.max(1, Math.ceil(segment.text.length / 70))}
                        className='segment-editor'
                    />
                </label>
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
}
