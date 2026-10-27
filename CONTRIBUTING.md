# Contributing

## Your first contribution

You can help even if you are new to open source or AI. Start with a user problem you can explain clearly: confusing wording, a keyboard trap, a broken audio format, a translation mistake you can reproduce, or a documentation gap.

1. Browse the [open issues](https://github.com/DineshDhanoki/FreeScribe/issues) and choose one that interests you. Many are large; ask in a comment for a small first slice if needed.
2. Comment with what you plan to change and how you will check it. This helps others avoid duplicating work.
3. Fork the repository, make a focused branch, and run the checks below.
4. Open a pull request that links the issue, shows the before and after behavior, and lists your checks. Screenshots are welcome for UI changes; use synthetic or consented data only.

Questions and proposals are welcome in [Discussions](https://github.com/DineshDhanoki/FreeScribe/discussions). A reproducible report or a documented language case is a useful contribution even when it does not include code.

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

UI changes should preserve keyboard navigation, visible focus states, readable
contrast, responsive layouts, and accessible names for controls. Check the
home, upload, transcription, and translation flows at desktop and mobile widths.

Never commit private recordings, personal information, generated model files, or secrets.

## Open-source collaboration

FreeScribe welcomes contributions to language coverage, transcription and
translation quality, accessibility, performance, privacy, documentation, and
testing. Please read the issue templates before opening a report and keep
examples synthetic or consented. Do not upload recordings or transcripts that
contain personal information.

The source code is MIT-licensed. AI model files and datasets may have separate
licenses; contributors must record those licenses and follow their terms.
