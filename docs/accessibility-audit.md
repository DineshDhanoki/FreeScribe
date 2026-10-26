# Accessibility audit (Issue #18)

## Scope and support statement

This audit records keyboard and screen-reader support implemented for FreeScribe's core journey. Automated checks run in Chromium. Manual assistive-technology checks must be completed on the target browser/OS before claiming screen-reader certification. Automated DOM assertions are not a substitute for a manual AT run.

## Manual verification matrix

| Journey / check | Keyboard procedure | Expected screen-reader result | Evidence / manual follow-up |
| --- | --- | --- | --- |
| Home and navigation | Tab from page start; activate skip link with Enter; continue through header controls | Skip link is first; header controls have meaningful names; focus remains visible | E2E skip-link assertion; manually verify NVDA with Firefox and Chrome |
| Recording | Tab to Start recording; press Enter; stop with Enter | Button name changes; polite status announces start/stop; microphone denial is an alert | Recording live region and existing error alert; manually verify with NVDA |
| Upload and setup | Focus audio input; choose file; tab through model and language controls | File name is readable; selects are labelled; unsupported language choices are disabled | Existing labels/disabled options; E2E upload coverage |
| Processing | Activate Transcribe audio; wait for download/inference | Current phase is announced politely; progress exposes min/max/current and value text; Cancel is named | Phase live region and progressbar; E2E semantic assertions |
| Transcript editing and seek | Tab through timestamps and textareas; edit text; activate timestamp | Timestamp button identifies its segment; textarea identifies its segment; current segment is conveyed by aria-current | Component unit tests; E2E keyboard assertions |
| Translation | Focus tablist; use Left/Right or Up/Down, Home, End; select language; start/cancel | Tabs expose selected state and persistent panel relationships; progress is announced; errors use alert | Existing tab tests plus live progress/error semantics |
| Save and reopen | Activate Save locally; open Projects; select saved project | Save confirmation is announced; project actions have names; focus returns to Projects summary | Save status live region; ProjectLibrary focus test; saved-project E2E |

## Automated coverage

- `src/components/Information.test.jsx`: tab keyboard behavior, translation progress, cancellation, stale-result handling, transcript editing.
- `src/components/Transcription.test.jsx`: named segment editor and timestamp seek controls.
- `src/components/ProjectLibrary.test.jsx`: project selection/focus return, deletion, import/export controls.
- `tests/e2e/accessibility.spec.js`: skip link, upload setup, processing semantics, transcript controls, tabs and save/reopen assertions.

## Contrast and motion

Light/dark theme tokens and component overrides are retained. Reduced-motion preferences continue to disable non-essential animation. Contrast is not automatically certified by these tests: manually inspect text, focus indicators, disabled controls, alerts and progress indicators in both themes at 100% zoom.

## Manual sign-off

Record browser/OS, screen-reader/version, date, tester and pass/fail for each row before marking the manual AT run complete. Do not report manual screen-reader verification as passed solely from automated DOM assertions.
