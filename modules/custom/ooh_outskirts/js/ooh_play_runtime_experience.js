(function (Drupal, once) {
  'use strict';

  const escalationStages = [
    {
      id: 'insertion',
      label: 'INSERTION',
      pressure: 'ACTIVE',
      thresholdMs: 0,
      feed: [
        'MISSION FEED ONLINE',
        'YOU ARE INSIDE THE FIELD',
        'SECTOR CONDITIONS SHIFTING'
      ]
    },
    {
      id: 'contact',
      label: 'CONTACT',
      pressure: 'RISING',
      thresholdMs: 14000,
      feed: [
        'MOVEMENT DETECTED BEYOND FIELD LIMIT',
        'HOSTILE PRESSURE FORMING BEYOND THE FIELD',
        'SECTOR PRESSURE ESCALATING'
      ]
    },
    {
      id: 'instability',
      label: 'INSTABILITY',
      pressure: 'UNSTABLE',
      thresholdMs: 32000,
      feed: [
        'SIGNAL STABILITY FALLING',
        'HOSTILE INTERFERENCE INCREASING',
        'CHANNEL NOISE SPREADING'
      ]
    },
    {
      id: 'collapse-risk',
      label: 'COLLAPSE RISK',
      pressure: 'CRITICAL',
      thresholdMs: 54000,
      feed: [
        'SECTOR BOUNDARY LOSING SHAPE',
        'FIELD PRESSURE APPROACHING BREAKPOINT',
        'HOSTILE INTERFERENCE INCREASING'
      ]
    },
    {
      id: 'extraction-window',
      label: 'EXTRACTION WINDOW',
      pressure: 'EXTRACTION',
      thresholdMs: 76000,
      feed: [
        'EXTRACTION WINDOW NARROWING',
        'EXTRACTION CORRIDOR DESTABILIZING',
        'HOLD THE SIGNAL UNTIL THE ROUTE CLEARS'
      ]
    }
  ];

  const actionResponses = {
    scan: [
      'HOSTILE MOVEMENT DETECTED',
      'MOVEMENT DETECTED BEYOND FIELD LIMIT',
      'SIGNAL DISTORTION INCREASING'
    ],
    hold: [
      'SECTOR STABILIZATION HOLDING',
      'OPERATOR ANCHOR CONFIRMED',
      'PRESSURE LINE CONTAINED'
    ],
    signal: [
      'SIGNAL CHECK RETURNED',
      'SIGNAL STABILITY FALLING',
      'CHANNEL NOISE ISOLATED'
    ]
  };

  const forceResponses = {
    scan: [
      'FIELD EDGE DISTURBED BY OPERATOR PROBE',
      'PRESSURE RECOILS FROM THE SCAN LINE',
      'CONTACT TRACE RESISTS THE OPERATOR PRESENCE'
    ],
    hold: [
      'ROUTE QUIETED BY OPERATOR ANCHOR',
      'FIELD PRESSURE FORCED TO SETTLE',
      'MANIFESTATION PRESSURE HELD OUTSIDE THE LINE'
    ],
    signal: [
      'FIELD RESISTANCE READ THROUGH THE CHANNEL',
      'SIGNAL PRESSURE RETURNS AGAINST THE OPERATOR',
      'CONTACT FIELD MEASURES THE OPERATOR PRESENCE'
    ]
  };

  const runtimeStatePressure = {
    pressure: 'RISING',
    degraded: 'UNSTABLE',
    moving: 'UNSTABLE',
    extraction: 'EXTRACTION',
    lost: 'CRITICAL',
    complete: 'CLEARED'
  };

  const pressureReadability = {
    QUIET: 'QUIET',
    ACTIVE: 'ACTIVE FIELD',
    RISING: 'RISING CONTACT',
    UNSTABLE: 'UNSTABLE SIGNAL',
    CRITICAL: 'CRITICAL FIELD',
    EXTRACTION: 'EXTRACTION WINDOW',
    CLEARED: 'CLEARED'
  };

  const escalationSequenceLabels = {
    insertion: 'LOW PRESSURE',
    contact: 'RISING CONTACT',
    instability: 'UNSTABLE FIELD',
    'collapse-risk': 'COLLAPSE RISK',
    'extraction-window': 'RESOLUTION WINDOW'
  };

  const resolutionFeedLines = {
    extraction: [
      'EXTRACTION CORRIDOR OPEN // SURVIVAL NOT YET CLEAN',
      'ROUTE CLEARING UNDER PRESSURE // HOLD UNTIL SIGNAL RELEASE',
      'FIELD LETS GO IN PIECES // DO NOT BREAK FORMATION'
    ],
    complete: [
      'SURVIVAL CONFIRMED // FIELD RESIDUE STILL ATTACHED',
      'EXTRACTION COMPLETE // OPERATOR RETURNS WITH TRACE CONTAMINATION',
      'DEBRIEF CHANNEL OPEN // VICTORY REMAINS PARTIAL'
    ],
    collapse: [
      'FIELD COLLAPSE RECORDED // ROUTE MEMORY FAILED',
      'SIGNAL LOSS CONFIRMED // OPERATOR TRACE UNSTABLE',
      'AFTERMATH CHANNEL OPEN // CONSEQUENCE CANNOT BE CLEARED'
    ],
    critical: [
      'COLLAPSE PRESSURE BECOMING SELF-SUSTAINING',
      'FIELD BREAKPOINT APPROACHING // ACTIONS NOW CARRY FORWARD',
      'ROUTE STABILITY FAILING // EXTRACTION WINDOW MAY CLOSE'
    ]
  };

  const actionEffects = {
    scan: {
      label: 'EXPOSURE RISK',
      feed: [
        'SCAN WIDENS THE SIGNAL BUT EXPOSES THE OPERATOR LINE',
        'SCAN REVEALS PRESSURE AND LEAVES A BRIGHTER TRACE',
        'SCAN FINDS MOVEMENT; CONTACT MAY ANSWER'
      ]
    },
    hold: {
      label: 'STABILIZING',
      feed: [
        'HOLD POSITION STABILIZES THE FIELD LINE',
        'ANCHOR SET; PRESSURE ADVANCE SLOWS',
        'OPERATOR CONTROL FORCES THE ROUTE TO SETTLE'
      ]
    },
    signal: {
      label: 'READINESS CHECK',
      feed: [
        'CHECK SIGNAL MEASURES THE NEXT INTERRUPTION',
        'SIGNAL CHECK CLARIFIES READINESS WITHOUT ADVANCING',
        'CHANNEL ASSESSMENT RETURNS PRESSURE TIMING'
      ]
    }
  };

  const previewLoopDirectory = 'sites/default/files/adsilentium/play_loops/';
  const previewLoops = {
    insertion: 'oa_play_terra_video_loops_wasteland_ridge_core_insertion_drift_1440.mp4',
    contact: 'oa_play_terra_video_loops_wasteland_ridge_core_contact_interference_1440.mp4',
    instability: 'oa_play_terra_video_loops_wasteland_ridge_core_instability_signal_drift_1440.mp4',
    'collapse-risk': 'oa_play_terra_video_loops_wasteland_ridge_core_collapse_flicker_1440.mp4',
    'extraction-window': 'oa_play_terra_video_loops_wasteland_ridge_core_extraction_corridor_1440.mp4'
  };

  const manifestationEvents = {
    insertion: [
      { id: 'corridor', label: 'ROUTE NARROWS', feed: 'ROUTE GEOMETRY CLOSING AHEAD' },
      { id: 'signal', label: 'SIGNAL ECHO', feed: 'TRANSMISSION BURST ACROSS THE FIELD' }
    ],
    contact: [
      { id: 'silhouette', label: 'DISTANT CONTACT', feed: 'TRANSIENT SILHOUETTE BEYOND VISIBILITY' },
      { id: 'movement', label: 'PERIMETER MOTION', feed: 'MOVEMENT REGISTERED PAST THE CORRIDOR EDGE' }
    ],
    instability: [
      { id: 'contamination', label: 'ROUTE CONTAMINATION', feed: 'ROUTE CONTAMINATION ALERT' },
      { id: 'pressure', label: 'FIELD PRESSURE', feed: 'ENVIRONMENTAL PRESSURE SURGE' }
    ],
    'collapse-risk': [
      { id: 'manifestation', label: 'MANIFESTATION TRACE', feed: 'HOSTILE MANIFESTATION TRACE CLOSE TO FIELD LINE' },
      { id: 'rupture', label: 'SECTOR RUPTURE', feed: 'CORRIDOR INSTABILITY EVENT' }
    ],
    'extraction-window': [
      { id: 'extraction', label: 'EXTRACTION STATIC', feed: 'EXTRACTION CORRIDOR FLASHING THROUGH SIGNAL NOISE' },
      { id: 'contact', label: 'CONTACT BEHIND', feed: 'UNSEEN CONTACT PRESSING FROM BEHIND THE FIELD' }
    ]
  };

  const cadenceProfiles = {
    insertion: { intervalMs: 11800, warningMs: 3200, recoveryMs: 1800, label: 'QUIET' },
    contact: { intervalMs: 9800, warningMs: 3400, recoveryMs: 1700, label: 'WATCHING' },
    instability: { intervalMs: 8200, warningMs: 3600, recoveryMs: 1600, label: 'UNSTABLE' },
    'collapse-risk': { intervalMs: 6900, warningMs: 3900, recoveryMs: 1450, label: 'PRESSING' },
    'extraction-window': { intervalMs: 7600, warningMs: 3500, recoveryMs: 1500, label: 'CLOSING' }
  };

  const cadenceWarnings = [
    'THE FIELD HAS GONE QUIET',
    'CONTACT PRESSURE BUILDING OUTSIDE VISIBILITY',
    'ROUTE STATIC GATHERING AHEAD',
    'SOMETHING IS NEARBY'
  ];

  const contactTensionLines = {
    warning: [
      'MANIFESTATION PRESSURE NEAR THE ROUTE EDGE',
      'CONTACT ZONE FORMING OUTSIDE VISIBILITY',
      'FIELD HESITATION DETECTED AHEAD'
    ],
    suppressed: [
      'CONTACT PRESSURE SUPPRESSED BY OPERATOR ANCHOR',
      'CORRIDOR QUIET FORCED THROUGH THE FIELD',
      'MANIFESTATION TRACE HELD OUTSIDE THE LINE'
    ],
    signal: [
      'CONTACT RHYTHM EXPOSED THROUGH THE CHANNEL',
      'FIELD INSTABILITY ANSWERING THE SIGNAL CHECK',
      'MANIFESTATION RESISTANCE READ IN THE NOISE'
    ]
  };

  const pressureExchangeLines = {
    scan: [
      'FIELD RESPONSE INTENSIFYING ALONG THE ROUTE',
      'OPERATOR PROBE LEAVES PRESSURE RESIDUE',
      'MANIFESTATION SIGNATURE WITHDRAWING FROM THE SCAN'
    ],
    hold: [
      'SUPPRESSION HOLDING FOR THE MOMENT',
      'PRESSURE RESIDUE REMAINS ACTIVE',
      'FIELD PUSHBACK SLOWED BY OPERATOR ANCHOR'
    ],
    signal: [
      'THE CHANNEL RESISTS FURTHER READING',
      'INSTABILITY MOVING UNDER THE SIGNAL CHECK',
      'FIELD RESISTANCE ANSWERING THROUGH THE NOISE'
    ],
    cadence: [
      'SECTOR REMEMBERS THE DISTURBANCE',
      'PRESSURE SATURATION RISING UNDER THE ROUTE',
      'FIELD RESPONSE REMAINS ACTIVE'
    ]
  };

  const manifestationPresenceLines = {
    scan: [
      'MOVEMENT REGISTERED ALONG THE OUTER ROUTE',
      'THE CORRIDOR IS NO LONGER EMPTY',
      'UNSTABLE TRACE BRIEFLY ENTERS THE FIELD'
    ],
    hold: [
      'FIELD OCCUPATION SUPPRESSED FOR THE MOMENT',
      'ROUTE TRACE HELD OUTSIDE VISIBILITY',
      'CORRIDOR PRESENCE FORCED BACK INTO STATIC'
    ],
    signal: [
      'THE ROUTE REFUSES A CLEAR READING',
      'PRESSURE SHIFTS NEAR THE SIGNAL BED',
      'FIELD OCCUPATION DETECTED UNDER THE CHANNEL'
    ],
    contact: [
      'FIELD OCCUPATION DETECTED',
      'PRESENCE SHARING THE ROUTE EDGE',
      'TRACE MOVING THROUGH THE OUTER CORRIDOR'
    ]
  };

  const cadenceSamples = {
    scan: [
      'SCAN RETURNS EMPTY CORRIDOR',
      'SCAN FINDS PRESSURE BUT NO SHAPE',
      'SCAN PICKS UP DISTANT MOTION'
    ],
    hold: [
      'HOLDING POSITION DELAYS THE PRESSURE',
      'ANCHOR STEADY // FIELD RESPONSE SLOWS',
      'STABILIZATION WINDOW EXTENDED'
    ],
    signal: [
      'SIGNAL CHECK MAPS THE NEXT INTERRUPTION',
      'SIGNAL RHYTHM CONFIRMED',
      'CADENCE TRACE LOCKED'
    ]
  };

  const environmentRegistry = {
    deadRiverbed: {
      id: 'dead-riverbed',
      label: 'DEAD RIVERBED',
      mood: 'ASH HAZE',
      accent: 'magenta',
      residue: 'ASH RESIDUE',
      visualAnchors: ['collapsed ridges', 'skeletal pylons', 'ash channel'],
      stageSuitability: ['insertion', 'contact'],
      cadenceSuitability: ['silence', 'warning'],
      warnings: [
        'ASH HAZE SWALLOWING THE ROUTE',
        'PYLON LINE VANISHING AHEAD'
      ],
      routePressure: [
        'DEAD RIVERBED FUNNELS THE FIELD',
        'ASH CHANNEL CLOSING AROUND THE OPERATOR'
      ],
      contact: [
        'MOVEMENT REGISTERED BEYOND THE PYLONS',
        'DISTANT SHAPE LOST IN ASH HAZE'
      ]
    },
    utilityCorridor: {
      id: 'utility-corridor',
      label: 'UTILITY CORRIDOR',
      mood: 'WET CONCRETE',
      accent: 'green',
      residue: 'SERVICE-LINE HUM',
      visualAnchors: ['chain fence', 'service cables', 'flooded concrete'],
      stageSuitability: ['contact', 'instability'],
      cadenceSuitability: ['warning', 'interruption'],
      warnings: [
        'FENCE LINE PICKS UP STATIC',
        'UTILITY PASSAGE FALLS QUIET'
      ],
      routePressure: [
        'FLOODED CONCRETE CARRIES THE SIGNAL BACK',
        'SERVICE CABLES PULL THE ROUTE INWARD'
      ],
      contact: [
        'CONTACT TRACE MOVING BEHIND THE FENCE',
        'LOW MOTION ALONG THE SERVICE LINE'
      ]
    },
    industrialMarsh: {
      id: 'industrial-marsh',
      label: 'INDUSTRIAL MARSH',
      mood: 'BLUE FOG',
      accent: 'cyan',
      residue: 'WATERLINE STATIC',
      visualAnchors: ['standing water', 'antenna ruin', 'submerged cables'],
      stageSuitability: ['instability', 'collapse-risk'],
      cadenceSuitability: ['warning', 'interruption'],
      warnings: [
        'MARSH WATER CARRYING SIGNAL NOISE',
        'ANTENNA RUIN ANSWERING THE FIELD'
      ],
      routePressure: [
        'WATERLINE REFLECTIONS BREAK CADENCE',
        'SUBMERGED CABLES HUM UNDER THE ROUTE'
      ],
      contact: [
        'RIPPLE PATTERN MOVING AGAINST THE WIND',
        'DISTANT CONTACT BEYOND THE ANTENNA RUIN'
      ]
    },
    signalGrove: {
      id: 'signal-grove',
      label: 'SIGNAL GROVE',
      mood: 'ROOT STATIC',
      accent: 'cyan',
      residue: 'ROOT STATIC',
      visualAnchors: ['root-wrapped trees', 'shallow water', 'cyan runes'],
      stageSuitability: ['instability', 'collapse-risk'],
      cadenceSuitability: ['silence', 'warning'],
      warnings: [
        'ROOT STATIC RISING THROUGH THE GROVE',
        'GROVE BEACONS BEGIN ANSWERING EACH OTHER'
      ],
      routePressure: [
        'ROOTS BEND THE FIELD INTO A NARROW PASSAGE',
        'SHALLOW WATER HOLDS THE LAST SIGNAL ECHO'
      ],
      contact: [
        'SILHOUETTE BREAKS BETWEEN ROOTS',
        'CONTACT TRACE SPLITS ACROSS THE WATER'
      ]
    },
    aerialTrenchGate: {
      id: 'aerial-trench-gate',
      label: 'TRENCH GATE',
      mood: 'STORMFRONT',
      accent: 'blue',
      residue: 'STORMFRONT PRESSURE',
      visualAnchors: ['cathedral gate', 'ruined trench', 'storm corridor'],
      stageSuitability: ['collapse-risk', 'extraction-window'],
      cadenceSuitability: ['interruption', 'stabilized'],
      warnings: [
        'STORMFRONT COMPRESSING THE GATE',
        'TRENCH GATE LOSING DEPTH'
      ],
      routePressure: [
        'GATE ARCH HOLDS THE ROUTE OPEN',
        'STORM CORRIDOR PULLS AGAINST EXTRACTION'
      ],
      contact: [
        'CONTACT PRESSURE BEHIND THE GATE',
        'SILENT MOVEMENT ALONG THE TRENCH WALL'
      ]
    },
    bunkerApproach: {
      id: 'bunker-approach',
      label: 'BUNKER APPROACH',
      mood: 'BURIED SIGNAL',
      accent: 'cyan',
      residue: 'BURIED SIGNAL',
      visualAnchors: ['buried door', 'wet cables', 'cyan beacon'],
      stageSuitability: ['extraction-window'],
      cadenceSuitability: ['stabilized', 'interruption'],
      warnings: [
        'BURIED SIGNAL PULSE RETURNING',
        'BUNKER DOOR REFLECTING FIELD PRESSURE'
      ],
      routePressure: [
        'CABLE RUNS LEAD THE OPERATOR FORWARD',
        'BURIED APPROACH HOLDS A THIN SIGNAL PATH'
      ],
      contact: [
        'CONTACT TRACE FALLS BACK INTO THE BUNKER LINE',
        'PRESSURE MOVES UNDER THE WATER'
      ]
    }
  };

  const stageEnvironmentMap = {
    insertion: 'deadRiverbed',
    contact: 'utilityCorridor',
    instability: 'industrialMarsh',
    'collapse-risk': 'signalGrove',
    'extraction-window': 'bunkerApproach'
  };

  function identityRegistries() {
    return window.OOHIdentityRegistries || {};
  }

  function identityKeyFromLabel(value) {
    return String(value || '')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  }

  function registryEnvironmentIdentity(environment) {
    const registry = identityRegistries().environment || {};
    const keys = Object.keys(registry);
    for (let index = 0; index < keys.length; index += 1) {
      if (registry[keys[index]].id === environment.id) {
        return registry[keys[index]];
      }
    }
    return null;
  }

  function registrySoundtrackIdentity(root, environment) {
    const registry = identityRegistries().soundtrack || {};
    const environmentIdentity = registryEnvironmentIdentity(environment || {});
    const shell = root.querySelector('[data-ooh-scene-shell]');
    const authoredLabel = shell ? shell.getAttribute('data-playlist-label') : '';
    const authoredKey = identityKeyFromLabel(authoredLabel);

    return registry[authoredKey] || registry[environmentIdentity && environmentIdentity.soundtrackIdentity] || null;
  }

  function registrySectorLightIdentity(environment) {
    const registry = identityRegistries().sectorLight || {};
    const environmentIdentity = registryEnvironmentIdentity(environment || {});
    return registry[environmentIdentity && environmentIdentity.sectorLightIdentity] || null;
  }

  const sectorTransitionPhrases = {
    'dead-riverbed>utility-corridor': [
      'SERVICE LINE DEGRADATION DETECTED // ASH RESIDUE ON THE CONCRETE',
      'PYLON HAZE CARRYING INTO THE FLOODED PASSAGE'
    ],
    'utility-corridor>industrial-marsh': [
      'FLOODED UTILITY RUN BLEEDS INTO MARSH SIGNAL',
      'SERVICE-LINE HUM SINKING UNDER THE WATER'
    ],
    'industrial-marsh>signal-grove': [
      'LOW ROOT INTERFERENCE ALONG THE SIGNAL BED',
      'WATERLINE STATIC THREADING INTO THE GROVE'
    ],
    'signal-grove>bunker-approach': [
      'BURIED SIGNAL CARRYING ROOT STATIC FORWARD',
      'ROOT ECHOES CLINGING TO THE BUNKER APPROACH'
    ]
  };

  const continuityFeedLines = [
    'FIELD MEMORY DETECTED ALONG THE ROUTE',
    'PRIOR SECTOR TRACE REMAINS IN THE SIGNAL BED',
    'PRESSURE FOLLOWING THROUGH THE CORRIDOR',
    'ROUTE CONTINUITY UNSTABLE BUT HOLDING',
    'RESIDUE CARRYING FORWARD THROUGH THE FIELD'
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function nextFrom(list, index) {
    return list[index % list.length];
  }

  function stageById(id) {
    return escalationStages.filter(function (stage) {
      return stage.id === id;
    })[0] || escalationStages[0];
  }

  function activeElapsed(state) {
    return state.startedAt ? Date.now() - state.startedAt : 0;
  }

  function timedStageIndex(state) {
    const elapsed = activeElapsed(state);
    let index = 0;
    escalationStages.forEach(function (stage, stageIndex) {
      if (elapsed >= stage.thresholdMs) {
        index = stageIndex;
      }
    });
    return index;
  }

  function actionEscalationDelta(action) {
    if (action === 'scan') {
      return 2;
    }
    if (action === 'hold') {
      return -2;
    }
    return 0;
  }

  function effectiveStageIndex(root, state) {
    if (!root.classList.contains('is-mission-active')) {
      return 0;
    }

    const actionPressure = Math.floor(state.actionCount / 4);
    const saturationPressure = Math.floor(state.exchangeSaturation / 3);
    const momentumPressure = Math.floor(Math.max(0, state.escalationMomentum || 0) / 4);
    const timedPressure = timedStageIndex(state);
    const runtimeState = root.getAttribute('data-ooh-runtime-alive') || '';
    const extractionPressure = runtimeState === 'extraction' || root.classList.contains('is-field-extraction-complete') ? 4 : 0;
    const degradedPressure = runtimeState === 'degraded' || runtimeState === 'lost' ? 3 : 0;

    return clamp(Math.max(actionPressure, saturationPressure, momentumPressure, timedPressure, extractionPressure, degradedPressure), 0, escalationStages.length - 1);
  }

  function createPanel() {
    const panel = document.createElement('section');
    panel.className = 'ooh-runtime-experience-panel';
    panel.setAttribute('data-ooh-runtime-experience-panel', '');
    panel.setAttribute('aria-label', 'First-person mission feed');

    panel.innerHTML = [
      '<div class="ooh-runtime-experience-panel__head">',
      '<span class="ooh-runtime-experience-panel__label">FIELD EXPERIENCE</span>',
      '<span class="ooh-runtime-experience-panel__stage" data-ooh-runtime-experience-stage>STANDBY</span>',
      '</div>',
      '<div class="ooh-runtime-experience-panel__grid">',
      '<div><span>PRESSURE</span><strong data-ooh-runtime-experience-pressure>QUIET</strong></div>',
      '<div><span>EFFECT</span><strong data-ooh-runtime-experience-effect>STANDBY</strong></div>',
      '<div><span>DISTINCTION</span><strong data-ooh-runtime-experience-distinction>0</strong></div>',
      '<div><span>CONTACT</span><strong data-ooh-runtime-experience-contact>NONE</strong></div>',
      '<div><span>CADENCE</span><strong data-ooh-runtime-experience-cadence>QUIET</strong></div>',
      '<div><span>ENVIRONMENT</span><strong data-ooh-runtime-experience-environment>UNMAPPED</strong></div>',
      '<div><span>LIGHT</span><strong data-ooh-runtime-experience-sector-light>UNMAPPED</strong></div>',
      '<div><span>SOUNDTRACK</span><strong data-ooh-runtime-experience-playlist>LINKED</strong></div>',
      '<div><span>ROUTE</span><strong data-ooh-runtime-experience-route-depth>UNTRACED</strong></div>',
      '<div><span>RESIDUE</span><strong data-ooh-runtime-experience-residue>CLEAR</strong></div>',
      '<div><span>PRESENCE</span><strong data-ooh-runtime-experience-presence>DORMANT</strong></div>',
      '<div><span>EXCHANGE</span><strong data-ooh-runtime-experience-exchange>QUIET</strong></div>',
      '<div><span>TRACE</span><strong data-ooh-runtime-experience-manifestation>EMPTY</strong></div>',
      '</div>',
      '<p class="ooh-runtime-experience-panel__feed" data-ooh-runtime-experience-feed>Awaiting mission activation.</p>'
    ].join('');

    return panel;
  }

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'ooh-runtime-experience-overlay';
    overlay.setAttribute('data-ooh-runtime-experience-overlay', '');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = [
      '<span class="ooh-runtime-experience-overlay__vignette"></span>',
      '<span class="ooh-runtime-experience-overlay__corridor"></span>',
      '<span class="ooh-runtime-experience-overlay__silhouette"></span>',
      '<span class="ooh-runtime-experience-overlay__burst"></span>',
      '<span class="ooh-runtime-experience-overlay__scanline"></span>',
      '<span class="ooh-runtime-experience-overlay__sweep"></span>',
      '<span class="ooh-runtime-experience-overlay__interference"></span>'
    ].join('');
    return overlay;
  }

  function createLoopPreview() {
    const wrap = document.createElement('div');
    const video = document.createElement('video');

    wrap.className = 'ooh-runtime-experience-loop-preview';
    wrap.setAttribute('data-ooh-runtime-experience-loop-preview', '');
    wrap.setAttribute('aria-hidden', 'true');

    video.className = 'ooh-runtime-experience-loop-preview__video';
    video.setAttribute('data-ooh-runtime-experience-loop-video', '');
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'metadata');
    video.setAttribute('aria-hidden', 'true');

    wrap.appendChild(video);
    return wrap;
  }

  function ensureExperience(root) {
    const hud = root.querySelector('[data-ooh-active-hud]');
    const visual = root.querySelector('.ooh-play-scene__visual');
    if (!hud || !visual) {
      return null;
    }

    let panel = hud.querySelector('[data-ooh-runtime-experience-panel]');
    if (!panel) {
      panel = createPanel();
      hud.appendChild(panel);
    }

    let loopPreview = visual.querySelector('[data-ooh-runtime-experience-loop-preview]');
    if (!loopPreview) {
      loopPreview = createLoopPreview();
      visual.insertBefore(loopPreview, visual.firstChild);
    }

    let overlay = visual.querySelector('[data-ooh-runtime-experience-overlay]');
    if (!overlay) {
      overlay = createOverlay();
      visual.appendChild(overlay);
    }

    return {
      panel: panel,
      overlay: overlay,
      stage: panel.querySelector('[data-ooh-runtime-experience-stage]'),
      pressure: panel.querySelector('[data-ooh-runtime-experience-pressure]'),
      effect: panel.querySelector('[data-ooh-runtime-experience-effect]'),
      distinction: panel.querySelector('[data-ooh-runtime-experience-distinction]'),
      contact: panel.querySelector('[data-ooh-runtime-experience-contact]'),
      cadence: panel.querySelector('[data-ooh-runtime-experience-cadence]'),
      environment: panel.querySelector('[data-ooh-runtime-experience-environment]'),
      sectorLight: panel.querySelector('[data-ooh-runtime-experience-sector-light]'),
      playlist: panel.querySelector('[data-ooh-runtime-experience-playlist]'),
      routeDepth: panel.querySelector('[data-ooh-runtime-experience-route-depth]'),
      residue: panel.querySelector('[data-ooh-runtime-experience-residue]'),
      presence: panel.querySelector('[data-ooh-runtime-experience-presence]'),
      exchange: panel.querySelector('[data-ooh-runtime-experience-exchange]'),
      manifestation: panel.querySelector('[data-ooh-runtime-experience-manifestation]'),
      loopPreview: loopPreview,
      loopVideo: loopPreview.querySelector('[data-ooh-runtime-experience-loop-video]'),
      feed: panel.querySelector('[data-ooh-runtime-experience-feed]')
    };
  }

  function playlistLabel(root, environment) {
    const shell = root.querySelector('[data-ooh-scene-shell]');
    const label = shell ? shell.getAttribute('data-playlist-label') : '';
    const soundtrackIdentity = registrySoundtrackIdentity(root, environment || {});

    if (soundtrackIdentity && soundtrackIdentity.displayName) {
      return soundtrackIdentity.displayName.toUpperCase();
    }

    return label || (root.getAttribute('data-ooh-media-attached') === 'true' ? 'ACTIVE' : 'LINKED');
  }

  function contactLabel(state) {
    const now = Date.now();
    if (state.lastManifestation && now - state.lastManifestationAt < 3200) {
      return state.lastManifestation.label;
    }
    if (state.contactSuppressedUntil > now) {
      return 'SUPPRESSED';
    }
    if (state.cadencePhase === 'warning') {
      return 'PROXIMITY';
    }
    if (state.stageIndex > 0 || state.lastManifestation) {
      return 'DISTANT';
    }
    return 'NONE';
  }

  function cadenceProfile(stageId) {
    return cadenceProfiles[stageId] || cadenceProfiles.insertion;
  }

  function cadenceLabel(state, stage) {
    if (state.cadencePhase === 'interruption') {
      return 'INTERRUPT';
    }
    if (state.cadencePhase === 'warning') {
      return 'NEAR';
    }
    if (state.cadencePhase === 'stabilized') {
      return 'HELD';
    }
    return cadenceProfile(stage.id).label;
  }

  function pressureDisplayLabel(pressure) {
    return pressureReadability[pressure] || pressure;
  }

  function runtimeResolutionState(root, state) {
    const runtimeState = root.getAttribute('data-ooh-runtime-alive') || '';
    if (runtimeState === 'complete' || root.classList.contains('is-field-extraction-complete')) {
      return 'complete';
    }
    if (runtimeState === 'lost') {
      return 'collapse';
    }
    if (runtimeState === 'extraction' || state.stageIndex >= 4) {
      return 'extraction';
    }
    if (state.stageIndex >= 3 && state.exchangeSaturation >= 5) {
      return 'critical';
    }
    return '';
  }

  function operationalEffectLabel(root, state, active) {
    const resolutionState = active ? runtimeResolutionState(root, state) : '';
    if (!active) {
      return 'STANDBY';
    }
    if (resolutionState === 'complete') {
      return 'PARTIAL RELIEF';
    }
    if (resolutionState === 'collapse') {
      return 'AFTERMATH';
    }
    if (resolutionState === 'extraction') {
      return 'SURVIVE WINDOW';
    }
    if (resolutionState === 'critical') {
      return 'COLLAPSE NEAR';
    }
    if (state.operationalEffectUntil > Date.now()) {
      return state.operationalEffect || 'ACTIVE';
    }
    if (state.cadencePhase === 'warning') {
      return 'CONTACT NEAR';
    }
    if (state.cadencePhase === 'interruption') {
      return 'INTERRUPTION';
    }
    if (state.cadencePhase === 'stabilized') {
      return 'CONTROL HELD';
    }
    return escalationSequenceLabels[(escalationStages[state.stageIndex] || {}).id] || 'MONITORING';
  }

  function actionEffectFeed(action, state, environment) {
    const effect = actionEffects[action];
    if (!effect) {
      return '';
    }
    return environmentFeed(environment, nextFrom(effect.feed, state.actionCount + state.stageIndex));
  }

  function environmentForStage(stage) {
    return environmentRegistry[stageEnvironmentMap[stage.id]] || environmentRegistry.deadRiverbed;
  }

  function environmentById(id) {
    const keys = Object.keys(environmentRegistry);
    for (let index = 0; index < keys.length; index += 1) {
      const environment = environmentRegistry[keys[index]];
      if (environment.id === id) {
        return environment;
      }
    }
    return null;
  }

  function environmentPhrase(environment, field, fallback, index) {
    const list = environment[field] || [];
    if (!list.length) {
      return fallback;
    }
    return nextFrom(list, index || 0);
  }

  function environmentFeed(environment, message) {
    if (!message) {
      return '';
    }
    return environment.label + ' // ' + message;
  }

  function sectorTransitionPhrase(previous, current, state) {
    if (!previous || !current) {
      return '';
    }
    const key = previous.id + '>' + current.id;
    const authored = sectorTransitionPhrases[key] || [];
    if (authored.length) {
      return nextFrom(authored, state.transitionIndex);
    }
    return previous.residue + ' CARRYING INTO ' + current.label;
  }

  function updateSectorMemory(root, state, environment, active) {
    const now = Date.now();

    if (!active) {
      state.currentEnvironmentId = '';
      state.previousEnvironmentId = '';
      state.pendingSectorTransitionMessage = '';
      state.sectorTransitionUntil = 0;
      window.clearTimeout(state.sectorTransitionTimer);
      root.setAttribute('data-ooh-runtime-sector-transition', 'standby');
      root.removeAttribute('data-ooh-runtime-sector-residue');
      return;
    }

    if (!state.currentEnvironmentId) {
      state.currentEnvironmentId = environment.id;
      root.setAttribute('data-ooh-runtime-sector-transition', 'stable');
      root.removeAttribute('data-ooh-runtime-sector-residue');
      return;
    }

    if (state.currentEnvironmentId !== environment.id) {
      const previous = environmentById(state.currentEnvironmentId);
      state.previousEnvironmentId = previous ? previous.id : '';
      state.currentEnvironmentId = environment.id;
      state.transitionIndex += 1;
      state.sectorTransitionUntil = now + 6800;
      state.pendingSectorTransitionMessage = sectorTransitionPhrase(previous, environment, state);
      window.clearTimeout(state.sectorTransitionTimer);
      state.sectorTransitionTimer = window.setTimeout(function () {
        state.sectorTransitionUntil = 0;
        render(root, state);
      }, 6900);
    }

    if (state.sectorTransitionUntil > now && state.previousEnvironmentId) {
      root.setAttribute('data-ooh-runtime-sector-transition', 'bleed');
      root.setAttribute('data-ooh-runtime-sector-residue', state.previousEnvironmentId);
      return;
    }

    root.setAttribute('data-ooh-runtime-sector-transition', 'stable');
    root.removeAttribute('data-ooh-runtime-sector-residue');
  }

  function sectorEnvironmentLabel(state, environment) {
    const previous = environmentById(state.previousEnvironmentId);
    const environmentIdentity = registryEnvironmentIdentity(environment);
    const label = environmentIdentity && environmentIdentity.label ? environmentIdentity.label.toUpperCase() : environment.label;
    if (state.sectorTransitionUntil > Date.now() && previous) {
      return label + ' / ' + previous.residue;
    }
    return label;
  }

  function sectorLightLabel(environment) {
    const sectorLightIdentity = registrySectorLightIdentity(environment);
    return sectorLightIdentity && sectorLightIdentity.label ? sectorLightIdentity.label.toUpperCase() : 'UNMAPPED';
  }

  function sectorResidueLabel(state) {
    const previous = environmentById(state.previousEnvironmentId);
    if (state.sectorTransitionUntil > Date.now() && previous) {
      return previous.residue;
    }
    if (state.transitionIndex > 0) {
      return 'TRACE HELD';
    }
    return 'CLEAR';
  }

  function routeDepthLabel(root, state, active) {
    if (!active) {
      return 'UNTRACED';
    }
    const resolutionState = runtimeResolutionState(root, state);
    if (resolutionState === 'complete') {
      return 'DEBRIEF';
    }
    if (resolutionState === 'collapse') {
      return 'COLLAPSE';
    }
    if (resolutionState === 'critical') {
      return 'BREAKPOINT';
    }
    if (state.sectorTransitionUntil > Date.now() && state.previousEnvironmentId) {
      return 'CROSSING';
    }
    if (state.stageIndex >= 4) {
      return 'EXTRACTION';
    }
    if (state.stageIndex >= 2) {
      return 'DEEP FIELD';
    }
    if (state.stageIndex >= 1) {
      return 'INWARD';
    }
    return 'ENTRY ROUTE';
  }

  function resolutionFeed(root, state, environment) {
    const resolutionState = runtimeResolutionState(root, state);
    const list = resolutionFeedLines[resolutionState] || [];
    if (!list.length) {
      return '';
    }
    return environmentFeed(environment, nextFrom(list, state.feedIndex + state.actionCount + state.stageIndex));
  }

  function continuityFeed(state, environment) {
    if (state.transitionIndex <= 0 || state.feedIndex % 3 !== 1) {
      return '';
    }
    const previous = environmentById(state.previousEnvironmentId);
    const line = nextFrom(continuityFeedLines, state.feedIndex + state.transitionIndex);
    if (previous && state.sectorTransitionUntil > Date.now()) {
      return environmentFeed(environment, previous.residue + ' STILL CARRYING FORWARD');
    }
    return environmentFeed(environment, line);
  }

  function contactTensionState(state, active) {
    const now = Date.now();
    if (!active) {
      return 'standby';
    }
    if (state.contactSuppressedUntil > now) {
      return 'suppressed';
    }
    if (state.lastManifestation && now - state.lastManifestationAt < 3200) {
      return 'contact';
    }
    if (state.cadencePhase === 'warning') {
      return 'near';
    }
    if (state.stageIndex > 0 || state.lastManifestation) {
      return 'distant';
    }
    return 'quiet';
  }

  function contactTensionFeed(environment, state, type) {
    const list = contactTensionLines[type] || [];
    if (!list.length) {
      return '';
    }
    return environmentFeed(environment, nextFrom(list, state.cadenceIndex + state.actionCount + state.stageIndex));
  }

  function pressureExchangeLabel(state, active) {
    const now = Date.now();
    if (!active) {
      return 'QUIET';
    }
    if (state.exchangeUntil > now) {
      if (state.exchangeState === 'scan') {
        return 'DISTURBED';
      }
      if (state.exchangeState === 'hold') {
        return 'SUPPRESSED';
      }
      if (state.exchangeState === 'signal') {
        return 'RESISTING';
      }
      return 'ACTIVE';
    }
    if (state.exchangeSaturation >= 5) {
      return 'SATURATED';
    }
    if (state.exchangeSaturation >= 2) {
      return 'RESIDUAL';
    }
    return 'QUIET';
  }

  function resolutionPresenceLabel(root, state, active) {
    if (!active) {
      return '';
    }
    const resolutionState = runtimeResolutionState(root, state);
    if (resolutionState === 'complete') {
      return 'WITHDRAWING';
    }
    if (resolutionState === 'collapse') {
      return 'AFTERMATH';
    }
    if (resolutionState === 'extraction') {
      return 'BEHIND';
    }
    if (resolutionState === 'critical') {
      return 'CLOSING';
    }
    return '';
  }

  function pressureExchangeFeed(environment, state, type) {
    const list = pressureExchangeLines[type] || [];
    if (!list.length) {
      return '';
    }
    return environmentFeed(environment, nextFrom(list, state.actionCount + state.exchangeSaturation + state.stageIndex));
  }

  function markPressureExchange(root, state, action) {
    const now = Date.now();
    state.exchangeState = action;
    state.exchangeUntil = now + (action === 'hold' ? 3200 : 2600);
    state.exchangeSaturation = clamp(state.exchangeSaturation + (action === 'scan' ? 2 : (action === 'signal' ? 1 : 0)), 0, 7);
    window.clearTimeout(state.exchangeTimer);
    state.exchangeTimer = window.setTimeout(function () {
      state.exchangeUntil = 0;
      render(root, state);
    }, action === 'hold' ? 3300 : 2700);
  }

  function manifestationPresenceLabel(state, active) {
    const now = Date.now();
    if (!active) {
      return 'EMPTY';
    }
    if (state.manifestationPresenceUntil > now) {
      if (state.manifestationPresenceState === 'suppressed') {
        return 'SUPPRESSED';
      }
      if (state.manifestationPresenceState === 'occupied') {
        return 'OCCUPIED';
      }
      if (state.manifestationPresenceState === 'nearby') {
        return 'NEARBY';
      }
      return 'FLEETING';
    }
    if (state.lastManifestation && now - state.lastManifestationAt < 6200) {
      return 'NEARBY';
    }
    if (state.stageIndex > 1 || state.exchangeSaturation >= 5) {
      return 'TRACE';
    }
    return 'EMPTY';
  }

  function manifestationPresenceFeed(environment, state, type) {
    const list = manifestationPresenceLines[type] || [];
    if (!list.length) {
      return '';
    }
    return environmentFeed(environment, nextFrom(list, state.actionCount + state.eventIndex + state.stageIndex));
  }

  function markManifestationPresence(root, state, type, duration) {
    state.manifestationPresenceState = type;
    state.manifestationPresenceUntil = Date.now() + duration;
    window.clearTimeout(state.manifestationPresenceTimer);
    state.manifestationPresenceTimer = window.setTimeout(function () {
      state.manifestationPresenceUntil = 0;
      render(root, state);
    }, duration + 100);
  }

  function presenceLabel(state, active) {
    if (!active) {
      return 'DORMANT';
    }
    if (state.forcePulseUntil > Date.now()) {
      if (state.lastForceAction === 'scan') {
        return 'PROBING';
      }
      if (state.lastForceAction === 'hold') {
        return 'ANCHORED';
      }
      if (state.lastForceAction === 'signal') {
        return 'READING';
      }
    }
    if (state.operatorPresence >= 5) {
      return 'FELT';
    }
    if (state.operatorPresence >= 2) {
      return 'WAKING';
    }
    return 'QUIET';
  }

  function forceResponse(state, environment, action) {
    const list = forceResponses[action] || [];
    const justTriggeredContact = Date.now() - (state.lastManifestationAt || 0) < 160;
    if (!list.length || state.actionCount % 2 === 0 || justTriggeredContact) {
      return '';
    }
    return environmentFeed(environment, nextFrom(list, state.actionCount + state.stageIndex));
  }

  function loopPathForStage(stageId) {
    const filename = previewLoops[stageId] || '';
    const path = filename ? previewLoopDirectory + filename : '';
    if (!path) {
      return '';
    }
    if (Drupal && typeof Drupal.url === 'function') {
      return Drupal.url(path);
    }
    return '/' + path;
  }

  function syncLoopPreview(experience, active, stageId) {
    const video = experience.loopVideo;
    const loopPreview = experience.loopPreview;
    if (!video || !loopPreview) {
      return;
    }

    const nextSrc = active ? loopPathForStage(stageId) : '';
    loopPreview.setAttribute('data-ooh-runtime-experience-loop-stage', active ? stageId : 'standby');
    loopPreview.classList.toggle('is-active', Boolean(nextSrc));

    if (!nextSrc) {
      video.removeAttribute('src');
      video.load();
      return;
    }

    if (video.getAttribute('src') !== nextSrc) {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', '');
      video.setAttribute('src', nextSrc);
      video.load();
    }

    if (video.paused) {
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(function () {});
      }
    }
  }

  function eventForStage(stageId, state) {
    const events = manifestationEvents[stageId] || manifestationEvents.insertion;
    return events[state.eventIndex % events.length];
  }

  function clearManifestation(root) {
    root.removeAttribute('data-ooh-runtime-experience-contact');
    window.clearTimeout(root.oohRuntimeManifestationTimer);
  }

  function cadenceInterval(state, stage) {
    const profile = cadenceProfile(stage.id);
    const pressureTrim = state.stageIndex * 620;
    const actionTrim = Math.min(1700, Math.max(0, state.escalationMomentum || 0) * 140);
    const breath = (state.cadenceIndex % 3) * 900;
    return clamp(profile.intervalMs - pressureTrim - actionTrim + breath, 5600, 12800);
  }

  function scheduleNextCadence(state, stage, now, extraDelay) {
    state.cadenceIndex += 1;
    state.nextManifestationAt = now + cadenceInterval(state, stage) + (extraDelay || 0);
    state.warningIssued = false;
  }

  function setCadence(root, state, phase) {
    state.cadencePhase = phase;
    root.setAttribute('data-ooh-runtime-experience-cadence-state', phase);
  }

  function triggerManifestation(root, state, stage, immediate) {
    if (!root.classList.contains('is-mission-active')) {
      return '';
    }

    const now = Date.now();
    if (!immediate && now < state.nextManifestationAt) {
      return '';
    }

    const event = eventForStage(stage.id, state);
    const environment = environmentForStage(stage);
    state.eventIndex += 1;
    state.lastManifestation = event;
    state.lastManifestationAt = now;
    state.contactSuppressedUntil = 0;
    state.exchangeSaturation = clamp(state.exchangeSaturation + 1, 0, 7);
    markManifestationPresence(root, state, 'occupied', immediate ? 2300 : 3100);
    setCadence(root, state, 'interruption');
    scheduleNextCadence(state, stage, now, cadenceProfile(stage.id).recoveryMs);

    root.setAttribute('data-ooh-runtime-experience-contact', event.id);
    window.clearTimeout(root.oohRuntimeManifestationTimer);
    root.oohRuntimeManifestationTimer = window.setTimeout(function () {
      clearManifestation(root);
    }, immediate ? 1250 : 1680);

    return environmentFeed(environment, environmentPhrase(environment, 'contact', event.feed, state.eventIndex));
  }

  function cadenceTick(root, state, stage) {
    const now = Date.now();
    const profile = cadenceProfile(stage.id);

    if (!state.nextManifestationAt) {
      scheduleNextCadence(state, stage, now, 1800);
      setCadence(root, state, 'silence');
      return '';
    }

    if (now >= state.nextManifestationAt) {
      return triggerManifestation(root, state, stage, false);
    }

    if (!state.warningIssued && state.nextManifestationAt - now <= profile.warningMs) {
      const environment = environmentForStage(stage);
      state.warningIssued = true;
      markManifestationPresence(root, state, 'nearby', 3400);
      setCadence(root, state, 'warning');
      if (state.exchangeSaturation > 0 && state.cadenceIndex % 2 === 0) {
        return pressureExchangeFeed(environment, state, 'cadence');
      }
      return contactTensionFeed(environment, state, 'warning') || environmentFeed(environment, environmentPhrase(environment, 'warnings', nextFrom(cadenceWarnings, state.cadenceIndex + state.stageIndex), state.cadenceIndex));
    }

    if (state.cadencePhase !== 'stabilized') {
      setCadence(root, state, 'silence');
    }
    return '';
  }

  function sampleCadence(root, state, stage, action) {
    const now = Date.now();
    const environment = environmentForStage(stage);
    const timeSinceEvent = now - (state.lastManifestationAt || 0);
    const nearEvent = state.nextManifestationAt && state.nextManifestationAt - now <= cadenceProfile(stage.id).warningMs;

    if (action === 'scan' && nearEvent && timeSinceEvent > 4200) {
      return triggerManifestation(root, state, stage, true);
    }

    if (action === 'hold') {
      state.nextManifestationAt = Math.max(state.nextManifestationAt || now, now + 5600);
      state.warningIssued = false;
      state.contactSuppressedUntil = now + 3600;
      state.exchangeSaturation = clamp(state.exchangeSaturation - 2, 0, 7);
      markManifestationPresence(root, state, 'suppressed', 3600);
      setCadence(root, state, 'stabilized');
    }

    if (action === 'signal' && nearEvent) {
      markManifestationPresence(root, state, 'occupied', 2600);
      setCadence(root, state, 'warning');
      return contactTensionFeed(environment, state, 'signal');
    }

    if (action === 'scan') {
      state.nextManifestationAt = Math.min(state.nextManifestationAt || now + 6200, now + 5200);
      state.warningIssued = false;
      state.exchangeSaturation = clamp(state.exchangeSaturation + 1, 0, 7);
      markManifestationPresence(root, state, 'fleeting', 2100);
      return environmentFeed(environment, environmentPhrase(environment, 'contact', nextFrom(cadenceSamples.scan, state.actionCount + state.stageIndex), state.actionCount));
    }
    if (action === 'signal') {
      state.nextManifestationAt = Math.max(state.nextManifestationAt || now, now + 3400);
    }
    if (action === 'hold') {
      return contactTensionFeed(environment, state, 'suppressed') || environmentFeed(environment, environmentPhrase(environment, 'routePressure', nextFrom(cadenceSamples.hold, state.actionCount + state.stageIndex), state.actionCount));
    }
    return environmentFeed(environment, nextFrom(cadenceSamples[action] || cadenceSamples.scan, state.actionCount + state.stageIndex));
  }

  function readPressure(root, state, stage) {
    const runtimeState = root.getAttribute('data-ooh-runtime-alive') || '';
    if (runtimeStatePressure[runtimeState]) {
      return runtimeStatePressure[runtimeState];
    }
    if (root.classList.contains('is-field-extraction-complete')) {
      return 'EXTRACTION';
    }
    if (!root.classList.contains('is-mission-active')) {
      return 'QUIET';
    }
    return stage.pressure;
  }

  function updateDistinction(state) {
    const elapsedScore = Math.floor(activeElapsed(state) / 30000);
    const actionScore = Math.floor(state.actionCount / 3);
    const stageScore = state.stageIndex >= 2 ? 1 : 0;
    state.distinction = clamp(Math.max(state.distinction, actionScore + stageScore + elapsedScore), 0, 9);
  }

  function render(root, state, message) {
    const experience = ensureExperience(root);
    if (!experience) {
      return;
    }

    const active = root.classList.contains('is-mission-active');
    state.stageIndex = active ? effectiveStageIndex(root, state) : 0;
    const stage = active ? escalationStages[state.stageIndex] : stageById('insertion');
    const environment = environmentForStage(stage);
    const pressure = readPressure(root, state, stage);
    updateSectorMemory(root, state, environment, active);
    updateDistinction(state);

    root.setAttribute('data-ooh-runtime-experience', active ? 'active' : 'standby');
    root.setAttribute('data-ooh-runtime-experience-stage', active ? stage.id : 'standby');
    root.setAttribute('data-ooh-runtime-experience-pressure', pressure.toLowerCase());
    root.setAttribute('data-ooh-runtime-experience-intensity', String(state.stageIndex));
    root.setAttribute('data-ooh-runtime-experience-cadence-state', active ? state.cadencePhase : 'standby');
    root.setAttribute('data-ooh-runtime-environment', active ? environment.id : 'standby');
    root.setAttribute('data-ooh-runtime-sector-light', active ? (registrySectorLightIdentity(environment) || {}).id || 'unmapped' : 'standby');
    root.setAttribute('data-ooh-runtime-soundtrack-identity', active ? (registrySoundtrackIdentity(root, environment) || {}).id || 'unmapped' : 'standby');
    root.setAttribute('data-ooh-runtime-route-depth', active ? routeDepthLabel(root, state, active).toLowerCase().replace(/\s+/g, '-') : 'standby');
    root.setAttribute('data-ooh-runtime-force-presence', presenceLabel(state, active).toLowerCase());
    root.setAttribute('data-ooh-runtime-contact-tension', contactTensionState(state, active));
    root.setAttribute('data-ooh-runtime-pressure-exchange', pressureExchangeLabel(state, active).toLowerCase());
    root.setAttribute('data-ooh-runtime-manifestation-presence', manifestationPresenceLabel(state, active).toLowerCase());

    syncLoopPreview(experience, active, stage.id);

    experience.overlay.setAttribute('data-ooh-runtime-experience-stage', active ? stage.id : 'standby');
    experience.overlay.setAttribute('data-ooh-runtime-experience-pressure', pressure.toLowerCase());
    experience.stage.textContent = active ? stage.label : 'STANDBY';
    experience.pressure.textContent = pressureDisplayLabel(pressure);
    if (experience.effect) {
      experience.effect.textContent = operationalEffectLabel(root, state, active);
    }
    experience.distinction.textContent = String(state.distinction);
    if (experience.contact) {
      experience.contact.textContent = active ? contactLabel(state) : 'NONE';
    }
    if (experience.cadence) {
      experience.cadence.textContent = active ? cadenceLabel(state, stage) : 'QUIET';
    }
    if (experience.environment) {
      experience.environment.textContent = active ? sectorEnvironmentLabel(state, environment) : 'UNMAPPED';
    }
    if (experience.sectorLight) {
      experience.sectorLight.textContent = active ? sectorLightLabel(environment) : 'UNMAPPED';
    }
    if (experience.playlist) {
      experience.playlist.textContent = playlistLabel(root, environment);
    }
    if (experience.routeDepth) {
      experience.routeDepth.textContent = routeDepthLabel(root, state, active);
    }
    if (experience.residue) {
      experience.residue.textContent = active ? sectorResidueLabel(state) : 'CLEAR';
    }
    if (experience.presence) {
      experience.presence.textContent = presenceLabel(state, active);
    }
    if (experience.exchange) {
      experience.exchange.textContent = pressureExchangeLabel(state, active);
    }
    if (experience.manifestation) {
      experience.manifestation.textContent = resolutionPresenceLabel(root, state, active) || manifestationPresenceLabel(state, active);
    }
    if (state.pendingSectorTransitionMessage && state.sectorTransitionUntil <= Date.now()) {
      state.pendingSectorTransitionMessage = '';
    }
    const transitionMessage = active && !message ? state.pendingSectorTransitionMessage : '';
    if (transitionMessage) {
      state.pendingSectorTransitionMessage = '';
    }
    const memoryMessage = active && !message && !transitionMessage ? continuityFeed(state, environment) : '';
    const closureMessage = active && !message && !transitionMessage && !memoryMessage ? resolutionFeed(root, state, environment) : '';
    experience.feed.textContent = message || transitionMessage || memoryMessage || closureMessage || (active ? environmentFeed(environment, nextFrom(stage.feed, state.feedIndex)) : 'Awaiting mission activation.');
  }

  function pulse(root, action) {
    root.setAttribute('data-ooh-runtime-experience-pulse', action);
    window.clearTimeout(root.oohRuntimeExperiencePulseTimer);
    root.oohRuntimeExperiencePulseTimer = window.setTimeout(function () {
      root.removeAttribute('data-ooh-runtime-experience-pulse');
    }, 980);
  }

  function activateRuntime(root, state) {
    state.activated = true;
    state.startedAt = Date.now();
    state.feedIndex = 0;
    state.stageIndex = 0;
    state.currentEnvironmentId = '';
    state.previousEnvironmentId = '';
    state.pendingSectorTransitionMessage = '';
    state.sectorTransitionUntil = 0;
    window.clearTimeout(state.sectorTransitionTimer);
    state.transitionIndex = 0;
    state.forcePulseUntil = 0;
    state.lastForceAction = '';
    state.operatorPresence = 1;
    state.contactSuppressedUntil = 0;
    state.exchangeState = '';
    state.exchangeUntil = 0;
    state.exchangeSaturation = 0;
    state.escalationMomentum = 0;
    state.manifestationPresenceState = '';
    state.manifestationPresenceUntil = 0;
    state.operationalEffect = '';
    state.operationalEffectUntil = 0;
    window.clearTimeout(state.forcePresenceTimer);
    window.clearTimeout(state.exchangeTimer);
    window.clearTimeout(state.manifestationPresenceTimer);
    state.nextManifestationAt = Date.now() + 7200;
    state.warningIssued = false;
    setCadence(root, state, 'silence');
    render(root, state, 'YOU ARE INSIDE THE FIELD');
    pulse(root, 'activate');
  }

  function advanceFromAction(root, state, action) {
    if (!root.classList.contains('is-mission-active')) {
      return;
    }

    if (!state.startedAt) {
      state.startedAt = Date.now();
    }

    const responses = actionResponses[action] || escalationStages[state.stageIndex].feed;
    state.actionCount += 1;
    state.feedIndex += 1;
    state.lastAction = action;
    state.lastForceAction = action;
    state.forcePulseUntil = Date.now() + 1800;
    state.operationalEffect = (actionEffects[action] || {}).label || 'ACTIVE';
    state.operationalEffectUntil = Date.now() + 3200;
    state.escalationMomentum = clamp((state.escalationMomentum || 0) + actionEscalationDelta(action), 0, 12);
    state.operatorPresence = clamp(state.operatorPresence + (action === 'hold' ? 1 : 2), 0, 6);
    markPressureExchange(root, state, action);
    window.clearTimeout(state.forcePresenceTimer);
    state.forcePresenceTimer = window.setTimeout(function () {
      state.forcePulseUntil = 0;
      render(root, state);
    }, 1850);

    const stage = escalationStages[effectiveStageIndex(root, state)];
    const eventMessage = sampleCadence(root, state, stage, action);
    const environment = environmentForStage(stage);
    const exchangeMessage = state.actionCount % 2 === 0 ? pressureExchangeFeed(environment, state, action) : '';
    const presenceMessage = state.actionCount % 3 === 0 ? manifestationPresenceFeed(environment, state, action) : '';
    const effectMessage = actionEffectFeed(action, state, environment);
    const message = presenceMessage || forceResponse(state, environment, action) || exchangeMessage || eventMessage || effectMessage || nextFrom(responses, state.actionCount - 1);
    render(root, state, message);
    pulse(root, action);

    if (state.distinction > 0 && state.actionCount % 5 === 0) {
      window.setTimeout(function () {
        render(root, state, 'OPERATOR DISTINCTION UPDATED');
      }, 760);
    }
  }

  function bindActions(root, state) {
    root.querySelectorAll('[data-ooh-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        advanceFromAction(root, state, button.getAttribute('data-ooh-action') || '');
      });
    });
  }

  function observeActivation(root, state) {
    const observer = new MutationObserver(function () {
      const active = root.classList.contains('is-mission-active');
      if (active && !state.activated) {
        activateRuntime(root, state);
        return;
      }
      render(root, state);
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: [
        'class',
        'data-ooh-runtime-alive',
        'data-ooh-extraction-uncertainty'
      ]
    });
  }

  function startFeedLoop(root, state) {
    window.setInterval(function () {
      if (!root.classList.contains('is-mission-active')) {
        render(root, state);
        return;
      }
      if (!state.startedAt) {
        state.startedAt = Date.now();
      }
      state.feedIndex += 1;
      const stage = escalationStages[effectiveStageIndex(root, state)];
      render(root, state, cadenceTick(root, state, stage));
    }, 5200);
  }

  Drupal.behaviors.oohRuntimeExperience = {
    attach: function (context) {
      once('ooh-runtime-experience', '[data-ooh-play]', context).forEach(function (root) {
        const state = {
          activated: root.classList.contains('is-mission-active'),
          actionCount: 0,
          distinction: 0,
          cadenceIndex: 0,
          cadencePhase: 'standby',
          eventIndex: 0,
          feedIndex: 0,
          contactSuppressedUntil: 0,
          exchangeSaturation: 0,
          escalationMomentum: 0,
          exchangeState: '',
          exchangeTimer: null,
          exchangeUntil: 0,
          manifestationPresenceState: '',
          manifestationPresenceTimer: null,
          manifestationPresenceUntil: 0,
          operationalEffect: '',
          operationalEffectUntil: 0,
          lastManifestation: null,
          lastManifestationAt: 0,
          lastAction: '',
          nextManifestationAt: 0,
          currentEnvironmentId: '',
          previousEnvironmentId: '',
          pendingSectorTransitionMessage: '',
          sectorTransitionUntil: 0,
          sectorTransitionTimer: null,
          forcePulseUntil: 0,
          forcePresenceTimer: null,
          lastForceAction: '',
          operatorPresence: 0,
          stageIndex: 0,
          startedAt: root.classList.contains('is-mission-active') ? Date.now() : 0,
          transitionIndex: 0,
          warningIssued: false
        };

        ensureExperience(root);
        bindActions(root, state);
        observeActivation(root, state);
        startFeedLoop(root, state);
        render(root, state);
      });
    }
  };
})(Drupal, once);
