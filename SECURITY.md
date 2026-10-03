# Security Policy

## Scope

FreeScribe is an alpha, client-side application. It must not be used for sensitive or regulated recordings until a formal security and compliance review is complete.

## Reporting a vulnerability

Please do not publish exploitable details in a public issue. Contact the repository owner privately with reproduction steps, affected versions, and impact. Do not include real personal, medical, or confidential data in a report.

## Security principles

- Keep audio local by default.
- Do not commit secrets, recordings, or transcripts.
- Pin and review model and dependency changes; model revisions are explicit in the shared registry and should not silently follow `main`.
- Treat downloaded model artifacts as part of the supply chain.
- Validate all worker messages before using them in the UI.
- Provide deliberate, user-visible local-data deletion controls and avoid silent retention guarantees.
- Use an explicit persistence schema so unapproved fields and source audio cannot be accidentally written with a transcript project.
- Allowlist persisted model and language identifiers before restoring a project or starting inference.
- Enforce the same model and language allowlists inside workers because worker messages are an independent trust boundary.
- Make model-cache cleanup explicit and confirmation-gated; cache deletion is best effort because browser/runtime cache implementations vary.

## Deployment headers

The application declares a restrictive referrer policy and permissions policy in `index.html`. Production hosting should also send response headers for defense in depth, including `Strict-Transport-Security` when served exclusively over HTTPS, `X-Content-Type-Options: nosniff`, and a deployment-specific `Content-Security-Policy`. The CSP must allow the configured model host, stylesheet/font CDNs, same-origin module workers, and any required WASM loading path; it should be tested against the built app before enforcement.

The application uses the maintained `@huggingface/transformers` runtime. Production dependency auditing after the migration reports zero known vulnerabilities via `npm audit --omit=dev`; development dependencies remain separately audited because they are not shipped to users.

CI runs the same production audit through `npm run security:audit` and fails when npm reports a production dependency vulnerability.
