export const SpeechModelId = Object.freeze({
  TINY_ENGLISH: 'Xenova/whisper-tiny.en',
  TINY_MULTILINGUAL: 'Xenova/whisper-tiny',
  BASE_ENGLISH: 'Xenova/whisper-base.en',
})

export const SPEECH_MODELS = Object.freeze([
  {
    id: SpeechModelId.TINY_ENGLISH,
    revision: '79fb389fc764e7c395bd330e9531d9d32ada7049',
    label: 'Whisper Tiny English',
    languages: ['English'],
    supportsMultilingual: false,
    approximateSize: '75 MB',
    description: 'Fastest option; English only and least accurate.',
  },
  {
    id: SpeechModelId.TINY_MULTILINGUAL,
    revision: '5332fcc35e32a33b86612b9a57a89be7906102b1',
    label: 'Whisper Tiny Multilingual',
    languages: ['Many languages'],
    supportsMultilingual: true,
    approximateSize: '75 MB',
    description: 'Fast multilingual transcription with lower accuracy.',
  },
  {
    id: SpeechModelId.BASE_ENGLISH,
    revision: '95bf40a508535962c6483ead40270b2e32267508',
    label: 'Whisper Base English',
    languages: ['English'],
    supportsMultilingual: false,
    approximateSize: '145 MB',
    description: 'Slower English transcription with improved accuracy.',
  },
])

// Multilingual is the product default so new users can select an Indian or
// international spoken language without first changing model settings.
export const DEFAULT_SPEECH_MODEL = SpeechModelId.TINY_MULTILINGUAL

export const TRANSLATION_MODEL = Object.freeze({
  id: 'Xenova/nllb-200-distilled-600M',
  revision: '261c31d1a5732c67cdd16d80e8d6088507c7ccea',
  task: 'translation',
  license: 'cc-by-nc-4.0',
})

export const LANGUAGE_DETECTION_MODEL = Object.freeze({
  id: 'Xenova/mms-lid-256',
  revision: '74c747185d407ca911d346a892241c95131d6fa3',
  task: 'audio-classification',
  license: 'cc-by-4.0',
})

// Transformers.js may expose MMS labels as LABEL_<index> when the model's
// id2label metadata is unavailable in the browser cache. Keep the supported
// language mapping local so automatic detection remains deterministic.
export const LANGUAGE_DETECTION_LABELS = Object.freeze({
  0: 'ara',
  1: 'cmn',
  2: 'eng',
  3: 'spa',
  4: 'fra',
  11: 'asm',
  12: 'ben',
  16: 'hin',
  18: 'urd',
  23: 'tel',
  29: 'mar',
  36: 'mal',
  46: 'tam',
  55: 'deu',
  70: 'pan',
  71: 'jpn',
  76: 'guj',
  77: 'kan',
  79: 'ukr',
  93: 'ita',
  127: 'san',
})

