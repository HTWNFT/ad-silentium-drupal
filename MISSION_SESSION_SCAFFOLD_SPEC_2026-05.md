# Mission Session Scaffold Specification - 2026-05

This specification translates the mission authority recon and shell doctrine into a narrow implementation-facing blueprint for mission/session authority scaffolding. It does not create schema, routes, controllers, storage writes, frontend changes, or gameplay authority.

## 1. Scaffold Purpose

The mission/session scaffold should create a minimal persistence boundary for runtime continuity without converting `/play` UI state into gameplay truth.

Primary purpose:

- Runtime continuity anchor: establish a server-side session identity attached to a mission instance.
- Reset-safe mission identity: allow future reset lineage to be represented without using browser state as authority.
- Observational session continuity: expose only minimal read-safe metadata to `/play` when a later implementation phase authorizes it.
- Non-authoritative frontend linkage: allow frontend presentation to reference a mission/session identity without owning lifecycle truth.

The scaffold is a containment layer, not gameplay authority.

## 2. Minimal Initial Scope

Initial persistence scaffold should be limited to:

- `mission_session_id`: stable server-generated session identifier.
- `created` timestamp: server-side creation time.
- `route_identity`: normalized route context for continuity and reconstruction.
- `reset_generation`: replay-safe lineage marker, initially non-gameplay and non-outcome bearing.
- Payload linkage reference only: pointer back to canonical ENTER payload or mission instance linkage.

The initial scaffold should not include broad frontend state dumps, combat state, telemetry logs, player outcomes, provider facts, or gameplay progression data.

## 3. Explicit Exclusions

- No gameplay persistence.
- No combat authority.
- No encounter outcome authority.
- No inventory.
- No progression or reputation.
- No provider/payment data.
- No entitlement semantics.
- No telemetry persistence.
- No credits, rewards, fulfillment, or monetization state.
- No AI runtime authority.
- No lifecycle labels implying success, failure, completion, damage, health, or mission resolution.

## 4. Candidate Schema Shape (Conceptual Only)

Candidate table names:

- `ooh_outskirts_mission_session`
- `ooh_outskirts_runtime_session`

Preferred initial direction:

- `ooh_outskirts_mission_session`, because it keeps the scaffold clearly attached to mission continuity rather than generic runtime state.

Candidate field concepts:

- `id`: internal serial primary key.
- `uuid`: stable mission session UUID.
- `mission_instance_id`: internal link to `ooh_outskirts_mission_instance.id`.
- `mission_uuid`: public mission instance UUID linkage.
- `enter_payload_id`: internal canonical ENTER payload linkage.
- `enter_payload_uuid`: public/supporting payload UUID linkage.
- `uid`: user context, including anonymous `0`.
- `route_identity`: normalized route key such as `aer`, `mare`, or `terra`.
- `reset_generation`: integer reset lineage marker, starting at `0`.
- `created`: Unix timestamp.
- `updated`: Unix timestamp.

Candidate index concepts:

- Unique key on `uuid`.
- Index on `mission_uuid`.
- Index on `mission_instance_id`.
- Index on `enter_payload_uuid`.
- Index on `uid`.
- Optional composite index on `uid, created`.
- Optional composite index on `mission_uuid, reset_generation` if reset lineage becomes query-relevant later.

Lifecycle concepts:

- Initial scaffold should avoid gameplay lifecycle vocabulary.
- If a lifecycle/status field is unavoidable, use containment language such as `session_state` with values like `staged` or `observational`.
- Do not reuse this field for combat, progression, reward, completion, or mission outcome semantics.

## 5. Update-Hook Strategy

Future implementation should use an additive update hook only.

Required update-hook posture:

- Idempotent-safe: check `tableExists()` before creating the new table.
- Replay-safe: running database updates multiple times must not duplicate mission/session rows.
- Rollback-aware: do not drop, rename, or reinterpret existing tables.
- No destructive updates.
- No data migration unless a separate phase explicitly authorizes it.
- No modification of existing `ooh_outskirts_enter_payload` or `ooh_outskirts_mission_instance` semantics unless separately specified.
- Keep hook numbering consistent with existing `9301`, `9302`, and `9303` sequence.

## 6. Reset / Replay Doctrine Integration

- `reset_generation` must not imply gameplay failure, mission completion, progress rollback, or reward state.
- Reset lineage must be replay-safe and must not multiply authority outcomes.
- Hydration reconstruction should rely on server-recognized mission/session identity and canonical payload linkage.
- Browser reload, browser history, local storage, and DOM state must not define reset generation authority.
- Repeated activation attempts must not create duplicated activation authority.
- Transient runtime state remains separate from mission/session scaffold state.

## 7. Safe Controller Attachment Boundaries

Activation point candidates:

- After canonical ENTER payload save and mission instance creation, if the first scaffold phase creates a session immediately.
- During a future explicit mission/session activation endpoint, if activation should remain separate from ENTER save.
- Never inside telemetry, passive action, combat preview, or encounter action handlers.

Reset-safe insertion points:

- Future reset endpoint should be separate from local `resetMissionRuntime()` unless a phase explicitly binds them.
- Frontend reset should remain presentation-only until server reset semantics are defined.

Non-authoritative frontend observation boundaries:

- `/play` may receive mission/session identity as read-only metadata.
- Debug/hydration surfaces may display observational state if explicitly authorized.
- Local storage may carry identifiers for continuity, but it must not become canonical authority.

## 8. Validation Doctrine

- Implementation must remain narrow.
- Schema-first before gameplay.
- One authority surface at a time.
- No speculative schema expansion.
- No mixed persistence/gameplay phases.
- No provider/payment coupling.
- No telemetry persistence or cadence changes.
- Validate install/schema syntax before runtime integration.
- Add a freeze checkpoint after scaffold implementation before adding activation writes or gameplay semantics.

## Recommended Next Implementation Boundary

The first implementation phase should create only the mission session schema foundation and idempotent update hook. It should not add controller writes, frontend reads, activation behavior, reset behavior, or gameplay semantics.
