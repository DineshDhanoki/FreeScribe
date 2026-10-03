# Product Roadmap

## Milestone 1: dependable core — complete

- Reliable microphone recording and file upload.
- Explicit loading and error states.
- Local transcription with timestamps.
- Copy and text export.
- Basic browser compatibility documentation.

## Milestone 2: usable workspace — complete

- Editable transcript segments.
- SRT, VTT, and JSON export.
- Project persistence with IndexedDB.
- Cancel and retry controls.
- Model and language selection.

## Milestone 3: measurable AI quality — scaffolding complete, real-data validation pending

- [x] Synthetic evaluation fixture and validated dataset contract.
- [x] Weighted WER/CER reports with language/model/condition breakdowns.
- [x] Deterministic translation smoke metrics and fixture CLI.
- [x] Performance summaries with median, p95, and cold/warm cache slices.
- [x] Regression checks in CI.
- [x] CI uploads machine-readable evaluation reports as reviewable artifacts.
- [ ] Public or consented multilingual audio fixtures.
- [ ] Translation-quality benchmark reports.
- [ ] Real memory measurements across representative devices.

## Milestone 4: advanced capabilities — planned

- Speaker diarization.
- Streaming transcription.
- Better long-audio handling.
- Optional server-side acceleration with an explicit privacy mode.
