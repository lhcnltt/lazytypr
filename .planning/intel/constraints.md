## Architecture
- source: docs/ARCHITECTURE.md
- type: protocol
- content: Electron main is the sole authority; sandboxed renderers use authenticated loopback inference, explicit immutable-provider downloads, main-owned persistence, and terminal lifecycle cleanup.

## IPC Contracts
- source: docs/IPC_CONTRACTS.md
- type: api-contract
- content: IPC is TypeScript-first, runtime-validated, versioned, and authorized by exact sender and window role; unknown keys are rejected, strings are bounded, and identifiers must exist in main-owned registries.

## User Interface Specification
- source: docs/UI_SPEC.md
- type: nfr
- content: The interface defines overlay and control windows, overlay states, onboarding, components and tokens, responsive scaling, accessibility, and en-US and pt-BR localization.

## Model and Runtime Catalog Specification
- source: docs/MODELS.md
- type: protocol
- content: The catalog defines speech-to-text and translation compatibility, immutable seed evidence, and download, install, upgrade, and deletion controls.

## Security and Privacy Design
- source: docs/SECURITY_AND_PRIVACY_DESIGN.md
- type: nfr
- content: Security and privacy controls cover microphone PCM, transcripts, clipboard, focus targets, sidecar secrets, renderers, IPC, MessagePort, providers, persistence, build and release, and network privacy.

## Licensing and Release Compliance
- source: docs/LICENSING.md
- type: nfr
- content: Licensing defines the separation of obligations, model and component policy, and required release gates for licenses, notices, provenance, hashes, redistribution review, attribution, and SBOMs.

## Testing and Evidence Strategy
- source: docs/TESTING.md
- type: nfr
- content: Evidence labels distinguish source inspection, local static validation, generated planning validation, future implementation tests, future packaged-build tests, and future Windows or macOS hardware validation; documentation gates require zero blockers or unreviewed competing variants.

## Test Data Policy
- source: docs/TEST_DATA.md
- type: nfr
- content: Test data prohibits ordinary user speech, production recordings, dictated history, credentials, personal data, IBM-confidential information, customer data, and third-party proprietary material; fixtures require provenance, consent, retention, and release audit controls.
