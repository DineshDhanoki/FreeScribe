import PropTypes from 'prop-types'

export default function Transcription({ segments, onSegmentChange }) {
    return (
        <div className='flex flex-col gap-3 text-left'>
            {segments.map((segment, index) => (
                <label key={`${segment.index}-${index}`} className='flex gap-3 items-start'>
                    <span className='text-xs text-slate-400 min-w-20 pt-2'>
                        {segment.start.toFixed(1)}s
                    </span>
                    <textarea
                        aria-label={`Transcript segment ${index + 1}`}
                        value={segment.text}
                        onChange={(event) => onSegmentChange(index, event.target.value)}
                        rows={Math.max(1, Math.ceil(segment.text.length / 70))}
                        className='flex-1 resize-y rounded border border-slate-200 bg-white p-2 outline-none focus:border-blue-300'
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
