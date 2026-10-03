# Scripts

Project maintenance, benchmark, and fixture-generation scripts belong here. Scripts should be deterministic, documented, and safe to run from a clean checkout.

- `evaluate-fixture.js` evaluates a transcript dataset and reports WER/CER.
- `evaluate-translation-fixture.js` evaluates translation fixtures with exact-match and chrF-style character scores.
- `summarize-performance.js` summarizes recorded latency and real-time-factor runs.
- `merge-performance.js` merges metrics-only performance envelopes with matching provenance metadata.
- `check-evaluation.js` applies explicit pass/fail quality thresholds to transcription or translation reports.
- `audit-dataset.js` checks cross-split record and speaker-group leakage before benchmark evaluation.

All three scripts print JSON to stdout. Pass `--output evaluation/results/<name>.json` to persist the exact report as an ignored artifact for CI or local comparison:

```bash
npm run evaluate:fixture -- --input evaluation/fixtures/sample.json --output evaluation/results/transcription.json
npm run evaluate:translation -- --output evaluation/results/translation.json
npm run summarize:performance -- --output evaluation/results/performance.json
node scripts/merge-performance.js --input evaluation/fixtures/performance.sample.json --input evaluation/fixtures/performance.sample.json --output evaluation/results/merged-performance.json
node scripts/check-evaluation.js --type transcription --input evaluation/fixtures/sample.json --max-wer 0.2 --min-examples 1
node scripts/audit-dataset.js --input data/dev.json --input data/test.json
```
