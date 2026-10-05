import { pipeline } from '@huggingface/transformers'
import { MessageTypes } from './presets'
import { isTranscriptionRequest, WorkerMessageType } from '../services/workers/protocol'
import { createRequestGate } from '../services/workers/requestGate'
import { normalizeWhisperOutput } from '../services/transcription/whisperOutput'
import {
    DEFAULT_SPEECH_MODEL,
    getSpeechModel,
    getTranscriptionLanguageByDetectionLabel,
    isSupportedSpeechModel,
    isSupportedWhisperLanguage,
    LANGUAGE_DETECTION_MODEL,
} from '../services/models/modelConfig'

class TranscriptionPipeline {
    static task = 'automatic-speech-recognition'
    static defaultModel = DEFAULT_SPEECH_MODEL
    static instances = new Map()

    static async getInstance(modelName = this.defaultModel, revision = 'main', progressCallback = null) {
        const cacheKey = `${modelName}@${revision}`
        if (!this.instances.has(cacheKey)) {
            const instance = pipeline(this.task, modelName, { progress_callback: progressCallback, revision }).catch((error) => {
                this.instances.delete(cacheKey)
                throw error
            })
            this.instances.set(cacheKey, instance)
        }
        return this.instances.get(cacheKey)
    }
}

class LanguageDetectionPipeline {
    static instance = null

    static async getInstance(progressCallback = null) {
        if (this.instance === null) {
            this.instance = pipeline(LANGUAGE_DETECTION_MODEL.task, LANGUAGE_DETECTION_MODEL.id, {
                progress_callback: progressCallback,
                revision: LANGUAGE_DETECTION_MODEL.revision,
            }).catch((error) => {
                this.instance = null
                throw error
            })
        }
        return this.instance
    }
}

const requestGate = createRequestGate()

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data
    if (type === WorkerMessageType.CANCEL) {
        requestGate.invalidate()
        return
    }
    if (type === MessageTypes.INFERENCE_REQUEST) {
        if (!isTranscriptionRequest(event.data)) {
            self.postMessage({ type: WorkerMessageType.ERROR, message: 'Invalid transcription request.' })
            return
        }
        if (event.data.model_name && !isSupportedSpeechModel(event.data.model_name)) {
            self.postMessage({ type: WorkerMessageType.ERROR, message: 'Unsupported transcription model.' })
            return
        }
        if (event.data.language && !isSupportedWhisperLanguage(event.data.language)) {
            self.postMessage({ type: WorkerMessageType.ERROR, message: 'Unsupported transcription language.' })
            return
        }
        const requestId = requestGate.begin()
        await transcribe(audio, getSpeechModel(event.data.model_name), event.data.language, requestId)
    }
})

async function transcribe(audio, model, language, requestId) {
    sendLoadingMessage('loading', requestId)

    try {
        const transcriber = await TranscriptionPipeline.getInstance(model.id, model.revision, loadModelCallback)
        if (!isActive(requestId)) return
        sendLoadingMessage('ready', requestId)

        let detectedLanguage = language
        if (model.supportsMultilingual && !detectedLanguage) {
            detectedLanguage = await detectLanguage(audio, requestId)
            if (!isActive(requestId)) return
        }

        self.postMessage({ type: WorkerMessageType.INFERENCE_PROGRESS, phase: 'transcribing' })

        const generationOptions = {
            chunk_length_s: 30,
            stride_length_s: 5,
            return_timestamps: true,
        }

        // English-only Whisper checkpoints reject language/task generation options.
        // Multilingual checkpoints require them to select the intended decoding mode.
        if (model.supportsMultilingual) {
            generationOptions.language = detectedLanguage
            generationOptions.task = 'transcribe'
        }

        const output = await transcriber(audio, generationOptions)
        if (!isActive(requestId)) return

        const results = normalizeWhisperOutput(output)

        self.postMessage({ type: MessageTypes.RESULT, results, isDone: false })
        self.postMessage({ type: MessageTypes.INFERENCE_DONE })
    } catch (error) {
        if (isActive(requestId)) {
            self.postMessage({ type: WorkerMessageType.ERROR, message: error.message || 'Transcription failed.' })
        }
    }
}

async function detectLanguage(audio, requestId) {
    self.postMessage({ type: WorkerMessageType.INFERENCE_PROGRESS, phase: 'detecting' })
    const classifier = await LanguageDetectionPipeline.getInstance(loadModelCallback)
    if (!isActive(requestId)) return null

    // A short leading window keeps detection responsive while retaining enough
    // speech for the classifier to distinguish closely related languages.
    const sample = audio.slice(0, Math.min(audio.length, 15 * 16000))
    const predictions = await classifier(sample, { top_k: 5 })
    if (!isActive(requestId)) return null

    const candidates = Array.isArray(predictions) ? predictions : [predictions]
    const match = candidates
        .map((prediction) => ({
            language: getTranscriptionLanguageByDetectionLabel(prediction?.label),
            confidence: Number(prediction?.score),
        }))
        .filter((prediction) => prediction.language && Number.isFinite(prediction.confidence))
        .sort((left, right) => right.confidence - left.confidence)[0]

    if (!match) {
        throw new Error('Automatic language detection could not identify a supported language. Please select it manually.')
    }

    self.postMessage({
        type: WorkerMessageType.LANGUAGE_DETECTED,
        languageId: match.language.id,
        confidence: match.confidence,
    })
    return match.language.whisper
}

function isActive(requestId) {
    return requestGate.isActive(requestId)
}

function loadModelCallback(data) {
    if (data.status === 'progress') {
        self.postMessage({
            type: MessageTypes.DOWNLOADING,
            file: data.file,
            progress: data.progress,
            loaded: data.loaded,
            total: data.total,
        })
    }
}

function sendLoadingMessage(status, requestId) {
    if (isActive(requestId)) self.postMessage({ type: MessageTypes.LOADING, status })
}
