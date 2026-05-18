# Mission Authority Recon - 2026-05

This recon maps the current `/play` mission activation lifecycle before reopening the first approved reentry target: mission/session authority shell. It is documentation-only and does not authorize persistence, gameplay authority, progression, monetization coupling, or backend lifecycle mutation.

## Current Activation Entry Points

- `/dossier` ENTER flow builds a client payload, validates required selections, requests a CSRF token, and posts to `/ooh/enter-payload/save`.
- `OohPageController::saveEnterPayload()` canonicalizes the ENTER payload, creates an `ooh_outskirts_enter_payload` row, creates an `ooh_outskirts_mission_instance` row, and returns `id`, `uuid`, and `missionUuid`.
- `ooh_game_generator.js` stores temporary continuity data in `ooh_game_generator_state_v1`, including `payload`, `serverPayloadUuid`, and `serverMissionUuid`, then redirects to `/play`.
- `/play` reads `ooh_game_generator_state_v1`, audits the payload, and renders through `renderMissionPayload()`.
- If local payload audit fails but `serverMissionUuid` exists, `/play` posts to `/ooh/mission-lookup` and uses the returned payload only as fallback hydration input.
- Primary runtime activation is bound in `renderMissionPayload()` through `[data-ooh-activate-mission]`, calling `activateMission()`.
- Combat preview activation is bound through `[data-ooh-combat-gate-button]`, calling `activateCombatShell()`.
- Encounter preview actions are bound through `.ooh-play-encounter__action`, calling `triggerEncounterAction()`.
- Passive keyboard and HUD actions call `triggerPassiveAction()` and remain frontend-local presentation behavior.

## Current Runtime-Only State Surfaces

- Local storage key: `ooh_game_generator_state_v1`.
- DOM state:
  - `data-ooh-payload-status`
  - `data-ooh-mission-uuid`
  - `data-mission-state`
  - `data-combat-state`
  - route/path/mission/playlists attributes on the scene shell
  - activation classes such as `is-mission-active`, `is-combat-shell`, and `is-combat-armed`
- Transient JS structures:
  - `combatState` created inside `renderMissionPayload()`
  - telemetry and cadence timer handles attached to the root/readout/button nodes
  - transient encounter button pulse timers
- Reset lifecycle:
  - `resetMissionRuntime()` stops local telemetry/cadence timers, clears active shell classes and combat state attributes, hides combat/encounter surfaces, disables combat gate actions, and restores staged/offline copy.
  - Browser reload naturally clears in-memory runtime state and rehydrates from local storage or mission lookup fallback.

## Existing Authority Boundaries

- Server-side ENTER payload save is the current authority for canonical payload capture and mission instance creation.
- `ooh_outskirts_mission_instance.lifecycle_state` is currently an inert continuity placeholder with `created` semantics only.
- `/ooh/mission-lookup` is read-only and hydration-only. It joins mission instance to ENTER payload and returns minimum payload data for `/play` recovery.
- `/play` activation, combat shell preview, encounter actions, telemetry, and atmosphere are frontend-local and non-authoritative.
- Local storage is continuity convenience only. It is not mission authority, gameplay authority, entitlement truth, payment truth, or durable state ownership.
- Current backend touchpoints are:
  - `/ooh/enter-payload/save`
  - `/ooh/mission-lookup`
  - Drupal CSRF token endpoint
- No current `/play` action writes mission lifecycle, progression, combat state, rewards, or gameplay outcomes.

## Candidate Future Authority Insertion Points

- Mission/session identity shell:
  - Use `serverMissionUuid` as the primary frontend-carried identity.
  - Keep `enter_payload_uuid` as an internal join/support key, not the public runtime authority key.
  - Future server session shell should attach after canonical ENTER save and before any durable gameplay state is introduced.
- Payload continuity:
  - Safest existing read boundary is `/ooh/mission-lookup`, which already hydrates by `missionUuid`.
  - Future continuity should remain read-only until a separate authority-reviewed write boundary exists.
  - Hydration should continue to pass through `auditPayload()` before render.
- Reset-safe lifecycle:
  - `resetMissionRuntime()` is the safest frontend-local boundary for clearing presentation-only state.
  - Future durable state must not depend on DOM classes, timer handles, or browser reload behavior.
- Activation-safe attachment:
  - `activateMission()` is the current UI activation boundary, but it should not become server authority by itself.
  - A future mission/session authority shell should prefer an explicit server endpoint or pre-activation server readiness check rather than interpreting the button click as durable mission start.
- Encounter-safe attachment:
  - `activateCombatShell()` and `triggerEncounterAction()` are preview-only today.
  - Any future encounter-state authority should use a separate namespace and endpoint, not the existing local `combatState` object as durable truth.

## Explicit Non-Goals

- No persistence implementation in this recon phase.
- No gameplay authority.
- No lifecycle mutation beyond current inert `created` placeholder.
- No progression, reputation, rewards, inventory, entitlement, damage, health, or outcome systems.
- No monetization or provider coupling.
- No telemetry coupling to authority decisions.
- No change to activation cadence, phrase pools, atmosphere behavior, or reset architecture.

## Risk Observations

- Cadence-sensitive areas:
  - `startLocalTelemetryPulse()`, `showLocalCadenceBeat()`, and `showSessionEvolutionFeedback()` are tuned presentation flows and should not be reused for authority signaling.
- Hydration-sensitive areas:
  - `/play` currently tolerates missing/invalid local payload only through mission lookup fallback when `serverMissionUuid` exists.
  - Any future session shell must preserve audit-before-render behavior.
- Reset-sensitive areas:
  - `resetMissionRuntime()` clears presentation state only. It must not be interpreted as deleting durable mission state unless a future server authority phase explicitly defines that behavior.
- Replay/idempotency concerns:
  - ENTER save currently creates payload and mission rows once per successful ENTER request.
  - Future authority writes must define idempotency keys and replay behavior explicitly before adding durable mission/session state changes.
- Boundary drift concerns:
  - DOM attributes and local `combatState` are convenient for rendering but unsafe as backend authority models.
  - Provider/payment state must remain outside mission/session authority work unless a later phase explicitly opens monetization authority implementation.

## Recommended Next Phase

The next implementation phase should be a narrow mission/session authority shell specification before code changes. It should define endpoint names, accepted keys, ownership rules, idempotency expectations, response shape, and non-authority guarantees before any persistence write path is added.
