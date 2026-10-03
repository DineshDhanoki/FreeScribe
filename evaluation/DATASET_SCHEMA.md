# Evaluation dataset contract

Transcription and translation benchmark inputs may be a legacy array of records or a versioned envelope:

```json
{
  "metadata": {
    "datasetId": "my-dataset-v1",
    "source": "public corpus or documented consented recordings",
    "license": "license identifier",
    "consentStatus": "documented|not-applicable",
    "split": "dev|test|smoke"
  },
  "records": [
    {
      "id": "unique-example-id",
      "language": "en",
      "model": "Xenova/whisper-tiny.en",
      "modelRevision": "verified immutable model revision",
      "condition": "clean",
      "accent": "optional accent or dialect label",
      "noiseCondition": "clean|street|office|other",
      "speakerGroup": "non-identifying speaker or cohort label",
      "reference": "licensed reference transcript",
      "hypothesis": "model output"
    }
  ]
}
```

The evaluator requires provenance metadata for envelope inputs and carries it into the JSON report. References must contain at least one non-whitespace character; an empty model hypothesis is allowed and is scored as an error. When `model` is present, `modelRevision` is required for reproducibility. Reports include weighted breakdowns for language, model, condition, accent, noise condition, and speaker group. Use non-identifying cohort labels for `speakerGroup`; never store names, contact details, or raw audio in benchmark fixtures. Do not add private audio or personally identifying transcript content to Git. Keep dataset access instructions and any external report archive separate from the repository.
