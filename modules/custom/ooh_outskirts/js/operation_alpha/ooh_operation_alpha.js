(function () {
  'use strict';

  console.log('OA-206 Operation Alpha runtime loaded');

  var storageKey = 'ooh_operation_alpha_intro_seen_v1';
  var signalStorageKey = 'ooh_operation_alpha_signal_dismissed_v1';
  var playlistStorageKey = 'ooh_operation_alpha_playlist_selection_v1';
  var scenarioDelayMs = 1500;
  var actorRegistryPaths = [
    '/operation_alpha/oa_actor_registry.csv',
    '/operation_alpha/generated_actor_registry/oa_actor_registry.csv'
  ];
  var actorRegistryColumnMap = {
    Portrait: 'portrait',
    Path: 'path',
    Faction: 'faction',
    Role: 'role',
    'Transmission Style': 'transmissionStyle',
    'Mission Usage': 'missionUsage',
    'Original File': 'originalFile',
    'Path Color': 'pathColor',
    'Path Alignment': 'pathColor',
    Loyalty: 'loyalty',
    Name: 'name'
  };
  var atmosphereClasses = [
    'is-atmosphere-low',
    'is-atmosphere-static',
    'is-atmosphere-pressure',
    'is-atmosphere-bleed'
  ];

  var atmosphereStates = [
    {
      label: 'ATMOSPHERE: LOW HUM',
      pressure: 'SIGNAL PRESSURE 01',
      className: 'is-atmosphere-low'
    },
    {
      label: 'ATMOSPHERE: SIGNAL STATIC',
      pressure: 'SIGNAL PRESSURE 02',
      className: 'is-atmosphere-static'
    },
    {
      label: 'ATMOSPHERE: FIELD PRESSURE',
      pressure: 'SIGNAL PRESSURE 03',
      className: 'is-atmosphere-pressure'
    },
    {
      label: 'ATMOSPHERE: MARK BLEED',
      pressure: 'SIGNAL PRESSURE 04',
      className: 'is-atmosphere-bleed'
    }
  ];

  var commandDirectives = {
    hold: {
      state: 'WAIT',
      acknowledgement: 'UNSEEN HAND DIRECTIVE RECEIVED // WAIT',
      runtimeCopy: 'Holding current field posture. Observation priority increased.',
      activationStatus: 'Hold directive accepted. Field elements remain concealed.',
      reaction: 'Hold pattern established. The field quiets around the mark.',
      pressure: 'OBSERVATION HOLD',
      battlefield: {
        field: 'Observation priority increased across Sector 17.',
        movement: 'Friendly elements holding shadow line.',
        signal: 'Contact risk contained under low-band silence.'
      },
      movementMode: 'hold'
    },
    advance: {
      state: 'TAKE A RISK',
      acknowledgement: 'FORWARD PRESSURE AUTHORIZED',
      runtimeCopy: 'Risk pressure active. The scene begins to move.',
      activationStatus: 'Risk accepted. Field pressure moving forward.',
      reaction: 'Forward pressure building. Contact risk begins to climb.',
      pressure: 'FORWARD PRESSURE',
      battlefield: {
        field: 'Forward pressure building beyond the fog line.',
        movement: 'Ronin scout element pushing toward the mark channel.',
        signal: 'Contact risk increasing along hostile sweep bands.'
      },
      movementMode: 'advance'
    },
    extract: {
      state: 'GET THEM OUT',
      acknowledgement: 'EXTRACTION ORDER ISSUED',
      runtimeCopy: 'Extract directive active. Corridor opening and exposure decreasing.',
      activationStatus: 'Extraction directive accepted. Corridor attention is shifting.',
      reaction: 'Extraction corridor opening. Exposed movement starts to thin.',
      pressure: 'EXTRACTION WINDOW',
      battlefield: {
        field: 'Extraction corridor opening through unstable cover.',
        movement: 'Civilian route markers shifting toward safe passage.',
        signal: 'Exposure decreasing as pursuit traffic thins.'
      },
      movementMode: 'extract'
    },
    signal: {
      state: 'GATHER INTEL',
      acknowledgement: 'SIGNAL DEPLOYMENT AUTHORIZED',
      runtimeCopy: 'Intel directive active. False traffic entering the mark channel.',
      activationStatus: 'Signal directive accepted. False traffic is propagating.',
      reaction: 'False traffic inserted. Signal confusion spreads across the approach.',
      pressure: 'SIGNAL CONFUSION',
      battlefield: {
        field: 'False traffic inserted into the outer approach.',
        movement: 'Hostile attention splitting across duplicate traces.',
        signal: 'Signal confusion spreading near the mark channel.'
      },
      movementMode: 'signal'
    },
    divert: {
      state: 'CHANGE THE PLAN',
      acknowledgement: 'OPERATIONAL ATTENTION REDIRECTED',
      runtimeCopy: 'Plan change active. Operational attention redirected.',
      activationStatus: 'Plan change accepted. Focus is bending away from the exposed line.',
      reaction: 'Attention redirected. Secondary cover begins carrying the operation.',
      pressure: 'DECOY PRESSURE',
      battlefield: {
        field: 'Operational attention redirected away from exposed movement.',
        movement: 'Asset path bending through secondary cover.',
        signal: 'Decoy pressure rising on the wrong corridor.'
      },
      movementMode: 'divert'
    }
  };

  var movementFeeds = {
    idle: [
      'RONIN SCOUT ADVANCING',
      'MUTANT PACK RELOCATING',
      'UNKNOWN TRAFFIC INTERCEPTED',
      'OUTER CORRIDOR ACTIVITY INCREASING'
    ],
    hold: [
      'RONIN SCOUT HOLDING POSITION',
      'ASSET ENTERING LOW VISIBILITY ZONE',
      'UNKNOWN TRAFFIC SLOWING NEAR SECTOR 17',
      'OBSERVATION LINE STABILIZING'
    ],
    advance: [
      'RONIN SCOUT ADVANCING',
      'OUTER CORRIDOR ACTIVITY INCREASING',
      'ASSET ENTERING LOW VISIBILITY ZONE',
      'MUTANT CONTACT DETECTED'
    ],
    extract: [
      'RONIN SCOUT FALLING BACK',
      'CIVILIAN ROUTE MARKERS SHIFTING',
      'EXTRACTION CORRIDOR TRAFFIC DECREASING',
      'REAR SIGNAL COVER HOLDING'
    ],
    signal: [
      'WARLORD SIGNAL DETECTED',
      'UNKNOWN TRAFFIC INTERCEPTED',
      'FALSE MARK CHANNEL PROPAGATING',
      'ENCRYPTED TRAFFIC SPLITTING'
    ],
    divert: [
      'MUTANT PACK RELOCATING',
      'WARLORD SIGNAL DRIFTING EAST',
      'ASSET PATH SHIFTING TO SECONDARY COVER',
      'OUTER CORRIDOR ATTENTION DIVERTED'
    ]
  };

  var contactSlots = [
    {
      type: 'ronin',
      name: 'Veyra Null',
      faction: 'Ronin mark / unstable ally',
      source: 'Transmission source: Ronin low-band relay',
      status: 'Cell signal wavering',
      transmissions: [
        'We see the channel. Keep the patrol looking at shadows.',
        'Field listens. Do not answer too quickly.',
        'Veyra holds the line, but the static is learning your rhythm.'
      ],
      responses: [
        'Ronin cell adjusted. Your field pressure was felt.',
        'Veyra moved through the blind interval. Patrol attention split.',
        'Ronin relay tightened. The channel trusts your hand for now.'
      ],
      portrait: '/sites/default/files/outskirts/portraits/Ronins/Asset__Portraits__Ronins__chatgpt_image_dec_26_2025_05_38_53_pm.webp'
    },
    {
      type: 'mutant',
      name: 'Grain-9',
      faction: 'Mutant mark / corridor anomaly',
      source: 'Transmission source: bio-static corridor',
      status: 'Biological pressure rising',
      transmissions: [
        'Heat moves under the bridge. The corridor is not alone.',
        'Bone-corridor pressure rising.',
        'Grain-9 hears the floor breathe before the signal breaks.'
      ],
      responses: [
        'Corridor pulse shifted. Mutant pressure is listening.',
        'Bio-static folded inward. Grain-9 changed direction.',
        'The corridor opened its throat, then went quiet.'
      ],
      portrait: '/sites/default/files/outskirts/portraits/Genetic%20Warlords/Asset__Portraits__Mutants__chatgpt_image_dec_26_2025_05_25_48_pm.webp'
    },
    {
      type: 'warlord',
      name: 'Marshal Korr',
      faction: 'Warlord mark / command signal',
      source: 'Transmission source: hostile command band',
      status: 'Hostile pursuit pressure',
      transmissions: [
        'Unknown hand detected. Return the signal or be found.',
        'Korr has marked the channel.',
        'Command band sharpens. Something armed is listening.'
      ],
      responses: [
        'Warlord command signal distorted. Pursuit pressure delayed.',
        'Korr lost one clean trace. The next sweep will be meaner.',
        'Hostile command band stuttered. Pursuit pressure displaced.'
      ],
      portrait: '/sites/default/files/outskirts/portraits/Genetic%20Warlords/Asset__Portraits__Genetic_Warlords__chatgpt_image_dec_26_2025_03_59_31_pm.webp'
    }
  ];

  var runtimeMissions = [
    'Recon Sweep',
    'Signal Recovery',
    'Extraction Probe',
    'Blackout Transit',
    'Marker Verification'
  ];

  var runtimeConditions = [
    'Signal Distortion',
    'Storm Interference',
    'Low Visibility',
    'Contact Trace',
    'Route Instability'
  ];

  var channelRegistry = [
    {
      slug: 'war-bangaz',
      label: 'War Bangaz',
      playlistId: '6CaO0WNPwOyB4ZBIwgJF3O',
      spotifyUrl: 'https://open.spotify.com/playlist/6CaO0WNPwOyB4ZBIwgJF3O?si=46f8eacb11d34816',
      moodTags: 'Aggressive • Kinetic • Chaotic'
    },
    {
      slug: 'black-banner',
      label: 'Black Banner',
      playlistId: '6aLCJNyLO0zN6qsb3LTZoy',
      spotifyUrl: 'https://open.spotify.com/playlist/6aLCJNyLO0zN6qsb3LTZoy?si=f7005bed79194ef0',
      moodTags: 'Ominous • Authoritarian • Oppressive'
    },
    {
      slug: 'signal-blitz',
      label: 'Signal Blitz',
      playlistId: '5yXFPozHV4eW9Aal5Ys7Mn',
      spotifyUrl: 'https://open.spotify.com/playlist/5yXFPozHV4eW9Aal5Ys7Mn?si=19228e24361844a7',
      moodTags: 'Recon • Communications • Uncertainty'
    },
    {
      slug: 'dust-march',
      label: 'Dust March',
      playlistId: '76AhLGUeJhcZbgQYt8oqo8',
      spotifyUrl: 'https://open.spotify.com/playlist/76AhLGUeJhcZbgQYt8oqo8?si=d4de23f690ee433e',
      moodTags: 'Isolation • Distance • Endurance'
    },
    {
      slug: 'steel-wreckoning',
      label: 'Steel Wreckoning',
      playlistId: '3wVMs0gb2svMUITiu0PJY4',
      spotifyUrl: 'https://open.spotify.com/playlist/3wVMs0gb2svMUITiu0PJY4?si=f070819920d640a1',
      moodTags: 'Impact • Escalation • Consequence'
    },
    {
      slug: 'system-reset-free',
      label: 'System Reset Free',
      playlistId: '0cZlbYVRnkxwViBJPw8oDR',
      spotifyUrl: 'https://open.spotify.com/playlist/0cZlbYVRnkxwViBJPw8oDR?si=d10eef44e3f54078',
      moodTags: 'Abandoned Systems • Collapse • Aftermath'
    }
  ];

  var runtimePlaylists = channelRegistry.filter(function (channel) {
    return channel.slug !== 'system-reset-free';
  });

  var runtimeStatuses = [
    'Signal Window Open',
    'Observation Window Active',
    'Channel Stable',
    'Pressure Reading Active',
    'Route Signal Open'
  ];

  var runtimeSceneNames = [
    'BLACK CHANNEL',
    'SABLE CORRIDOR',
    'GHOST LADDER',
    'WOUND SIGNAL',
    'IRON LISTENER',
    'STATIC MERCY',
    'SILENT CROSSING',
    'LAST OBSERVER',
    'FRACTURE MARK',
    'VEIL OF ASH'
  ];

  var runtimeSceneSubjects = [
    'Ronin scout element',
    'Genealord relay node',
    'Mutant migration cluster',
    'abandoned signal beacon',
    'contested observation mark',
    'encrypted field archive',
    'isolated corridor witness',
    'unstable transmission source'
  ];

  var runtimeScenePressureConditions = [
    'signal interference',
    'unstable cadence',
    'low visibility',
    'storm distortion',
    'pressure escalation',
    'corridor collapse risk',
    'hostile observation',
    'fractured geometry'
  ];

  var runtimeSceneInterventionWindows = [
    'narrowing',
    'unstable',
    'temporary',
    'fading',
    'expanding',
    'partially obscured'
  ];

  var runtimeSceneRisks = [
    'asset exposure',
    'signal loss',
    'pressure cascade',
    'false movement',
    'channel bleed',
    'extraction delay',
    'corridor collapse'
  ];

  var runtimeSceneFateConditions = [
    'extraction opens after two advances',
    'pressure rises after repeated intervention',
    'hold delays exposure',
    'signal deployment increases visibility',
    'divert reduces clarity',
    'fate line weakens under pressure'
  ];

  var runtimeSceneComplications = [
    {
      key: 'second-advance-pressure',
      text: 'second advance triggers pressure spike'
    },
    {
      key: 'stabilized-extraction',
      text: 'extraction requires additional stabilization'
    },
    {
      key: 'signal-exposure',
      text: 'signal deployment may trigger exposure'
    },
    {
      key: 'hold-slows-progress',
      text: 'hold improves stability but slows progress'
    },
    {
      key: 'sharp-divert-cost',
      text: 'divert reduces progress more aggressively'
    }
  ];

  var runtimeMissionMatrix = [
    {
      id: 'recon',
      label: 'RECON',
      premise: 'Subject enters a corridor with incomplete visibility.',
      pressure: 'The field notices the observer.',
      closure: 'The route confirms movement or rejects the signal.'
    },
    {
      id: 'recovery',
      label: 'RECOVERY',
      premise: 'Subject searches for a lost asset.',
      pressure: 'The asset may not want to be found.',
      closure: 'Recovery changes the scene or exposes the search.'
    },
    {
      id: 'escort',
      label: 'ESCORT',
      premise: 'Subject moves a vulnerable asset through contested space.',
      pressure: 'Every delay increases exposure.',
      closure: 'The route decides whether the asset survives contact.'
    },
    {
      id: 'surveillance',
      label: 'SURVEILLANCE',
      premise: 'Subject watches a mark that may be watching back.',
      pressure: 'Observation begins altering the field.',
      closure: 'The mark remains visible or slips the frame.'
    },
    {
      id: 'signal-trace',
      label: 'SIGNAL TRACE',
      premise: 'Subject follows a corrupted transmission.',
      pressure: 'The signal begins answering back.',
      closure: 'The source is exposed, lost, or altered.'
    },
    {
      id: 'extraction',
      label: 'EXTRACTION',
      premise: 'Subject approaches a closing corridor.',
      pressure: 'The exit narrows with every intervention.',
      closure: 'The subject leaves cleanly or the route collapses.'
    },
    {
      id: 'asset-protection',
      label: 'ASSET PROTECTION',
      premise: 'Subject shields a fragile signal from pressure.',
      pressure: 'The field tests every weak edge.',
      closure: 'The asset holds or becomes visible.'
    },
    {
      id: 'infiltration',
      label: 'INFILTRATION',
      premise: 'Subject enters a hostile channel unseen.',
      pressure: 'The corridor checks for disturbance.',
      closure: 'The subject passes through or leaves a mark.'
    },
    {
      id: 'counter-infiltration',
      label: 'COUNTER-INFILTRATION',
      premise: 'Subject hunts a hidden pressure source.',
      pressure: 'The intruder changes shape under observation.',
      closure: 'The field exposes the breach or accepts it.'
    },
    {
      id: 'containment',
      label: 'CONTAINMENT',
      premise: 'Subject holds a breach from spreading.',
      pressure: 'The breach learns the shape of resistance.',
      closure: 'The field seals or fractures.'
    },
    {
      id: 'sabotage',
      label: 'SABOTAGE',
      premise: 'Subject disrupts a hostile pattern.',
      pressure: 'The pattern tries to repair itself.',
      closure: 'The pressure line breaks or retaliates.'
    },
    {
      id: 'intercept',
      label: 'INTERCEPT',
      premise: 'Subject crosses a message before it arrives.',
      pressure: 'Timing becomes the danger.',
      closure: 'The message is caught, altered, or lost.'
    }
  ];

  var runtimeStoryBeats = [
    'Opening Image',
    'Theme Stated',
    'Setup',
    'Catalyst',
    'Debate',
    'Break Into Two',
    'B Story Signal',
    'Fun and Games',
    'Midpoint',
    'Pressure Closes In',
    'All Is Lost',
    'Dark Night of the Signal',
    'Break Into Three',
    'Finale',
    'Final Image'
  ];

  var runtimePhaseSpine = [
    {
      key: 'setup',
      label: 'SETUP',
      requiredPressure: 3,
      beatStart: 0,
      beatEnd: 4
    },
    {
      key: 'confrontation',
      label: 'CONFRONTATION',
      requiredPressure: 4,
      beatStart: 5,
      beatEnd: 9
    },
    {
      key: 'collapse',
      label: 'COLLAPSE',
      requiredPressure: 3,
      beatStart: 10,
      beatEnd: 14
    }
  ];

  var runtimeCatalysts = [
    'A corridor opens without permission.',
    'A hostile trace crosses the subject path.',
    'An asset moves before the signal clears.',
    'A pressure source answers the channel.',
    'The field notices the unseen hand.'
  ];

  var runtimeOpposingPressureSources = [
    'hostile relay pressure',
    'unknown field authority',
    'counter-signal movement',
    'pressure corridor resistance',
    'unresolved mark traffic'
  ];

  var runtimeFieldPressureLines = [
    'Every intervention raises exposure.',
    'The route can hold only if pressure is shaped.',
    'The subject moves inside unstable signal.',
    'The opposing force is already reacting.',
    'The field will not stay neutral.'
  ];

  var runtimeBeatAarNames = [
    'Opening Image',
    'Theme Stated',
    'Set-Up',
    'Catalyst',
    'Debate',
    'Break Into Two',
    'B Story',
    'Fun and Games',
    'Midpoint',
    'Bad Guys Close In',
    'All Is Lost',
    'Dark Night',
    'Break Into Three',
    'Finale',
    'Final Image'
  ];

  var runtimePressureActions = [
    {
      label: 'GATHER INTEL',
      pressureDelta: 0,
      clarityDelta: 1,
      exposureDelta: 0,
      timeCost: 1,
      consequence: 'Output read. The field gives shape to the next decision.'
    },
    {
      label: 'TAKE A RISK',
      pressureDelta: 2,
      clarityDelta: 0,
      exposureDelta: 1,
      timeCost: 3,
      consequence: 'Pressure rises. The opposing force feels the unseen hand.'
    },
    {
      label: 'CHANGE THE PLAN',
      pressureDelta: -1,
      clarityDelta: -1,
      exposureDelta: 0,
      timeCost: 2,
      consequence: 'The route bends. Clarity weakens while exposure shifts.'
    }
  ];

  var runtimePresenceChoiceMatrix = {
    setup: [
      {
        label: 'SHADOW THE RONIN',
        pressureDelta: 0,
        clarityDelta: 1,
        exposureDelta: -1,
        timeCost: 2,
        narrativeEffect: 'Ronin movement stays hidden; survival odds improve.'
      },
      {
        label: 'MISLEAD THE MUTANTS',
        pressureDelta: -1,
        clarityDelta: 0,
        exposureDelta: 0,
        timeCost: 2,
        narrativeEffect: 'Mutant pressure scatters into a false trail.'
      },
      {
        label: 'PRESS THE GENEALORD SIGNAL',
        pressureDelta: 2,
        clarityDelta: 2,
        exposureDelta: 1,
        timeCost: 3,
        narrativeEffect: 'Genealord intent becomes clearer, but exposure rises.'
      }
    ],
    confrontation: [
      {
        label: 'BREAK THE PURSUIT',
        pressureDelta: -1,
        clarityDelta: 1,
        exposureDelta: -1,
        timeCost: 3,
        narrativeEffect: 'The pursuit line fractures long enough to move.'
      },
      {
        label: 'FORCE A FALSE TRAIL',
        pressureDelta: 0,
        clarityDelta: -1,
        exposureDelta: -2,
        timeCost: 2,
        narrativeEffect: 'The enemy follows the wrong pressure mark.'
      },
      {
        label: 'RISK DIRECT EXTRACTION',
        pressureDelta: 2,
        clarityDelta: 1,
        exposureDelta: 2,
        timeCost: 4,
        narrativeEffect: 'Extraction opens early, but the route burns bright.'
      }
    ],
    collapse: [
      {
        label: 'SAVE THE RONIN',
        pressureDelta: 1,
        clarityDelta: 0,
        exposureDelta: -1,
        timeCost: 3,
        narrativeEffect: 'The Ronin survives the final pressure turn.'
      },
      {
        label: 'SACRIFICE THE ROUTE',
        pressureDelta: -2,
        clarityDelta: -1,
        exposureDelta: 0,
        timeCost: 2,
        narrativeEffect: 'The route collapses behind the subject.'
      },
      {
        label: 'EXPOSE THE GENEALORD',
        pressureDelta: 2,
        clarityDelta: 2,
        exposureDelta: 1,
        timeCost: 4,
        narrativeEffect: 'The opposing force is revealed at high cost.'
      }
    ]
  };

  var runtimeCharacterTurns = {
    confrontation: [
      'A Ronin complication changes the route.',
      'Mutant escalation floods the corridor.',
      'The Genealord makes a counter-move.',
      'A hidden ally opens a brief side path.',
      'A false route begins calling back.'
    ],
    collapse: [
      'The Genealord has located the route.',
      'Mutants have found the Ronin trail.',
      'The extraction window is compromised.',
      'An ally signal collapses under pressure.',
      'The false route becomes a trap.',
      'The operation clock catches up.'
    ]
  };

  var runtimeOpeningHooks = [
    'You are not in the scene. You are the hand that moves it.',
    'No one sees you. Everyone feels the pressure.',
    'You are not playing the hero. You are writing fate in real time.'
  ];

  var runtimeMidpointHooks = [
    'The scene has turned. The subject knows something is wrong.',
    'Fate has noticed the intervention.'
  ];

  var runtimeDarkNightHooks = [
    'Every choice has weight now.',
    'The corridor remembers what you changed.'
  ];

  var runtimeFinaleHooks = [
    'You wrote the ending.',
    'The subject survived because you bent the pressure.',
    'The mark was lost because the scene demanded payment.',
    'The hidden war moved, and no one saw your hand.',
    'You did not enter the corridor. You rewrote it.'
  ];

  var runtimeDirectiveStoryEffects = {
    advance: {
      choice: 'PRESSURE ADVANCED',
      fateLine: 'the subject moves deeper into exposure',
      effect: 'the scene can no longer remain still'
    },
    hold: {
      choice: 'SCENE HELD',
      fateLine: 'consequence is delayed while suspense deepens',
      effect: 'stability improves, but fate waits'
    },
    signal: {
      choice: 'SIGNAL INTRODUCED',
      fateLine: 'hidden information enters the scene',
      effect: 'the subject reacts to unseen pressure'
    },
    divert: {
      choice: 'FATE DIVERTED',
      fateLine: 'the pressure line bends away from the subject',
      effect: 'clarity weakens as the route changes'
    },
    extract: {
      choice: 'EXTRACTION ATTEMPTED',
      fateLine: 'the scene tries to close around the subject',
      effect: 'the ending must be earned before it can hold'
    },
    pressure: {
      choice: 'FIELD PRESSURE APPLIED',
      fateLine: 'the field reacts to pressure it cannot identify',
      effect: 'battlefield presence begins to take shape'
    }
  };

  // SAVE THE CAT RULE:
  // Use screenplay structure internally.
  // Never expose screenplay structure directly.
  // Never present numbered beats.
  // Never require scrolling through story nodes.
  // Never make the UI feel like a screenplay worksheet.
  // The player experiences only SETUP, CONFRONTATION, COLLAPSE.
  // The engine may internally track Opening, Catalyst, Debate,
  // Midpoint, Dark Night, and Finale.
  // The player is the Unseen Hand, Force Controller, screenwriter,
  // and director. A director watches a scene unfold and nudges it.

  var consequenceRegistry = [
    {
      status: 'SUCCESS',
      summary: 'Signal recovered. Observation window expanded.',
      weight: 28
    },
    {
      status: 'PARTIAL SUCCESS',
      summary: 'Signal acquired. Integrity degraded.',
      weight: 30
    },
    {
      status: 'COMPROMISED',
      summary: 'Asset exposed during operation.',
      weight: 18
    },
    {
      status: 'FAILED',
      summary: 'Operation terminated before objective completion.',
      weight: 10
    },
    {
      status: 'UNKNOWN',
      summary: 'Telemetry lost. Outcome unresolved.',
      weight: 14
    }
  ];

  var missionSeeds = {
    ronin: [
      {
        title: 'Dead-Drop Signal',
        brief: 'Intercept a dead-drop pulse before the patrol maps the relay corridor.'
      },
      {
        title: 'Relay Corridor Hold',
        brief: 'Hold the corridor long enough for the Ronin cell to break trace.'
      },
      {
        title: 'Extraction Coordinate Check',
        brief: 'Verify extraction coordinates through static before the window collapses.'
      },
      {
        title: 'Checkpoint Ghosting',
        brief: 'Misalign checkpoint echoes so civilian movement stays unseen.'
      }
    ],
    mutant: [
      {
        title: 'Biological Corruption Trace',
        brief: 'Observe the corruption bloom and mark where the corridor changes shape.'
      },
      {
        title: 'Corridor Instability Containment',
        brief: 'Contain the unstable passage before it pulls nearby signals apart.'
      },
      {
        title: 'Anomalous Movement Watch',
        brief: 'Track movement below the bridge without drawing the swarm upward.'
      },
      {
        title: 'Bio-Static Quarantine',
        brief: 'Narrow the bio-static field around the mark zone.'
      }
    ],
    warlord: [
      {
        title: 'Patrol Detection Avoidance',
        brief: 'Keep the channel dark while the Warlord patrol sweeps the outer fog.'
      },
      {
        title: 'Command Drift Tracking',
        brief: 'Track command signal drift before Korr reacquires the relay.'
      },
      {
        title: 'Hostile Channel Disruption',
        brief: 'Disrupt hostile routing without revealing the unseen hand.'
      },
      {
        title: 'Pursuit Echo Split',
        brief: 'Split the pursuit echo across false corridors.'
      }
    ]
  };

  var consequenceOutcomes = [
    {
      title: 'Extraction corridor stabilizes.',
      field: 'FIELD STABLE',
      mark: {
        ronin: 'Veyra Null: cooperative',
        mutant: 'Grain-9: curious',
        warlord: 'Marshal Korr: searching'
      }
    },
    {
      title: 'Warlord pressure decreases.',
      field: 'CHANNEL INTEGRITY RISING',
      mark: {
        ronin: 'Veyra Null: cautious',
        mutant: 'Grain-9: unstable',
        warlord: 'Marshal Korr: tracking'
      }
    },
    {
      title: 'Field pressure shifts.',
      field: 'FIELD UNSTABLE',
      mark: {
        ronin: 'Veyra Null: silent',
        mutant: 'Grain-9: agitated',
        warlord: 'Marshal Korr: escalating'
      }
    }
  ];

  var scenarios = [
    {
      title: 'RONIN CELL DETECTED',
      situation: [
        'Civilian transport is stalled near a collapsing signal corridor.',
        'A Genetic Warlord patrol is moving through the outer fog.'
      ],
      pressure: 'WARLORD PATROL RISING',
      buttons: ['OPEN EXTRACTION WINDOW', 'SCRAMBLE WARLORD SIGNAL', 'REDIRECT RONIN CELL'],
      reactions: [
        'Extraction window opened. Civilian survival probability increased.',
        'Signal interference detected. Warlord pressure delayed.',
        'Ronin movement redirected. Secondary instability rising.'
      ]
    },
    {
      title: 'MUTANT CONVOY SPLIT',
      situation: [
        'A mutant convoy is crossing an unstable service bridge.',
        'Two civilian scouts are hidden below the broken span.'
      ],
      pressure: 'MUTANT ROUTE PRESSURE',
      buttons: ['DIM BRIDGE SIGNAL', 'MASK SCOUT HEAT', 'SHIFT CONVOY TIMING'],
      reactions: [
        'Bridge signal dimmed. Convoy speed reduced.',
        'Scout heat masked. Detection risk lowered.',
        'Convoy timing shifted. Reality shear increased nearby.'
      ]
    },
    {
      title: 'CIVILIAN CHANNEL FRACTURE',
      situation: [
        'A shelter channel is broadcasting across two overlapping realities.',
        'Warlord listeners are triangulating the repeated echo.'
      ],
      pressure: 'CIVILIAN SIGNAL EXPOSED',
      buttons: ['NARROW THE BROADCAST', 'SEED FALSE ECHO', 'ANCHOR SHELTER CHANNEL'],
      reactions: [
        'Broadcast narrowed. Shelter location partially concealed.',
        'False echo seeded. Warlord listeners diverted.',
        'Shelter channel anchored. Cross-reality noise reduced.'
      ]
    },
    {
      title: 'RONIN OATH CONFLICT',
      situation: [
        'A Ronin group refuses a Warlord summons at a ruined checkpoint.',
        'The checkpoint reality is bending under conflicting commands.'
      ],
      pressure: 'RONIN VOLTAGE UNSTABLE',
      buttons: ['HARDEN CHECKPOINT STATIC', 'WEAKEN WARLORD ORDER', 'OPEN NEUTRAL PATH'],
      reactions: [
        'Checkpoint static hardened. Direct pursuit slowed.',
        'Warlord order weakened. Ronin resistance holds longer.',
        'Neutral path opened. Unknown movement enters the gap.'
      ]
    },
    {
      title: 'FUTURE TRACE BLEED',
      situation: [
        'A future city trace is bleeding into a present-day drainage tunnel.',
        'Civilians nearby are following lights that should not exist yet.'
      ],
      pressure: 'REALITY BLEED ACTIVE',
      buttons: ['LOWER FUTURE LUMINANCE', 'MARK SAFE EXIT', 'SEAL TRACE EDGE'],
      reactions: [
        'Future luminance lowered. Civilian draw reduced.',
        'Safe exit marked. Group movement stabilizing.',
        'Trace edge sealed. Residual pressure remains inside the tunnel.'
      ]
    },
    {
      title: 'GENETIC WARLORD RELAY',
      situation: [
        'A Warlord relay tower is repeating clan commands through wet concrete.',
        'Mutant responders are changing direction with each pulse.'
      ],
      pressure: 'CLAN RELAY ACTIVE',
      buttons: ['DESYNC RELAY PULSE', 'FLOOD CONCRETE CHANNEL', 'SPLIT MUTANT RESPONSE'],
      reactions: [
        'Relay pulse desynced. Clan command cohesion reduced.',
        'Concrete channel flooded. Signal clarity degraded.',
        'Mutant response split. Pressure spreads but slows.'
      ]
    },
    {
      title: 'UNMARKED FAMILY CACHE',
      situation: [
        'A family cache is exposed between two abandoned road markers.',
        'Ronin scouts and mutant scavengers are both approaching.'
      ],
      pressure: 'CACHE DISCOVERY IMMINENT',
      buttons: ['COVER CACHE SIGNATURE', 'DRAW RONIN SCOUTS EAST', 'MISALIGN SCAVENGER PATH'],
      reactions: [
        'Cache signature covered. Discovery window narrowed.',
        'Ronin scouts drawn east. Civilian recovery chance improved.',
        'Scavenger path misaligned. Local terrain instability increased.'
      ]
    },
    {
      title: 'PATROL MEMORY LOOP',
      situation: [
        'A Warlord patrol is repeating the same street search every ninety seconds.',
        'A trapped civilian group is waiting for the loop to break.'
      ],
      pressure: 'PATROL LOOP LOCKED',
      buttons: ['STRETCH LOOP INTERVAL', 'BLIND THIRD PASS', 'OPEN SIDE STREET'],
      reactions: [
        'Loop interval stretched. Escape timing improved.',
        'Third pass blinded. Patrol confidence degraded.',
        'Side street opened. Civilian movement possible but exposed.'
      ]
    },
    {
      title: 'MUTANT TRUCE STATIC',
      situation: [
        'Two mutant groups are holding a fragile truce at a waterline.',
        'A Warlord clan signal is trying to turn the meeting violent.'
      ],
      pressure: 'TRUCE UNDER SIGNAL LOAD',
      buttons: ['FILTER CLAN SIGNAL', 'STABILIZE WATERLINE', 'REDIRECT AGITATOR TRACE'],
      reactions: [
        'Clan signal filtered. Truce duration extended.',
        'Waterline stabilized. Field noise reduced.',
        'Agitator trace redirected. Secondary group now suspicious.'
      ]
    },
    {
      title: 'CROSS-REALITY BLACKOUT',
      situation: [
        'A present-day block has gone dark under future-grid interference.',
        'Civilian radios are receiving instructions from incompatible timelines.'
      ],
      pressure: 'TIMELINE NOISE HIGH',
      buttons: ['GROUND FUTURE GRID', 'PRIORITIZE CIVILIAN RADIO', 'CUT FALSE INSTRUCTION'],
      reactions: [
        'Future grid grounded. Power flicker contained.',
        'Civilian radio prioritized. Local coordination restored.',
        'False instruction cut. Timeline noise recoils outward.'
      ]
    },
    {
      title: 'RONIN EXTRACTION DOUBT',
      situation: [
        'A Ronin courier is carrying a civilian route map through signal fog.',
        'The courier is hesitating as Warlord pressure closes behind them.'
      ],
      pressure: 'COURIER RESOLVE WAVERING',
      buttons: ['CLARIFY ROUTE MAP', 'OBSCURE PURSUIT LINE', 'STRENGTHEN COURIER SIGNAL'],
      reactions: [
        'Route map clarified. Courier movement resumes.',
        'Pursuit line obscured. Warlord pressure delayed.',
        'Courier signal strengthened. Fog responds unpredictably.'
      ]
    },
    {
      title: 'UNSTABLE SAFEHOUSE',
      situation: [
        'A safehouse is half-present and half-future after a corridor collision.',
        'Civilians inside can hear mutant movement on both sides.'
      ],
      pressure: 'SAFEHOUSE PHASE DRIFT',
      buttons: ['LOCK PRESENT WALLS', 'QUIET FUTURE ROOM', 'OPEN ROOF SIGNAL'],
      reactions: [
        'Present walls locked. Safehouse shape steadied.',
        'Future room quieted. Detection pressure reduced.',
        'Roof signal opened. Extraction attention rising.'
      ]
    }
  ];

  function storageFlagSeen() {
    try {
      return window.localStorage.getItem(storageKey) === '1';
    }
    catch (e) {
      return false;
    }
  }

  function storeSeenFlag() {
    try {
      window.localStorage.setItem(storageKey, '1');
    }
    catch (e) {}
  }

  function signalDismissed() {
    try {
      return window.localStorage.getItem(signalStorageKey) === '1';
    }
    catch (e) {
      return false;
    }
  }

  function storeSignalDismissed() {
    try {
      window.localStorage.setItem(signalStorageKey, '1');
    }
    catch (e) {}
  }

  function hideIntro(intro) {
    if (!intro) {
      return;
    }

    intro.hidden = true;
    intro.setAttribute('aria-hidden', 'true');
  }

  function showSignalModal(root) {
    var modal = root.querySelector('[data-ooh-operation-alpha-signal]');

    if (!modal || signalDismissed()) {
      return;
    }

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }

  function hideSignalModal(modal) {
    if (!modal) {
      return;
    }

    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }

  function initSignalModal(root) {
    var modal = root.querySelector('[data-ooh-operation-alpha-signal]');
    var form = root.querySelector('[data-ooh-operation-alpha-signal-form]');
    var dismiss = root.querySelector('[data-ooh-operation-alpha-signal-dismiss]');
    var status = root.querySelector('[data-ooh-operation-alpha-signal-status]');

    if (!modal || !form || !dismiss) {
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      storeSignalDismissed();
      if (status) {
        status.textContent = 'Signal captured locally. Provider connection pending.';
      }
      window.setTimeout(function () {
        hideSignalModal(modal);
      }, 1500);
    });

    dismiss.addEventListener('click', function () {
      storeSignalDismissed();
      hideSignalModal(modal);
    });
  }

  function renderScenario(root, index) {
    var scenario = scenarios[index % scenarios.length];
    var title = root.querySelector('[data-ooh-alpha-scenario-title]');
    var situation = root.querySelector('[data-ooh-alpha-situation]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var interventions = root.querySelector('[data-ooh-alpha-interventions]');
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');

    if (!scenario || !title || !situation || !pressure || !interventions || !reaction) {
      return;
    }

    root.oohAlphaScenarioIndex = index % scenarios.length;
    title.textContent = scenario.title;
    pressure.textContent = scenario.pressure;
    root.classList.add('is-field-active');
    situation.innerHTML = scenario.situation.map(function (line) {
      return '<p>' + line + '</p>';
    }).join('');
    reaction.textContent = 'Awaiting unseen hand intervention.';
    interventions.innerHTML = '';

    runtimePressureActions.forEach(function (action, buttonIndex) {
      var button = document.createElement('button');
      button.className = 'ooh-operation-alpha__intervention';
      button.type = 'button';
      button.textContent = action.label;
      button.addEventListener('click', function () {
        triggerIntervention(root, scenario, buttonIndex);
      });
      interventions.appendChild(button);
    });
  }

  function containedAssetPath(path) {
    var currentPath = window.location.pathname || '';
    var basePath = currentPath.replace(/\/(?:operation-alpha(?:\/oaplay(?:\/playlists)?)?|oaplaylists|oaplay(?:\/playlists)?)\/?$/, '');

    return (basePath || '') + path;
  }

  function operationAlphaRootPath(path) {
    var currentPath = window.location.pathname || '';
    var basePath = currentPath.replace(/\/(?:operation-alpha(?:\/oaplay(?:\/playlists)?)?|oaplaylists|oaplay(?:\/playlists)?)\/?$/, '');

    return (basePath || '') + path;
  }

  function parseCsvRows(csvText) {
    var rows = [];
    var row = [];
    var value = '';
    var inQuotes = false;
    var index;
    var character;
    var nextCharacter;

    for (index = 0; index < csvText.length; index++) {
      character = csvText[index];
      nextCharacter = csvText[index + 1];

      if (character === '"' && inQuotes && nextCharacter === '"') {
        value += '"';
        index++;
      }
      else if (character === '"') {
        inQuotes = !inQuotes;
      }
      else if (character === ',' && !inQuotes) {
        row.push(value);
        value = '';
      }
      else if ((character === '\n' || character === '\r') && !inQuotes) {
        if (character === '\r' && nextCharacter === '\n') {
          index++;
        }
        row.push(value);
        if (row.some(function (cell) { return cell.trim() !== ''; })) {
          rows.push(row);
        }
        row = [];
        value = '';
      }
      else {
        value += character;
      }
    }

    row.push(value);
    if (row.some(function (cell) { return cell.trim() !== ''; })) {
      rows.push(row);
    }

    return rows;
  }

  function normalizeActorRegistry(csvText) {
    var rows = parseCsvRows(csvText);
    var headers = rows.shift() || [];

    return rows.map(function (row) {
      var actor = {};

      headers.forEach(function (header, index) {
        var normalizedKey = actorRegistryColumnMap[header.trim()];

        if (normalizedKey) {
          actor[normalizedKey] = (row[index] || '').trim();
        }
      });

      return actor;
    }).filter(function (actor) {
      return actor.missionUsage;
    });
  }

  function actorRegistryUrl(actorRegistryPath) {
    return operationAlphaRootPath(actorRegistryPath);
  }

  function loadActorRegistryFromPath(actorRegistryPath) {
    return window.fetch(actorRegistryUrl(actorRegistryPath), {
      cache: 'no-store',
      credentials: 'same-origin'
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Actor registry unavailable');
      }

      return response.text();
    }).then(function (csvText) {
      return normalizeActorRegistry(csvText);
    });
  }

  function loadActorRegistry(pathIndex) {
    var index = pathIndex || 0;

    if (!window.fetch || index >= actorRegistryPaths.length) {
      return Promise.resolve([]);
    }

    return loadActorRegistryFromPath(actorRegistryPaths[index]).catch(function () {
      return loadActorRegistry(index + 1);
    });
  }

  function actorMissionUsage(actor, usage) {
    return (actor.missionUsage || '').trim().toLowerCase() === usage.toLowerCase();
  }

  function actorRegistrySlug(value) {
    return (value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  function actorPortraitNameSlug(actor) {
    var pathRoot = (actor.path || '').replace(/\s+Path\s*$/i, '');

    if (actor.name) {
      return actorRegistrySlug(actor.name);
    }
    if (actor.faction === 'Genealord' && pathRoot) {
      return actorRegistrySlug(pathRoot + ' Unknown');
    }

    return actorRegistrySlug(actor.portrait);
  }

  function actorSlugAliases(slug) {
    if (slug === 'lhantoris_path') {
      return ['lhatoris_path', slug];
    }
    if (slug === 'lhantoris_unknown') {
      return ['lhatoris_unknown', slug];
    }

    return [slug];
  }

  var genealordPortraitFilenameOverrides = {
    lhatoris_path: 'Asset__Portraits__Genetic_Warlords__chatgpt_image_dec_26_2025_04_07_13_pm.webp',
    hebrenes_path: 'Asset__Portraits__Genetic_Warlords__chatgpt_image_dec_26_2025_03_59_57_pm.webp'
  };

  function genealordPortraitFilename(pathSlug) {
    return genealordPortraitFilenameOverrides[pathSlug] || '';
  }

  function actorExplicitPortraitUrl(actor) {
    var portrait = (actor.portrait || '').trim();
    var normalizedPortrait;

    if (!portrait || !/\.(?:webp|png|jpe?g|gif|avif)(?:[?#].*)?$/i.test(portrait)) {
      return '';
    }
    if (/^https?:\/\//i.test(portrait)) {
      return portrait;
    }

    normalizedPortrait = portrait.replace(/\\/g, '/');
    normalizedPortrait = normalizedPortrait.replace(/^[a-z]:/i, '');
    normalizedPortrait = normalizedPortrait.replace(/^.*\/operation_alpha\//i, '/operation_alpha/');

    if (normalizedPortrait.charAt(0) === '/') {
      return operationAlphaRootPath(normalizedPortrait);
    }

    return operationAlphaRootPath('/operation_alpha/generated_actor_registry/portraits/' + normalizedPortrait);
  }

  function actorPortraitFilename(pathSlug, factionSlug, nameSlug) {
    return 'oa_' + pathSlug + '_' + factionSlug + '_' + nameSlug + '.webp';
  }

  function actorPortraitCandidates(actor) {
    var explicitPortraitUrl = actorExplicitPortraitUrl(actor);
    var pathSlug = actorRegistrySlug(actor.path);
    var factionSlug = actorRegistrySlug(actor.faction === 'Genealord' ? 'Unknown' : actor.faction);
    var nameSlug = actorPortraitNameSlug(actor);
    var pathAliases = actorSlugAliases(pathSlug);
    var nameAliases = actorSlugAliases(nameSlug);
    var candidates = [];

    if (explicitPortraitUrl) {
      return [explicitPortraitUrl];
    }

    if (!pathSlug || !factionSlug || !nameSlug) {
      return candidates;
    }

    if (actor.faction === 'Genealord') {
      pathAliases.forEach(function (pathAlias) {
        var filename = genealordPortraitFilename(pathAlias);

        if (filename) {
          candidates.push(operationAlphaRootPath('/operation_alpha/generated_actor_registry/portraits/' + pathAlias + '/Genealord/' + filename));
        }
      });

      return candidates;
    }

    candidates.push(operationAlphaRootPath('/operation_alpha/generated_actor_registry/portraits/' + actorPortraitFilename(pathSlug, factionSlug, nameSlug)));
    candidates.push(operationAlphaRootPath('/operation_alpha/portraits/' + actorPortraitFilename(pathSlug, factionSlug, nameSlug)));

    return candidates;
  }

  function actorPortraitPath(actor) {
    var candidates = actorPortraitCandidates(actor);
    var portraitUrl = candidates[0] || '';

    if (window.console && window.console.log) {
      window.console.log('Operation Alpha final portrait URL:', portraitUrl || 'none');
    }

    return portraitUrl;
  }

  function actorPortraitFallbackPath(actor) {
    var candidates = actorPortraitCandidates(actor);

    return candidates[1] || '';
  }


  function actorTransmissionCopy(actor) {
    var style = (actor.transmissionStyle || '').toLowerCase();
    var name = actor.portrait || actor.name || 'Unknown actor';

    if (style.indexOf('brutality') !== -1 || style.indexOf('threat') !== -1) {
      return name + ' pushes a violent signal through the field. The channel bends, but does not break.';
    }
    if (style.indexOf('erratic') !== -1 || style.indexOf('fragment') !== -1) {
      return name + ' arrives in broken intervals. Movement is readable, intent is not.';
    }
    if (style.indexOf('coded') !== -1 || style.indexOf('minimal') !== -1 || style.indexOf('direct') !== -1) {
      return name + ' transmits in controlled bursts. The Unseen Hand has a clean line.';
    }
    if (style.indexOf('devotional') !== -1 || style.indexOf('ritual') !== -1) {
      return name + ' repeats the path signal like a vow. Pressure gathers around the mark.';
    }

    return name + ' enters the Operation Alpha channel. The field registers a living asset.';
  }

  function runtimePick(list) {
    if (!list || !list.length) {
      return '';
    }

    return list[Math.floor(Math.random() * list.length)];
  }

  function clampRuntimeLevel(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function runtimeLog(message, detail) {
    if (!window.console || !window.console.log) {
      return;
    }
    if (typeof detail === 'undefined') {
      window.console.log('Operation Alpha Runtime: ' + message);
      return;
    }

    window.console.log('Operation Alpha Runtime: ' + message, detail);
  }

  function channelBySlug(slug) {
    var matches = channelRegistry.filter(function (channel) {
      return channel.slug === slug;
    });

    return matches[0] || null;
  }

  function channelByLabel(label) {
    var normalizedLabel = (label || '').toLowerCase();
    var matches = channelRegistry.filter(function (channel) {
      return channel.label.toLowerCase() === normalizedLabel;
    });

    return matches[0] || null;
  }

  function operationSummary(mission, condition) {
    var summaries = {
      'Recon Sweep': 'Signal integrity degraded. Observation window active.',
      'Signal Recovery': 'Signal channel unstable. Recovery window active.',
      'Extraction Probe': 'Extraction trace detected. Coordination window active.',
      'Blackout Transit': 'Visibility reduced. Transit window active.',
      'Marker Verification': 'Marker trace unresolved. Verification window active.'
    };

    return summaries[mission] || condition + '. Observation window active.';
  }

  function consequenceWeightFor(entry, mission, condition) {
    var weight = entry.weight;

    if (mission === 'Recon Sweep' && condition === 'Signal Distortion' && entry.status === 'UNKNOWN') {
      weight += 18;
    }
    if (mission === 'Signal Recovery' && entry.status === 'SUCCESS') {
      weight += 8;
    }
    if (mission === 'Extraction Probe' && condition === 'Contact Trace' && entry.status === 'COMPROMISED') {
      weight += 14;
    }
    if (mission === 'Blackout Transit' && condition === 'Low Visibility' && entry.status === 'PARTIAL SUCCESS') {
      weight += 10;
    }
    if (condition === 'Route Instability' && entry.status === 'FAILED') {
      weight += 8;
    }
    if (condition === 'Storm Interference' && entry.status === 'UNKNOWN') {
      weight += 8;
    }

    return weight;
  }

  function buildOperationalConsequence(mission, condition) {
    var weighted = consequenceRegistry.map(function (entry) {
      return {
        status: entry.status,
        summary: entry.summary,
        weight: consequenceWeightFor(entry, mission, condition)
      };
    });
    var total = weighted.reduce(function (sum, entry) {
      return sum + entry.weight;
    }, 0);
    var roll = Math.random() * total;
    var index;

    for (index = 0; index < weighted.length; index++) {
      roll -= weighted[index].weight;
      if (roll <= 0) {
        return {
          status: weighted[index].status,
          summary: weighted[index].summary
        };
      }
    }

    return {
      status: 'UNKNOWN',
      summary: 'Telemetry lost. Outcome unresolved.'
    };
  }

  function narrativeOpening(payload) {
    var openings = {
      'Recon Sweep': payload.actorName + ' returned from the perimeter with the channel still breathing.',
      'Signal Recovery': payload.actorName + ' entered the damaged signal corridor while the field buckled around the feed.',
      'Extraction Probe': payload.actorName + ' tested the extraction line before the window could collapse.',
      'Blackout Transit': payload.actorName + ' crossed the blackout corridor under reduced visibility.',
      'Marker Verification': payload.actorName + ' followed the marker trace into a section of the field that would not stay still.'
    };

    return openings[payload.mission] || payload.actorName + ' moved through the operation under observation.';
  }

  function narrativePressure(payload) {
    var pressures = {
      'Signal Distortion': 'Signal distortion bent the report into fragments.',
      'Storm Interference': 'Storm interference pressed static into every relay.',
      'Low Visibility': 'Low visibility kept the corridor uncertain.',
      'Contact Trace': 'A contact trace followed close enough to change the room.',
      'Route Instability': 'Route instability shifted the path before the report could settle.'
    };

    return pressures[payload.condition] || payload.condition + ' shaped the observation window.';
  }

  function narrativeConsequence(payload) {
    var status = payload.consequence ? payload.consequence.status : 'UNKNOWN';
    var endings = {
      SUCCESS: 'The field held long enough for observation to continue.',
      'PARTIAL SUCCESS': 'The signal was acquired, but the record arrived degraded.',
      COMPROMISED: 'The asset was exposed before the feed could close.',
      FAILED: 'The operation terminated before the objective could resolve.',
      UNKNOWN: 'Telemetry dropped, leaving the final cost unresolved.'
    };

    return endings[status] || 'The outcome remained unresolved.';
  }

  function buildNarrativeSeed(payload) {
    return narrativeOpening(payload) + ' ' + narrativePressure(payload) + ' ' + narrativeConsequence(payload);
  }

  var directorActionLabels = {
    observe: 'GATHER INTEL',
    'hold-channel': 'WAIT',
    'escalate-pressure': 'TAKE A RISK',
    'divert-asset': 'CHANGE THE PLAN',
    'authorize-extraction': 'GET THEM OUT'
  };

  var directorReactionTemplates = {
    observe: [
      'The feed remained open long enough to confirm movement beyond the relay glass.',
      '{asset} stayed inside the observation window while {condition} continued to distort the field.',
      'The Unseen Hand held position. The field preserved the next report.'
    ],
    'hold-channel': [
      'The report held, but degraded into clipped fragments.',
      'The feed narrowed without closing.',
      'The Unseen Hand held the field steady while {operation} continued under pressure.'
    ],
    'escalate-pressure': [
      'Pressure increased across the active perimeter. The asset continued without confirmation.',
      '{condition} intensified after pressure was raised. {asset} remained visible only through broken signal.',
      'The Director increased pressure. The field answered with sharper static.'
    ],
    'divert-asset': [
      'The route changed before the field team acknowledged the order.',
      '{asset} shifted away from the cleanest line as {condition} spread across the corridor.',
      'The Unseen Hand bent the route. {operation} continued, but the feed lost depth.'
    ],
    'authorize-extraction': [
      'Extraction was authorized, but the field did not confirm receipt.',
      'The extraction window opened under pressure. {asset} remained inside the report for one more beat.',
      'The Director authorized withdrawal. The order entered unstable signal.'
    ]
  };

  function directorTemplateValue(payload, key) {
    var values = {
      asset: payload.actorName,
      operation: payload.mission,
      condition: payload.condition,
      consequence: payload.consequence ? payload.consequence.status : 'UNKNOWN'
    };

    return values[key] || '';
  }

  function directorReactionBeat(payload, actionKey) {
    var templates = directorReactionTemplates[actionKey] || directorReactionTemplates.observe;
    var template = runtimePick(templates);

    return template.replace(/\{([^}]+)\}/g, function (match, key) {
      return directorTemplateValue(payload, key);
    });
  }

  function setDirectorAction(root, actionKey) {
    var payload = root.oohAlphaOperationalPayload;
    var report = root.querySelector('[data-ooh-alpha-director-report]');
    var choice = root.querySelector('[data-ooh-alpha-director-choice]');
    var reaction = root.querySelector('[data-ooh-alpha-director-reaction]');
    var label = directorActionLabels[actionKey] || 'OBSERVE';

    if (!payload || !report || !choice || !reaction) {
      return;
    }

    report.hidden = false;
    choice.textContent = label;
    reaction.textContent = directorReactionBeat(payload, actionKey);

    root.querySelectorAll('[data-ooh-alpha-director-action]').forEach(function (button) {
      if (button.getAttribute('data-ooh-alpha-director-action') === actionKey) {
        button.classList.add('is-director-active');
        button.setAttribute('aria-pressed', 'true');
      }
      else {
        button.classList.remove('is-director-active');
        button.removeAttribute('aria-pressed');
      }
    });
  }

  function initDirectorLayer(root) {
    root.querySelectorAll('[data-ooh-alpha-director-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        setDirectorAction(root, button.getAttribute('data-ooh-alpha-director-action'));
      });
    });
  }

  function buildOperationalPayload(actor) {
    var mission = runtimePick(runtimeMissions);
    var condition = runtimePick(runtimeConditions);
    var channel = runtimePick(runtimePlaylists);
    var status = runtimePick(runtimeStatuses);
    var portraitUrl = actorPortraitPath(actor);
    var consequence = buildOperationalConsequence(mission, condition);
    var payload;

    payload = {
      actorName: actor.portrait || actor.name || 'Unknown asset',
      faction: actor.faction || 'Unresolved',
      portraitUrl: portraitUrl,
      mission: mission,
      condition: condition,
      playlist: channel.label,
      playlistId: channel.playlistId,
      playlistUrl: channel.spotifyUrl,
      channelKey: channel.slug,
      channelMood: channel.moodTags,
      status: status,
      summary: operationSummary(mission, condition),
      consequence: consequence
    };
    payload.narrativeSeed = buildNarrativeSeed(payload);

    return payload;
  }

  function renderOperationalPayload(root, actor) {
    var payloadPanel = root.querySelector('[data-ooh-alpha-operational-payload]');
    var asset = root.querySelector('[data-ooh-alpha-payload-asset]');
    var faction = root.querySelector('[data-ooh-alpha-payload-faction]');
    var portrait = root.querySelector('[data-ooh-alpha-payload-portrait]');
    var mission = root.querySelector('[data-ooh-alpha-payload-mission]');
    var condition = root.querySelector('[data-ooh-alpha-payload-condition]');
    var playlist = root.querySelector('[data-ooh-alpha-payload-playlist]');
    var status = root.querySelector('[data-ooh-alpha-payload-status]');
    var summary = root.querySelector('[data-ooh-alpha-payload-summary]');
    var channelName = root.querySelector('[data-ooh-alpha-channel-name]');
    var channelMood = root.querySelector('[data-ooh-alpha-channel-mood]');
    var channelLink = root.querySelector('[data-ooh-alpha-channel-link]');
    var consequenceStatus = root.querySelector('[data-ooh-alpha-consequence-status]');
    var consequenceSummary = root.querySelector('[data-ooh-alpha-consequence-summary]');
    var narrativeCopy = root.querySelector('[data-ooh-alpha-narrative-copy]');
    var payload;

    if (!payloadPanel || !actor) {
      return;
    }

    payload = root.oohAlphaOperationalPayload || buildOperationalPayload(actor);
    root.oohAlphaOperationalPayload = payload;
    ensureRuntimeState(root, actor, payload);
    payloadPanel.hidden = false;
    payloadPanel.classList.remove('is-payload-updated');
    payloadPanel.setAttribute('data-portrait-url', payload.portraitUrl);
    window.setTimeout(function () {
      payloadPanel.classList.add('is-payload-updated');
    }, 0);

    if (asset) {
      asset.textContent = payload.actorName;
    }
    if (faction) {
      faction.textContent = payload.faction;
    }
    if (portrait) {
      portrait.textContent = payload.portraitUrl;
      portrait.setAttribute('title', payload.portraitUrl);
    }
    if (mission) {
      mission.textContent = payload.mission;
    }
    if (condition) {
      condition.textContent = payload.condition;
    }
    if (playlist) {
      playlist.textContent = 'AUDIO SIGNAL: ' + payload.playlist;
    }
    if (status) {
      status.textContent = payload.status;
    }
    if (summary) {
      summary.textContent = payload.summary;
    }
    if (channelName) {
      channelName.textContent = payload.playlist;
    }
    if (channelMood) {
      channelMood.textContent = payload.channelMood || 'Mood tags unavailable';
    }
    if (channelLink && payload.playlistUrl) {
      channelLink.href = operationAlphaPlaylistsPath();
      channelLink.textContent = 'CHOOSE SIGNAL';
      channelLink.removeAttribute('target');
      channelLink.removeAttribute('rel');
      channelLink.removeAttribute('aria-disabled');
      channelLink.hidden = false;
      channelLink.setAttribute('aria-label', 'Choose Operation Alpha signal');
    }
    else if (channelLink) {
      channelLink.removeAttribute('href');
      channelLink.removeAttribute('target');
      channelLink.setAttribute('aria-disabled', 'true');
      channelLink.textContent = 'CHANNEL OFFLINE';
      channelLink.hidden = false;
    }
    if (consequenceStatus && payload.consequence) {
      consequenceStatus.textContent = payload.consequence.status;
    }
    if (consequenceSummary && payload.consequence) {
      consequenceSummary.textContent = root.oohAlphaRuntimeState ? consequenceIncidentSummary(root.oohAlphaRuntimeState) : payload.consequence.summary;
    }
    if (narrativeCopy) {
      narrativeCopy.textContent = root.oohAlphaRuntimeState && root.oohAlphaRuntimeState.scene ? 'SUBJECT: ' + root.oohAlphaRuntimeState.scene.subject + ' // OPPOSING FORCE: ' + root.oohAlphaRuntimeState.scene.opposingForce + ' // FORCE MULTIPLIER: ' + root.oohAlphaRuntimeState.scene.forceMultiplier + ' // CATALYST: ' + root.oohAlphaRuntimeState.scene.catalyst : payload.narrativeSeed;
    }
    if (root.oohAlphaRuntimeState) {
      renderOppositionReadout(root, root.oohAlphaRuntimeState);
      renderBattlefieldGate(root, root.oohAlphaRuntimeState);
    }
  }

  function renderActorTransmission(root, actor) {
    var frame = root.querySelector('[data-ooh-alpha-actor-transmission]');
    var image = root.querySelector('[data-ooh-alpha-actor-image]');
    var name = root.querySelector('[data-ooh-alpha-actor-name]');
    var path = root.querySelector('[data-ooh-alpha-actor-path]');
    var faction = root.querySelector('[data-ooh-alpha-actor-faction]');
    var role = root.querySelector('[data-ooh-alpha-actor-role]');
    var style = root.querySelector('[data-ooh-alpha-actor-style]');
    var color = root.querySelector('[data-ooh-alpha-actor-color]');
    var copy = root.querySelector('[data-ooh-alpha-actor-copy]');
    var portraitPaths;
    var portraitIndex;
    var portraitFrame;

    if (!frame || !actor) {
      return;
    }

    portraitPaths = actorPortraitCandidates(actor);
    portraitIndex = 0;
    portraitFrame = image ? image.closest('.ooh-operation-alpha__actor-portrait') : null;
    frame.hidden = false;

    if (image && portraitPaths.length) {
      image.src = portraitPaths[portraitIndex];
      image.hidden = false;
      if (portraitFrame) {
        portraitFrame.hidden = false;
      }
      image.onerror = function () {
        portraitIndex++;
        if (portraitPaths[portraitIndex]) {
          image.src = portraitPaths[portraitIndex];
          return;
        }

        image.hidden = true;
        if (portraitFrame) {
          portraitFrame.hidden = true;
        }
      };
    }
    if (name) {
      name.textContent = actor.portrait || actor.name || 'Unknown actor';
    }
    if (path) {
      path.textContent = 'PATH: ' + (actor.path || 'unresolved');
    }
    if (faction) {
      faction.textContent = 'FACTION: ' + (actor.faction || 'unresolved');
    }
    if (role) {
      role.textContent = 'ROLE: ' + (actor.role || 'unresolved');
    }
    if (style) {
      style.textContent = 'STYLE: ' + (actor.transmissionStyle || 'unresolved');
    }
    if (color) {
      color.textContent = 'PATH COLOR: ' + (actor.pathColor || 'unresolved');
    }
    if (copy) {
      copy.textContent = actorTransmissionCopy(actor);
    }
  }

  function selectOperationAlphaActor(root) {
    if (root.oohAlphaSelectedActor) {
      renderActorTransmission(root, root.oohAlphaSelectedActor);
      renderOperationalPayload(root, root.oohAlphaSelectedActor);
      if (root.oohAlphaStoryState) {
        renderOa206Stage(root);
      }
      return;
    }

    var eligibleActors = (root.oohAlphaActorRegistry || []).filter(function (actor) {
      return actorMissionUsage(actor, 'Operation Alpha');
    });
    var roninActors = eligibleActors.filter(function (actor) {
      return (actor.faction || '').toLowerCase() === 'ronin';
    });
    var subjectPool = roninActors.length ? roninActors : eligibleActors;
    var selectedActor;

    if (!eligibleActors.length) {
      return;
    }

    selectedActor = subjectPool[Math.floor(Math.random() * subjectPool.length)];
    root.oohAlphaSelectedActor = selectedActor;
    renderActorTransmission(root, selectedActor);
    renderOperationalPayload(root, selectedActor);
    if (root.oohAlphaStoryState) {
      renderOa206Stage(root);
    }
    window.console.log('Operation Alpha actor selected:', selectedActor.portrait || selectedActor.name || 'Unknown actor');
  }

  function initActorRegistry(root) {
    loadActorRegistry().then(function (actors) {
      root.oohAlphaActorRegistry = actors;

      if (actors.length) {
        window.console.log('Operation Alpha actor registry loaded:', actors.length + ' actors');
      }
      if (root.classList.contains('is-runtime-acknowledged')) {
        selectOperationAlphaActor(root);
      }
    }).catch(function () {
      root.oohAlphaActorRegistry = [];
    });
  }

  function selectContactLine(contact, mode, index) {
    var lines = mode === 'response' ? contact.responses : contact.transmissions;

    if (!lines || !lines.length) {
      return '';
    }

    return lines[index % lines.length];
  }

  function setAtmosphere(root, index) {
    var state = atmosphereStates[index % atmosphereStates.length];
    var atmosphere = root.querySelector('[data-ooh-alpha-atmosphere]');
    var pressure = root.querySelector('[data-ooh-alpha-signal-pressure]');

    atmosphereClasses.forEach(function (className) {
      root.classList.remove(className);
    });

    root.classList.add(state.className);

    if (atmosphere) {
      atmosphere.textContent = state.label;
    }
    if (pressure) {
      pressure.textContent = state.pressure;
    }
  }

  function renderMission(root, contactIndex, seedOffset) {
    var contact = contactSlots[contactIndex % contactSlots.length];
    var seeds = missionSeeds[contact.type] || [];
    var mission = root.querySelector('[data-ooh-alpha-mission]');
    var title = root.querySelector('[data-ooh-alpha-mission-title]');
    var source = root.querySelector('[data-ooh-alpha-mission-source]');
    var brief = root.querySelector('[data-ooh-alpha-mission-brief]');

    if (!contact || !seeds.length || !mission || !title || !source || !brief) {
      return;
    }

    root.oohAlphaMissionContactIndex = contactIndex % contactSlots.length;
    root.oohAlphaMissionSeedIndex = seedOffset % seeds.length;
    mission.hidden = false;
    mission.setAttribute('data-mission-source', contact.type);
    mission.classList.remove('is-mission-updated');
    window.setTimeout(function () {
      mission.classList.add('is-mission-updated');
    }, 0);

    title.textContent = seeds[root.oohAlphaMissionSeedIndex].title;
    source.textContent = 'MISSION SOURCE: ' + contact.name;
    brief.textContent = seeds[root.oohAlphaMissionSeedIndex].brief;
  }

  function renderOperationSurface(root) {
    var contactIndex = 0;
    var seedIndex = 0;
    var contact = contactSlots[contactIndex];
    var seeds = missionSeeds[contact.type] || [];
    var mark = root.querySelector('[data-ooh-alpha-operation-mark]');
    var markStatus = root.querySelector('[data-ooh-alpha-operation-mark-status]');
    var source = root.querySelector('[data-ooh-alpha-operation-source]');
    var atmosphere = root.querySelector('[data-ooh-alpha-operation-atmosphere]');
    var field = root.querySelector('[data-ooh-alpha-operation-field]');
    var title = root.querySelector('[data-ooh-alpha-operation-title]');
    var brief = root.querySelector('[data-ooh-alpha-operation-brief]');

    if (!contact || !seeds.length) {
      return;
    }

    if (mark) {
      mark.textContent = contact.name;
    }
    if (markStatus) {
      markStatus.textContent = contact.faction;
    }
    if (source) {
      source.textContent = contact.name;
    }
    if (atmosphere) {
      atmosphere.textContent = atmosphereStates[1].label + ' // ' + atmosphereStates[1].pressure;
    }
    if (field) {
      field.textContent = 'FIELD OPEN';
    }
    if (title) {
      title.textContent = seeds[seedIndex].title;
    }
    if (brief) {
      brief.textContent = seeds[seedIndex].brief;
    }

    root.classList.add('is-atmosphere-static');
  }

  function cycleMission(root) {
    var contactIndex = root.oohAlphaMissionContactIndex || 0;
    var seedIndex = (root.oohAlphaMissionSeedIndex || 0) + 1;

    renderMission(root, contactIndex, seedIndex);
  }

  function setAssetMovementFeed(root, mode) {
    var feed = movementFeeds[mode] || movementFeeds.idle;
    var offset = root.oohAlphaMovementIndex || 0;
    var items = root.querySelectorAll('[data-ooh-alpha-movement-feed]');
    var panel = root.querySelector('[data-ooh-alpha-battlefield]');

    if (!feed || !feed.length || !items.length) {
      return;
    }

    items.forEach(function (item, index) {
      item.textContent = feed[(offset + index) % feed.length];
    });

    root.oohAlphaMovementIndex = (offset + 1) % feed.length;

    if (panel) {
      panel.classList.remove('is-movement-updated');
      window.setTimeout(function () {
        panel.classList.add('is-movement-updated');
      }, 0);
    }
  }

  function setBattlefieldPresence(root, battlefield) {
    var field = root.querySelector('[data-ooh-alpha-battlefield-field]');
    var movement = root.querySelector('[data-ooh-alpha-battlefield-movement]');
    var signal = root.querySelector('[data-ooh-alpha-battlefield-signal]');
    var panel = root.querySelector('[data-ooh-alpha-battlefield]');

    if (!battlefield || !field || !movement || !signal) {
      return;
    }

    field.textContent = battlefield.field;
    movement.textContent = battlefield.movement;
    signal.textContent = battlefield.signal;

    if (panel) {
      panel.classList.remove('is-battlefield-updated');
      window.setTimeout(function () {
        panel.classList.add('is-battlefield-updated');
      }, 0);
    }
  }

  function actorFactionTone(actor) {
    var faction = (actor && actor.faction || '').toLowerCase();

    if (faction === 'genealord') {
      return 'Command language turns cold and absolute.';
    }
    if (faction === 'ronin') {
      return 'Field language stays tactical and mobile.';
    }
    if (faction === 'mutant') {
      return 'The reply shakes with volatile pressure.';
    }

    return 'The channel answers in unresolved field language.';
  }

  function initialPressureForCondition(condition) {
    var pressureByCondition = {
      'Signal Distortion': 4,
      'Storm Interference': 5,
      'Low Visibility': 3,
      'Contact Trace': 5,
      'Route Instability': 4
    };

    return pressureByCondition[condition] || 4;
  }

  function runtimeMissionById(id) {
    var matches = runtimeMissionMatrix.filter(function (mission) {
      return mission.id === id;
    });

    return matches[0] || null;
  }

  function actorDisplayName(actor) {
    return actor && (actor.portrait || actor.name) ? (actor.portrait || actor.name) : 'Unknown subject';
  }

  function actorSubjectLine(actor) {
    var parts = [actorDisplayName(actor)];

    if (actor && actor.faction) {
      parts.push(actor.faction);
    }
    if (actor && actor.role) {
      parts.push(actor.role);
    }

    return parts.join(' / ');
  }

  function opposingForceFromRegistry(actor, registry) {
    var eligible = (registry || []).filter(function (candidate) {
      var sameName = actorDisplayName(candidate) === actorDisplayName(actor);

      return actorMissionUsage(candidate, 'Operation Alpha') && !sameName && (candidate.faction || '').toLowerCase() === 'genealord';
    });
    var opposingActor;

    if (eligible.length) {
      opposingActor = runtimePick(eligible);
      return actorSubjectLine(opposingActor);
    }

    return 'Genealord pressure authority';
  }

  function forceMultiplierFromRegistry(actor, registry) {
    var eligible = (registry || []).filter(function (candidate) {
      var sameName = actorDisplayName(candidate) === actorDisplayName(actor);

      return actorMissionUsage(candidate, 'Operation Alpha') && !sameName && (candidate.faction || '').toLowerCase() === 'mutant';
    });
    var forceMultiplier;

    if (eligible.length) {
      forceMultiplier = runtimePick(eligible);
      return actorSubjectLine(forceMultiplier);
    }

    return 'Mutant pressure cell';
  }

  function generateRuntimeScene(actor, registry) {
    var subject = actorSubjectLine(actor);
    var mission = runtimePick(runtimeMissionMatrix);
    var scene = {
      sceneName: runtimePick(runtimeSceneNames),
      mission: mission,
      subject: subject,
      opposingForce: opposingForceFromRegistry(actor, registry),
      forceMultiplier: forceMultiplierFromRegistry(actor, registry),
      catalyst: runtimePick(runtimeCatalysts),
      fieldPressure: runtimePick(runtimeFieldPressureLines),
      pressureCondition: runtimePick(runtimeScenePressureConditions),
      interventionWindow: runtimePick(runtimeSceneInterventionWindows),
      risk: runtimePick(runtimeSceneRisks),
      fateCondition: runtimePick(runtimeSceneFateConditions),
      complication: runtimePick(runtimeSceneComplications),
      outcomeContext: mission.label + ' // ' + subject + ' under ' + (actor && actor.faction ? actor.faction : 'unresolved') + ' influence.'
    };

    runtimeLog('scene generated', {
      scene: scene.sceneName,
      mission: mission.label,
      subject: scene.subject,
      risk: scene.risk
    });

    return scene;
  }

  function sceneAdvanceRequirement(scene) {
    if (!scene) {
      return 2;
    }
    if (scene.fateCondition === 'extraction opens after two advances') {
      return 2;
    }
    if (scene.risk === 'extraction delay') {
      return 2;
    }

    return 1;
  }

  function scenePressureModifier(scene, commandKey, state) {
    var modifier = 0;

    if (!scene) {
      return modifier;
    }
    if (scene.pressureCondition === 'pressure escalation' && commandKey === 'advance') {
      modifier += 1;
    }
    if (scene.pressureCondition === 'hostile observation' && commandKey !== 'hold') {
      modifier += 1;
    }
    if (scene.risk === 'pressure cascade' && state.directiveCount >= 2) {
      modifier += 1;
    }
    if (scene.fateCondition === 'pressure rises after repeated intervention' && state.directiveCount >= 2) {
      modifier += 1;
    }
    if (scene.complication && scene.complication.key === 'second-advance-pressure' && commandKey === 'advance' && state.advanceCount >= 2) {
      modifier += 1;
    }

    return modifier;
  }

  function renderSceneBriefing(root, scene, state) {
    var mission = root.querySelector('[data-ooh-alpha-mission]');
    var title = root.querySelector('[data-ooh-alpha-mission-title]');
    var source = root.querySelector('[data-ooh-alpha-mission-source]');
    var brief = root.querySelector('[data-ooh-alpha-mission-brief]');

    if (!scene || !mission || !title || !source || !brief) {
      return;
    }

    mission.hidden = false;
    mission.setAttribute('data-mission-source', 'unseen-hand-scene');
    mission.classList.remove('is-mission-updated');
    window.setTimeout(function () {
      mission.classList.add('is-mission-updated');
    }, 0);

    title.textContent = 'FIELD TASK: ' + (scene.mission ? scene.mission.label : 'UNRESOLVED');
    source.textContent = 'SUBJECT: ' + scene.subject;
    brief.textContent = 'OPPOSING FORCE: ' + scene.opposingForce + ' // FORCE MULTIPLIER: ' + scene.forceMultiplier + ' // CATALYST: ' + scene.catalyst + ' // FIELD PRESSURE: ' + scene.fieldPressure;

    if (state) {
      state.currentCondition = scene.pressureCondition;
    }
  }

  function storyToneForActor(actor) {
    var faction = (actor && actor.faction || '').toLowerCase();

    if (faction === 'genealord') {
      return 'deterministic';
    }
    if (faction === 'ronin') {
      return 'observational';
    }
    if (faction === 'mutant') {
      return 'volatile';
    }

    return 'unseen';
  }

  function hookForBeat(state) {
    if (state.beatName === 'Midpoint') {
      return runtimePick(runtimeMidpointHooks);
    }
    if (state.beatName === 'Dark Night of the Signal') {
      return runtimePick(runtimeDarkNightHooks);
    }
    if (state.beatName === 'Finale' || state.beatName === 'Final Image' || state.outcomeState !== 'PENDING') {
      return runtimePick(runtimeFinaleHooks);
    }

    return state.hookLine || runtimePick(runtimeOpeningHooks);
  }

  function directiveStoryEffect(commandKey) {
    return runtimeDirectiveStoryEffects[commandKey] || {
      choice: 'DIRECTIVE RECEIVED',
      fateLine: 'the route bends under unseen pressure',
      effect: 'the unseen hand adjusts consequence'
    };
  }

  function runtimePhaseCluster(state) {
    var index = state && typeof state.phaseSpineIndex === 'number' ? state.phaseSpineIndex : 0;

    return runtimePhaseSpine[clampRuntimeLevel(index, 0, runtimePhaseSpine.length - 1)];
  }

  function runtimeVisiblePhase(state) {
    return runtimePhaseCluster(state).label;
  }

  function runtimePhasePressure(state) {
    var pressure = state && state.phasePressureCounts ? state.phasePressureCounts[runtimePhaseCluster(state).key] : 0;

    return pressure || 0;
  }

  function updateBattlefieldReadiness(state) {
    var phase = runtimePhaseCluster(state);
    var ready = runtimePhasePressure(state) >= phase.requiredPressure && state.beatIndex >= phase.beatEnd && state.outcomeState === 'PENDING';

    state.currentPhase = phase.label;
    state.phaseActionCount = runtimePhasePressure(state);
    state.phaseRequiredCount = phase.requiredPressure;
    state.battlefieldPresenceReady = ready;
    return ready;
  }

  function runtimePhaseReady(state) {
    return !!(state && state.battlefieldPresenceReady);
  }

  function runtimePhaseStatus(state, index) {
    var phase = runtimePhaseSpine[index];

    if (!state || index > state.phaseSpineIndex) {
      return phase.label + ' - LOCKED';
    }
    if (index < state.phaseSpineIndex || (state.outcomeState !== 'PENDING' && index === runtimePhaseSpine.length - 1)) {
      return phase.label + ' - COMPLETE';
    }

    return phase.label + ' - ACTIVE ' + runtimePhasePressure(state) + '/' + phase.requiredPressure;
  }

  function runtimePhaseSummary(state) {
    return runtimePhaseSpine.map(function (phase, index) {
      return runtimePhaseStatus(state, index);
    }).join(' // ');
  }

  function runtimePresenceStatus(state) {
    if (!state) {
      return 'PRESENCE: UNSTABLE';
    }
    updateBattlefieldReadiness(state);
    if (state.outcomeState !== 'PENDING') {
      return 'PRESENCE: LOCKED';
    }
    if (runtimePhaseReady(state)) {
      return 'PRESENCE: READY TO LOCK';
    }

    return 'PRESENCE: BUILDING';
  }

  function formatOperationTime(minutes) {
    var total = Math.max(0, minutes || 0);
    var hours = Math.floor(total / 60);
    var mins = total % 60;

    return String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
  }

  function syncPhaseBeat(state) {
    var phase = runtimePhaseCluster(state);
    var count = runtimePhasePressure(state);
    var span = phase.beatEnd - phase.beatStart + 1;
    var beatOffset = count >= phase.requiredPressure ? span - 1 : Math.max(0, Math.floor((count / phase.requiredPressure) * span));

    state.beatIndex = clampRuntimeLevel(phase.beatStart + beatOffset, phase.beatStart, phase.beatEnd);
    state.beatName = runtimeStoryBeats[state.beatIndex];
  }

  function currentBeatAarName(state) {
    return runtimeBeatAarNames[state.beatIndex] || runtimeBeatAarNames[0];
  }

  function storyPanelText(state) {
    return 'FORCE: ' + (state.fateLine || 'the scene waits for pressure') + '. EFFECT: ' + (state.screenwriterEffect || state.hookLine);
  }

  function consequenceIncidentSummary(state) {
    var scene = state && state.scene ? state.scene : {};
    var mission = scene.mission || runtimeMissionById('recon');
    var subject = scene.subject || battlefieldActorLabel(state && state.selectedActor);
    var opposition = scene.opposingForce || 'the opposing force';
    var phase = state ? runtimeVisiblePhase(state) : 'SETUP';
    var status = state ? runtimePresenceStatus(state).replace(/^PRESENCE:\s*/, '').toLowerCase() : 'building';
    var controlLine = state && state.fateLine ? state.fateLine : 'the scene waits for pressure';
    var effectLine = state && state.screenwriterEffect ? state.screenwriterEffect : 'you are shaping the field before the subject can see the cost';

    return subject + ' is inside ' + mission.label + ' while ' + opposition + ' presses the route. You are controlling the field posture, not the actor directly: ' + controlLine + '. The moment matters because ' + phase + ' presence is ' + status + ', and ' + effectLine + '.';
  }

  function renderOppositionReadout(root, state) {
    var force = root.querySelector('[data-ooh-alpha-opposition-force]');
    var vector = root.querySelector('[data-ooh-alpha-opposition-vector]');
    var scene = state && state.scene ? state.scene : {};

    if (force) {
      force.textContent = scene.opposingForce || 'Pending';
    }
    if (vector) {
      vector.textContent = scene.forceMultiplier ? scene.forceMultiplier + ' is amplifying ' + (scene.fieldPressure || 'field pressure') + '.' : 'Opposition readout pending.';
    }
  }

  function battlefieldPressureLabel(level) {
    if (level >= 8) {
      return 'REDLINE';
    }
    if (level >= 6) {
      return 'RISING';
    }
    if (level <= 2) {
      return 'CONTAINED';
    }

    return 'ACTIVE';
  }

  function battlefieldActorLabel(actor) {
    if (!actor || !actor.name) {
      return 'Unknown subject';
    }

    return actor.name + ' / ' + (actor.faction || 'unresolved');
  }

  function runtimeFieldLine(state, directive) {
    var scene = state.scene || {};
    var mission = scene.mission || runtimeMissionById('recon');

    return runtimeVisiblePhase(state) + ' // ' + mission.label + ' // ' + runtimePresenceStatus(state);
  }

  function runtimeMovementLine(state, directive) {
    var scene = state.scene || {};
    var directiveLabel = directive ? directive.state : state.lastDirective;

    return battlefieldActorLabel(state.selectedActor) + ' vs ' + (scene.opposingForce || 'unresolved force') + ' // ' + directiveLabel;
  }

  function runtimeSignalLine(state) {
    return 'pressure ' + battlefieldPressureLabel(state.pressureLevel) + ' // clarity ' + state.channelClarity + ' // exposure ' + state.exposureLevel;
  }

  function setRuntimeBattlefieldPresence(root, state, directive) {
    setBattlefieldPresence(root, {
      field: runtimeFieldLine(state, directive),
      movement: runtimeMovementLine(state, directive),
      signal: runtimeSignalLine(state)
    });
  }

  function renderBattlefieldGate(root, state) {
    var lockButton = root.querySelector('[data-ooh-alpha-mission-cycle]');
    var matrix = root.querySelector('[data-ooh-alpha-presence-choice-matrix]');
    var consequenceStatus = root.querySelector('[data-ooh-alpha-consequence-status]');
    var consequenceSummary = root.querySelector('[data-ooh-alpha-consequence-summary]');
    var commandState = root.querySelector('[data-ooh-alpha-command-state]');
    var ready = updateBattlefieldReadiness(state);

    if (commandState) {
      commandState.textContent = runtimePhaseSummary(state);
    }
    if (consequenceStatus) {
      consequenceStatus.textContent = runtimePresenceStatus(state);
    }
    if (consequenceSummary) {
      consequenceSummary.textContent = consequenceIncidentSummary(state);
    }
    renderOppositionReadout(root, state);
    if (lockButton) {
      lockButton.textContent = ready ? 'SELECT BATTLEFIELD POSTURE' : 'BATTLEFIELD PRESENCE BUILDING';
      lockButton.disabled = true;
      lockButton.classList.toggle('is-presence-ready', ready && state.outcomeState === 'PENDING');
      lockButton.classList.toggle('is-presence-locked', state.outcomeState !== 'PENDING');
    }
    renderPresenceChoiceMatrix(root, state, ready);
  }

  function phasePresenceChoices(state) {
    return runtimePresenceChoiceMatrix[runtimePhaseCluster(state).key] || [];
  }

  function renderPresenceChoiceMatrix(root, state, ready) {
    var missionPanel = root.querySelector('[data-ooh-alpha-mission]');
    var lockButton = root.querySelector('[data-ooh-alpha-mission-cycle]');
    var matrix = root.querySelector('[data-ooh-alpha-presence-choice-matrix]');

    if (!missionPanel || !lockButton) {
      return;
    }
    if (!matrix) {
      matrix = document.createElement('div');
      matrix.className = 'ooh-operation-alpha__presence-choice-matrix';
      matrix.setAttribute('data-ooh-alpha-presence-choice-matrix', '');
      missionPanel.insertBefore(matrix, lockButton);
    }

    matrix.innerHTML = '';
    matrix.hidden = !ready || state.outcomeState !== 'PENDING';
    if (matrix.hidden) {
      return;
    }

    phasePresenceChoices(state).forEach(function (choice) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'ooh-operation-alpha__presence-choice';
      button.textContent = choice.label;
      button.disabled = false;
      if (state.selectedBattlefieldPosture && state.selectedBattlefieldPosture.label === choice.label) {
        button.classList.add('is-presence-choice-selected');
        button.setAttribute('aria-pressed', 'true');
      }
      button.addEventListener('click', function () {
        selectPresenceChoice(root, choice);
      });
      matrix.appendChild(button);
    });
  }

  function stationOutputLine(state) {
    var scene = state.scene || {};
    var phase = runtimeVisiblePhase(state);
    var lockedChoice = lastLockedPresenceChoice(state);

    if (phase === 'SETUP') {
      return 'READ OUTPUT: ' + scene.subject + ' enters the field. ' + scene.opposingForce + ' applies pressure through ' + scene.forceMultiplier + '.';
    }
    if (phase === 'CONFRONTATION') {
      return 'READ OUTPUT: ' + (lockedChoice ? lockedChoice.label + ' carries forward. ' + lockedChoice.narrativeEffect : 'The prior field posture carries forward.') + ' ' + (state.characterTurns.confrontation || 'A new pressure turn enters the corridor.');
    }

    return 'READ OUTPUT: ' + (lockedChoice ? lockedChoice.label + ' sets the collapse posture. ' : '') + (state.characterTurns.collapse || 'The opposing force closes in.') + ' Pressure ' + state.pressureLevel + ', clarity ' + state.channelClarity + ', exposure ' + state.exposureLevel + ', clock ' + formatOperationTime(state.operationTime) + '.';
  }

  function renderStationOutput(root, state) {
    var title = root.querySelector('[data-ooh-alpha-scenario-title]');
    var situation = root.querySelector('[data-ooh-alpha-situation]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');

    if (title) {
      title.textContent = runtimeVisiblePhase(state) + ' BATTLEFIELD OPERATIONS STATION';
    }
    if (situation) {
      situation.innerHTML = '<p>' + stationOutputLine(state) + '</p><p>' + runtimePhaseSummary(state) + '</p>';
    }
    if (pressure) {
      pressure.textContent = runtimePresenceStatus(state) + ' // CLOCK ' + formatOperationTime(state.operationTime);
    }
    if (reaction) {
      reaction.textContent = state.consequenceLine || 'Read output, then apply field pressure.';
    }
  }

  function advanceRuntimeBeat(state, commandKey) {
    var effect = directiveStoryEffect(commandKey);

    state.beatChoiceCount = clampRuntimeLevel(state.beatChoiceCount + 1, 0, runtimeStoryBeats.length);
    state.beatIndex = clampRuntimeLevel(state.beatChoiceCount, 0, runtimeStoryBeats.length - 1);
    state.beatName = runtimeStoryBeats[state.beatIndex];
    state.currentChoice = effect.choice;
    state.fateLine = effect.fateLine;
    state.screenwriterEffect = effect.effect;
    state.beatHistory.push({
      beat: state.beatName,
      choice: effect.choice,
      directive: commandKey
    });

    if (state.beatName === 'Midpoint' || state.beatName === 'Dark Night of the Signal' || state.beatName === 'Finale') {
      state.hookLine = hookForBeat(state);
      runtimeLog('hook generated', state.hookLine);
    }

    runtimeLog('beat advanced', {
      beat: state.beatName,
      choice: effect.choice,
      count: state.beatChoiceCount
    });
  }

  function forceFinaleOutcome(state) {
    var score;

    if (state.outcomeState !== 'PENDING' || state.beatChoiceCount < runtimeStoryBeats.length) {
      return;
    }

    state.beatIndex = runtimeStoryBeats.length - 1;
    state.beatName = runtimeStoryBeats[state.beatIndex];
    score = state.stabilityLevel + state.channelClarity + state.operationProgress - state.pressureLevel - state.exposureLevel;

    if (state.extractionAuthorized) {
      state.outcomeState = 'EXTRACTED';
    }
    else if (state.channelClarity <= 1) {
      state.outcomeState = 'SIGNAL LOST';
    }
    else if (score >= 4) {
      state.outcomeState = 'STABILIZED';
    }
    else {
      state.outcomeState = 'COMPROMISED';
    }

    state.operationPhase = 'RESOLVED';
    state.hookLine = hookForBeat(state);
    runtimeLog('finale forced', state.outcomeState);
    runtimeLog('hook generated', state.hookLine);
  }

  function finalizeRuntimeBeat(state) {
    if (state.outcomeState === 'PENDING') {
      return;
    }
    if (state.beatName !== 'Final Image') {
      state.beatIndex = Math.max(state.beatIndex, runtimeStoryBeats.indexOf('Finale'));
      state.beatName = runtimeStoryBeats[state.beatIndex];
    }
    state.hookLine = hookForBeat(state);
    runtimeLog('hook generated', state.hookLine);
  }

  function keyChoiceSummary(state) {
    var choices = state.beatHistory.slice(-3).map(function (entry) {
      return entry.choice;
    });

    return choices.length ? choices.join(' -> ') : 'FIELD INITIALIZED';
  }

  function renderRuntimeBeatPanel(root, state) {
    var commandState = root.querySelector('[data-ooh-alpha-command-state]');
    var acknowledgement = root.querySelector('[data-ooh-alpha-command-ack]');
    var consequenceStatus = root.querySelector('[data-ooh-alpha-consequence-status]');
    var consequenceSummary = root.querySelector('[data-ooh-alpha-consequence-summary]');

    if (commandState) {
      commandState.textContent = 'PHASE: ' + runtimeVisiblePhase(state);
    }
    if (acknowledgement) {
      acknowledgement.textContent = state.hookLine || state.consequenceLine;
    }
    if (consequenceStatus) {
      consequenceStatus.textContent = 'PHASE: ' + runtimeVisiblePhase(state);
    }
    if (consequenceSummary) {
      consequenceSummary.textContent = consequenceIncidentSummary(state);
    }
  }

  function buildRuntimeState(root, actor, payload) {
    var scene = generateRuntimeScene(actor, root.oohAlphaActorRegistry || []);

    return {
      selectedActor: actor,
      faction: actor.faction || 'Unresolved',
      scene: scene,
      currentCondition: scene.pressureCondition || payload.condition || 'Unresolved',
      activeChannel: payload.playlist || 'Unresolved',
      pressureLevel: initialPressureForCondition(payload.condition),
      stabilityLevel: 5,
      operationPhase: 'ACTIVE',
      directiveCount: 0,
      lastDirective: 'NONE',
      outcomeState: 'PENDING',
      operationProgress: 0,
      channelClarity: 3,
      exposureLevel: 2,
      extractionAuthorized: false,
      advanceCount: 0,
      directiveBlocked: false,
      beatIndex: 0,
      beatName: runtimeStoryBeats[0],
      beatChoiceCount: 0,
      beatHistory: [],
      phaseSpineIndex: 0,
      phasePressureCounts: {
        setup: 0,
        confrontation: 0,
        collapse: 0
      },
      phaseLocks: [],
      totalFieldPressure: 0,
      operationTime: 0,
      currentPhase: 'SETUP',
      phaseActionCount: 0,
      phaseRequiredCount: runtimePhaseSpine[0].requiredPressure,
      battlefieldPresenceReady: false,
      selectedBattlefieldPosture: null,
      choiceHistory: [],
      lockedPresenceChoices: [],
      pendingPresenceChoice: null,
      stationReports: [],
      characterTurns: {
        setup: 'Ronin subject established against Genealord pressure and mutant force.',
        confrontation: '',
        collapse: ''
      },
      storyTone: storyToneForActor(actor),
      hookLine: runtimePick(runtimeOpeningHooks),
      currentChoice: 'FIELD INITIALIZED',
      fateLine: 'the scene waits for the unseen hand',
      screenwriterEffect: 'you are writing fate in real time',
      consequenceLine: 'AWAITING FIELD PRESSURE // battlefield presence building.'
    };
  }

  function ensureRuntimeState(root, actor, payload) {
    if (!root.oohAlphaRuntimeState) {
      root.oohAlphaRuntimeState = buildRuntimeState(root, actor, payload);
      runtimeLog('runtime initialized', {
        faction: root.oohAlphaRuntimeState.faction,
        condition: root.oohAlphaRuntimeState.currentCondition,
        channel: root.oohAlphaRuntimeState.activeChannel
      });
      renderSceneBriefing(root, root.oohAlphaRuntimeState.scene, root.oohAlphaRuntimeState);
      runtimeLog('hook generated', root.oohAlphaRuntimeState.hookLine);
      renderRuntimeBeatPanel(root, root.oohAlphaRuntimeState);
      setRuntimeBattlefieldPresence(root, root.oohAlphaRuntimeState, { state: 'FIELD INITIALIZED' });
      renderBattlefieldGate(root, root.oohAlphaRuntimeState);
      renderOppositionReadout(root, root.oohAlphaRuntimeState);
      renderStationOutput(root, root.oohAlphaRuntimeState);
      return root.oohAlphaRuntimeState;
    }

    root.oohAlphaRuntimeState.selectedActor = root.oohAlphaRuntimeState.selectedActor || actor;
    root.oohAlphaRuntimeState.faction = root.oohAlphaRuntimeState.faction || actor.faction || 'Unresolved';
    root.oohAlphaRuntimeState.currentCondition = root.oohAlphaRuntimeState.currentCondition || payload.condition || 'Unresolved';
    root.oohAlphaRuntimeState.activeChannel = root.oohAlphaRuntimeState.activeChannel || payload.playlist || 'Unresolved';

    return root.oohAlphaRuntimeState;
  }

  function runtimePhaseLabel(state) {
    if (state.outcomeState !== 'PENDING') {
      return 'RESOLVED';
    }
    if (state.operationProgress >= 4) {
      return 'CLOSING';
    }
    if (state.pressureLevel >= 7) {
      return 'CONTESTED';
    }
    if (state.directiveCount > 0) {
      return 'ACTIVE';
    }

    return 'STANDING BY';
  }

  function directiveConsequenceText(commandKey, state, authorized) {
    var tone = actorFactionTone(state.selectedActor);
    var scene = state.scene || {};
    var sceneName = scene.sceneName || 'THE SCENE';
    var subject = scene.subject || 'the subject';
    var mission = scene.mission || runtimeMissionById('recon');
    var requirement = sceneAdvanceRequirement(scene);

    if (commandKey === 'hold') {
      return 'HOLD RECEIVED // stability improving. ' + tone;
    }
    if (commandKey === 'advance') {
      return 'RISK RECEIVED // ' + mission.label + ' pressure rising. ' + tone;
    }
    if (commandKey === 'extract' && !authorized) {
      return 'EXTRACT DENIED // ' + requirement + ' advances required. ' + tone;
    }
    if (commandKey === 'extract') {
      return 'EXTRACT AUTHORIZED // ' + mission.closure + ' ' + tone;
    }
    if (commandKey === 'signal') {
      return 'SIGNAL DEPLOYED // ' + subject + ' responds. ' + tone;
    }
    if (commandKey === 'divert') {
      return 'PLAN CHANGE RECEIVED // pressure redirected; clarity weakens. ' + tone;
    }

    return 'DIRECTIVE RECEIVED // consequence line adjusted. ' + tone;
  }

  function resolveRuntimeOutcome(state) {
    var score;

    if (state.outcomeState !== 'PENDING') {
      return state.outcomeState;
    }
    if (state.lastDirective === 'extract' && state.extractionAuthorized) {
      state.outcomeState = 'EXTRACTED';
    }
    else if (state.lastDirective === 'extract') {
      return state.outcomeState;
    }
    else if (state.channelClarity <= 0 || (state.lastDirective === 'signal' && state.exposureLevel >= 6)) {
      state.outcomeState = 'SIGNAL LOST';
    }
    else if (state.pressureLevel >= 9 || (state.pressureLevel >= 7 && state.stabilityLevel <= 2)) {
      state.outcomeState = 'COMPROMISED';
    }
    else if (state.directiveCount >= runtimeStoryBeats.length) {
      score = state.stabilityLevel + state.channelClarity + state.operationProgress - state.pressureLevel - state.exposureLevel;
      state.outcomeState = score >= 4 ? 'STABILIZED' : 'COMPROMISED';
    }

    if (state.outcomeState !== 'PENDING') {
      state.operationPhase = 'RESOLVED';
      finalizeRuntimeBeat(state);
    }

    return state.outcomeState;
  }

  function applyRuntimeDirective(root, commandKey) {
    var payload = root.oohAlphaOperationalPayload;
    var actor = root.oohAlphaSelectedActor || {};
    var state;
    var extractionAuthorized = false;
    var scene;
    var requiredAdvances;
    var requiredStability;
    var pressureModifier;

    if (!payload) {
      return null;
    }

    state = ensureRuntimeState(root, actor, payload);

    if (state.outcomeState !== 'PENDING') {
      state.directiveBlocked = true;
      state.consequenceLine = 'OPERATION RESOLVED // initialize a new field to continue.';
      runtimeLog('directive blocked after resolution', commandKey);
      return state;
    }

    runtimeLog('directive received', commandKey);
    state.directiveBlocked = false;
    state.directiveCount++;
    state.lastDirective = commandKey;
    advanceRuntimeBeat(state, commandKey);
    scene = state.scene || {};
    requiredAdvances = sceneAdvanceRequirement(scene);
    requiredStability = scene.complication && scene.complication.key === 'stabilized-extraction' ? 5 : 3;
    pressureModifier = scenePressureModifier(scene, commandKey, state);

    if (commandKey === 'hold') {
      state.stabilityLevel = clampRuntimeLevel(state.stabilityLevel + 2, 0, 10);
      state.pressureLevel = clampRuntimeLevel(state.pressureLevel - 1, 0, 10);
      state.channelClarity = clampRuntimeLevel(state.channelClarity + 1, 0, 6);
      if (scene.complication && scene.complication.key === 'hold-slows-progress') {
        state.operationProgress = clampRuntimeLevel(state.operationProgress - 1, 0, 6);
      }
      if (scene.fateCondition === 'hold delays exposure') {
        state.exposureLevel = clampRuntimeLevel(state.exposureLevel - 1, 0, 6);
      }
    }
    else if (commandKey === 'advance') {
      state.advanceCount++;
      state.operationProgress = clampRuntimeLevel(state.operationProgress + 2, 0, 6);
      state.pressureLevel = clampRuntimeLevel(state.pressureLevel + 2 + pressureModifier, 0, 10);
      state.stabilityLevel = clampRuntimeLevel(state.stabilityLevel - 1, 0, 10);
      state.exposureLevel = clampRuntimeLevel(state.exposureLevel + 1, 0, 6);
    }
    else if (commandKey === 'extract') {
      extractionAuthorized = state.advanceCount >= requiredAdvances && state.stabilityLevel >= requiredStability && state.beatChoiceCount >= 3;
      state.extractionAuthorized = extractionAuthorized;
      if (extractionAuthorized) {
        state.operationProgress = clampRuntimeLevel(state.operationProgress + 1, 0, 6);
        state.pressureLevel = clampRuntimeLevel(state.pressureLevel - 1, 0, 10);
        state.stabilityLevel = clampRuntimeLevel(state.stabilityLevel + 1, 0, 10);
      }
      else {
        state.pressureLevel = clampRuntimeLevel(state.pressureLevel + 1, 0, 10);
        state.stabilityLevel = clampRuntimeLevel(state.stabilityLevel - 1, 0, 10);
        state.channelClarity = clampRuntimeLevel(state.channelClarity - 1, 0, 6);
      }
    }
    else if (commandKey === 'signal') {
      state.channelClarity = clampRuntimeLevel(state.channelClarity + 2, 0, 6);
      state.pressureLevel = clampRuntimeLevel(state.pressureLevel + 1 + pressureModifier, 0, 10);
      state.exposureLevel = clampRuntimeLevel(state.exposureLevel + 1, 0, 6);
      if ((scene.fateCondition === 'signal deployment increases visibility') || (scene.complication && scene.complication.key === 'signal-exposure')) {
        state.exposureLevel = clampRuntimeLevel(state.exposureLevel + 1, 0, 6);
      }
    }
    else if (commandKey === 'divert') {
      state.pressureLevel = clampRuntimeLevel(state.pressureLevel - 2, 0, 10);
      state.operationProgress = clampRuntimeLevel(state.operationProgress - 1, 0, 6);
      state.stabilityLevel = clampRuntimeLevel(state.stabilityLevel - 1, 0, 10);
      state.exposureLevel = clampRuntimeLevel(state.exposureLevel - 1, 0, 6);
      if ((scene.fateCondition === 'divert reduces clarity') || (scene.complication && scene.complication.key === 'sharp-divert-cost')) {
        state.channelClarity = clampRuntimeLevel(state.channelClarity - 1, 0, 6);
        state.operationProgress = clampRuntimeLevel(state.operationProgress - 1, 0, 6);
      }
    }

    if (commandKey !== 'advance' && commandKey !== 'signal') {
      state.pressureLevel = clampRuntimeLevel(state.pressureLevel + pressureModifier, 0, 10);
    }
    if (scene.fateCondition === 'fate line weakens under pressure' && state.pressureLevel >= 7) {
      state.channelClarity = clampRuntimeLevel(state.channelClarity - 1, 0, 6);
    }

    state.consequenceLine = directiveConsequenceText(commandKey, state, extractionAuthorized);
    resolveRuntimeOutcome(state);
    forceFinaleOutcome(state);
    state.operationPhase = runtimePhaseLabel(state);

    runtimeLog('state updated', {
      pressure: state.pressureLevel,
      stability: state.stabilityLevel,
      progress: state.operationProgress,
      phase: state.operationPhase,
      outcome: state.outcomeState
    });

    if (state.outcomeState !== 'PENDING') {
      runtimeLog('operation resolved', state.outcomeState);
    }

    return state;
  }

  function outcomeMarkLine(state) {
    var scene = state.scene || {};
    var sceneName = scene.sceneName || 'The scene';
    var subject = scene.subject || 'the subject';
    var mission = scene.mission || runtimeMissionById('recon');

    if (state.outcomeState === 'EXTRACTED') {
      return sceneName + ' closed under controlled pressure. ' + mission.closure;
    }
    if (state.outcomeState === 'STABILIZED') {
      return 'Force line stabilized before exposure peaked. ' + subject + ' remained inside ' + mission.label + '.';
    }
    if (state.outcomeState === 'COMPROMISED') {
      return 'Intervention failed; ' + mission.pressure.toLowerCase() + ' Consequence consumed the scene around ' + subject + '.';
    }
    if (state.outcomeState === 'SIGNAL LOST') {
      return 'The mark was lost after signal collapse. ' + mission.label + ' went silent.';
    }
    if (state.outcomeState === 'OPERATION PASSED') {
      return sceneName + ' closed after battlefield presence held. ' + mission.closure;
    }
    if (state.outcomeState === 'OPERATION FAILED') {
      return sceneName + ' collapsed before the unseen hand could hold the field.';
    }
    if (state.outcomeState === 'PARTIAL SUCCESS') {
      return sceneName + ' survived, but the final report arrived damaged.';
    }

    return 'Runtime still accepting directives.';
  }

  function outcomeWhyLine(state) {
    if (state.outcomeState === 'OPERATION PASSED') {
      return 'WHY IT SUCCEEDED: clarity and pressure stayed within survivable limits.';
    }
    if (state.outcomeState === 'PARTIAL SUCCESS') {
      return 'WHY IT PARTIALLY HELD: the field closed, but pressure or time damaged the report.';
    }

    return 'WHY IT FAILED: exposure, pressure, or time exceeded control limits.';
  }

  function aarLineForBeat(state, index) {
    var match = state.choiceHistory.filter(function (choice) {
      return choice.beat === runtimeBeatAarNames[index];
    })[0];

    if (match) {
      return runtimeBeatAarNames[index] + ' - ' + match.intervention + ': ' + match.consequence;
    }
    if (index === 0) {
      return runtimeBeatAarNames[index] + ' - Subject entered unstable ground.';
    }
    if (index === runtimeBeatAarNames.length - 1) {
      return runtimeBeatAarNames[index] + ' - Battlefield Presence reached final lock.';
    }

    return runtimeBeatAarNames[index] + ' - Field pressure carried forward.';
  }

  function afterActionReviewText(state) {
    var scene = state.scene || {};
    var mission = scene.mission || runtimeMissionById('recon');
    var lines = [
      'AFTER ACTION REVIEW',
      'SUBJECT: ' + (scene.subject || 'unresolved'),
      'OPPOSING FORCE: ' + (scene.opposingForce || 'Genealord pressure authority'),
      'FORCE MULTIPLIER: ' + (scene.forceMultiplier || 'Mutant pressure cell'),
      'MISSION: ' + mission.label,
      'OUTCOME: ' + state.outcomeState,
      'OPERATION TIME: ' + formatOperationTime(state.operationTime),
      'LOCKED BATTLEFIELD PRESENCE CHOICES: ' + lockedPresenceChoicesText(state),
      outcomeWhyLine(state),
      '15-PART BREAKDOWN'
    ];

    runtimeBeatAarNames.forEach(function (beatName, index) {
      lines.push(aarLineForBeat(state, index));
    });

    return lines.join(' // ');
  }

  function lockedPresenceChoicesText(state) {
    if (!state.lockedPresenceChoices.length) {
      return 'none';
    }

    return state.lockedPresenceChoices.map(function (choice) {
      return choice.phase + ' - ' + choice.label + ' (pressure ' + choice.pressureDelta + ', clarity ' + choice.clarityDelta + ', exposure ' + choice.exposureDelta + ', time +' + choice.timeCost + '): ' + choice.narrativeEffect;
    }).join(' | ');
  }

  function renderRuntimeOutcome(root, state) {
    var result = root.querySelector('[data-ooh-alpha-result]');
    var title = root.querySelector('[data-ooh-alpha-result-title]');
    var field = root.querySelector('[data-ooh-alpha-result-field]');
    var mark = root.querySelector('[data-ooh-alpha-result-mark]');
    var activationButton = root.querySelector('[data-ooh-alpha-activate]');
    var scene = state.scene || {};
    var mission = scene.mission || runtimeMissionById('recon');

    if (!result || !title || !field || !mark || state.outcomeState === 'PENDING') {
      return;
    }

    result.hidden = false;
    result.setAttribute('data-result-field', state.outcomeState.toLowerCase().replace(/\s+/g, '-'));
    result.classList.remove('is-result-updated');
    window.setTimeout(function () {
      result.classList.add('is-result-updated');
    }, 0);

    title.textContent = 'SCENE CLOSED: ' + (scene.sceneName || 'UNRESOLVED SCENE');
    field.textContent = 'SUBJECT: ' + (scene.subject || 'unresolved') + ' // OPPOSING FORCE: ' + (scene.opposingForce || 'unresolved') + ' // FORCE MULTIPLIER: ' + (scene.forceMultiplier || 'unresolved') + ' // MISSION: ' + mission.label + ' // OUTCOME: ' + state.outcomeState + ' // OPERATION TIME: ' + formatOperationTime(state.operationTime) + ' // KEY INTERVENTIONS: ' + keyChoiceSummary(state);
    mark.textContent = afterActionReviewText(state);

    if (activationButton) {
      activationButton.disabled = false;
      activationButton.textContent = 'INITIALIZE NEW FIELD';
    }
  }

  function fieldPressureConsequence(state) {
    var phase = runtimePhaseCluster(state);
    var scene = state.scene || {};

    if (runtimePhaseReady(state)) {
      return 'BATTLEFIELD PRESENCE READY // lock ' + phase.label + ' to continue.';
    }

    return 'FIELD PRESSURE APPLIED // ' + phase.label + ' ' + runtimePhasePressure(state) + '/' + phase.requiredPressure + '. ' + (scene.fieldPressure || 'The field reacts.');
  }

  function recordFieldPressureChoice(state, action, deltas) {
    state.choiceHistory.push({
      phase: runtimeVisiblePhase(state),
      beat: currentBeatAarName(state),
      intervention: action.label,
      consequence: action.consequence,
      pressureDelta: deltas.pressure,
      clarityDelta: deltas.clarity,
      exposureDelta: deltas.exposure,
      timeCost: action.timeCost
    });
  }

  function selectPresenceChoice(root, choice) {
    var state = root.oohAlphaRuntimeState;
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');

    if (!state || state.outcomeState !== 'PENDING' || !runtimePhaseReady(state)) {
      return;
    }

    state.pendingPresenceChoice = choice;
    state.selectedBattlefieldPosture = choice;
    state.consequenceLine = 'BATTLEFIELD POSTURE SELECTED // ' + choice.label + '.';
    if (reaction) {
      reaction.textContent = choice.narrativeEffect;
    }
    window.console.log('OA Battlefield posture selected', {
      phase: runtimeVisiblePhase(state),
      choice: choice.label
    });
    renderBattlefieldGate(root, state);
    lockBattlefieldPresence(root);
  }

  function applyPresenceChoice(state, choice) {
    var phase = runtimeVisiblePhase(state);

    state.pressureLevel = clampRuntimeLevel(state.pressureLevel + choice.pressureDelta, 0, 10);
    state.channelClarity = clampRuntimeLevel(state.channelClarity + choice.clarityDelta, 0, 6);
    state.exposureLevel = clampRuntimeLevel(state.exposureLevel + choice.exposureDelta, 0, 6);
    state.operationTime += choice.timeCost;
    state.lockedPresenceChoices.push({
      phase: phase,
      label: choice.label,
      pressureDelta: choice.pressureDelta,
      clarityDelta: choice.clarityDelta,
      exposureDelta: choice.exposureDelta,
      timeCost: choice.timeCost,
      narrativeEffect: choice.narrativeEffect
    });
    updateBattlefieldReadiness(state);
  }

  function lastLockedPresenceChoice(state) {
    return state.lockedPresenceChoices[state.lockedPresenceChoices.length - 1] || null;
  }

  function presenceChoiceSummary(choice) {
    if (!choice) {
      return 'No posture locked yet.';
    }

    return choice.label + ' changed pressure ' + choice.pressureDelta + ', clarity ' + choice.clarityDelta + ', exposure ' + choice.exposureDelta + ', time +' + choice.timeCost + '.';
  }

  function applyFieldPressure(root, buttonIndex) {
    var state = ensureRuntimeState(root, root.oohAlphaSelectedActor || {}, root.oohAlphaOperationalPayload || {});
    var phase = runtimePhaseCluster(state);
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var runtimeCopy = root.querySelector('[data-ooh-alpha-runtime-copy]');
    var activationStatus = root.querySelector('[data-ooh-alpha-activation-status]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var action = runtimePressureActions[buttonIndex % runtimePressureActions.length];
    var deltas = {
      pressure: action.pressureDelta,
      clarity: action.clarityDelta,
      exposure: action.exposureDelta
    };

    if (state.outcomeState !== 'PENDING') {
      state.consequenceLine = 'OPERATION RESOLVED // initialize a new field to continue.';
      if (reaction) {
        reaction.textContent = state.consequenceLine;
      }
      renderBattlefieldGate(root, state);
      return state;
    }
    if (runtimePhaseReady(state)) {
      state.consequenceLine = 'BATTLEFIELD PRESENCE READY // lock ' + phase.label + ' to advance.';
      if (reaction) {
        reaction.textContent = state.consequenceLine;
      }
      renderBattlefieldGate(root, state);
      return state;
    }

    state.phasePressureCounts[phase.key] = runtimePhasePressure(state) + 1;
    state.totalFieldPressure++;
    state.directiveCount++;
    state.lastDirective = action.label;
    advanceRuntimeBeat(state, 'pressure');
    syncPhaseBeat(state);
    state.pressureLevel = clampRuntimeLevel(state.pressureLevel + action.pressureDelta, 0, 10);
    state.operationProgress = clampRuntimeLevel(state.operationProgress + 1, 0, 6);
    state.stabilityLevel = clampRuntimeLevel(state.stabilityLevel - (action.pressureDelta > 1 ? 1 : 0), 0, 10);
    state.channelClarity = clampRuntimeLevel(state.channelClarity + action.clarityDelta, 0, 6);
    state.exposureLevel = clampRuntimeLevel(state.exposureLevel + action.exposureDelta, 0, 6);
    state.operationTime += action.timeCost;
    updateBattlefieldReadiness(state);
    state.consequenceLine = fieldPressureConsequence(state);
    recordFieldPressureChoice(state, action, deltas);
    window.console.log('OA Battlefield action counted', {
      phase: state.currentPhase,
      count: state.phaseActionCount,
      required: state.phaseRequiredCount,
      ready: state.battlefieldPresenceReady
    });
    if (state.battlefieldPresenceReady) {
      window.console.log('OA Battlefield ready', {
        phase: state.currentPhase,
        count: state.phaseActionCount
      });
    }

    if (pressure) {
      pressure.textContent = runtimePresenceStatus(state) + ' // CLOCK ' + formatOperationTime(state.operationTime);
    }
    if (reaction) {
      reaction.textContent = state.consequenceLine;
    }
    if (runtimeCopy) {
      runtimeCopy.textContent = runtimeVisiblePhase(state) + ' // ' + action.label + ' // CLOCK ' + formatOperationTime(state.operationTime) + '.';
    }
    if (activationStatus) {
      activationStatus.textContent = runtimePresenceStatus(state) + ' // ' + runtimePhaseSummary(state);
    }

    setRuntimeBattlefieldPresence(root, state, { state: action.label });
    setAssetMovementFeed(root, buttonIndex === 1 ? 'advance' : 'hold');
    renderBattlefieldGate(root, state);
    renderStationOutput(root, state);
    return state;
  }

  function resolveBattlefieldSpine(root, state) {
    var completedLocks = state.phaseLocks.length;
    var timePenalty = state.operationTime > 24 ? 2 : (state.operationTime > 18 ? 1 : 0);
    var pressurePenalty = state.pressureLevel > 7 ? 2 : 0;
    var score = state.channelClarity + state.stabilityLevel + completedLocks - state.exposureLevel - pressurePenalty - timePenalty;

    if (state.extractionAuthorized || score >= 5) {
      state.outcomeState = 'OPERATION PASSED';
    }
    else if (score >= 2) {
      state.outcomeState = 'PARTIAL SUCCESS';
    }
    else {
      state.outcomeState = 'OPERATION FAILED';
    }
    state.operationPhase = 'RESOLVED';
    finalizeRuntimeBeat(state);
    runtimeLog('operation resolved', state.outcomeState);
    window.console.log('OA Battlefield resolved', {
      outcome: state.outcomeState,
      time: formatOperationTime(state.operationTime)
    });
    setRuntimeBattlefieldPresence(root, state, { state: 'BATTLEFIELD PRESENCE LOCKED' });
    renderBattlefieldGate(root, state);
    renderStationOutput(root, state);
    renderRuntimeOutcome(root, state);
  }

  function lockBattlefieldPresence(root) {
    var state = root.oohAlphaRuntimeState;
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var activationStatus = root.querySelector('[data-ooh-alpha-activation-status]');
    var phase;
    var nextPhase;

    if (!state) {
      return;
    }

    phase = runtimePhaseCluster(state);
    if (state.outcomeState !== 'PENDING') {
      state.consequenceLine = 'OPERATION RESOLVED // initialize a new field to continue.';
    }
    else if (!runtimePhaseReady(state)) {
      state.consequenceLine = 'BATTLEFIELD PRESENCE BUILDING // apply field pressure first.';
    }
    else if (!state.pendingPresenceChoice) {
      state.consequenceLine = 'BATTLEFIELD PRESENCE READY // choose a posture before locking.';
    }
    else if (state.phaseSpineIndex >= runtimePhaseSpine.length - 1) {
      applyPresenceChoice(state, state.pendingPresenceChoice);
      state.phaseLocks.push(phase.key);
      state.stationReports.push(phase.label + ' locked: ' + presenceChoiceSummary(state.pendingPresenceChoice));
      state.pendingPresenceChoice = null;
      state.selectedBattlefieldPosture = null;
      state.battlefieldPresenceReady = false;
      state.consequenceLine = 'COLLAPSE COMPLETE // operation resolving.';
      resolveBattlefieldSpine(root, state);
    }
    else {
      applyPresenceChoice(state, state.pendingPresenceChoice);
      state.phaseLocks.push(phase.key);
      state.stationReports.push(phase.label + ' locked: ' + presenceChoiceSummary(state.pendingPresenceChoice));
      state.phaseSpineIndex++;
      nextPhase = runtimePhaseCluster(state);
      state.beatIndex = nextPhase.beatStart;
      state.beatName = runtimeStoryBeats[state.beatIndex];
      state.pendingPresenceChoice = null;
      state.selectedBattlefieldPosture = null;
      state.battlefieldPresenceReady = false;
      updateBattlefieldReadiness(state);
      state.characterTurns[nextPhase.key] = runtimePick(runtimeCharacterTurns[nextPhase.key] || []);
      state.consequenceLine = phase.label + ' COMPLETE // ' + nextPhase.label + ' opens.';
      setRuntimeBattlefieldPresence(root, state, { state: 'BATTLEFIELD PRESENCE LOCKED' });
      renderBattlefieldGate(root, state);
      renderStationOutput(root, state);
      window.console.log('OA Battlefield phase advanced', {
        phase: state.currentPhase,
        required: state.phaseRequiredCount
      });
    }

    if (reaction) {
      reaction.textContent = state.consequenceLine;
    }
    if (activationStatus) {
      activationStatus.textContent = runtimePhaseSummary(state);
    }
  }

  function setActiveCommand(root, commandKey) {
    var directive = commandDirectives[commandKey];
    var state = root.querySelector('[data-ooh-alpha-command-state]');
    var acknowledgement = root.querySelector('[data-ooh-alpha-command-ack]');
    var runtimeCopy = root.querySelector('[data-ooh-alpha-runtime-copy]');
    var activationStatus = root.querySelector('[data-ooh-alpha-activation-status]');
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var consequenceStatus = root.querySelector('[data-ooh-alpha-consequence-status]');
    var consequenceSummary = root.querySelector('[data-ooh-alpha-consequence-summary]');
    var runtimeState;

    if (applyOa206CommandShortcut(root, commandKey)) {
      return;
    }

    if (!directive || !state || !acknowledgement) {
      return;
    }

    runtimeState = applyRuntimeDirective(root, commandKey);
    if (!runtimeState) {
      acknowledgement.textContent = 'Runtime inactive // initialize field before issuing directives.';
      return;
    }

    if (runtimeState.directiveBlocked) {
      state.textContent = 'RESOLVED // DIRECTIVE LOCKED';
      acknowledgement.textContent = runtimeState.consequenceLine;
      if (runtimeCopy) {
        runtimeCopy.textContent = runtimeState.consequenceLine;
      }
      if (activationStatus) {
        activationStatus.textContent = 'Operation resolved. Initialize a new field to continue.';
      }
      if (reaction) {
        reaction.textContent = runtimeState.consequenceLine;
      }
      return;
    }

    root.oohAlphaCommand = commandKey;
    state.textContent = 'PHASE: ' + runtimeVisiblePhase(runtimeState) + ' // ' + directive.state;
    acknowledgement.textContent = runtimeState.consequenceLine;
    if (runtimeCopy) {
      runtimeCopy.textContent = runtimeState.hookLine + ' // P' + runtimeState.pressureLevel + ' S' + runtimeState.stabilityLevel + ' G' + runtimeState.operationProgress + '.';
    }
    if (activationStatus) {
      activationStatus.textContent = 'Intervention accepted // ' + runtimeVisiblePhase(runtimeState) + ' // ' + runtimeState.outcomeState + '.';
    }
    if (reaction) {
      reaction.textContent = runtimeState.consequenceLine;
    }
    if (pressure) {
      pressure.textContent = directive.pressure + ' // LEVEL ' + runtimeState.pressureLevel;
    }
    if (consequenceStatus) {
      consequenceStatus.textContent = 'PHASE: ' + runtimeVisiblePhase(runtimeState);
    }
    if (consequenceSummary) {
      consequenceSummary.textContent = consequenceIncidentSummary(runtimeState);
    }
    setRuntimeBattlefieldPresence(root, runtimeState, directive);
    setAssetMovementFeed(root, directive.movementMode);
    renderRuntimeOutcome(root, runtimeState);

    root.querySelectorAll('[data-ooh-alpha-command]').forEach(function (button) {
      if (button.getAttribute('data-ooh-alpha-command') === commandKey) {
        button.classList.add('is-command-active');
        button.setAttribute('aria-pressed', 'true');
      }
      else {
        button.classList.remove('is-command-active');
        button.removeAttribute('aria-pressed');
      }
      button.disabled = false;
    });
  }

  function initCommandConsole(root) {
    root.querySelectorAll('[data-ooh-alpha-command]').forEach(function (button) {
      button.addEventListener('click', function () {
        setActiveCommand(root, button.getAttribute('data-ooh-alpha-command'));
      });
    });
  }

  function renderConsequence(root, contactIndex, buttonIndex) {
    var contact = contactSlots[contactIndex % contactSlots.length];
    var outcome = consequenceOutcomes[buttonIndex % consequenceOutcomes.length];
    var result = root.querySelector('[data-ooh-alpha-result]');
    var title = root.querySelector('[data-ooh-alpha-result-title]');
    var field = root.querySelector('[data-ooh-alpha-result-field]');
    var mark = root.querySelector('[data-ooh-alpha-result-mark]');

    if (!contact || !outcome || !result || !title || !field || !mark) {
      return;
    }

    result.hidden = false;
    result.setAttribute('data-result-field', outcome.field.toLowerCase().replace(/\s+/g, '-'));
    result.classList.remove('is-result-updated');
    window.setTimeout(function () {
      result.classList.add('is-result-updated');
    }, 0);

    title.textContent = outcome.title;
    field.textContent = 'FIELD STATUS: ' + outcome.field;
    mark.textContent = 'MARK RESPONSE: ' + (outcome.mark[contact.type] || contact.name + ': observing');
  }

  function renderContact(root, index, mode) {
    var contact = contactSlots[index % contactSlots.length];
    var frame = root.querySelector('[data-ooh-alpha-contact]');
    var image = root.querySelector('[data-ooh-alpha-contact-image]');
    var name = root.querySelector('[data-ooh-alpha-contact-name]');
    var faction = root.querySelector('[data-ooh-alpha-contact-faction]');
    var source = root.querySelector('[data-ooh-alpha-contact-source]');
    var status = root.querySelector('[data-ooh-alpha-contact-status]');
    var transmission = root.querySelector('[data-ooh-alpha-contact-transmission]');

    if (!contact || !frame || !name || !faction || !source || !status || !transmission) {
      return;
    }

    root.oohAlphaContactIndex = index % contactSlots.length;
    root.oohAlphaTransmissionIndex = root.oohAlphaTransmissionIndex || 0;
    frame.hidden = false;
    frame.setAttribute('data-contact-type', contact.type);
    frame.classList.remove('is-contact-responding');
    frame.classList.remove('is-contact-locking');
    frame.classList.remove('is-contact-imaged');

    if (image && contact.portrait) {
      image.src = containedAssetPath(contact.portrait);
      image.hidden = false;
      frame.classList.add('is-contact-imaged');
    }
    name.textContent = contact.name;
    faction.textContent = contact.faction;
    source.textContent = contact.source;
    status.textContent = mode === 'response' ? 'Field response acknowledged' : contact.status;
    transmission.textContent = selectContactLine(contact, mode, root.oohAlphaTransmissionIndex);

    if (mode === 'response') {
      frame.classList.add('is-contact-responding');
    }
    else {
      frame.classList.add('is-contact-locking');
    }
  }

  function resetRuntimeLoop(root) {
    var commandState = root.querySelector('[data-ooh-alpha-command-state]');
    var acknowledgement = root.querySelector('[data-ooh-alpha-command-ack]');
    var result = root.querySelector('[data-ooh-alpha-result]');
    var resultTitle = root.querySelector('[data-ooh-alpha-result-title]');
    var resultField = root.querySelector('[data-ooh-alpha-result-field]');
    var resultMark = root.querySelector('[data-ooh-alpha-result-mark]');
    var consequenceStatus = root.querySelector('[data-ooh-alpha-consequence-status]');
    var consequenceSummary = root.querySelector('[data-ooh-alpha-consequence-summary]');
    var mission = root.querySelector('[data-ooh-alpha-mission]');
    var missionTitle = root.querySelector('[data-ooh-alpha-mission-title]');
    var missionSource = root.querySelector('[data-ooh-alpha-mission-source]');
    var missionBrief = root.querySelector('[data-ooh-alpha-mission-brief]');
    var missionCycle = root.querySelector('[data-ooh-alpha-mission-cycle]');

    root.oohAlphaRuntimeState = null;
    root.oohAlphaOperationalPayload = null;
    root.oohAlphaSelectedActor = null;
    root.oohAlphaCommand = null;

    if (commandState) {
      commandState.textContent = 'DIRECTIVE CHANNEL IDLE';
    }
    if (acknowledgement) {
      acknowledgement.textContent = 'Awaiting directive.';
    }
    if (consequenceStatus) {
      consequenceStatus.textContent = 'Pending';
    }
    if (consequenceSummary) {
      consequenceSummary.textContent = 'Outcome report pending.';
    }
    if (result) {
      result.hidden = true;
      result.removeAttribute('data-result-field');
      result.classList.remove('is-result-updated');
    }
    if (resultTitle) {
      resultTitle.textContent = 'Outcome pending';
    }
    if (resultField) {
      resultField.textContent = 'FIELD STATUS: unresolved';
    }
    if (resultMark) {
      resultMark.textContent = 'MARK RESPONSE: awaiting action.';
    }
    if (mission) {
      mission.hidden = true;
      mission.removeAttribute('data-mission-source');
      mission.classList.remove('is-mission-updated');
    }
    if (missionTitle) {
      missionTitle.textContent = 'Mission seed pending';
    }
    if (missionSource) {
      missionSource.textContent = 'MISSION SOURCE: unresolved';
    }
    if (missionBrief) {
      missionBrief.textContent = 'Awaiting operational situation.';
    }
    if (missionCycle) {
      missionCycle.textContent = 'BATTLEFIELD PRESENCE BUILDING';
      missionCycle.disabled = true;
      missionCycle.classList.remove('is-presence-ready', 'is-presence-locked');
    }
    root.querySelectorAll('[data-ooh-alpha-presence-choice-matrix]').forEach(function (matrix) {
      matrix.hidden = true;
      matrix.innerHTML = '';
    });

    root.querySelectorAll('[data-ooh-alpha-command]').forEach(function (button) {
      button.disabled = false;
      button.classList.remove('is-command-active');
      button.removeAttribute('aria-pressed');
    });
  }

  var oa206OpeningRounds = [
    {
      title: 'B-STORY / CONTACT THREAD',
      brief: 'The first human cost enters the channel. Lock who the field protects before pressure starts moving.',
      choices: [
        { label: 'PROTECT THE ASSET', force: 1, exposure: 0, clarity: 0, stability: 1, presence: 1, team: 1, consequence: 'The asset stays covered and the corridor accepts a quiet handoff.', hook: 'The user is choosing protection over speed; the next pressure will test patience.' },
        { label: 'FOLLOW THE OPPOSING SIGNAL', force: 1, exposure: 1, clarity: 2, stability: -1, presence: 0, team: 0, consequence: 'The hostile trace becomes readable, but the subject has to move closer to the heat.', hook: 'Clarity rises while exposure starts to matter.' },
        { label: 'HOLD THE CORRIDOR', force: 0, exposure: -1, clarity: 1, stability: 1, presence: 0, team: 0, consequence: 'The corridor quiets long enough to hear the shape of the threat.', hook: 'The path slows down, but the field stops drifting.' }
      ]
    },
    {
      title: 'PRESSURE SHIFT',
      brief: 'The opposing force changes cadence. Pick how the team answers without turning the route into a beacon.',
      choices: [
        { label: 'GATHER INTEL', force: 0, exposure: 0, clarity: 2, stability: 0, presence: 1, team: 0, consequence: 'A clean read comes through the static and narrows the next choice.', hook: 'The moment becomes less blind, but pressure is still climbing.' },
        { label: 'MOVE THE TEAM', force: 2, exposure: 1, clarity: 0, stability: -1, presence: 1, team: 0, consequence: 'The team gains ground before the hostile sweep can settle.', hook: 'Momentum improves, but the route gets louder.' },
        { label: 'DELAY AND LISTEN', force: 0, exposure: -1, clarity: 1, stability: 1, presence: 0, team: 1, consequence: 'The team holds breath while the signal reveals a second pressure line.', hook: 'The right silence buys stability.' }
      ]
    },
    {
      title: 'BAD GUYS CLOSE IN',
      brief: 'The field is no longer neutral. Choose the shape of the counter-move.',
      choices: [
        { label: 'COUNTER-PRESSURE', force: 2, exposure: 1, clarity: 0, stability: 0, presence: 1, team: -1, consequence: 'The hostile line bends, but the team absorbs the shock.', hook: 'Force works, and it costs something.' },
        { label: 'DIVERT ATTENTION', force: 1, exposure: -1, clarity: -1, stability: 1, presence: 1, team: 0, consequence: 'The enemy follows the wrong mark and the route gets one clean breath.', hook: 'The field is safer, but less certain.' },
        { label: 'BURN THE MARKER', force: 3, exposure: 2, clarity: 1, stability: -2, presence: 0, team: -1, consequence: 'The marker dies bright and buys time at a visible cost.', hook: 'This creates a hard advantage and a dangerous trail.' }
      ]
    },
    {
      title: 'BREAK INTO FIELD',
      brief: 'The opening path has to become real. Lock the route that will carry the operation into the Battlefield Suite.',
      choices: [
        { label: 'COMMIT ROUTE', force: 1, exposure: 0, clarity: 1, stability: 2, presence: 1, team: 0, consequence: 'The route locks with enough structure to carry the first field push.', hook: 'The suite can open because the path finally has shape.' },
        { label: 'SPLIT SIGNAL', force: 1, exposure: -1, clarity: -1, stability: 1, presence: 2, team: 0, consequence: 'Two signals divide hostile attention and leave the team moving under cover.', hook: 'Presence rises while clarity becomes something to manage.' },
        { label: 'FORCE EXTRACTION WINDOW', force: 3, exposure: 2, clarity: 0, stability: -1, presence: 1, team: -1, consequence: 'An extraction window appears early, unstable but usable.', hook: 'The field opens fast; now the operation has to survive its own speed.' }
      ]
    }
  ];

  var oa206StoryBeats = [
    { title: 'B-STORY / HUMAN COST', brief: 'The subject becomes more than an asset marker. Their risk is now the center of the operation.', choices: [
      { label: 'COVER THE CIVILIANS', force: 0, exposure: 0, clarity: 1, stability: 1, presence: 1, team: 1, consequence: 'Civilian movement stays under cover and the team remembers why the route matters.', hook: 'The next threat will push against that restraint.' },
      { label: 'PRESS THE RELAY', force: 2, exposure: 1, clarity: 1, stability: -1, presence: 0, team: 0, consequence: 'The relay answers and gives up a useful pattern.', hook: 'The signal is clearer, and it is watching back.' },
      { label: 'KEEP THEM MOVING', force: 1, exposure: 1, clarity: 0, stability: 0, presence: 1, team: -1, consequence: 'The group gains distance before fear can settle in.', hook: 'Speed buys space, but the team starts to fray.' }
    ] },
    { title: 'OPERATIONAL CONTROL', brief: 'The system gives you leverage. Use it without letting the field learn your rhythm.', choices: [
      { label: 'THREAD FALSE TRAFFIC', force: 1, exposure: -1, clarity: 0, stability: 1, presence: 1, team: 0, consequence: 'False traffic pulls hostile attention away from the true route.', hook: 'The field is fooled for now.' },
      { label: 'RAISE FIELD PRESSURE', force: 2, exposure: 1, clarity: 0, stability: -1, presence: 1, team: 0, consequence: 'The operation pushes forward and forces a reaction.', hook: 'Control increases, and so does noise.' },
      { label: 'READ THE OUTPUT', force: 0, exposure: 0, clarity: 2, stability: 0, presence: 0, team: 0, consequence: 'The station returns a clean tactical read.', hook: 'The next choice can be sharper.' }
    ] },
    { title: 'BAD GUYS CLOSE IN', brief: 'The opposing force adapts. It is now answering choices instead of merely reacting.', choices: [
      { label: 'BREAK PURSUIT', force: 2, exposure: 1, clarity: 0, stability: 0, presence: 1, team: -1, consequence: 'The pursuit line fractures long enough to move.', hook: 'The team gets room, but contact leaves a mark.' },
      { label: 'KILL THE TRACE', force: 1, exposure: -1, clarity: -1, stability: 1, presence: 0, team: 0, consequence: 'The trace goes dark and takes some certainty with it.', hook: 'Safety improves in the absence of perfect information.' },
      { label: 'BAIT THE SWEEP', force: 2, exposure: 2, clarity: 1, stability: -1, presence: 1, team: 0, consequence: 'The hostile sweep commits to the wrong pressure lane.', hook: 'The trick works because it is visible.' }
    ] },
    { title: 'MIDPOINT REVERSAL', brief: 'The operation turns. The thing you were avoiding becomes the only available route.', choices: [
      { label: 'ACCEPT THE TURN', force: 1, exposure: 0, clarity: 1, stability: 1, presence: 1, team: 0, consequence: 'The team adjusts before the reversal breaks formation.', hook: 'Flexibility keeps the story alive.' },
      { label: 'OVERRIDE THE ROUTE', force: 3, exposure: 1, clarity: 0, stability: -2, presence: 1, team: -1, consequence: 'The route obeys, but the system strains under the override.', hook: 'Authority has a cost.' },
      { label: 'SEND A DECOY TEAM', force: 1, exposure: -1, clarity: -1, stability: 0, presence: 2, team: -1, consequence: 'The decoy carries the heat away from the subject.', hook: 'The right sacrifice buys a dangerous opening.' }
    ] },
    { title: 'PRESSURE COLLAPSE', brief: 'The route starts losing shape. Stop the collapse or ride it into a new path.', choices: [
      { label: 'BRACE THE ROUTE', force: 0, exposure: 0, clarity: 0, stability: 2, presence: 1, team: 1, consequence: 'The route holds under pressure and the team regains breath.', hook: 'Stability becomes the weapon.' },
      { label: 'PUNCH THROUGH', force: 3, exposure: 2, clarity: 0, stability: -1, presence: 1, team: -1, consequence: 'The team breaks through the collapsing edge.', hook: 'The move is clean only if the aftermath can be carried.' },
      { label: 'CUT POWER', force: 1, exposure: -1, clarity: -2, stability: 1, presence: 0, team: 0, consequence: 'The field goes dim and hostile targeting stutters.', hook: 'Darkness protects and obscures.' }
    ] },
    { title: 'DARK NIGHT OF THE SIGNAL', brief: 'The field stops giving easy answers. You must choose what still matters.', choices: [
      { label: 'HOLD THE HUMAN LINE', force: 0, exposure: 0, clarity: 1, stability: 1, presence: 1, team: 2, consequence: 'The team steadies because the operation remembers its human cost.', hook: 'Resolve returns without noise.' },
      { label: 'FOLLOW THE ONLY TRACE', force: 1, exposure: 1, clarity: 2, stability: -1, presence: 0, team: 0, consequence: 'The only trace points through danger and becomes usable.', hook: 'Truth arrives with a threat attached.' },
      { label: 'LOCK SILENCE', force: 0, exposure: -2, clarity: -1, stability: 1, presence: 0, team: 0, consequence: 'Silence hides the route while the field searches empty air.', hook: 'The quiet move keeps failure at distance.' }
    ] },
    { title: 'BREAK INTO THREE', brief: 'The answer forms from what survived. Combine the human thread, the route, and the pressure read.', choices: [
      { label: 'MERGE THE SIGNALS', force: 1, exposure: 0, clarity: 2, stability: 1, presence: 1, team: 0, consequence: 'The broken signals align into one workable plan.', hook: 'The operation finally has a complete shape.' },
      { label: 'TRUST THE TEAM', force: 0, exposure: 0, clarity: 0, stability: 1, presence: 1, team: 2, consequence: 'The team acts before the console can resolve every variable.', hook: 'Human judgment fills the gap.' },
      { label: 'FORCE THE WINDOW', force: 3, exposure: 2, clarity: 0, stability: -1, presence: 1, team: -1, consequence: 'The final window opens under pressure.', hook: 'The ending is reachable and volatile.' }
    ] },
    { title: 'FINALE PUSH', brief: 'The final move has to carry the subject through contact.', choices: [
      { label: 'EXTRACT CLEAN', force: 1, exposure: -1, clarity: 1, stability: 1, presence: 1, team: 1, consequence: 'The subject moves through the window with minimal trace.', hook: 'Control holds to the last practical second.' },
      { label: 'SHIELD THE TEAM', force: 0, exposure: 0, clarity: 0, stability: 1, presence: 1, team: 2, consequence: 'The team survives the push and keeps the route from becoming a grave.', hook: 'The win becomes human before it becomes tactical.' },
      { label: 'BREAK THE ENEMY LINE', force: 3, exposure: 1, clarity: 1, stability: -1, presence: 1, team: -1, consequence: 'The enemy line breaks and the field opens hard.', hook: 'Victory comes loud.' }
    ] },
    { title: 'FINAL IMAGE / AAR', brief: 'The operation closes. One final choice decides what the report remembers.', choices: [
      { label: 'PRESERVE THE ROUTE', force: 0, exposure: -1, clarity: 1, stability: 2, presence: 0, team: 0, consequence: 'The route survives for another operation.', hook: 'The final image is control without spectacle.' },
      { label: 'SAVE THE SUBJECT', force: 1, exposure: 0, clarity: 0, stability: 0, presence: 1, team: 2, consequence: 'The subject comes out alive and changed.', hook: 'The story lands on the cost of survival.' },
      { label: 'SEAL THE FIELD', force: 2, exposure: 1, clarity: 1, stability: 1, presence: 0, team: -1, consequence: 'The field seals behind the team and cuts off pursuit.', hook: 'The ending is decisive, but not free.' }
    ] }
  ];

  function oa206InitialStoryState() {
    return {
      mode: 'opening',
      openingIndex: 0,
      beatIndex: 0,
      pathLocked: false,
      result: 'PENDING',
      force: 3,
      exposure: 1,
      clarity: 3,
      routeStability: 5,
      presence: 1,
      teamCondition: 4,
      choices: [],
      currentSummary: 'Choose the first contact thread. The station is waiting for a path, not a diagnosis.'
    };
  }

  function oa206StatsText(state) {
    return 'Force ' + state.force + ' // Exposure ' + state.exposure + ' // Clarity ' + state.clarity + ' // Route Stability ' + state.routeStability + ' // Presence ' + state.presence + ' // Team ' + state.teamCondition;
  }

  function oa206StatGrid(state) {
    return '<div class="ooh-operation-alpha__story-stat-grid">' +
      '<span class="ooh-operation-alpha__story-stat">Force ' + state.force + '</span>' +
      '<span class="ooh-operation-alpha__story-stat">Exposure ' + state.exposure + '</span>' +
      '<span class="ooh-operation-alpha__story-stat">Clarity ' + state.clarity + '</span>' +
      '<span class="ooh-operation-alpha__story-stat">Route ' + state.routeStability + '</span>' +
      '<span class="ooh-operation-alpha__story-stat">Presence ' + state.presence + '</span>' +
      '<span class="ooh-operation-alpha__story-stat">Team ' + state.teamCondition + '</span>' +
    '</div>';
  }

  function oa206CurrentStage(state) {
    return state.pathLocked ? oa206StoryBeats[state.beatIndex] : oa206OpeningRounds[state.openingIndex];
  }

  function oa206ClampState(state) {
    state.force = clampRuntimeLevel(state.force, 0, 10);
    state.exposure = clampRuntimeLevel(state.exposure, 0, 10);
    state.clarity = clampRuntimeLevel(state.clarity, 0, 10);
    state.routeStability = clampRuntimeLevel(state.routeStability, 0, 10);
    state.presence = clampRuntimeLevel(state.presence, 0, 10);
    state.teamCondition = clampRuntimeLevel(state.teamCondition, 0, 10);
  }

  function oa206ResultForState(state) {
    var score = state.force + state.clarity + state.routeStability + state.presence + state.teamCondition - state.exposure;

    if (state.exposure >= 9 || state.routeStability <= 0 || state.teamCondition <= 0) {
      return 'FAILURE';
    }
    if (score >= 25 && state.routeStability >= 4 && state.teamCondition >= 3) {
      return 'SUCCESS';
    }
    if (score >= 17) {
      return 'PARTIAL';
    }

    return 'FAILURE';
  }

  function oa206Recap(state) {
    var first = state.choices[0] ? state.choices[0].label : 'No opening choice';
    var last = state.choices[state.choices.length - 1] ? state.choices[state.choices.length - 1].label : 'No final choice';

    return 'The operation opened on ' + first + ' and closed on ' + last + '. The route carried Force ' + state.force + ' against Exposure ' + state.exposure + ', with Clarity ' + state.clarity + ' and Route Stability ' + state.routeStability + ' deciding how much of the field survived. ' + (state.result === 'SUCCESS' ? 'The subject exits with the route intact.' : state.result === 'PARTIAL' ? 'The subject survives, but the report carries damage.' : 'The field overwhelms the route before the console can recover it.');
  }

  function oa206CriticalChoices(state) {
    return state.choices.slice(-5).map(function (choice) {
      return choice.stage + ': ' + choice.label;
    }).join(' // ') || 'No choices recorded.';
  }

  function setOa206Consequence(root, status, summary) {
    var consequenceStatus = root.querySelector('[data-ooh-alpha-consequence-status]');
    var consequenceSummary = root.querySelector('[data-ooh-alpha-consequence-summary]');
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');

    if (consequenceStatus) {
      consequenceStatus.textContent = status;
    }
    if (consequenceSummary) {
      consequenceSummary.textContent = summary;
    }
    if (reaction) {
      reaction.textContent = summary;
    }
  }

  function renderOa206Aar(root, state) {
    var title = root.querySelector('[data-ooh-alpha-scenario-title]');
    var situation = root.querySelector('[data-ooh-alpha-situation]');
    var interventions = root.querySelector('[data-ooh-alpha-interventions]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var result = root.querySelector('[data-ooh-alpha-result]');
    var resultTitle = root.querySelector('[data-ooh-alpha-result-title]');
    var resultField = root.querySelector('[data-ooh-alpha-result-field]');
    var resultMark = root.querySelector('[data-ooh-alpha-result-mark]');
    var mission = root.querySelector('[data-ooh-alpha-mission]');
    var missionTitle = root.querySelector('[data-ooh-alpha-mission-title]');
    var missionBrief = root.querySelector('[data-ooh-alpha-mission-brief]');
    var missionCycle = root.querySelector('[data-ooh-alpha-mission-cycle]');

    root.classList.add('is-oa206-aar');
    if (title) {
      title.textContent = 'FINAL IMAGE / AAR';
    }
    if (situation) {
      situation.innerHTML = '<p>Mission result: ' + state.result + '.</p><p>' + oa206Recap(state) + '</p>' + oa206StatGrid(state);
    }
    if (interventions) {
      interventions.innerHTML = '';
    }
    if (pressure) {
      pressure.textContent = 'AAR PENDING OUTCOME // ' + state.result;
    }
    if (result) {
      result.hidden = false;
    }
    if (resultTitle) {
      resultTitle.textContent = 'MISSION RESULT: ' + state.result;
    }
    if (resultField) {
      resultField.textContent = oa206StatsText(state);
    }
    if (resultMark) {
      resultMark.textContent = 'CRITICAL CHOICES: ' + oa206CriticalChoices(state) + ' // RECAP: ' + oa206Recap(state);
    }
    if (mission) {
      mission.hidden = false;
    }
    if (missionTitle) {
      missionTitle.textContent = 'AAR COMPLETE';
    }
    if (missionBrief) {
      missionBrief.textContent = 'Review the result, then run another operation when ready.';
    }
    if (missionCycle) {
      missionCycle.disabled = false;
      missionCycle.textContent = 'RUN ANOTHER OPERATION';
      missionCycle.classList.add('is-presence-ready');
    }
    setOa206Consequence(root, 'AAR PENDING OUTCOME', oa206Recap(state));
  }

  function renderOa206Stage(root) {
    var state = root.oohAlphaStoryState;
    var stage = state ? oa206CurrentStage(state) : null;
    var suite = root.querySelector('[data-ooh-alpha-battlefield-suite]');
    var title = root.querySelector('[data-ooh-alpha-scenario-title]');
    var situation = root.querySelector('[data-ooh-alpha-situation]');
    var interventions = root.querySelector('[data-ooh-alpha-interventions]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var mission = root.querySelector('[data-ooh-alpha-mission]');
    var missionTitle = root.querySelector('[data-ooh-alpha-mission-title]');
    var missionSource = root.querySelector('[data-ooh-alpha-mission-source]');
    var missionBrief = root.querySelector('[data-ooh-alpha-mission-brief]');
    var missionCycle = root.querySelector('[data-ooh-alpha-mission-cycle]');

    if (!state || !stage) {
      return;
    }
    if (state.result !== 'PENDING') {
      renderOa206Aar(root, state);
      return;
    }

    root.classList.add('is-field-active');
    root.classList.toggle('is-oa206-path-locked', state.pathLocked);
    if (suite) {
      suite.classList.toggle('is-suite-available', state.pathLocked);
    }
    if (title) {
      title.textContent = state.pathLocked ? 'BATTLEFIELD OPERATIONS STATION // ' + stage.title : 'OPENING PATH LOCK ' + (state.openingIndex + 1) + '/4 // ' + stage.title;
    }
    if (situation) {
      situation.innerHTML = '<p>' + stage.brief + '</p><p>' + state.currentSummary + '</p>' + oa206StatGrid(state);
    }
    if (pressure) {
      pressure.textContent = state.pathLocked ? 'FIELD SUITE AVAILABLE // STEP ' + (state.beatIndex + 1) + '/' + oa206StoryBeats.length : 'PATH LOCKING // ROUND ' + (state.openingIndex + 1) + '/4';
    }
    if (mission) {
      mission.hidden = false;
    }
    if (missionTitle) {
      missionTitle.textContent = state.pathLocked ? 'PATH LOCKED' : 'OPENING PATH NOT LOCKED';
    }
    if (missionSource) {
      missionSource.textContent = state.pathLocked ? 'FIELD SUITE AVAILABLE' : 'OPERATIONS STATION PRIMARY';
    }
    if (missionBrief) {
      missionBrief.textContent = state.pathLocked ? 'PATH LOCKED // FIELD SUITE AVAILABLE // AAR PENDING OUTCOME' : 'Complete four opening decisions to open the Battlefield Suite.';
    }
    if (missionCycle) {
      missionCycle.disabled = true;
      missionCycle.textContent = state.pathLocked ? 'FIELD SUITE AVAILABLE' : 'PATH LOCK IN PROGRESS';
      missionCycle.classList.toggle('is-presence-locked', state.pathLocked);
    }
    if (interventions) {
      interventions.innerHTML = '';
      stage.choices.forEach(function (choice, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ooh-operation-alpha__intervention';
        button.textContent = choice.label;
        button.setAttribute('data-ooh-alpha-story-choice', String(index));
        button.addEventListener('click', function () {
          applyOa206Choice(root, index);
        });
        interventions.appendChild(button);
      });
    }

    setBattlefieldPresence(root, {
      field: state.pathLocked ? 'PATH LOCKED // FIELD SUITE AVAILABLE' : 'Opening path lock in progress.',
      movement: state.choices.length ? 'Last choice: ' + state.choices[state.choices.length - 1].label : 'Awaiting first story choice.',
      signal: oa206StatsText(state)
    });
    setOa206Consequence(root, state.pathLocked ? 'FIELD SUITE AVAILABLE' : 'PATH LOCK ' + (state.openingIndex + 1) + '/4', state.currentSummary);
  }

  function applyOa206Choice(root, index) {
    var state = root.oohAlphaStoryState;
    var stage = state ? oa206CurrentStage(state) : null;
    var choice = stage && stage.choices[index] ? stage.choices[index] : null;

    if (!state || !choice || state.result !== 'PENDING') {
      return;
    }

    state.force += choice.force;
    state.exposure += choice.exposure;
    state.clarity += choice.clarity;
    state.routeStability += choice.stability;
    state.presence += choice.presence;
    state.teamCondition += choice.team;
    oa206ClampState(state);
    state.choices.push({
      stage: stage.title,
      label: choice.label,
      consequence: choice.consequence
    });
    state.currentSummary = choice.consequence + ' ' + choice.hook + ' Next pressure: ' + (state.pathLocked ? 'the field answers this decision.' : 'the opening route tightens.');

    if (state.exposure >= 9 || state.routeStability <= 0 || state.teamCondition <= 0) {
      state.result = 'FAILURE';
      state.currentSummary = choice.consequence + ' The route fails under exposure before the operation can recover.';
      renderOa206Stage(root);
      return;
    }

    if (!state.pathLocked) {
      state.openingIndex++;
      if (state.openingIndex >= oa206OpeningRounds.length) {
        state.pathLocked = true;
        state.mode = 'story';
        state.beatIndex = 0;
        state.currentSummary = 'PATH LOCKED. FIELD SUITE AVAILABLE. AAR PENDING OUTCOME.';
      }
      renderOa206Stage(root);
      return;
    }

    state.beatIndex++;
    if (state.beatIndex >= oa206StoryBeats.length) {
      state.result = oa206ResultForState(state);
    }
    renderOa206Stage(root);
  }

  function resetOa206Operation(root) {
    resetRuntimeLoop(root);
    root.oohAlphaStoryState = oa206InitialStoryState();
    root.classList.remove('is-oa206-aar');
    renderOa206Stage(root);
  }

  function applyOa206CommandShortcut(root, commandKey) {
    var map = {
      hold: 0,
      advance: 1,
      extract: 2,
      signal: 0,
      divert: 1
    };

    if (!root.oohAlphaStoryState || root.oohAlphaStoryState.result !== 'PENDING') {
      return false;
    }
    applyOa206Choice(root, map[commandKey] || 0);
    return true;
  }

  function activateOperationAlphaRuntime(root) {
    var runtimeCopy = root.querySelector('[data-ooh-alpha-runtime-copy]');
    var activationStatus = root.querySelector('[data-ooh-alpha-activation-status]');
    var activationButton = root.querySelector('[data-ooh-alpha-activate]');
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var contact = root.querySelector('[data-ooh-alpha-contact]');

    root.classList.add('is-runtime-acknowledged');
    resetRuntimeLoop(root);

    if (runtimeCopy) {
      runtimeCopy.textContent = 'Runtime shell active.';
    }
    if (activationStatus) {
      activationStatus.textContent = 'Acknowledgment received. Field pressure entering first mark.';
    }
    if (activationButton) {
      activationButton.disabled = true;
      activationButton.textContent = 'FIELD INITIALIZED';
    }
    if (reaction) {
      reaction.textContent = 'Unseen hand recognized. Choose a staged field influence.';
    }
    if (contact) {
      contact.hidden = false;
    }

    renderContact(root, 0, 'activation');
    setAtmosphere(root, 0);
    selectOperationAlphaActor(root);
    root.oohAlphaStoryState = oa206InitialStoryState();
    renderOa206Stage(root);
  }

  function setInterventionsDisabled(root, disabled) {
    root.querySelectorAll('.ooh-operation-alpha__intervention').forEach(function (button) {
      button.disabled = disabled;
    });
  }

  function triggerIntervention(root, scenario, buttonIndex) {
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var nextContactIndex;
    var nextAtmosphereIndex;

    root.oohAlphaInteractionCount = (root.oohAlphaInteractionCount || 0) + 1;
    root.oohAlphaTransmissionIndex = root.oohAlphaInteractionCount + buttonIndex;
    nextContactIndex = root.oohAlphaInteractionCount % contactSlots.length;
    nextAtmosphereIndex = root.oohAlphaInteractionCount % atmosphereStates.length;

    if (reaction) {
      reaction.textContent = scenario.reactions[buttonIndex] || scenario.reactions[0];
    }
    if (pressure) {
      pressure.textContent = 'FIELD RESPONSE RECORDED';
    }
    renderContact(root, nextContactIndex, 'response');
    renderMission(root, nextContactIndex, root.oohAlphaInteractionCount + buttonIndex);
    renderConsequence(root, nextContactIndex, buttonIndex);
    setAtmosphere(root, nextAtmosphereIndex);
    applyFieldPressure(root, buttonIndex);

    window.clearTimeout(root.oohAlphaScenarioTimer);
  }

  function initOperationAlphaGate(root) {
    var intro = root.querySelector('[data-ooh-operation-alpha-intro]');
    var enter = root.querySelector('[data-ooh-operation-alpha-enter]');
    var activationButton = root.querySelector('[data-ooh-alpha-activate]');
    var missionCycle = root.querySelector('[data-ooh-alpha-mission-cycle]');
    var signalLinks = root.querySelectorAll('a.ooh-operation-alpha__access-button, a.ooh-operation-alpha__runtime-button');
    var shell = root.querySelector('[data-ooh-operation-alpha-control]');
    var title = root.querySelector('.ooh-operation-alpha__title');
    var battlefieldLabelMap = {
      'FIELD CONDITIONS': 'CURRENT SITUATION',
      'ASSET MOVEMENT': 'RONIN STATUS',
      'SIGNAL PRESSURE': 'THREAT REPORT',
      'ASSET MOVEMENT FEED': 'FIELD REPORT'
    };
    var commandLabelMap = {
      hold: 'WAIT',
      advance: 'TAKE A RISK',
      extract: 'GET THEM OUT',
      signal: 'GATHER INTEL',
      divert: 'CHANGE THE PLAN'
    };
    var directorLabelMap = {
      observe: 'GATHER INTEL',
      'hold-channel': 'WAIT',
      'escalate-pressure': 'TAKE A RISK',
      'divert-asset': 'CHANGE THE PLAN',
      'authorize-extraction': 'GET THEM OUT'
    };

    initActorRegistry(root);
    initSignalModal(root);
    if (shell && !root.querySelector('[data-ooh-alpha-runtime-version]')) {
      var version = document.createElement('p');
      version.className = 'ooh-operation-alpha__copy';
      version.setAttribute('data-ooh-alpha-runtime-version', '');
      version.textContent = 'OA RUNTIME VERSION: OA-206 WIDESCREEN STORY CHECK';
      if (title && title.parentNode === shell) {
        shell.insertBefore(version, title.nextSibling);
      }
      else {
        shell.insertBefore(version, shell.firstChild);
      }
    }
    signalLinks.forEach(function (link) {
      if ((link.textContent || '').trim() === ['ENTER', 'ACTIVE', 'RUNTIME'].join(' ')) {
        link.textContent = 'CHANGE SIGNAL';
        link.setAttribute('aria-label', 'Change Operation Alpha audio signal');
      }
    });
    root.querySelectorAll('[data-ooh-alpha-command]').forEach(function (button) {
      var key = button.getAttribute('data-ooh-alpha-command');
      if (commandLabelMap[key]) {
        button.textContent = commandLabelMap[key];
      }
    });
    root.querySelectorAll('[data-ooh-alpha-director-action]').forEach(function (button) {
      var key = button.getAttribute('data-ooh-alpha-director-action');
      if (directorLabelMap[key]) {
        button.textContent = directorLabelMap[key];
      }
    });
    root.querySelectorAll('.ooh-operation-alpha__battlefield-label, .ooh-operation-alpha__movement-kicker').forEach(function (label) {
      var text = (label.textContent || '').trim();
      if (battlefieldLabelMap[text]) {
        label.textContent = battlefieldLabelMap[text];
      }
    });

    if (intro && enter) {
      if (storageFlagSeen()) {
        hideIntro(intro);
        showSignalModal(root);
      }
      else {
        enter.addEventListener('click', function () {
          storeSeenFlag();
          hideIntro(intro);
          showSignalModal(root);
        });
      }
    }
    else {
      showSignalModal(root);
    }

    if (activationButton) {
      activationButton.addEventListener('click', function () {
        activateOperationAlphaRuntime(root);
      });
    }
    initCommandConsole(root);
    initDirectorLayer(root);
    if (missionCycle) {
      missionCycle.addEventListener('click', function () {
        if (root.oohAlphaStoryState && root.oohAlphaStoryState.result !== 'PENDING') {
          resetOa206Operation(root);
          return;
        }
        lockBattlefieldPresence(root);
      });
    }
  }

  function storePlaylistSelection(slug, title, spotifyUrl, moodTags) {
    try {
      window.localStorage.setItem(playlistStorageKey, JSON.stringify({
        slug: slug,
        title: title,
        spotifyUrl: spotifyUrl,
        moodTags: moodTags
      }));
    }
    catch (e) {}
  }

  function getPlaylistSelection() {
    try {
      var stored = window.localStorage.getItem(playlistStorageKey);

      return stored ? JSON.parse(stored) : null;
    }
    catch (e) {
      return null;
    }
  }

  function routePath(path) {
    var routedLink = document.querySelector('[href$="' + path + '"]');

    if (routedLink) {
      return routedLink.getAttribute('href');
    }

    var currentPath = window.location.pathname || '';
    var basePath = currentPath.replace(/\/(?:operation-alpha(?:\/oaplay(?:\/playlists)?)?|oaplaylists|oaplay(?:\/playlists)?)\/?$/, '');

    return (basePath || '') + path;
  }

  function operationAlphaPlaylistsPath() {
    return routePath('/operation-alpha/oaplay/playlists');
  }

  function setActivePlaylist(root, slug, title, spotifyUrl, moodTags) {
    var confirmation = root.querySelector('[data-ooh-alpha-playlist-confirmation]');
    var handoff = root.querySelector('[data-ooh-alpha-runtime-handoff]');
    var handoffTitle = root.querySelector('[data-ooh-alpha-runtime-title]');
    var handoffCopy = root.querySelector('[data-ooh-alpha-runtime-copy]');
    var channelLink = root.querySelector('[data-ooh-alpha-playlist-channel-link]');
    var channel = channelBySlug(slug) || channelByLabel(title);
    var resolvedUrl = spotifyUrl || (channel ? channel.spotifyUrl : '');
    var resolvedMood = moodTags || (channel ? channel.moodTags : '');
    var selectedButton = null;

    root.querySelectorAll('[data-ooh-alpha-playlist-card]').forEach(function (playlistCard) {
      playlistCard.classList.remove('is-selected');
    });

    root.querySelectorAll('[data-ooh-alpha-playlist-select]').forEach(function (selectButton) {
      selectButton.textContent = 'SELECT SIGNAL';
      selectButton.removeAttribute('aria-pressed');

      if (selectButton.getAttribute('data-playlist-slug') === slug) {
        selectedButton = selectButton;
      }
    });

    if (selectedButton) {
      var card = selectedButton.closest('[data-ooh-alpha-playlist-card]');

      if (card) {
        card.classList.add('is-selected');
      }

      selectedButton.textContent = 'SIGNAL SELECTED';
      selectedButton.setAttribute('aria-pressed', 'true');
    }

    if (confirmation) {
      confirmation.textContent = title + ' selected. Runtime handoff pending.';
    }

    if (handoff) {
      handoff.hidden = false;
    }
    if (handoffTitle) {
      handoffTitle.textContent = title;
    }
    if (handoffCopy) {
      handoffCopy.textContent = resolvedMood ? resolvedMood + '. Runtime handoff pending.' : 'Signal selected. Runtime handoff pending.';
    }
    if (channelLink && resolvedUrl) {
      channelLink.href = resolvedUrl;
      channelLink.textContent = 'CHOOSE SIGNAL';
      channelLink.setAttribute('target', '_blank');
      channelLink.setAttribute('rel', 'noopener noreferrer');
      channelLink.removeAttribute('aria-disabled');
      channelLink.hidden = false;
      channelLink.setAttribute('aria-label', 'Open ' + title + ' signal channel on Spotify');
    }
    else if (channelLink) {
      channelLink.removeAttribute('href');
      channelLink.removeAttribute('target');
      channelLink.setAttribute('aria-disabled', 'true');
      channelLink.textContent = 'CHANNEL OFFLINE';
      channelLink.hidden = false;
    }
  }

  function initPlaylistShell(root) {
    var proceed = root.querySelector('[data-ooh-alpha-runtime-proceed]');
    var storedSelection = getPlaylistSelection();

    if (storedSelection && storedSelection.slug && storedSelection.title) {
      setActivePlaylist(root, storedSelection.slug, storedSelection.title, storedSelection.spotifyUrl, storedSelection.moodTags);
    }

    root.querySelectorAll('[data-ooh-alpha-playlist-select]').forEach(function (button) {
      button.addEventListener('click', function () {
        var slug = button.getAttribute('data-playlist-slug') || '';
        var title = button.getAttribute('data-playlist-title') || 'SELECTED SIGNAL';
        var spotifyUrl = button.getAttribute('data-playlist-url') || '';
        var channel = channelBySlug(slug) || channelByLabel(title);
        var moodTags = channel ? channel.moodTags : '';

        storePlaylistSelection(slug, title, spotifyUrl, moodTags);
        setActivePlaylist(root, slug, title, spotifyUrl, moodTags);
      });
    });

    if (proceed) {
      proceed.setAttribute('aria-label', 'Proceed to contained Operation Alpha runtime shell');
      proceed.setAttribute('href', routePath('/oaplay'));
    }
  }

  function initRuntimeShell(root) {
    var signal = root.querySelector('[data-ooh-alpha-runtime-signal]');
    var status = root.querySelector('[data-ooh-alpha-runtime-status]');
    var channelLink = root.querySelector('[data-ooh-alpha-runtime-channel-link]');
    var storedSelection = getPlaylistSelection();
    var storedChannel = storedSelection ? channelBySlug(storedSelection.slug) || channelByLabel(storedSelection.title) : null;
    var spotifyUrl = storedSelection && storedSelection.spotifyUrl ? storedSelection.spotifyUrl : (storedChannel ? storedChannel.spotifyUrl : '');
    var moodTags = storedSelection && storedSelection.moodTags ? storedSelection.moodTags : (storedChannel ? storedChannel.moodTags : '');

    if (storedSelection && storedSelection.title) {
      if (signal) {
        signal.textContent = storedSelection.title;
      }
      if (status) {
        status.textContent = moodTags ? moodTags + '. Runtime shell received local signal selection.' : 'Runtime shell received local signal selection. Gameplay authority pending.';
      }
      if (channelLink && spotifyUrl) {
        channelLink.href = spotifyUrl;
        channelLink.textContent = 'CHOOSE SIGNAL';
        channelLink.setAttribute('target', '_blank');
        channelLink.setAttribute('rel', 'noopener noreferrer');
        channelLink.removeAttribute('aria-disabled');
        channelLink.hidden = false;
        channelLink.setAttribute('aria-label', 'Open ' + storedSelection.title + ' signal channel on Spotify');
      }
      else if (channelLink) {
        channelLink.removeAttribute('href');
        channelLink.removeAttribute('target');
        channelLink.setAttribute('aria-disabled', 'true');
        channelLink.textContent = 'CHANNEL OFFLINE';
        channelLink.hidden = false;
      }
    }
    else if (status) {
      status.textContent = 'Runtime shell standing by. Select a signal before active runtime activation.';
    }
  }

  function initCreditsShell(root) {
    var confirmation = root.querySelector('[data-ooh-alpha-credit-confirmation]');

    root.querySelectorAll('[data-ooh-alpha-credit-select]').forEach(function (button) {
      button.addEventListener('click', function () {
        var card = button.closest('[data-ooh-alpha-credit-card]');
        var packageLabel = button.getAttribute('data-credit-package') || 'credit package';
        var packagePrice = button.getAttribute('data-credit-price') || '';
        var creditAmount = button.getAttribute('data-credit-amount') || '';

        root.querySelectorAll('[data-ooh-alpha-credit-card]').forEach(function (creditCard) {
          creditCard.classList.remove('is-selected');
        });

        root.querySelectorAll('[data-ooh-alpha-credit-select]').forEach(function (selectButton) {
          selectButton.textContent = 'SELECT';
          selectButton.removeAttribute('aria-pressed');
        });

        if (card) {
          card.classList.add('is-selected');
        }

        button.textContent = 'STAGED';
        button.setAttribute('aria-pressed', 'true');

        if (confirmation) {
          confirmation.textContent = 'CREDIT PACKAGE STAGED: ' + packageLabel.toUpperCase() + ' // ' + packagePrice + ' // ' + creditAmount.toUpperCase();
        }
      });
    });
  }

  function init() {
    if (document.body) {
      document.body.classList.add('ooh-operation-alpha-runtime');
    }

    document.querySelectorAll('[data-ooh-operation-alpha]').forEach(initOperationAlphaGate);
    document.querySelectorAll('[data-ooh-operation-alpha-playlists]').forEach(initPlaylistShell);
    document.querySelectorAll('[data-ooh-operation-alpha-runtime]').forEach(initRuntimeShell);
    document.querySelectorAll('[data-ooh-operation-alpha-credits]').forEach(initCreditsShell);
    document.querySelectorAll('[data-ooh-operation-alpha-operation]').forEach(renderOperationSurface);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
  else {
    init();
  }
})();
