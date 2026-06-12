(function () {
  'use strict';

  console.log('OA-211 Operation Alpha decision consequence runtime loaded');

  var storageKey = 'ooh_operation_alpha_intro_seen_v1';
  var sessionIntroSeenKey = 'ooh_operation_alpha_intro_seen_session_v1';
  var signalStorageKey = 'ooh_operation_alpha_signal_dismissed_v1';
  var playlistStorageKey = 'ooh_operation_alpha_playlist_selection_v1';
  var oaChainStateKey = 'ooh_operation_alpha_chain_state_v1';
  var operationAlphaRuntimePrefix = 'ooh_operation_alpha_';
  var introRequiredChoices = 3;
  var scenarioDelayMs = 1500;

  function removeOARuntimeStorageKeys(storage, keepPlaylist) {
    var keys = [];
    var index;
    var key;

    if (!storage) {
      return;
    }

    for (index = 0; index < storage.length; index += 1) {
      key = storage.key(index);
      if (key && key.indexOf(operationAlphaRuntimePrefix) === 0 && !(keepPlaylist && key === playlistStorageKey)) {
        keys.push(key);
      }
    }

    keys.forEach(function (runtimeKey) {
      storage.removeItem(runtimeKey);
    });
  }

  function resetOAIntroRunState(keepPlaylist) {
    try {
      removeOARuntimeStorageKeys(window.localStorage, keepPlaylist);
      removeOARuntimeStorageKeys(window.sessionStorage, keepPlaylist);

      window.localStorage.removeItem(oaChainStateKey);
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(signalStorageKey);

      if (!keepPlaylist) {
        window.localStorage.removeItem(playlistStorageKey);
      }
    }
    catch (e) {}
  }

  window.resetOAIntroRunState = resetOAIntroRunState;
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
      slug: 'system-reset',
      label: 'System Reset',
      playlistId: '0cZlbYVRnkxwViBJPw8oDR',
      spotifyUrl: 'https://open.spotify.com/playlist/0cZlbYVRnkxwViBJPw8oDR?si=b992c3418f104ec2',
      moodTags: 'Abandoned Systems • Collapse • Aftermath'
    }
  ];

  var runtimePlaylists = channelRegistry;

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
    'Channel Selected',
    'Field Initialized',
    'Primary Ronin Appears',
    'Genealord Appears',
    'Catalyst Event',
    'Directive Request',
    'Field Pressure',
    'Ally Introduced',
    'Enemy Movement',
    'Escalation Cascade',
    'Signal Failure',
    'Situation Report',
    'Final Contact',
    'Last Light',
    'Final Debrief'
  ];

  var runtimePhaseSpine = [
    {
      key: 'intro',
      label: 'PHASE 1 // SIGNAL ACQUISITION',
      requiredPressure: 1,
      beatStart: 0,
      beatEnd: 4
    },
    {
      key: 'character',
      label: 'PHASE 2 // FIELD PRESSURE',
      requiredPressure: 2,
      beatStart: 5,
      beatEnd: 9
    },
    {
      key: 'crisis',
      label: 'PHASE 3 // ESCALATION CASCADE',
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
    'Channel Selected',
    'Field Initialized',
    'Primary Ronin Appears',
    'Genealord Appears',
    'Catalyst Event',
    'Threat Escalation',
    'Directive Request',
    'Field Pressure',
    'Enemy Movement',
    'Escalation Cascade',
    'Signal Failure',
    'Situation Report',
    'Final Contact',
    'Last Light',
    'Final Debrief'
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
    intro: [
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
    character: [
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
    crisis: [
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
    character: [
      'A Ronin complication changes the route.',
      'Mutant escalation floods the corridor.',
      'The Genealord makes a counter-move.',
      'A hidden ally opens a brief side path.',
      'A false route begins calling back.'
    ],
    crisis: [
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

  // OPERATION ALPHA NARRATIVE RULE:
  // Keep story structure internal.
  // Never expose screenplay terminology directly.
  // Never present numbered beat worksheets.
  // Never require scrolling through raw story nodes.
  // The player experiences only signal acquisition, field pressure,
  // escalation, situation report, last light, and debrief.
  // The player is the Unseen Hand, Karma Controller, screenwriter,
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
      return window.localStorage.getItem(storageKey) === '1' || window.sessionStorage.getItem(sessionIntroSeenKey) === '1';
    }
    catch (e) {
      return false;
    }
  }

  function storeSeenFlag() {
    try {
      window.localStorage.setItem(storageKey, '1');
      window.sessionStorage.setItem(sessionIntroSeenKey, '1');
    }
    catch (e) {}
  }

  function shouldSuppressIntroOverlay() {
    var storedSelection = getPlaylistSelection();

    return storageFlagSeen() || !!(storedSelection && storedSelection.title);
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
        if (button.disabled) {
          return;
        }
        triggerIntervention(root, scenario, buttonIndex);
      });
      interventions.appendChild(button);
    });
    syncRuntimeControlLocks(root, root.oohAlphaRuntimeState);
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

  function actorLooksLikeImageReference(value) {
    return /\.(?:webp|png|jpe?g|gif|avif)(?:[?#].*)?$/i.test((value || '').trim()) || /[\\/]/.test((value || '').trim());
  }

  function actorPortraitValueToUrl(value) {
    var normalizedPortrait = (value || '').trim();

    if (!normalizedPortrait || !actorLooksLikeImageReference(normalizedPortrait)) {
      return '';
    }
    if (/^https?:\/\//i.test(normalizedPortrait)) {
      return normalizedPortrait;
    }

    normalizedPortrait = normalizedPortrait.replace(/\\/g, '/');
    normalizedPortrait = normalizedPortrait.replace(/^[a-z]:/i, '');
    normalizedPortrait = normalizedPortrait.replace(/^.*\/operation_alpha\//i, '/operation_alpha/');

    if (normalizedPortrait.charAt(0) === '/') {
      return operationAlphaRootPath(normalizedPortrait);
    }

    return operationAlphaRootPath('/operation_alpha/generated_actor_registry/portraits/' + normalizedPortrait);
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
    return actorPortraitValueToUrl(actor.portrait);
  }

  function actorOriginalFilePortraitUrl(actor) {
    return actorPortraitValueToUrl(actor.originalFile);
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
    if (actorOriginalFilePortraitUrl(actor)) {
      candidates.push(actorOriginalFilePortraitUrl(actor));
    }
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
    var name = actorDisplayName(actor);

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
    var actionButton = root.querySelector('[data-ooh-alpha-director-action="' + actionKey + '"]');
    var report = root.querySelector('[data-ooh-alpha-director-report]');
    var choice = root.querySelector('[data-ooh-alpha-director-choice]');
    var reaction = root.querySelector('[data-ooh-alpha-director-reaction]');
    var label = directorActionLabels[actionKey] || 'OBSERVE';

    if (!payload || !report || !choice || !reaction || (actionButton && actionButton.disabled)) {
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
        if (button.disabled) {
          return;
        }
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
      portrait.textContent = payload.portraitUrl ? 'PORTRAIT: LOADED' : 'PORTRAIT: PENDING';
      portrait.setAttribute('title', payload.portraitUrl ? 'Portrait loaded' : 'Portrait pending');
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
      channelLink.href = routePath('/operation-alpha/oaplay/playlists');
      channelLink.textContent = 'SELECT SIGNAL';
      channelLink.removeAttribute('target');
      channelLink.removeAttribute('rel');
      channelLink.removeAttribute('aria-disabled');
      channelLink.hidden = false;
      channelLink.setAttribute('aria-label', 'Select Operation Alpha signal');
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
      consequenceSummary.textContent = payload.consequence.summary;
    }
    if (narrativeCopy) {
      narrativeCopy.textContent = root.oohAlphaRuntimeState && root.oohAlphaRuntimeState.scene ? 'SUBJECT: ' + root.oohAlphaRuntimeState.scene.subject + ' // OPPOSING FORCE: ' + root.oohAlphaRuntimeState.scene.opposingForce + ' // FORCE MULTIPLIER: ' + root.oohAlphaRuntimeState.scene.forceMultiplier + ' // CATALYST: ' + root.oohAlphaRuntimeState.scene.catalyst : payload.narrativeSeed;
    }
    if (root.oohAlphaRuntimeState) {
      renderIntroStoryBlock(root, root.oohAlphaRuntimeState);
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
      return;
    }

    var eligibleActors = (root.oohAlphaActorRegistry || []).filter(function (actor) {
      return actorMissionUsage(actor, 'Operation Alpha');
    });
    var roninActors = (root.oohAlphaActorRegistry || []).filter(function (actor) {
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
    var portraitLabel = actor && actor.portrait && !actorLooksLikeImageReference(actor.portrait) ? actor.portrait : '';

    return actor && (portraitLabel || actor.name) ? (portraitLabel || actor.name) : 'Unknown subject';
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


  function registryActorsByFaction(registry, faction, exceptActor) {
    return (registry || []).filter(function (candidate) {
      var sameName = actorDisplayName(candidate) === actorDisplayName(exceptActor);

      return !sameName && (candidate.faction || '').toLowerCase() === faction;
    });
  }

  function pickRegistryActor(registry, faction, exceptActor) {
    var matches = registryActorsByFaction(registry, faction, exceptActor);

    return matches.length ? runtimePick(matches) : null;
  }

  function storyCastFallback(label, name, faction, role) {
    return {
      storyLabel: label,
      name: name,
      portrait: name,
      faction: faction,
      role: role,
      path: 'Unresolved'
    };
  }

  function buildStoryCast(actor, registry) {
    var protagonist = actor && (actor.faction || '').toLowerCase() === 'ronin' ? actor : pickRegistryActor(registry, 'ronin', actor);
    var ally = protagonist || storyCastFallback('ALLY', 'Ronin courier', 'Ronin', 'route asset');
    var opposition = pickRegistryActor(registry, 'genealord', actor) || storyCastFallback('OPPOSITION', 'Genealord command voice', 'Genealord', 'pressure authority');
    var thirdForce = pickRegistryActor(registry, 'mutant', actor) || storyCastFallback('THIRD FORCE', 'Mutant pressure cell', 'Mutant', 'corridor disruptor');

    return {
      actor: protagonist || actor || storyCastFallback('ACTOR', 'Unknown actor', 'Unresolved', 'field subject'),
      ally: ally,
      opposition: opposition,
      thirdForce: thirdForce,
      cell: [ally, opposition, thirdForce]
    };
  }

  function storyCastName(actor) {
    return actorDisplayName(actor || {}) || 'Unknown actor';
  }

  function storyCastRole(actor) {
    return [actor && actor.faction, actor && actor.role].filter(Boolean).join(' / ') || 'field presence';
  }

  function storyBlockLabel(state) {
    if (!state || state.outcomeState !== 'PENDING') {
      return 'BLOCK 4 // FINAL AAR POPUP';
    }

    return runtimeVisiblePhase(state);
  }

  function storyEventCardCopy(state, slot) {
    var cast = state.storyCast || {};
    var scene = state.scene || {};
    var names = {
      actor: storyCastName(cast.actor),
      ally: storyCastName(cast.ally),
      opposition: storyCastName(cast.opposition),
      thirdForce: storyCastName(cast.thirdForce)
    };
    var lines = {
      actor: names.actor + ' carries ' + (scene.mission ? scene.mission.label : 'the operation') + ' through ' + (state.currentCondition || 'unstable signal') + '.',
      ally: names.ally + ' enters through a side route and gives the Unseen Hand a human stake.',
      opposition: names.opposition + ' answers the player action with command pressure.',
      thirdForce: names.thirdForce + ' shifts the corridor and makes the next choice costlier.'
    };

    return lines[slot] || 'The field records a new memory hook.';
  }

  function eventCardPortrait(actor) {
    var candidates = actorPortraitCandidates(actor || {});

    return candidates[0] || '';
  }

  function setIntroStoryImage(root, selector, actor) {
    var image = root.querySelector(selector);
    var portrait = eventCardPortrait(actor);

    if (!image) {
      return;
    }
    if (portrait) {
      image.src = portrait;
      image.hidden = false;
    }
    else {
      image.hidden = true;
    }
  }

  function setIntroStoryText(root, prefix, actor) {
    var name = root.querySelector('[data-ooh-alpha-intro-' + prefix + '-name]');
    var path = root.querySelector('[data-ooh-alpha-intro-' + prefix + '-path]');
    var faction = root.querySelector('[data-ooh-alpha-intro-' + prefix + '-faction]');
    var role = root.querySelector('[data-ooh-alpha-intro-' + prefix + '-role]');
    var style = root.querySelector('[data-ooh-alpha-intro-' + prefix + '-style]');

    if (name) {
      name.textContent = storyCastName(actor);
    }
    if (path) {
      path.textContent = 'PATH: ' + (actor && actor.path ? actor.path : 'unresolved');
    }
    if (faction) {
      faction.textContent = 'FACTION: ' + (actor && actor.faction ? actor.faction : 'unresolved');
    }
    if (role) {
      role.textContent = 'ROLE: ' + (actor && actor.role ? actor.role : 'unresolved');
    }
    if (style) {
      style.textContent = 'TRANSMISSION: ' + (actor && actor.transmissionStyle ? actor.transmissionStyle : 'unresolved');
    }
  }

  function defaultOAChainState() {
    return {
      pressure: 0,
      trust: 0,
      enemyAwareness: 0,
      signalIntegrity: 100,
      chain: [],
      introChoices: [],
      level1Choices: [],
      level2Choices: [],
      level4Choices: [],
      activePortrait: '',
      activeIdentity: null,
      narrativeSelections: {},
      narrativeTokens: {},
      finalDecision: null
    };
  }

  function readOAChainState() {
    try {
      return Object.assign(defaultOAChainState(), JSON.parse(window.localStorage.getItem(oaChainStateKey) || '{}'));
    }
    catch (e) {
      return defaultOAChainState();
    }
  }

  function writeOAChainState(state) {
    window.localStorage.setItem(oaChainStateKey, JSON.stringify(state));
  }

  function narrativeLibrarySection(sectionName) {
    var library = window.OA_NARRATIVE_LIBRARY || {};
    return Array.isArray(library[sectionName]) ? library[sectionName] : [];
  }

  function operationSeed(state) {
    var source = [state && state.runId, state && state.currentCondition, state && state.mission && state.mission.label].filter(Boolean).join('|') || 'operation-alpha';
    return source.split('').reduce(function (sum, character) {
      return sum + character.charCodeAt(0);
    }, 0);
  }

  function narrativeEntry(state, key, sectionName, offset) {
    var section = narrativeLibrarySection(sectionName);
    var storedId = state.narrativeSelections && state.narrativeSelections[key];
    var stored = section.filter(function (entry) { return entry.id === storedId; })[0];
    var selected;

    if (!section.length) {
      return null;
    }
    if (stored) {
      return stored;
    }
    state.narrativeSelections = state.narrativeSelections || {};
    selected = section[(operationSeed(state) + (offset || 0)) % section.length];
    state.narrativeSelections[key] = selected.id;
    return selected;
  }

  function narrativeTokenValue(tokens, key, fallback) {
    return tokens && tokens[key] ? tokens[key] : fallback;
  }

  function fillNarrativeText(text, tokens) {
    var safeTokens = tokens || {};
    var fallback = {
      ronin: 'the Ronin',
      genealord: 'the Genealord',
      mutant: 'mutant pressure',
      ally: 'the ally',
      enemy: 'the enemy',
      thirdForce: 'the third force',
      route: 'the route',
      signal: 'the signal',
      mission: 'the mission',
      cost: 'the cost',
      injury: 'field injury',
      loss: 'the loss',
      gain: 'the gain'
    };

    return (text || '').replace(/\{\{(\w+)\}\}/g, function (match, key) {
      return narrativeTokenValue(safeTokens, key, fallback[key] || 'the field');
    });
  }

  function buildNarrativeTokens(state, cast, scene, storedSelection) {
    var missionLabel = state && state.mission && state.mission.label ? state.mission.label : 'the mission';

    return {
      ronin: storyCastName((cast && (cast.actor || cast.ally)) || {}),
      genealord: storyCastName(cast && cast.opposition),
      mutant: storyCastName(cast && cast.thirdForce),
      ally: storyCastName(cast && cast.ally),
      enemy: storyCastName(cast && cast.opposition),
      thirdForce: storyCastName(cast && cast.thirdForce),
      route: scene && scene.route ? scene.route : 'the relay corridor',
      signal: storedSelection && storedSelection.title ? storedSelection.title : 'the active signal',
      mission: missionLabel,
      cost: 'operational cost',
      injury: 'field injury',
      loss: 'route loss',
      gain: 'route knowledge'
    };
  }

  function appendOAChainEvent(state, event) {
    state.chain = (state.chain || []).filter(function (item) {
      return item.id !== event.id;
    });
    state.chain.push(event);
    writeOAChainState(state);
  }

  function introBeatCards(cast, scene) {
    var protagonist = storyCastName(cast.actor || cast.ally);
    var antagonist = storyCastName(cast.opposition);
    var thirdForce = storyCastName(cast.thirdForce);
    var fieldPressure = scene.fieldPressure || 'The route remains open, but only if pressure is managed.';

    return [
      {
        id: 'intro-investigate-insult',
        title: 'INVESTIGATE THE INSULT',
        situation: antagonist + ' treats the Ronin interference as a personal humiliation.',
        directive: 'Trace why the insult matters before the field hardens.',
        risk: 'Investigation buys clarity while the corridor clock keeps closing.',
        action: 'Investigated the insult behind the Genealord response.',
        reaction: antagonist + ' commits a quieter observer to the relay corridor.',
        consequence: protagonist + ' gains context, but the enemy realizes the Unseen Hand is listening.',
        carry: 'Enemy awareness increased; rivalry clarified.',
        narrative: antagonist + ' does not read the interference as random static. The Genealord marks it as an insult against command authority, and ' + protagonist + ' is now tied to that humiliation. The mission gains a reason to matter, but the next contact will be personal.',
        pressure: 1,
        trust: 1,
        awareness: 1,
        signal: -1
      },
      {
        id: 'intro-verify-ronin',
        title: 'VERIFY THE RONIN SIGNAL',
        situation: protagonist + ' reaches the relay station under broken signal cover.',
        directive: 'Confirm the Ronin is real before committing the field.',
        risk: 'Verification protects the mission from a false mark but costs time.',
        action: 'Verified the Ronin signal.',
        reaction: protagonist + ' answers with a wounded authentication phrase.',
        consequence: 'The Ronin remains viable and the operation has a human stake.',
        carry: 'Trust increased; time pressure tightened.',
        narrative: protagonist + ' is alive, but the channel carries pain through every burst. Verification prevents a false rescue, and it also confirms someone worth saving is already bleeding inside the corridor.',
        pressure: 1,
        trust: 2,
        awareness: 0,
        signal: -1
      },
      {
        id: 'intro-track-genealord',
        title: 'TRACK THE GENEALORD RESPONSE',
        situation: antagonist + ' pushes command traffic through a masked hunting band.',
        directive: 'Track the response before the hunting line disappears.',
        risk: 'Tracking reveals intent while exposing the listener.',
        action: 'Tracked the Genealord response.',
        reaction: antagonist + ' turns one sweep toward the source of the trace.',
        consequence: 'Enemy movement becomes readable for one interval.',
        carry: 'Enemy awareness increased; route forecast improved.',
        narrative: 'The field gives up one useful truth: ' + antagonist + ' is not reacting blindly. The Genealord is shaping the corridor around ' + protagonist + ', and the Unseen Hand has just become part of that calculation.',
        pressure: 1,
        trust: 0,
        awareness: 2,
        signal: 0
      },
      {
        id: 'intro-delay-field',
        title: 'DELAY FIELD INITIALIZATION',
        situation: 'The field can open now, but the first picture is incomplete.',
        directive: 'Delay the active hand long enough to collect one more read.',
        risk: 'Delay preserves clarity and risks losing the first corridor window.',
        action: 'Delayed field initialization.',
        reaction: thirdForce + ' presses harder against the Genealord line.',
        consequence: fieldPressure,
        carry: 'Signal integrity preserved; pressure increased.',
        narrative: 'The Unseen Hand refuses to move blind. That restraint protects the signal, but hesitation has a cost: ' + thirdForce + ' uses the pause to tear at the edge of the corridor.',
        pressure: 2,
        trust: 0,
        awareness: 0,
        signal: 1
      },
      {
        id: 'intro-divert-relay',
        title: 'DIVERT THE RELAY PATH',
        situation: 'The relay path is clean enough to use and obvious enough to kill.',
        directive: 'Divert the path before the enemy can lock it.',
        risk: 'Diversion hides movement but weakens signal fidelity.',
        action: 'Diverted the relay path.',
        reaction: 'The corridor bends through poorer terrain and loses clean timing.',
        consequence: protagonist + ' stays hidden while the route becomes harder to read.',
        carry: 'Enemy awareness reduced; signal integrity degraded.',
        narrative: protagonist + ' survives the first sweep because the route stops behaving like a route. The cost is confusion: future directives will arrive through worse static.',
        pressure: 0,
        trust: 1,
        awareness: -1,
        signal: -3
      },
      {
        id: 'intro-commit-early',
        title: 'COMMIT EARLY',
        situation: protagonist + ' is near the corridor mouth and the enemy has not fully sealed it.',
        directive: 'Commit before perfect information arrives.',
        risk: 'Early commitment can save the window and burn reserves.',
        action: 'Committed to the operation early.',
        reaction: 'The Ronin moves at once and ' + antagonist + ' accelerates pursuit.',
        consequence: 'The mission gains momentum at a visible cost.',
        carry: 'Trust increased; pressure increased.',
        narrative: 'There is no clean picture, only a closing route. The Unseen Hand commits anyway. ' + protagonist + ' moves because someone finally chose, and ' + antagonist + ' answers by making the hunt louder.',
        pressure: 2,
        trust: 2,
        awareness: 1,
        signal: -1
      }
    ];
  }

  function setIntroNextLocked(link, locked) {
    if (!link) {
      return;
    }
    if (!link.dataset.oaHref && link.getAttribute('href')) {
      link.dataset.oaHref = link.getAttribute('href');
    }
    link.disabled = locked;
    link.classList.toggle('is-oa-next-locked', locked);
    link.classList.toggle('is-disabled', locked);
    link.classList.toggle('is-oa-next-ready', !locked);
    link.setAttribute('aria-disabled', locked ? 'true' : 'false');
    link.setAttribute('tabindex', locked ? '-1' : '0');
    if (locked) {
      link.removeAttribute('href');
    }
    else if (link.dataset.oaHref) {
      link.setAttribute('href', link.dataset.oaHref);
    }
  }

  function setIntroChoiceLocked(button, locked) {
    if (!button) {
      return;
    }
    button.disabled = locked;
    button.classList.toggle('is-disabled', locked);
    button.setAttribute('aria-disabled', locked ? 'true' : 'false');
    button.setAttribute('tabindex', locked ? '-1' : '0');
  }

  function renderIntroChainPanel(root, state) {
    var chainPanel = root.querySelector('[data-ooh-alpha-intro-chain]');
    var latest = (state.chain || [])[state.chain.length - 1];

    if (!chainPanel) {
      return;
    }
    if (!latest) {
      chainPanel.innerHTML = '<span class="ooh-operation-alpha__intro-card-kicker">CHAIN OF CONSEQUENCE</span><p>ACTION: Awaiting decision.</p><p>REACTION: Field quiet.</p><p>CONSEQUENCE: No change recorded.</p><p>CARRY-FORWARD EFFECT: Risk unresolved.</p>';
      return;
    }
    chainPanel.innerHTML = '<span class="ooh-operation-alpha__intro-card-kicker">CHAIN OF CONSEQUENCE</span><p>ACTION: ' + latest.action + '</p><p>REACTION: ' + latest.reaction + '</p><p>CONSEQUENCE: ' + latest.consequence + '</p><p>CARRY-FORWARD EFFECT: ' + latest.carry + '</p>';
  }

  function renderIntroDecisionFlow(root, runtimeState) {
    var flow = root.querySelector('[data-ooh-alpha-intro-flow]');
    var wrap = root.querySelector('[data-ooh-alpha-intro-beats]');
    var counter = root.querySelector('[data-ooh-alpha-intro-counter]');
    var status = root.querySelector('[data-ooh-alpha-intro-status]');
    var consequence = root.querySelector('[data-ooh-alpha-intro-consequence]');
    var next = root.querySelector('[data-ooh-alpha-next-level]');
    var chainState = readOAChainState();
    var choices = chainState.introChoices || [];
    var required = introRequiredChoices;
    var introComplete = choices.length >= required;
    var beats = introBeatCards(runtimeState.storyCast || {}, runtimeState.scene || {});

    if (!flow || !wrap) {
      setIntroNextLocked(next, true);
      return;
    }

    wrap.innerHTML = '';
    beats.forEach(function (beat) {
      var selected = choices.some(function (choice) { return choice.id === beat.id; });
      var card = document.createElement('button');

      card.type = 'button';
      card.className = 'ooh-operation-alpha__intro-beat-card';
      card.classList.toggle('is-selected', selected);
      setIntroChoiceLocked(card, selected || introComplete);
      card.innerHTML = '<span>' + beat.title + '</span><strong>SITUATION</strong><p>' + beat.situation + '</p><strong>DIRECTIVE</strong><p>' + beat.directive + '</p><strong>RISK</strong><p>' + beat.risk + '</p><strong>CONSEQUENCE</strong><p>' + beat.consequence + '</p>';
      card.addEventListener('click', function () {
        if (card.disabled) {
          return;
        }
        chainState = readOAChainState();
        choices = chainState.introChoices || [];
        if (choices.length >= required || choices.some(function (choice) { return choice.id === beat.id; })) {
          return;
        }
        choices.push(beat);
        chainState.introChoices = choices;
        appendOAChainEvent(chainState, beat);
        renderIntroDecisionFlow(root, runtimeState);
        if (choices.length >= required && window.oaScrollToNextPhase) {
          window.oaScrollToNextPhase(root, root.querySelector('[data-ooh-alpha-next-level]'));
        }
      });
      wrap.appendChild(card);
    });

    if (counter) {
      counter.textContent = 'SELECTED: ' + choices.length + ' / REQUIRED: ' + required;
    }
    if (status) {
      status.textContent = introComplete ? 'READY' : 'STAGE LOCKED';
    }
    if (consequence) {
      var latest = choices[choices.length - 1];
      consequence.innerHTML = '<span class="ooh-operation-alpha__intro-card-kicker">NARRATIVE CONSEQUENCE</span><p>' + (latest ? latest.narrative : 'Awaiting Unseen Hand directive.') + '</p>';
    }
    renderIntroChainPanel(root, chainState);
    setIntroNextLocked(next, !introComplete);
    bindIntroTransmission(root, runtimeState);
    if (introComplete) {
      flow.classList.add('is-stage-complete');
    }
    else {
      flow.classList.remove('is-stage-complete');
    }
  }

  function setTransmissionPortrait(root, selector, portrait) {
    var image = root.querySelector(selector);
    if (!image) {
      return;
    }
    if (portrait) {
      image.src = portrait;
      image.hidden = false;
    }
    else {
      image.hidden = true;
    }
  }

  function transmissionActorHook(actor, latest, fallback) {
    if (latest && latest.narrative) {
      return latest.narrative;
    }
    if (actor && (actor.faction || '').toLowerCase() === 'genealord') {
      return storyCastName(actor) + ' committed pressure before the route could settle.';
    }
    if (actor && (actor.faction || '').toLowerCase() === 'mutant') {
      return storyCastName(actor) + ' changed the corridor pressure and forced the next decision.';
    }
    return fallback || storyCastName(actor) + ' kept the route alive under pressure.';
  }

  function transmissionIdentityFromActor(actor, latest, fallbackHook) {
    var portrait = eventCardPortrait(actor);

    if (!actor || !portrait) {
      return null;
    }

    return {
      portrait: portrait,
      name: storyCastName(actor),
      faction: actor.faction || 'UNRESOLVED',
      role: actor.role || actor.storyLabel || 'Field Presence',
      hook: transmissionActorHook(actor, latest, fallbackHook)
    };
  }

  function pickTransmissionIdentity(cast, latest) {
    var candidates = [
      cast && cast.actor,
      cast && cast.opposition,
      cast && cast.ally,
      cast && cast.thirdForce
    ];
    var identity;

    candidates.some(function (actor) {
      identity = transmissionIdentityFromActor(actor, latest, latest && latest.narrative);
      return !!identity;
    });

    return identity || null;
  }

  function renderTransmissionIdentity(root, identity) {
    var block = root.querySelector('[data-ooh-alpha-transmission-identity]');
    var image = root.querySelector('[data-ooh-alpha-transmission-portrait]');
    var name = root.querySelector('[data-ooh-alpha-transmission-name]');
    var faction = root.querySelector('[data-ooh-alpha-transmission-faction]');
    var role = root.querySelector('[data-ooh-alpha-transmission-role]');
    var hook = root.querySelector('[data-ooh-alpha-transmission-hook]');

    if (!block || !image || !identity || !identity.portrait) {
      if (block) {
        block.hidden = true;
      }
      if (image) {
        image.hidden = true;
        image.removeAttribute('src');
      }
      return;
    }

    image.onerror = function () {
      image.hidden = true;
      block.hidden = true;
      image.removeAttribute('src');
    };
    image.onload = function () {
      image.hidden = false;
      block.hidden = false;
    };
    image.src = identity.portrait;
    image.hidden = false;
    block.hidden = false;
    if (name) {
      name.textContent = identity.name || 'UNKNOWN FIELD ASSET';
    }
    if (faction) {
      faction.textContent = identity.faction || 'UNRESOLVED';
    }
    if (role) {
      role.textContent = identity.role || 'Field Presence';
    }
    if (hook) {
      hook.textContent = identity.hook || 'The field records an operational presence.';
    }
  }

  function bindIntroTransmission(root, runtimeState) {
    var next = root.querySelector('[data-ooh-alpha-next-level]');
    var popup = root.querySelector('[data-ooh-alpha-transmission-popup]');

    if (!next || !popup || next.oohAlphaTransmissionBound) {
      return;
    }
    next.oohAlphaTransmissionBound = true;
    next.addEventListener('click', function (event) {
      var chainState = readOAChainState();
      var choices = chainState.introChoices || [];
      var introReady = choices.length >= introRequiredChoices;

      if (next.disabled || next.getAttribute('aria-disabled') === 'true' || !introReady) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setIntroNextLocked(next, true);
        return;
      }
      event.preventDefault();
      var latest = choices[choices.length - 1];
      var cast = runtimeState.storyCast || {};
      var identity = pickTransmissionIdentity(cast, latest) || chainState.activeIdentity;
      var portrait = identity && identity.portrait ? identity.portrait : chainState.activePortrait;
      var transmission = narrativeEntry(chainState, 'introTransmission', 'unseenHandTransmissionTemplates', 31);
      var summaryText = transmission ? fillNarrativeText(transmission.text, chainState.narrativeTokens) : '';

      if (identity) {
        chainState.activeIdentity = identity;
        chainState.activePortrait = identity.portrait;
        writeOAChainState(chainState);
      }
      else if (portrait) {
        chainState.activePortrait = portrait;
        writeOAChainState(chainState);
      }
      renderTransmissionIdentity(root, identity);
      root.querySelector('[data-ooh-alpha-transmission-title]').textContent = 'Signal acquisition complete.';
      root.querySelector('[data-ooh-alpha-transmission-summary]').textContent = (summaryText || (latest ? latest.narrative : 'The route remains open. The next phase will demand more.')) + ' The route remains open. The cost is now moving with it.';
      root.querySelector('[data-ooh-alpha-transmission-gain]').textContent = 'GAIN: The Unseen Hand has committed a readable opening chain.';
      root.querySelector('[data-ooh-alpha-transmission-loss]').textContent = 'LOSS: The field now knows it is being shaped.';
      root.querySelector('[data-ooh-alpha-transmission-danger]').textContent = 'DANGER: Field pressure will answer the first three directives.';
      popup.hidden = false;
      popup.setAttribute('aria-hidden', 'false');
      if (window.oaScrollToNextPhase) {
        window.oaScrollToNextPhase(root, popup);
      }
    });
  }

  function renderIntroStoryBlock(root, state) {
    var block = root.querySelector('[data-ooh-alpha-intro-storyblock]');
    var next = root.querySelector('[data-ooh-alpha-next-level]');
    var title = root.querySelector('[data-ooh-alpha-intro-story-title]');
    var copy = root.querySelector('[data-ooh-alpha-intro-story-copy]');
    var catalyst = root.querySelector('[data-ooh-alpha-intro-catalyst]');
    var pressure = root.querySelector('[data-ooh-alpha-intro-pressure]');
    var debate = root.querySelector('[data-ooh-alpha-intro-debate]');
    var storedSelection = getPlaylistSelection();
    var cast = state && state.storyCast ? state.storyCast : {};
    var scene = state && state.scene ? state.scene : {};
    var protagonist = cast.actor || cast.ally;
    var antagonist = cast.opposition;
    var thirdForce = cast.thirdForce;
    var protagonistName = storyCastName(protagonist);
    var antagonistName = storyCastName(antagonist);
    var antagonistPath = antagonist && antagonist.path ? antagonist.path : 'his path';
    var chainState = readOAChainState();
    var tokens;
    var catalystEntry;
    var rivalryEntry;
    var grudgeEntry;

    if (!block) {
      return;
    }
    block.hidden = !(state && runtimePhaseCluster(state).key === 'intro' && root.classList.contains('is-runtime-acknowledged') && storedSelection && storedSelection.title);
    root.classList.toggle('has-intro-storyblock', !block.hidden);
    if (next) {
      setIntroNextLocked(next, true);
    }
    if (block.hidden) {
      return;
    }

    tokens = buildNarrativeTokens(state, cast, scene, storedSelection);
    chainState.narrativeTokens = tokens;
    catalystEntry = narrativeEntry(chainState, 'introCatalyst', 'catalystTemplates', 3);
    rivalryEntry = narrativeEntry(chainState, 'introRivalry', 'rivalryTemplates', 7);
    grudgeEntry = narrativeEntry(chainState, 'introGrudge', 'grudgeTemplates', 11);
    writeOAChainState(chainState);

    if (title) {
      title.textContent = 'The Ronin is forced into the corridor';
    }
    if (copy) {
      copy.textContent = rivalryEntry ? fillNarrativeText(rivalryEntry.text, tokens) : antagonistName + ' considered ' + protagonistName + "'s interference an insult against " + antagonistPath + ' and swore that the Ronin would be hunted before the signal cleared.';
    }
    setIntroStoryImage(root, '[data-ooh-alpha-intro-protagonist-image]', protagonist);
    setIntroStoryImage(root, '[data-ooh-alpha-intro-antagonist-image]', antagonist);
    setIntroStoryText(root, 'protagonist', protagonist);
    setIntroStoryText(root, 'antagonist', antagonist);
    if (catalyst) {
      catalyst.textContent = catalystEntry ? fillNarrativeText(catalystEntry.text, tokens) : storyCastName(thirdForce) + ' attacks or pressures ' + antagonistName + "'s field. " + protagonistName + ' is pushed into the corridor before either side can control the signal.';
    }
    if (pressure) {
      pressure.textContent = 'STARTING STORYLINE PRESSURE: ' + (grudgeEntry ? fillNarrativeText(grudgeEntry.text, tokens) : (scene.fieldPressure || 'The route remains open, but only if pressure is managed.'));
    }
    if (debate) {
      debate.textContent = 'DEBATE: The Unseen Hand must decide whether the mission outweighs the cost.';
    }
    renderIntroDecisionFlow(root, state);
  }

  function renderStoryEventSuite(root, state) {
    var battlefield = root.querySelector('[data-ooh-alpha-battlefield]');
    var suite;
    var slots = ['actor', 'ally', 'opposition', 'thirdForce'];
    var labels = {
      actor: 'ACTOR',
      ally: 'ALLY',
      opposition: 'OPPOSITION',
      thirdForce: 'THIRD FORCE'
    };

    if (!battlefield || !state || !state.storyCast) {
      return;
    }

    suite = battlefield.querySelector('[data-ooh-alpha-story-events]');
    if (!suite) {
      suite = document.createElement('div');
      suite.className = 'ooh-operation-alpha__story-events';
      suite.setAttribute('data-ooh-alpha-story-events', '');
      battlefield.appendChild(suite);
    }

    suite.innerHTML = '';
    slots.forEach(function (slot, index) {
      var actor = state.storyCast[slot];
      var card = document.createElement('article');
      var portrait = eventCardPortrait(actor);
      var image;
      var body;

      card.className = 'ooh-operation-alpha__story-event';
      card.setAttribute('data-story-slot', slot);
      if (index === state.eventRotationIndex % slots.length) {
        card.classList.add('is-story-event-current');
      }

      if (portrait) {
        image = document.createElement('img');
        image.className = 'ooh-operation-alpha__story-event-image';
        image.alt = '';
        image.src = portrait;
        image.onerror = function () {
          image.hidden = true;
        };
        card.appendChild(image);
      }

      body = document.createElement('div');
      body.className = 'ooh-operation-alpha__story-event-body';
      body.innerHTML = '<span class="ooh-operation-alpha__story-event-kicker">' + labels[slot] + '</span>' +
        '<strong class="ooh-operation-alpha__story-event-name">' + storyCastName(actor) + '</strong>' +
        '<span class="ooh-operation-alpha__story-event-role">' + storyCastRole(actor) + '</span>' +
        '<p class="ooh-operation-alpha__story-event-copy">' + storyEventCardCopy(state, slot) + '</p>';
      card.appendChild(body);
      suite.appendChild(card);
    });
  }

  function pushStoryMemory(state, hook, consequence) {
    var cast = state.storyCast || {};
    var memory = {
      block: storyBlockLabel(state),
      allyHook: storyCastName(cast.ally),
      oppositionHook: storyCastName(cast.opposition),
      rivalHook: storyCastName(cast.opposition),
      thirdForceHook: storyCastName(cast.thirdForce),
      memoryHook: hook,
      consequence: consequence
    };

    state.storyHooks.push(memory);
    state.eventRotationIndex = (state.eventRotationIndex + 1) % 4;
    return memory;
  }

  function bestDecisionLine(state) {
    var choices = state.lockedPresenceChoices || [];
    var best = choices.filter(function (choice) {
      return choice.clarityDelta > 0 || choice.exposureDelta < 0 || choice.pressureDelta < 0;
    })[0] || choices[0];

    return best ? best.label + ': ' + best.narrativeEffect : keyChoiceSummary(state);
  }

  function pressurePointLine(state) {
    var last = state.storyHooks[state.storyHooks.length - 1];

    if (state.pressureLevel >= 8) {
      return 'Pressure peaked before the field could fully settle.';
    }
    if (state.exposureLevel >= 5) {
      return 'Exposure stayed high after the corridor reacted.';
    }
    if (last) {
      return last.thirdForceHook + ' made the last clean route unstable.';
    }

    return 'No single pressure point dominated the report.';
  }

  function aarResultBand(state) {
    if (state.outcomeState === 'OPERATION PASSED' || state.outcomeState === 'EXTRACTED' || state.outcomeState === 'STABILIZED') {
      return 'GO // SUCCESS';
    }
    if (state.outcomeState === 'PARTIAL SUCCESS') {
      return 'GO // PARTIAL';
    }

    return 'NO-GO // FAILURE';
  }

  function finalAarLines(state) {
    var scene = state.scene || {};
    var hooks = state.storyHooks.slice(-4);
    var cast = state.storyCast || {};
    var lines = [
      'Actor: ' + storyCastName(cast.actor) + '. Ally: ' + storyCastName(cast.ally) + '. Rival: ' + storyCastName(cast.opposition) + '. Opposition: ' + storyCastName(cast.opposition) + '.',
      'Cause: ' + (scene.catalyst || 'The field opened under pressure') + ' and ' + storyCastName(cast.thirdForce) + ' changed the corridor.',
      'Best decision: ' + bestDecisionLine(state) + '.',
      'Pressure point: ' + pressurePointLine(state) + '.'
    ];

    if (hooks.length) {
      lines.push('Memory: ' + hooks.map(function (hook) {
        return hook.memoryHook + ' -> ' + hook.consequence;
      }).join(' / '));
    }

    return lines.slice(0, 5);
  }

  function ensureFinalAarPopup(root, state) {
    var popup = root.querySelector('[data-ooh-alpha-final-aar]');
    var title;
    var status;
    var lines;
    var body;
    var actions;

    if (!popup) {
      popup = document.createElement('div');
      popup.className = 'ooh-operation-alpha__final-aar';
      popup.setAttribute('data-ooh-alpha-final-aar', '');
      popup.setAttribute('role', 'dialog');
      popup.setAttribute('aria-modal', 'true');
      popup.setAttribute('aria-labelledby', 'ooh-alpha-final-aar-title');
      popup.innerHTML = '<div class="ooh-operation-alpha__final-aar-card">' +
        '<span class="ooh-operation-alpha__final-aar-kicker">BLOCK 4 // FINAL AAR POPUP</span>' +
        '<h3 class="ooh-operation-alpha__final-aar-title" id="ooh-alpha-final-aar-title"></h3>' +
        '<strong class="ooh-operation-alpha__final-aar-status" data-ooh-alpha-final-aar-status></strong>' +
        '<div class="ooh-operation-alpha__final-aar-lines" data-ooh-alpha-final-aar-lines></div>' +
        '<div class="ooh-operation-alpha__final-aar-actions">' +
        '<button class="ooh-operation-alpha__final-aar-button" type="button" data-ooh-alpha-final-aar-run>RUN ANOTHER OPERATION</button>' +
        '<a class="ooh-operation-alpha__final-aar-button" href="' + routePath('/operation-alpha/credits') + '">PURCHASE CREDITS</a>' +
        '<a class="ooh-operation-alpha__final-aar-button" href="' + routePath('/operation-alpha') + '">RETURN TO OA HOME</a>' +
        '<a class="ooh-operation-alpha__final-aar-button" href="' + routePath('/operation-alpha/oaplay/playlists') + '">SELECT SIGNAL</a>' +
        '</div>' +
        '</div>';
      root.appendChild(popup);
      popup.querySelector('[data-ooh-alpha-final-aar-run]').addEventListener('click', function () {
        resetOAIntroRunState(true);
        popup.hidden = true;
        popup.setAttribute('aria-hidden', 'true');
        activateOperationAlphaRuntime(root);
      });
    }

    title = popup.querySelector('.ooh-operation-alpha__final-aar-title');
    status = popup.querySelector('[data-ooh-alpha-final-aar-status]');
    lines = popup.querySelector('[data-ooh-alpha-final-aar-lines]');
    body = finalAarLines(state);
    actions = popup.querySelectorAll('.ooh-operation-alpha__final-aar-button');

    if (title) {
      title.textContent = 'FINAL ASSESSMENT: ' + (state.scene && state.scene.sceneName ? state.scene.sceneName : 'OPERATION ALPHA');
    }
    if (status) {
      status.textContent = aarResultBand(state) + ' // ' + state.outcomeState;
    }
    if (lines) {
      lines.innerHTML = '';
      body.forEach(function (line) {
        var p = document.createElement('p');
        p.textContent = line;
        lines.appendChild(p);
      });
    }
    actions.forEach(function (action) {
      if ((action.textContent || '').trim() === 'SELECT SIGNAL') {
        action.setAttribute('href', '/operation-alpha/oaplay/playlists');
      }
    });

    popup.hidden = false;
    popup.setAttribute('aria-hidden', 'false');
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
    brief.textContent = 'PROTAGONIST: ' + scene.subject + ' // ANTAGONIST / OPPOSITION: ' + scene.opposingForce + ' // CONDITION: ' + scene.pressureCondition + ' // SIGNAL: ' + scene.interventionWindow + ' // CATALYST: ' + scene.catalyst;

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

  function pendingPresenceChoices(state) {
    if (!state) {
      return [];
    }
    if (!state.pendingPresenceChoices) {
      state.pendingPresenceChoices = [];
    }

    return state.pendingPresenceChoices;
  }

  function isCrisisPhase(state) {
    return state && runtimePhaseCluster(state).key === 'crisis';
  }

  function updateBattlefieldReadiness(state) {
    var phase = runtimePhaseCluster(state);
    var ready = isCrisisPhase(state) ?
      runtimePhasePressure(state) >= phase.requiredPressure && state.outcomeState === 'PENDING' :
      pendingPresenceChoices(state).length >= phase.requiredPressure && state.outcomeState === 'PENDING';

    state.currentPhase = phase.label;
    state.phaseActionCount = isCrisisPhase(state) ? runtimePhasePressure(state) : pendingPresenceChoices(state).length;
    state.phaseRequiredCount = phase.requiredPressure;
    state.battlefieldPresenceReady = ready;
    return ready;
  }

  function runtimePhaseReady(state) {
    return !!(state && state.battlefieldPresenceReady);
  }

  function runtimePhaseUiState(state, index) {
    if (!state || index > state.phaseSpineIndex) {
      return 'LOCKED';
    }
    if (index < state.phaseSpineIndex || (state.outcomeState !== 'PENDING' && index === runtimePhaseSpine.length - 1)) {
      return 'COMPLETE';
    }
    if (runtimePhaseReady(state)) {
      return 'READY TO PROCEED';
    }

    return 'ACTIVE';
  }

  function setRuntimeButtonState(button, enabled) {
    if (!button) {
      return;
    }
    button.disabled = !enabled;
    button.classList.toggle('is-oa-control-disabled', !enabled);
    if (!enabled) {
      button.removeAttribute('aria-pressed');
      button.classList.remove('is-command-active', 'is-director-active');
    }
  }

  function syncRuntimeControlLocks(root, state) {
    var crisisActive = !!(state && state.outcomeState === 'PENDING' && isCrisisPhase(state));

    root.querySelectorAll('[data-ooh-alpha-command], [data-ooh-alpha-director-action], .ooh-operation-alpha__intervention').forEach(function (button) {
      setRuntimeButtonState(button, crisisActive);
    });

    root.classList.toggle('is-oa-runtime-initialized', !!state);
    root.classList.toggle('is-oa-battlefield-suite-active', crisisActive);
    if (state) {
      root.setAttribute('data-ooh-alpha-phase-key', runtimePhaseCluster(state).key);
      root.setAttribute('data-ooh-alpha-phase-state', runtimePhaseUiState(state, state.phaseSpineIndex));
    }
    else {
      root.setAttribute('data-ooh-alpha-phase-key', 'startup');
      root.setAttribute('data-ooh-alpha-phase-state', 'LOCKED');
    }
    syncSignalGate(root);
  }

  function runtimePhaseStatus(state, index) {
    var phase = runtimePhaseSpine[index];

    if (!state || index > state.phaseSpineIndex) {
      return phase.label + ' - LOCKED';
    }
    if (index < state.phaseSpineIndex || (state.outcomeState !== 'PENDING' && index === runtimePhaseSpine.length - 1)) {
      return phase.label + ' - COMPLETE';
    }

    return phase.label + ' - ' + runtimePhaseUiState(state, index) + ' ' + state.phaseActionCount + '/' + phase.requiredPressure;
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
      return 'PRESENCE: READY TO PROCEED';
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
    return 'KARMA: ' + (state.fateLine || 'the scene waits for pressure') + '. EFFECT: ' + (state.screenwriterEffect || state.hookLine);
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

  function setChoiceBattlefieldPresence(root, state, choice) {
    var scene = state.scene || {};
    var exposureChange = choice.exposureDelta > 0 ? 'exposure rises +' + choice.exposureDelta : (choice.exposureDelta < 0 ? 'exposure drops ' + choice.exposureDelta : 'exposure holds');
    var pressureChange = choice.pressureDelta > 0 ? 'pressure rises +' + choice.pressureDelta : (choice.pressureDelta < 0 ? 'pressure drops ' + choice.pressureDelta : 'pressure holds');
    var clarityChange = choice.clarityDelta > 0 ? 'clarity improves +' + choice.clarityDelta : (choice.clarityDelta < 0 ? 'clarity degrades ' + choice.clarityDelta : 'clarity holds');

    setBattlefieldPresence(root, {
      field: 'IMMEDIATE CONSEQUENCE: ' + choice.narrativeEffect,
      movement: 'OPPOSITION REACTION: ' + (scene.opposingForce || 'opposition') + ' adjusts against ' + (scene.forceMultiplier || 'field pressure') + '. ROUTE/FORCE: ' + pressureChange + ', ' + clarityChange + ', ' + exposureChange + '.',
      signal: 'NEXT PRESSURE: complete ' + runtimeVisiblePhase(state) + ' choice work, then press PROCEED.'
    });
  }

  function setCrisisBattlefieldPresence(root, state, action) {
    var scene = state.scene || {};
    var pressureChange = action.pressureDelta > 0 ? 'pressure rises +' + action.pressureDelta : (action.pressureDelta < 0 ? 'pressure drops ' + action.pressureDelta : 'pressure holds');
    var clarityChange = action.clarityDelta > 0 ? 'clarity improves +' + action.clarityDelta : (action.clarityDelta < 0 ? 'clarity degrades ' + action.clarityDelta : 'clarity holds');
    var exposureChange = action.exposureDelta > 0 ? 'exposure rises +' + action.exposureDelta : (action.exposureDelta < 0 ? 'exposure drops ' + action.exposureDelta : 'exposure holds');

    setBattlefieldPresence(root, {
      field: 'IMMEDIATE CONSEQUENCE: ' + action.consequence,
      movement: 'OPPOSITION REACTION: ' + (scene.opposingForce || 'opposition') + ' presses the crisis line. ROUTE/FORCE: ' + pressureChange + ', ' + clarityChange + ', ' + exposureChange + '.',
      signal: 'NEXT PRESSURE: crisis sequence ' + state.phaseActionCount + '/' + state.phaseRequiredCount + '. ' + (runtimePhaseReady(state) ? 'PROCEED is live.' : 'Continue crisis choices.')
    });
  }

  function renderBattlefieldGate(root, state) {
    var lockButton = root.querySelector('[data-ooh-alpha-mission-cycle]');
    var matrix = root.querySelector('[data-ooh-alpha-presence-choice-matrix]');
    var consequenceStatus = root.querySelector('[data-ooh-alpha-consequence-status]');
    var consequenceSummary = root.querySelector('[data-ooh-alpha-consequence-summary]');
    var commandState = root.querySelector('[data-ooh-alpha-command-state]');
    var ready = updateBattlefieldReadiness(state);
    var phase = runtimePhaseCluster(state);
    var phaseState = runtimePhaseUiState(state, state.phaseSpineIndex);

    if (commandState) {
      commandState.textContent = runtimePhaseSummary(state);
    }
    if (consequenceStatus) {
      consequenceStatus.textContent = runtimePresenceStatus(state);
    }
    if (consequenceSummary) {
      consequenceSummary.textContent = runtimePhaseSummary(state);
    }
    if (lockButton) {
      lockButton.textContent = state.outcomeState !== 'PENDING' ? 'BLOCK COMPLETE' : (ready ? 'PROCEED' : phaseState + ' // PROCEED LOCKED');
      lockButton.disabled = !ready || state.outcomeState !== 'PENDING';
      lockButton.setAttribute('data-ooh-alpha-proceed-state', phaseState);
      lockButton.setAttribute('aria-disabled', lockButton.disabled ? 'true' : 'false');
      lockButton.setAttribute('aria-label', phase.label + ' proceed state: ' + phaseState);
      lockButton.classList.toggle('is-presence-ready', ready && state.outcomeState === 'PENDING');
      lockButton.classList.toggle('is-presence-locked', lockButton.disabled);
    }
    syncRuntimeControlLocks(root, state);
    renderPresenceChoiceMatrix(root, state, ready);
    renderStoryEventSuite(root, state);
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
    matrix.hidden = state.outcomeState !== 'PENDING' || isCrisisPhase(state);
    if (matrix.hidden) {
      return;
    }

    phasePresenceChoices(state).forEach(function (choice) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'ooh-operation-alpha__presence-choice';
      button.textContent = choice.label;
      button.disabled = false;
      if (pendingPresenceChoices(state).some(function (selectedChoice) { return selectedChoice.label === choice.label; })) {
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

    if (phase === 'BLOCK 1 // INTRO / CATALYST') {
      return 'READ OUTPUT: PROTAGONIST ' + scene.subject + ' enters under ' + scene.pressureCondition + '. ANTAGONIST / OPPOSITION: ' + scene.opposingForce + '. SIGNAL: ' + scene.interventionWindow + '. CATALYST: ' + scene.catalyst + '.';
    }
    if (phase === 'BLOCK 2 // CHARACTER ENTRY') {
      return 'READ OUTPUT: ALLY ' + storyCastName(state.storyCast.ally) + ' // RIVAL ' + storyCastName(state.storyCast.opposition) + ' // THIRD FORCE ' + storyCastName(state.storyCast.thirdForce) + '. ' + (lockedChoice ? lockedChoice.label + ' carries forward. ' + lockedChoice.narrativeEffect : 'The prior field posture carries forward.') + ' ' + (state.characterTurns.character || 'A new pressure turn enters the corridor.');
    }

    return 'READ OUTPUT: ' + (lockedChoice ? lockedChoice.label + ' sets the collapse posture. ' : '') + (state.characterTurns.crisis || 'The opposing force closes in.') + ' Pressure ' + state.pressureLevel + ', clarity ' + state.channelClarity + ', exposure ' + state.exposureLevel + ', clock ' + formatOperationTime(state.operationTime) + '.';
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
      consequenceSummary.textContent = storyPanelText(state);
    }
  }

  function buildRuntimeState(root, actor, payload) {
    var scene = generateRuntimeScene(actor, root.oohAlphaActorRegistry || []);
    var storyCast = buildStoryCast(actor, root.oohAlphaActorRegistry || []);

    return {
      selectedActor: actor,
      faction: actor.faction || 'Unresolved',
      scene: scene,
      storyCast: storyCast,
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
        intro: 0,
        character: 0,
        crisis: 0
      },
      phaseLocks: [],
      totalFieldPressure: 0,
      operationTime: 0,
      currentPhase: 'BLOCK 1 // INTRO / CATALYST',
      phaseActionCount: 0,
      phaseRequiredCount: runtimePhaseSpine[0].requiredPressure,
      battlefieldPresenceReady: false,
      selectedBattlefieldPosture: null,
      choiceHistory: [],
      lockedPresenceChoices: [],
      pendingPresenceChoice: null,
      stationReports: [],
      storyHooks: [],
      eventRotationIndex: 0,
      characterTurns: {
        intro: 'Ronin subject established against Genealord pressure and mutant force.',
        character: '',
        crisis: ''
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
      renderIntroStoryBlock(root, root.oohAlphaRuntimeState);
      renderBattlefieldGate(root, root.oohAlphaRuntimeState);
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

    if (!isCrisisPhase(state)) {
      state.directiveBlocked = true;
      state.consequenceLine = 'DIRECTIVE LOCKED // complete the current block and press PROCEED.';
      return state;
    }

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
    state.phasePressureCounts[runtimePhaseCluster(state).key] = runtimePhasePressure(state) + 1;
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
      return 'Karma line stabilized before exposure peaked. ' + subject + ' remained inside ' + mission.label + '.';
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
    var finalSuiteReached = state.phaseSpineIndex >= runtimePhaseSpine.length - 1 || state.phaseLocks.indexOf('crisis') !== -1;

    if (!result || !title || !field || !mark || state.outcomeState === 'PENDING' || !finalSuiteReached) {
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
    ensureFinalAarPopup(root, state);
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
    var phase;
    var choices;
    var existingIndex;

    if (!state || state.outcomeState !== 'PENDING' || isCrisisPhase(state)) {
      return;
    }

    phase = runtimePhaseCluster(state);
    choices = pendingPresenceChoices(state);
    existingIndex = choices.map(function (selectedChoice) {
      return selectedChoice.label;
    }).indexOf(choice.label);
    if (existingIndex !== -1) {
      choices.splice(existingIndex, 1);
    }
    choices.push(choice);
    while (choices.length > phase.requiredPressure) {
      choices.shift();
    }
    state.selectedBattlefieldPosture = choice;
    updateBattlefieldReadiness(state);
    state.consequenceLine = 'CHOICE RECORDED // ' + choice.label + ' // ' + state.phaseActionCount + '/' + state.phaseRequiredCount + '. ' + choice.narrativeEffect;
    setChoiceBattlefieldPresence(root, state, choice);
    if (reaction) {
      reaction.textContent = state.consequenceLine;
    }
    window.console.log('OA Battlefield posture selected', {
      phase: runtimeVisiblePhase(state),
      choice: choice.label,
      ready: runtimePhaseReady(state)
    });
    renderBattlefieldGate(root, state);
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

  function applyPendingPresenceChoices(state) {
    pendingPresenceChoices(state).forEach(function (choice) {
      applyPresenceChoice(state, choice);
    });
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

    if (!isCrisisPhase(state)) {
      state.consequenceLine = 'CRISIS CONTROLS LOCKED // press PROCEED through the current block first.';
      if (reaction) {
        reaction.textContent = state.consequenceLine;
      }
      renderBattlefieldGate(root, state);
      return state;
    }

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

    setCrisisBattlefieldPresence(root, state, action);
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
    else if (!isCrisisPhase(state) && !pendingPresenceChoices(state).length) {
      state.consequenceLine = 'BATTLEFIELD PRESENCE READY // choose a posture before locking.';
    }
    else if (state.phaseSpineIndex >= runtimePhaseSpine.length - 1) {
      applyPendingPresenceChoices(state);
      state.phaseLocks.push(phase.key);
      state.stationReports.push(phase.label + ' locked: crisis sequence complete.');
      state.pendingPresenceChoice = null;
      state.pendingPresenceChoices = [];
      state.selectedBattlefieldPosture = null;
      state.battlefieldPresenceReady = false;
      state.consequenceLine = 'BLOCK 4 // FINAL AAR POPUP opening.';
      resolveBattlefieldSpine(root, state);
    }
    else {
      pendingPresenceChoices(state).forEach(function (choice) {
        pushStoryMemory(state, choice.label, choice.narrativeEffect);
      });
      applyPendingPresenceChoices(state);
      state.phaseLocks.push(phase.key);
      state.stationReports.push(phase.label + ' locked: ' + pendingPresenceChoices(state).map(presenceChoiceSummary).join(' / '));
      state.phaseSpineIndex++;
      nextPhase = runtimePhaseCluster(state);
      state.beatIndex = nextPhase.beatStart;
      state.beatName = runtimeStoryBeats[state.beatIndex];
      state.pendingPresenceChoice = null;
      state.pendingPresenceChoices = [];
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
    var commandButton = root.querySelector('[data-ooh-alpha-command="' + commandKey + '"]');
    var state = root.querySelector('[data-ooh-alpha-command-state]');
    var acknowledgement = root.querySelector('[data-ooh-alpha-command-ack]');
    var runtimeCopy = root.querySelector('[data-ooh-alpha-runtime-copy]');
    var activationStatus = root.querySelector('[data-ooh-alpha-activation-status]');
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var consequenceStatus = root.querySelector('[data-ooh-alpha-consequence-status]');
    var consequenceSummary = root.querySelector('[data-ooh-alpha-consequence-summary]');
    var runtimeState;

    if (!directive || !state || !acknowledgement || (commandButton && commandButton.disabled)) {
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
      renderBattlefieldGate(root, runtimeState);
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
      consequenceSummary.textContent = storyPanelText(runtimeState);
    }
    setRuntimeBattlefieldPresence(root, runtimeState, directive);
    setAssetMovementFeed(root, directive.movementMode);
    renderRuntimeOutcome(root, runtimeState);
    renderBattlefieldGate(root, runtimeState);
    renderStationOutput(root, runtimeState);

    root.querySelectorAll('[data-ooh-alpha-command]').forEach(function (button) {
      if (button.getAttribute('data-ooh-alpha-command') === commandKey) {
        button.classList.add('is-command-active');
        button.setAttribute('aria-pressed', 'true');
      }
      else {
        button.classList.remove('is-command-active');
        button.removeAttribute('aria-pressed');
      }
      setRuntimeButtonState(button, isCrisisPhase(runtimeState) && runtimeState.outcomeState === 'PENDING');
    });
  }

  function initCommandConsole(root) {
    root.querySelectorAll('[data-ooh-alpha-command]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (button.disabled) {
          return;
        }
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
    setIntroGameplayBlocksVisible(root, false);
    root.querySelectorAll('[data-ooh-alpha-final-aar]').forEach(function (popup) {
      popup.hidden = true;
      popup.setAttribute('aria-hidden', 'true');
    });

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
      button.disabled = true;
      button.classList.remove('is-command-active');
      button.removeAttribute('aria-pressed');
    });
    root.querySelectorAll('[data-ooh-alpha-director-action], .ooh-operation-alpha__intervention').forEach(function (button) {
      button.disabled = true;
      button.classList.add('is-oa-control-disabled');
      button.removeAttribute('aria-pressed');
    });
    syncRuntimeControlLocks(root, null);
  }

  function setIntroGameplayBlocksVisible(root, visible) {
    root.querySelectorAll('[data-ooh-alpha-operational-payload], [data-ooh-alpha-battlefield], .ooh-operation-alpha__scenario, .ooh-operation-alpha__command-console').forEach(function (section) {
      section.hidden = !visible;
      section.setAttribute('aria-hidden', visible ? 'false' : 'true');
      section.classList.toggle('is-hidden', !visible);
    });
  }

  function activateOperationAlphaRuntime(root) {
    var runtimeCopy = root.querySelector('[data-ooh-alpha-runtime-copy]');
    var activationStatus = root.querySelector('[data-ooh-alpha-activation-status]');
    var activationButton = root.querySelector('[data-ooh-alpha-activate]');
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var contact = root.querySelector('[data-ooh-alpha-contact]');
    var storedSelection = getPlaylistSelection();

    if (!storedSelection || !storedSelection.title) {
      syncSignalGate(root);
      syncFieldInitializeGate(root);
      return;
    }

    root.classList.add('is-runtime-acknowledged');
    pauseOperationAlphaAmbient(root);
    resetOAIntroRunState(true);
    resetRuntimeLoop(root);
    syncSignalGate(root);
    syncFieldInitializeGate(root);

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

    renderScenario(root, 0);
    renderContact(root, 0, 'activation');
    setAtmosphere(root, 0);
    selectOperationAlphaActor(root);
    setIntroGameplayBlocksVisible(root, false);
    if (window.oaScrollToNextPhase) {
      window.oaScrollToNextPhase(root, root.querySelector('[data-ooh-alpha-actor-transmission]') || root.querySelector('[data-ooh-alpha-intro-storyblock]'));
    }
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
    setAtmosphere(root, nextAtmosphereIndex);
    applyFieldPressure(root, buttonIndex);

    window.clearTimeout(root.oohAlphaScenarioTimer);
  }

  function bindOperationAlphaEnter(root, intro, enter) {
    intro = intro || root.querySelector('[data-ooh-operation-alpha-intro]');
    enter = enter || root.querySelector('[data-ooh-operation-alpha-enter]');

    if (!intro || !enter) {
      return;
    }

    if (root.oohAlphaEnterButton === enter) {
      return;
    }

    root.oohAlphaEnterButton = enter;
    enter.addEventListener('click', function () {
      storeSeenFlag();
      hideIntro(intro);
    });
  }

  function initOperationAlphaGate(root) {
    var intro = root.querySelector('[data-ooh-operation-alpha-intro]');
    var enter = root.querySelector('[data-ooh-operation-alpha-enter]');
    var activationButton = root.querySelector('[data-ooh-alpha-activate]');
    var missionCycle = root.querySelector('[data-ooh-alpha-mission-cycle]');
    var signalGate = root.querySelector('[data-ooh-alpha-signal-gate]');
    var signalLinks = root.querySelectorAll('a.ooh-operation-alpha__access-button, a.ooh-operation-alpha__runtime-button');
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
    setIntroGameplayBlocksVisible(root, false);
    signalLinks.forEach(function (link) {
      if ((link.textContent || '').trim() === ['ENTER', 'ACTIVE', 'RUNTIME'].join(' ')) {
        link.textContent = 'SELECT SIGNAL';
        link.setAttribute('aria-label', 'Select Operation Alpha audio signal');
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
      if (shouldSuppressIntroOverlay()) {
        storeSeenFlag();
        hideIntro(intro);
        showSignalModal(root);
      }
      else {
        bindOperationAlphaEnter(root, intro, enter);
      }
    }
    else {
      showSignalModal(root);
    }

    if (activationButton) {
      activationButton.addEventListener('click', function () {
        var storedSelection = getPlaylistSelection();
        var activationStatus = root.querySelector('[data-ooh-alpha-activation-status]');

        if (activationButton.disabled) {
          if (!storedSelection || !storedSelection.title) {
            syncFieldInitializeGate(root);
            if (activationStatus) {
              activationStatus.textContent = 'SELECT SIGNAL REQUIRED';
            }
          }
          return;
        }
        if (!storedSelection || !storedSelection.title) {
          syncFieldInitializeGate(root);
          if (activationStatus) {
            activationStatus.textContent = 'SELECT SIGNAL REQUIRED';
          }
          return;
        }
        activateOperationAlphaRuntime(root);
      });
    }
    if (signalGate) {
      syncSignalGate(root);
      signalGate.addEventListener('click', function (event) {
        if (signalGate.getAttribute('aria-disabled') === 'true') {
          event.preventDefault();
        }
      });
    }
    setupOperationAlphaAmbient(root);
    renderIntroSelectedSignal(root);
    syncFieldInitializeGate(root);
    root.querySelectorAll('[data-ooh-alpha-next-level]').forEach(function (link) {
      setIntroNextLocked(link, true);
      link.addEventListener('click', function (event) {
        if (link.getAttribute('aria-disabled') === 'true') {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      });
    });
    syncRuntimeControlLocks(root, null);
    initCommandConsole(root);
    initDirectorLayer(root);
    if (missionCycle) {
      missionCycle.addEventListener('click', function () {
        if (missionCycle.disabled) {
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

  function setupOperationAlphaAmbient(root) {
    var audio = root.querySelector('[data-ooh-alpha-ambient-audio]');

    if (!audio || audio.dataset.oohAlphaAmbientReady === '1') {
      return;
    }

    audio.dataset.oohAlphaAmbientReady = '1';
    audio.volume = 0.16;

    var tryPlay = function () {
      if (!audio.paused) {
        return;
      }

      audio.play().catch(function () {});
    };

    var retryOnInteraction = function () {
      tryPlay();
    };

    ['pointerdown', 'keydown', 'touchstart'].forEach(function (eventName) {
      document.addEventListener(eventName, retryOnInteraction, { once: true, passive: true });
    });

    tryPlay();
  }

  function pauseOperationAlphaAmbient(root) {
    var audio = root.querySelector('[data-ooh-alpha-ambient-audio]');

    if (!audio || audio.paused) {
      return;
    }

    audio.pause();
  }

  function renderIntroSelectedSignal(root) {
    var signalPanel = root.querySelector('[data-ooh-alpha-selected-signal]');
    var signalTitle = root.querySelector('[data-ooh-alpha-selected-signal-title]');
    var signalCopy = root.querySelector('[data-ooh-alpha-selected-signal-copy]');
    var storedSelection = getPlaylistSelection();
    var storedChannel = storedSelection ? channelBySlug(storedSelection.slug) || channelByLabel(storedSelection.title) : null;
    var moodTags = storedSelection && storedSelection.moodTags ? storedSelection.moodTags : (storedChannel ? storedChannel.moodTags : '');

    if (!signalPanel) {
      return;
    }

    if (!storedSelection || !storedSelection.title) {
      signalPanel.hidden = true;
      return;
    }

    signalPanel.hidden = false;
    if (signalTitle) {
      signalTitle.textContent = storedSelection.title;
    }
    if (signalCopy) {
      signalCopy.textContent = (moodTags ? moodTags + '. ' : '') + 'Field initialization available.';
    }
  }

  function syncSignalGate(root) {
    var gate = root.querySelector('[data-ooh-alpha-signal-gate]');
    var storedSelection = getPlaylistSelection();
    var signalPath = routePath('/operation-alpha/oaplay/playlists');

    if (!gate) {
      return;
    }
    gate.href = signalPath;
    gate.textContent = 'SELECT SIGNAL';
    gate.setAttribute('aria-label', gate.textContent + ' for Operation Alpha');
    gate.setAttribute('aria-disabled', 'false');
    gate.classList.remove('is-signal-gate-locked');
    gate.classList.add('is-signal-gate-ready');
    renderIntroSelectedSignal(root);
  }

  function syncFieldInitializeGate(root) {
    var activationButton = root.querySelector('[data-ooh-alpha-activate]');
    var activationStatus = root.querySelector('[data-ooh-alpha-activation-status]');
    var storedSelection = getPlaylistSelection();
    var initialized = root.classList.contains('is-runtime-acknowledged');
    var locked = !storedSelection || !storedSelection.title;

    if (!activationButton) {
      return;
    }
    activationButton.disabled = locked || initialized;
    activationButton.classList.toggle('is-oa-control-disabled', locked && !initialized);
    activationButton.setAttribute('aria-disabled', activationButton.disabled ? 'true' : 'false');
    activationButton.setAttribute('tabindex', activationButton.disabled ? '-1' : '0');
    activationButton.textContent = initialized ? 'FIELD INITIALIZED' : 'INITIALIZE FIELD';
    if (activationStatus && !initialized) {
      activationStatus.textContent = locked ? 'Select signal before field initialization.' : storedSelection.title + ' selected. Field initialization available.';
    }
    renderIntroSelectedSignal(root);
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
      channelLink.textContent = 'OPEN CHANNEL';
      channelLink.setAttribute('target', '_blank');
      channelLink.setAttribute('rel', 'noopener noreferrer');
      channelLink.removeAttribute('aria-disabled');
      channelLink.hidden = false;
      channelLink.setAttribute('aria-label', 'Open selected Operation Alpha signal');
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
        var confirmation = root.querySelector('[data-ooh-alpha-playlist-confirmation]');
        var handoff = root.querySelector('[data-ooh-alpha-runtime-handoff]');

        if (slug === 'system-reset' || slug === 'system-reset-free') {
          resetOAIntroRunState(false);
          root.querySelectorAll('[data-ooh-alpha-playlist-card]').forEach(function (playlistCard) {
            playlistCard.classList.remove('is-selected');
          });
          root.querySelectorAll('[data-ooh-alpha-playlist-select]').forEach(function (selectButton) {
            selectButton.textContent = 'SELECT SIGNAL';
            selectButton.removeAttribute('aria-pressed');
          });
          if (confirmation) {
            confirmation.textContent = 'Full reset complete. Select a signal to begin a clean run.';
          }
          if (handoff) {
            handoff.hidden = true;
          }
          return;
        }

        storePlaylistSelection(slug, title, spotifyUrl, moodTags);
        setActivePlaylist(root, slug, title, spotifyUrl, moodTags);
      });
    });

    if (proceed) {
      proceed.setAttribute('aria-label', 'Return to Operation Alpha intro storyblock');
      proceed.setAttribute('href', routePath('/operation-alpha'));
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
        channelLink.href = routePath('/operation-alpha/oaplay/playlists');
        channelLink.textContent = 'SELECT SIGNAL';
        channelLink.removeAttribute('target');
        channelLink.removeAttribute('rel');
        channelLink.removeAttribute('aria-disabled');
        channelLink.hidden = false;
        channelLink.setAttribute('aria-label', 'Select Operation Alpha signal');
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

  function findOperationAlphaRoots(context, selector) {
    var scope = context || document;
    var roots = [];

    if (scope.matches && scope.matches(selector)) {
      roots.push(scope);
    }
    if (scope.querySelectorAll) {
      scope.querySelectorAll(selector).forEach(function (root) {
        roots.push(root);
      });
    }

    return roots;
  }

  function initOperationAlphaRoot(root) {
    bindOperationAlphaEnter(root);

    if (root.oohAlphaGateInitialized) {
      return;
    }

    root.oohAlphaGateInitialized = true;
    initOperationAlphaGate(root);
  }

  function attachOperationAlphaGate(context) {
    if (document.body) {
      document.body.classList.add('ooh-operation-alpha-runtime');
    }

    findOperationAlphaRoots(context, '[data-ooh-operation-alpha]').forEach(initOperationAlphaRoot);
  }

  function init() {
    attachOperationAlphaGate(document);
    document.querySelectorAll('[data-ooh-operation-alpha-playlists]').forEach(initPlaylistShell);
    document.querySelectorAll('[data-ooh-operation-alpha-runtime]').forEach(initRuntimeShell);
    document.querySelectorAll('[data-ooh-operation-alpha-credits]').forEach(initCreditsShell);
    document.querySelectorAll('[data-ooh-operation-alpha-operation]').forEach(renderOperationSurface);
  }

  if (window.Drupal && window.Drupal.behaviors) {
    window.Drupal.behaviors.oohOperationAlpha = {
      attach: function (context) {
        attachOperationAlphaGate(context || document);
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
  else {
    init();
  }
})();
