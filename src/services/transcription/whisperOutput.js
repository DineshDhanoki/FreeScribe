export function normalizeWhisperOutput(output) {
  const chunks = output?.chunks || [{ text: output?.text || '', timestamp: [0, 0] }]
  return chunks
    .map((chunk, index) => {
      const [start = 0, end = start] = chunk.timestamp || chunk.timestamps || [0, 0]
      return {
        index,
        text: String(chunk.text || '').trim(),
        start: Math.max(0, Math.round(start)),
        end: Math.max(start, Math.round(end || start + 0.9)),
      }
    })
    .filter((chunk) => chunk.text.length > 0)
}

