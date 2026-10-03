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

export const TRANSCRIPTION_LANGUAGES = Object.freeze([
  { id: 'en', label: 'English', whisper: 'english', nllb: 'eng_Latn' },
  { id: 'hi', label: 'Hindi', whisper: 'hindi', nllb: 'hin_Deva' },
  { id: 'bn', label: 'Bengali', whisper: 'bengali', nllb: 'ben_Beng' },
  { id: 'mr', label: 'Marathi', whisper: 'marathi', nllb: 'mar_Deva' },
  { id: 'te', label: 'Telugu', whisper: 'telugu', nllb: 'tel_Telu' },
  { id: 'ta', label: 'Tamil', whisper: 'tamil', nllb: 'tam_Taml' },
  { id: 'gu', label: 'Gujarati', whisper: 'gujarati', nllb: 'guj_Gujr' },
  { id: 'ur', label: 'Urdu', whisper: 'urdu', nllb: 'urd_Arab' },
  { id: 'kn', label: 'Kannada', whisper: 'kannada', nllb: 'kan_Knda' },
  { id: 'ml', label: 'Malayalam', whisper: 'malayalam', nllb: 'mal_Mlym' },
  { id: 'pa', label: 'Punjabi', whisper: 'punjabi', nllb: 'pan_Guru' },
  { id: 'or', label: 'Odia', whisper: 'odia', nllb: 'ory_Orya' },
  { id: 'as', label: 'Assamese', whisper: 'assamese', nllb: 'asm_Beng' },
  { id: 'ne', label: 'Nepali', whisper: 'nepali', nllb: 'npi_Deva' },
  { id: 'sa', label: 'Sanskrit', whisper: 'sanskrit', nllb: 'san_Deva' },
  { id: 'es', label: 'Spanish', whisper: 'spanish', nllb: 'spa_Latn' },
  { id: 'fr', label: 'French', whisper: 'french', nllb: 'fra_Latn' },
  { id: 'de', label: 'German', whisper: 'german', nllb: 'deu_Latn' },
  { id: 'it', label: 'Italian', whisper: 'italian', nllb: 'ita_Latn' },
  { id: 'pt', label: 'Portuguese', whisper: 'portuguese', nllb: 'por_Latn' },
  { id: 'ru', label: 'Russian', whisper: 'russian', nllb: 'rus_Cyrl' },
  { id: 'ar', label: 'Arabic', whisper: 'arabic', nllb: 'arb_Arab' },
  { id: 'ja', label: 'Japanese', whisper: 'japanese', nllb: 'jpn_Jpan' },
  { id: 'ko', label: 'Korean', whisper: 'korean', nllb: 'kor_Hang' },
  { id: 'zh', label: 'Chinese', whisper: 'chinese', nllb: 'zho_Hans' },
  { id: 'id', label: 'Indonesian', whisper: 'indonesian', nllb: 'ind_Latn' },
  { id: 'tr', label: 'Turkish', whisper: 'turkish', nllb: 'tur_Latn' },
  { id: 'vi', label: 'Vietnamese', whisper: 'vietnamese', nllb: 'vie_Latn' },
  { id: 'th', label: 'Thai', whisper: 'thai', nllb: 'tha_Thai' },
  { id: 'nl', label: 'Dutch', whisper: 'dutch', nllb: 'nld_Latn' },
  { id: 'pl', label: 'Polish', whisper: 'polish', nllb: 'pol_Latn' },
  { id: 'uk', label: 'Ukrainian', whisper: 'ukrainian', nllb: 'ukr_Cyrl' },
  { id: 'sw', label: 'Swahili', whisper: 'swahili', nllb: 'swh_Latn' },
])

export const TRANSLATION_LANGUAGES = Object.freeze(
  Object.entries(LANGUAGES).map(([label, nllb]) => ({ id: nllb, label, nllb })),
)

export const DEFAULT_TRANSCRIPTION_LANGUAGE = 'en'

export function getSpeechModel(modelId) {
  return SPEECH_MODELS.find((model) => model.id === modelId) || SPEECH_MODELS[0]
}

export function isSupportedSpeechModel(modelId) {
  return SPEECH_MODELS.some((model) => model.id === modelId)
}

export function getTranscriptionLanguage(languageId) {
  return TRANSCRIPTION_LANGUAGES.find((language) => language.id === languageId) || TRANSCRIPTION_LANGUAGES[0]
}

export function getTranslationLanguage(languageId) {
  return TRANSLATION_LANGUAGES.find((language) => language.nllb === languageId) || null
}

export function isSupportedWhisperLanguage(language) {
  return TRANSCRIPTION_LANGUAGES.some((item) => item.whisper === language)
}
import { LANGUAGES } from '../../utils/presets'
