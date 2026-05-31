(function () {
  'use strict';

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
      state: 'HOLD POSITION',
      acknowledgement: 'UNSEEN HAND DIRECTIVE RECEIVED // HOLD POSITION',
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
      state: 'ADVANCE',
      acknowledgement: 'FORWARD PRESSURE AUTHORIZED',
      runtimeCopy: 'Advance directive active. Forward pressure authorized.',
      activationStatus: 'Advance directive accepted. Field pressure moving forward.',
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
      state: 'EXTRACT',
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
      state: 'DEPLOY SIGNAL',
      acknowledgement: 'SIGNAL DEPLOYMENT AUTHORIZED',
      runtimeCopy: 'Deploy Signal directive active. False traffic entering the mark channel.',
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
      state: 'DIVERT',
      acknowledgement: 'OPERATIONAL ATTENTION REDIRECTED',
      runtimeCopy: 'Divert directive active. Operational attention redirected.',
      activationStatus: 'Divert directive accepted. Focus is bending away from the exposed line.',
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

    scenario.buttons.forEach(function (label, buttonIndex) {
      var button = document.createElement('button');
      button.className = 'ooh-operation-alpha__intervention';
      button.type = 'button';
      button.textContent = label;
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

  function actorPortraitFilename(pathSlug, factionSlug, nameSlug) {
    return 'oa_' + pathSlug + '_' + factionSlug + '_' + nameSlug + '.webp';
  }

  function actorPortraitCandidates(actor) {
    var pathSlug = actorRegistrySlug(actor.path);
    var factionSlug = actorRegistrySlug(actor.faction === 'Genealord' ? 'Unknown' : actor.faction);
    var nameSlug = actorPortraitNameSlug(actor);
    var pathAliases = actorSlugAliases(pathSlug);
    var nameAliases = actorSlugAliases(nameSlug);
    var candidates = [];

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

      if (candidates.length) {
        return candidates;
      }
    }

    candidates.push(operationAlphaRootPath('/operation_alpha/generated_actor_registry/portraits/' + actorPortraitFilename(pathSlug, factionSlug, nameSlug)));
    candidates.push(operationAlphaRootPath('/operation_alpha/portraits/' + actorPortraitFilename(pathSlug, factionSlug, nameSlug)));

    return candidates;
  }

  function actorPortraitPath(actor) {
    var candidates = actorPortraitCandidates(actor);

    return candidates[0] || '';
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
    var channelLine = payload.playlist ? ' through ' + payload.playlist : '';
    var moodLine = payload.channelMood ? ', carrying ' + payload.channelMood.toLowerCase() : '';
    var pressures = {
      'Signal Distortion': 'Signal distortion bent the report into fragments' + channelLine + moodLine + '.',
      'Storm Interference': 'Storm interference pressed static into every relay' + channelLine + moodLine + '.',
      'Low Visibility': 'Low visibility kept the corridor uncertain' + channelLine + moodLine + '.',
      'Contact Trace': 'A contact trace followed close enough to change the room' + channelLine + moodLine + '.',
      'Route Instability': 'Route instability shifted the path before the report could settle' + channelLine + moodLine + '.'
    };

    return pressures[payload.condition] || payload.condition + ' shaped the observation window' + channelLine + moodLine + '.';
  }

  function narrativeConsequence(payload) {
    var status = payload.consequence ? payload.consequence.status : 'UNKNOWN';
    var endings = {
      SUCCESS: 'The channel held long enough for observation to continue.',
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
    observe: 'OBSERVE',
    'hold-channel': 'HOLD CHANNEL',
    'escalate-pressure': 'ESCALATE PRESSURE',
    'divert-asset': 'DIVERT ASSET',
    'authorize-extraction': 'AUTHORIZE EXTRACTION'
  };

  var directorReactionTemplates = {
    observe: [
      'The feed remained open long enough to confirm movement beyond the relay glass.',
      '{asset} stayed inside the observation window while {condition} continued to distort the field.',
      'The Unseen Hand held position. {channel} carried enough signal to preserve the next report.'
    ],
    'hold-channel': [
      'The channel held, but the report degraded into clipped fragments.',
      '{channel} stayed available under {mood}. The feed narrowed without closing.',
      'The Unseen Hand held the channel steady while {operation} continued under pressure.'
    ],
    'escalate-pressure': [
      'Pressure increased across the active perimeter. The asset continued without confirmation.',
      '{condition} intensified after pressure was raised. {asset} remained visible only through broken signal.',
      'The Director increased pressure through {channel}. The field answered with sharper static.'
    ],
    'divert-asset': [
      'The route changed before the field team acknowledged the order.',
      '{asset} shifted away from the cleanest line as {condition} spread across the corridor.',
      'The Unseen Hand bent the route. {operation} continued, but the feed lost depth.'
    ],
    'authorize-extraction': [
      'Extraction was authorized, but the channel did not confirm receipt.',
      'The extraction window opened under {mood}. {asset} remained inside the report for one more beat.',
      'The Director authorized withdrawal. {channel} carried the order into unstable signal.'
    ]
  };

  function directorTemplateValue(payload, key) {
    var values = {
      asset: payload.actorName,
      operation: payload.mission,
      condition: payload.condition,
      channel: payload.playlist,
      mood: payload.channelMood ? payload.channelMood.toLowerCase() : 'unresolved channel mood',
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
      playlist.textContent = payload.channelMood ? payload.playlist + ' // ' + payload.channelMood : payload.playlist;
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
      channelLink.href = payload.playlistUrl;
      channelLink.textContent = 'OPEN CHANNEL';
      channelLink.setAttribute('target', '_blank');
      channelLink.setAttribute('rel', 'noopener noreferrer');
      channelLink.removeAttribute('aria-disabled');
      channelLink.hidden = false;
      channelLink.setAttribute('aria-label', 'Open ' + payload.playlist + ' signal channel on Spotify');
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
      narrativeCopy.textContent = payload.narrativeSeed;
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
    var selectedActor;

    if (!eligibleActors.length) {
      return;
    }

    selectedActor = eligibleActors[Math.floor(Math.random() * eligibleActors.length)];
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

  function setActiveCommand(root, commandKey) {
    var directive = commandDirectives[commandKey];
    var state = root.querySelector('[data-ooh-alpha-command-state]');
    var acknowledgement = root.querySelector('[data-ooh-alpha-command-ack]');
    var runtimeCopy = root.querySelector('[data-ooh-alpha-runtime-copy]');
    var activationStatus = root.querySelector('[data-ooh-alpha-activation-status]');
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');

    if (!directive || !state || !acknowledgement) {
      return;
    }

    root.oohAlphaCommand = commandKey;
    state.textContent = directive.state;
    acknowledgement.textContent = directive.acknowledgement;
    if (runtimeCopy) {
      runtimeCopy.textContent = directive.runtimeCopy;
    }
    if (activationStatus) {
      activationStatus.textContent = directive.activationStatus;
    }
    if (reaction) {
      reaction.textContent = directive.reaction;
    }
    if (pressure) {
      pressure.textContent = directive.pressure;
    }
    setBattlefieldPresence(root, directive.battlefield);
    setAssetMovementFeed(root, directive.movementMode);

    root.querySelectorAll('[data-ooh-alpha-command]').forEach(function (button) {
      if (button.getAttribute('data-ooh-alpha-command') === commandKey) {
        button.classList.add('is-command-active');
        button.setAttribute('aria-pressed', 'true');
      }
      else {
        button.classList.remove('is-command-active');
        button.removeAttribute('aria-pressed');
      }
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

  function activateOperationAlphaRuntime(root) {
    var runtimeCopy = root.querySelector('[data-ooh-alpha-runtime-copy]');
    var activationStatus = root.querySelector('[data-ooh-alpha-activation-status]');
    var activationButton = root.querySelector('[data-ooh-alpha-activate]');
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var contact = root.querySelector('[data-ooh-alpha-contact]');

    root.classList.add('is-runtime-acknowledged');

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
    renderMission(root, 0, 0);
    setAtmosphere(root, 0);
    selectOperationAlphaActor(root);
  }

  function setInterventionsDisabled(root, disabled) {
    root.querySelectorAll('.ooh-operation-alpha__intervention').forEach(function (button) {
      button.disabled = disabled;
    });
  }

  function triggerIntervention(root, scenario, buttonIndex) {
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var nextIndex = ((root.oohAlphaScenarioIndex || 0) + 1) % scenarios.length;
    var nextContactIndex;
    var nextAtmosphereIndex;

    setInterventionsDisabled(root, true);
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

    window.clearTimeout(root.oohAlphaScenarioTimer);
    root.oohAlphaScenarioTimer = window.setTimeout(function () {
      renderScenario(root, nextIndex);
    }, scenarioDelayMs);
  }

  function initOperationAlphaGate(root) {
    var intro = root.querySelector('[data-ooh-operation-alpha-intro]');
    var enter = root.querySelector('[data-ooh-operation-alpha-enter]');
    var activationButton = root.querySelector('[data-ooh-alpha-activate]');
    var missionCycle = root.querySelector('[data-ooh-alpha-mission-cycle]');

    initActorRegistry(root);
    initSignalModal(root);

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
        cycleMission(root);
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
        channelLink.textContent = 'OPEN CHANNEL';
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
