# Runtime Reentry Plan - 2026-05

This document defines the approved reopening order after the stabilization freeze cycle. It exists to prevent uncontrolled drift as gameplay, persistence, mission authority, and monetization systems resume development.

## Current Stabilized Baseline

- Launch spine snapshot is established in `LAUNCH_SPINE_SNAPSHOT_2026-05.md`.
- `/play` runtime atmosphere freeze is sealed in `PLAY_RUNTIME_FREEZE_2026-05.md`.
- Provider containment doctrine is archived in `ZONE3_PROVIDER_ADAPTER_CONTAINMENT.md`.
- Idempotency doctrine is archived in `ZONE4_IDEMPOTENCY_DOCTRINE.md`.
- Telemetry drift, tone balancing, environmental echoes, activation cadence, reset behavior, and combat gate status copy have completed deployment verification.
- Current `/play` atmosphere and telemetry behavior is considered stable unless a regression-specific phase reopens it.

## Approved Reopening Order

1. Mission/session authority shell.
2. Lightweight persistence scaffolding.
3. Runtime payload continuity.
4. Encounter-state architecture.
5. Progression/reputation layer.
6. Monetization authority implementation.
7. Advanced gameplay systems.

This sequence is intentionally narrow. Later layers must not be implemented early by smuggling authority, persistence, payment, or gameplay semantics into frontend presentation phases.

## Explicit Anti-Drift Guardrails

- Provider-specific state, SDK vocabulary, payment events, checkout sessions, wallet concepts, or transaction terminology must not bleed into gameplay, dossier, mission, or `/play` runtime systems.
- Frontend surfaces remain non-authoritative unless a future server-authority phase explicitly changes that boundary.
- Gameplay and payment work must not be mixed in the same implementation phase.
- Commits must remain narrow and subsystem-scoped.
- Reopening should be route-scoped where possible.
- Existing reset, replay, idempotency, and hydration behavior must be preserved unless a regression-driven or authority-reviewed phase explicitly reopens it.
- Avoid speculative system expansion, broad refactors, or architecture work that is not required by the current phase.
- Documentation-only phases must not become implicit implementation authorization.

## Frozen Systems Requiring Explicit Justification To Reopen

- Telemetry cadence architecture.
- Local telemetry phrase pools and atmosphere drift behavior.
- Runtime shell activation lifecycle.
- Combat gate availability flow and local encounter preview behavior.
- CLS/payment boundary doctrine.
- Provider containment doctrine.
- Replay/idempotency containment.
- Stabilized UI atmosphere systems.
- `/play` hydration and reset lifecycle.

## Deferred High-Risk Systems

- Autonomous AI runtime systems.
- Persistent multiplayer or live state synchronization.
- Live economy systems.
- Procedural authority layers.
- Large combat rewrites.
- Backend-driven encounter outcomes.
- Durable mission completion, success, failure, or reward authority.

## Reentry Operating Doctrine

- Reopen one subsystem at a time.
- Validate first, implement second, stabilize before expansion.
- Preserve a clear distinction between presentation, local runtime behavior, and authority-bearing server state.
- Use deployment freeze checkpoints after meaningful runtime or authority changes.
- Prefer additive scaffolding over broad rewrites.
- Treat launch-spine stability as the default state; reopen only with an explicit phase objective and bounded allowed files.
- If a phase discovers boundary ambiguity, stop and document the ambiguity before implementing through it.
