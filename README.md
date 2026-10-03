# FreeScribe

Privacy-first, browser-based speech transcription and translation.

FreeScribe records or uploads audio, runs Whisper locally in a Web Worker, and optionally translates the resulting transcript locally with NLLB. It is currently an alpha prototype and is not intended for clinical, legal, or other safety-critical use.

## Run locally

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm test
npm run lint
npm run build
npm run evaluate:fixture
npm run evaluate:translation
npm run summarize:performance
```

Evaluation commands also accept `--output evaluation/results/report.json` to save JSON reports locally; generated results are ignored by Git.

The first transcription or translation downloads model files and may require significant memory and bandwidth.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Privacy](PRIVACY.md)
- [Model card](MODEL_CARD.md)
- [Product roadmap](PRODUCT_ROADMAP.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Performance](PERFORMANCE.md)
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Governance](GOVERNANCE.md)
- [Getting help](SUPPORT.md)
- [License](LICENSE)

## Current limitations

- Multilingual transcription defaults to `Xenova/whisper-tiny` and exposes major Indian/South Asian languages (including Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Malayalam, Punjabi, Odia, Assamese, Nepali and Sanskrit) plus major world languages. English-only models intentionally restrict language selection.
- Translation quality and supported source/target language pairs depend on the selected NLLB model configuration.
- Browser support, model performance, and accuracy vary by device and audio quality.
- No server-side storage is provided.
- Saved projects use browser IndexedDB and remain on the current device/browser.
- Audio input is limited to 200 MB and 30 minutes per recording.

Never commit real recordings, patient information, or private transcripts.

## License

FreeScribe's original source code is licensed under the MIT License. The
Whisper and NLLB model files downloaded at runtime are separate dependencies
and remain subject to their respective model licenses and usage restrictions.
