# Mission Authority Shell Specification - 2026-05

This specification defines the future mission/session authority shell before any persistence-capable implementation begins. It is a gating reference for future runtime authority phases and does not authorize gameplay authority, monetization coupling, combat outcomes, progression, or backend lifecycle mutation by itself.

## 1. Authority Shell Purpose

The mission authority shell is responsible for creating a server-recognizable continuity frame around a mission runtime without turning `/play` presentation behavior into gameplay truth.

Primary responsibilities:

- Session continuity: identify a runtime mission session across reloads, fallback hydration, and controlled reentry.
- Mission identity: preserve `missionUuid` as the public runtime identity key while keeping internal payload linkage server-side.
- Payload continuity: anchor the current canonical ENTER payload to the runtime session without exposing general payload dumping behavior.
- Runtime lifecycle anchoring: define explicit staged and activated boundaries for future server-side continuity work.
- Observational isolation: allow `/play` to observe shell state without making telemetry, UI classes, combat preview, or browser-local state authoritative.

## 2. Explicit Non-Authority Boundaries

- Telemetry remains non-authoritative display behavior.
- Frontend UI state is not canonical mission truth.
- DOM attributes, CSS classes, local timers, and local storage are not durable authority.
- Combat state is not authoritative yet.
- Encounter actions remain preview/local until a future combat authority phase explicitly changes that boundary.
- No entitlement, credits, inventory, reward, or monetization semantics attach to the mission shell.
- Provider/payment systems remain isolated from mission/session authority.
- No gameplay progression authority exists in this shell.
- Lifecycle labels must not imply mission success, failure, completion, reward, damage, health, or AI decision-making.

## 3. Proposed Authority Primitives

These are conceptual primitives only. They should be introduced narrowly by future implementation phases only when needed.

- `mission_session_id`: server-side identity for a runtime session attached to a mission instance.
- `runtime_payload_id`: server-side reference to the canonical payload snapshot used to construct the runtime session.
- `activation_timestamp`: server-recorded moment when a mission session first crosses an approved activation boundary.
- `route_identity`: normalized route context used for continuity and reconstruction.
- `reset_generation`: replay-safe counter or token describing reset lineage without granting gameplay outcome authority.
- `observational_state`: minimal read-only state visible to `/play` for hydration, diagnostics, or presentation alignment.

## 4. Lifecycle Phases

- `staged`: canonical payload exists and the mission can be rendered, but activation authority has not been recorded.
- `activated`: mission/session shell records the first approved activation boundary. This is not gameplay success, progress, or combat truth.
- `encounter-capable`: shell may expose that local encounter preview can be rendered. This is not combat authority or enemy state.
- `reset`: transient frontend runtime state is cleared; future server semantics must define whether this records a new reset generation or remains local-only.
- `terminated`: future explicit close boundary, if needed. It must not imply success, failure, reward, or progression without a separate authority phase.

## 5. Reset / Idempotency Doctrine Integration

- Activation must be replay-safe. Repeated activation attempts must not create duplicate mission authority outcomes.
- Reset must not multiply, erase, or mutate authority unless a future phase defines an idempotent server boundary for it.
- Hydration must reconstruct from server-recognized identity and canonical payload references, not from browser-visible truth.
- Reset must fully clear transient runtime state such as local timers, local readouts, local combat preview flags, and DOM activation classes.
- Durable mission/session state must not depend on frontend reload timing, browser history, local storage integrity, or repeated visible navigation.
- Future write endpoints must define idempotency keys, accepted replay behavior, and duplicate response semantics before implementation.

## 6. Proposed Attachment Boundaries

Safest backend insertion points:

- After canonical ENTER payload save, while the payload and mission UUID are already server-created.
- In a new mission/session shell endpoint separate from `/ooh/mission-lookup`.
- Behind the same CSRF and ownership posture used by current runtime endpoints unless future access review requires stricter rules.

Safest frontend observation boundaries:

- `serverMissionUuid` as the carried identity from `/dossier` to `/play`.
- `/play` bootstrap after payload audit or fallback mission lookup has succeeded.
- Read-only observational metadata exposed to existing debug/hydration surfaces.

Safest reset-safe continuity points:

- `resetMissionRuntime()` remains the frontend transient-state clearing boundary.
- Future server reset semantics should be explicit and separate from local visual reset.
- Any future reset generation should be read-only to `/play` until a later authority phase defines write semantics.

## 7. Explicit Deferred Systems

- Persistent inventory.
- Progression and reputation.
- Combat authority, damage, health, outcomes, and enemy behavior.
- Multiplayer or live state synchronization.
- AI runtime authority.
- Monetization authority and provider adapter execution.
- Entitlement, credits, rewards, or fulfillment decisions.
- Backend telemetry authority or durable gameplay analytics.

## 8. Anti-Drift Implementation Rules

- Reopen one authority surface at a time.
- Do not mix persistence and gameplay mechanics in one implementation phase.
- Do not mix payment/provider work with mission/session authority work.
- Do not use telemetry, local combat preview, or UI atmosphere as authority signals.
- Do not introduce speculative schema fields without a concrete lifecycle use.
- Keep commits narrow and validation-first.
- Preserve fallback hydration and audit-before-render behavior.
- Preserve reset/idempotency doctrine and replay containment.
- Add freeze checkpoints after each authority milestone before expanding the next layer.
- If a proposed implementation blurs presentation, continuity, and authority, stop and document the boundary before coding.
