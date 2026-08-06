# Ad Silentium Architecture Recovery

## Purpose

This document closes the Milestone III recovery interlude and records the architectural decision reached after restoring and auditing the original Ad Silentium front half.

The key result is that the original landing, prologue, dossier generator, and ENTER payload chain still exist and can feed the current Milestones I-II runtime. Milestone III should therefore adapt the recovered generator output into canonical runtime selectors instead of replacing the generator with a new generated-game authority.

## Verified Recovery Chain

```text
Homepage
-> Prologue
-> /dossier
-> existing dossier generator
-> ENTER payload save
-> /play
-> /play/mission?missionUuid=...
-> current runtime
```

The restored Phase 2.6 localhost smoke test proved the front-to-back spine from landing through runtime field entry.

## Landing And Prologue Contract

The landing page owns the first-visit narrative entry and user-controlled replay of the prologue.

Current contract:

- `/landingpage` renders the landing page through `OohPageController::landingpage()`.
- The restored Twig, CSS, and JavaScript provide the first-visit prologue modal.
- `Read Prologue` reopens the prologue without creating gameplay state.
- Prologue `ENTER` sends the player to `/dossier`.
- Homepage `ENTER` also hands off to `/dossier`.

The landing/prologue system is an entry contract, not a runtime generator and not campaign state authority.

## Dossier Generator Contract

The dossier generator is the authoritative source of the player's selected game setup.

Primary files:

```text
modules/custom/ooh_outskirts/src/Plugin/Block/OohGameGeneratorBlock.php
modules/custom/ooh_outskirts/js/ooh_game_generator.js
modules/custom/ooh_outskirts/src/Controller/OohPageController.php
modules/custom/ooh_outskirts/ooh_outskirts.routing.yml
modules/custom/ooh_outskirts/ooh_outskirts.install
```

Generator inputs:

- playlist
- path
- recruiter
- selected attributes
- campaign route
- mission type
- mission prompt library

Generator-derived values:

- character payload
- route payload
- mission route ID
- campaign route ID
- access tier
- generated timestamp
- prompt snapshot

Local browser state is continuity-only. Server persistence is authoritative after `POST /ooh/enter-payload/save`.

## Payload Contract

The canonical payload is produced by `OohPageController::canonicalEnterPayload()` and persisted in `ooh_outskirts_enter_payload`.

Persisted scalar fields:

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

Persisted identity fields:

- payload UUID: stable ENTER payload identity
- mission UUID: stable mission instance identity

The mission instance table `ooh_outskirts_mission_instance` links the mission UUID back to the payload row. The mission UUID already has established authority and should not be renamed as `generatedGameId`.

## Runtime Contract

The current runtime consumes the persisted dossier payload directly or through mission lookup.

Primary files:

```text
modules/custom/ooh_outskirts/js/ooh_play.js
modules/custom/ooh_outskirts/js/playable/ooh_playable_boot.js
modules/custom/ooh_outskirts/js/playable/core/AssetManifest.js
modules/custom/ooh_outskirts/js/playable/levels/LevelDefinitionRegistry.js
modules/custom/ooh_outskirts/js/playable/render/RendererAdapter.js
modules/custom/ooh_outskirts/js/playable/render/SceneBuilder.js
```

Active runtime selectors:

- `routeId` controls route presentation and atmosphere.
- `missionId` / `missionType` select the current canonical level where supported.
- `playlist` controls media and mood presentation.
- `path`, `recruiter`, and `selectedAttributes` control character presence, briefing, and evolution readouts.
- `missionUuid` hydrates `/play/mission` through mission lookup.

Current canonical level mapping is intentionally narrow:

```text
recon    -> development_arena
survival -> alternate_arena
```

Unsupported mission types fall back safely rather than proving a generated campaign is present.

## Preserved Historical Systems

Recovered or preserved material includes:

- AER prompt libraries
- MARE prompt libraries
- TERRA prompt libraries
- character and recruiter source notes
- mission type system notes
- route and prompt data
- runtime loop generator doctrine and source
- deterministic runtime loop presets
- Operation Alpha presentation/runtime systems

Many of these systems are present as data, partially implemented presentation behavior, or historical source material. They are not yet a single active full-build campaign progression system.

## Architecture Decision

Decision:

```text
REVISE PAUSED BUILDER INTO A NARROW ADAPTER
```

Rationale:

- The recovered dossier generator already defines the player's selected game setup.
- The persisted payload already stores the server-authoritative fields needed by the current runtime.
- The mission UUID already identifies the mission instance.
- The current runtime already consumes most recovered payload information.
- A new generated-game builder duplicates existing authority and begins inventing campaign concepts that the recovered architecture has not yet proven.

## Non-Decisions

Do not infer the following from the recovery audit:

- no approved ordered campaign model yet
- no approved campaign ID yet
- no approved deterministic gameplay seed yet
- no approved level-instance identity yet
- no approved save-slot or campaign progress model yet
- no approved lazy mutation during mission lookup

These concepts may be valuable later, but they belong in explicit future phases after adapter integration is proven.

## Phase 3 Direction

Milestone III Phase 3 should resume as:

```text
Milestone III Phase 3 - Existing Generator Contract Adapter
```

Objective:

```text
Translate the existing persisted dossier payload into canonical runtime selectors without replacing the generator, duplicating mission identity, inventing campaign sequence, or mutating lookup state.
```

The adapter should be narrow. It should normalize and expose what already exists:

```text
existing payload
-> canonical runtime selectors
```

It should not create a separate generated-game authority.

## Protected Paused Work

The paused Phase 3 experiment remains useful as evidence but should not be resumed directly.

Paused files:

```text
modules/custom/ooh_outskirts/src/Controller/OohPageController.php
modules/custom/ooh_outskirts/src/GeneratedGameDefinitionBuilder.php
```

The next implementation phase should decide whether to remove, replace, or mine this paused work only after the adapter contract is approved.

## Final Recovery Result

The recovery interlude answered the critical architectural question:

```text
Can the recovered Ad Silentium front half feed the current Milestones I-II back half?
```

Answer:

```text
Yes, through a narrow Existing Generator Contract Adapter.
```