# Evaluation

This directory is reserved for reproducible transcription accuracy, translation quality, latency, and memory measurements. Keep generated results out of Git and document dataset licenses before adding fixtures.

The evaluator validates record IDs and required fields, then reports per-example, weighted aggregate, and metadata breakdowns for word error rate (WER) and character error rate (CER):

```bash
npm run evaluate:fixture
```

Translation smoke evaluation is available with a chrF-style character F-score and exact-match rate:

```bash
npm run evaluate:translation
```

Quality gates turn those reports into explicit pass/fail checks. The checked-in thresholds are smoke-test thresholds only; production benchmark thresholds must be reviewed for each dataset and model:

```bash
npm run check:transcription
npm run check:translation
```

For a real benchmark, provide the input explicitly and set thresholds appropriate to the dataset:

```bash
node scripts/check-evaluation.js --type transcription \
  --input evaluation/results/my-test.json --max-wer 0.15 --max-cer 0.08 --min-examples 100
```

The command exits non-zero when any requested threshold fails, making it suitable for CI. It never treats a missing threshold as a pass condition.

These lightweight metrics are deterministic regression signals. They are not a substitute for a standardized translation benchmark such as sacreBLEU on a licensed, representative dataset.

Evaluate another JSON file with the same record shape:

```bash
npm run evaluate:fixture -- --input evaluation/fixtures/sample.json
```

Persist a machine-readable report for review or CI artifacts without committing it:

```bash
npm run evaluate:fixture -- --output evaluation/results/transcription.json
```

The `evaluation/results/` directory is intentionally ignored by Git. Keep the input dataset, provenance, model version, device profile, and command invocation alongside any externally archived report.

CI writes the three sample reports to this directory and uploads them as a workflow artifact, so a passing or failing run can be inspected after completion.

Each record must contain a unique `id`, string `reference`, and string `hypothesis`. When `model` is present, provide its immutable `modelRevision`. Optional `language`, `model`, `condition`, `accent`, `noiseCondition`, and `speakerGroup` fields produce weighted breakdowns for slice-level analysis.

For real benchmark data, use the provenance envelope documented in [`DATASET_SCHEMA.md`](DATASET_SCHEMA.md). It requires a dataset ID, source, license, consent status, and split, and preserves those fields in every generated report.

Performance inputs are validated before summarization: each run must include positive `audioDurationSeconds` and non-negative `elapsedMs`; cache state must be `cold`, `warm`, or `unknown`.

After a local transcription, use the chart-line action beside the transcript download controls to export one metrics-only run as `freescribe-performance-run.json`. The export contains model revision, cache state, timing, memory diagnostics, and browser capability hints; it intentionally excludes audio and transcript content. Combine exported runs into the envelope described in [`PERFORMANCE_SCHEMA.md`](PERFORMANCE_SCHEMA.md) before summarizing them.

To combine multiple exported runs reproducibly, repeat `--input`; all inputs must share benchmark, source, device-profile, and browser metadata:

```bash
node scripts/merge-performance.js \
  --input runs/laptop-01.json \
  --input runs/laptop-02.json \
  --output evaluation/results/laptop-benchmark.json
npm run summarize:performance -- --input evaluation/results/laptop-benchmark.json
```

The merge command rejects mixed provenance instead of producing an aggregate that combines incomparable devices or browsers.

Use the provenance envelope documented in [`PERFORMANCE_SCHEMA.md`](PERFORMANCE_SCHEMA.md) for real device measurements so benchmark identity, source, device profile, and browser version are retained in the report.

The included fixture is synthetic and is only a pipeline sanity check. It is not evidence of model quality. Real evaluation should use consented or public audio with licensed reference transcripts, separated by language, accent, noise condition, model, and device profile. Aggregate rates are weighted by reference length rather than averaging per-example percentages.

The checked-in `dev.sample.json` and `test.sample.json` files are synthetic split-audit fixtures only. They prove that CI exercises leakage detection; they are not model-quality evidence.

Before evaluating multiple splits, audit them for leakage:

```bash
node scripts/audit-dataset.js --input data/dev.json --input data/test.json
```

The audit rejects duplicate record IDs and speaker groups appearing across splits. Use non-identifying `speakerGroup` values to make this check possible without storing personal information.
