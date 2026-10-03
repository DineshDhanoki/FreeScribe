# Model Card

## Speech recognition

- Default model ID: `Xenova/whisper-tiny.en`
- Task: automatic speech recognition
- Current scope: explicit language selection for English, Spanish, French, German, Hindi, Japanese, Portuguese, and Chinese when using a multilingual model.
- Runtime: `@huggingface/transformers` in a Web Worker
- Input preprocessing: channel mixing to mono and explicit resampling to 16 kHz.
- Model revisions are pinned in `src/services/models/modelConfig.js`; update them deliberately and rerun evaluation before release.

The tiny English model is useful for a lightweight demonstration, but it is not sufficient for high-accuracy, multilingual, clinical, legal, or safety-critical transcription. Accuracy varies with accent, noise, microphone quality, speaking rate, and domain vocabulary.

The UI also exposes the multilingual tiny model and the larger English base model. These options trade download size and latency for language coverage or accuracy; they are not yet backed by a benchmark report.

## Translation

- Model ID: `Xenova/nllb-200-distilled-600M` (defined in `src/services/models/modelConfig.js`)
- Model revision is pinned alongside the model ID in the shared registry.
- Source language: selected transcription language, mapped through `src/services/models/modelConfig.js`.
- Target languages: configured in `src/utils/presets.js` and validated through the translation registry in `src/services/models/modelConfig.js`.
- The translation worker uses NLLB language codes and does not claim that every configured language pair has equal quality.

Translation quality must be measured by language pair before making accuracy claims. Model licenses and hosting terms must be reviewed before commercial distribution.
