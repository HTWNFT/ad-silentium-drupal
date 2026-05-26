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

  const runtimeStatePressure = {
    pressure: 'RISING',
    degraded: 'UNSTABLE',
    moving: 'UNSTABLE',
    extraction: 'EXTRACTION',
    lost: 'CRITICAL',
    complete: 'CLEARED'
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

  function effectiveStageIndex(root, state) {
    if (!root.classList.contains('is-mission-active')) {
      return 0;
    }

    const actionPressure = Math.floor(state.actionCount / 3);
    const timedPressure = timedStageIndex(state);
    const runtimeState = root.getAttribute('data-ooh-runtime-alive') || '';
    const extractionPressure = runtimeState === 'extraction' || root.classList.contains('is-field-extraction-complete') ? 4 : 0;
    const degradedPressure = runtimeState === 'degraded' || runtimeState === 'lost' ? 3 : 0;

    return clamp(Math.max(actionPressure, timedPressure, extractionPressure, degradedPressure), 0, escalationStages.length - 1);
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
      '<div><span>DISTINCTION</span><strong data-ooh-runtime-experience-distinction>0</strong></div>',
      '<div><span>CONTACT</span><strong data-ooh-runtime-experience-contact>NONE</strong></div>',
      '<div><span>CADENCE</span><strong data-ooh-runtime-experience-cadence>QUIET</strong></div>',
      '<div><span>SOUNDTRACK</span><strong data-ooh-runtime-experience-playlist>LINKED</strong></div>',
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
      distinction: panel.querySelector('[data-ooh-runtime-experience-distinction]'),
      contact: panel.querySelector('[data-ooh-runtime-experience-contact]'),
      cadence: panel.querySelector('[data-ooh-runtime-experience-cadence]'),
      playlist: panel.querySelector('[data-ooh-runtime-experience-playlist]'),
      loopPreview: loopPreview,
      loopVideo: loopPreview.querySelector('[data-ooh-runtime-experience-loop-video]'),
      feed: panel.querySelector('[data-ooh-runtime-experience-feed]')
    };
  }

  function playlistLabel(root) {
    const shell = root.querySelector('[data-ooh-scene-shell]');
    const label = shell ? shell.getAttribute('data-playlist-label') : '';
    return label || (root.getAttribute('data-ooh-media-attached') === 'true' ? 'ACTIVE' : 'LINKED');
  }

  function contactLabel(state) {
    if (!state.lastManifestation) {
      return state.stageIndex > 0 ? 'DISTANT' : 'NONE';
    }
    return state.lastManifestation.label;
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
    const actionTrim = Math.min(1500, state.actionCount * 120);
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
    state.eventIndex += 1;
    state.lastManifestation = event;
    state.lastManifestationAt = now;
    setCadence(root, state, 'interruption');
    scheduleNextCadence(state, stage, now, cadenceProfile(stage.id).recoveryMs);

    root.setAttribute('data-ooh-runtime-experience-contact', event.id);
    window.clearTimeout(root.oohRuntimeManifestationTimer);
    root.oohRuntimeManifestationTimer = window.setTimeout(function () {
      clearManifestation(root);
    }, immediate ? 1250 : 1680);

    return event.feed;
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
      state.warningIssued = true;
      setCadence(root, state, 'warning');
      return nextFrom(cadenceWarnings, state.cadenceIndex + state.stageIndex);
    }

    if (state.cadencePhase !== 'stabilized') {
      setCadence(root, state, 'silence');
    }
    return '';
  }

  function sampleCadence(root, state, stage, action) {
    const now = Date.now();
    const timeSinceEvent = now - (state.lastManifestationAt || 0);
    const nearEvent = state.nextManifestationAt && state.nextManifestationAt - now <= cadenceProfile(stage.id).warningMs;

    if (action === 'scan' && nearEvent && timeSinceEvent > 4200) {
      return triggerManifestation(root, state, stage, true);
    }

    if (action === 'hold') {
      state.nextManifestationAt = Math.max(state.nextManifestationAt || now, now + 4200);
      state.warningIssued = false;
      setCadence(root, state, 'stabilized');
    }

    if (action === 'signal' && nearEvent) {
      setCadence(root, state, 'warning');
    }

    return nextFrom(cadenceSamples[action] || cadenceSamples.scan, state.actionCount + state.stageIndex);
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
    const pressure = readPressure(root, state, stage);
    updateDistinction(state);

    root.setAttribute('data-ooh-runtime-experience', active ? 'active' : 'standby');
    root.setAttribute('data-ooh-runtime-experience-stage', active ? stage.id : 'standby');
    root.setAttribute('data-ooh-runtime-experience-pressure', pressure.toLowerCase());
    root.setAttribute('data-ooh-runtime-experience-intensity', String(state.stageIndex));
    root.setAttribute('data-ooh-runtime-experience-cadence-state', active ? state.cadencePhase : 'standby');

    syncLoopPreview(experience, active, stage.id);

    experience.overlay.setAttribute('data-ooh-runtime-experience-stage', active ? stage.id : 'standby');
    experience.overlay.setAttribute('data-ooh-runtime-experience-pressure', pressure.toLowerCase());
    experience.stage.textContent = active ? stage.label : 'STANDBY';
    experience.pressure.textContent = pressure;
    experience.distinction.textContent = String(state.distinction);
    if (experience.contact) {
      experience.contact.textContent = active ? contactLabel(state) : 'NONE';
    }
    if (experience.cadence) {
      experience.cadence.textContent = active ? cadenceLabel(state, stage) : 'QUIET';
    }
    if (experience.playlist) {
      experience.playlist.textContent = playlistLabel(root);
    }
    experience.feed.textContent = message || (active ? nextFrom(stage.feed, state.feedIndex) : 'Awaiting mission activation.');
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

    const stage = escalationStages[effectiveStageIndex(root, state)];
    const eventMessage = sampleCadence(root, state, stage, action);
    const message = eventMessage || nextFrom(responses, state.actionCount - 1);
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
          lastManifestation: null,
          lastManifestationAt: 0,
          lastAction: '',
          nextManifestationAt: 0,
          stageIndex: 0,
          startedAt: root.classList.contains('is-mission-active') ? Date.now() : 0,
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
