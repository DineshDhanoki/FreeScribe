# Accessibility audit (Issue #18)

## Scope and support statement

This matrix tracks FreeScribe's core journey. The automated checks use Chromium and mocked microphone, audio decoding, and model workers; they verify the application UI without downloading models or claiming to reproduce real audio inference. A manual keyboard and screen-reader session is still required before issue #18 can close. Automated DOM assertions cannot establish what a screen reader actually announces.

**Audit status, 2026-10-27:** Automated Chromium checks completed on macOS. No manual screen-reader run was performed in this session. Browser/OS, screen-reader name and version, tester, observations, and pass/fail must be recorded below during a real assistive-technology run. Until then, manual AT status is **not verified**.

## Manual verification matrix

| Journey / check | Manual keyboard and screen-reader procedure | Expected result | Automated evidence | Manual AT result |
| --- | --- | --- | --- | --- |
| Home and navigation | Tab from page start; activate skip link with Enter; continue through header controls | Skip link is first; controls have meaningful names; focus remains visible | `accessibility.spec.js` skip-link test | Not run |
| Recording | Start and immediately stop a recording with Enter; also test microphone denial and a recorder failure | Start and stop announcements are heard; button name changes; errors remain visible as alerts | Full-journey E2E checks the persistent live region after a quick stop; `mobile.spec.js` checks denial; `HomePage.test.jsx` checks recorder failure | Not run |
| Upload and setup | Select an audio file; tab through model and language controls | File name is readable; controls are labelled; unavailable choices are explained | `app.spec.js` and `mobile.spec.js` upload tests | Not run |
| Processing | Start transcription; listen while download and inference phases change; activate Cancel | Phase changes are announced; progress name, range, current value and value text are useful; Cancel is named | Full-journey E2E drives the actual `Transcribing` component with controlled worker messages at 37%, detecting and transcribing | Not run |
| Transcript editing and seek | Tab through timestamps and textareas; edit text; activate timestamp | Segment controls are identified; focus and current segment remain clear | Component assertions and E2E transcript editing | Not run |
| Translation | Use tablist arrows, select a target language, translate and cancel | Selected tab and panel relationship are clear; progress and errors are announced | Tab/component tests and full-journey E2E translation | Not run |
| Save and reopen | Save locally; open Projects; select the saved project | Save status is announced; project action has a name; focus returns sensibly | Full-journey E2E saves and reopens; ProjectLibrary focus test | Not run |

## Automated coverage

- `src/components/Information.test.jsx`: tab keyboard behavior, translation progress, cancellation, stale-result handling, transcript editing.
- `src/components/Transcription.test.jsx`: named segment editor and timestamp seek controls.
- `src/components/ProjectLibrary.test.jsx`: project selection/focus return, deletion, import/export controls.
- `tests/e2e/accessibility.spec.js`: skip link; quick recording stop; real application processing UI with controlled worker progress and phase messages; transcript edit and stale-translation handling; translation and save/reopen. The separate keyboard edit test starts from a seeded IndexedDB project and does not cover recording or processing.
- `tests/e2e/app.spec.js` and `tests/e2e/mobile.spec.js`: upload controls and the mocked upload-to-saved-project journey.

## Contrast and motion

Light/dark theme tokens and component overrides are retained. Reduced-motion preferences continue to disable non-essential animation. Contrast is not automatically certified by these tests: manually inspect text, focus indicators, disabled controls, alerts and progress indicators in both themes at 100% zoom.

## Manual sign-off

Record the browser and version, OS and version, screen reader and version, date, tester, actual announcement and focus observations, and pass/fail for every row. Link any reproducible defect to a test or record its limitation. Keep issue #18 open until at least one supported browser and screen reader complete this matrix. Do not report manual screen-reader verification as passed solely from automated DOM assertions.
