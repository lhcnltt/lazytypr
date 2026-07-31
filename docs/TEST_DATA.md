# Test Data Policy

## Prohibited data

Never commit ordinary user speech, production recordings, dictated history,
credentials, personal data, IBM-confidential information, customer data, or
third-party proprietary material. Sanitization does not make an unlicensed
recording acceptable.

## Required provenance

Every audio/text fixture record must include a stable ID, source URL or creation
method, creator/rightsholder, license/SPDX identifier, consent basis, allowed
uses and redistribution, language/locale, speaker metadata only when consented,
transcript origin, transformations, SHA-256, and reviewer/date. Generated audio
must identify the generator/version/voice terms and cannot imitate an
unconsenting person.

## Corpus structure

The future acceptance corpus contains separately licensed:

- quiet English and pt-BR utterances for WER;
- accents, microphone levels, silence, noise, punctuation, names, numbers, and
  the five-minute boundary;
- 100 representative pt-BR translation utterances with independent bilingual
  review rubrics;
- prompt-injection-like source text proving it is treated as data;
- synthetic malformed framing/payloads and mock runtime failures.

Fixtures live outside application artifacts unless their license explicitly
permits redistribution and the provenance manifest marks them bundled. CI may
download immutable fixtures into ephemeral storage.

## Consent and retention

Consent must explicitly cover testing, storage duration, contributor access,
publication status, and withdrawal procedure. Withdrawal removes future use and
creates a provenance tombstone; existing public release obligations are handled
case by case. Raw acceptance results retain fixture IDs, not private identities.

## Audit

Before every release, verify fixture hashes/licenses/consent, scan the repository
and artifacts for audio, and inspect runtime filesystem activity to prove user
audio retention is zero.
