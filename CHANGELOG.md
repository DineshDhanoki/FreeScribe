# Changelog

## Unreleased

- Added validated transcript-dataset evaluation with WER/CER metadata breakdowns and deterministic performance summaries (median, p95, and cold/warm cache slices).
- Added configurable transcription and translation quality gates that fail CI when explicit benchmark thresholds regress.
- Extended benchmark reports with accent, noise-condition, and non-identifying speaker-group slices for real-world error analysis.
- Added metrics-only local benchmark export for collecting reproducible device runs without exporting audio or transcript text.
- Added typed inference lifecycle messaging and clearer decoding, model-download, and local-transcription progress states.
- Made transcription cancellation terminate the active worker and recreate it lazily for the next run.
- Added sanitized project JSON backup import/export without source-audio inclusion.
- Added reproducible multi-file performance merging with provenance consistency checks.
- Hardened benchmark validation against empty references and unpinned named models.
- Applied pinned model-revision requirements consistently to translation benchmark records.
- Added cross-split dataset auditing for duplicate records and speaker-group leakage.
- Added synthetic dev/test audit fixtures so leakage detection runs in the default verification and CI workflows.
- Made transcription cancellation terminate the active worker and recreate it lazily for the next run.
- Added project-library focus management, retry-preserving error recovery, confirmation-gated bulk deletion, explicit IndexedDB schema normalization, and source-audio reference cleanup after successful inference.
- Added typed translation-worker protocol validation and expanded browser smoke coverage.
- Added architecture, privacy, model, security, contribution, and roadmap documentation.
- Added explicit transcription workflow state and automated tests.
- Improved local audio decoding, recording cleanup, worker error handling, and CI verification.
- Added IndexedDB project persistence, local project loading, performance instrumentation, browser-like component tests, and accessible error/copy feedback.
- Migrated from deprecated `@xenova/transformers` to maintained `@huggingface/transformers` and removed private ASR callback internals.
- Pinned active Whisper and NLLB model revisions and included the revision in transcription metrics.
- Hardened local project restoration by allowlisting persisted model and language identifiers.
- Added regression coverage for untrusted project metadata.
