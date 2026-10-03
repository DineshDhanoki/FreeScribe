# Performance and Benchmarking

FreeScribe records per-run client-side transcription metrics:

- audio duration in seconds;
- wall-clock elapsed time;
- real-time factor (audio seconds processed per elapsed second);
- available device hints such as logical CPU count and device memory.
- optional model ID and cache state (`cold`, `warm`, or `unknown`).
- best-effort JavaScript heap snapshots when the browser exposes `performance.memory`.

The real-time factor is displayed with completed transcripts as a measurement of the complete browser workflow, not a model-only benchmark. It includes model loading when the model is not cached, audio transfer to the worker, inference, and result handling.

PCM audio is transferred to the worker rather than cloned, reducing the peak memory cost of the handoff.

## Benchmark protocol

For comparable measurements:

1. Use the same browser version and device profile.
2. Record whether the model cache was warm or cold.
3. Use licensed, consented audio fixtures with known duration.
4. Run each fixture at least three times and report median and average values.
5. Report model ID and pinned revision, browser, device hints, audio duration, elapsed time, real-time factor, and cache state.
6. Do not interpret the synthetic evaluation fixture as a quality benchmark.

Performance data is currently displayed locally and is not transmitted to a server.

Completed runs can be exported from the results view as a metrics-only JSON envelope. This supports consent-aware collection of real-device measurements while keeping source audio and transcript text out of the benchmark artifact.

Memory snapshots are optional browser diagnostics, not a portable measurement of total process memory. Browsers that do not expose heap metrics record `null` and do not fail transcription.

## Benchmark summaries

`summarizeTranscriptionMetrics` produces aggregate, median, and p95 latency and real-time-factor statistics. It emits separate summaries for cache state and model-plus-revision, which prevents warm-cache runs or incompatible model artifacts from being combined. Percentiles use linear interpolation over sorted runs and are deterministic for the same input.

The checked-in sample can be summarized with:

```bash
npm run summarize:performance
```

Use another JSON array with `npm run summarize:performance -- --input path/to/runs.json`. The command summarizes recorded runs; it does not download models or claim that the sample values represent device performance.
