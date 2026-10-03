const DEFAULT_SAMPLE_RATE = 16000
export const AUDIO_LIMITS = Object.freeze({
  maxFileSizeBytes: 200 * 1024 * 1024,
  maxDurationSeconds: 30 * 60,
})
const SUPPORTED_AUDIO_EXTENSIONS = new Set(['aac', 'flac', 'm4a', 'mp3', 'mp4', 'ogg', 'wav', 'webm'])

export function resampleAudio(audio, sourceSampleRate, targetSampleRate) {
  if (sourceSampleRate === targetSampleRate) return audio
  if (!audio.length || sourceSampleRate <= 0 || targetSampleRate <= 0) return new Float32Array()

  const outputLength = Math.round(audio.length * targetSampleRate / sourceSampleRate)
  const output = new Float32Array(outputLength)
  const ratio = sourceSampleRate / targetSampleRate

  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = index * ratio
    const leftIndex = Math.floor(sourcePosition)
    const rightIndex = Math.min(leftIndex + 1, audio.length - 1)
    const interpolation = sourcePosition - leftIndex
    output[index] = audio[leftIndex] * (1 - interpolation) + audio[rightIndex] * interpolation
  }

  return output
}

export function validateAudioFile(file, limits = AUDIO_LIMITS) {
  if (!file) throw new Error('Choose an audio file first.')
  const extension = typeof file.name === 'string' ? file.name.split('.').pop()?.toLowerCase() : ''
  const hasAudioMimeType = typeof file.type === 'string' && file.type.startsWith('audio/')
  if (!hasAudioMimeType && !SUPPORTED_AUDIO_EXTENSIONS.has(extension)) {
    throw new Error('The selected file is not a supported audio file.')
  }
  if (file.size > limits.maxFileSizeBytes) {
    throw new Error(`Audio files must be smaller than ${Math.round(limits.maxFileSizeBytes / (1024 * 1024))} MB.`)
  }
  return file
}

export async function decodeAudioFile(file, sampleRate = DEFAULT_SAMPLE_RATE, limits = AUDIO_LIMITS) {
  validateAudioFile(file, limits)
  const audioContext = new AudioContext()

  try {
    const decoded = await audioContext.decodeAudioData(await file.arrayBuffer())
    if (decoded.duration > limits.maxDurationSeconds) {
      throw new Error(`Audio recordings must be shorter than ${Math.round(limits.maxDurationSeconds / 60)} minutes.`)
    }
    const audio = new Float32Array(decoded.length)

    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const channelData = decoded.getChannelData(channel)
      for (let index = 0; index < channelData.length; index += 1) {
        audio[index] += channelData[index] / decoded.numberOfChannels
      }
    }

    return resampleAudio(audio, decoded.sampleRate, sampleRate)
  } finally {
    await audioContext.close()
  }
}

export function getSupportedRecordingMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}
