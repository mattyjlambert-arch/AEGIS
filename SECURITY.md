# Security Policy

## Scope

AEGIS contains research and engineering work for Lumanite Verity, Layer Eight, DuckyDB integration, local model execution, continuity, provenance, and defensive/humanitarian tooling.

## Do not commit secrets

Never commit:

- bearer tokens
- service credentials
- `.env` files
- private keys or certificates
- authentication cookies
- local database files
- real continuity evidence
- private logs containing user/device context
- local model blobs

Use ignored local files or an appropriate secret manager instead.

## Real-world evidence

Tests, examples, screenshots, fixtures, and documentation should use synthetic or deliberately anonymized material unless there is a clear, documented reason otherwise.

Real continuity observations are evidence-bearing records and should remain in their governed runtime stores rather than Git.

## Authority and safety

Security-related functionality in AEGIS should remain defensive, auditable, scoped, and human-governed.

High-impact actions should require explicit authority and should provide practical rollback, revocation, pause, or shutdown controls where possible.

AEGIS is not intended to authorize autonomous use of force, coercive surveillance, automated punishment, or unreviewable high-impact decisions.

## Vulnerability reporting

Until a dedicated disclosure channel exists, repository owners should treat reported security issues as sensitive and avoid posting exploitable details into public issue threads.

When documenting a resolved vulnerability, preserve enough technical detail for audit and learning without publishing active credentials, private infrastructure details, or unnecessary personal data.
