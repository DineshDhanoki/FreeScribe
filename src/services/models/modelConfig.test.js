import { describe, expect, it } from 'vitest'
import { DEFAULT_SPEECH_MODEL, getSpeechModel, getTranslationLanguage, getTranscriptionLanguage, getTranscriptionLanguageByDetectionLabel, isSupportedSpeechModel, isSupportedWhisperLanguage, SPEECH_MODELS, TRANSLATION_MODEL } from './modelConfig'

describe('speech model configuration', () => {
  it('has a documented default model', () => {
    expect(getSpeechModel(DEFAULT_SPEECH_MODEL)).toMatchObject({ id: DEFAULT_SPEECH_MODEL, revision: expect.stringMatching(/^[a-f0-9]{40}$/) })
    expect(getSpeechModel(DEFAULT_SPEECH_MODEL).supportsMultilingual).toBe(true)
    expect(DEFAULT_SPEECH_MODEL).toBe('Xenova/whisper-base')
  })

  it('falls back safely for unknown models', () => {
    expect(getSpeechModel('missing-model')).toEqual(SPEECH_MODELS[0])
  })

  it('maps the selected transcription language to Whisper and NLLB codes', () => {
    expect(getTranscriptionLanguage('hi')).toMatchObject({ whisper: 'hindi', nllb: 'hin_Deva' })
    expect(getTranscriptionLanguage('ta')).toMatchObject({ whisper: 'tamil', nllb: 'tam_Taml' })
    expect(getTranscriptionLanguage('bn')).toMatchObject({ whisper: 'bengali', nllb: 'ben_Beng' })
    expect(getTranscriptionLanguage('missing').id).toBe('en')
  })

  it('keeps the core Indian language set available in the multilingual UI', () => {
    const indianLanguageIds = ['hi', 'bn', 'mr', 'te', 'ta', 'gu', 'ur', 'kn', 'ml', 'pa', 'or', 'as', 'ne', 'sa']
    for (const languageId of indianLanguageIds) {
      const language = getTranscriptionLanguage(languageId)
      expect(language.whisper).toEqual(expect.any(String))
      expect(language.nllb).toEqual(expect.any(String))
    }
  })

  it('maps only known NLLB translation language codes', () => {
    expect(getTranslationLanguage('spa_Latn')).toMatchObject({ id: 'spa_Latn', nllb: 'spa_Latn', label: 'Spanish' })
    expect(getTranslationLanguage('afr_Latn')).toMatchObject({ nllb: 'afr_Latn', label: 'Afrikaans' })
    expect(getTranslationLanguage('unknown')).toBeNull()
  })

  it('normalizes browser language-detector labels', () => {
    expect(getTranscriptionLanguageByDetectionLabel('LABEL_12')).toMatchObject({ id: 'bn', lid: 'ben' })
    expect(getTranscriptionLanguageByDetectionLabel('__label__hin')).toMatchObject({ id: 'hi', lid: 'hin' })
    expect(getTranscriptionLanguageByDetectionLabel('LABEL_999')).toBeNull()
  })

  it('declares multilingual capability explicitly', () => {
    expect(getSpeechModel('Xenova/whisper-tiny.en').supportsMultilingual).toBe(false)
    expect(getSpeechModel('Xenova/whisper-tiny').supportsMultilingual).toBe(true)
  })

  it('keeps the active translation model in the shared registry', () => {
    expect(TRANSLATION_MODEL).toMatchObject({ id: 'Xenova/nllb-200-distilled-600M', task: 'translation', revision: expect.stringMatching(/^[a-f0-9]{40}$/) })
  })

  it('exposes strict runtime allowlists', () => {
    expect(isSupportedSpeechModel(DEFAULT_SPEECH_MODEL)).toBe(true)
    expect(isSupportedSpeechModel('https://attacker.invalid/model')).toBe(false)
    expect(isSupportedWhisperLanguage('hindi')).toBe(true)
    expect(isSupportedWhisperLanguage('javascript')).toBe(false)
  })
})
