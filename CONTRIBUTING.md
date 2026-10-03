# Contributing

## Development

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm test
npm run lint
npm run build
```

For the complete local verification gate, run:

```bash
npm run verify
npm run security:audit
npm run test:e2e
```

`npm run verify` includes unit/integration tests, transcription and translation evaluation fixtures, performance summarization, lint, and the production build.

## Pull requests

Explain the user problem, the design choice, and how the change was verified. Changes to model behavior should include benchmark evidence or clearly document why an evaluation fixture is not yet available.

Never commit private recordings, personal information, generated model files, or secrets.

## Open-source collaboration

FreeScribe welcomes contributions to language coverage, transcription and
translation quality, accessibility, performance, privacy, documentation, and
testing. Please read the issue templates before opening a report and keep
examples synthetic or consented. Do not upload recordings or transcripts that
contain personal information.

The source code is MIT-licensed. AI model files and datasets may have separate
licenses; contributors must record those licenses and follow their terms.
