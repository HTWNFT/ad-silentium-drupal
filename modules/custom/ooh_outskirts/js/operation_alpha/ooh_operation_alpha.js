(function () {
  'use strict';

  var storageKey = 'ooh_operation_alpha_intro_seen_v1';
  var signalStorageKey = 'ooh_operation_alpha_signal_dismissed_v1';
  var playlistStorageKey = 'ooh_operation_alpha_playlist_selection_v1';
  var scenarioDelayMs = 1500;
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
      battlefield: {
        field: 'Observation priority increased across Sector 17.',
        movement: 'Friendly elements holding shadow line.',
        signal: 'Contact risk contained under low-band silence.'
      }
    },
    advance: {
      state: 'ADVANCE',
      acknowledgement: 'FORWARD PRESSURE AUTHORIZED',
      battlefield: {
        field: 'Forward pressure building beyond the fog line.',
        movement: 'Ronin scout element pushing toward the mark channel.',
        signal: 'Contact risk increasing along hostile sweep bands.'
      }
    },
    extract: {
      state: 'EXTRACT',
      acknowledgement: 'EXTRACTION ORDER ISSUED',
      battlefield: {
        field: 'Extraction corridor opening through unstable cover.',
        movement: 'Civilian route markers shifting toward safe passage.',
        signal: 'Exposure decreasing as pursuit traffic thins.'
      }
    },
    signal: {
      state: 'DEPLOY SIGNAL',
      acknowledgement: 'SIGNAL DEPLOYMENT AUTHORIZED',
      battlefield: {
        field: 'False traffic inserted into the outer approach.',
        movement: 'Hostile attention splitting across duplicate traces.',
        signal: 'Signal confusion spreading near the mark channel.'
      }
    },
    divert: {
      state: 'DIVERT',
      acknowledgement: 'OPERATIONAL ATTENTION REDIRECTED',
      battlefield: {
        field: 'Operational attention redirected away from exposed movement.',
        movement: 'Asset path bending through secondary cover.',
        signal: 'Decoy pressure rising on the wrong corridor.'
      }
    }
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

    if (!directive || !state || !acknowledgement) {
      return;
    }

    root.oohAlphaCommand = commandKey;
    state.textContent = directive.state;
    acknowledgement.textContent = directive.acknowledgement;
    setBattlefieldPresence(root, directive.battlefield);

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
    if (missionCycle) {
      missionCycle.addEventListener('click', function () {
        cycleMission(root);
      });
    }
  }

  function storePlaylistSelection(slug, title) {
    try {
      window.localStorage.setItem(playlistStorageKey, JSON.stringify({
        slug: slug,
        title: title
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

  function setActivePlaylist(root, slug, title) {
    var confirmation = root.querySelector('[data-ooh-alpha-playlist-confirmation]');
    var handoff = root.querySelector('[data-ooh-alpha-runtime-handoff]');
    var handoffTitle = root.querySelector('[data-ooh-alpha-runtime-title]');
    var handoffCopy = root.querySelector('[data-ooh-alpha-runtime-copy]');
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
      handoffCopy.textContent = 'Signal selected. Runtime handoff pending.';
    }
  }

  function initPlaylistShell(root) {
    var proceed = root.querySelector('[data-ooh-alpha-runtime-proceed]');
    var storedSelection = getPlaylistSelection();

    if (storedSelection && storedSelection.slug && storedSelection.title) {
      setActivePlaylist(root, storedSelection.slug, storedSelection.title);
    }

    root.querySelectorAll('[data-ooh-alpha-playlist-select]').forEach(function (button) {
      button.addEventListener('click', function () {
        var slug = button.getAttribute('data-playlist-slug') || '';
        var title = button.getAttribute('data-playlist-title') || 'SELECTED SIGNAL';

        storePlaylistSelection(slug, title);
        setActivePlaylist(root, slug, title);
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
    var storedSelection = getPlaylistSelection();

    if (storedSelection && storedSelection.title) {
      if (signal) {
        signal.textContent = storedSelection.title;
      }
      if (status) {
        status.textContent = 'Runtime shell received local signal selection. Gameplay authority pending.';
      }
    }
    else if (status) {
      status.textContent = 'Runtime shell standing by. Select a signal before active runtime activation.';
    }
  }

  function init() {
    if (document.body) {
      document.body.classList.add('ooh-operation-alpha-runtime');
    }

    document.querySelectorAll('[data-ooh-operation-alpha]').forEach(initOperationAlphaGate);
    document.querySelectorAll('[data-ooh-operation-alpha-playlists]').forEach(initPlaylistShell);
    document.querySelectorAll('[data-ooh-operation-alpha-runtime]').forEach(initRuntimeShell);
    document.querySelectorAll('[data-ooh-operation-alpha-operation]').forEach(renderOperationSurface);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
  else {
    init();
  }
})();
