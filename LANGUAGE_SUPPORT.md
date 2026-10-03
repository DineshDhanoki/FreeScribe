# Language support

FreeScribe separates spoken-language recognition from written translation.
Whisper identifies the spoken source language; NLLB generates text in the
selected target language.

## Current source-language focus

The UI includes English, Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati,
Urdu, Kannada, Malayalam, Punjabi, Odia, Assamese, Nepali, Sanskrit, Spanish,
French, German, Italian, Portuguese, Russian, Arabic, Japanese, Korean,
Chinese, Indonesian, Turkish, Vietnamese, Thai, Dutch, Polish, Ukrainian, and
Swahili.

This is a supported product list, not an accuracy guarantee. Contributors can
add languages when the speech model accepts the language token, the NLLB code
is verified, and an evaluation example or limitation note is provided.

## Adding a language

1. Add the Whisper and NLLB identifiers to the shared model registry.
2. Add a mapping test.
3. Update this document and the README when the language is user-facing.
4. Add consented or synthetic evaluation data before making quality claims.
