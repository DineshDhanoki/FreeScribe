import { pipeline } from '@huggingface/transformers'
import { isTranslationRequest, TranslationMessageType, WorkerMessageType } from '../services/workers/protocol'
import { createRequestGate } from '../services/workers/requestGate'
import { getTranslationLanguage, TRANSLATION_MODEL } from '../services/models/modelConfig'

class TranslationPipeline {
    static task = TRANSLATION_MODEL.task
    static model = TRANSLATION_MODEL.id
    static instance = null

    static async getInstance(progressCallback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback: progressCallback, revision: TRANSLATION_MODEL.revision }).catch((error) => {
                this.instance = null
                throw error
            })
        }
        return this.instance
    }
}

const requestGate = createRequestGate()

self.addEventListener('message', async (event) => {
    if (event.data?.type === WorkerMessageType.CANCEL) {
        requestGate.invalidate()
        return
    }

    if (!isTranslationRequest(event.data)) {
        self.postMessage({ type: TranslationMessageType.ERROR, message: 'Invalid translation request.' })
        return
    }
    if (!getTranslationLanguage(event.data.src_lang) || !getTranslationLanguage(event.data.tgt_lang)) {
        self.postMessage({ type: TranslationMessageType.ERROR, message: 'Unsupported translation language.' })
        return
    }

    const requestId = requestGate.begin()
    try {
        self.postMessage({ type: TranslationMessageType.INITIATE })
        const translator = await TranslationPipeline.getInstance((progress) => {
            if (!requestGate.isActive(requestId)) return
            const value = typeof progress === 'number' ? progress : Number(progress?.progress)
            if (Number.isFinite(value)) self.postMessage({ type: TranslationMessageType.PROGRESS, progress: value })
        })
        if (!requestGate.isActive(requestId)) return
        const result = await translator(event.data.text, {
            tgt_lang: event.data.tgt_lang,
            src_lang: event.data.src_lang,
        })
        if (!requestGate.isActive(requestId)) return
        const text = Array.isArray(result)
            ? result.map((item) => item.translation_text || item.text || '').join(' ').trim()
            : result?.translation_text || result?.text || String(result || '')

        self.postMessage({ type: TranslationMessageType.UPDATE, output: text })
        self.postMessage({ type: TranslationMessageType.COMPLETE, output: text })
    } catch (error) {
        if (requestGate.isActive(requestId)) self.postMessage({
            type: TranslationMessageType.ERROR,
            message: error.message || 'Translation failed.',
        })
    }
})
