# Performance input contract

Performance summaries accept an array of runs or a provenance envelope with a `runs` array:

```json
{
  "metadata": {
    "benchmarkId": "whisper-laptop-v1",
    "source": "public or consented fixture",
    "deviceProfile": "documented hardware profile",
    "browser": "documented browser version"
  },
  "runs": [
    {
      "capturedAt": "2026-01-01T00:00:00.000Z",
      "modelId": "Xenova/whisper-tiny.en",
      "modelRevision": "verified immutable model revision",
      "cacheState": "cold",
      "audioDurationSeconds": 10,
      "elapsedMs": 12000,
      "realTimeFactor": 0.8333333333,
      "device": {
        "hardwareConcurrency": 8,
        "deviceMemoryGb": 8
      }
    }
  }
}
```

`benchmarkId`, `source`, `deviceProfile`, and `browser` are required for envelope inputs. `audioDurationSeconds` must be positive, `elapsedMs` must be non-negative, and `cacheState` must be `cold`, `warm`, or `unknown`. When `modelId` is present, its pinned `modelRevision` is required; this prevents results from silently combining mutable model artifacts. Device fields inside individual runs are optional because browser APIs do not expose them consistently. Summaries include separate `byCacheState` and `byModel` sections.
