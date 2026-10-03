# FreeScribe Architecture

FreeScribe is a client-only React application. Audio is selected or recorded in the browser, decoded to 16 kHz PCM, and sent to a Web Worker. The worker runs Whisper through Transformers.js so model inference does not block the UI thread. Translation runs in a separate worker using NLLB.

The ML runtime is `@huggingface/transformers`; inference uses its public pipeline output and documented 30-second chunking with 5-second stride options. The worker emits a typed lifecycle event when local inference begins, but intentionally does not display a fabricated numeric inference percentage because the runtime does not provide one. The product defaults to multilingual Whisper and maintains a curated source-language registry focused on major Indian/South Asian and world languages. Transcription source languages and NLLB translation target languages are maintained as separate registries because NLLB supports a wider target-language set than the Whisper source-language UI.

```text
Audio input -> validation and decoding -> Whisper worker
           -> timestamped transcript -> optional translation worker
           -> copy/download/export
```

Audio preprocessing explicitly mixes channels to mono and resamples to 16 kHz before inference. This avoids relying on a browser honoring an `AudioContext` sample-rate hint.

The normalized PCM buffer is transferred to the Whisper worker using a transferable `ArrayBuffer`, avoiding an additional structured-clone copy for large recordings.

After successful inference, the UI releases its source `File`/recorded `Blob` reference. Error and cancellation paths retain the source temporarily to support retry without another user upload.

## Design rules

1. UI components should not own audio decoding or model lifecycle logic.
2. Workers communicate with explicit message types and must report errors.
3. Audio and model resources must be released when a task ends or is cancelled.
4. Every user-visible asynchronous operation needs loading, success, and failure states.
5. Real recordings and transcripts must never be committed to the repository.
6. All model workers are accessed through the tested worker client boundary, which owns subscriptions, errors, message sending, and termination.
7. Each transcription and translation request uses a tested generation gate; callbacks from canceled or superseded requests are ignored.
8. Failed model-load promises are evicted from worker caches so a transient download/runtime error can be retried.
9. Audio decode submissions use a generation gate so reset/cancel actions cannot publish stale audio after an asynchronous decode completes.
10. Cancellation terminates the active transcription worker and lazily recreates it for the next run, releasing long-running inference resources while retaining cached model files.

## Planned boundaries

- `src/services/audio/`: validation, decoding, resampling, and media cleanup.
- `src/utils/*.worker.js`: model inference only; no UI concerns.
- `src/components/` and `src/App.jsx`: feature state and user interactions.
- `src/services/storage/`: IndexedDB project persistence behind a schema-normalizing boundary.
- `evaluation/`: reproducible quality and performance measurements.

The current workspace implementation stores versioned transcript projects in browser IndexedDB, including transcript segments, translation, model ID, spoken-language ID, and performance metrics. The storage boundary is isolated in `src/services/storage/projectStore.js`, so future schema migrations, encrypted storage, or a server-backed storage mode can be introduced without coupling persistence to React components.

## Verification layers

- Pure unit tests cover domain logic, metrics, reducers, audio validation, and storage.
- Component tests run in a jsdom browser-like environment and cover recording cleanup, editable transcripts, project loading/deletion, storage normalization, and privacy controls.
- Playwright smoke tests cover application boot, accessible controls, upload model/language selection, and reopening a saved translated project.
- CI runs security audit, tests, evaluation, end-to-end tests, lint, and the production build for every push and pull request.
