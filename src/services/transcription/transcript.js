export function normalizeSegments(segments = []) {
  return segments
    .filter((segment) => segment && typeof segment.text === 'string')
    .map((segment, index) => ({
      index,
      text: segment.text.trim(),
      start: Number.isFinite(segment.start) ? Math.max(0, segment.start) : 0,
      end: Number.isFinite(segment.end) ? Math.max(segment.start || 0, segment.end) : null,
    }))
    .filter((segment) => segment.text.length > 0)
}

export function formatTimestamp(seconds, separator = ',') {
  const safeSeconds = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const wholeSeconds = Math.floor(safeSeconds % 60)
  const milliseconds = Math.floor((safeSeconds - Math.floor(safeSeconds)) * 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}${separator}${String(milliseconds).padStart(3, '0')}`
}

export function transcriptToText(segments) {
  return normalizeSegments(segments).map((segment) => segment.text).join('\n')
}

export function transcriptToJson(segments) {
  return JSON.stringify(normalizeSegments(segments), null, 2)
}

export function transcriptToSrt(segments) {
  return normalizeSegments(segments)
    .map((segment, index) => {
      const end = segment.end ?? segment.start + 1
      return `${index + 1}\n${formatTimestamp(segment.start)} --> ${formatTimestamp(end)}\n${segment.text}`
    })
    .join('\n\n')
}

export function transcriptToVtt(segments) {
  return `WEBVTT\n\n${normalizeSegments(segments)
    .map((segment) => {
      const end = segment.end ?? segment.start + 1
      return `${formatTimestamp(segment.start, '.')} --> ${formatTimestamp(end, '.')}\n${segment.text}`
    })
    .join('\n\n')}`
}

export function serializeTranscript(segments, format) {
  switch (format) {
    case 'json':
      return { content: transcriptToJson(segments), extension: 'json', mimeType: 'application/json' }
    case 'srt':
      return { content: transcriptToSrt(segments), extension: 'srt', mimeType: 'text/plain' }
    case 'vtt':
      return { content: transcriptToVtt(segments), extension: 'vtt', mimeType: 'text/vtt' }
    case 'txt':
    default:
      return { content: transcriptToText(segments), extension: 'txt', mimeType: 'text/plain' }
  }
}

