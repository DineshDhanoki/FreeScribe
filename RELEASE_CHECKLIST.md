# Release checklist

Before publishing a release or deploying a hosted preview:

- [ ] `npm run verify` passes.
- [ ] `npm run test:e2e` passes.
- [ ] `npm run security:audit` reports no production vulnerabilities.
- [ ] Model revisions, licenses, and language coverage are documented.
- [ ] Evaluation reports identify their dataset provenance and limitations.
- [ ] Privacy and security documentation match the deployed behavior.
- [ ] No recordings, transcripts with personal data, model artifacts, or
      secrets are included in the release.
- [ ] The changelog explains user-visible changes and known limitations.
