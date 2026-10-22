# Tests

This directory contains unit, integration, and end-to-end tests. Test fixtures must be synthetic, public-domain, or explicitly consented; never add private recordings.

The current suite includes pure service tests and browser-like component tests using Vitest, jsdom, and Testing Library. It covers audio validation/resampling, worker protocols, transcription state, storage schema normalization, local deletion, evaluation metrics, and performance summaries.

## Playwright E2E Tests

The Playwright suite runs against a real Chromium browser.

```bash
npm run test:e2e
```

The tests verify application startup, accessible controls, upload configuration, and reopening locally stored projects.

Microphone recording, permission handling, and error states are tested using mocked browser media APIs. Heavy model inference is also mocked to ensure deterministic testing without downloading or running real AI models.

## Mobile and Tablet E2E Tests

Playwright tests cover desktop, phone, and tablet viewports.

The responsive E2E tests verify:

- Mobile navigation and primary control accessibility.
- Microphone permission and recording error states using mocked media APIs.
- Recording start and stop behavior.
- Synthetic audio file uploads and transcription configuration.
- Project saving and reopening through IndexedDB.
- Theme switching and persistence.
- Translation language selection.
- Horizontal overflow and control clipping.

Synthetic fixtures and mocked media APIs keep these tests deterministic and suitable for CI.

### Run Tests

```bash
npm run test:e2e
```

### Real-Device Verification Still Required

Playwright viewport emulation does not replace testing on physical mobile devices.

The following areas require separate real-device verification:

- Actual microphone permissions on Android and iOS.
- Real microphone recording and audio quality.
- Safari and mobile browser recording compatibility.
- Whisper and NLLB model performance, memory usage, and inference speed.
- Battery consumption and device thermal throttling.
- Physical touch interactions and device-specific accessibility behavior.

These limitations are outside the scope of the mocked E2E tests.