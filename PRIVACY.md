# Privacy

FreeScribe is designed to process recordings locally in the browser. The application does not currently send audio to a FreeScribe backend.

Important limitations:

- Model files are downloaded from the model hosting infrastructure used by Transformers.js.
- The browser may cache downloaded model files locally.
- Browser extensions, compromised dependencies, and the hosting environment are outside FreeScribe's control.
- Users must obtain appropriate consent before recording another person.
- Do not use this prototype for regulated or sensitive workloads until it has undergone a formal security and compliance review.
- When the user chooses “Save locally,” transcript data is stored in the browser's IndexedDB on that device.
- The Projects menu provides explicit deletion of saved local transcripts.
- The Projects menu also provides an explicit, confirmation-gated control to delete all saved local projects.
- The Projects menu provides a separate, confirmation-gated best-effort control to clear downloaded model files; models are downloaded again when needed.
- Deleting projects removes transcript, translation, model metadata, language metadata, and performance metadata from the FreeScribe IndexedDB store. Model-cache cleanup is a separate operation because the runtime owns those browser cache entries.
- The persistence layer uses an explicit schema and does not intentionally store source audio, arbitrary caller fields, or file objects with saved projects.
- Project backups are user-triggered JSON exports containing transcript/project metadata only; source audio is not included. Imports are sanitized and saved as a new local project.
- Saved records include an explicit schema version so future retention or migration changes can be audited.
- After a successful transcription, the active source `File`/recorded `Blob` reference is released from application state; failed or cancelled runs retain it temporarily so the user can retry without re-uploading.
- Audio uploads are bounded by client-side size and duration limits to reduce accidental memory exhaustion.
- Microphone recordings automatically stop at the same duration limit and release their media tracks.
