import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_SPEECH_MODEL,
  LANGUAGE_DETECTION_MODEL,
  SPEECH_MODELS,
  TRANSCRIPTION_LANGUAGES,
  TRANSLATION_LANGUAGES,
  TRANSLATION_MODEL,
} from '../src/services/models/modelConfig.js'

const outputPath = fileURLToPath(new URL('../LANGUAGE_SUPPORT.md', import.meta.url))
const checkOnly = process.argv.slice(2).includes('--check')

function cell(value) {
  return String(value).replaceAll('|', '\\|')
}

function row(values) {
  return `| ${values.map(cell).join(' | ')} |`
}

const manualLanguages = TRANSCRIPTION_LANGUAGES.filter((language) => !language.isAuto)
const englishModels = SPEECH_MODELS.filter((model) => !model.supportsMultilingual)
const multilingualModels = SPEECH_MODELS.filter((model) => model.supportsMultilingual)

const lines = [
  '# Language and model support',
  '',
  '> Generated from `src/services/models/modelConfig.js` and `src/utils/presets.js`.',
  '> Edit those registries, then run `npm run docs:languages`. `npm run check:languages`',
  '> (also included in `npm run verify`) fails if this page is stale.',
  '',
  '## What “supported” means here',
  '',
  'The tables below describe **selectable options**, not measured accuracy. No representative',
  'multilingual speech or language-pair translation benchmark has been published yet.',
  'Treat every listed language pair as **unvalidated** until a licensed or consented evaluation',
  'reports its results. See [quality tracking](https://github.com/DineshDhanoki/FreeScribe/issues/2),',
  '[the evaluation plan](evaluation/LANGUAGE_QUALITY_PLAN.md), and the [model card](MODEL_CARD.md).',
  '',
  '## Speech recognition models',
  '',
  row(['UI option', 'Model ID', 'Pinned revision', 'Selectable spoken languages', 'Approximate first download']),
  row(['---', '---', '---', '---', '---']),
  ...SPEECH_MODELS.map((model) => row([
    `${model.label}${model.id === DEFAULT_SPEECH_MODEL ? ' (default)' : ''}`,
    `\`${model.id}\``,
    `\`${model.revision}\``,
    model.supportsMultilingual ? `The ${manualLanguages.length} manual languages below, plus Auto-detect` : 'English only; Auto-detect is disabled',
    model.approximateSize,
  ])),
  '',
  `English-only options: ${englishModels.map((model) => `\`${model.id}\``).join(', ')}.`,
  `Multilingual options: ${multilingualModels.map((model) => `\`${model.id}\``).join(', ')}.`,
  'Choosing an English-only checkpoint resets a non-English selection to English.',
  'Download sizes are approximate UI hints, not a disk-space or memory guarantee.',
  '',
  '## Selectable spoken languages',
  '',
  `The multilingual speech-model UI offers ${manualLanguages.length} explicit spoken languages.`,
  'The NLLB code in this table is used as the translation **source** code after transcription;',
  'it does not prove that recognition or translation is accurate for that language.',
  '',
  row(['Spoken language', 'UI code', 'Whisper code', 'NLLB source code']),
  row(['---', '---', '---', '---']),
  ...manualLanguages.map((language) => row([
    language.label,
    `\`${language.id}\``,
    `\`${language.whisper}\``,
    `\`${language.nllb}\``,
  ])),
  '',
  'Auto-detect is an additional UI option, not a language. It loads the separate local',
  `\`${LANGUAGE_DETECTION_MODEL.id}\` classifier at pinned revision \`${LANGUAGE_DETECTION_MODEL.revision}\``,
  'and analyzes up to the first 15 seconds. If its top result cannot be mapped to a selectable',
  'spoken language, FreeScribe asks for manual selection. A detector confidence score is not',
  'transcript accuracy; short, noisy, or code-switched audio may be misidentified.',
  '',
  '## Translation',
  '',
  `FreeScribe uses \`${TRANSLATION_MODEL.id}\` at pinned revision \`${TRANSLATION_MODEL.revision}\`.`,
  `Its UI lists ${TRANSLATION_LANGUAGES.length} target options from the NLLB registry below.`,
  'Only the spoken languages above are selectable as translation **sources** in the current',
  'workflow. Listing a target does not establish quality or guarantee that every source/target',
  'pair works equally well. The NLLB model has a separate `cc-by-nc-4.0` license;',
  'review model terms before commercial use. The app does not publish an approximate',
  'translation-model download size.',
  '',
  row(['Target option', 'NLLB target code']),
  row(['---', '---']),
  ...TRANSLATION_LANGUAGES.map((language) => row([language.label, `\`${language.nllb}\``])),
  '',
  '## Browser and device limits',
  '',
  '- Inference runs in browser Web Workers; model files download on first use and may be cached',
  '  for later runs. First use requires the model host to be reachable.',
  '- Microphone recording requires browser media permissions and a compatible `MediaRecorder`',
  '  format. Upload/decode support depends on the browser codec implementation.',
  '- Input is limited to 200 MB and 30 minutes. These limits do **not** guarantee that a long',
  '  recording fits device memory or completes quickly, particularly on mobile devices.',
  '- Speed, memory use, and quality vary by device, browser, accent, noise, and model.',
  '  See [performance](PERFORMANCE.md) and [privacy](PRIVACY.md).',
  '- Model downloads come from external model hosting, but FreeScribe does not intentionally',
  '  send user audio or transcript text to a FreeScribe backend.',
  '',
  '## Adding a language',
  '',
  '1. Add the Whisper and NLLB identifiers to the shared model registry. Add a target entry',
  '   to `src/utils/presets.js` only if the NLLB target selector also needs it.',
  '2. Add mapping tests and run `npm run docs:languages` to refresh this matrix.',
  '3. Run `npm run verify`. Supply licensed or consented evaluation data—or clearly state',
  '   that the new option has not been quality-validated.',
  '',
]

const markdown = `${lines.join('\n').trimEnd()}\n`

if (checkOnly) {
  let current = ''
  try {
    current = readFileSync(outputPath, 'utf8')
  } catch {
    // A missing generated page is out of date too.
  }
  if (current !== markdown) {
    console.error('LANGUAGE_SUPPORT.md is stale. Run npm run docs:languages and commit the result.')
    process.exitCode = 1
  } else {
    console.log('LANGUAGE_SUPPORT.md matches the language/model registries.')
  }
} else {
  writeFileSync(outputPath, markdown)
  console.log(`Updated ${outputPath}`)
}
