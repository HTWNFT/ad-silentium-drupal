(function (Drupal, once, drupalSettings) {
  'use strict';

  const stateKey = 'ooh_game_generator_state_v1';

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    }
    catch (e) {
      return fallback;
    }
  }

  function itemLabel(item, fallback) {
    return item && item.label ? item.label : fallback;
  }

  function routeIdFromPayload(payload) {
    const route = payload.campaignRoute || {};
    const routeId = route.id || payload.campaignRouteId || '';
    return ['aer', 'mare', 'terra'].indexOf(routeId) !== -1 ? routeId : 'terra';
  }

  function routeLabel(routeId) {
    const labels = {
      aer: 'AER',
      mare: 'MARE',
      terra: 'TERRA'
    };
    return labels[routeId] || 'TERRA';
  }

  function routeAttribute(routeId) {
    return routeLabel(routeId);
  }

  function missionTypeAttribute(payload) {
    return cleanId(payload.missionType || ((payload.mission || {}).id), 'unconfirmed');
  }

  // Deterministic route asset map. Entries point at local public files and are optional:
  // the CSS route gradients remain the fallback whenever an image or passive loop is missing.
  const sceneAssetMap = {
    aer: {
      image: '/STIKWALLET11202025/sites/default/files/outskirts/backgrounds/bg_underboard_alley_signal_drift.webp',
      video: '/STIKWALLET11202025/sites/default/files/outskirts/loops/video_loops_underboard_alley_signal_drift.mp4',
      label: 'AER route asset: upper corridor signal drift'
    },
    mare: {
      image: '/STIKWALLET11202025/sites/default/files/outskirts/backgrounds/bg_neon_bog_core.webp',
      video: '/STIKWALLET11202025/sites/default/files/outskirts/loops/video_loops_neon_fog_marsh_core.mp4',
      label: 'MARE route asset: submerged pressure fog'
    },
    terra: {
      image: '/STIKWALLET11202025/sites/default/files/outskirts/backgrounds/bg_wasteland_ridge_aftermath_quiet.webp',
      video: '/STIKWALLET11202025/sites/default/files/outskirts/loops/video_loops_wasteland_ridge_core.mp4',
      label: 'TERRA route asset: wasteland ridge'
    }
  };

  function cleanId(value, fallback) {
    const cleaned = String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return cleaned || fallback;
  }

  function getRouteLanguage(routeId) {
    const routes = {
      aer: {
        theater: 'High-altitude sky corridor. Unstable cloud cover. Thin margin for error.',
        insertion: 'Aerial insertion. Crosswind entry. Precision timing required.',
        hazards: 'Wind shear. Altitude loss. Cloudblind telemetry.',
        extraction: 'Hold the corridor until the extraction craft breaks cloudline.',
        creditType: 'AIR Route Credit',
        threatNoun: 'aerial interdiction',
        routeWord: 'SKY'
      },
      mare: {
        theater: 'Submerged ruin field. Pressure rising. Isolation absolute.',
        insertion: 'Below-waterline entry. Oxygen discipline. No surface noise.',
        hazards: 'Crushing pressure. Oxygen bleed. Black currents. Ruin collapse.',
        extraction: 'Reach the waterline before pressure locks the route.',
        creditType: 'OCEAN Route Credit',
        threatNoun: 'pressure-zone contact',
        routeWord: 'DEPTH'
      },
      terra: {
        theater: 'Ash front. Broken bunkers. Collapsed structures across the ground line.',
        insertion: 'Ground traversal through ruin cover and bunker thresholds.',
        hazards: 'Ash fall. Dead zones. Structural collapse. Hostile surface lanes.',
        extraction: 'Clear the last surface marker. Hold for wasteland extraction.',
        creditType: 'LAND Route Credit',
        threatNoun: 'ground-route contact',
        routeWord: 'RUIN'
      }
    };

    return routes[routeId] || routes.terra;
  }

  function selectedAttributeText(payload) {
    const attributes = Array.isArray(payload.selectedAttributes) ? payload.selectedAttributes : [];
    if (!attributes.length) {
      return 'baseline discipline';
    }
    if (attributes.length === 1) {
      return attributes[0];
    }
    return attributes.slice(0, 3).join(' / ');
  }

  function getMissionObjective(missionType, routeId) {
    const route = getRouteLanguage(routeId);
    const missionKey = cleanId(missionType, 'mission');
    const objectiveMap = [
      {
        match: ['scout', 'recon', 'survey'],
        code: 'RECON',
        primary: 'Map the forward route. Mark the signal break.',
        secondary: 'Tag three observation points. Avoid escalation.',
        threat: 'Low-signature ' + route.threatNoun + '. Watching the survey line.'
      },
      {
        match: ['assault', 'strike', 'breach'],
        code: 'BREACH',
        primary: 'Break the active node. Collapse command signal.',
        secondary: 'Confirm the route survives the strike window.',
        threat: 'Concentrated ' + route.threatNoun + '. Holding the breach vector.'
      },
      {
        match: ['infiltrate', 'infiltration', 'stealth'],
        code: 'GHOST',
        primary: 'Enter silent. Extract the classified marker.',
        secondary: 'Plant false telemetry behind the line.',
        threat: 'Passive ' + route.threatNoun + '. Tuned to heat and movement.'
      },
      {
        match: ['survive', 'hold', 'endure'],
        code: 'HOLD',
        primary: 'Hold the marker. Keep the route alive.',
        secondary: 'Maintain signal through every surge.',
        threat: 'Escalating ' + route.threatNoun + '. Closing on the hold zone.'
      }
    ];

    const matched = objectiveMap.find(function (entry) {
      return entry.match.some(function (keyword) {
        return missionKey.indexOf(keyword) !== -1;
      });
    });

    return matched || {
      code: 'VERIFY',
      primary: 'Advance on route. Verify the mission signal.',
      secondary: 'Recover proof of passage. Keep the channel clean.',
      threat: 'Unclassified ' + route.threatNoun + '. Responding to the channel.'
    };
  }

  function recruiterPathKey(payload) {
    const values = [
      (payload.path || {}).id,
      (payload.path || {}).label,
      (payload.character || {}).pathId,
      (payload.character || {}).pathLabel
    ].join(' ').toLowerCase();

    if (values.indexOf('doomed') !== -1) {
      return 'DOOMED';
    }
    if (values.indexOf('merged') !== -1) {
      return 'MERGED';
    }
    return itemLabel(payload.path, 'UNASSIGNED').toUpperCase();
  }

  function getRecruiterDirective(payload) {
    const recruiter = payload.recruiter || {};
    const character = payload.character || {};
    const recruiterName = recruiter.name || character.recruiterName || 'Unassigned recruiter';
    const attributes = selectedAttributeText(payload);
    const pathKey = recruiterPathKey(payload);

    if (pathKey === 'DOOMED') {
      return recruiterName + ': hit hard. Burn fear down. Survive on ' + attributes + '.';
    }
    if (pathKey === 'MERGED') {
      return recruiterName + ': execute clean. Suppress noise. Calculate with ' + attributes + '.';
    }
    return recruiterName + ': proceed under ' + pathKey + ' protocol. Carry ' + attributes + '.';
  }

  function getPlaylistMoodEffect(payload) {
    const playlistLabel = itemLabel(payload.playlist, 'No playlist selected');
    const playlistKey = cleanId((payload.playlist || {}).id || playlistLabel, 'playlist');
    const moodMap = [
      {
        match: ['black', 'banner', 'orchestra', 'war', 'bangaz'],
        text: 'reinforces command-scale tension and operational dread'
      },
      {
        match: ['rock', 'riot', 'metal'],
        text: 'pushes impact, grit, and forward pressure'
      },
      {
        match: ['rap', 'drill', 'trap'],
        text: 'adds pulse, aggression, and close-range focus'
      },
      {
        match: ['ambient', 'drone', 'void'],
        text: 'lowers the room into static, distance, and threat awareness'
      }
    ];
    const matched = moodMap.find(function (entry) {
      return entry.match.some(function (keyword) {
        return playlistKey.indexOf(keyword) !== -1 || playlistLabel.toLowerCase().indexOf(keyword) !== -1;
      });
    });
    const mood = matched ? matched.text : 'sets tension, tempo, and operational focus';

    return playlistLabel.toUpperCase() + ' ' + mood + '.';
  }

  function playlistMoodAttribute(payload) {
    const playlistLabel = itemLabel(payload.playlist, '');
    const playlistKey = cleanId((payload.playlist || {}).id || playlistLabel, 'neutral');

    if (/(black|banner|orchestra|war)/.test(playlistKey)) {
      return 'dread';
    }
    if (/(rock|riot|metal)/.test(playlistKey)) {
      return 'impact';
    }
    if (/(rap|drill|trap)/.test(playlistKey)) {
      return 'pulse';
    }
    if (/(ambient|drone|void)/.test(playlistKey)) {
      return 'void';
    }
    return 'neutral';
  }

  function buildSceneStatus(routeId, pathKey, missionLabel) {
    const routeStates = {
      aer: 'Sky corridor staged. Wind shear simulated. No flight order issued.',
      mare: 'Pressure zone staged. Waterline distortion active. No dive order issued.',
      terra: 'Ash field staged. Bunker silhouettes indexed. No ground order issued.'
    };
    const pathTone = pathKey === 'DOOMED' ?
      ' DOOMED overlay unstable.' :
      (pathKey === 'MERGED' ? ' MERGED overlay synchronized.' : '');

    return (routeStates[routeId] || routeStates.terra) + pathTone + ' Mission type: ' + missionLabel + '.';
  }

  function buildActiveSceneStatus(routeId, pathKey, missionLabel) {
    const routeStates = {
      aer: 'MISSION ACTIVE. Sky corridor live. Maintain altitude discipline.',
      mare: 'MISSION ACTIVE. Pressure zone live. Maintain oxygen discipline.',
      terra: 'MISSION ACTIVE. Ground route live. Maintain signal discipline.'
    };
    const pathTone = pathKey === 'DOOMED' ?
      ' DOOMED presentation channel unstable.' :
      (pathKey === 'MERGED' ? ' MERGED presentation channel synchronized.' : '');

    return (routeStates[routeId] || routeStates.terra) + pathTone + ' Mission type: ' + missionLabel + '.';
  }

  function buildCombatShellSceneStatus(routeId, pathKey, missionLabel) {
    const routeStates = {
      aer: 'COMBAT SHELL ARMED. Sky corridor contact confirmed. Maintain altitude discipline.',
      mare: 'COMBAT SHELL ARMED. Pressure-zone contact confirmed. Maintain oxygen discipline.',
      terra: 'COMBAT SHELL ARMED. Ground-route contact confirmed. Maintain signal discipline.'
    };
    const pathTone = pathKey === 'DOOMED' ?
      ' DOOMED channel elevated.' :
      (pathKey === 'MERGED' ? ' MERGED channel tracking clean.' : '');

    return (routeStates[routeId] || routeStates.terra) + pathTone + ' Mission type: ' + missionLabel + '.';
  }

  function routeHudTelemetry(routeId) {
    const telemetry = {
      aer: ['ALTITUDE HOLD', 'CLOUDLINE LOCK', 'WIND SHEAR WATCH'],
      mare: ['PRESSURE WATCH', 'OXYGEN DISCIPLINE', 'CURRENT VECTOR'],
      terra: ['DUST INDEX', 'GROUND SIGNAL', 'RUIN VISIBILITY']
    };
    return telemetry[routeId] || telemetry.terra;
  }

  function routeActionLanguage(routeId) {
    const language = {
      aer: {
        scan: 'Cloudline scan complete',
        hold: 'Altitude hold confirmed',
        signal: 'Corridor signal verified'
      },
      mare: {
        scan: 'Pressure field scan complete',
        hold: 'Depth hold confirmed',
        signal: 'Waterline signal verified'
      },
      terra: {
        scan: 'Ruin scan complete',
        hold: 'Ground hold confirmed',
        signal: 'Bunker signal verified'
      }
    };
    return language[routeId] || language.terra;
  }

  function pathActionTone(pathKey) {
    if (pathKey === 'DOOMED') {
      return ' Unstable channel burns hot.';
    }
    if (pathKey === 'MERGED') {
      return ' Synthetic channel remains clean.';
    }
    return ' Channel remains passive.';
  }

  function scrollToMissionBriefing(root) {
    const target = root.querySelector('[data-ooh-mission-briefing]') ||
      root.querySelector('[data-ooh-play-top]') ||
      root;

    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function passiveActionText(action, routeId, pathKey) {
    const language = routeActionLanguage(routeId);
    const fallback = language.scan;
    const text = language[action] || fallback;
    return text + '.' + pathActionTone(pathKey);
  }

  function triggerPassiveAction(root, shell, action, routeId, pathKey) {
    if (!root.classList.contains('is-mission-active')) {
      return;
    }

    const readout = root.querySelector('[data-ooh-action-readout]');
    if (readout) {
      readout.textContent = passiveActionText(action, routeId, pathKey);
    }

    if (!shell) {
      return;
    }

    shell.classList.remove('is-action-pulse', 'is-scan-pulse', 'is-hold-pulse', 'is-signal-pulse');
    void shell.offsetWidth;
    shell.classList.add('is-action-pulse', 'is-' + action + '-pulse');
    window.setTimeout(function () {
      shell.classList.remove('is-action-pulse', 'is-scan-pulse', 'is-hold-pulse', 'is-signal-pulse');
    }, 650);
  }

  const encounterActionStatusText = {
    target: 'TARGET LOCK ATTEMPT',
    evade: 'EVASIVE MANEUVER INITIATED',
    suppress: 'SUPPRESSION FIELD PROJECTED'
  };

  const encounterActionContactState = {
    target: 'targeting',
    evade: 'evading',
    suppress: 'suppressing'
  };

  const encounterActionPulseText = {
    target: 'CONTACT SIGNATURE NARROWING...',
    evade: 'VECTOR SHIFT REGISTERED...',
    suppress: 'SUPPRESSION FIELD CHARGING...'
  };

  const enemyContactProfileFields = [
    ['category', 'CATEGORY'],
    ['factionFamily', 'FACTION FAMILY'],
    ['speciesBase', 'SPECIES BASE'],
    ['allegianceState', 'ALLEGIANCE'],
    ['dispositionState', 'DISPOSITION'],
    ['behaviorState', 'BEHAVIOR STATE'],
    ['movementType', 'MOVEMENT'],
    ['threatRole', 'THREAT ROLE'],
    ['behaviorMode', 'BEHAVIOR'],
    ['description', 'DESCRIPTION']
  ];

  const enemyMovementTagFields = [
    ['terrainAffinity', 'TERRAIN'],
    ['locomotionClass', 'LOCOMOTION'],
    ['formationStyle', 'FORMATION'],
    ['engagementRange', 'RANGE'],
    ['mobilityNote', 'MOBILITY NOTE']
  ];

  const enemyMissionAffinityFields = [
    ['primaryMissionType', 'PRIMARY MISSION'],
    ['secondaryMissionType', 'SECONDARY'],
    ['environmentalUse', 'ENVIRONMENT'],
    ['tacticalUse', 'TACTICAL USE']
  ];

  const enemyBehaviorIntentFields = [
    ['defaultIntent', 'DEFAULT INTENT'],
    ['cautionTrigger', 'CAUTION TRIGGER'],
    ['hostileTrigger', 'HOSTILE TRIGGER'],
    ['supportTrigger', 'SUPPORT TRIGGER'],
    ['retreatTrigger', 'RETREAT TRIGGER']
  ];

  const enemyTriggerPreviewFields = [
    ['cautionTrigger', 'CAUTION TRIGGER'],
    ['hostileTrigger', 'HOSTILE TRIGGER'],
    ['supportTrigger', 'SUPPORT TRIGGER'],
    ['retreatTrigger', 'RETREAT TRIGGER']
  ];

  const triggerSelectorOptions = ['none', 'caution', 'hostile', 'support', 'retreat'];

  const triggerOutcomePreviewText = {
    none: 'NO TRIGGER SELECTED',
    caution: 'CONTACT WOULD ENTER CAUTION REVIEW',
    hostile: 'CONTACT WOULD REQUIRE HOSTILITY CHECK',
    support: 'CONTACT WOULD REQUIRE SUPPORT ALIGNMENT CHECK',
    retreat: 'CONTACT WOULD REQUIRE RETREAT PATH CHECK'
  };

  const passiveBehaviorPreviewText = {
    hippo_ronin: {
      none: 'CONTACT HOLDS WATERLINE UNDER OBSERVATION',
      caution: 'CONTACT WOULD SHIFT WEIGHT TOWARD BREACH ROUTE',
      hostile: 'CONTACT WOULD PREPARE IMPACT CHARGE',
      support: 'CONTACT WOULD HOLD LINE AGAINST SHARED PRESSURE',
      retreat: 'CONTACT WOULD WITHDRAW INTO DEEP WATER'
    },
    leech_ronin: {
      none: 'CONTACT REMAINS DORMANT IN CLUSTER',
      caution: 'CONTACT WOULD TIGHTEN CLUSTER RANGE',
      hostile: 'CONTACT WOULD PREPARE DRAIN SWARM',
      support: 'CONTACT WOULD DISRUPT ENEMY ADVANCE',
      retreat: 'CONTACT WOULD FALL BACK FROM LIGHT / HEAT'
    },
    bee_ronin: {
      none: 'CONTACT SWARM CONTINUES FORMING',
      caution: 'CONTACT WOULD RAISE SWARM DENSITY',
      hostile: 'CONTACT WOULD PREPARE STING PASS',
      support: 'CONTACT WOULD CREATE AREA DENIAL SCREEN',
      retreat: 'CONTACT WOULD DISPERSE THROUGH SIGNAL NOISE'
    },
    owl_ronin: {
      none: 'CONTACT MAINTAINS AERIAL OVERWATCH',
      caution: 'CONTACT WOULD ADJUST DIVE ANGLE',
      hostile: 'CONTACT WOULD PREPARE TARGET MARK',
      support: 'CONTACT WOULD PROVIDE AER TARGETING SUPPORT',
      retreat: 'CONTACT WOULD EXIT THROUGH CLOUD COVER'
    }
  };

  const triggerStateTransitionPreview = {
    none: null,
    caution: 'CAUTIOUS',
    hostile: 'THREATENING',
    support: 'SUPPORT-READY',
    retreat: 'WITHDRAWING'
  };

  const enemyContactArchetypes = [
    {
      id: 'hippo_mutant',
      label: 'HIPPO MUTANT',
      profile: {
        category: 'MUTANT',
        factionFamily: 'MUTANT',
        speciesBase: 'HIPPO',
        allegianceState: 'NEUTRAL',
        dispositionState: 'WATCHING',
        behaviorState: 'HOLDING',
        movementType: 'AMPHIBIOUS HEAVY',
        threatRole: 'BREACHER',
        behaviorMode: 'OBSERVING',
        description: 'Mutant heavy contact that anchors breach points and flooded routes.'
      },
      movementTags: {
        terrainAffinity: 'WATER / MUD / BREACH POINT',
        locomotionClass: 'AMPHIBIOUS HEAVY',
        formationStyle: 'SOLO PRESSURE',
        engagementRange: 'CLOSE / IMPACT',
        mobilityNote: 'SLOW LAND PUSH, FAST WATER AMBUSH'
      },
      missionAffinity: {
        primaryMissionType: 'WATER / BREACH',
        secondaryMissionType: 'LAND ASSAULT',
        environmentalUse: 'RIVER, SWAMP, FLOODED RUINS',
        tacticalUse: 'BREAKS LINES, BLOCKS ESCAPE ROUTES'
      },
      behaviorIntent: {
        defaultIntent: 'HOLD TERRITORY',
        cautionTrigger: 'PLAYER ENTERS WATERLINE',
        hostileTrigger: 'BREACH ROUTE BLOCKED',
        supportTrigger: 'SHARED ENEMY PRESSURE',
        retreatTrigger: 'DEEP WATER WITHDRAWAL'
      }
    },
    {
      id: 'hippo_ronin',
      label: 'HIPPO RONIN',
      profile: {
        category: 'RONIN',
        factionFamily: 'RONIN',
        speciesBase: 'HIPPO',
        allegianceState: 'NEUTRAL',
        dispositionState: 'WATCHING',
        behaviorState: 'HOLDING',
        movementType: 'AMPHIBIOUS HEAVY',
        threatRole: 'BREACHER',
        behaviorMode: 'OBSERVING',
        description: 'Ronin heavy contact that watches waterline crossings before committing.'
      },
      movementTags: {
        terrainAffinity: 'WATER / MUD / BREACH POINT',
        locomotionClass: 'AMPHIBIOUS HEAVY',
        formationStyle: 'SOLO PRESSURE',
        engagementRange: 'CLOSE / IMPACT',
        mobilityNote: 'SLOW LAND PUSH, FAST WATER AMBUSH'
      },
      missionAffinity: {
        primaryMissionType: 'WATER / BREACH',
        secondaryMissionType: 'LAND ASSAULT',
        environmentalUse: 'RIVER, SWAMP, FLOODED RUINS',
        tacticalUse: 'BREAKS LINES, BLOCKS ESCAPE ROUTES'
      },
      behaviorIntent: {
        defaultIntent: 'HOLD TERRITORY',
        cautionTrigger: 'PLAYER ENTERS WATERLINE',
        hostileTrigger: 'BREACH ROUTE BLOCKED',
        supportTrigger: 'SHARED ENEMY PRESSURE',
        retreatTrigger: 'DEEP WATER WITHDRAWAL'
      }
    },
    {
      id: 'leech_mutant',
      label: 'LEECH MUTANT',
      profile: {
        category: 'MUTANT',
        factionFamily: 'MUTANT',
        speciesBase: 'LEECH',
        allegianceState: 'NEUTRAL',
        dispositionState: 'DORMANT',
        behaviorState: 'DORMANT',
        movementType: 'AMPHIBIOUS SWARM',
        threatRole: 'DRAINER',
        behaviorMode: 'DORMANT',
        description: 'Mutant swarm contact that remains latent around tunnels and waterlines.'
      },
      movementTags: {
        terrainAffinity: 'WATER / TUNNEL / BODY CONTACT',
        locomotionClass: 'AMPHIBIOUS SWARM',
        formationStyle: 'CLUSTER SWARM',
        engagementRange: 'CLOSE / ATTACH',
        mobilityNote: 'SMALL GROUP RUSH, DRAIN CONTACT'
      },
      missionAffinity: {
        primaryMissionType: 'WATER / TUNNEL',
        secondaryMissionType: 'INFILTRATION',
        environmentalUse: 'SEWERS, MARSH, SUBMERGED STRUCTURES',
        tacticalUse: 'DRAIN PRESSURE, SWARM CONTACT'
      },
      behaviorIntent: {
        defaultIntent: 'REMAIN DORMANT',
        cautionTrigger: 'PLAYER ENTERS CLUSTER RANGE',
        hostileTrigger: 'CONTACT DISTURBS SWARM',
        supportTrigger: 'SIGNAL OVERRIDE',
        retreatTrigger: 'LIGHT / HEAT PRESSURE'
      }
    },
    {
      id: 'leech_ronin',
      label: 'LEECH RONIN',
      profile: {
        category: 'RONIN',
        factionFamily: 'RONIN',
        speciesBase: 'LEECH',
        allegianceState: 'NEUTRAL',
        dispositionState: 'DORMANT',
        behaviorState: 'DORMANT',
        movementType: 'AMPHIBIOUS SWARM',
        threatRole: 'DRAINER',
        behaviorMode: 'DORMANT',
        description: 'Ronin swarm contact that waits for disturbance before revealing intent.'
      },
      movementTags: {
        terrainAffinity: 'WATER / TUNNEL / BODY CONTACT',
        locomotionClass: 'AMPHIBIOUS SWARM',
        formationStyle: 'CLUSTER SWARM',
        engagementRange: 'CLOSE / ATTACH',
        mobilityNote: 'SMALL GROUP RUSH, DRAIN CONTACT'
      },
      missionAffinity: {
        primaryMissionType: 'WATER / TUNNEL',
        secondaryMissionType: 'INFILTRATION',
        environmentalUse: 'SEWERS, MARSH, SUBMERGED STRUCTURES',
        tacticalUse: 'DRAIN PRESSURE, SWARM CONTACT'
      },
      behaviorIntent: {
        defaultIntent: 'REMAIN DORMANT',
        cautionTrigger: 'PLAYER ENTERS CLUSTER RANGE',
        hostileTrigger: 'CONTACT DISTURBS SWARM',
        supportTrigger: 'SIGNAL OVERRIDE',
        retreatTrigger: 'LIGHT / HEAT PRESSURE'
      }
    },
    {
      id: 'bee_mutant',
      label: 'BEE MUTANT',
      profile: {
        category: 'MUTANT',
        factionFamily: 'MUTANT',
        speciesBase: 'BEE',
        allegianceState: 'NEUTRAL',
        dispositionState: 'FORMING',
        behaviorState: 'FORMING',
        movementType: 'AIRBORNE SWARM',
        threatRole: 'STINGER',
        behaviorMode: 'FORMING',
        description: 'Mutant swarm contact that gathers pressure over exposed spaces.'
      },
      movementTags: {
        terrainAffinity: 'AIR / OPEN FIELD / STRUCTURE EDGE',
        locomotionClass: 'AIRBORNE SWARM',
        formationStyle: 'SWARM CLOUD',
        engagementRange: 'MID / STING PASS',
        mobilityNote: 'FORMATION FLIGHT, REPEATED STING RUNS'
      },
      missionAffinity: {
        primaryMissionType: 'AIR / SWARM',
        secondaryMissionType: 'AREA DENIAL',
        environmentalUse: 'OPEN FIELD, ROOFTOPS, STRUCTURE EDGES',
        tacticalUse: 'HARASSMENT, STING PASSES, CROWD PRESSURE'
      },
      behaviorIntent: {
        defaultIntent: 'FORM SWARM',
        cautionTrigger: 'PLAYER ENTERS AIRSPACE',
        hostileTrigger: 'HIVE VECTOR THREATENED',
        supportTrigger: 'AREA DENIAL ALIGNMENT',
        retreatTrigger: 'SMOKE / SIGNAL DISRUPTION'
      }
    },
    {
      id: 'bee_ronin',
      label: 'BEE RONIN',
      profile: {
        category: 'RONIN',
        factionFamily: 'RONIN',
        speciesBase: 'BEE',
        allegianceState: 'NEUTRAL',
        dispositionState: 'FORMING',
        behaviorState: 'FORMING',
        movementType: 'AIRBORNE SWARM',
        threatRole: 'STINGER',
        behaviorMode: 'FORMING',
        description: 'Ronin swarm contact that forms around airspace pressure and signal shifts.'
      },
      movementTags: {
        terrainAffinity: 'AIR / OPEN FIELD / STRUCTURE EDGE',
        locomotionClass: 'AIRBORNE SWARM',
        formationStyle: 'SWARM CLOUD',
        engagementRange: 'MID / STING PASS',
        mobilityNote: 'FORMATION FLIGHT, REPEATED STING RUNS'
      },
      missionAffinity: {
        primaryMissionType: 'AIR / SWARM',
        secondaryMissionType: 'AREA DENIAL',
        environmentalUse: 'OPEN FIELD, ROOFTOPS, STRUCTURE EDGES',
        tacticalUse: 'HARASSMENT, STING PASSES, CROWD PRESSURE'
      },
      behaviorIntent: {
        defaultIntent: 'FORM SWARM',
        cautionTrigger: 'PLAYER ENTERS AIRSPACE',
        hostileTrigger: 'HIVE VECTOR THREATENED',
        supportTrigger: 'AREA DENIAL ALIGNMENT',
        retreatTrigger: 'SMOKE / SIGNAL DISRUPTION'
      }
    },
    {
      id: 'owl_mutant',
      label: 'OWL MUTANT',
      profile: {
        category: 'MUTANT',
        factionFamily: 'MUTANT',
        speciesBase: 'OWL',
        allegianceState: 'NEUTRAL',
        dispositionState: 'OVERWATCH',
        behaviorState: 'OBSERVING',
        movementType: 'AIRBORNE PREDATOR',
        threatRole: 'AER SUPPORT',
        behaviorMode: 'OVERWATCH',
        description: 'Mutant overwatch contact that tracks exposed movement from high cover.'
      },
      movementTags: {
        terrainAffinity: 'AIR / NIGHT / HIGH PERCH',
        locomotionClass: 'AIRBORNE PREDATOR',
        formationStyle: 'OVERWATCH SOLO',
        engagementRange: 'LONG / DIVE STRIKE',
        mobilityNote: 'AERIAL SUPPORT, DIVE-ANGLE CONTROL'
      },
      missionAffinity: {
        primaryMissionType: 'AER / OVERWATCH',
        secondaryMissionType: 'AIR SUPPORT',
        environmentalUse: 'NIGHT SKY, HIGH PERCH, CLOUD COVER',
        tacticalUse: 'RECON, DIVE ANGLES, TARGET MARKING'
      },
      behaviorIntent: {
        defaultIntent: 'OBSERVE FROM ABOVE',
        cautionTrigger: 'PLAYER BREAKS STEALTH',
        hostileTrigger: 'TARGET MARK CONFIRMED',
        supportTrigger: 'AER SUPPORT ALIGNMENT',
        retreatTrigger: 'CLOUD COVER EXIT'
      }
    },
    {
      id: 'owl_ronin',
      label: 'OWL RONIN',
      profile: {
        category: 'RONIN',
        factionFamily: 'RONIN',
        speciesBase: 'OWL',
        allegianceState: 'NEUTRAL',
        dispositionState: 'OVERWATCH',
        behaviorState: 'OBSERVING',
        movementType: 'AIRBORNE PREDATOR',
        threatRole: 'AER SUPPORT',
        behaviorMode: 'OVERWATCH',
        description: 'Ronin overwatch contact that observes before committing to alignment.'
      },
      movementTags: {
        terrainAffinity: 'AIR / NIGHT / HIGH PERCH',
        locomotionClass: 'AIRBORNE PREDATOR',
        formationStyle: 'OVERWATCH SOLO',
        engagementRange: 'LONG / DIVE STRIKE',
        mobilityNote: 'AERIAL SUPPORT, DIVE-ANGLE CONTROL'
      },
      missionAffinity: {
        primaryMissionType: 'AER / OVERWATCH',
        secondaryMissionType: 'AIR SUPPORT',
        environmentalUse: 'NIGHT SKY, HIGH PERCH, CLOUD COVER',
        tacticalUse: 'RECON, DIVE ANGLES, TARGET MARKING'
      },
      behaviorIntent: {
        defaultIntent: 'OBSERVE FROM ABOVE',
        cautionTrigger: 'PLAYER BREAKS STEALTH',
        hostileTrigger: 'TARGET MARK CONFIRMED',
        supportTrigger: 'AER SUPPORT ALIGNMENT',
        retreatTrigger: 'CLOUD COVER EXIT'
      }
    }
  ];

  let activeEnemyContactArchetypeId = 'hippo_ronin';
  let selectedTriggerPreview = 'none';
  let passivePreviewLogEntries = [];
  let engagementState = 'DISENGAGED';

  function activeEnemyContactArchetype() {
    return enemyContactArchetypes.find(function (archetype) {
      return archetype.id === activeEnemyContactArchetypeId;
    }) || enemyContactArchetypes[0];
  }

  function setActiveEnemyContactArchetypeId(archetypeId) {
    const matched = enemyContactArchetypes.find(function (archetype) {
      return archetype.id === archetypeId;
    });
    activeEnemyContactArchetypeId = matched ? matched.id : 'hippo_ronin';
  }

  function setSelectedTriggerPreview(triggerType) {
    selectedTriggerPreview = triggerSelectorOptions.indexOf(triggerType) !== -1 ? triggerType : 'none';
  }

  function passiveBehaviorPreviewLabel() {
    const archetype = activeEnemyContactArchetype();
    const speciesBase = archetype && archetype.profile ? archetype.profile.speciesBase : '';
    const speciesPreviewKey = speciesBase ? speciesBase.toLowerCase() + '_ronin' : '';
    const archetypePreview = passiveBehaviorPreviewText[archetype ? archetype.id : ''] || passiveBehaviorPreviewText[speciesPreviewKey] || passiveBehaviorPreviewText.hippo_ronin;
    return archetypePreview[selectedTriggerPreview] || archetypePreview.none;
  }

  function passivePreviewLogText() {
    const archetype = activeEnemyContactArchetype();
    return [
      'LOG: ' + (archetype ? archetype.label : 'UNKNOWN CONTACT'),
      selectedTriggerPreview.toUpperCase(),
      passiveBehaviorPreviewLabel()
    ].join(' // ');
  }

  function behaviorStateTransitionPreviewLabel() {
    const archetype = activeEnemyContactArchetype();
    const profile = archetype ? archetype.profile : {};
    const currentState = profile.behaviorState || 'UNKNOWN';
    const previewState = triggerStateTransitionPreview[selectedTriggerPreview] || currentState;
    return currentState + ' -> ' + previewState;
  }

  function behaviorStateTransitionPreviewState() {
    return triggerStateTransitionPreview[selectedTriggerPreview] || null;
  }

  function transitionConfirmationPreviewText() {
    const archetype = activeEnemyContactArchetype();
    return [
      'TRANSITION CONFIRMED FOR PREVIEW ONLY: ' + (archetype ? archetype.label : 'UNKNOWN CONTACT'),
      selectedTriggerPreview.toUpperCase(),
      behaviorStateTransitionPreviewLabel()
    ].join(' // ');
  }

  function transitionPendingReviewText() {
    const archetype = activeEnemyContactArchetype();
    return [
      'TRANSITION READY FOR MANUAL REVIEW ONLY: ' + (archetype ? archetype.label : 'UNKNOWN CONTACT'),
      selectedTriggerPreview.toUpperCase(),
      behaviorStateTransitionPreviewLabel(),
      'NO STATE APPLIED'
    ].join(' // ');
  }

  function allegianceCompatibilityReviewText(archetype) {
    const profile = archetype ? archetype.profile : {};
    return [
      'ALLEGIANCE COMPATIBILITY REVIEW: ' + (archetype ? archetype.label : 'UNKNOWN CONTACT'),
      'CURRENT ALLEGIANCE: ' + (profile.allegianceState || 'UNKNOWN'),
      'NO ALLEGIANCE CHANGE APPLIED'
    ].join(' // ');
  }

  function derivedAllegianceState(archetype) {
    const label = archetype ? archetype.label : '';
    if (label.indexOf('MUTANT') !== -1) {
      return 'MUTANT';
    }
    if (label.indexOf('RONIN') !== -1) {
      return 'RONIN';
    }
    return 'NEUTRAL';
  }

  function allegianceReviewChecklistText(allegianceChangeArmed, allegianceChanged) {
    return [
      'ALLEGIANCE REVIEW CHECKLIST:',
      '- Behavior state applied: YES',
      '- Allegiance review required: YES',
      '- Allegiance change armed: ' + (allegianceChangeArmed ? 'YES' : 'NO'),
      '- Allegiance changed: ' + (allegianceChanged ? 'YES' : 'NO'),
      '- Combat systems engaged: NO'
    ].join('\n');
  }

  function phase10FinalAuditText(archetype) {
    const profile = archetype ? archetype.profile : {};
    return [
      'PHASE 10 AUDIT COMPLETE: BEHAVIOR STATE APPLIED // ALLEGIANCE REVIEWED // COMBAT SYSTEMS LOCKED',
      'Current behaviorState: ' + (profile.behaviorState || 'UNKNOWN'),
      'Current allegianceState: ' + (profile.allegianceState || 'UNKNOWN'),
      'Combat systems engaged: NO'
    ].join('\n');
  }

  function transitionApplicationChecklistText(previewConfirmed, behaviorStateChanged) {
    return [
      'APPLICATION CHECKLIST:',
      '- Preview confirmed: ' + (previewConfirmed ? 'YES' : 'NO'),
      '- Manual review required: YES',
      '- State application armed: NO',
      '- Behavior state changed: ' + (behaviorStateChanged ? 'YES' : 'NO'),
      '- Allegiance changed: NO'
    ].join('\n');
  }

  function createCombatState() {
    return {
      shellArmed: false,
      selectedAction: null,
      contactState: 'dormant'
    };
  }

  function combatStateLabel(value, fallback) {
    return String(value || fallback || '').toUpperCase();
  }

  function ensureCombatTelemetry(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-combat-telemetry]');
    if (existing) {
      return existing;
    }

    const telemetry = document.createElement('div');
    telemetry.className = 'ooh-play-combat-telemetry';
    telemetry.setAttribute('data-ooh-combat-telemetry', '');
    telemetry.setAttribute('aria-label', 'Combat telemetry readout');

    ['shell', 'action', 'contact'].forEach(function (field) {
      const line = document.createElement('span');
      line.className = 'ooh-play-combat-telemetry__line';
      line.setAttribute('data-ooh-combat-telemetry-field', field);
      telemetry.appendChild(line);
    });

    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (actions) {
      encounter.insertBefore(telemetry, actions);
      return telemetry;
    }

    encounter.appendChild(telemetry);
    return telemetry;
  }

  function syncCombatTelemetry(encounter, combatState) {
    const telemetry = ensureCombatTelemetry(encounter);
    if (!telemetry || !combatState) {
      return;
    }

    const fields = {
      shell: 'SHELL: ' + (combatState.shellArmed ? 'ARMED' : 'INACTIVE'),
      action: 'ACTION: ' + combatStateLabel(combatState.selectedAction, 'none'),
      contact: 'CONTACT: ' + combatStateLabel(combatState.contactState, 'dormant')
    };

    Object.keys(fields).forEach(function (field) {
      const el = telemetry.querySelector('[data-ooh-combat-telemetry-field="' + field + '"]');
      if (el) {
        el.textContent = fields[field];
      }
    });
  }

  function syncArchetypeReadouts(encounter) {
    if (!encounter) {
      return;
    }

    encounter.setAttribute('data-active-archetype', activeEnemyContactArchetypeId);
    syncEncounterSummary(encounter);
    syncEnemyContactProfile(encounter);
    syncEnemyMovementTags(encounter);
    syncEnemyMissionAffinity(encounter);
    syncEnemyBehaviorIntent(encounter);
    syncEnemyTriggerPreview(encounter);
    syncTriggerSelectionPreview(encounter);
    syncPassivePreviewLog(encounter);
  }

  function ensureArchetypeSelector(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-archetype-selector]');
    if (existing) {
      return existing;
    }

    const selectorWrap = document.createElement('div');
    selectorWrap.className = 'ooh-play-archetype-selector';
    selectorWrap.setAttribute('data-ooh-archetype-selector', '');

    const label = document.createElement('label');
    label.className = 'ooh-play-archetype-selector__label';
    label.textContent = 'CONTACT ARCHETYPE';

    const select = document.createElement('select');
    select.className = 'ooh-play-archetype-selector__control';
    select.setAttribute('data-ooh-archetype-select', '');
    select.setAttribute('aria-label', 'Contact archetype test selector');

    enemyContactArchetypes.forEach(function (archetype) {
      const option = document.createElement('option');
      option.value = archetype.id;
      option.textContent = archetype.label;
      select.appendChild(option);
    });

    select.value = activeEnemyContactArchetypeId;
    select.addEventListener('change', function () {
      setActiveEnemyContactArchetypeId(select.value);
      select.value = activeEnemyContactArchetypeId;
      syncArchetypeReadouts(encounter);
      appendPassivePreviewLog(encounter);
    });

    selectorWrap.appendChild(label);
    selectorWrap.appendChild(select);

    const profile = encounter.querySelector('[data-ooh-contact-profile]');
    const telemetry = encounter.querySelector('[data-ooh-combat-telemetry]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (profile) {
      encounter.insertBefore(selectorWrap, profile);
      return selectorWrap;
    }
    if (telemetry) {
      encounter.insertBefore(selectorWrap, telemetry);
      return selectorWrap;
    }
    if (actions) {
      encounter.insertBefore(selectorWrap, actions);
      return selectorWrap;
    }

    encounter.appendChild(selectorWrap);
    return selectorWrap;
  }

  function ensureEncounterSummary(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-encounter-summary]');
    if (existing) {
      return existing;
    }

    const summary = document.createElement('div');
    summary.className = 'ooh-play-encounter-summary';
    summary.setAttribute('data-ooh-encounter-summary', '');
    summary.setAttribute('aria-label', 'Encounter summary');

    const selector = encounter.querySelector('[data-ooh-archetype-selector]');
    const profile = encounter.querySelector('[data-ooh-contact-profile]');
    const telemetry = encounter.querySelector('[data-ooh-combat-telemetry]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (selector) {
      encounter.insertBefore(summary, selector.nextSibling);
      return summary;
    }
    if (profile) {
      encounter.insertBefore(summary, profile);
      return summary;
    }
    if (telemetry) {
      encounter.insertBefore(summary, telemetry);
      return summary;
    }
    if (actions) {
      encounter.insertBefore(summary, actions);
      return summary;
    }

    encounter.appendChild(summary);
    return summary;
  }

  function syncEncounterSummary(encounter) {
    const summary = ensureEncounterSummary(encounter);
    if (!summary) {
      return;
    }

    const archetype = activeEnemyContactArchetype();
    const profile = archetype ? archetype.profile : {};
    const missionAffinity = archetype ? archetype.missionAffinity : {};
    summary.setAttribute('data-active-archetype', archetype ? archetype.id : '');
    summary.textContent = [
      'CONTACT SUMMARY: ' + (archetype ? archetype.label : 'UNKNOWN CONTACT'),
      profile.allegianceState || 'UNCONFIRMED',
      profile.dispositionState || 'UNCONFIRMED',
      missionAffinity.primaryMissionType || 'UNASSIGNED'
    ].join(' // ');
  }

  function ensureEnemyContactProfile(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-contact-profile]');
    if (existing) {
      return existing;
    }

    const profile = document.createElement('div');
    profile.className = 'ooh-play-contact-profile';
    profile.setAttribute('data-ooh-contact-profile', '');
    profile.setAttribute('aria-label', 'Enemy contact profile');

    enemyContactProfileFields.forEach(function (field) {
      const line = document.createElement('span');
      line.className = 'ooh-play-contact-profile__line';
      line.setAttribute('data-ooh-contact-profile-field', field[0]);

      const label = document.createElement('span');
      label.className = 'ooh-play-contact-profile__label';
      label.textContent = field[1];

      const value = document.createElement('span');
      value.className = 'ooh-play-contact-profile__value';

      line.appendChild(label);
      line.appendChild(value);
      profile.appendChild(line);
    });

    const telemetry = encounter.querySelector('[data-ooh-combat-telemetry]');
    const selector = encounter.querySelector('[data-ooh-archetype-selector]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (selector) {
      encounter.insertBefore(profile, selector.nextSibling);
      return profile;
    }
    if (telemetry) {
      encounter.insertBefore(profile, telemetry);
      return profile;
    }
    if (actions) {
      encounter.insertBefore(profile, actions);
      return profile;
    }

    encounter.appendChild(profile);
    return profile;
  }

  function syncEnemyContactProfile(encounter) {
    const profile = ensureEnemyContactProfile(encounter);
    if (!profile) {
      return;
    }

    const archetype = activeEnemyContactArchetype();
    const activeProfile = archetype ? archetype.profile : {};
    profile.setAttribute('data-active-archetype', archetype ? archetype.id : '');

    enemyContactProfileFields.forEach(function (fieldDefinition) {
      const field = fieldDefinition[0];
      const el = profile.querySelector('[data-ooh-contact-profile-field="' + field + '"] .ooh-play-contact-profile__value');
      if (el) {
        el.textContent = activeProfile[field] || '';
      }
    });
  }

  function ensureEnemyMovementTags(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-movement-tags]');
    if (existing) {
      return existing;
    }

    const tags = document.createElement('div');
    tags.className = 'ooh-play-movement-tags';
    tags.setAttribute('data-ooh-movement-tags', '');
    tags.setAttribute('aria-label', 'Enemy movement tags');

    enemyMovementTagFields.forEach(function (field) {
      const line = document.createElement('span');
      line.className = 'ooh-play-movement-tags__line';
      line.setAttribute('data-ooh-movement-tag-field', field[0]);

      const label = document.createElement('span');
      label.className = 'ooh-play-movement-tags__label';
      label.textContent = field[1];

      const value = document.createElement('span');
      value.className = 'ooh-play-movement-tags__value';

      line.appendChild(label);
      line.appendChild(value);
      tags.appendChild(line);
    });

    const profile = encounter.querySelector('[data-ooh-contact-profile]');
    const selector = encounter.querySelector('[data-ooh-archetype-selector]');
    const telemetry = encounter.querySelector('[data-ooh-combat-telemetry]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (profile) {
      encounter.insertBefore(tags, profile.nextSibling);
      return tags;
    }
    if (selector) {
      encounter.insertBefore(tags, selector.nextSibling);
      return tags;
    }
    if (telemetry) {
      encounter.insertBefore(tags, telemetry);
      return tags;
    }
    if (actions) {
      encounter.insertBefore(tags, actions);
      return tags;
    }

    encounter.appendChild(tags);
    return tags;
  }

  function syncEnemyMovementTags(encounter) {
    const tags = ensureEnemyMovementTags(encounter);
    if (!tags) {
      return;
    }

    const archetype = activeEnemyContactArchetype();
    const movementTags = archetype ? archetype.movementTags : {};
    tags.setAttribute('data-active-archetype', archetype ? archetype.id : '');

    enemyMovementTagFields.forEach(function (fieldDefinition) {
      const field = fieldDefinition[0];
      const el = tags.querySelector('[data-ooh-movement-tag-field="' + field + '"] .ooh-play-movement-tags__value');
      if (el) {
        el.textContent = movementTags[field] || '';
      }
    });
  }

  function ensureEnemyMissionAffinity(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-mission-affinity]');
    if (existing) {
      return existing;
    }

    const affinity = document.createElement('div');
    affinity.className = 'ooh-play-mission-affinity';
    affinity.setAttribute('data-ooh-mission-affinity', '');
    affinity.setAttribute('aria-label', 'Enemy mission affinity');

    enemyMissionAffinityFields.forEach(function (field) {
      const line = document.createElement('span');
      line.className = 'ooh-play-mission-affinity__line';
      line.setAttribute('data-ooh-mission-affinity-field', field[0]);

      const label = document.createElement('span');
      label.className = 'ooh-play-mission-affinity__label';
      label.textContent = field[1];

      const value = document.createElement('span');
      value.className = 'ooh-play-mission-affinity__value';

      line.appendChild(label);
      line.appendChild(value);
      affinity.appendChild(line);
    });

    const movementTags = encounter.querySelector('[data-ooh-movement-tags]');
    const profile = encounter.querySelector('[data-ooh-contact-profile]');
    const telemetry = encounter.querySelector('[data-ooh-combat-telemetry]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (movementTags) {
      encounter.insertBefore(affinity, movementTags.nextSibling);
      return affinity;
    }
    if (profile) {
      encounter.insertBefore(affinity, profile.nextSibling);
      return affinity;
    }
    if (telemetry) {
      encounter.insertBefore(affinity, telemetry);
      return affinity;
    }
    if (actions) {
      encounter.insertBefore(affinity, actions);
      return affinity;
    }

    encounter.appendChild(affinity);
    return affinity;
  }

  function syncEnemyMissionAffinity(encounter) {
    const affinity = ensureEnemyMissionAffinity(encounter);
    if (!affinity) {
      return;
    }

    const archetype = activeEnemyContactArchetype();
    const missionAffinity = archetype ? archetype.missionAffinity : {};
    affinity.setAttribute('data-active-archetype', archetype ? archetype.id : '');

    enemyMissionAffinityFields.forEach(function (fieldDefinition) {
      const field = fieldDefinition[0];
      const el = affinity.querySelector('[data-ooh-mission-affinity-field="' + field + '"] .ooh-play-mission-affinity__value');
      if (el) {
        el.textContent = missionAffinity[field] || '';
      }
    });
  }

  function ensureEnemyBehaviorIntent(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-behavior-intent]');
    if (existing) {
      return existing;
    }

    const behavior = document.createElement('div');
    behavior.className = 'ooh-play-behavior-intent';
    behavior.setAttribute('data-ooh-behavior-intent', '');
    behavior.setAttribute('aria-label', 'Ronin behavior intent tags');

    enemyBehaviorIntentFields.forEach(function (field) {
      const line = document.createElement('span');
      line.className = 'ooh-play-behavior-intent__line';
      line.setAttribute('data-ooh-behavior-intent-field', field[0]);

      const label = document.createElement('span');
      label.className = 'ooh-play-behavior-intent__label';
      label.textContent = field[1];

      const value = document.createElement('span');
      value.className = 'ooh-play-behavior-intent__value';

      line.appendChild(label);
      line.appendChild(value);
      behavior.appendChild(line);
    });

    const missionAffinity = encounter.querySelector('[data-ooh-mission-affinity]');
    const movementTags = encounter.querySelector('[data-ooh-movement-tags]');
    const profile = encounter.querySelector('[data-ooh-contact-profile]');
    const telemetry = encounter.querySelector('[data-ooh-combat-telemetry]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (missionAffinity) {
      encounter.insertBefore(behavior, missionAffinity.nextSibling);
      return behavior;
    }
    if (movementTags) {
      encounter.insertBefore(behavior, movementTags.nextSibling);
      return behavior;
    }
    if (profile) {
      encounter.insertBefore(behavior, profile.nextSibling);
      return behavior;
    }
    if (telemetry) {
      encounter.insertBefore(behavior, telemetry);
      return behavior;
    }
    if (actions) {
      encounter.insertBefore(behavior, actions);
      return behavior;
    }

    encounter.appendChild(behavior);
    return behavior;
  }

  function syncEnemyBehaviorIntent(encounter) {
    const behavior = ensureEnemyBehaviorIntent(encounter);
    if (!behavior) {
      return;
    }

    const archetype = activeEnemyContactArchetype();
    const behaviorIntent = archetype ? archetype.behaviorIntent : {};
    behavior.setAttribute('data-active-archetype', archetype ? archetype.id : '');

    enemyBehaviorIntentFields.forEach(function (fieldDefinition) {
      const field = fieldDefinition[0];
      const el = behavior.querySelector('[data-ooh-behavior-intent-field="' + field + '"] .ooh-play-behavior-intent__value');
      if (el) {
        el.textContent = behaviorIntent[field] || '';
      }
    });
  }

  function ensureEnemyTriggerPreview(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-trigger-preview]');
    if (existing) {
      return existing;
    }

    const preview = document.createElement('div');
    preview.className = 'ooh-play-trigger-preview';
    preview.setAttribute('data-ooh-trigger-preview', '');
    preview.setAttribute('aria-label', 'Ronin behavior trigger preview');

    enemyTriggerPreviewFields.forEach(function (field) {
      const line = document.createElement('span');
      line.className = 'ooh-play-trigger-preview__line';
      line.setAttribute('data-ooh-trigger-preview-field', field[0]);

      const label = document.createElement('span');
      label.className = 'ooh-play-trigger-preview__label';
      label.textContent = field[1];

      const value = document.createElement('span');
      value.className = 'ooh-play-trigger-preview__value';

      line.appendChild(label);
      line.appendChild(value);
      preview.appendChild(line);
    });

    const behavior = encounter.querySelector('[data-ooh-behavior-intent]');
    const missionAffinity = encounter.querySelector('[data-ooh-mission-affinity]');
    const movementTags = encounter.querySelector('[data-ooh-movement-tags]');
    const profile = encounter.querySelector('[data-ooh-contact-profile]');
    const telemetry = encounter.querySelector('[data-ooh-combat-telemetry]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (behavior) {
      encounter.insertBefore(preview, behavior.nextSibling);
      return preview;
    }
    if (missionAffinity) {
      encounter.insertBefore(preview, missionAffinity.nextSibling);
      return preview;
    }
    if (movementTags) {
      encounter.insertBefore(preview, movementTags.nextSibling);
      return preview;
    }
    if (profile) {
      encounter.insertBefore(preview, profile.nextSibling);
      return preview;
    }
    if (telemetry) {
      encounter.insertBefore(preview, telemetry);
      return preview;
    }
    if (actions) {
      encounter.insertBefore(preview, actions);
      return preview;
    }

    encounter.appendChild(preview);
    return preview;
  }

  function syncEnemyTriggerPreview(encounter) {
    const preview = ensureEnemyTriggerPreview(encounter);
    if (!preview) {
      return;
    }

    const archetype = activeEnemyContactArchetype();
    const behaviorIntent = archetype ? archetype.behaviorIntent : {};
    preview.setAttribute('data-active-archetype', archetype ? archetype.id : '');

    enemyTriggerPreviewFields.forEach(function (fieldDefinition) {
      const field = fieldDefinition[0];
      const el = preview.querySelector('[data-ooh-trigger-preview-field="' + field + '"] .ooh-play-trigger-preview__value');
      if (el) {
        el.textContent = behaviorIntent[field] || '';
      }
    });
  }

  function ensureTriggerSelector(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-trigger-selector]');
    if (existing) {
      return existing;
    }

    const selectorWrap = document.createElement('div');
    selectorWrap.className = 'ooh-play-trigger-selector';
    selectorWrap.setAttribute('data-ooh-trigger-selector', '');

    const label = document.createElement('label');
    label.className = 'ooh-play-trigger-selector__label';
    label.textContent = 'SIMULATED TRIGGER';

    const select = document.createElement('select');
    select.className = 'ooh-play-trigger-selector__control';
    select.setAttribute('data-ooh-trigger-select', '');
    select.setAttribute('aria-label', 'Simulated trigger preview selector');

    triggerSelectorOptions.forEach(function (triggerType) {
      const option = document.createElement('option');
      option.value = triggerType;
      option.textContent = triggerType.toUpperCase();
      select.appendChild(option);
    });

    select.value = selectedTriggerPreview;
    let transitionPreviewConfirmed = false;
    select.addEventListener('change', function () {
      setSelectedTriggerPreview(select.value);
      transitionPreviewConfirmed = false;
      select.value = selectedTriggerPreview;
      syncTriggerSelectionPreview(encounter);
      appendPassivePreviewLog(encounter);
    });

    const output = document.createElement('span');
    output.className = 'ooh-play-trigger-selector__output';
    output.setAttribute('data-ooh-selected-trigger-output', '');
    output.textContent = 'SELECTED TRIGGER: NONE';

    const outcome = document.createElement('span');
    outcome.className = 'ooh-play-trigger-selector__outcome';
    outcome.setAttribute('data-ooh-trigger-outcome-preview', '');
    outcome.textContent = 'OUTCOME PREVIEW: NO TRIGGER SELECTED';

    const passivePreview = document.createElement('span');
    passivePreview.className = 'ooh-play-trigger-selector__passive-preview';
    passivePreview.setAttribute('data-ooh-passive-behavior-preview', '');
    passivePreview.textContent = 'PASSIVE BEHAVIOR PREVIEW: CONTACT REMAINS UNDER OBSERVATION';

    const transitionPreview = document.createElement('span');
    transitionPreview.className = 'ooh-play-trigger-selector__transition-preview';
    transitionPreview.setAttribute('data-ooh-state-transition-preview', '');
    transitionPreview.textContent = 'STATE TRANSITION PREVIEW: HOLDING -> HOLDING';

    const confirmButton = document.createElement('button');
    confirmButton.className = 'ooh-play-trigger-selector__confirm';
    confirmButton.type = 'button';
    confirmButton.setAttribute('data-ooh-transition-confirm-button', '');
    confirmButton.disabled = true;
    confirmButton.setAttribute('aria-disabled', 'true');
    confirmButton.textContent = 'CONFIRM TRANSITION PREVIEW';

    const confirmation = document.createElement('span');
    confirmation.className = 'ooh-play-trigger-selector__confirmation';
    confirmation.setAttribute('data-ooh-transition-confirmation', '');
    confirmation.textContent = 'TRANSITION CONFIRMATION AWAITING TRIGGER PREVIEW';

    const pendingReview = document.createElement('span');
    pendingReview.className = 'ooh-play-trigger-selector__pending-review';
    pendingReview.setAttribute('data-ooh-transition-pending-review', '');
    pendingReview.textContent = 'TRANSITION READINESS AWAITING CONFIRMATION // NO STATE APPLIED';

    const armButton = document.createElement('button');
    armButton.className = 'ooh-play-trigger-selector__arm-application';
    armButton.type = 'button';
    armButton.setAttribute('data-ooh-transition-arm-application', '');
    armButton.disabled = true;
    armButton.setAttribute('aria-disabled', 'true');
    armButton.textContent = 'ARM TRANSITION APPLICATION';

    const applicationLock = document.createElement('span');
    applicationLock.className = 'ooh-play-trigger-selector__application-lock';
    applicationLock.setAttribute('data-ooh-transition-application-lock', '');
    applicationLock.textContent = 'TRANSITION APPLICATION LOCKED: MANUAL REVIEW REQUIRED // NO STATE APPLIED';

    const applicationExecuted = document.createElement('span');
    applicationExecuted.className = 'ooh-play-trigger-selector__application-executed';
    applicationExecuted.setAttribute('data-ooh-transition-application-executed', '');
    applicationExecuted.textContent = 'TRANSITION APPLICATION EXECUTED: NOT RUN';

    const allegianceCompatibility = document.createElement('span');
    allegianceCompatibility.className = 'ooh-play-trigger-selector__allegiance-compatibility';
    allegianceCompatibility.setAttribute('data-ooh-allegiance-compatibility-review', '');
    allegianceCompatibility.hidden = true;

    const allegianceReviewButton = document.createElement('button');
    allegianceReviewButton.className = 'ooh-play-trigger-selector__allegiance-review';
    allegianceReviewButton.type = 'button';
    allegianceReviewButton.setAttribute('data-ooh-allegiance-review-button', '');
    allegianceReviewButton.disabled = true;
    allegianceReviewButton.setAttribute('aria-disabled', 'true');
    allegianceReviewButton.hidden = true;
    allegianceReviewButton.textContent = 'ARM ALLEGIANCE REVIEW';

    const allegianceReviewLock = document.createElement('span');
    allegianceReviewLock.className = 'ooh-play-trigger-selector__allegiance-review-lock';
    allegianceReviewLock.setAttribute('data-ooh-allegiance-review-lock', '');
    allegianceReviewLock.hidden = true;
    allegianceReviewLock.textContent = 'ALLEGIANCE REVIEW LOCKED: MANUAL CONFIRMATION REQUIRED // NO ALLEGIANCE CHANGE APPLIED';

    const allegianceApplicationExecuted = document.createElement('span');
    allegianceApplicationExecuted.className = 'ooh-play-trigger-selector__allegiance-application-executed';
    allegianceApplicationExecuted.setAttribute('data-ooh-allegiance-application-executed', '');
    allegianceApplicationExecuted.hidden = true;

    const phase10FinalAudit = document.createElement('pre');
    phase10FinalAudit.className = 'ooh-play-trigger-selector__phase-10-final-audit';
    phase10FinalAudit.setAttribute('data-ooh-phase-10-final-audit', '');
    phase10FinalAudit.hidden = true;

    const engagementStatus = document.createElement('span');
    engagementStatus.className = 'ooh-play-trigger-selector__engagement-status';
    engagementStatus.setAttribute('data-ooh-engagement-status', '');
    engagementStatus.hidden = true;
    engagementStatus.textContent = 'ENGAGEMENT STATUS: ' + engagementState + ' // COMBAT SYSTEMS NOT ACTIVE';

    const engageHostileButton = document.createElement('button');
    engageHostileButton.className = 'ooh-play-trigger-selector__engage-hostile';
    engageHostileButton.type = 'button';
    engageHostileButton.setAttribute('data-ooh-engage-hostile-contact', '');
    engageHostileButton.disabled = true;
    engageHostileButton.setAttribute('aria-disabled', 'true');
    engageHostileButton.hidden = true;
    engageHostileButton.textContent = 'ENGAGE HOSTILE CONTACT';

    const engagementConfirmed = document.createElement('span');
    engagementConfirmed.className = 'ooh-play-trigger-selector__engagement-confirmed';
    engagementConfirmed.setAttribute('data-ooh-engagement-confirmed', '');
    engagementConfirmed.hidden = true;
    engagementConfirmed.textContent = '';

    const combatLoopStatus = document.createElement('span');
    combatLoopStatus.className = 'ooh-play-trigger-selector__combat-loop-status';
    combatLoopStatus.setAttribute('data-ooh-combat-loop-status', '');
    combatLoopStatus.hidden = true;
    combatLoopStatus.textContent = 'COMBAT LOOP ACTIVE: SINGLE ACTION ONLY // SYSTEM NOT FULLY DEPLOYED';

    const executeStrikeButton = document.createElement('button');
    executeStrikeButton.className = 'ooh-play-trigger-selector__execute-strike';
    executeStrikeButton.type = 'button';
    executeStrikeButton.setAttribute('data-ooh-execute-strike', '');
    executeStrikeButton.hidden = true;
    executeStrikeButton.textContent = 'EXECUTE STRIKE';

    const strikeOutcome = document.createElement('span');
    strikeOutcome.className = 'ooh-play-trigger-selector__strike-outcome';
    strikeOutcome.setAttribute('data-ooh-strike-outcome', '');
    strikeOutcome.hidden = true;
    strikeOutcome.textContent = '';

    const allegianceReviewChecklist = document.createElement('pre');
    allegianceReviewChecklist.className = 'ooh-play-trigger-selector__allegiance-review-checklist';
    allegianceReviewChecklist.setAttribute('data-ooh-allegiance-review-checklist', '');
    allegianceReviewChecklist.hidden = true;
    allegianceReviewChecklist.textContent = allegianceReviewChecklistText(false, false);

    const applicationChecklist = document.createElement('pre');
    applicationChecklist.className = 'ooh-play-trigger-selector__application-checklist';
    applicationChecklist.setAttribute('data-ooh-transition-application-checklist', '');
    applicationChecklist.textContent = transitionApplicationChecklistText(false);

    const auditStamp = document.createElement('span');
    auditStamp.className = 'ooh-play-trigger-selector__audit-stamp';
    auditStamp.setAttribute('data-ooh-phase-9-audit-stamp', '');
    auditStamp.textContent = 'PHASE 9 AUDIT STAMP: NOT RECORDED';

    confirmButton.addEventListener('click', function () {
      if (confirmButton.disabled || selectedTriggerPreview === 'none') {
        return;
      }
      transitionPreviewConfirmed = true;
      confirmation.textContent = transitionConfirmationPreviewText();
      pendingReview.textContent = transitionPendingReviewText();
      applicationLock.textContent = 'TRANSITION APPLICATION LOCKED: MANUAL REVIEW REQUIRED // NO STATE APPLIED';
      applicationChecklist.textContent = transitionApplicationChecklistText(true);
      allegianceCompatibility.hidden = true;
      allegianceCompatibility.textContent = '';
      allegianceReviewButton.hidden = true;
      allegianceReviewButton.disabled = true;
      allegianceReviewButton.setAttribute('aria-disabled', 'true');
      allegianceReviewLock.hidden = true;
      allegianceApplicationExecuted.hidden = true;
      allegianceApplicationExecuted.textContent = '';
      phase10FinalAudit.hidden = true;
      phase10FinalAudit.textContent = '';
      engagementStatus.hidden = true;
      engagementStatus.textContent = 'ENGAGEMENT STATUS: ' + engagementState + ' // COMBAT SYSTEMS NOT ACTIVE';
      engageHostileButton.hidden = true;
      engageHostileButton.disabled = true;
      engageHostileButton.setAttribute('aria-disabled', 'true');
      engagementConfirmed.hidden = true;
      engagementConfirmed.textContent = '';
      combatLoopStatus.hidden = true;
      executeStrikeButton.hidden = true;
      strikeOutcome.hidden = true;
      strikeOutcome.textContent = '';
      allegianceReviewChecklist.hidden = true;
      allegianceReviewChecklist.textContent = allegianceReviewChecklistText(false, false);
      auditStamp.textContent = 'PHASE 9 AUDIT STAMP: PREVIEW REVIEWED // APPLICATION LOCKED // NO STATE APPLIED';
      armButton.disabled = !behaviorStateTransitionPreviewState();
      armButton.setAttribute('aria-disabled', armButton.disabled ? 'true' : 'false');
    });

    allegianceReviewButton.addEventListener('click', function () {
      const archetype = activeEnemyContactArchetype();
      if (allegianceReviewButton.disabled || !archetype) {
        return;
      }
      const allegianceState = derivedAllegianceState(archetype);
      archetype.profile.allegianceState = allegianceState;
      allegianceCompatibility.textContent = allegianceCompatibilityReviewText(archetype);
      allegianceApplicationExecuted.textContent = 'ALLEGIANCE APPLICATION EXECUTED: ' + allegianceState + ' // NO COMBAT SYSTEMS ENGAGED';
      allegianceApplicationExecuted.hidden = false;
      allegianceReviewChecklist.textContent = allegianceReviewChecklistText(true, allegianceState !== 'NEUTRAL');
      phase10FinalAudit.textContent = phase10FinalAuditText(archetype);
      phase10FinalAudit.hidden = false;
      engagementStatus.textContent = 'ENGAGEMENT STATUS: ' + engagementState + ' // COMBAT SYSTEMS NOT ACTIVE';
      engagementStatus.hidden = false;
      engageHostileButton.hidden = false;
      engageHostileButton.disabled = allegianceState === 'NEUTRAL';
      engageHostileButton.setAttribute('aria-disabled', engageHostileButton.disabled ? 'true' : 'false');
      engagementConfirmed.hidden = true;
      engagementConfirmed.textContent = '';
      combatLoopStatus.hidden = true;
      executeStrikeButton.hidden = true;
      strikeOutcome.hidden = true;
      strikeOutcome.textContent = '';
    });

    engageHostileButton.addEventListener('click', function () {
      if (engageHostileButton.disabled) {
        return;
      }
      engagementState = 'ENGAGED';
      engagementStatus.textContent = 'ENGAGEMENT STATUS: ' + engagementState;
      engagementConfirmed.textContent = 'ENGAGEMENT CONFIRMED: TARGET LOCKED // NO DAMAGE SYSTEM ACTIVE';
      engagementConfirmed.hidden = false;
      combatLoopStatus.hidden = false;
      executeStrikeButton.hidden = false;
      strikeOutcome.hidden = true;
      strikeOutcome.textContent = '';
    });

    executeStrikeButton.addEventListener('click', function () {
      if (engagementState !== 'ENGAGED') {
        return;
      }
      strikeOutcome.textContent = 'STRIKE EXECUTED: TARGET SUPPRESSED';
      strikeOutcome.hidden = false;
    });

    armButton.addEventListener('click', function () {
      const archetype = activeEnemyContactArchetype();
      const previewState = behaviorStateTransitionPreviewState();
      if (armButton.disabled || !transitionPreviewConfirmed || !archetype || !previewState) {
        return;
      }
      archetype.profile.behaviorState = previewState;
      applicationChecklist.textContent = transitionApplicationChecklistText(true, true);
      applicationExecuted.textContent = 'TRANSITION APPLICATION EXECUTED: BEHAVIOR STATE ONLY // NO OTHER SYSTEMS ENGAGED';
      allegianceCompatibility.textContent = allegianceCompatibilityReviewText(archetype);
      allegianceCompatibility.hidden = false;
      allegianceReviewButton.hidden = false;
      allegianceReviewButton.disabled = false;
      allegianceReviewButton.setAttribute('aria-disabled', 'false');
      allegianceReviewLock.hidden = false;
      allegianceApplicationExecuted.hidden = true;
      allegianceApplicationExecuted.textContent = '';
      phase10FinalAudit.hidden = true;
      phase10FinalAudit.textContent = '';
      engagementStatus.hidden = true;
      engagementStatus.textContent = 'ENGAGEMENT STATUS: ' + engagementState + ' // COMBAT SYSTEMS NOT ACTIVE';
      engageHostileButton.hidden = true;
      engageHostileButton.disabled = true;
      engageHostileButton.setAttribute('aria-disabled', 'true');
      engagementConfirmed.hidden = true;
      engagementConfirmed.textContent = '';
      combatLoopStatus.hidden = true;
      executeStrikeButton.hidden = true;
      strikeOutcome.hidden = true;
      strikeOutcome.textContent = '';
      allegianceReviewChecklist.textContent = allegianceReviewChecklistText(true, false);
      allegianceReviewChecklist.hidden = false;
      auditStamp.textContent = 'PHASE 10 APPLICATION: BEHAVIOR STATE APPLIED // ' + previewState;
    });

    selectorWrap.appendChild(label);
    selectorWrap.appendChild(select);
    selectorWrap.appendChild(output);
    selectorWrap.appendChild(outcome);
    selectorWrap.appendChild(passivePreview);
    selectorWrap.appendChild(transitionPreview);
    selectorWrap.appendChild(confirmButton);
    selectorWrap.appendChild(confirmation);
    selectorWrap.appendChild(pendingReview);
    selectorWrap.appendChild(armButton);
    selectorWrap.appendChild(applicationLock);
    selectorWrap.appendChild(applicationExecuted);
    selectorWrap.appendChild(allegianceCompatibility);
    selectorWrap.appendChild(allegianceReviewButton);
    selectorWrap.appendChild(allegianceReviewLock);
    selectorWrap.appendChild(allegianceApplicationExecuted);
    selectorWrap.appendChild(phase10FinalAudit);
    selectorWrap.appendChild(engagementStatus);
    selectorWrap.appendChild(engageHostileButton);
    selectorWrap.appendChild(engagementConfirmed);
    selectorWrap.appendChild(combatLoopStatus);
    selectorWrap.appendChild(executeStrikeButton);
    selectorWrap.appendChild(strikeOutcome);
    selectorWrap.appendChild(allegianceReviewChecklist);
    selectorWrap.appendChild(applicationChecklist);
    selectorWrap.appendChild(auditStamp);

    const triggerPreview = encounter.querySelector('[data-ooh-trigger-preview]');
    const behavior = encounter.querySelector('[data-ooh-behavior-intent]');
    const missionAffinity = encounter.querySelector('[data-ooh-mission-affinity]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (triggerPreview) {
      encounter.insertBefore(selectorWrap, triggerPreview.nextSibling);
      return selectorWrap;
    }
    if (behavior) {
      encounter.insertBefore(selectorWrap, behavior.nextSibling);
      return selectorWrap;
    }
    if (missionAffinity) {
      encounter.insertBefore(selectorWrap, missionAffinity.nextSibling);
      return selectorWrap;
    }
    if (actions) {
      encounter.insertBefore(selectorWrap, actions);
      return selectorWrap;
    }

    encounter.appendChild(selectorWrap);
    return selectorWrap;
  }

  function syncTriggerSelectionPreview(encounter) {
    const selectorWrap = ensureTriggerSelector(encounter);
    if (!selectorWrap) {
      return;
    }

    const select = selectorWrap.querySelector('[data-ooh-trigger-select]');
    const output = selectorWrap.querySelector('[data-ooh-selected-trigger-output]');
    const outcome = selectorWrap.querySelector('[data-ooh-trigger-outcome-preview]');
    const passivePreview = selectorWrap.querySelector('[data-ooh-passive-behavior-preview]');
    const transitionPreview = selectorWrap.querySelector('[data-ooh-state-transition-preview]');
    const confirmButton = selectorWrap.querySelector('[data-ooh-transition-confirm-button]');
    const armButton = selectorWrap.querySelector('[data-ooh-transition-arm-application]');
    if (select) {
      select.value = selectedTriggerPreview;
    }
    if (output) {
      output.textContent = 'SELECTED TRIGGER: ' + selectedTriggerPreview.toUpperCase();
    }
    if (outcome) {
      outcome.textContent = 'OUTCOME PREVIEW: ' + (triggerOutcomePreviewText[selectedTriggerPreview] || triggerOutcomePreviewText.none);
    }
    if (passivePreview) {
      passivePreview.textContent = 'PASSIVE BEHAVIOR PREVIEW: ' + passiveBehaviorPreviewLabel();
    }
    if (transitionPreview) {
      transitionPreview.textContent = 'STATE TRANSITION PREVIEW: ' + behaviorStateTransitionPreviewLabel();
    }
    if (confirmButton) {
      confirmButton.disabled = selectedTriggerPreview === 'none';
      confirmButton.setAttribute('aria-disabled', confirmButton.disabled ? 'true' : 'false');
    }
    if (armButton) {
      armButton.disabled = true;
      armButton.setAttribute('aria-disabled', 'true');
    }
  }

  function ensurePassivePreviewLog(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-passive-preview-log]');
    if (existing) {
      return existing;
    }

    const log = document.createElement('div');
    log.className = 'ooh-play-passive-preview-log';
    log.setAttribute('data-ooh-passive-preview-log', '');
    log.setAttribute('aria-label', 'Passive behavior preview log');

    const selector = encounter.querySelector('[data-ooh-trigger-selector]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (selector) {
      encounter.insertBefore(log, selector.nextSibling);
      return log;
    }
    if (actions) {
      encounter.insertBefore(log, actions);
      return log;
    }

    encounter.appendChild(log);
    return log;
  }

  function syncPassivePreviewLog(encounter) {
    const log = ensurePassivePreviewLog(encounter);
    if (!log) {
      return;
    }

    log.textContent = '';
    passivePreviewLogEntries.forEach(function (entry, index) {
      const line = document.createElement('span');
      line.className = 'ooh-play-passive-preview-log__entry';
      if (index === 0) {
        line.classList.add('is-latest');
      }
      line.textContent = entry;
      log.appendChild(line);
    });
  }

  function appendPassivePreviewLog(encounter) {
    passivePreviewLogEntries.unshift(passivePreviewLogText());
    passivePreviewLogEntries = passivePreviewLogEntries.slice(0, 5);
    syncPassivePreviewLog(encounter);
  }

  function ensureEncounterPulse(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-encounter-pulse]');
    if (existing) {
      return existing;
    }

    const pulse = document.createElement('div');
    pulse.className = 'ooh-play-encounter__pulse';
    pulse.setAttribute('data-ooh-encounter-pulse', '');
    pulse.setAttribute('aria-live', 'polite');

    const telemetry = encounter.querySelector('[data-ooh-combat-telemetry]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (actions) {
      encounter.insertBefore(pulse, actions);
      return pulse;
    }
    if (telemetry) {
      encounter.insertBefore(pulse, telemetry.nextSibling);
      return pulse;
    }

    encounter.appendChild(pulse);
    return pulse;
  }

  function triggerEncounterPulse(encounter, action) {
    const pulseText = encounterActionPulseText[action];
    const pulse = ensureEncounterPulse(encounter);
    if (!encounter || !pulse || !pulseText) {
      return;
    }

    pulse.textContent = pulseText;
    encounter.classList.remove('is-encounter-pulsing');
    void encounter.offsetWidth;
    encounter.classList.add('is-encounter-pulsing');
    if (encounter.oohEncounterPulseTimer) {
      window.clearTimeout(encounter.oohEncounterPulseTimer);
    }
    encounter.oohEncounterPulseTimer = window.setTimeout(function () {
      encounter.classList.remove('is-encounter-pulsing');
      encounter.oohEncounterPulseTimer = null;
    }, 780);
  }

  function syncEncounterState(encounter, combatState) {
    if (!encounter || !combatState) {
      return;
    }

    encounter.setAttribute('data-contact-state', combatState.contactState || 'dormant');
    if (combatState.selectedAction) {
      encounter.setAttribute('data-selected-action', combatState.selectedAction);
    }
    else {
      encounter.removeAttribute('data-selected-action');
    }
    syncCombatTelemetry(encounter, combatState);
    ensureArchetypeSelector(encounter);
    syncArchetypeReadouts(encounter);
  }

  function encounterActionFromButton(button) {
    return cleanId(button ? button.textContent : '', '');
  }

  function encounterStatusField(encounter) {
    const card = encounter ? encounter.querySelector('[data-ooh-hostile-card]') : null;
    if (!card) {
      return null;
    }

    const labels = card.querySelectorAll('dt');
    for (let i = 0; i < labels.length; i++) {
      if (String(labels[i].textContent || '').trim().toUpperCase() === 'STATUS') {
        return labels[i].nextElementSibling || null;
      }
    }

    return null;
  }

  function enableEncounterActions(encounter) {
    if (!encounter) {
      return;
    }

    encounter.querySelectorAll('.ooh-play-encounter__action').forEach(function (button) {
      button.disabled = false;
      button.setAttribute('aria-disabled', 'false');
    });
  }

  function triggerEncounterAction(root, button, combatState) {
    if (!root.classList.contains('is-combat-shell') || !button || button.disabled) {
      return;
    }

    const encounter = button.closest('[data-ooh-combat-encounter]');
    const statusField = encounterStatusField(encounter);
    const action = encounterActionFromButton(button);
    const statusText = encounterActionStatusText[action];

    if (!encounter || !statusField || !statusText) {
      return;
    }

    if (combatState) {
      combatState.shellArmed = true;
      combatState.selectedAction = action;
      combatState.contactState = encounterActionContactState[action] || 'observing';
      syncEncounterState(encounter, combatState);
    }

    statusField.textContent = statusText;
    triggerEncounterPulse(encounter, action);
    encounter.querySelectorAll('.ooh-play-encounter__action').forEach(function (actionButton) {
      actionButton.classList.remove('is-combat-action-active');
    });

    button.classList.add('is-combat-action-active');
    if (button.oohCombatActionTimer) {
      window.clearTimeout(button.oohCombatActionTimer);
    }
    button.oohCombatActionTimer = window.setTimeout(function () {
      button.classList.remove('is-combat-action-active');
      button.oohCombatActionTimer = null;
    }, 720);
  }

  function activateCombatShell(root, shell, sceneStatus, routeId, pathKey, missionLabel, combatState) {
    if (!root.classList.contains('is-mission-active')) {
      return;
    }

    const message = 'HOSTILE CONTACT CONFIRMED. COMBAT SHELL ARMED.';
    const actionReadout = root.querySelector('[data-ooh-action-readout]');
    const gateStatus = root.querySelector('[data-ooh-combat-gate-status]');
    const hudStatus = root.querySelector('[data-ooh-hud-field="status"]');
    const gateButton = root.querySelector('[data-ooh-combat-gate-button]');
    const encounter = root.querySelector('[data-ooh-combat-encounter]');

    root.classList.add('is-combat-shell');
    if (combatState) {
      combatState.shellArmed = true;
      combatState.selectedAction = null;
      combatState.contactState = 'observing';
    }

    if (actionReadout) {
      actionReadout.textContent = message + ' Passive inputs remain online.';
    }
    if (gateStatus) {
      gateStatus.textContent = message;
    }
    if (hudStatus) {
      hudStatus.textContent = 'COMBAT SHELL';
    }
    if (sceneStatus) {
      sceneStatus.textContent = buildCombatShellSceneStatus(routeId, pathKey, missionLabel);
    }
    if (gateButton) {
      gateButton.textContent = 'COMBAT SHELL ARMED';
      gateButton.classList.add('is-combat-armed');
      gateButton.disabled = true;
      gateButton.setAttribute('aria-disabled', 'true');
    }
    if (encounter) {
      encounter.hidden = false;
      encounter.classList.add('is-encounter-visible');
      encounter.setAttribute('data-encounter-state', 'visible');
      syncEncounterState(encounter, combatState);
      enableEncounterActions(encounter);
    }
    if (shell) {
      shell.classList.add('is-combat-shell', 'is-combat-armed');
      shell.setAttribute('data-combat-state', 'shell');
      shell.classList.remove('is-action-pulse', 'is-scan-pulse', 'is-hold-pulse', 'is-signal-pulse', 'is-gate-pulse');
      void shell.offsetWidth;
      shell.classList.add('is-action-pulse', 'is-gate-pulse');
      window.setTimeout(function () {
        shell.classList.remove('is-action-pulse', 'is-gate-pulse');
      }, 650);
    }
  }

  function populateActiveHud(root, assembly, routeId, pathKey, missionLabel) {
    const hud = root.querySelector('[data-ooh-active-hud]');
    if (!hud) {
      return;
    }

    const telemetry = routeHudTelemetry(routeId);
    const fields = {
      codename: assembly.missionCodename || 'Pending',
      theater: assembly.routeTheater || routeLabel(routeId),
      mission: missionLabel,
      path: pathKey,
      status: 'ACTIVE',
      primary: assembly.primaryObjective || 'Pending',
      extraction: assembly.extractionCondition || 'Pending',
      telemetryA: telemetry[0],
      telemetryB: telemetry[1],
      telemetryC: telemetry[2]
    };

    Object.keys(fields).forEach(function (field) {
      const el = hud.querySelector('[data-ooh-hud-field="' + field + '"]');
      if (el) {
        el.textContent = fields[field];
      }
    });
  }

  function activateMission(root, shell, sceneStatus, routeId, pathKey, missionLabel, assembly) {
    root.classList.add('is-mission-active');
    if (shell) {
      shell.classList.add('is-mission-active');
      shell.setAttribute('data-mission-state', 'active');
    }
    if (sceneStatus) {
      sceneStatus.textContent = buildActiveSceneStatus(routeId, pathKey, missionLabel);
    }

    const debugPanel = root.querySelector('[data-ooh-briefing-debug]');
    if (debugPanel) {
      const panel = debugPanel.closest('.ooh-play-scene__debug');
      if (panel) {
        panel.hidden = true;
      }
    }

    const activateButton = root.querySelector('[data-ooh-activate-mission]');
    if (activateButton) {
      activateButton.textContent = 'MISSION ACTIVE';
      activateButton.disabled = true;
      activateButton.setAttribute('aria-disabled', 'true');
    }

    const hud = root.querySelector('[data-ooh-active-hud]');
    if (hud) {
      populateActiveHud(root, assembly || {}, routeId, pathKey, missionLabel);
      hud.setAttribute('aria-hidden', 'false');
      hud.querySelectorAll('[data-ooh-action]').forEach(function (button) {
        button.disabled = false;
        button.setAttribute('aria-disabled', 'false');
      });
      const readout = hud.querySelector('[data-ooh-action-readout]');
      if (readout) {
        readout.textContent = 'Passive inputs online. Awaiting SCAN, HOLD POSITION, or CHECK SIGNAL.';
      }
    }

    const combatGate = root.querySelector('[data-ooh-combat-gate]');
    if (combatGate) {
      combatGate.hidden = false;
    }

    const combatGateButton = root.querySelector('[data-ooh-combat-gate-button]');
    if (combatGateButton) {
      combatGateButton.disabled = false;
      combatGateButton.setAttribute('aria-disabled', 'false');
    }
  }

  function initSceneTransition(shell) {
    shell.classList.remove('has-scene-asset', 'has-scene-video', 'is-scene-ready', 'is-scene-video-ready');
    shell.classList.add('is-scene-loading');
    shell.style.removeProperty('--ooh-scene-bg-image');
  }

  function handleImageLoad(shell, asset) {
    shell.style.setProperty('--ooh-scene-bg-image', 'url("' + asset.image + '")');
    shell.classList.add('has-scene-asset');

    window.setTimeout(function () {
      shell.classList.remove('is-scene-loading');
      shell.classList.add('is-scene-ready');
    }, 80);
  }

  function handleVideoReady(shell, video) {
    window.setTimeout(function () {
      shell.classList.add('has-scene-video', 'is-scene-video-ready');
      video.play().catch(function () {});
    }, 420);
  }

  function bindSceneAssets(shell, routeId) {
    if (!shell) {
      return;
    }

    const asset = sceneAssetMap[routeId] || sceneAssetMap.terra;
    const video = shell.querySelector('[data-ooh-scene-video]');

    initSceneTransition(shell);
    shell.setAttribute('data-scene-asset', asset.label);

    const image = new Image();
    image.onload = function () {
      handleImageLoad(shell, asset);
    };
    image.onerror = function () {
      shell.style.removeProperty('--ooh-scene-bg-image');
      shell.classList.remove('has-scene-asset', 'has-scene-video', 'is-scene-loading', 'is-scene-ready', 'is-scene-video-ready');
    };
    image.src = asset.image;

    if (!video) {
      return;
    }

    video.pause();
    video.removeAttribute('src');
    video.load();
    video.oncanplay = function () {
      handleVideoReady(shell, video);
    };
    video.onerror = function () {
      shell.classList.remove('has-scene-video', 'is-scene-video-ready');
      video.removeAttribute('src');
    };
    video.src = asset.video;
    video.load();
  }

  function buildMissionCodename(payload, routeId, objective) {
    const route = routeLabel(routeId);
    const missionPart = (objective && objective.code) || cleanId(payload.missionType || ((payload.mission || {}).id), 'mission').toUpperCase();
    const pathPart = recruiterPathKey(payload);

    return 'OPERATION ' + route + '-' + missionPart + ' // ' + pathPart;
  }

  function buildMissionAssembly(payload) {
    const routeId = routeIdFromPayload(payload);
    const route = getRouteLanguage(routeId);
    const selectedPrompt = payload.selectedPrompt || {};
    const mission = payload.mission || {};
    const missionType = payload.missionType || mission.id || 'mission';
    const objectives = getMissionObjective(missionType, routeId);
    const missionLabel = itemLabel(mission, missionType);
    const routeCreditType = ((payload.campaignRoute || {}).routeCreditTypes || [])[0] ||
      selectedPrompt.routeCreditType ||
      route.creditType;

    return {
      missionCodename: buildMissionCodename(payload, routeId, objectives),
      routeTheater: route.theater,
      primaryObjective: objectives.primary,
      secondaryObjective: objectives.secondary,
      insertionStyle: route.insertion,
      environmentHazards: route.hazards,
      threatProfile: missionLabel + ' profile: ' + objectives.threat,
      recruiterDirective: getRecruiterDirective(payload),
      playlistMoodEffect: getPlaylistMoodEffect(payload),
      extractionCondition: route.extraction,
      routeCreditType: routeCreditType
    };
  }

  function assemblyLabels() {
    return {
      missionCodename: 'OPERATION CODENAME',
      routeTheater: 'THEATER',
      primaryObjective: 'PRIMARY OBJECTIVE',
      secondaryObjective: 'SECONDARY OBJECTIVE',
      insertionStyle: 'INSERTION',
      environmentHazards: 'HAZARDS',
      threatProfile: 'THREAT PROFILE',
      recruiterDirective: 'COMMAND DIRECTIVE',
      playlistMoodEffect: 'MOOD PROFILE',
      extractionCondition: 'EXTRACTION',
      routeCreditType: 'ROUTE CREDIT'
    };
  }

  function sceneCopy(routeId, payload, selectedPrompt) {
    const routeNames = {
      aer: 'Upper atmosphere approach corridor',
      mare: 'Submerged pressure-zone approach',
      terra: 'Ground ingress through broken surface terrain'
    };
    const missionLabel = itemLabel(payload.mission, payload.missionType || 'Unconfirmed Mission');
    const promptTitle = selectedPrompt ? (selectedPrompt.title || selectedPrompt.id || 'Prompt Block') : 'Prompt unavailable';

    return {
      label: 'MISSION SCENE // ' + routeLabel(routeId),
      location: routeNames[routeId] || routeNames.terra,
      promptTitle: promptTitle,
      missionLabel: missionLabel
    };
  }

  function promptExcerpt(rawText) {
    const text = String(rawText || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      return 'No prompt text is available for this campaign route yet. The dossier is still valid; the briefing channel is awaiting prompt source text.';
    }
    return text.length > 620 ? text.slice(0, 620).trim() + '...' : text;
  }

  function selectPromptBlock(payload, promptLibrary) {
    const routeId = routeIdFromPayload(payload);
    const routeBlocks = Array.isArray(promptLibrary[routeId]) ? promptLibrary[routeId] : [];

    if (routeBlocks.length) {
      return routeBlocks[0];
    }

    const payloadPrompts = payload.missionPrompts || {};
    const payloadRouteBlocks = Array.isArray(payloadPrompts[routeId]) ? payloadPrompts[routeId] : [];
    return payloadRouteBlocks.length ? payloadRouteBlocks[0] : null;
  }

  function buildBriefing(payload, selectedPrompt) {
    const routeId = routeIdFromPayload(payload);
    const missionLabel = itemLabel(payload.mission, payload.missionType || 'Unconfirmed Mission');
    const pathLabel = itemLabel(payload.path, 'Unconfirmed Path');
    const recruiter = payload.recruiter || {};
    const recruiterName = recruiter.name || ((payload.character || {}).recruiterName) || 'Unassigned recruiter';
    const playlistLabel = itemLabel(payload.playlist, 'No playlist selected');
    const promptText = selectedPrompt ? promptExcerpt(selectedPrompt.rawText) : promptExcerpt('');

    return [
      'Route ' + routeLabel(routeId) + ' accepts the dossier.',
      missionLabel + ' is assigned under ' + pathLabel + ' supervision.',
      recruiterName + ' confirms the selected evolution path and locks the mission channel.',
      'Playlist theme: ' + playlistLabel + '.',
      '',
      promptText
    ].join('\n');
  }

  Drupal.behaviors.oohPlayBriefing = {
    attach: function (context) {
      once('ooh-play-briefing', '[data-ooh-play]', context).forEach(function (root) {
        // Hydrate the /play scene from the Dossier payload stored before routing.
        const storedState = safeJsonParse(window.localStorage.getItem(stateKey), {}) || {};
        const payload = storedState.payload || {};
        const promptLibrary = (((drupalSettings || {}).ooh_outskirts || {}).missionPrompts) || {};
        const selectedPrompt = selectPromptBlock(payload, promptLibrary);
        payload.selectedPrompt = selectedPrompt;
        const routeId = routeIdFromPayload(payload);
        const recruiter = payload.recruiter || {};
        const shell = root.querySelector('[data-ooh-scene-shell]');
        const routeHeader = root.querySelector('[data-ooh-scene-route-label]');
        const sceneMissionLabel = root.querySelector('[data-ooh-scene-mission-label]');
        const sceneStatus = root.querySelector('[data-ooh-scene-status]');
        const activateButton = root.querySelector('[data-ooh-activate-mission]');
        const scene = sceneCopy(routeId, payload, selectedPrompt);
        const assembly = buildMissionAssembly(payload);
        const pathKey = recruiterPathKey(payload);
        const missionLabel = itemLabel(payload.mission, payload.missionType || 'Unconfirmed');
        const combatState = createCombatState();

        if (shell) {
          shell.setAttribute('data-route', routeAttribute(routeId));
          shell.setAttribute('data-path', pathKey);
          shell.setAttribute('data-mission-type', missionTypeAttribute(payload));
          shell.setAttribute('data-playlist-mood', playlistMoodAttribute(payload));
          shell.setAttribute('data-prompt-block', selectedPrompt ? (selectedPrompt.id || 'prompt_block') : 'unavailable');
          bindSceneAssets(shell, routeId);
        }

        if (routeHeader) {
          routeHeader.textContent = scene.label + ' // ' + scene.location;
        }

        if (sceneMissionLabel) {
          sceneMissionLabel.textContent = 'MISSION TYPE // ' + missionLabel.toUpperCase();
        }

        if (sceneStatus) {
          sceneStatus.textContent = buildSceneStatus(routeId, pathKey, missionLabel);
        }

        if (activateButton) {
          activateButton.addEventListener('click', function () {
            activateMission(root, shell, sceneStatus, routeId, pathKey, missionLabel, assembly);
            window.setTimeout(function () {
              scrollToMissionBriefing(root);
            }, 60);
          });
        }

        root.querySelectorAll('[data-ooh-action]').forEach(function (button) {
          button.addEventListener('click', function () {
            triggerPassiveAction(root, shell, button.getAttribute('data-ooh-action'), routeId, pathKey);
          });
        });

        const combatGateButton = root.querySelector('[data-ooh-combat-gate-button]');
        if (combatGateButton) {
          combatGateButton.addEventListener('click', function () {
            activateCombatShell(root, shell, sceneStatus, routeId, pathKey, missionLabel, combatState);
          });
        }

        root.querySelectorAll('.ooh-play-encounter__action').forEach(function (button) {
          button.addEventListener('click', function () {
            triggerEncounterAction(root, button, combatState);
          });
        });

        document.addEventListener('keydown', function (event) {
          const tagName = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : '';
          if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || event.ctrlKey || event.altKey || event.metaKey) {
            return;
          }

          const key = String(event.key || '').toLowerCase();
          const action = key === 's' ? 'scan' : (key === 'h' ? 'hold' : (key === 'c' ? 'signal' : ''));
          if (action) {
            triggerPassiveAction(root, shell, action, routeId, pathKey);
          }
        });

        const fields = {
          route: routeLabel(routeId),
          mission: missionLabel,
          path: itemLabel(payload.path, 'Unconfirmed'),
          recruiter: [recruiter.name || ((payload.character || {}).recruiterName), recruiter.title || ((payload.character || {}).recruiterTitle)].filter(Boolean).join(' / ') || 'Unassigned',
          playlist: itemLabel(payload.playlist, 'Unselected'),
          prompt: selectedPrompt ? (selectedPrompt.title || selectedPrompt.id || 'Prompt Block') : 'Unavailable'
        };

        Object.keys(fields).forEach(function (field) {
          const el = root.querySelector('[data-ooh-briefing-field="' + field + '"]');
          if (el) {
            el.textContent = fields[field];
          }
        });

        const briefingEl = root.querySelector('[data-ooh-generated-briefing]');
        if (briefingEl) {
          briefingEl.textContent = buildBriefing(payload, selectedPrompt);
        }

        Object.keys(assembly).forEach(function (field) {
          const el = root.querySelector('[data-ooh-assembly-field="' + field + '"]');
          if (el) {
            const labelEl = el.parentElement ? el.parentElement.querySelector('.ooh-generator__status-label') : null;
            const labels = assemblyLabels();
            if (labelEl && labels[field]) {
              labelEl.textContent = labels[field];
            }
            el.textContent = assembly[field];
          }
        });

        const debugEl = root.querySelector('[data-ooh-briefing-debug]');
        if (debugEl) {
          debugEl.textContent = JSON.stringify({
            payload: payload,
            selectedPrompt: selectedPrompt,
            missionAssembly: assembly
          }, null, 2);
        }
      });
    }
  };
})(Drupal, once, drupalSettings);
