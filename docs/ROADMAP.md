# Verity / Layer Eight Reconciliation Roadmap

This branch is the controlled landing zone for reconciling the live Layer Eight / DuckyDB prototype into the AEGIS repository.

## Phase 0 — Repository safety

- [x] Establish public-safe project identity
- [x] Add defensive ignore rules
- [x] Document architecture and authority boundaries
- [x] Add repository security policy
- [ ] Confirm repository visibility metadata after GitHub propagation
- [ ] Confirm no historical secrets exist before importing source

## Phase 1 — Source reconciliation

Import source in reviewed slices rather than copying the complete local working tree.

Priority slices:

1. core type/contracts required by Layer Eight
2. Continuity API and reasoning helpers
3. source-bound credential/profile governance
4. observation semantic registry
5. conflict review lifecycle
6. Duck worker and reconnect logic
7. local stack launch/recovery scripts
8. Layer Eight operator UI

Each slice should identify:

- source path
- runtime dependency
- test coverage
- secret/runtime exclusions
- compatibility assumptions
- whether it is canonical, experimental, or legacy

## Phase 2 — Reproducible local development

- [ ] sanitized `.env.example`
- [ ] deterministic dependency install
- [ ] documented Node/runtime requirements
- [ ] local D1 bootstrap from migrations
- [ ] local Ollama setup without bundled model blobs
- [ ] one-action local startup
- [ ] health checker for DuckyDB, Layer Eight, Ollama and Duck worker

## Phase 3 — Continuity

- [x] issuer-bound continuity contexts in live prototype
- [x] source-bound expiring credentials in live prototype
- [x] explicit reporting cadence
- [x] current / late / stale / never-seen semantics
- [x] observation idempotency
- [x] transmission-quality confidence cap
- [x] cross-source disagreement without automatic winner
- [x] human conflict-review lifecycle
- [x] approved observation-key semantics in current local work
- [ ] reconcile these components into Git with synthetic fixtures only
- [ ] complete first real two-device validation outside the repository

## Phase 4 — Evidence and reasoning UX

- [ ] observation / claim / inference distinction
- [ ] contradiction and supersession presentation
- [ ] confidence and provenance visibility
- [ ] conflict-review operator panel
- [ ] assumption and revision history
- [ ] explicit unknown / insufficient-evidence states

## Phase 5 — Governance and assurance

- [ ] threat model
- [ ] data-retention and correction model
- [ ] credential rotation procedure
- [ ] audit-event specification
- [ ] authority matrix for read / propose / approve / execute
- [ ] external assurance checklist

## Phase 6 — Project Concord

Build a synthetic humanitarian-response demonstrator involving delayed, contradictory and variable-reliability reports.

Evaluation should measure:

- provenance coverage
- uncertainty calibration
- contradiction handling
- operator comprehension
- decision quality
- fairness/equity impacts
- failure containment

## Non-goals

The reconciliation process must not quietly expand AEGIS into:

- autonomous targeting
- autonomous use of force
- coercive surveillance
- automated punishment
- unsupervised high-impact decision making

## Engineering invariant

**A missing observation is not an observation of absence.**
