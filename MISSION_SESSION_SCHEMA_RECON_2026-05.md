# Mission Session Schema Recon - 2026-05

This recon audits existing schema and update-hook patterns before any mission/session persistence scaffold is designed. It is documentation-only and does not authorize schema creation, controller writes, frontend changes, gameplay authority, or provider/payment coupling.

## 1. Existing Schema / Update-Hook Patterns

- `ooh_outskirts_schema()` defines module-owned database tables in `modules/custom/ooh_outskirts/ooh_outskirts.install`.
- Existing table definitions use Drupal schema arrays with:
  - `description`
  - `fields`
  - `primary key`
  - `unique keys`
  - `indexes`
- Existing primary identifiers use unsigned `serial` `id` fields.
- Public correlation identifiers use UUID varchar fields with length `128`.
- User ownership/context uses unsigned integer `uid` with anonymous default `0`.
- Timestamps use unsigned integer Unix timestamps.
- JSON payload bodies are stored as text fields, with large payload snapshots using `size => big`.
- Existing update hooks are additive and idempotent:
  - `ooh_outskirts_update_9301()` creates `ooh_outskirts_enter_payload` only if missing.
  - `ooh_outskirts_update_9302()` creates `ooh_outskirts_mission_instance` only if missing.
  - `ooh_outskirts_update_9303()` conditionally ensures both current runtime tables exist for already-installed modules.

## 2. Existing Mission / Runtime Tables

### `ooh_outskirts_enter_payload`

Stores canonical ENTER payload snapshots saved by the server.

Relevant fields:

- `id`
- `uuid`
- `uid`
- `payload_version`
- `playlist_id`
- `path_id`
- `campaign_route_id`
- `route_id`
- `mission_route_id`
- `mission_type`
- `mission_id`
- `selected_attributes`
- `payload_snapshot`
- `created`

Current authority role:

- Server-authoritative canonical payload capture.
- Hydration support through stored `payload_snapshot`.
- Not gameplay authority, progression authority, or entitlement truth.

### `ooh_outskirts_mission_instance`

Stores inert mission instance identity and payload linkage records.

Relevant fields:

- `id`
- `uuid`
- `enter_payload_id`
- `enter_payload_uuid`
- `uid`
- `lifecycle_state`
- `created`
- `updated`

Current authority role:

- Mission identity and continuity placeholder.
- `lifecycle_state` currently has inert `created` semantics only.
- Not activation authority, progression authority, combat authority, or gameplay readiness truth.

## 3. Safe Candidate Table Boundaries

Any future mission/session scaffold should be separate from existing payload and mission instance tables unless a narrow phase explicitly justifies extending them.

Safer candidate boundary:

- A new mission session table linked to `ooh_outskirts_mission_instance`.
- Public lookup keyed by mission UUID or a new session UUID, not internal numeric IDs.
- Server-side ownership/context tied to `uid`.
- Read-only hydration exposure should remain minimal and separate from write authority.

Avoid:

- Overloading `ooh_outskirts_mission_instance.lifecycle_state` with gameplay authority.
- Writing durable session state directly from telemetry, DOM state, local timers, or local combat preview.
- Adding provider/payment fields to mission/session tables.
- Storing broad frontend state dumps as authority.

## 4. Proposed Conceptual Fields Only

Conceptual future mission/session fields may include:

- `id`: internal serial primary key.
- `uuid`: stable mission session UUID.
- `mission_uuid`: public mission instance UUID linkage.
- `mission_instance_id`: internal mission instance linkage.
- `enter_payload_uuid`: payload linkage support for audit and reconstruction.
- `uid`: user context or anonymous `0`.
- `runtime_payload_id`: canonical payload reference, if separated from mission instance linkage.
- `route_identity`: normalized route context for reconstruction.
- `activation_timestamp`: first approved activation boundary timestamp.
- `reset_generation`: replay-safe reset lineage marker.
- `observational_state`: minimal non-authoritative state label or JSON for hydration/debug only.
- `created`: creation timestamp.
- `updated`: update timestamp.

These fields are conceptual only. A later implementation phase must decide exact names, types, indexes, uniqueness, update hook number, and migration behavior.

## 5. Idempotency / Update-Hook Risks

- Update hooks must be safe when tables already exist.
- New schema creation should check `tableExists()` before creating tables.
- Alter hooks must guard against existing fields and indexes before adding them.
- Re-running database updates must not duplicate authority state or rewrite existing lifecycle meaning.
- Activation-related writes need explicit idempotency behavior before implementation.
- Session creation must define whether repeated activation attempts return the existing session or create a new reset generation.
- Future hooks must not drop, rename, or reinterpret existing runtime tables without a separate migration doctrine.

## 6. Reset / Replay Containment Concerns

- Browser reload and frontend reset are not durable reset authority.
- `resetMissionRuntime()` clears local presentation state only.
- Mission/session reset persistence, if introduced later, needs an explicit server endpoint and replay-safe semantics.
- Repeated ENTER saves, repeated activation clicks, repeated mission lookups, and repeated browser refreshes must not multiply authority outcomes.
- Hydration reconstruction must remain audit-safe and should not trust local storage as canonical mission/session state.
- Any future `reset_generation` or activation boundary must avoid implying mission success, failure, reward, progression, damage, or combat outcome.

## 7. Explicit Non-Goals

- No schema creation yet.
- No update hook implementation yet.
- No controller writes.
- No frontend changes.
- No gameplay authority.
- No activation authority implementation.
- No combat authority, progression, reputation, inventory, rewards, or outcomes.
- No provider/payment coupling.
- No telemetry coupling.
- No changes to existing payload save, mission lookup, hydration, or reset behavior.

## Recommended Next Step

The next phase should be a schema contract specification for the mission/session persistence scaffold. It should define table name, exact fields, indexes, idempotency behavior, update hook number, ownership rules, and non-authority guarantees before implementation.
