# OA-191 Three Mission Blueprint Architecture

## Purpose

This document defines the first three reusable mission templates for Operation Alpha without implementing them yet. It is a launch-scope blueprint for controlled content expansion after the current Unseen Hand command console, Battlefield Presence, and Asset Movement layers.

The purpose is to keep Operation Alpha focused as a vertical slice. These templates describe mission shape, actor use, decision pressure, and consequence categories before runtime integration begins.

## Global Player Role

The player is:

THE UNSEEN HAND

The player does not directly fight, move units, path assets, manage inventory, or control factions at scale. The player's role is to:

- observe battlefield state
- issue directives
- influence assets
- pressure marks
- trigger consequences
- shape outcomes indirectly

Operation Alpha should continue to feel like the player is directing an operation through incomplete signals, not piloting a combat system.

## Mission Template A — Ronin Conflict

Mission premise:

A Ronin-aligned asset or cell is caught between survival duty, civilian protection, and Warlord pressure. The Unseen Hand must influence the field without exposing the channel.

Battlefield location:

Ruined checkpoint, signal-fog road, abandoned overpass, low-visibility market corridor, or broken transit yard.

Main conflict:

Ronin movement is compromised while hostile pressure closes in. The player must decide whether to hold, advance, divert, extract, or deploy signal interference to preserve the operation.

Possible actors:

- Ronin scout
- Ronin courier
- Ronin relay keeper
- civilian runner
- Warlord patrol listener
- unknown signal observer

Possible marks:

- hesitant Ronin asset
- exposed civilian corridor
- Warlord trace operator
- unstable relay point
- compromised extraction window

Unseen Hand decision points:

- hold the Ronin asset in cover or push them through the corridor
- open extraction at the cost of higher signal exposure
- divert hostile attention away from civilians
- deploy false traffic to split pursuit
- pressure the mark before the relay collapses

Consequence categories:

- asset survives
- asset lost
- extraction succeeds
- extraction compromised
- faction pressure rises
- civilian corridor affected
- operation remains unresolved

Replay variation hooks:

- different Ronin actor assigned to the same conflict shell
- alternate civilian corridor status
- changing Warlord pressure level
- different mark instability language
- alternate extraction or diversion consequence text

## Mission Template B — Mutant Breach

Mission premise:

A mutant group, anomaly, or bio-static event breaks into a contested corridor. The Unseen Hand must shape asset movement and signal pressure before the breach spreads.

Battlefield location:

Service bridge, waterline, drainage tunnel, bio-static corridor, collapsed utility passage, or cross-reality underpass.

Main conflict:

Mutant movement creates instability that threatens civilians, Ronin assets, or the mission channel itself. The player influences containment, diversion, observation, or extraction without turning the sequence into combat.

Possible actors:

- mutant pack scout
- unstable mutant mark
- Ronin watcher
- civilian group under cover
- Warlord opportunist
- unknown corridor signal

Possible marks:

- breach origin point
- unstable mutant contact
- exposed civilian hiding place
- contaminated signal corridor
- false movement trace

Unseen Hand decision points:

- hold observation while the breach pattern resolves
- advance assets through low visibility before pressure spikes
- extract civilians before the corridor changes shape
- deploy signal interference to confuse hostile attention
- divert the mutant path away from the immediate mark

Consequence categories:

- mark destabilized
- mark escapes
- signal corrupted
- extraction succeeds
- extraction compromised
- civilian corridor affected
- operation remains unresolved

Replay variation hooks:

- different mutant actor or pack signal
- alternate breach location
- changing bio-static pressure text
- different asset exposure level
- alternate signal corruption or containment result

## Mission Template C — Warlord Offensive

Mission premise:

A Warlord command band initiates pressure against a corridor, relay, safehouse, or Ronin route. The Unseen Hand must disrupt the offensive indirectly.

Battlefield location:

Relay tower, command-swept road, ruined safehouse perimeter, fogged concrete channel, or hostile checkpoint grid.

Main conflict:

Warlord pressure is organized, escalating, and trace-oriented. The player must decide how to misdirect, slow, confuse, or fracture the offensive while preserving the Unseen Hand channel.

Possible actors:

- Warlord commander
- Warlord patrol listener
- Ronin cell under pressure
- civilian route guide
- mutant interference source
- unknown signal decoy

Possible marks:

- hostile command trace
- exposed relay tower
- pursued Ronin cell
- civilian safe route
- unstable signal decoy

Unseen Hand decision points:

- hold position to avoid command trace detection
- advance assets before the sweep closes
- extract exposed assets through a narrow corridor
- deploy signal clutter to split command attention
- divert the offensive toward a false corridor

Consequence categories:

- asset survives
- asset lost
- mark destabilized
- mark escapes
- signal corrupted
- faction pressure rises
- civilian corridor affected
- operation remains unresolved

Replay variation hooks:

- different Warlord pressure source
- alternate command band language
- changing patrol sweep timing
- different false corridor or decoy signal
- alternate faction pressure result

## Shared Actor Pool Doctrine

Launch-safe character pool target:

- approximately 10-12 Ronins
- approximately 10-12 Mutants
- approximately 2-3 Warlords

These actors may be reused across missions.

Reuse is intentional.

The goal is world continuity, not massive scale. A smaller actor pool with repeated appearances can make the battlefield feel coherent, especially when the same names recur across different pressure states, mission templates, and consequence categories.

This doctrine avoids character roster sprawl before the mission templates have proven useful.

## Consequence Pool Doctrine

Consequence categories:

- asset survives
- asset lost
- mark destabilized
- mark escapes
- signal corrupted
- extraction succeeds
- extraction compromised
- faction pressure rises
- civilian corridor affected
- operation remains unresolved

Do not implement consequences yet.

For now, consequences should remain a documented content pool. Later implementation can map these categories to mission result text, Battlefield Presence updates, mark reactions, and post-mission state language without adding persistence or procedural generation before launch.

## Post-OA-191 Implementation Sequence

Next likely phases:

- OA-192 Populate Ronin Actor Pool
- OA-193 Populate Mutant Actor Pool
- OA-194 Populate Warlord Actor Pool
- OA-195 Expand Mark Personality
- OA-196 Expand Consequence Pool
- OA-197 Playlist Atmosphere Handoff
- OA-198 Mission Template Runtime Integration

This sequence keeps content expansion controlled. Actor pools, mark personality, and consequence language should be defined before runtime integration attempts to combine them.

## Launch Boundary

Before 6/1, the project should avoid:

- full procedural generator
- full combat
- inventory
- account progression
- persistent faction reputation
- 100+ portraits
- Spotify OAuth
- payment fulfillment

Operation Alpha remains a focused vertical slice:

UNSEEN HAND
↓
COMMAND CONSOLE
↓
BATTLEFIELD PRESENCE
↓
ASSET MOVEMENT
↓
THREE MISSION BLUEPRINT
