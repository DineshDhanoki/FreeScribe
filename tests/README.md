# Tests

This directory will contain unit, integration, and end-to-end tests. Test fixtures must be synthetic, public-domain, or explicitly consented; never add private recordings.

The current suite includes pure service tests and browser-like component tests using Vitest, jsdom, and Testing Library. It covers audio validation/resampling, worker protocols, transcription state, storage schema normalization, local deletion, evaluation metrics, and performance summaries.

The Playwright smoke suite runs against a real Chromium instance:

```bash
npm run test:e2e
```

It verifies application boot, accessible controls, upload configuration, and reopening a locally stored translated project. It intentionally does not claim microphone or live model-inference coverage yet.
