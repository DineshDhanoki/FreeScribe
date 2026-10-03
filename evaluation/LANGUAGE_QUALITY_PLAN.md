# Language quality plan

FreeScribe must measure speech recognition and translation separately. A final
translation score cannot hide an incorrect source transcript.

For each priority language, contributors should collect consented or synthetic
examples covering clean speech, accents, code-switching, and realistic noise.
Each record should retain language, model revision, speaker group, condition,
and split metadata so the audit can detect leakage.

Minimum reports:

- transcription: WER and CER by language and condition;
- translation: character F-score and exact-match rate by language pair; and
- performance: cold/warm cache latency and real-time factor by device profile.

Quality reports are evidence for a model or configuration, not a promise that
every speaker will receive the same accuracy.