export const TRANSCRIPTION_LANGUAGES = Object.freeze([
  { id: 'auto', label: 'Auto-detect language', whisper: null, nllb: null, isAuto: true },
  { id: 'en', label: 'English', whisper: 'english', nllb: 'eng_Latn', lid: 'eng' },
  { id: 'hi', label: 'Hindi', whisper: 'hindi', nllb: 'hin_Deva', lid: 'hin' },
  { id: 'bn', label: 'Bengali', whisper: 'bengali', nllb: 'ben_Beng', lid: 'ben' },
  { id: 'mr', label: 'Marathi', whisper: 'marathi', nllb: 'mar_Deva', lid: 'mar' },
  { id: 'te', label: 'Telugu', whisper: 'telugu', nllb: 'tel_Telu', lid: 'tel' },
  { id: 'ta', label: 'Tamil', whisper: 'tamil', nllb: 'tam_Taml', lid: 'tam' },
  { id: 'gu', label: 'Gujarati', whisper: 'gujarati', nllb: 'guj_Gujr', lid: 'guj' },
  { id: 'ur', label: 'Urdu', whisper: 'urdu', nllb: 'urd_Arab', lid: 'urd' },
  { id: 'kn', label: 'Kannada', whisper: 'kannada', nllb: 'kan_Knda', lid: 'kan' },
  { id: 'ml', label: 'Malayalam', whisper: 'malayalam', nllb: 'mal_Mlym', lid: 'mal' },
  { id: 'pa', label: 'Punjabi', whisper: 'punjabi', nllb: 'pan_Guru', lid: 'pan' },
  { id: 'or', label: 'Odia', whisper: 'odia', nllb: 'ory_Orya', lid: 'ory' },
  { id: 'as', label: 'Assamese', whisper: 'assamese', nllb: 'asm_Beng', lid: 'asm' },
  { id: 'ne', label: 'Nepali', whisper: 'nepali', nllb: 'npi_Deva', lid: 'npi' },
  { id: 'sa', label: 'Sanskrit', whisper: 'sanskrit', nllb: 'san_Deva', lid: 'san' },
  { id: 'es', label: 'Spanish', whisper: 'spanish', nllb: 'spa_Latn', lid: 'spa' },
  { id: 'fr', label: 'French', whisper: 'french', nllb: 'fra_Latn', lid: 'fra' },
  { id: 'de', label: 'German', whisper: 'german', nllb: 'deu_Latn', lid: 'deu' },
  { id: 'it', label: 'Italian', whisper: 'italian', nllb: 'ita_Latn', lid: 'ita' },
  { id: 'pt', label: 'Portuguese', whisper: 'portuguese', nllb: 'por_Latn', lid: 'por' },
  { id: 'ru', label: 'Russian', whisper: 'russian', nllb: 'rus_Cyrl', lid: 'rus' },
  { id: 'ar', label: 'Arabic', whisper: 'arabic', nllb: 'arb_Arab', lid: 'ara' },
  { id: 'ja', label: 'Japanese', whisper: 'japanese', nllb: 'jpn_Jpan', lid: 'jpn' },
  { id: 'ko', label: 'Korean', whisper: 'korean', nllb: 'kor_Hang', lid: 'kor' },
  { id: 'zh', label: 'Chinese', whisper: 'chinese', nllb: 'zho_Hans', lid: 'cmn' },
  { id: 'id', label: 'Indonesian', whisper: 'indonesian', nllb: 'ind_Latn', lid: 'ind' },
  { id: 'tr', label: 'Turkish', whisper: 'turkish', nllb: 'tur_Latn', lid: 'tur' },
  { id: 'vi', label: 'Vietnamese', whisper: 'vietnamese', nllb: 'vie_Latn', lid: 'vie' },
  { id: 'th', label: 'Thai', whisper: 'thai', nllb: 'tha_Thai', lid: 'tha' },
  { id: 'nl', label: 'Dutch', whisper: 'dutch', nllb: 'nld_Latn', lid: 'nld' },
  { id: 'pl', label: 'Polish', whisper: 'polish', nllb: 'pol_Latn', lid: 'pol' },
  { id: 'uk', label: 'Ukrainian', whisper: 'ukrainian', nllb: 'ukr_Cyrl', lid: 'ukr' },
  { id: 'sw', label: 'Swahili', whisper: 'swahili', nllb: 'swh_Latn', lid: 'swh' },
])

export const TRANSLATION_LANGUAGES = Object.freeze(
  Object.entries(LANGUAGES).map(([label, nllb]) => ({ id: nllb, label, nllb })),
)

export const DEFAULT_TRANSCRIPTION_LANGUAGE = 'auto'

export function getSpeechModel(modelId) {
  return SPEECH_MODELS.find((model) => model.id === modelId) || SPEECH_MODELS[0]
}

export function isSupportedSpeechModel(modelId) {
  return SPEECH_MODELS.some((model) => model.id === modelId)
}

export function getTranscriptionLanguage(languageId) {
  return TRANSCRIPTION_LANGUAGES.find((language) => language.id === languageId)
    || TRANSCRIPTION_LANGUAGES.find((language) => language.id === 'en')
}

export function getTranscriptionLanguageByLid(label) {
  const normalizedLabel = String(label || '').trim().toLowerCase()
  return TRANSCRIPTION_LANGUAGES.find((language) => language.lid === normalizedLabel) || null
}

export function getTranscriptionLanguageByDetectionLabel(label) {
  const normalizedLabel = String(label || '').trim().toLowerCase()
  const numericLabel = normalizedLabel.match(/^label[_-](\d+)$/)
  const lid = numericLabel
    ? LANGUAGE_DETECTION_LABELS[numericLabel[1]]
    : normalizedLabel.replace(/^__label__/, '').replace(/^__|__$/g, '')

  return getTranscriptionLanguageByLid(lid)
}

export function getTranslationLanguage(languageId) {
  return TRANSLATION_LANGUAGES.find((language) => language.nllb === languageId) || null
}

export function isSupportedWhisperLanguage(language) {
  return TRANSCRIPTION_LANGUAGES.some((item) => item.whisper && item.whisper === language)
}
import { LANGUAGES } from '../../utils/presets'
