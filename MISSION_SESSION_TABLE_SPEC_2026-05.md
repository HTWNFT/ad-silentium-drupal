# Mission Session Table Specification - 2026-05

This document freezes the final pre-implementation boundary for the first mission/session persistence table. It is a specification only: it does not create schema, update hooks, controller writes, frontend behavior, runtime state, gameplay authority, provider coupling, or telemetry persistence.

The table described here is intended to be the narrowest possible persistence surface for mission continuity before any future implementation phase begins.

## 1. Table Purpose

The mission session table should act as a continuity anchor only.

Approved purpose:

- Mission continuity anchor only: provide a stable server-side reference for a mission runtime session.
- Reset-safe session identity: allow future reset lineage to attach to a session without using browser state as canonical authority.
- Observational runtime linkage: connect a runtime session to existing mission and payload identity for future hydration/reconstruction work.
- Non-authoritative frontend association: allow `/play` to observe a session identifier later without treating frontend state as gameplay truth.

The table must not become a gameplay state table, telemetry log, combat record, progression ledger, or payment/provider authority surface.

## 2. Candidate Table Naming

Preferred table name:

- `ooh_outskirts_mission_session`

Rationale:

- It is narrow and explicitly scoped to mission/session continuity.
- It aligns with the existing `ooh_outskirts_mission_instance` naming shape.
- It avoids implying a broad runtime dump or generalized application session store.
- It keeps the future persistence scaffold attached to mission identity rather than frontend UI state.

Alternatives considered:

- `ooh_outskirts_runtime_session`: rejected for the first scaffold because it is broader and could invite unrelated runtime state persistence.
- `ooh_outskirts_play_session`: rejected because it is too frontend-surface-oriented and could blur UI shell state with server continuity.
- `ooh_outskirts_mission_runtime`: rejected because it sounds like an active runtime authority table rather than a continuity anchor.

Initial implementation should use `ooh_outskirts_mission_session` unless a later schema phase identifies a concrete conflict.

## 3. Minimal Field Scope (Conceptual Only)

The first table should remain small and conceptual until a dedicated schema implementation phase translates it into Drupal schema syntax.

Minimal conceptual fields:

- `mission_session_id`: public/stable session UUID or equivalent generated identifier.
- `payload_uuid`: reference to the canonical ENTER payload UUID.
- `route_identity`: normalized route/path identity used for reconstruction and display context.
- `activation_timestamp`: timestamp for when the session is activated or anchored, if activation is included in the authorized implementation phase.
- `reset_generation`: integer reset lineage marker, initially non-gameplay and non-outcome bearing.
- `created`: server-side creation timestamp.
- `changed`: server-side last-changed timestamp.

Likely supporting implementation fields, subject to the schema phase:

- Internal serial `id` primary key.
- Mission instance UUID or internal mission instance reference, if needed for efficient lookup.
- User identifier, including anonymous `0`, only if ownership checks require it.

Fields must remain references and continuity metadata. They must not store combat state, telemetry streams, frontend snapshots, rewards, inventory, progression, provider data, or checkout state.

## 4. Explicit Exclusions

The first mission session table must exclude:

- No telemetry persistence.
- No combat state.
- No encounter outcome state.
- No damage, health, target, or AI state.
- No progression.
- No inventory.
- No reputation.
- No rewards or mission completion state.
- No payment/provider fields.
- No credit, package, checkout, or fulfillment fields.
- No entitlement state.
- No gameplay authority.
- No frontend localStorage dump.
- No HUD/readout/cadence history.

Any future need for these systems must pass through a separate specification and implementation phase.

## 5. Index / Idempotency Strategy

Indexing should support narrow continuity lookup and replay containment without broad gameplay semantics.

Recommended uniqueness boundaries:

- Unique key on `mission_session_id`.
- Index on `payload_uuid`.
- Index on mission instance UUID/reference if included.
- Optional composite index on mission identity plus `reset_generation` if reset lineage needs lookup.

Replay containment:

- Repeated browser reloads must not create duplicate session authority.
- Replayed ENTER or activation attempts must not multiply authoritative session rows without an explicit idempotency key or ownership rule.
- Reset lineage must remain explicit through `reset_generation`; it must not be inferred from frontend state.

Duplicate activation prevention:

- Future controller writes should check whether a mission/session anchor already exists for the relevant mission/payload boundary before creating another row.
- If activation and session creation are separated, the activation phase must define its own idempotency behavior before writing.

Update-hook safety:

- Table creation must be additive.
- Update hook must check whether `ooh_outskirts_mission_session` already exists before creating it.
- No destructive updates.
- No data insertion during table creation.
- No reinterpretation of existing `ooh_outskirts_enter_payload` or `ooh_outskirts_mission_instance` rows.

## 6. Lifecycle Semantics

Allowed lifecycle language for this scaffold is observational only.

Conceptual phases:

- `staged`: a session anchor exists or is prepared, but gameplay authority has not been established.
- `activated`: the mission shell has crossed an authorized activation boundary, without implying combat truth, progress, rewards, or completion.
- `reset`: reset lineage has advanced or been observed, without implying failure, rollback, or outcome authority.
- `terminated`: the session is no longer active for continuity purposes, without implying mission success, failure, or reward settlement.

Lifecycle must remain continuity metadata. It must not become:

- Combat readiness authority.
- Mission completion authority.
- Progression authority.
- Reward authority.
- Payment/entitlement authority.
- AI/event authority.

If a lifecycle/status field is added later, it must use names and values that preserve this separation.

## 7. Reset / Hydration Containment

Reset-safe reconstruction:

- Server-side session identity should help future `/play` reconstruction without relying on browser localStorage as authority.
- `reset_generation` should describe replay-safe lineage, not gameplay outcome.
- Frontend reset behavior must remain transient until an explicit backend reset phase exists.

Hydration-safe lifecycle boundaries:

- Hydration may read session and payload references later, but lookup success must not activate combat, grant rewards, or mark progress.
- Hydration must reconstruct only the minimum safe runtime shell context.
- Missing or stale frontend state must remain recoverable without converting local state into server authority.

Transient runtime separation:

- Telemetry pulse lines, cadence timers, combat preview state, HUD copy, and DOM classes remain frontend-local.
- Reload/reset must clear transient runtime state naturally.
- Runtime atmosphere and telemetry drift must not be persisted into the mission session table.

## 8. Implementation Guardrails

Future implementation must follow these guardrails:

- Additive-only schema strategy.
- No destructive updates.
- No table drops, renames, or field reinterpretation.
- Schema-first before controller writes.
- No controller writes until the table exists and is frozen.
- No frontend reads until a read contract is specified.
- Freeze checkpoint after table creation.
- No mixed gameplay persistence phases.
- No telemetry persistence.
- No provider/payment coupling.
- No speculative fields for inventory, progression, AI, rewards, or combat authority.
- One authority surface at a time.

The next implementation phase should create only the table schema and idempotent update hook, then freeze. Controller writes, frontend hydration integration, activation authority, reset authority, and gameplay systems must remain deferred until separately authorized.
