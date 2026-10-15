# AEGIS

**AEGIS** is the public engineering repository for the Lumanite Verity / Layer Eight research stack.

> Power should become more accountable as capability increases.

## Project structure

- **Lumanite Systems** — parent engineering identity
- **Lumanite Verity** — evidence-grounded contextual intelligence architecture
- **Layer Eight** — human-facing operator cockpit
- **DuckyDB** — canonical internal evidence, context, provenance, continuity, and reasoning engine
- **Project Concord** — humanitarian and defensive evaluation programme
- **AEGIS** — internal architecture/research codename

## Core principles

AEGIS is being developed around a small set of non-negotiable principles:

1. **Evidence before assertion**
2. **Provenance before confidence**
3. **Observation is not inference**
4. **Silence is not evidence of absence**
5. **Conflicting observations remain visible until reviewed**
6. **High-impact actions require explicit human authority**
7. **Capability must not silently expand authority**
8. **Uncertainty must be represented, not hidden**

Canonical reasoning flow:

```text
SOURCE
  -> OBSERVATION
  -> CLAIM
  -> CONTEXT
  -> INFERENCE
  -> RECOMMENDATION
  -> HUMAN DECISION
  -> ACTION
  -> OUTCOME
```

## Current development focus

The active prototype currently centres on:

- longitudinal continuity across devices and sessions
- sealed evidence and provenance
- scoped device observations
- source-bound credentials
- deterministic reporting cadence states
- contradiction and revision detection
- human-governed conflict review
- local model execution through Ollama
- a protected Layer Eight operator interface

## Safety boundary

This repository is intended for accountable decision support, defensive security, humanitarian coordination, research, and human-supervised tooling.

It is **not** intended to provide autonomous use-of-force authority, coercive surveillance, automated punishment, or unreviewable high-impact decision making.

## Repository policy

The live development environment contains machine-local state, credentials, continuity evidence, local databases, model files, and runtime artefacts that must never be committed. See `.gitignore` and `docs/ARCHITECTURE.md` before adding runtime material.

## Status

This repository begins as the clean public engineering spine for a larger local prototype. The live working tree is being reconciled into this repository deliberately rather than uploaded as one unreviewed historical dump.
