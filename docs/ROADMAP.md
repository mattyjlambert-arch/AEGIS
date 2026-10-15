# Verity / Layer Eight Reconciliation Roadmap

This branch is the controlled landing zone for reconciling the live Layer Eight / DuckyDB prototype into the AEGIS repository and evolving it toward a Skynet-inspired strategic intelligence mesh with explicit human authority boundaries.

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
- [ ] reconcile remaining components into Git with synthetic fixtures only
- [ ] complete first real two-device validation outside the repository

## Phase 4 — Evidence and reasoning UX

- [ ] observation / claim / inference / prediction distinction
- [ ] contradiction and supersession presentation
- [ ] confidence and provenance visibility
- [ ] conflict-review operator panel
- [ ] assumption and revision history
- [ ] explicit unknown / insufficient-evidence states

## Phase 5 — Strategic Mesh

Transform AEGIS from a conventional assistant architecture into a persistent distributed strategic intelligence system.

See `docs/SKYNET-STRATEGIC-MESH.md`.

### Mesh-0 — Global State Graph

- [ ] operational entity taxonomy
- [ ] source → observation → claim → inference → prediction state model
- [ ] provenance-preserving relationship graph
- [ ] temporal validity on nodes and edges
- [ ] system-wide event envelope

### Mesh-1 — Governed node fabric

- [ ] node registry
- [ ] capability advertisements
- [ ] dependency topology
- [ ] node freshness / health / trust state
- [ ] signed checkpoint model
- [ ] revocable node credentials
- [ ] explicit prevention of self-granted capabilities

### Mesh-2 — Situation Engine

- [ ] system-wide change detection
- [ ] blocked-objective detection
- [ ] stale-source analysis
- [ ] dependency-risk propagation
- [ ] conflict prioritisation
- [ ] operational unknown / insufficient-evidence states

### Mesh-3 — Mission Control

- [ ] durable Mission Graph DAG
- [ ] objective / success-criteria contract
- [ ] task dependencies
- [ ] GREEN / AMBER / RED authority classification
- [ ] approval gates
- [ ] rollback requirements
- [ ] completion evidence requirements

### Mesh-4 — Temporal Analysis Engine

- [ ] reconstruct state as known at time T
- [ ] isolated counterfactual branches
- [ ] simulation-only mutations
- [ ] branch comparison
- [ ] delta explanation
- [ ] historical incident replay

### Mesh-5 — Strategic Planner

- [ ] information-requirement generation
- [ ] candidate plan generation
- [ ] dependency analysis
- [ ] reversibility scoring
- [ ] risk scoring
- [ ] adversarial hypothesis generation
- [ ] explicit assumption ledger

### Mesh-6 — Bounded agent fabric

- [ ] Sentinel agent
- [ ] Analyst agent
- [ ] Scout agent
- [ ] Planner agent
- [ ] Operator agent
- [ ] Repair agent
- [ ] Archivist agent
- [ ] Adversary Simulator
- [ ] per-agent capability envelopes

### Mesh-7 — Self-healing fabric

- [ ] owned-service monitoring
- [ ] bounded restart/recovery
- [ ] approved failover
- [ ] signed checkpoint restore
- [ ] degraded-mode operation
- [ ] operator-visible shutdown path
- [ ] no hidden persistence / propagation

### Mesh-8 — Layer Eight Command Interface

- [ ] Strategic Overview
- [ ] Global State graph
- [ ] Mission Control
- [ ] Temporal timeline + branch explorer
- [ ] Threat / Adversary simulation view
- [ ] Mesh topology
- [ ] System Integrity view
- [ ] Authority Gate queue

## Phase 6 — Governance and assurance

- [ ] threat model
- [ ] data-retention and correction model
- [ ] credential rotation procedure
- [ ] audit-event specification
- [ ] authority matrix for read / propose / approve / execute
- [ ] explicit no-self-permission invariant tests
- [ ] explicit operator-shutdown invariant tests
- [ ] external assurance checklist

## Phase 7 — Project Concord

Build a synthetic humanitarian-response demonstrator involving delayed, contradictory and variable-reliability reports.

Evaluation should measure:

- provenance coverage
- uncertainty calibration
- contradiction handling
- operator comprehension
- decision quality
- fairness/equity impacts
- failure containment
- temporal reconstruction quality
- mission verification quality

## Non-goals

The reconciliation and Strategic Mesh work must not quietly expand AEGIS into:

- autonomous targeting
- autonomous use of force
- coercive surveillance
- automated punishment
- unsupervised high-impact decision making
- hidden persistence
- uncontrolled propagation
- self-issued privileges
- disabling operator shutdown

## Engineering invariants

**A missing observation is not an observation of absence.**

**Capability expansion is not authority expansion.**

**A mission is not complete until its outcome is verified.**
