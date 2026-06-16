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

  function readStoredState() {
    try {
      return safeJsonParse(window.localStorage.getItem(stateKey), {}) || {};
    }
    catch (e) {
      return {};
    }
  }

  function drupalPath(path) {
    if (Drupal && typeof Drupal.url === 'function') {
      return Drupal.url(path);
    }

    const baseUrl = ((((drupalSettings || {}).path || {}).baseUrl) || '/');
    return baseUrl.replace(/\/$/, '') + '/' + String(path || '').replace(/^\//, '');
  }

  function csrfToken() {
    return fetch(drupalPath('session/token'), {
      credentials: 'same-origin'
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('CSRF token request failed');
      }
      return response.text();
    });
  }

  function lookupMissionPayload(missionUuid) {
    return csrfToken().then(function (token) {
      return fetch(drupalPath('ooh/mission-lookup'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify({
          missionUuid: missionUuid
        })
      });
    }).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data || data.success !== true || !data.payload) {
          throw new Error((data && data.error) || 'Mission lookup failed');
        }
        return data;
      });
    });
  }

  function humanizeId(value) {
    return String(value || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function itemLabel(item, fallback) {
    if (item && item.label) {
      return item.label;
    }
    if (typeof item === 'string' && item.trim()) {
      return humanizeId(item);
    }
    return fallback;
  }

  function routeIdFromPayload(payload) {
    const route = payload.route || payload.campaignRoute || {};
    const routeId = payload.routeId || ((payload.mission || {}).campaignRoute) || route.id || payload.campaignRouteId || '';
    return ['aer', 'mare', 'terra'].indexOf(routeId) !== -1 ? routeId : 'terra';
  }

  function payloadRouteId(payload) {
    const route = payload.route || payload.campaignRoute || {};
    const routeId = payload.routeId || ((payload.mission || {}).campaignRoute) || route.id || payload.campaignRouteId || '';
    return ['aer', 'mare', 'terra'].indexOf(routeId) !== -1 ? routeId : '';
  }

  function normalizePayloadSnapshot(payload) {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    const snapshot = payload.snapshot && typeof payload.snapshot === 'object' ? payload.snapshot : {};
    ['playlist', 'path', 'recruiter', 'character', 'campaignRoute', 'route', 'mission'].forEach(function (field) {
      if (!payload[field] && snapshot[field]) {
        payload[field] = snapshot[field];
      }
    });

    return payload;
  }

  function auditPayload(payload) {
    payload = normalizePayloadSnapshot(payload);
    const missingFields = [];

    if (!payload.playlist || !payload.playlist.id || !payload.playlist.label) {
      missingFields.push('playlist');
    }
    if (!payload.path || !payload.path.id || !payload.path.label) {
      missingFields.push('path');
    }
    if (!payload.mission || !payload.mission.id || !payload.mission.label) {
      missingFields.push('mission');
    }
    if (!payloadRouteId(payload)) {
      missingFields.push('route');
    }

    return {
      payloadStatus: missingFields.length ? 'INCOMPLETE' : 'VALID',
      missingFields: missingFields,
      routeFallbackUsed: !payloadRouteId(payload)
    };
  }

  function recoverIncompletePayload(root, payloadAudit, dossierTarget) {
    const missing = payloadAudit.missingFields.length ?
      payloadAudit.missingFields.join(', ') :
      'payload';
    const recoveryText = 'Dossier payload incomplete. Return to Dossier to complete selection before mission staging. Missing: ' + missing + '.';
    const sceneStatus = root.querySelector('[data-ooh-scene-status]');
    const briefingEl = root.querySelector('[data-ooh-generated-briefing]');
    const debugEl = root.querySelector('[data-ooh-briefing-debug]');
    const activateButton = root.querySelector('[data-ooh-activate-mission]');
    const combatGate = root.querySelector('[data-ooh-combat-gate]');
    const combatGateButton = root.querySelector('[data-ooh-combat-gate-button]');
    const routeHeader = root.querySelector('[data-ooh-scene-route-label]');
    const sceneMissionLabel = root.querySelector('[data-ooh-scene-mission-label]');
    const returnLinks = root.querySelectorAll('a');
    let resolvedDossierTarget = dossierTarget || '';
    const dossierLinks = Array.prototype.filter.call(returnLinks, function (link) {
      const href = link.getAttribute('href') || '';
      const label = (link.textContent || '').toLowerCase();
      if (!resolvedDossierTarget && label.indexOf('dossier') !== -1 && href) {
        resolvedDossierTarget = href;
      }
      return (resolvedDossierTarget && href === resolvedDossierTarget) || label.indexOf('dossier') !== -1;
    });

    root.setAttribute('data-ooh-payload-status', 'incomplete');
    resetMissionRuntime(root);

    if (routeHeader) {
      routeHeader.textContent = 'MISSION SCENE // DOSSIER REQUIRED';
    }
    if (sceneMissionLabel) {
      sceneMissionLabel.textContent = 'MISSION TYPE // UNCONFIRMED';
    }
    if (sceneStatus) {
      sceneStatus.textContent = 'DOSSIER INCOMPLETE // RETURN TO DOSSIER // MISSING: ' + missing.toUpperCase();
    }
    if (briefingEl) {
      briefingEl.textContent = recoveryText;
    }
    if (activateButton) {
      activateButton.textContent = 'DOSSIER REQUIRED';
      activateButton.disabled = true;
      activateButton.setAttribute('aria-disabled', 'true');
    }
    if (combatGate) {
      combatGate.hidden = true;
    }
    if (combatGateButton) {
      combatGateButton.disabled = true;
      combatGateButton.setAttribute('aria-disabled', 'true');
    }
    dossierLinks.forEach(function (link) {
      link.setAttribute('aria-label', 'Return to Dossier to complete mission setup');
    });
    if (debugEl) {
      debugEl.textContent = '';
      debugEl.hidden = true;
      debugEl.setAttribute('aria-hidden', 'true');
    }
  }

  function missionEntryReady(root) {
    return Boolean(root && root.getAttribute('data-ooh-payload-status') === 'valid');
  }

  function setActivationReadyState(root, shell, activateButton) {
    if (!missionEntryReady(root) || root.classList.contains('is-mission-active')) {
      return;
    }
    root.setAttribute('data-ooh-activation-ready', 'true');
    if (shell) {
      shell.setAttribute('data-ooh-activation-ready', 'true');
    }
    if (activateButton && !activateButton.disabled) {
      activateButton.setAttribute('title', 'Activate mission and enter the field');
    }
  }

  function clearActivationReadyState(root, shell) {
    if (root) {
      root.removeAttribute('data-ooh-activation-ready');
    }
    if (shell) {
      shell.removeAttribute('data-ooh-activation-ready');
    }
  }

  function focusActivationEntry(root) {
    if (!missionEntryReady(root) || root.classList.contains('is-mission-active')) {
      return;
    }
    const actions = root.querySelector('.ooh-play-scene__actions');
    const activateButton = root.querySelector('[data-ooh-activate-mission]');
    if (!actions || !activateButton || activateButton.disabled) {
      return;
    }
    const rect = actions.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!viewportHeight || (rect.top >= viewportHeight * 0.18 && rect.bottom <= viewportHeight * 0.86)) {
      return;
    }
    const scrollTop = window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    const maxScroll = Math.max(
      0,
      (document.documentElement.scrollHeight || document.body.scrollHeight || 0) - viewportHeight
    );
    const targetTop = Math.max(0, Math.min(maxScroll, scrollTop + rect.top - (viewportHeight * 0.44)));
    window.scrollTo({
      behavior: 'smooth',
      top: targetTop
    });
  }

  function clearMovementHint(root) {
    if (root && root.oohMovementHintTimer) {
      window.clearTimeout(root.oohMovementHintTimer);
      root.oohMovementHintTimer = null;
    }
  }

  function scheduleMovementHint(root) {
    if (!root || root.oohMovementHintShown) {
      return;
    }
    clearMovementHint(root);
    root.oohMovementHintTimer = window.setTimeout(function () {
      const state = playerPresenceState(root);
      root.oohMovementHintTimer = null;
      if (!missionEntryReady(root) || !root.classList.contains('is-mission-active') || root.oohMovementHintShown || state.moved) {
        return;
      }
      root.oohMovementHintShown = true;
      const sceneStatus = root.querySelector('[data-ooh-scene-status]');
      const previousStatus = sceneStatus ? sceneStatus.textContent : '';
      const hintText = 'TRAVERSAL ACTIVE // WASD OR ARROW KEYS';
      if (sceneStatus) {
        sceneStatus.textContent = hintText;
        window.setTimeout(function () {
          if (sceneStatus.textContent === hintText && root.classList.contains('is-mission-active')) {
            sceneStatus.textContent = previousStatus;
          }
        }, 2600);
      }
      showLocalCadenceBeat(root, hintText, 'Movement bounded to the active field. Maintain route discipline.', 180, {
        priority: 2,
        holdMs: 2300,
        settleHoldMs: 1900
      });
    }, 1200);
  }

  const runtimeStateLabels = {
    standby: {
      state: 'STANDBY',
      signalIntegrity: 'STANDBY',
      objectiveStatus: 'AWAITING PAYLOAD',
      interferencePressure: 'QUIET',
      extractionReadiness: 'LOCKED',
      readout: 'Runtime shell standing by. Awaiting mission activation.'
    },
    active: {
      state: 'OPERATION ACTIVE',
      signalIntegrity: 'STABLE',
      objectiveStatus: 'IN PROGRESS',
      interferencePressure: 'LOW',
      extractionReadiness: 'DORMANT',
      readout: 'Operation active. Signal stable. Extraction remains dormant.'
    },
    pressure: {
      state: 'PRESSURE RISING',
      signalIntegrity: 'STABLE UNDER LOAD',
      objectiveStatus: 'IN PROGRESS',
      interferencePressure: 'RISING',
      extractionReadiness: 'DORMANT',
      readout: 'Pressure rising. Maintain cadence and keep the signal clean.'
    },
    degraded: {
      state: 'SIGNAL DEGRADED',
      signalIntegrity: 'DEGRADED',
      objectiveStatus: 'IN PROGRESS',
      interferencePressure: 'UNSTABLE',
      extractionReadiness: 'DORMANT',
      readout: 'Signal degraded. Stabilize before route conditions collapse.'
    },
    extraction: {
      state: 'EXTRACTION AVAILABLE',
      signalIntegrity: 'RECOVERING',
      objectiveStatus: 'ROUTE SHIFT READY',
      interferencePressure: 'CRESTING',
      extractionReadiness: 'AVAILABLE',
      readout: 'Extraction readiness visible. Awaiting route confirmation.'
    },
    lost: {
      state: 'SIGNAL LOST',
      signalIntegrity: 'LOST',
      objectiveStatus: 'INTERRUPTED',
      interferencePressure: 'MAXIMUM',
      extractionReadiness: 'UNAVAILABLE',
      readout: 'Signal lost. Runtime shell holding local state.'
    },
    complete: {
      state: 'OPERATION COMPLETE',
      signalIntegrity: 'ARCHIVED',
      objectiveStatus: 'COMPLETE',
      interferencePressure: 'CLEARED',
      extractionReadiness: 'CLOSED',
      readout: 'Operation complete. Local debrief only.'
    }
  };

  function runtimeStateKeyFromAction(action) {
    const actions = {
      scan: 'pressure',
      hold: 'extraction',
      signal: 'degraded'
    };
    return actions[action] || 'active';
  }
  const signalIntegrityRuntime = {
    initial: 100,
    degradedThreshold: 35,
    tickMs: 1000,
    baseDecay: 0.82,
    cushionDecay: 0.18,
    holdRestore: 13,
    holdMs: 6500,
    objectiveInitial: 0,
    objectiveThreshold: 60,
    objectiveRate: 1.12,
    interferenceInitial: 0,
    interferenceRate: 0.9,
    interferenceDecayFactor: 0.42,
    scanAwarenessMs: 4200,
    extractionInitial: 0,
    extractionRate: 2.75,
    extractionCriticalRate: 1.75,
    captureExtractionRate: 2.6,
    captureExtractionCriticalRate: 1.6,
    captureTelemetryInitialMs: 3800,
    captureTelemetryIntervalMs: 8200,
    captureCadenceDelayMultiplier: 1.35,
    captureCadenceMaxDelay: 650
  };

  const pressureCurveConfig = {
    earlyMs: 24000,
    midMs: 52000,
    lateMs: 82000,
    earlyRate: 0.72,
    midRate: 1,
    lateRate: 1.18,
    extractionRate: 1.32,
    earlyDecay: -0.05,
    midDecay: 0,
    lateDecay: 0.045,
    extractionDecay: 0.075
  };

  function runtimeStateAttribute(state) {
    return String(state || '').toLowerCase().replace(/\s+/g, '-');
  }

  function setRuntimeField(root, field, value) {
    if (!root) {
      return;
    }

    root.querySelectorAll('[data-ooh-runtime-field="' + field + '"]').forEach(function (el) {
      el.textContent = value;
    });
  }

  const playerPresenceConfig = {
    size: 18,
    step: 18,
    initialX: 0.5,
    initialY: 0.5,
    viewportX: 0.5,
    viewportY: 0.72
  };

  const traversalPressureConfig = {
    x: 0.28,
    y: 0.32,
    width: 0.28,
    height: 0.12,
    decay: 0.28
  };

  const extractionObjectiveConfig = {
    x: 0.72,
    y: 0.32,
    width: 0.12,
    height: 0.12
  };

  const extractionUncertaintyConfig = {
    chance: 0.52,
    conditionChance: 0.62,
    holdMs: 1400
  };

  const extractionComplications = [
    {
      id: 'signal_delay',
      label: 'EXTRACTION SIGNAL DELAY',
      title: 'EXTRACTION SIGNAL DELAY',
      message: 'Extraction signal delayed. Hold position for route confirmation.',
      recovery: 'EXTRACTION SIGNAL RECOVERED. Route confirmation clean.'
    },
    {
      id: 'route_recalibration',
      label: 'ROUTE RECALIBRATION',
      title: 'ROUTE RECALIBRATION',
      message: 'Route recalibration active. Maintain the extraction channel.',
      recovery: 'ROUTE RECALIBRATED. Extraction channel restored.'
    },
    {
      id: 'unstable_corridor',
      label: 'UNSTABLE EXTRACTION CORRIDOR',
      title: 'EXTRACTION CORRIDOR UNSTABLE',
      message: 'Extraction corridor unstable. Hold until the signal route settles.',
      recovery: 'CORRIDOR STABILIZED. Extraction route confirmed.'
    },
    {
      id: 'stabilization_hold',
      label: 'STABILIZATION HOLD',
      title: 'STABILIZATION HOLD REQUIRED',
      message: 'Short stabilization hold required. Keep position inside extraction.',
      recovery: 'STABILIZATION HOLD COMPLETE. Extraction link confirmed.'
    },
    {
      id: 'temporary_interference',
      label: 'TEMPORARY EXTRACTION INTERFERENCE',
      title: 'TEMPORARY EXTRACTION INTERFERENCE',
      message: 'Temporary extraction interference. Hold the window open.',
      recovery: 'INTERFERENCE CLEARED. Extraction window stable.'
    }
  ];

  const contactPresenceConfig = {
    size: 24,
    initialX: 0.18,
    initialY: 0.44,
    driftStep: 16,
    interval: 2600,
    proximity: 168,
    decay: 0.16,
    pressurePulse: 0.42
  };

  function activeRuntimeCondition(root) {
    return root && root.oohOperationCondition ? root.oohOperationCondition : null;
  }

  function runtimeConditionModifier(root, key, fallback) {
    const condition = activeRuntimeCondition(root);
    const modifiers = condition && condition.modifiers ? condition.modifiers : {};
    return typeof modifiers[key] === 'number' ? modifiers[key] : fallback;
  }

  function traversalPressureRuntimeLayout(root) {
    const condition = activeRuntimeCondition(root);
    const layout = Object.assign({}, traversalPressureConfig);
    const offset = condition && condition.pressureOffset ? condition.pressureOffset : null;
    if (offset) {
      layout.x = Math.max(0.08, Math.min(0.72, layout.x + (offset.x || 0)));
      layout.y = Math.max(0.14, Math.min(0.72, layout.y + (offset.y || 0)));
      layout.width = Math.max(0.16, Math.min(0.34, layout.width + (offset.width || 0)));
      layout.height = Math.max(0.08, Math.min(0.18, layout.height + (offset.height || 0)));
    }
    return layout;
  }

  function contactPresenceRuntimeConfig(root) {
    const proximity = runtimeConditionModifier(root, 'contactProximity', contactPresenceConfig.proximity);
    const driftStep = runtimeConditionModifier(root, 'contactDriftStep', contactPresenceConfig.driftStep);
    const interval = runtimeConditionModifier(root, 'contactInterval', contactPresenceConfig.interval);
    const decay = runtimeConditionModifier(root, 'contactDecay', contactPresenceConfig.decay);
    const pressurePulse = runtimeConditionModifier(root, 'contactPressurePulse', contactPresenceConfig.pressurePulse);
    const synthesis = root && root.oohActivationSynthesisBias ? root.oohActivationSynthesisBias : {};
    const contactPressureMultiplier = typeof synthesis.contactPressureMultiplier === 'number' ?
      synthesis.contactPressureMultiplier :
      1;
    return {
      proximity: proximity,
      driftStep: driftStep,
      interval: interval,
      decay: decay,
      pressurePulse: Math.max(0.32, Math.min(0.74, pressurePulse * contactPressureMultiplier))
    };
  }

  const playerMovementKeys = {
    arrowup: [0, -1],
    w: [0, -1],
    arrowleft: [-1, 0],
    a: [-1, 0],
    arrowdown: [0, 1],
    s: [0, 1],
    arrowright: [1, 0],
    d: [1, 0]
  };

  function contactPresenceState(root) {
    if (!root.oohContactPresence) {
      root.oohContactPresence = {
        x: 0,
        y: 0,
        driftIndex: 0,
        near: false,
        active: false,
        pressurePulseAt: 0
      };
    }

    return root.oohContactPresence;
  }

  function playerPresenceState(root) {
    if (!root.oohPlayerPresence) {
      root.oohPlayerPresence = {
        x: 0,
        y: 0,
        moved: false
      };
    }

    return root.oohPlayerPresence;
  }

  function playerPresenceField(root) {
    return root ? root.querySelector('.ooh-play-scene__visual') : null;
  }

  function ensurePlayerPresence(root) {
    const field = playerPresenceField(root);
    if (!field) {
      return null;
    }

    let marker = field.querySelector('[data-ooh-player-presence]');
    if (!marker) {
      marker = document.createElement('div');
      marker.className = 'ooh-play-player-presence';
      marker.setAttribute('data-ooh-player-presence', '');
      marker.setAttribute('aria-hidden', 'true');
      marker.hidden = true;
      field.appendChild(marker);
    }

    return marker;
  }

  function ensureTraversalPressureZone(root) {
    const field = playerPresenceField(root);
    if (!field) {
      return null;
    }

    let zone = field.querySelector('[data-ooh-traversal-pressure-zone]');
    if (!zone) {
      zone = document.createElement('div');
      zone.className = 'ooh-play-traversal-pressure';
      zone.setAttribute('data-ooh-traversal-pressure-zone', '');
      zone.setAttribute('aria-hidden', 'true');
      zone.hidden = true;
      field.appendChild(zone);
    }

    const layout = traversalPressureRuntimeLayout(root);
    zone.style.left = (layout.x * 100) + '%';
    zone.style.top = (layout.y * 100) + '%';
    zone.style.width = (layout.width * 100) + '%';
    zone.style.height = (layout.height * 100) + '%';
    return zone;
  }

  function ensureContactPresence(root) {
    const field = playerPresenceField(root);
    if (!field) {
      return null;
    }

    let marker = field.querySelector('[data-ooh-contact-presence]');
    if (!marker) {
      marker = document.createElement('div');
      marker.className = 'ooh-play-contact-presence';
      marker.setAttribute('data-ooh-contact-presence', 'observed');
      marker.setAttribute('aria-hidden', 'true');
      marker.hidden = true;
      field.appendChild(marker);
    }

    return marker;
  }

  function applyContactPresencePosition(root) {
    const marker = ensureContactPresence(root);
    const field = playerPresenceField(root);
    if (!marker || !field) {
      return;
    }

    const state = contactPresenceState(root);
    const fieldRect = field.getBoundingClientRect();
    const maxX = Math.max(0, fieldRect.width - contactPresenceConfig.size);
    const maxY = Math.max(0, fieldRect.height - contactPresenceConfig.size);
    state.x = Math.max(0, Math.min(maxX, state.x));
    state.y = Math.max(0, Math.min(maxY, state.y));
    marker.style.transform = 'translate3d(' + state.x + 'px, ' + state.y + 'px, 0)';
  }

  function ensureExtractionObjectiveZone(root) {
    const field = playerPresenceField(root);
    if (!field) {
      return null;
    }

    let zone = field.querySelector('[data-ooh-extraction-objective]');
    if (!zone) {
      zone = document.createElement('div');
      zone.className = 'ooh-play-extraction-objective';
      zone.setAttribute('data-ooh-extraction-objective', '');
      zone.setAttribute('aria-hidden', 'true');
      zone.hidden = true;
      field.appendChild(zone);
    }

    zone.style.left = (extractionObjectiveConfig.x * 100) + '%';
    zone.style.top = (extractionObjectiveConfig.y * 100) + '%';
    zone.style.width = (extractionObjectiveConfig.width * 100) + '%';
    zone.style.height = (extractionObjectiveConfig.height * 100) + '%';
    return zone;
  }

  function clampPlayerPresence(root) {
    const marker = ensurePlayerPresence(root);
    const field = playerPresenceField(root);
    if (!marker || !field) {
      return;
    }

    const state = playerPresenceState(root);
    const fieldRect = field.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    const markerSize = Math.max(markerRect.width, markerRect.height, playerPresenceConfig.size);
    const maxX = Math.max(0, fieldRect.width - markerSize);
    const maxY = Math.max(0, fieldRect.height - markerSize);

    state.x = Math.min(Math.max(state.x, 0), maxX);
    state.y = Math.min(Math.max(state.y, 0), maxY);
    marker.style.transform = 'translate3d(' + state.x + 'px, ' + state.y + 'px, 0)';
  }

  function resetPlayerPresence(root) {
    if (!root) {
      return;
    }

    const marker = ensurePlayerPresence(root);
    const field = playerPresenceField(root);
    if (!marker || !field) {
      return;
    }

    const state = playerPresenceState(root);
    const fieldRect = field.getBoundingClientRect();
    state.x = Math.max(0, (fieldRect.width - playerPresenceConfig.size) * playerPresenceConfig.initialX);
    state.y = Math.max(0, (fieldRect.height - playerPresenceConfig.size) * playerPresenceConfig.initialY);
    state.moved = false;
    marker.hidden = true;
    marker.classList.remove('is-moving');
    clampPlayerPresence(root);
  }

  function activatePlayerPresence(root) {
    const marker = ensurePlayerPresence(root);
    if (!marker) {
      return;
    }

    if (!root.oohPlayerPresence) {
      resetPlayerPresence(root);
    }
    marker.hidden = false;
    clampPlayerPresence(root);
  }

  function contactPresenceDistance(root) {
    const player = ensurePlayerPresence(root);
    const contact = ensureContactPresence(root);
    if (!player || !contact || player.hidden || contact.hidden) {
      return Infinity;
    }

    const playerRect = player.getBoundingClientRect();
    const contactRect = contact.getBoundingClientRect();
    const playerX = playerRect.left + (playerRect.width / 2);
    const playerY = playerRect.top + (playerRect.height / 2);
    const contactX = contactRect.left + (contactRect.width / 2);
    const contactY = contactRect.top + (contactRect.height / 2);
    return Math.hypot(playerX - contactX, playerY - contactY);
  }

  function updateContactPresenceProximity(root, announce) {
    if (!root || !root.classList.contains('is-mission-active')) {
      return;
    }

    const marker = ensureContactPresence(root);
    const runtime = signalRuntime(root);
    if (!marker || marker.hidden || !runtime || runtime.lost || runtime.extractionComplete) {
      return;
    }

    const state = contactPresenceState(root);
    const contactConfig = contactPresenceRuntimeConfig(root);
    const near = contactPresenceDistance(root) <= contactConfig.proximity;
    const changed = near !== Boolean(state.near);
    state.near = near;
    runtime.contactPresenceActive = true;
    runtime.contactPresenceNear = near;
    runtime.contactPresenceDecay = near ? contactConfig.decay : 0;
    marker.classList.toggle('is-contact-near', near);
    marker.setAttribute('data-ooh-contact-presence', near ? 'near' : 'observed');
    root.setAttribute('data-ooh-contact-presence', near ? 'near' : 'observed');

    if (near && Date.now() - (runtime.contactPresencePressureAt || 0) > 2200) {
      runtime.interferencePressure = Math.min(100, runtime.interferencePressure + contactConfig.pressurePulse);
      runtime.peakInterferencePressure = Math.max(runtime.peakInterferencePressure || 0, runtime.interferencePressure);
      runtime.contactPresencePressureAt = Date.now();
    }

    if (!changed || announce === false) {
      return;
    }

    if (near) {
      pulseRuntimeCadence(root, 'pressure', 1500);
      syncSignalIntegrityHud(root, signalIntegrityStateKey(root), 'CONTACT TRACE DETECTED. Signal shadow observed.');
      showLocalCadenceBeat(root, 'SIGNAL SHADOW OBSERVED', 'FIELD PRESENCE ESCALATING. Maintain route discipline.', 220, { priority: 3, holdMs: 2800, settleHoldMs: 2200 });
      nudgeLocalTelemetryPulse(root, 'CONTACT TRACE DETECTED', 3, 2600);
    }
    else {
      nudgeLocalTelemetryPulse(root, 'CONTACT TRACE DISTANT', 1, 1800);
    }
  }

  function driftContactPresence(root) {
    if (!root || !root.classList.contains('is-mission-active')) {
      return;
    }

    const state = contactPresenceState(root);
    const player = playerPresenceState(root);
    const patterns = [
      [1, -0.35],
      [0.45, 0.8],
      [-0.55, 0.35],
      [0.25, -0.65]
    ];
    const vector = patterns[state.driftIndex % patterns.length];
    const pursuitX = player.x > state.x ? 0.25 : -0.25;
    const pursuitY = player.y > state.y ? 0.16 : -0.16;
    const contactConfig = contactPresenceRuntimeConfig(root);
    state.x += (vector[0] + pursuitX) * contactConfig.driftStep;
    state.y += (vector[1] + pursuitY) * contactConfig.driftStep;
    state.driftIndex += 1;
    applyContactPresencePosition(root);
    updateContactPresenceProximity(root, true);
  }

  function stopContactPresenceDrift(root) {
    if (root && root.oohContactPresenceTimer) {
      window.clearInterval(root.oohContactPresenceTimer);
      root.oohContactPresenceTimer = null;
    }
  }

  function resetContactPresence(root) {
    if (!root) {
      return;
    }

    stopContactPresenceDrift(root);
    const marker = ensureContactPresence(root);
    if (marker) {
      marker.hidden = true;
      marker.classList.remove('is-contact-near');
      marker.setAttribute('data-ooh-contact-presence', 'observed');
    }
    root.removeAttribute('data-ooh-contact-presence');
    root.oohContactPresence = null;

    const runtime = root.oohSignalRuntime;
    if (runtime) {
      runtime.contactPresenceActive = false;
      runtime.contactPresenceNear = false;
      runtime.contactPresenceDecay = 0;
    }
  }

  function activateContactPresence(root) {
    const marker = ensureContactPresence(root);
    const field = playerPresenceField(root);
    if (!marker || !field) {
      return;
    }

    const state = contactPresenceState(root);
    const fieldRect = field.getBoundingClientRect();
    state.x = Math.max(0, (fieldRect.width - contactPresenceConfig.size) * contactPresenceConfig.initialX);
    state.y = Math.max(0, (fieldRect.height - contactPresenceConfig.size) * contactPresenceConfig.initialY);
    state.driftIndex = 0;
    state.near = false;
    state.active = true;
    marker.hidden = false;
    marker.classList.remove('is-contact-near');
    marker.setAttribute('data-ooh-contact-presence', 'observed');
    root.setAttribute('data-ooh-contact-presence', 'observed');
    applyContactPresencePosition(root);
    updateContactPresenceProximity(root, false);
    stopContactPresenceDrift(root);
    root.oohContactPresenceTimer = window.setInterval(function () {
      driftContactPresence(root);
    }, contactPresenceRuntimeConfig(root).interval);
  }

  function setRuntimeAliveState(root, state) {
    if (!root) {
      return;
    }

    const nextState = state || 'standby';
    const shell = root.querySelector('[data-ooh-scene-shell]');
    root.setAttribute('data-ooh-runtime-alive', nextState);
    if (shell) {
      shell.setAttribute('data-ooh-runtime-alive', nextState);
    }
  }

  function scheduleRuntimeCadenceNudge(root) {
    if (!root) {
      return;
    }

    if (root.oohRuntimeCadenceNudgeTimer) {
      window.clearTimeout(root.oohRuntimeCadenceNudgeTimer);
    }
    root.oohRuntimeCadenceNudgeTimer = window.setTimeout(function () {
      if (!root.classList.contains('is-mission-active')) {
        return;
      }
      const cadenceLines = runtimeCadenceLines(root);
      pulseRuntimeCadence(root, 'cadence', 1100);
      nudgeLocalTelemetryPulse(root, cadenceLines[1] || 'FIELD PRESSURE ACTIVE', 1, 1900);
      root.oohRuntimeCadenceNudgeTimer = null;
    }, 3200);
  }

  function pulseRuntimeCadence(root, state, holdMs) {
    if (!root) {
      return;
    }

    setRuntimeAliveState(root, state);
    if (root.oohRuntimeCadenceTimer) {
      window.clearTimeout(root.oohRuntimeCadenceTimer);
      root.oohRuntimeCadenceTimer = null;
    }
    if (root.oohRuntimeCadenceNudgeTimer) {
      window.clearTimeout(root.oohRuntimeCadenceNudgeTimer);
      root.oohRuntimeCadenceNudgeTimer = null;
    }
    if (!root.classList.contains('is-mission-active')) {
      return;
    }
    root.oohRuntimeCadenceTimer = window.setTimeout(function () {
      setRuntimeAliveState(root, 'active');
      root.oohRuntimeCadenceTimer = null;
    }, holdMs || 1200);
  }

  function activateTraversalPressureZone(root) {
    const zone = ensureTraversalPressureZone(root);
    if (!zone) {
      return;
    }

    zone.hidden = false;
    root.setAttribute('data-ooh-traversal-pressure', 'clear');
    updateTraversalPressureContact(root);
  }

  function resetTraversalPressure(root) {
    if (!root) {
      return;
    }

    const zone = ensureTraversalPressureZone(root);
    if (zone) {
      zone.hidden = true;
      zone.classList.remove('is-contact-active');
    }
    root.removeAttribute('data-ooh-traversal-pressure');

    const runtime = root.oohSignalRuntime;
    if (runtime) {
      runtime.traversalPressureActive = false;
      runtime.traversalPressureDecay = 0;
    }
  }

  function activateExtractionObjectiveZone(root) {
    const zone = ensureExtractionObjectiveZone(root);
    if (!zone) {
      return;
    }

    zone.hidden = false;
    zone.classList.remove('is-contact-active', 'is-complete');
    root.setAttribute('data-ooh-field-extraction', 'available');
    updateExtractionObjectiveContact(root);
  }

  function resetExtractionObjective(root) {
    if (!root) {
      return;
    }

    const zone = ensureExtractionObjectiveZone(root);
    if (zone) {
      zone.hidden = true;
      zone.classList.remove('is-contact-active', 'is-complete');
    }
    root.removeAttribute('data-ooh-field-extraction');

    const runtime = root.oohSignalRuntime;
    if (runtime) {
      runtime.fieldExtractionComplete = false;
      resetExtractionUncertainty(root, runtime);
    }
  }

  function alignPlayerPresenceToViewport(root) {
    const marker = ensurePlayerPresence(root);
    const field = playerPresenceField(root);
    if (!marker || !field || marker.hidden) {
      return;
    }

    const state = playerPresenceState(root);
    const fieldRect = field.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    const markerSize = Math.max(markerRect.width, markerRect.height, playerPresenceConfig.size);
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || fieldRect.width;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || fieldRect.height;

    state.x = (viewportWidth * playerPresenceConfig.viewportX) - fieldRect.left - (markerSize / 2);
    state.y = (viewportHeight * playerPresenceConfig.viewportY) - fieldRect.top - (markerSize / 2);
    clampPlayerPresence(root);
    updateTraversalPressureContact(root);
    updateExtractionObjectiveContact(root);
    updateContactPresenceProximity(root, false);
  }

  function rectsOverlap(a, b) {
    return Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
  }

  function updateTraversalPressureContact(root) {
    if (!root || !root.classList.contains('is-mission-active')) {
      return;
    }

    const marker = ensurePlayerPresence(root);
    const zone = ensureTraversalPressureZone(root);
    const runtime = signalRuntime(root);
    if (!marker || !zone || marker.hidden || zone.hidden || !runtime || runtime.lost) {
      return;
    }

    const active = rectsOverlap(marker.getBoundingClientRect(), zone.getBoundingClientRect());
    if (active === Boolean(runtime.traversalPressureActive)) {
      return;
    }

    runtime.traversalPressureActive = active;
    runtime.traversalPressureDecay = active ? traversalPressureConfig.decay : 0;
    zone.classList.toggle('is-contact-active', active);
    root.setAttribute('data-ooh-traversal-pressure', active ? 'contact' : 'clear');

    if (active) {
      pulseRuntimeCadence(root, 'pressure', 1800);
      syncSignalIntegrityHud(root, signalIntegrityStateKey(root), 'FIELD INSTABILITY CONTACT. Signal interference detected.');
      showLocalCadenceBeat(root, 'SIGNAL INTERFERENCE DETECTED', 'POSITION COMPROMISED. Clear the instability band. ' + playlistCadenceText(root), 180, {
        priority: 3,
        holdMs: 3200,
        settleHoldMs: 2800
      });
    }
    else {
      pulseRuntimeCadence(root, 'stabilized', 1400);
      syncSignalIntegrityHud(root, signalIntegrityStateKey(root), 'FIELD POSITION STABILIZED. Interference cleared.');
      showLocalCadenceBeat(root, 'INTERFERENCE CLEARED', 'FIELD POSITION STABILIZED. Normal signal behavior restored.', 180);
    }
  }

  function clearExtractionComplicationTimer(root) {
    if (root && root.oohExtractionComplicationTimer) {
      window.clearTimeout(root.oohExtractionComplicationTimer);
      root.oohExtractionComplicationTimer = null;
    }
  }

  function resetExtractionUncertainty(root, runtime) {
    clearExtractionComplicationTimer(root);
    if (runtime) {
      runtime.extractionComplicationChecked = false;
      runtime.extractionComplication = null;
      runtime.extractionComplicationActive = false;
      runtime.extractionComplicationResolveAt = 0;
      runtime.extractionComplicationAnnounced = false;
    }
    if (root) {
      root.removeAttribute('data-ooh-extraction-uncertainty');
    }
  }

  function extractionComplicationChance(root) {
    const condition = activeRuntimeCondition(root);
    const conditionIds = ['signal_interference', 'unstable_weather', 'storm_blackout', 'unstable_cadence', 'high_contact_risk'];
    return condition && conditionIds.indexOf(condition.id) !== -1 ?
      extractionUncertaintyConfig.conditionChance :
      extractionUncertaintyConfig.chance;
  }

  function selectExtractionComplication(root, runtime) {
    if (!runtime || runtime.extractionComplicationChecked) {
      return runtime ? runtime.extractionComplication : null;
    }

    runtime.extractionComplicationChecked = true;
    if (Math.random() > extractionComplicationChance(root)) {
      runtime.extractionComplication = null;
      return null;
    }

    runtime.extractionComplication = extractionComplications[Math.floor(Math.random() * extractionComplications.length)] || extractionComplications[0];
    return runtime.extractionComplication;
  }

  function extractionContactActive(root, marker, zone) {
    return Boolean(root && root.classList.contains('is-mission-active') && marker && zone && !marker.hidden && !zone.hidden && rectsOverlap(marker.getBoundingClientRect(), zone.getBoundingClientRect()));
  }

  function resolveExtractionComplication(root, zone, runtime, marker) {
    if (!root || !zone || !runtime || runtime.lost || runtime.extractionComplete || !runtime.extractionComplicationActive) {
      return;
    }

    if (!extractionContactActive(root, marker || ensurePlayerPresence(root), zone)) {
      runtime.extractionComplicationActive = false;
      runtime.extractionComplicationResolveAt = 0;
      root.setAttribute('data-ooh-extraction-uncertainty', 'pending');
      syncSignalIntegrityHud(root, signalIntegrityStateKey(root), 'EXTRACTION HOLD BROKEN. Re-enter the extraction window.');
      showLocalCadenceBeat(root, 'EXTRACTION HOLD BROKEN', 'Re-enter extraction and stabilize the route.', 220);
      return;
    }

    if (Date.now() < runtime.extractionComplicationResolveAt) {
      return;
    }

    const complication = runtime.extractionComplication || extractionComplications[0];
    runtime.extractionComplicationActive = false;
    runtime.extractionComplicationResolveAt = 0;
    root.setAttribute('data-ooh-extraction-uncertainty', 'resolved');
    syncSignalIntegrityHud(root, signalIntegrityStateKey(root), complication.recovery);
    showLocalCadenceBeat(root, 'EXTRACTION STABILIZED', complication.recovery, 180);
    completeFieldExtraction(root, zone, runtime);
  }

  function beginExtractionComplication(root, zone, runtime, marker, complication) {
    if (!root || !zone || !runtime || !complication) {
      return;
    }

    clearExtractionComplicationTimer(root);
    runtime.extractionComplicationActive = true;
    runtime.extractionComplicationResolveAt = Date.now() + Math.max(900, complication.holdMs || extractionUncertaintyConfig.holdMs);
    root.setAttribute('data-ooh-extraction-uncertainty', complication.id);
    syncSignalIntegrityHud(root, signalIntegrityStateKey(root), complication.message);
    showLocalCadenceBeat(root, complication.title, complication.message, 180, { priority: 2 });
    root.oohExtractionComplicationTimer = window.setTimeout(function () {
      resolveExtractionComplication(root, zone, runtime, marker);
    }, Math.max(900, complication.holdMs || extractionUncertaintyConfig.holdMs) + 80);
  }

  function completeFieldExtraction(root, zone, runtime) {
    if (!root || !zone || !runtime || runtime.fieldExtractionComplete || runtime.extractionComplete) {
      return;
    }

    clearExtractionComplicationTimer(root);
    runtime.fieldExtractionComplete = true;
    runtime.objectiveReady = true;
    runtime.extractionProgress = 100;
    runtime.extractionComplete = true;
    runtime.traversalPressureActive = false;
    runtime.traversalPressureDecay = 0;
    runtime.contactPresenceActive = false;
    runtime.contactPresenceNear = false;
    runtime.contactPresenceDecay = 0;
    runtime.contactPresencePressureAt = 0;
    stopContactPresenceDrift(root);
    stopSignalIntegrityLoop(root);
    stopLocalTelemetryPulse(root);
    clearLocalCadenceBeat(root);
    if (root.oohRuntimeCadenceTimer) {
      window.clearTimeout(root.oohRuntimeCadenceTimer);
      root.oohRuntimeCadenceTimer = null;
    }
    if (root.oohRuntimeCadenceNudgeTimer) {
      window.clearTimeout(root.oohRuntimeCadenceNudgeTimer);
      root.oohRuntimeCadenceNudgeTimer = null;
    }
    root.classList.remove('is-mission-active');
    root.classList.add('is-field-extraction-complete');
    setRuntimeAliveState(root, 'extraction');
    root.setAttribute('data-ooh-field-extraction', 'complete');
    root.setAttribute('data-ooh-extraction-uncertainty', runtime.extractionComplication ? 'resolved' : 'clear');
    root.setAttribute('data-ooh-traversal-pressure', 'clear');
    root.setAttribute('data-ooh-contact-presence', 'clear');

    zone.classList.add('is-contact-active', 'is-complete');
    const pressureZone = root.querySelector('[data-ooh-traversal-pressure-zone]');
    if (pressureZone) {
      pressureZone.classList.remove('is-contact-active');
    }
    const contactMarker = root.querySelector('[data-ooh-contact-presence]');
    if (contactMarker) {
      contactMarker.hidden = true;
      contactMarker.classList.remove('is-contact-near');
      contactMarker.setAttribute('data-ooh-contact-presence', 'observed');
    }

    const shell = root.querySelector('[data-ooh-scene-shell]');
    if (shell) {
      shell.classList.remove('is-mission-active');
      shell.setAttribute('data-mission-state', 'operation-complete');
    }

    const sceneStatus = root.querySelector('[data-ooh-scene-status]');
    if (sceneStatus) {
      sceneStatus.textContent = 'OPERATION COMPLETE // EXTRACTION LINK CONFIRMED // SIGNAL ROUTE STABILIZED';
    }

    root.querySelectorAll('[data-ooh-action]').forEach(function (button) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    });

    const combatGate = root.querySelector('[data-ooh-combat-gate]');
    if (combatGate) {
      combatGate.hidden = true;
    }
    const combatGateButton = root.querySelector('[data-ooh-combat-gate-button]');
    if (combatGateButton) {
      combatGateButton.disabled = true;
      combatGateButton.setAttribute('aria-disabled', 'true');
    }

    syncSignalIntegrityHud(root, 'complete', 'EXTRACTION LINK CONFIRMED. Signal route stabilized.');
    showLocalCadenceBeat(root, 'EXTRACTION WINDOW AVAILABLE', 'SIGNAL ROUTE STABILIZED. Operation closed. AUDIO IDENTITY LOCKED.', 180, { priority: 3 });
    showOperationSummary(root, determineOperationalOutcome(root, runtime));
  }

  function updateExtractionObjectiveContact(root) {
    if (!root || !root.classList.contains('is-mission-active')) {
      return;
    }

    const marker = ensurePlayerPresence(root);
    const zone = ensureExtractionObjectiveZone(root);
    const runtime = signalRuntime(root);
    if (!marker || !zone || marker.hidden || zone.hidden || !runtime || runtime.lost || runtime.extractionComplete) {
      return;
    }

    const active = rectsOverlap(marker.getBoundingClientRect(), zone.getBoundingClientRect());
    zone.classList.toggle('is-contact-active', active);
    if (active) {
      if (runtime.extractionComplicationActive) {
        resolveExtractionComplication(root, zone, runtime, marker);
        return;
      }
      const complication = selectExtractionComplication(root, runtime);
      if (complication) {
        beginExtractionComplication(root, zone, runtime, marker, complication);
        return;
      }
      completeFieldExtraction(root, zone, runtime);
    }
    else if (runtime.extractionComplicationActive) {
      resolveExtractionComplication(root, zone, runtime, marker);
    }
  }

  function movePlayerPresence(root, vector) {
    if (!root || !vector || !root.classList.contains('is-mission-active')) {
      return false;
    }

    const marker = ensurePlayerPresence(root);
    if (!marker || marker.hidden) {
      return false;
    }

    const state = playerPresenceState(root);
    state.x += vector[0] * playerPresenceConfig.step;
    state.y += vector[1] * playerPresenceConfig.step;
    clampPlayerPresence(root);
    updateTraversalPressureContact(root);
    updateExtractionObjectiveContact(root);
    updateContactPresenceProximity(root, true);
    if (root.getAttribute('data-ooh-field-extraction') === 'complete') {
      setRuntimeAliveState(root, 'extraction');
    }
    else if (root.getAttribute('data-ooh-traversal-pressure') === 'contact') {
      pulseRuntimeCadence(root, 'pressure', 1800);
    }
    else if (root.getAttribute('data-ooh-contact-presence') === 'near') {
      pulseRuntimeCadence(root, 'pressure', 1500);
    }
    else {
      pulseRuntimeCadence(root, 'moving', 900);
    }
    marker.classList.add('is-moving');
    window.clearTimeout(root.oohPlayerPresenceMoveTimer);
    root.oohPlayerPresenceMoveTimer = window.setTimeout(function () {
      marker.classList.remove('is-moving');
    }, 140);

    if (!state.moved) {
      state.moved = true;
      root.oohMovementHintShown = true;
      clearMovementHint(root);
      showLocalCadenceBeat(root, 'OPERATOR PRESENCE CONFIRMED', 'FIELD POSITION ACTIVE. ' + (activeMediaState(root.oohMediaAttachment) || 'Movement bounded to the active field.'), 220);
    }

    return true;
  }

  function captureModeActive(root) {
    return Boolean(root && root.oohCaptureMode);
  }

  const clipChoreographyPresets = [
    {
      id: 'none',
      label: 'CAPTURE PRESET: NONE'
    },
    {
      id: 'signal_collapse',
      label: 'SIGNAL COLLAPSE',
      conditionId: 'storm_blackout',
      signalInitial: 58,
      interferenceInitial: 48,
      objectiveInitial: 18,
      cadenceFlavor: 'Collapse profile staged. Signal margin remains live.'
    },
    {
      id: 'extraction_window',
      label: 'EXTRACTION WINDOW',
      conditionId: 'sodium_night',
      signalInitial: 78,
      interferenceInitial: 34,
      objectiveInitial: 54,
      extractionPacing: 'extended',
      cadenceFlavor: 'Extraction profile staged. Synchronization window approaching.'
    },
    {
      id: 'pressure_escalation',
      label: 'PRESSURE ESCALATION',
      conditionId: 'storm_blackout',
      signalInitial: 82,
      interferenceInitial: 42,
      objectiveInitial: 30,
      cadenceFlavor: 'Pressure profile staged. Interference line already rising.'
    },
    {
      id: 'low_visibility',
      label: 'LOW VISIBILITY',
      conditionId: 'fog_dawn',
      signalInitial: 95,
      interferenceInitial: 12,
      objectiveInitial: 12,
      cadenceFlavor: 'Low visibility profile staged. Horizon channel softened.'
    },
    {
      id: 'operation_complete',
      label: 'OPERATION COMPLETE',
      conditionId: 'fog_dawn',
      signalInitial: 66,
      interferenceInitial: 48,
      objectiveInitial: 60,
      extractionInitial: 44,
      extractionPacing: 'extended',
      cadenceFlavor: 'Completion profile staged. Extraction synchronization remains live.'
    }
  ];

  function clipPresetById(id) {
    return clipChoreographyPresets.filter(function (preset) {
      return preset.id === id;
    })[0] || clipChoreographyPresets[0];
  }

  function activeClipPreset(root) {
    return root && captureModeActive(root) ? clipPresetById(root.oohClipPresetId || 'none') : clipChoreographyPresets[0];
  }

  function updateClipPresetToggle(root) {
    const toggle = root ? root.querySelector('[data-ooh-clip-preset-toggle]') : null;
    if (!toggle) {
      return;
    }

    const preset = clipPresetById(root.oohClipPresetId || 'none');
    toggle.textContent = preset.label;
    toggle.setAttribute('data-ooh-clip-preset-active', preset.id);
  }

  function setClipPreset(root, presetId, announce) {
    if (!root) {
      return;
    }

    const preset = clipPresetById(presetId);
    const shell = root.querySelector('[data-ooh-scene-shell]');
    root.oohClipPresetId = preset.id;
    if (preset.id === 'none') {
      root.removeAttribute('data-ooh-clip-preset');
      if (shell) {
        shell.removeAttribute('data-ooh-clip-preset');
      }
    }
    else {
      root.setAttribute('data-ooh-clip-preset', preset.id);
      if (shell) {
        shell.setAttribute('data-ooh-clip-preset', preset.id);
      }
    }

    updateClipPresetToggle(root);

    if (announce && root.classList.contains('is-mission-active')) {
      showLocalCadenceBeat(root, 'PRESET LOCKED', 'Clip presets apply at operation activation only.', 260);
    }
  }

  function advanceClipPreset(root) {
    if (!root) {
      return;
    }

    if (root.classList.contains('is-mission-active')) {
      setClipPreset(root, root.oohClipPresetId || 'none', true);
      return;
    }

    const currentId = root.oohClipPresetId || 'none';
    const currentIndex = clipChoreographyPresets.findIndex(function (preset) {
      return preset.id === currentId;
    });
    const nextPreset = clipChoreographyPresets[(currentIndex + 1) % clipChoreographyPresets.length];
    setClipPreset(root, nextPreset.id, false);
  }

  function updateCaptureModeToggle(root) {
    const toggle = root ? root.querySelector('[data-ooh-capture-toggle]') : null;
    if (!toggle) {
      return;
    }

    const active = captureModeActive(root);
    toggle.textContent = active ? 'CAPTURE MODE ACTIVE' : 'PROMOTIONAL CAPTURE';
    toggle.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function setCaptureMode(root, active, announce) {
    if (!root) {
      return;
    }

    const shell = root.querySelector('[data-ooh-scene-shell]');
    root.oohCaptureMode = Boolean(active);
    if (root.oohCaptureMode) {
      root.setAttribute('data-ooh-capture-mode', 'active');
      if (shell) {
        shell.setAttribute('data-ooh-capture-mode', 'active');
      }
    }
    else {
      root.removeAttribute('data-ooh-capture-mode');
      if (shell) {
        shell.removeAttribute('data-ooh-capture-mode');
      }
    }

    updateCaptureModeToggle(root);
    updateClipPresetToggle(root);

    if (announce && root.classList.contains('is-mission-active')) {
      showLocalCadenceBeat(
        root,
        root.oohCaptureMode ? 'CAPTURE MODE ACTIVE' : 'CAPTURE MODE CLEARED',
        root.oohCaptureMode ? 'Telemetry pacing stabilized for operational recording.' : 'Runtime pacing restored to operational baseline.',
        260
      );
    }
  }

  function ensureCaptureModeToggle(root) {
    if (!root || root.querySelector('[data-ooh-capture-toggle]')) {
      updateCaptureModeToggle(root);
      updateClipPresetToggle(root);
      return;
    }

    const actions = root.querySelector('.ooh-play-scene__actions');
    if (!actions) {
      return;
    }

    const toggle = document.createElement('button');
    toggle.className = 'ooh-generator__overlay-btn ooh-play-scene__capture-toggle';
    toggle.type = 'button';
    toggle.setAttribute('data-ooh-capture-toggle', '');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = 'PROMOTIONAL CAPTURE';
    toggle.addEventListener('click', function () {
      setCaptureMode(root, !captureModeActive(root), true);
    });

    actions.appendChild(toggle);

    const presetToggle = document.createElement('button');
    presetToggle.className = 'ooh-generator__overlay-btn ooh-play-scene__clip-preset-toggle';
    presetToggle.type = 'button';
    presetToggle.setAttribute('data-ooh-clip-preset-toggle', '');
    presetToggle.textContent = 'CAPTURE PRESET: NONE';
    presetToggle.addEventListener('click', function () {
      advanceClipPreset(root);
    });

    actions.appendChild(presetToggle);
    updateCaptureModeToggle(root);
    updateClipPresetToggle(root);
  }

  function signalRuntime(root) {
    if (!root) {
      return null;
    }

    if (!root.oohSignalRuntime) {
      root.oohSignalRuntime = {
        timer: null,
        integrity: signalIntegrityRuntime.initial,
        objectiveProgress: signalIntegrityRuntime.objectiveInitial,
        objectiveReady: false,
        objectiveAnnounced: false,
        objectiveSyncQuality: 0.35,
        objectiveSyncLastActionAt: 0,
        objectiveScanSyncUntil: 0,
        extractionProgress: signalIntegrityRuntime.extractionInitial,
        extractionComplete: false,
        extractionAnnounced: false,
        extractionUnstableAnnounced: false,
        extractionComplicationChecked: false,
        extractionComplication: null,
        extractionComplicationActive: false,
        extractionComplicationResolveAt: 0,
        interferencePressure: signalIntegrityRuntime.interferenceInitial,
        peakInterferencePressure: signalIntegrityRuntime.interferenceInitial,
        startedAt: 0,
        scanAwarenessUntil: 0,
        cushionUntil: 0,
        actionInstabilityUntil: 0,
        actionInstabilityDecay: 0,
        traversalPressureActive: false,
        traversalPressureDecay: 0,
        contactPresenceActive: false,
        contactPresenceNear: false,
        contactPresenceDecay: 0,
        contactPresencePressureAt: 0,
        fieldExtractionComplete: false,
        operationalDecayBias: 0,
        extractionReadinessBias: 0,
        operationalEscalationTier: 'nominal',
        operationalEscalationAnnounced: '',
        pressureCurveStage: 'early',
        pressureCurveAnnounced: '',
        operationalRecoveryUntil: 0,
        operationalRecoveryAnnounced: false,
        operationalRecoveryHoldCount: 0,
        operationalDriftNextAt: 0,
        operationalDriftUntil: 0,
        operationalDriftAnnounced: false,
        adaptiveStability: 0,
        adaptiveStabilityAnnounced: '',
        degradedAnnounced: false,
        lost: false
      };
    }

    return root.oohSignalRuntime;
  }

  function signalIntegrityLabel(root) {
    const runtime = signalRuntime(root);
    const value = runtime ? Math.max(0, Math.round(runtime.integrity)) : signalIntegrityRuntime.initial;

    if (!runtime || runtime.lost || value <= 0) {
      return '0% // LOST';
    }
    if (runtime.cushionUntil && Date.now() < runtime.cushionUntil) {
      return value + '% // SIGNAL HOLD';
    }
    if (value < signalIntegrityRuntime.degradedThreshold) {
      return value + '% // DEGRADED';
    }
    return value + '% // STABLE';
  }
  function objectiveProgressLabel(root) {
    const runtime = signalRuntime(root);
    const value = runtime ? Math.max(0, Math.min(100, Math.round(runtime.objectiveProgress))) : signalIntegrityRuntime.objectiveInitial;

    if (!runtime || runtime.lost) {
      return value + '% // CHANNEL NOT READY';
    }
    if (runtime.extractionComplete) {
      return 'OPERATION COMPLETE';
    }
    if (runtime.objectiveReady) {
      return 'OBJECTIVE WINDOW COMPLETE';
    }
    return value + '% // OBJECTIVE SYNCHRONIZING';
  }

  function extractionReadinessLabel(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost) {
      return 'UNAVAILABLE';
    }
    if (runtime.extractionComplete) {
      return 'SYNCHRONIZED';
    }
    if (runtime.objectiveReady) {
      const progress = Math.max(0, Math.min(100, Math.round(runtime.extractionProgress)));
      return 'EXFIL SYNCHRONIZING // ' + progress + '%';
    }
    return 'LOCKED';
  }
  function interferenceBand(value) {
    const pressure = Math.max(0, Math.min(100, Number(value) || 0));
    if (pressure >= 78) {
      return 'CRITICAL';
    }
    if (pressure >= 52) {
      return 'ELEVATED';
    }
    if (pressure >= 24) {
      return 'RISING';
    }
    return 'LOW';
  }

  function interferencePressureLabel(root) {
    const runtime = signalRuntime(root);
    const value = runtime ? Math.max(0, Math.min(100, Math.round(runtime.interferencePressure))) : signalIntegrityRuntime.interferenceInitial;
    const band = interferenceBand(value);

    if (!runtime || runtime.lost) {
      return band + ' // FIELD HALTED';
    }
    return band + ' // ' + value + '%';
  }

  function pressureReadoutText(root) {
    const runtime = signalRuntime(root);
    const band = interferenceBand(runtime ? runtime.interferencePressure : 0);
    const copy = {
      LOW: 'SCAN RETURNED. Sync improved. Exposure remains low.',
      RISING: 'SCAN RETURNED. Sync improved. Exposure rising.',
      ELEVATED: 'SCAN RETURNED. Sync improved. Channel pressure elevated.',
      CRITICAL: 'SCAN RETURNED. Sync improved. Signal field unstable.'
    };
    return copy[band] || copy.LOW;
  }

  function cadenceFlavor(root, phase, fallback) {
    const runtime = signalRuntime(root);
    const condition = root ? root.oohOperationCondition : null;
    const conditionId = condition ? condition.id : 'neutral';
    const pressure = runtime ? interferenceBand(runtime.interferencePressure) : 'LOW';
    const conditionLines = {
      fog_dawn: {
        initialization: 'LOW VISIBILITY. Horizon loss contained.',
        stabilization: 'Fog saturation present. Signal edges soft.',
        signal_degradation: 'SIGNAL SATURATION RISING. Channel losing contrast.',
        elevated_pressure: 'HORIZON LOSS DETECTED. Pressure line narrowing.',
        extraction_available: 'Extraction window forming beyond low visibility.',
        extraction_sync: 'EXFIL SYNCHRONIZING. Hold through fog saturation.',
        critical_instability: 'Signal field unstable inside fog saturation.',
        signal_lost: 'SIGNAL LOST. Horizon channel closed.',
        operation_complete: 'OPERATION COMPLETE. Low visibility channel sealed.'
      },
      sodium_night: {
        initialization: 'INDUSTRIAL FIELD ACTIVE. Visual channel stable.',
        stabilization: 'Sodium field holding. Route exposure contained.',
        signal_degradation: 'ROUTE EXPOSURE ELEVATED. Signal edge thinning.',
        elevated_pressure: 'Industrial static rising across the surface route.',
        extraction_available: 'Extraction window available under sodium field.',
        extraction_sync: 'EXFIL SYNCHRONIZING. Hard silhouettes holding.',
        critical_instability: 'CRITICAL INTERFERENCE. Surface channel exposed.',
        signal_lost: 'SIGNAL LOST. Industrial field occluded.',
        operation_complete: 'OPERATION COMPLETE. Sodium field synchronized.'
      },
      storm_blackout: {
        initialization: 'STORM DISTORTION ACTIVE. Channel discipline required.',
        stabilization: 'Blackout pressure contained. Signal margin narrow.',
        signal_degradation: 'CHANNEL INSTABILITY RISING. Runtime cohesion thin.',
        elevated_pressure: 'STORM DISTORTION RISING. Signal field unstable.',
        extraction_available: 'Extraction window available. Channel narrowing.',
        extraction_sync: 'EXFIL SYNCHRONIZING. Hold through blackout pressure.',
        critical_instability: 'CRITICAL INTERFERENCE. Extraction window narrowing.',
        signal_lost: 'SIGNAL LOST. Storm channel collapsed.',
        operation_complete: 'OPERATION COMPLETE. Storm channel sealed.'
      },
      signal_echo: {
        initialization: 'SIGNAL ECHO ACTIVE. Telemetry repeat contained.',
        stabilization: 'Echo cadence holding. Signal duplication low.',
        signal_degradation: 'SIGNAL ECHO RISING. Telemetry edges repeating.',
        elevated_pressure: 'ECHO PRESSURE LOCAL. Channel response delayed.',
        extraction_available: 'Extraction window available through signal echo.',
        extraction_sync: 'EXFIL SYNCHRONIZING. Echo cadence contained.',
        critical_instability: 'CRITICAL ECHO PRESSURE. Signal field repeating.',
        signal_lost: 'SIGNAL LOST. Echo channel collapsed.',
        operation_complete: 'OPERATION COMPLETE. Echo channel sealed.'
      },
      signal_interference: {
        initialization: 'SIGNAL INTERFERENCE. Channel noise contained.',
        stabilization: 'Interference channel softening. Signal margin holding.',
        signal_degradation: 'SIGNAL INTERFERENCE RISING. Runtime clarity thinning.',
        elevated_pressure: 'INTERFERENCE CHANNEL ACTIVE. Keep movement deliberate.',
        extraction_available: 'Extraction window available through interference.',
        extraction_sync: 'EXFIL SYNCHRONIZING. Hold through signal interference.',
        critical_instability: 'CRITICAL INTERFERENCE. Signal discipline required.',
        signal_lost: 'SIGNAL LOST. Interference channel closed.',
        operation_complete: 'OPERATION COMPLETE. Interference channel sealed.'
      },
      unstable_weather: {
        initialization: 'UNSTABLE WEATHER. Drift window active.',
        stabilization: 'Weather channel uneven. Route remains readable.',
        signal_degradation: 'WEATHER DISTORTION RISING. Signal margin narrowing.',
        elevated_pressure: 'UNSTABLE WEATHER LOCAL. Field drift increasing.',
        extraction_available: 'Extraction window available under unstable weather.',
        extraction_sync: 'EXFIL SYNCHRONIZING. Hold through weather drift.',
        critical_instability: 'CRITICAL WEATHER DISTORTION. Route cohesion thin.',
        signal_lost: 'SIGNAL LOST. Weather channel collapsed.',
        operation_complete: 'OPERATION COMPLETE. Weather channel sealed.'
      },
      cold_start: {
        initialization: 'COLD START. Systems warming under low pressure.',
        stabilization: 'Cold channel warming. Signal response deliberate.',
        signal_degradation: 'COLD START DRAG. Extraction sync responding slowly.',
        elevated_pressure: 'COLD CHANNEL UNDER LOAD. Preserve signal margin.',
        extraction_available: 'Extraction window available after cold start delay.',
        extraction_sync: 'EXFIL SYNCHRONIZING. Cold channel coming online.',
        critical_instability: 'CRITICAL COLD START DRAG. Channel response thin.',
        signal_lost: 'SIGNAL LOST. Cold channel failed to stabilize.',
        operation_complete: 'OPERATION COMPLETE. Cold start channel sealed.'
      },
      high_contact_risk: {
        initialization: 'HIGH CONTACT RISK. Field presence likely.',
        stabilization: 'Contact risk contained. Keep distance disciplined.',
        signal_degradation: 'CONTACT RISK RISING. Signal shadow nearby.',
        elevated_pressure: 'FIELD PRESENCE WATCH. Contact pressure local.',
        extraction_available: 'Extraction window available under contact risk.',
        extraction_sync: 'EXFIL SYNCHRONIZING. Contact shadow contained.',
        critical_instability: 'CRITICAL CONTACT PRESSURE. Signal field exposed.',
        signal_lost: 'SIGNAL LOST. Contact pressure overwhelmed the channel.',
        operation_complete: 'OPERATION COMPLETE. Contact risk sealed.'
      },
      unstable_cadence: {
        initialization: 'UNSTABLE CADENCE. Movement discipline required.',
        stabilization: 'Cadence variance contained. Runtime tempo holding.',
        signal_degradation: 'CADENCE INSTABILITY RISING. Signal tempo thinning.',
        elevated_pressure: 'CADENCE SHIFT DETECTED. Pressure line moving.',
        extraction_available: 'Extraction window available under unstable cadence.',
        extraction_sync: 'EXFIL SYNCHRONIZING. Hold through cadence shift.',
        critical_instability: 'CRITICAL CADENCE VARIANCE. Runtime tempo unstable.',
        signal_lost: 'SIGNAL LOST. Cadence channel collapsed.',
        operation_complete: 'OPERATION COMPLETE. Cadence channel sealed.'
      },
      impact_pressure: {
        initialization: 'IMPACT PRESSURE ACTIVE. Forward cadence under load.',
        stabilization: 'Impact pressure contained. Route discipline holding.',
        signal_degradation: 'IMPACT PRESSURE RISING. Signal field tightening.',
        elevated_pressure: 'IMPACT PRESSURE LOCAL. Clear the pressure line.',
        extraction_available: 'Extraction window available under impact pressure.',
        extraction_sync: 'EXFIL SYNCHRONIZING. Maintain impact cadence.',
        critical_instability: 'CRITICAL IMPACT PRESSURE. Route cohesion thin.',
        signal_lost: 'SIGNAL LOST. Impact channel collapsed.',
        operation_complete: 'OPERATION COMPLETE. Impact pressure sealed.'
      },
      neutral: {}
    };
    const pressureLines = {
      ELEVATED: {
        stabilization: 'CHANNEL PRESSURE ELEVATED. Maintain clean cadence.',
        elevated_pressure: 'INTERFERENCE RISING. Signal field tightening.',
        extraction_sync: 'Pressure elevated. Synchronization window narrowing.'
      },
      CRITICAL: {
        stabilization: 'CRITICAL INTERFERENCE. Signal field unstable.',
        elevated_pressure: 'CRITICAL INTERFERENCE. Runtime cohesion failing.',
        extraction_sync: 'Critical pressure. Extraction synchronization slowed.'
      }
    };
    const conditionText = (conditionLines[conditionId] || conditionLines.neutral)[phase];
    const pressureText = (pressureLines[pressure] || {})[phase];
    return conditionText || pressureText || fallback;
  }

  function syncInterferencePressureHud(root) {
    setRuntimeField(root, 'interferencePressure', interferencePressureLabel(root));
  }

  function advanceInterferencePressure(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost) {
      return;
    }

    runtime.interferencePressure = Math.min(100, runtime.interferencePressure + (signalIntegrityRuntime.interferenceRate * pressureCurveRate(root, runtime)));
    runtime.peakInterferencePressure = Math.max(runtime.peakInterferencePressure || 0, runtime.interferencePressure);
  }

  function signalDecayAmount(root, cushioned) {
    const runtime = signalRuntime(root);
    const pressure = runtime ? Math.max(0, Math.min(100, runtime.interferencePressure)) : 0;
    const scanAware = runtime && runtime.scanAwarenessUntil && Date.now() < runtime.scanAwarenessUntil;
    const actionInstability = runtime && runtime.actionInstabilityUntil && Date.now() < runtime.actionInstabilityUntil;
    const driftActive = runtime && runtime.operationalDriftUntil && Date.now() < runtime.operationalDriftUntil;
    const baseDecay = cushioned ? signalIntegrityRuntime.cushionDecay : signalIntegrityRuntime.baseDecay;
    const pressureFactor = scanAware ? signalIntegrityRuntime.interferenceDecayFactor * 0.55 : signalIntegrityRuntime.interferenceDecayFactor;
    const instabilityDecay = actionInstability ? Math.max(0, runtime.actionInstabilityDecay || 0) : 0;
    const driftDecay = driftActive ? 0.08 : 0;
    const traversalDecay = runtime && runtime.traversalPressureActive ? Math.max(0, runtime.traversalPressureDecay || 0) : 0;
    const contactDecay = runtime && runtime.contactPresenceNear ? Math.max(0, runtime.contactPresenceDecay || 0) : 0;
    const recoveryCushion = runtime && runtime.operationalRecoveryUntil && Date.now() < runtime.operationalRecoveryUntil ? 0.18 : 0;
    const adaptiveDecay = runtime ? Math.max(-0.12, Math.min(0.12, -(runtime.adaptiveStability || 0) * 0.12)) : 0;
    const curveDecay = pressureCurveDecay(root, runtime);
    return Math.max(0.1, baseDecay + ((pressure / 100) * pressureFactor) + instabilityDecay + driftDecay + traversalDecay + contactDecay + (runtime.operationalDecayBias || 0) + adaptiveDecay + curveDecay - recoveryCushion);
  }

  function applyInterferenceScan(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || !root.classList.contains('is-mission-active')) {
      return;
    }

    runtime.scanAwarenessUntil = Date.now() + signalIntegrityRuntime.scanAwarenessMs;
    syncSignalIntegrityHud(root, signalIntegrityStateKey(root), pressureReadoutText(root));
    showLocalCadenceBeat(root, 'SCAN RETURNED', cadenceFlavor(root, 'stabilization', pressureReadoutText(root)), 220);
  }

  function syncObjectiveProgressHud(root) {
    setRuntimeField(root, 'objectiveStatus', objectiveProgressLabel(root));
    setRuntimeField(root, 'extractionReadiness', extractionReadinessLabel(root));
    syncInterferencePressureHud(root);
  }

  function effectiveRuntimeStateKey(root, stateKey) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || stateKey === 'lost') {
      return 'lost';
    }
    if (runtime.extractionComplete) {
      return 'complete';
    }
    if (runtime.objectiveReady) {
      return 'extraction';
    }
    return stateKey;
  }

  function updateObjectiveSynchronization(root, runtime) {
    if (!root || !runtime || runtime.lost || runtime.objectiveReady || !root.classList.contains('is-mission-active')) {
      return 1;
    }

    const now = Date.now();
    const lastActionAt = runtime.objectiveSyncLastActionAt || runtime.startedAt || now;
    const idleMs = Math.max(0, now - lastActionAt);
    const scanWindowActive = runtime.objectiveScanSyncUntil && now < runtime.objectiveScanSyncUntil;
    const recoveryActive = runtime.operationalRecoveryUntil && now < runtime.operationalRecoveryUntil;
    const idleDrag = idleMs > 5200 ? 0.032 : 0.01;
    const scanFloor = scanWindowActive ? 0.74 : 0;
    const recoveryLift = recoveryActive ? 0.035 : 0;
    const quality = Math.max(scanFloor, (runtime.objectiveSyncQuality || 0.35) - idleDrag + recoveryLift);

    runtime.objectiveSyncQuality = Math.max(0.12, Math.min(1, quality));
    return 0.25 + (runtime.objectiveSyncQuality * 0.85);
  }

  function advanceObjectiveProgress(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || runtime.objectiveReady) {
      return;
    }

    const syncMultiplier = updateObjectiveSynchronization(root, runtime);
    runtime.objectiveProgress = Math.min(signalIntegrityRuntime.objectiveThreshold, runtime.objectiveProgress + (signalIntegrityRuntime.objectiveRate * syncMultiplier));
    if (runtime.objectiveProgress < signalIntegrityRuntime.objectiveThreshold) {
      return;
    }

    runtime.objectiveReady = true;
    runtime.objectiveProgress = signalIntegrityRuntime.objectiveThreshold;
    runtime.extractionProgress = signalIntegrityRuntime.extractionInitial;
    if (!runtime.objectiveAnnounced) {
      runtime.objectiveAnnounced = true;
      showLocalCadenceBeat(root, 'OBJECTIVE WINDOW COMPLETE', cadenceFlavor(root, 'extraction_available', 'EXTRACTION WINDOW AVAILABLE. Exfil synchronization beginning.'), 280);
    }
  }

  function applyActionObjectiveProgress(root, runtime, actionKey) {
    if (!root || !runtime || !root.classList.contains('is-mission-active') || runtime.lost || runtime.integrity <= 0 || runtime.objectiveReady) {
      return;
    }

    const now = Date.now();
    const syncGains = {
      hold: 0.08,
      scan: 0.2,
      signal: 0.08
    };
    const actionProgress = {
      hold: 0.15,
      scan: 0.62,
      signal: 0.2
    };
    runtime.objectiveSyncLastActionAt = now;
    runtime.objectiveSyncQuality = Math.min(1, (runtime.objectiveSyncQuality || 0.35) + (syncGains[actionKey] || 0.06));
    if (actionKey === 'scan') {
      runtime.objectiveScanSyncUntil = now + 5500;
    }

    const syncMultiplier = updateObjectiveSynchronization(root, runtime);
    const amount = (actionProgress[actionKey] || 0.15) * syncMultiplier;
    runtime.objectiveProgress = Math.min(signalIntegrityRuntime.objectiveThreshold, runtime.objectiveProgress + amount);

    if (runtime.objectiveProgress >= signalIntegrityRuntime.objectiveThreshold) {
      runtime.objectiveReady = true;
      runtime.objectiveProgress = signalIntegrityRuntime.objectiveThreshold;
      runtime.extractionProgress = signalIntegrityRuntime.extractionInitial;
      if (!runtime.objectiveAnnounced) {
        runtime.objectiveAnnounced = true;
        showLocalCadenceBeat(root, 'OBJECTIVE WINDOW COMPLETE', cadenceFlavor(root, 'extraction_available', 'EXTRACTION WINDOW AVAILABLE. Exfil synchronization beginning.'), 280);
      }
    }
    syncObjectiveProgressHud(root);
  }

  function applyOperationalPressure(root, runtime, actionKey) {
    if (!root || !runtime || !root.classList.contains('is-mission-active') || runtime.lost || runtime.integrity <= 0) {
      return;
    }

    const pressureAmounts = {
      hold: 0.25,
      scan: 0.72,
      signal: 0.12
    };
    const pressureAmount = pressureAmounts[actionKey] || 0.1;
    runtime.interferencePressure = Math.min(100, runtime.interferencePressure + pressureAmount);
    runtime.peakInterferencePressure = Math.max(runtime.peakInterferencePressure || 0, runtime.interferencePressure);

    if (actionKey === 'scan') {
      runtime.actionInstabilityUntil = Date.now() + 1900;
      runtime.actionInstabilityDecay = 0.28;
    }
    else if (!runtime.actionInstabilityUntil || Date.now() >= runtime.actionInstabilityUntil) {
      runtime.actionInstabilityDecay = 0;
    }

    syncInterferencePressureHud(root);
  }

  function extractionSyncRate(root) {
    const runtime = signalRuntime(root);
    const critical = interferenceBand(runtime ? runtime.interferencePressure : 0) === 'CRITICAL';
    const preset = activeClipPreset(root);
    if (preset.extractionPacing === 'extended') {
      return critical ? 3.25 : 5.5;
    }

    if (captureModeActive(root)) {
      return critical ?
        signalIntegrityRuntime.captureExtractionCriticalRate :
        signalIntegrityRuntime.captureExtractionRate;
    }

    return critical ?
      signalIntegrityRuntime.extractionCriticalRate :
      signalIntegrityRuntime.extractionRate;
  }

  function updateExtractionReadiness(root, runtime) {
    if (!root || !runtime || runtime.lost || runtime.extractionComplete || !runtime.objectiveReady) {
      return 1;
    }

    const integrity = Math.max(0, Math.min(signalIntegrityRuntime.initial, runtime.integrity || 0));
    const pressure = Math.max(0, Math.min(100, runtime.interferencePressure || 0));
    const scanAssisted = runtime.objectiveScanSyncUntil && Date.now() < runtime.objectiveScanSyncUntil;
    const degraded = signalIntegrityStateKey(root) === 'degraded';
    const integrityFactor = degraded ? 0.82 : Math.max(0.76, 0.9 + (integrity / 1000));
    const pressureDrag = pressure >= 78 ? 0.18 : (pressure >= 52 ? 0.1 : (pressure >= 24 ? 0.04 : 0));
    const scanBoost = scanAssisted ? 0.07 : 0;
    const syncSupport = Math.min(0.05, Math.max(0, (runtime.objectiveSyncQuality || 0) * 0.05));
    const adaptiveReadiness = Math.max(-0.04, Math.min(0.04, (runtime.adaptiveStability || 0) * 0.04));
    const readiness = Math.max(0.62, Math.min(1.08, integrityFactor - pressureDrag + scanBoost + syncSupport + (runtime.extractionReadinessBias || 0) + adaptiveReadiness));

    if (readiness < 0.72 && !runtime.extractionUnstableAnnounced) {
      runtime.extractionUnstableAnnounced = true;
      showLocalCadenceBeat(root, 'EXFIL WINDOW UNSTABLE', cadenceFlavor(root, 'extraction_sync', 'Synchronization degraded by pressure. Maintain operational stability.'), 260);
    }
    else if (readiness >= 0.82) {
      runtime.extractionUnstableAnnounced = false;
    }

    return readiness;
  }

  function determineOperationalOutcome(root, runtime) {
    if (!root || !runtime) {
      return 'EXTRACTION COMPLETE';
    }

    const integrity = Math.max(0, Math.min(signalIntegrityRuntime.initial, runtime.integrity || 0));
    const pressure = Math.max(0, Math.min(100, runtime.peakInterferencePressure || runtime.interferencePressure || 0));
    const syncQuality = Math.max(0, Math.min(1, runtime.objectiveSyncQuality || 0));
    const degraded = runtime.degradedAnnounced || integrity < signalIntegrityRuntime.degradedThreshold;
    const unstableExtraction = runtime.extractionUnstableAnnounced;

    if (integrity < 25 || pressure >= 78) {
      return 'SIGNAL-COMPROMISED EXTRACTION';
    }
    if (degraded || unstableExtraction || pressure >= 52) {
      return 'DEGRADED EXTRACTION';
    }
    if (syncQuality < 0.45 || pressure >= 35) {
      return 'PARTIAL SYNCHRONIZATION';
    }
    return 'STABLE EXTRACTION';
  }

  function completeExtractionSync(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || runtime.extractionComplete) {
      return;
    }

    const outcome = determineOperationalOutcome(root, runtime);
    runtime.extractionProgress = 100;
    runtime.extractionComplete = true;
    stopSignalIntegrityLoop(root);
    stopLocalTelemetryPulse(root);
    root.classList.remove('is-mission-active');

    const shell = root.querySelector('[data-ooh-scene-shell]');
    if (shell) {
      shell.classList.remove('is-mission-active');
      shell.setAttribute('data-mission-state', 'operation-complete');
    }

    const sceneStatus = root.querySelector('[data-ooh-scene-status]');
    if (sceneStatus) {
      sceneStatus.textContent = 'OPERATION COMPLETE // EXTRACTION SYNCHRONIZED // CHANNEL HOLDING';
    }

    root.querySelectorAll('[data-ooh-action]').forEach(function (button) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    });

    syncSignalIntegrityHud(root, 'complete', cadenceFlavor(root, 'operation_complete', 'OPERATION COMPLETE. Extraction synchronized. Runtime loop sealed without persistence.'));
    showLocalCadenceBeat(root, outcome, cadenceFlavor(root, 'operation_complete', 'Operation complete. Runtime loop sealed.'), 240);
    showOperationSummary(root, outcome);
  }

  function advanceExtractionSync(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || runtime.extractionComplete || !runtime.objectiveReady) {
      return;
    }

    runtime.extractionProgress = Math.min(100, runtime.extractionProgress + (extractionSyncRate(root) * updateExtractionReadiness(root, runtime)));
    if (!runtime.extractionAnnounced) {
      runtime.extractionAnnounced = true;
      showLocalCadenceBeat(root, 'EXFIL SYNCHRONIZING', cadenceFlavor(root, 'extraction_sync', 'Hold the channel through the extraction window.'), 260);
    }

    if (runtime.extractionProgress >= 100) {
      completeExtractionSync(root);
    }
  }

  function syncSignalIntegrityHud(root, stateKey, readoutOverride) {
    setOperationalRuntimeState(root, effectiveRuntimeStateKey(root, stateKey), readoutOverride);
    setRuntimeField(root, 'signalIntegrity', signalIntegrityLabel(root));
    syncObjectiveProgressHud(root);

    if (stateKey === 'lost') {
      setRuntimeField(root, 'extractionReadiness', 'UNAVAILABLE');
    }
  }

  function clearSignalIntegrityRuntime(root) {
    const runtime = root ? root.oohSignalRuntime : null;
    if (runtime && runtime.timer) {
      window.clearInterval(runtime.timer);
    }
    clearExtractionComplicationTimer(root);

    if (root) {
      root.oohSignalRuntime = null;
      root.removeAttribute('data-ooh-extraction-uncertainty');
    }
  }

  function formatRuntimeDuration(startedAt) {
    const elapsed = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return minutes + ':' + String(seconds).padStart(2, '0');
  }

  function routeSummaryLabel(root) {
    const shell = root ? root.querySelector('[data-ooh-scene-shell]') : null;
    return shell ? (shell.getAttribute('data-route') || 'UNASSIGNED') : 'UNASSIGNED';
  }

  function conditionSummaryLabel(root) {
    const condition = root ? root.oohOperationCondition : null;
    return condition ? condition.label : 'CONDITION UNASSIGNED';
  }

  function playlistSummaryLabel(root) {
    const media = root ? root.oohMediaAttachment : null;
    const shell = root ? root.querySelector('[data-ooh-scene-shell]') : null;
    return (media && media.label) ||
      (shell && shell.getAttribute('data-playlist-label')) ||
      'PLAYLIST UNASSIGNED';
  }

  function pressurePhaseSummaryLabel(runtime) {
    const stage = runtime ? (runtime.pressureCurveStage || 'early') : 'early';
    const labels = {
      early: 'CONTROLLED',
      mid: 'RISING',
      late: 'LATE PRESSURE',
      extraction: 'EXTRACTION URGENCY',
      complete: 'SEALED'
    };
    return labels[stage] || 'CONTROLLED';
  }

  function contactSeveritySummaryLabel(root, runtime) {
    if (!root || !root.oohContactPresence || !root.oohContactPresence.active) {
      return 'TRACE LOW';
    }
    if (root.getAttribute('data-ooh-contact-presence') === 'near' || (runtime && runtime.contactPresenceNear)) {
      return 'CONTACT NEAR';
    }
    return 'TRACE OBSERVED';
  }

  function extractionStatusSummaryLabel(root, runtime, outcome) {
    if (runtime && runtime.lost) {
      return 'SIGNAL LOST';
    }
    if (root && root.getAttribute('data-ooh-extraction-uncertainty') === 'resolved') {
      return 'EXTRACTED // STABILIZED';
    }
    if (runtime && runtime.extractionComplete) {
      return 'EXTRACTED';
    }
    return outcome || 'UNRESOLVED';
  }

  function routeStabilitySummaryLabel(runtime) {
    if (!runtime) {
      return 'UNKNOWN';
    }
    const pressure = Math.max(0, Math.min(100, runtime.peakInterferencePressure || runtime.interferencePressure || 0));
    const integrity = Math.max(0, Math.min(100, runtime.integrity || 0));
    if (runtime.lost || integrity <= 0) {
      return 'COLLAPSED';
    }
    if (pressure >= 78 || integrity < 28) {
      return 'UNSTABLE';
    }
    if (pressure >= 52 || integrity < signalIntegrityRuntime.degradedThreshold) {
      return 'DEGRADED';
    }
    if (pressure >= 24 || integrity < 62) {
      return 'CONTESTED';
    }
    return 'STABLE';
  }

  function objectiveCompletionPercent(runtime) {
    if (!runtime) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((runtime.objectiveProgress / signalIntegrityRuntime.objectiveThreshold) * 100)));
  }

  function removeOperationSummary(root) {
    if (!root) {
      return;
    }
    const existing = root.querySelector('[data-ooh-operation-summary]');
    if (existing) {
      existing.remove();
    }
  }

  function suppressVisibleDebugOutput(root) {
    if (!root) {
      return;
    }

    root.querySelectorAll('[data-ooh-briefing-debug], .ooh-play-mission__debug').forEach(function (debugEl) {
      debugEl.textContent = '';
      debugEl.hidden = true;
      debugEl.setAttribute('aria-hidden', 'true');
      const panel = debugEl.closest('.ooh-play-scene__debug');
      if (panel) {
        panel.hidden = true;
        panel.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function showOperationSummary(root, outcome) {
    const runtime = signalRuntime(root);
    if (!root || !runtime) {
      return;
    }

    removeOperationSummary(root);

    const summary = document.createElement('section');
    summary.className = 'ooh-operation-summary';
    summary.setAttribute('data-ooh-operation-summary', '');
    summary.setAttribute('aria-label', 'Operation summary');

    const fields = [
      ['OUTCOME', runtime.lost ? 'SIGNAL LOST' : 'EXTRACTED'],
      ['EXTRACTION STATUS', extractionStatusSummaryLabel(root, runtime, outcome)],
      ['ROUTE', routeSummaryLabel(root)],
      ['FIELD CONDITION', conditionSummaryLabel(root)],
      ['PLAYLIST SIGNAL', playlistSummaryLabel(root)],
      ['PRESSURE PHASE', pressurePhaseSummaryLabel(runtime)],
      ['CONTACT SEVERITY', contactSeveritySummaryLabel(root, runtime)],
      ['ROUTE STABILITY', routeStabilitySummaryLabel(runtime)],
      ['SIGNAL CONDITION', Math.max(0, Math.round(runtime.integrity)) + '%'],
      ['INTERFERENCE PEAK', Math.max(0, Math.round(runtime.peakInterferencePressure || runtime.interferencePressure || 0)) + '% // ' + interferenceBand(runtime.peakInterferencePressure || runtime.interferencePressure || 0)],
      ['OBJECTIVE COMPLETION', objectiveCompletionPercent(runtime) + '%'],
      ['EXTRACTION SYNCHRONIZATION', Math.max(0, Math.min(100, Math.round(runtime.extractionProgress || 0))) + '%'],
      ['OPERATION DURATION', formatRuntimeDuration(runtime.startedAt)]
    ];

    const rows = fields.map(function (field) {
      return '<div class="ooh-operation-summary__row"><span>' + field[0] + '</span><strong>' + field[1] + '</strong></div>';
    }).join('');
    const returnTarget = root.querySelector('.ooh-play-scene__actions a[href]');
    const returnHref = returnTarget ? returnTarget.getAttribute('href') : '/dossier';

    summary.innerHTML =
      '<div class="ooh-operation-summary__shell">' +
        '<div class="ooh-operation-summary__kicker">OPERATION SUMMARY</div>' +
        '<h3 class="ooh-operation-summary__title">Runtime Debrief</h3>' +
        '<p class="ooh-operation-summary__note">Operation closed. Local debrief only. No progress saved. Run again to initiate a new operation.</p>' +
        '<div class="ooh-operation-summary__grid">' + rows + '</div>' +
        '<div class="ooh-operation-summary__actions">' +
          '<button class="ooh-operation-summary__button" type="button" data-ooh-summary-reset>RUN AGAIN</button>' +
          '<a class="ooh-operation-summary__button" href="' + returnHref + '">RETURN</a>' +
        '</div>' +
      '</div>';

    const resetButton = summary.querySelector('[data-ooh-summary-reset]');
    if (resetButton) {
      resetButton.addEventListener('click', function () {
        resetMissionRuntime(root);
        const activateButton = root.querySelector('[data-ooh-activate-mission]');
        if (activateButton && missionEntryReady(root)) {
          activateButton.textContent = 'ENTER FIELD';
          activateButton.disabled = false;
          activateButton.setAttribute('aria-disabled', 'false');
          setActivationReadyState(root, root.querySelector('[data-ooh-scene-shell]'), activateButton);
          window.setTimeout(function () {
            focusActivationEntry(root);
          }, 80);
        }
      });
    }

    root.appendChild(summary);
  }

  function signalIntegrityStateKey(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || runtime.integrity <= 0) {
      return 'lost';
    }
    if (runtime.integrity < signalIntegrityRuntime.degradedThreshold) {
      return 'degraded';
    }
    return 'active';
  }

  function stopSignalIntegrityLoop(root) {
    const runtime = signalRuntime(root);
    if (runtime && runtime.timer) {
      window.clearInterval(runtime.timer);
      runtime.timer = null;
    }
  }

  function failSignalIntegrity(root) {
    const runtime = signalRuntime(root);
    runtime.integrity = 0;
    runtime.lost = true;
    stopSignalIntegrityLoop(root);
    stopLocalTelemetryPulse(root);
    clearLocalCadenceBeat(root);
    if (root.oohRuntimeCadenceTimer) {
      window.clearTimeout(root.oohRuntimeCadenceTimer);
      root.oohRuntimeCadenceTimer = null;
    }
    if (root.oohRuntimeCadenceNudgeTimer) {
      window.clearTimeout(root.oohRuntimeCadenceNudgeTimer);
      root.oohRuntimeCadenceNudgeTimer = null;
    }
    root.classList.remove('is-mission-active');

    const shell = root.querySelector('[data-ooh-scene-shell]');
    if (shell) {
      shell.classList.remove('is-mission-active');
      shell.setAttribute('data-mission-state', 'signal-lost');
    }

    const sceneStatus = root.querySelector('[data-ooh-scene-status]');
    if (sceneStatus) {
      sceneStatus.textContent = 'SIGNAL LOST // RUNTIME COHESION FAILING // OPERATION HALTED';
    }

    root.querySelectorAll('[data-ooh-action]').forEach(function (button) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    });

    syncSignalIntegrityHud(root, 'lost', cadenceFlavor(root, 'signal_lost', 'SIGNAL LOST. Runtime cohesion failing. Operation halted without persistence.'));
    showOperationSummary(root, 'SIGNAL LOST');
  }

  function tickSignalIntegrity(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || !root.classList.contains('is-mission-active')) {
      stopSignalIntegrityLoop(root);
      return;
    }

    updatePressureCurveStage(root, runtime);
    advanceInterferencePressure(root);
    updateAdaptiveStability(root, runtime);
    updateOperationalRecovery(root, runtime);
    updateOperationalDrift(root, runtime);
    updateOperationalEscalation(root, runtime);
    const cushioned = runtime.cushionUntil && Date.now() < runtime.cushionUntil;
    runtime.integrity = Math.max(0, runtime.integrity - signalDecayAmount(root, cushioned));

    if (runtime.integrity <= 0) {
      failSignalIntegrity(root);
      return;
    }

    advanceObjectiveProgress(root);
    advanceExtractionSync(root);
    if (runtime.extractionComplete) {
      return;
    }

    if (runtime.integrity < signalIntegrityRuntime.degradedThreshold) {
      if (!runtime.degradedAnnounced) {
        runtime.degradedAnnounced = true;
        showLocalCadenceBeat(root, 'SIGNAL DEGRADING', cadenceFlavor(root, 'signal_degradation', 'Runtime cohesion failing. Use SIGNAL HOLD to stabilize.'), 260);
      }
      syncSignalIntegrityHud(root, 'degraded');
      return;
    }

    syncSignalIntegrityHud(root, cushioned ? 'pressure' : 'active');
  }

  function pressureCurveConditionBias(root) {
    const condition = activeRuntimeCondition(root);
    if (!condition) {
      return 0;
    }

    const bias = {
      cold_start: -0.05,
      fog_dawn: -0.02,
      sodium_night: 0,
      signal_echo: 0.015,
      signal_interference: 0.035,
      unstable_weather: 0.04,
      unstable_cadence: 0.045,
      storm_blackout: 0.055,
      high_contact_risk: 0.06,
      impact_pressure: 0.065
    };
    return Math.max(-0.06, Math.min(0.07, bias[condition.id] || 0));
  }

  function pressureCurveStage(root, runtime) {
    if (!runtime || runtime.extractionComplete) {
      return 'complete';
    }

    const elapsed = Math.max(0, Date.now() - (runtime.startedAt || Date.now()));
    const objective = Math.max(0, Math.min(100, runtime.objectiveProgress || 0));
    const extraction = runtime.objectiveReady ? Math.max(0, Math.min(100, runtime.extractionProgress || 0)) : 0;
    const pressure = Math.max(0, Math.min(100, runtime.interferencePressure || 0));

    if (runtime.objectiveReady && (extraction >= 52 || pressure >= 58 || elapsed >= pressureCurveConfig.lateMs)) {
      return 'extraction';
    }
    if (runtime.objectiveReady || objective >= 42 || pressure >= 36 || elapsed >= pressureCurveConfig.midMs) {
      return 'late';
    }
    if (objective >= 18 || pressure >= 16 || elapsed >= pressureCurveConfig.earlyMs) {
      return 'mid';
    }
    return 'early';
  }

  function pressureCurveRate(root, runtime) {
    const stage = runtime ? (runtime.pressureCurveStage || pressureCurveStage(root, runtime)) : 'early';
    const rates = {
      early: pressureCurveConfig.earlyRate,
      mid: pressureCurveConfig.midRate,
      late: pressureCurveConfig.lateRate,
      extraction: pressureCurveConfig.extractionRate,
      complete: 0
    };
    const recoveryActive = runtime && runtime.operationalRecoveryUntil && Date.now() < runtime.operationalRecoveryUntil;
    const recoveryFactor = recoveryActive ? 0.82 : 1;
    return Math.max(0.66, Math.min(1.36, (rates[stage] || 1) + pressureCurveConditionBias(root)) * recoveryFactor);
  }

  function pressureCurveDecay(root, runtime) {
    const stage = runtime ? (runtime.pressureCurveStage || pressureCurveStage(root, runtime)) : 'early';
    const decay = {
      early: pressureCurveConfig.earlyDecay,
      mid: pressureCurveConfig.midDecay,
      late: pressureCurveConfig.lateDecay,
      extraction: pressureCurveConfig.extractionDecay,
      complete: 0
    };
    const recoveryActive = runtime && runtime.operationalRecoveryUntil && Date.now() < runtime.operationalRecoveryUntil;
    const recoveryFactor = recoveryActive ? 0.55 : 1;
    return Math.max(-0.06, Math.min(0.12, ((decay[stage] || 0) + (pressureCurveConditionBias(root) * 0.35)) * recoveryFactor));
  }

  function pressureCurveTelemetry(stage) {
    const copy = {
      early: ['FIELD PRESSURE CONTROLLED', 'EARLY RUN STABLE'],
      mid: ['FIELD PRESSURE RISING', 'MID RUN INSTABILITY LOCAL'],
      late: ['LATE RUN PRESSURE BUILDING', 'ROUTE CONDITIONS WORSENING'],
      extraction: ['EXTRACTION URGENCY RISING', 'EXFIL PRESSURE INCREASING'],
      complete: ['PRESSURE CURVE SEALED']
    };
    return copy[stage] || copy.early;
  }

  function pressureCurveReadout(root, stateKey, fallback) {
    const runtime = root ? root.oohSignalRuntime : null;
    if (!runtime || runtime.lost || runtime.extractionComplete || stateKey === 'standby' || stateKey === 'complete') {
      return fallback;
    }

    const stage = runtime.pressureCurveStage || pressureCurveStage(root, runtime);
    const copy = {
      early: fallback,
      mid: 'FIELD PRESSURE RISING. Telemetry remains readable; stabilization remains effective.',
      late: 'ROUTE CONDITIONS WORSENING. Pressure is building toward extraction.',
      extraction: 'EXTRACTION URGENCY RISING. Hold stabilization through the window.'
    };
    return copy[stage] || fallback;
  }

  function updatePressureCurveStage(root, runtime) {
    if (!root || !runtime || runtime.lost || runtime.extractionComplete || !root.classList.contains('is-mission-active')) {
      return;
    }

    const stage = pressureCurveStage(root, runtime);
    runtime.pressureCurveStage = stage;
    root.setAttribute('data-ooh-pressure-curve', stage);
    const shell = root.querySelector('[data-ooh-scene-shell]');
    if (shell) {
      shell.setAttribute('data-ooh-pressure-curve', stage);
    }

    if (stage !== 'early' && runtime.pressureCurveAnnounced !== stage) {
      runtime.pressureCurveAnnounced = stage;
      const notices = {
        mid: ['FIELD PRESSURE RISING', 'Mid-run instability increasing. Stabilization remains effective.'],
        late: ['ROUTE CONDITIONS WORSENING', 'Late-run pressure building. Keep the channel clean.'],
        extraction: ['EXTRACTION URGENCY RISING', 'Exfil pressure increasing. Hold stabilization through the window.']
      };
      const notice = notices[stage];
      if (notice) {
        const holdOptions = {
          mid: { priority: 2, holdMs: 3100, settleHoldMs: 2700 },
          late: { priority: 3, holdMs: 3800, settleHoldMs: 3200 },
          extraction: { priority: 3, holdMs: 4000, settleHoldMs: 3300 }
        };
        showLocalCadenceBeat(root, notice[0], notice[1], 260, holdOptions[stage]);
      }
    }
  }

  function updateOperationalEscalation(root, runtime) {
    if (!root || !runtime || runtime.lost || runtime.extractionComplete) {
      return;
    }

    const integrity = Math.max(0, Math.min(100, runtime.integrity || 0));
    const pressure = Math.max(0, Math.min(100, runtime.interferencePressure || 0));
    const syncQuality = Math.max(0, Math.min(1, runtime.objectiveSyncQuality || 0));
    const extractionProgress = runtime.objectiveReady ? Math.max(0, Math.min(100, runtime.extractionProgress || 0)) : 0;
    let tier = 'nominal';

    if (integrity < 28 || pressure >= 78 || (runtime.objectiveReady && extractionProgress >= 82 && pressure >= 52)) {
      tier = 'unstable';
    }
    else if (integrity < signalIntegrityRuntime.degradedThreshold || pressure >= 52 || syncQuality < 0.24 || (runtime.objectiveReady && extractionProgress >= 68)) {
      tier = 'degraded';
    }
    else if (integrity < 62 || pressure >= 24 || syncQuality < 0.38 || (runtime.objectiveReady && extractionProgress >= 42)) {
      tier = 'elevated';
    }

    runtime.operationalEscalationTier = tier;
    const pressureNudge = {
      nominal: 0,
      elevated: 0.02,
      degraded: 0.048,
      unstable: 0.084
    };
    const curveNudge = {
      early: -0.006,
      mid: 0,
      late: 0.012,
      extraction: 0.022,
      complete: 0
    };
    const recoveryActive = runtime.operationalRecoveryUntil && Date.now() < runtime.operationalRecoveryUntil;
    const recoveryFactor = recoveryActive ? 0.45 : 1;
    const adaptiveFactor = Math.max(0.75, Math.min(1.25, 1 - ((runtime.adaptiveStability || 0) * 0.18)));
    runtime.interferencePressure = Math.min(100, runtime.interferencePressure + ((pressureNudge[tier] + (curveNudge[runtime.pressureCurveStage || 'early'] || 0)) * recoveryFactor * adaptiveFactor));
    runtime.peakInterferencePressure = Math.max(runtime.peakInterferencePressure || 0, runtime.interferencePressure);

    if (tier !== 'nominal' && runtime.operationalEscalationAnnounced !== tier) {
      runtime.operationalEscalationAnnounced = tier;
      const notices = {
        elevated: ['PRESSURE RISING', 'Exposure rising. Maintain clean synchronization.'],
        degraded: ['RUNTIME DEGRADED', 'Synchronization thinning. Stabilize before extraction narrows.'],
        unstable: ['RUNTIME UNSTABLE', 'Pressure disrupting sync. Hold the channel through extraction.']
      };
      const notice = notices[tier];
      const holdOptions = {
        elevated: { priority: 2, holdMs: 3000, settleHoldMs: 2500 },
        degraded: { priority: 3, holdMs: 3600, settleHoldMs: 3000 },
        unstable: { priority: 3, holdMs: 3900, settleHoldMs: 3200 }
      };
      showLocalCadenceBeat(root, notice[0], notice[1], 260, holdOptions[tier]);
    }
  }

  function updateAdaptiveStability(root, runtime) {
    if (!root || !runtime || runtime.lost || runtime.extractionComplete || !root.classList.contains('is-mission-active')) {
      return;
    }

    const pressure = Math.max(0, Math.min(100, runtime.interferencePressure || 0));
    const syncQuality = Math.max(0, Math.min(1, runtime.objectiveSyncQuality || 0));
    const recoveryActive = runtime.operationalRecoveryUntil && Date.now() < runtime.operationalRecoveryUntil;
    const degraded = runtime.integrity < signalIntegrityRuntime.degradedThreshold || runtime.operationalEscalationTier === 'degraded' || runtime.operationalEscalationTier === 'unstable';
    const stableExtraction = runtime.objectiveReady && runtime.extractionProgress >= 25 && !runtime.extractionUnstableAnnounced && pressure < 52;
    let delta = 0;

    if (recoveryActive || (syncQuality >= 0.72 && pressure < 52) || stableExtraction) {
      delta += 0.018;
    }
    if (degraded || pressure >= 78 || syncQuality < 0.24 || (runtime.operationalDriftUntil && Date.now() < runtime.operationalDriftUntil)) {
      delta -= 0.022;
    }
    if (!delta) {
      delta = runtime.adaptiveStability > 0 ? -0.006 : (runtime.adaptiveStability < 0 ? 0.006 : 0);
    }

    runtime.adaptiveStability = Math.max(-1, Math.min(1, (runtime.adaptiveStability || 0) + delta));
    if (runtime.adaptiveStability >= 0.55 && runtime.adaptiveStabilityAnnounced !== 'stable') {
      runtime.adaptiveStabilityAnnounced = 'stable';
      nudgeLocalTelemetryPulse(root, 'RUNTIME ADAPTING: STABLE HANDLING');
    }
    else if (runtime.adaptiveStability <= -0.55 && runtime.adaptiveStabilityAnnounced !== 'volatile') {
      runtime.adaptiveStabilityAnnounced = 'volatile';
      nudgeLocalTelemetryPulse(root, 'RUNTIME ADAPTING: VOLATILE HANDLING');
    }
    else if (Math.abs(runtime.adaptiveStability) < 0.25) {
      runtime.adaptiveStabilityAnnounced = '';
    }
  }

  function updateOperationalRecovery(root, runtime) {
    if (!root || !runtime || runtime.lost || runtime.extractionComplete || !root.classList.contains('is-mission-active')) {
      return;
    }

    const now = Date.now();
    const pressure = Math.max(0, Math.min(100, runtime.interferencePressure || 0));
    const integrity = Math.max(0, Math.min(100, runtime.integrity || 0));
    const syncQuality = Math.max(0, Math.min(1, runtime.objectiveSyncQuality || 0));
    const recoveryActive = runtime.operationalRecoveryUntil && now < runtime.operationalRecoveryUntil;
    const holdStabilized = runtime.cushionUntil && now < runtime.cushionUntil && integrity >= signalIntegrityRuntime.degradedThreshold && pressure < 78;
    const syncStable = syncQuality >= 0.76 && pressure < 52;
    const extractionStable = runtime.objectiveReady && runtime.extractionProgress >= 25 && integrity >= signalIntegrityRuntime.degradedThreshold && pressure < 52 && !runtime.extractionUnstableAnnounced;

    if (holdStabilized || syncStable || extractionStable) {
      const holdBonus = Math.min(1200, Math.max(0, runtime.operationalRecoveryHoldCount || 0) * 300);
      runtime.operationalRecoveryUntil = Math.max(runtime.operationalRecoveryUntil || 0, now + 3800 + holdBonus);
      if (!recoveryActive && !runtime.operationalRecoveryAnnounced) {
        runtime.operationalRecoveryAnnounced = true;
        showLocalCadenceBeat(root, 'RUNTIME STABILIZING', 'Temporary stabilization. Pressure response softened.', 240);
      }
      return;
    }

    if (!recoveryActive) {
      runtime.operationalRecoveryAnnounced = false;
      runtime.operationalRecoveryHoldCount = Math.max(0, (runtime.operationalRecoveryHoldCount || 0) - 1);
    }
  }

  function updateOperationalDrift(root, runtime) {
    if (!root || !runtime || runtime.lost || runtime.extractionComplete || !root.classList.contains('is-mission-active')) {
      return;
    }

    const now = Date.now();
    const startedAt = runtime.startedAt || now;
    if (now - startedAt < 9000 || now < (runtime.operationalDriftNextAt || 0)) {
      return;
    }

    const pressure = Math.max(0, Math.min(100, runtime.interferencePressure || 0));
    const tier = runtime.operationalEscalationTier || 'nominal';
    const driftChance = tier === 'unstable' ? 0.32 : (tier === 'degraded' ? 0.24 : (tier === 'elevated' ? 0.16 : 0.08));
    runtime.operationalDriftNextAt = now + 9000 + Math.round(Math.random() * 7000);
    if (pressure >= 92 || Math.random() > driftChance) {
      return;
    }

    const driftType = runtime.objectiveReady ?
      (Math.random() < 0.5 ? 'extraction' : 'pressure') :
      (Math.random() < 0.5 ? 'sync' : 'instability');

    if (driftType === 'sync') {
      runtime.objectiveSyncQuality = Math.max(0.12, (runtime.objectiveSyncQuality || 0.35) - 0.06);
    }
    else if (driftType === 'extraction') {
      runtime.extractionReadinessBias = Math.max(-0.08, (runtime.extractionReadinessBias || 0) - 0.025);
      runtime.operationalDriftUntil = now + 4200;
    }
    else if (driftType === 'instability') {
      runtime.actionInstabilityUntil = Math.max(runtime.actionInstabilityUntil || 0, now + 1800);
      runtime.actionInstabilityDecay = Math.max(runtime.actionInstabilityDecay || 0, 0.12);
      runtime.operationalDriftUntil = now + 2400;
    }
    else {
      runtime.interferencePressure = Math.min(100, runtime.interferencePressure + 1.35);
      runtime.peakInterferencePressure = Math.max(runtime.peakInterferencePressure || 0, runtime.interferencePressure);
    }

    if (runtime.operationalRecoveryUntil && now < runtime.operationalRecoveryUntil) {
      runtime.operationalRecoveryUntil = Math.max(now, runtime.operationalRecoveryUntil - 900);
    }

    if (!runtime.operationalDriftAnnounced) {
      runtime.operationalDriftAnnounced = true;
      showLocalCadenceBeat(root, 'OPERATIONAL DRIFT', 'Conditions shifted. Recheck sync and pressure.', 260);
    }
    else {
      nudgeLocalTelemetryPulse(root, 'OPERATIONAL DRIFT REGISTERED');
    }
  }

  function initializeOperationalVariance(root, runtime) {
    if (!root || !runtime) {
      return;
    }

    const condition = activeRuntimeCondition(root);
    const modifiers = condition && condition.modifiers ? condition.modifiers : {};
    const pressureVariance = Math.round(Math.random() * 4);
    const syncVariance = (Math.random() * 0.08) - 0.03;
    runtime.operationalDecayBias = ((Math.random() * 0.1) - 0.04) + (modifiers.decayBias || 0);
    runtime.extractionReadinessBias = ((Math.random() * 0.08) - 0.04) + (modifiers.extractionBias || 0);
    runtime.interferencePressure = Math.min(100, runtime.interferencePressure + pressureVariance + (modifiers.pressureInitial || 0));
    runtime.peakInterferencePressure = Math.max(runtime.peakInterferencePressure || 0, runtime.interferencePressure);
    runtime.operationalDriftNextAt = Math.max(runtime.startedAt + 5500, (runtime.operationalDriftNextAt || runtime.startedAt + 12000) + (modifiers.driftDelay || 0));
    if (!runtime.objectiveReady) {
      runtime.objectiveSyncQuality = Math.max(0.28, Math.min(0.46, runtime.objectiveSyncQuality + syncVariance));
    }
  }

  function numericActivationModifier(modifiers, key, fallback) {
    if (!modifiers || typeof modifiers !== 'object') {
      return fallback;
    }

    return typeof modifiers[key] === 'number' ? modifiers[key] : fallback;
  }

  function addActivationBias(target, source) {
    Object.keys(source || {}).forEach(function (key) {
      target[key] = (target[key] || 0) + source[key];
    });
  }

  function buildActivateMissionSynthesisBias(root, routeId, pathKey, operationCondition) {
    const payload = root && root.oohRuntimeSynthesisPayload ? root.oohRuntimeSynthesisPayload : {};
    const character = payload.character || {};
    const recruiter = payload.recruiter || {};
    const attributeModifiers = Object.assign(
      {},
      recruiter.attributeModifiers || {},
      character.attributeModifiers || {}
    );
    const missionKey = cleanId(payload.missionType || ((payload.mission || {}).id), 'mission');
    const playlistMood = playlistMoodAttribute(payload);
    const routeKey = ['aer', 'mare', 'terra'].indexOf(routeId) !== -1 ? routeId : 'terra';
    const path = String(pathKey || recruiterPathKey(payload) || '').toUpperCase();
    const conditionModifiers = operationCondition && operationCondition.modifiers ? operationCondition.modifiers : {};
    const bias = {
      signalOffset: 0,
      pressureOffset: 0,
      extractionBias: 0,
      objectiveSyncOffset: 0,
      decayBias: 0,
      contactPressureMultiplier: 0
    };

    const routeBiases = {
      aer: { signalOffset: 1, pressureOffset: 0.8, objectiveSyncOffset: 0.008 },
      mare: { signalOffset: -1, pressureOffset: 1.4, extractionBias: -0.006, contactPressureMultiplier: 0.03 },
      terra: { pressureOffset: 0.4, extractionBias: 0.004 }
    };
    const moodBiases = {
      impact: { signalOffset: -1, pressureOffset: 1.4, objectiveSyncOffset: 0.006, contactPressureMultiplier: 0.04 },
      pulse: { pressureOffset: 0.9, objectiveSyncOffset: 0.014, contactPressureMultiplier: 0.02 },
      void: { signalOffset: 1, pressureOffset: -0.4, extractionBias: -0.004 },
      dread: { pressureOffset: 1.1, extractionBias: -0.004, decayBias: 0.004 },
      neutral: { objectiveSyncOffset: 0.004 }
    };
    const missionBiases = {
      recon: { signalOffset: 1, pressureOffset: -0.5, objectiveSyncOffset: 0.018 },
      survival: { signalOffset: -1, pressureOffset: 1.7, extractionBias: -0.008, contactPressureMultiplier: 0.04 },
      purge: { signalOffset: -1, pressureOffset: 1.5, contactPressureMultiplier: 0.025 },
      extraction: { pressureOffset: 0.5, extractionBias: 0.012, objectiveSyncOffset: 0.016 },
      sabotage: { signalOffset: -1, pressureOffset: 1.2, objectiveSyncOffset: 0.01, contactPressureMultiplier: 0.02 },
      artifact_recovery: { signalOffset: 0.5, pressureOffset: 0.6, extractionBias: -0.004, objectiveSyncOffset: 0.012 }
    };

    addActivationBias(bias, routeBiases[routeKey]);
    addActivationBias(bias, moodBiases[playlistMood]);
    addActivationBias(bias, missionBiases[missionKey]);

    if (path === 'DOOMED') {
      addActivationBias(bias, { signalOffset: -1.5, pressureOffset: 1.5, objectiveSyncOffset: 0.006, contactPressureMultiplier: 0.04 });
    }
    else if (path === 'MERGED') {
      addActivationBias(bias, { signalOffset: 1, pressureOffset: -0.4, extractionBias: 0.005, objectiveSyncOffset: 0.014 });
    }

    addActivationBias(bias, {
      pressureOffset: (conditionModifiers.pressureInitial || 0) * 0.18,
      extractionBias: (conditionModifiers.extractionBias || 0) * 0.35,
      decayBias: (conditionModifiers.decayBias || 0) * 0.3,
      contactPressureMultiplier: (conditionModifiers.contactPressurePulse || 0) * 0.08
    });

    addActivationBias(bias, {
      signalOffset: numericActivationModifier(attributeModifiers, 'signalOffset', 0),
      pressureOffset: numericActivationModifier(attributeModifiers, 'pressureOffset', numericActivationModifier(attributeModifiers, 'pressureInitial', 0)),
      extractionBias: numericActivationModifier(attributeModifiers, 'extractionBias', 0),
      objectiveSyncOffset: numericActivationModifier(attributeModifiers, 'objectiveSyncOffset', 0),
      decayBias: numericActivationModifier(attributeModifiers, 'decayBias', 0),
      contactPressureMultiplier: numericActivationModifier(attributeModifiers, 'contactPressureWeight', 0)
    });

    return {
      route: routeKey,
      playlistMood: playlistMood,
      missionType: missionKey,
      path: path || 'UNASSIGNED',
      condition: operationCondition ? operationCondition.id : '',
      signalOffset: Math.max(-4, Math.min(4, bias.signalOffset)),
      pressureOffset: Math.max(-2, Math.min(5, bias.pressureOffset)),
      extractionBias: Math.max(-0.035, Math.min(0.035, bias.extractionBias)),
      objectiveSyncOffset: Math.max(-0.025, Math.min(0.045, bias.objectiveSyncOffset)),
      decayBias: Math.max(-0.025, Math.min(0.035, bias.decayBias)),
      contactPressureMultiplier: Math.max(0.86, Math.min(1.18, 1 + bias.contactPressureMultiplier))
    };
  }

  function applyActivateMissionSynthesisBias(root, runtime) {
    if (!root || !runtime || !root.oohActivationSynthesisBias) {
      return;
    }

    const bias = root.oohActivationSynthesisBias;
    runtime.integrity = Math.min(signalIntegrityRuntime.initial, Math.max(signalIntegrityRuntime.degradedThreshold, runtime.integrity + bias.signalOffset));
    runtime.interferencePressure = Math.max(0, Math.min(100, runtime.interferencePressure + bias.pressureOffset));
    runtime.peakInterferencePressure = Math.max(runtime.peakInterferencePressure || 0, runtime.interferencePressure);
    runtime.extractionReadinessBias = Math.max(-0.12, Math.min(0.12, (runtime.extractionReadinessBias || 0) + bias.extractionBias));
    runtime.operationalDecayBias = Math.max(-0.12, Math.min(0.16, (runtime.operationalDecayBias || 0) + bias.decayBias));
    if (!runtime.objectiveReady) {
      runtime.objectiveSyncQuality = Math.max(0.28, Math.min(0.52, (runtime.objectiveSyncQuality || 0.35) + bias.objectiveSyncOffset));
    }
    runtime.activationSynthesisBias = bias;
  }

  function startSignalIntegrityLoop(root) {
    clearSignalIntegrityRuntime(root);
    const runtime = signalRuntime(root);
    const preset = activeClipPreset(root);
    const initialObjective = Math.min(signalIntegrityRuntime.objectiveThreshold, Math.max(0, Number(preset.objectiveInitial) || signalIntegrityRuntime.objectiveInitial));
    runtime.integrity = Math.min(signalIntegrityRuntime.initial, Math.max(signalIntegrityRuntime.degradedThreshold, Number(preset.signalInitial) || signalIntegrityRuntime.initial));
    runtime.objectiveProgress = initialObjective;
    runtime.objectiveReady = initialObjective >= signalIntegrityRuntime.objectiveThreshold;
    runtime.objectiveAnnounced = false;
    runtime.objectiveSyncQuality = runtime.objectiveReady ? 1 : 0.4;
    runtime.objectiveScanSyncUntil = 0;
    runtime.extractionProgress = runtime.objectiveReady ?
      Math.min(95, Math.max(signalIntegrityRuntime.extractionInitial, Number(preset.extractionInitial) || signalIntegrityRuntime.extractionInitial)) :
      signalIntegrityRuntime.extractionInitial;
    runtime.extractionComplete = false;
    runtime.extractionAnnounced = runtime.objectiveReady && runtime.extractionProgress > signalIntegrityRuntime.extractionInitial;
    runtime.extractionUnstableAnnounced = false;
    runtime.interferencePressure = Math.min(100, Math.max(signalIntegrityRuntime.interferenceInitial, Number(preset.interferenceInitial) || signalIntegrityRuntime.interferenceInitial));
    runtime.peakInterferencePressure = runtime.interferencePressure;
    runtime.startedAt = Date.now();
    runtime.objectiveSyncLastActionAt = runtime.startedAt;
    runtime.scanAwarenessUntil = 0;
    runtime.cushionUntil = 0;
    runtime.actionInstabilityUntil = 0;
    runtime.actionInstabilityDecay = 0;
    runtime.traversalPressureActive = false;
    runtime.traversalPressureDecay = 0;
    runtime.contactPresenceActive = false;
    runtime.contactPresenceNear = false;
    runtime.contactPresenceDecay = 0;
    runtime.contactPresencePressureAt = 0;
    runtime.fieldExtractionComplete = false;
    runtime.operationalDecayBias = 0;
    runtime.extractionReadinessBias = 0;
    runtime.operationalEscalationTier = 'nominal';
    runtime.operationalEscalationAnnounced = '';
    runtime.pressureCurveStage = 'early';
    runtime.pressureCurveAnnounced = '';
    runtime.operationalRecoveryUntil = 0;
    runtime.operationalRecoveryAnnounced = false;
    runtime.operationalRecoveryHoldCount = 0;
    runtime.operationalDriftNextAt = runtime.startedAt + 12000 + Math.round(Math.random() * 6000);
    runtime.operationalDriftUntil = 0;
    runtime.operationalDriftAnnounced = false;
    runtime.adaptiveStability = 0;
    runtime.adaptiveStabilityAnnounced = '';
    runtime.degradedAnnounced = false;
    runtime.lost = false;
    root.setAttribute('data-ooh-pressure-curve', 'early');
    const shell = root.querySelector('[data-ooh-scene-shell]');
    if (shell) {
      shell.setAttribute('data-ooh-pressure-curve', 'early');
    }
    initializeOperationalVariance(root, runtime);
    applyActivateMissionSynthesisBias(root, runtime);
    syncSignalIntegrityHud(root, runtime.objectiveReady ? 'extraction' : 'active', preset.cadenceFlavor || cadenceFlavor(root, 'initialization', 'Operation active. Signal integrity at 100%. Relay alignment in progress.'));
    runtime.timer = window.setInterval(function () {
      tickSignalIntegrity(root);
    }, signalIntegrityRuntime.tickMs);
  }

  function applySignalHold(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || !root.classList.contains('is-mission-active')) {
      return;
    }

    runtime.integrity = Math.min(signalIntegrityRuntime.initial, runtime.integrity + signalIntegrityRuntime.holdRestore);
    runtime.cushionUntil = Date.now() + signalIntegrityRuntime.holdMs;
    runtime.operationalRecoveryHoldCount = Math.min(4, (runtime.operationalRecoveryHoldCount || 0) + 1);
    updateOperationalRecovery(root, runtime);
    if (runtime.integrity >= signalIntegrityRuntime.degradedThreshold) {
      runtime.degradedAnnounced = false;
    }
    syncSignalIntegrityHud(root, signalIntegrityStateKey(root) === 'degraded' ? 'degraded' : 'pressure', 'SIGNAL HOLD. Channel stabilized. Runtime cohesion cushioned.');
    showLocalCadenceBeat(root, 'CHANNEL STABILIZED', cadenceFlavor(root, 'stabilization', 'Signal cushioned. Exposure pressure increasing.'), 220);
  }

  function setOperationalRuntimeState(root, stateKey, readoutOverride) {
    if (!root) {
      return;
    }

    const state = runtimeStateLabels[stateKey] || runtimeStateLabels.standby;
    const stateAttribute = runtimeStateAttribute(state.state);
    root.setAttribute('data-ooh-runtime-state', stateAttribute);

    const shell = root.querySelector('[data-ooh-scene-shell]');
    if (shell) {
      shell.setAttribute('data-ooh-runtime-state', stateAttribute);
    }

    const fields = {
      operationState: state.state,
      signalIntegrity: state.signalIntegrity,
      objectiveStatus: state.objectiveStatus,
      interferencePressure: state.interferencePressure,
      extractionReadiness: state.extractionReadiness
    };

    Object.keys(fields).forEach(function (field) {
      setRuntimeField(root, field, fields[field]);
    });

    root.querySelectorAll('[data-ooh-hud-field="status"]').forEach(function (el) {
      el.textContent = state.state;
    });

    const readout = root.querySelector('[data-ooh-action-readout]');
    if (readout && !readoutHoldActive(root, 1)) {
      readout.textContent = readoutOverride || pressureCurveReadout(root, stateKey, state.readout);
    }
  }

  function resetMissionRuntime(root) {
    const shell = root.querySelector('[data-ooh-scene-shell]');
    const hud = root.querySelector('[data-ooh-active-hud]');
    const combatGate = root.querySelector('[data-ooh-combat-gate]');
    const combatGateButton = root.querySelector('[data-ooh-combat-gate-button]');
    const encounter = root.querySelector('[data-ooh-combat-encounter]');
    const sceneStatus = root.querySelector('[data-ooh-scene-status]');

    suppressVisibleDebugOutput(root);
    removeOperationSummary(root);
    stopLocalTelemetryPulse(root);
    clearLocalCadenceBeat(root);
    clearMovementHint(root);
    clearReadoutHold(root);
    clearSignalIntegrityRuntime(root);
    setOperationalRuntimeState(root, 'standby');
    resetPlayerPresence(root);
    resetTraversalPressure(root);
    resetExtractionObjective(root);
    resetContactPresence(root);
    root.oohActivationSynthesisBias = null;
    if (root.oohRuntimeCadenceTimer) {
      window.clearTimeout(root.oohRuntimeCadenceTimer);
      root.oohRuntimeCadenceTimer = null;
    }
    if (root.oohRuntimeCadenceNudgeTimer) {
      window.clearTimeout(root.oohRuntimeCadenceNudgeTimer);
      root.oohRuntimeCadenceNudgeTimer = null;
    }
    root.classList.remove('is-mission-active', 'is-combat-shell', 'is-field-extraction-complete');
    clearActivationReadyState(root, shell);
    if (shell) {
      shell.classList.remove('is-mission-active', 'is-combat-shell', 'is-combat-armed');
      shell.removeAttribute('data-mission-state');
      shell.removeAttribute('data-combat-state');
      shell.removeAttribute('data-ooh-operation-condition');
      shell.removeAttribute('data-ooh-condition-intensity');
      shell.removeAttribute('data-ooh-pressure-curve');
      shell.removeAttribute('data-ooh-capture-mode');
      shell.removeAttribute('data-ooh-clip-preset');
      shell.removeAttribute('data-ooh-runtime-alive');
    }
    root.removeAttribute('data-ooh-operation-condition');
    root.removeAttribute('data-ooh-condition-intensity');
    root.removeAttribute('data-ooh-pressure-curve');
    root.removeAttribute('data-ooh-capture-mode');
    root.removeAttribute('data-ooh-clip-preset');
    root.removeAttribute('data-ooh-runtime-alive');
    root.oohOperationCondition = null;
    root.oohMovementHintShown = false;
    root.oohCaptureMode = false;
    root.oohClipPresetId = 'none';
    updateCaptureModeToggle(root);
    updateClipPresetToggle(root);
    if (hud) {
      hud.setAttribute('aria-hidden', 'true');
      hud.querySelectorAll('[data-ooh-action]').forEach(function (button) {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      });
    }
    if (combatGate) {
      combatGate.hidden = true;
    }
    if (combatGateButton) {
      combatGateButton.textContent = 'ENGAGE HOSTILE CONTACT';
      combatGateButton.classList.remove('is-combat-armed');
      combatGateButton.disabled = true;
      combatGateButton.setAttribute('aria-disabled', 'true');
      if (combatGateButton.nextElementSibling) {
        combatGateButton.nextElementSibling.textContent = 'Combat systems offline.';
      }
    }
    if (encounter) {
      encounter.hidden = true;
      encounter.classList.remove('is-encounter-visible');
      encounter.removeAttribute('data-encounter-state');
    }
    if (sceneStatus && missionEntryReady(root)) {
      sceneStatus.textContent = 'FIELD STAGED // ENTER FIELD // SCAN / HOLD / SIGNAL';
    }
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

  const operationConditions = [
    {
      id: 'fog_dawn',
      label: 'LOW VISIBILITY // FOG DAWN',
      fieldLabel: 'FIELD CONDITION: LOW VISIBILITY',
      routeAffinity: ['aer', 'mare'],
      moodAffinity: ['void', 'dread', 'neutral'],
      paletteBias: 'pale cyan haze',
      cadenceFlavor: 'Fog saturation softens the route. Maintain clean telemetry.',
      telemetry: ['FIELD CONDITION: LOW VISIBILITY', 'VISIBILITY CHANNEL SOFT', 'HORIZON CONTRAST LOW'],
      modifiers: {
        decayBias: 0.01,
        extractionBias: -0.015,
        pressureInitial: 1,
        driftDelay: 1800,
        contactProximity: 152,
        contactDriftStep: 14,
        contactInterval: 2800
      },
      pressureOffset: {
        x: -0.03,
        y: 0.02,
        width: 0.01
      },
      launchPriority: 3
    },
    {
      id: 'sodium_night',
      label: 'SODIUM-VAPOR NIGHT',
      fieldLabel: 'FIELD CONDITION: SODIUM NIGHT',
      routeAffinity: ['terra'],
      moodAffinity: ['pulse', 'dread', 'neutral'],
      paletteBias: 'amber black industrial field',
      cadenceFlavor: 'Sodium field active. Hard silhouettes on the route.',
      telemetry: ['FIELD CONDITION: SODIUM NIGHT', 'VISUAL CHANNEL STABLE', 'SURFACE EXPOSURE ELEVATED'],
      modifiers: {
        decayBias: 0,
        extractionBias: 0.005,
        pressureInitial: 2,
        driftDelay: 600,
        contactProximity: 164,
        contactDriftStep: 16,
        contactInterval: 2600
      },
      pressureOffset: {
        x: 0.02,
        y: -0.01
      },
      launchPriority: 3
    },
    {
      id: 'storm_blackout',
      label: 'STORM DISTORTION',
      fieldLabel: 'FIELD CONDITION: STORM DISTORTION',
      routeAffinity: ['aer', 'terra'],
      moodAffinity: ['dread', 'impact', 'neutral'],
      paletteBias: 'cold blackout pressure',
      cadenceFlavor: 'Storm distortion present. Signal field must remain disciplined.',
      telemetry: ['FIELD CONDITION: STORM DISTORTION', 'CHANNEL INSTABILITY RISING', 'BLACKOUT PRESSURE LOCAL'],
      modifiers: {
        decayBias: 0.025,
        extractionBias: -0.02,
        pressureInitial: 4,
        driftDelay: -1200,
        contactProximity: 178,
        contactDriftStep: 18,
        contactDecay: 0.18,
        contactPressurePulse: 0.5,
        contactInterval: 2300
      },
      pressureOffset: {
        x: 0.04,
        y: 0.01,
        height: 0.01
      },
      launchPriority: 2
    },
    {
      id: 'signal_echo',
      label: 'SIGNAL ECHO ACTIVE',
      fieldLabel: 'FIELD CONDITION: SIGNAL ECHO ACTIVE',
      routeAffinity: ['aer', 'mare', 'terra'],
      moodAffinity: ['pulse', 'void', 'neutral'],
      paletteBias: 'echoing cyan field',
      cadenceFlavor: 'Signal echo activity present. Telemetry repeats on a controlled delay.',
      telemetry: ['FIELD CONDITION: SIGNAL ECHO ACTIVE', 'SIGNAL ECHO DETECTED', 'ECHO CADENCE LOCAL'],
      modifiers: {
        decayBias: 0.008,
        extractionBias: 0,
        pressureInitial: 1,
        driftDelay: 900,
        contactProximity: 160,
        contactDriftStep: 15,
        contactInterval: 2500
      },
      pressureOffset: {
        x: -0.015,
        width: 0.02
      },
      launchPriority: 2
    },
    {
      id: 'signal_interference',
      label: 'SIGNAL INTERFERENCE',
      fieldLabel: 'FIELD CONDITION: SIGNAL INTERFERENCE',
      routeAffinity: ['aer', 'mare', 'terra'],
      moodAffinity: ['void', 'dread', 'pulse', 'neutral'],
      paletteBias: 'restrained signal interference',
      cadenceFlavor: 'Signal interference present. Channel noise remains contained.',
      telemetry: ['FIELD CONDITION: SIGNAL INTERFERENCE', 'INTERFERENCE CHANNEL ACTIVE', 'SIGNAL DECAY SLIGHT'],
      modifiers: {
        decayBias: 0.022,
        extractionBias: -0.012,
        pressureInitial: 3,
        driftDelay: -500,
        contactProximity: 166,
        contactDriftStep: 16,
        contactDecay: 0.17,
        contactInterval: 2400
      },
      pressureOffset: {
        x: -0.02,
        height: 0.01
      },
      launchPriority: 2
    },
    {
      id: 'unstable_weather',
      label: 'UNSTABLE WEATHER',
      fieldLabel: 'FIELD CONDITION: UNSTABLE WEATHER',
      routeAffinity: ['aer', 'mare'],
      moodAffinity: ['dread', 'impact', 'neutral'],
      paletteBias: 'thin weather drift',
      cadenceFlavor: 'Unstable weather active. Drift cadence remains readable.',
      telemetry: ['FIELD CONDITION: UNSTABLE WEATHER', 'WEATHER CHANNEL UNSTEADY', 'DRIFT WINDOW ACTIVE'],
      modifiers: {
        decayBias: 0.016,
        extractionBias: -0.018,
        pressureInitial: 2,
        driftDelay: -1400,
        contactProximity: 172,
        contactDriftStep: 18,
        contactPressurePulse: 0.46,
        contactInterval: 2300
      },
      pressureOffset: {
        y: 0.025,
        width: 0.01
      },
      launchPriority: 2
    },
    {
      id: 'cold_start',
      label: 'COLD START',
      fieldLabel: 'FIELD CONDITION: COLD START',
      routeAffinity: ['aer', 'mare', 'terra'],
      moodAffinity: ['void', 'neutral'],
      paletteBias: 'quiet cold startup',
      cadenceFlavor: 'Cold start active. Extraction sync responds on a delay.',
      telemetry: ['FIELD CONDITION: COLD START', 'SYSTEM WARMUP LOCAL', 'EXTRACTION SYNC DELAYED'],
      modifiers: {
        decayBias: -0.005,
        extractionBias: -0.025,
        pressureInitial: 0,
        driftDelay: 2200,
        contactProximity: 148,
        contactDriftStep: 13,
        contactInterval: 3000
      },
      pressureOffset: {
        x: -0.01,
        y: -0.01
      },
      launchPriority: 2
    },
    {
      id: 'high_contact_risk',
      label: 'HIGH CONTACT RISK',
      fieldLabel: 'FIELD CONDITION: HIGH CONTACT RISK',
      routeAffinity: ['aer', 'mare', 'terra'],
      moodAffinity: ['impact', 'dread'],
      paletteBias: 'restrained contact watch',
      cadenceFlavor: 'High contact risk present. Field presence likely.',
      telemetry: ['FIELD CONDITION: HIGH CONTACT RISK', 'CONTACT SHADOW LIKELY', 'FIELD PRESENCE WATCH'],
      modifiers: {
        decayBias: 0.018,
        extractionBias: -0.01,
        pressureInitial: 2,
        driftDelay: -900,
        contactProximity: 190,
        contactDriftStep: 20,
        contactDecay: 0.18,
        contactPressurePulse: 0.58,
        contactInterval: 2000
      },
      pressureOffset: {
        x: 0.025,
        height: 0.01
      },
      launchPriority: 2
    },
    {
      id: 'unstable_cadence',
      label: 'UNSTABLE CADENCE',
      fieldLabel: 'FIELD CONDITION: UNSTABLE CADENCE',
      routeAffinity: ['aer', 'mare', 'terra'],
      moodAffinity: ['pulse', 'impact', 'dread'],
      paletteBias: 'thin cadence variance',
      cadenceFlavor: 'Cadence unstable. Keep movement deliberate through pressure shifts.',
      telemetry: ['FIELD CONDITION: UNSTABLE CADENCE', 'CADENCE VARIANCE LOCAL', 'RUNTIME TEMPO SHIFT'],
      modifiers: {
        decayBias: 0.018,
        extractionBias: -0.01,
        pressureInitial: 3,
        driftDelay: -900,
        contactProximity: 170,
        contactDriftStep: 17,
        contactDecay: 0.17,
        contactInterval: 2200
      },
      pressureOffset: {
        x: 0.015,
        y: -0.025,
        height: 0.015
      },
      launchPriority: 2
    },
    {
      id: 'impact_pressure',
      label: 'IMPACT PRESSURE',
      fieldLabel: 'FIELD CONDITION: IMPACT PRESSURE',
      routeAffinity: ['aer', 'terra'],
      moodAffinity: ['impact'],
      paletteBias: 'restrained impact pressure',
      cadenceFlavor: 'Impact pressure active. Forward cadence remains available under load.',
      telemetry: ['FIELD CONDITION: IMPACT PRESSURE', 'IMPACT PRESSURE LOCAL', 'FORWARD CADENCE UNDER LOAD'],
      modifiers: {
        decayBias: 0.02,
        extractionBias: -0.015,
        pressureInitial: 4,
        driftDelay: -1500,
        contactProximity: 184,
        contactDriftStep: 19,
        contactDecay: 0.18,
        contactPressurePulse: 0.54,
        contactInterval: 2100
      },
      pressureOffset: {
        x: 0.05,
        width: 0.02
      },
      launchPriority: 3
    }
  ];

  function weightedConditionPick(conditions) {
    const total = conditions.reduce(function (sum, condition) {
      return sum + Math.max(1, condition.launchPriority || 1);
    }, 0);
    let marker = Math.random() * total;

    for (let i = 0; i < conditions.length; i++) {
      marker -= Math.max(1, conditions[i].launchPriority || 1);
      if (marker <= 0) {
        return conditions[i];
      }
    }

    return conditions[0];
  }

  function conditionById(id) {
    return operationConditions.filter(function (condition) {
      return condition.id === id;
    })[0] || null;
  }

  function resolveOperationCondition(routeId, preset, root) {
    if (preset && preset.conditionId) {
      const presetCondition = conditionById(preset.conditionId);
      if (presetCondition) {
        return presetCondition;
      }
    }

    const routeKey = ['aer', 'mare', 'terra'].indexOf(routeId) !== -1 ? routeId : 'terra';
    const routeConditions = operationConditions.filter(function (condition) {
      return condition.routeAffinity.indexOf(routeKey) !== -1;
    });

    const candidates = routeConditions.length ? routeConditions : operationConditions;
    const mood = root && root.oohMediaAttachment && root.oohMediaAttachment.mood ? String(root.oohMediaAttachment.mood).toLowerCase() : 'neutral';
    const moodWeighted = candidates.map(function (condition) {
      const copy = Object.assign({}, condition);
      if (condition.moodAffinity && condition.moodAffinity.indexOf(mood) !== -1) {
        copy.launchPriority = Math.max(1, condition.launchPriority || 1) + 2;
      }
      return copy;
    });

    return conditionById(weightedConditionPick(moodWeighted).id);
  }

  function applyOperationCondition(root, shell, routeId) {
    const condition = resolveOperationCondition(routeId, activeClipPreset(root), root);
    const targetShell = shell || (root ? root.querySelector('[data-ooh-scene-shell]') : null);
    if (!root || !condition) {
      return null;
    }

    root.oohOperationCondition = condition;
    root.setAttribute('data-ooh-operation-condition', condition.id);
    root.setAttribute('data-ooh-condition-intensity', 'low');
    if (targetShell) {
      targetShell.setAttribute('data-ooh-operation-condition', condition.id);
      targetShell.setAttribute('data-ooh-condition-intensity', 'low');
    }

    return condition;
  }

  function syncOperationConditionHud(root) {
    const condition = root ? root.oohOperationCondition : null;
    if (!root || !condition) {
      return;
    }

    const telemetry = root.querySelector('[data-ooh-hud-field="telemetryC"]');
    if (telemetry) {
      telemetry.textContent = condition.fieldLabel || ('FIELD CONDITION: ' + condition.label);
    }
  }

  // Deterministic route asset map. Entries point at local public files and are optional:
  // the CSS route gradients remain the fallback whenever an image or passive loop is missing.
  const sceneAssetMap = {
    aer: {
      image: drupalPath('sites/default/files/outskirts/backgrounds/bg_underboard_alley_signal_drift.webp'),
      video: drupalPath('sites/default/files/outskirts/loops/video_loops_underboard_alley_signal_drift.mp4'),
      label: 'AER route asset: upper corridor signal drift'
    },
    mare: {
      image: drupalPath('sites/default/files/outskirts/backgrounds/bg_neon_bog_core.webp'),
      video: drupalPath('sites/default/files/outskirts/loops/video_loops_neon_fog_marsh_core.mp4'),
      label: 'MARE route asset: submerged pressure fog'
    },
    terra: {
      image: drupalPath('sites/default/files/outskirts/backgrounds/bg_wasteland_ridge_aftermath_quiet.webp'),
      video: drupalPath('sites/default/files/outskirts/loops/video_loops_wasteland_ridge_core.mp4'),
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

  function capabilitySignalText(payload) {
    const attributes = Array.isArray(payload.selectedAttributes) ? payload.selectedAttributes : [];
    const normalized = attributes.map(function (attribute) {
      return String(attribute || '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
    }).filter(Boolean);

    if (!normalized.length) {
      return 'OBSERVED SIGNALS // BASELINE DISCIPLINE';
    }

    return 'OBSERVED SIGNALS // ' + normalized.slice(0, 4).join(' / ');
  }

  // Phase 90: non-persistent operator evolution preview.
  function buildOperatorEvolutionPreview(payload, routeId, pathKey) {
    const missionKey = cleanId(payload.missionType || ((payload.mission || {}).id), 'mission');
    const moodKey = playlistMoodAttribute(payload);
    const routeKey = routeId || routeIdFromPayload(payload);
    const attributes = Array.isArray(payload.selectedAttributes) ? payload.selectedAttributes : [];
    const pressureSignal = /assault|strike|breach|survive|hold|endure/.test(missionKey) ||
      moodKey === 'impact' ||
      moodKey === 'pulse';
    let pathResonance = 'PATH RESONANCE // ' + pathKey;
    let channelStability = pressureSignal ? 'CHANNEL STABILITY // LOW' : 'CHANNEL STABILITY // BASELINE';

    if (pathKey === 'DOOMED') {
      pathResonance = 'PATH RESONANCE // VOLATILE';
      channelStability = pressureSignal ? 'CHANNEL STABILITY // UNSTABLE BUT RESPONSIVE' : 'CHANNEL STABILITY // LOW';
    }
    else if (pathKey === 'MERGED') {
      pathResonance = 'PATH RESONANCE // SYNCHRONIZED';
      channelStability = pressureSignal ? 'CHANNEL STABILITY // CLEAN SIGNAL UNDER LOAD' : 'CHANNEL STABILITY // CLEAN SIGNAL';
    }

    return {
      operatorEvolution: attributes.length ? 'OPERATOR EVOLUTION // ATTRIBUTE SIGNALS OBSERVED' : 'OPERATOR EVOLUTION // BASELINE OBSERVED',
      pathResonance: pathResonance,
      channelStability: channelStability + ' // ' + routeLabel(routeKey).toUpperCase(),
      observedSignals: capabilitySignalText(payload)
    };
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

  function playlistMoodProfile(payload) {
    const playlistLabel = itemLabel((payload || {}).playlist, 'No playlist selected');
    const playlistKey = cleanId(((payload || {}).playlist || {}).id || playlistLabel, 'playlist');
    const haystack = playlistKey + ' ' + playlistLabel.toLowerCase();
    const moodMap = [
      {
        id: 'impact',
        match: ['rock', 'riot', 'metal', 'wreckoning', 'steel'],
        text: 'pushes impact, grit, and forward pressure',
        cadence: 'IMPACT CADENCE AVAILABLE'
      },
      {
        id: 'pulse',
        match: ['rap', 'drill', 'trap', 'bangaz'],
        text: 'adds pulse, aggression, and close-range focus',
        cadence: 'PULSE CADENCE AVAILABLE'
      },
      {
        id: 'void',
        match: ['ambient', 'drone', 'void', 'signal_blitz', 'blitz'],
        text: 'lowers the room into static, distance, and threat awareness',
        cadence: 'VOID CADENCE AVAILABLE'
      },
      {
        id: 'dread',
        match: ['black', 'banner', 'orchestra', 'classical', 'war'],
        text: 'reinforces command-scale tension and operational dread',
        cadence: 'DREAD CADENCE AVAILABLE'
      }
    ];
    const matched = moodMap.find(function (entry) {
      return entry.match.some(function (keyword) {
        return haystack.indexOf(keyword) !== -1;
      });
    }) || {
      id: 'neutral',
      text: 'sets tension, tempo, and operational focus',
      cadence: 'AUDIO CADENCE AVAILABLE'
    };

    return {
      id: matched.id,
      label: playlistLabel,
      text: matched.text,
      cadence: matched.cadence
    };
  }

  function getPlaylistMoodEffect(payload) {
    const profile = playlistMoodProfile(payload);
    return profile.label.toUpperCase() + ' ' + profile.text + '.';
  }

  function playlistMoodAttribute(payload) {
    return playlistMoodProfile(payload).id;
  }

  function mediaAttachmentLabel(value, fallback) {
    const label = String(value || fallback || '')
      .replace(/\s+/g, ' ')
      .trim();
    return label || '';
  }

  function buildMediaAttachmentContext(payload, assembly) {
    const playlist = (payload || {}).playlist || {};
    const playlistLabel = mediaAttachmentLabel(playlist.label || playlist.name || playlist.id, '');
    if (!playlistLabel || playlistLabel.toLowerCase() === 'no playlist selected') {
      return {
        attached: false,
        state: 'MEDIA CONTEXT STANDBY',
        playlistLabel: '',
        summary: 'No playlist metadata attached.'
      };
    }

    const mood = playlistMoodAttribute(payload || {}).toUpperCase();
    const description = mediaAttachmentLabel(playlist.description, (assembly || {}).playlistMoodEffect);
    const summary = description ?
      description.replace(/\.$/, '') :
      'Passive mission soundtrack metadata attached';

    return {
      attached: true,
      state: 'OPERATIONAL AUDIO AVAILABLE',
      activeState: 'PLAYLIST SIGNAL: ' + playlistLabel.toUpperCase(),
      playlistId: cleanId(playlist.id || playlistLabel, 'playlist'),
      playlistLabel: playlistLabel,
      summary: summary,
      mood: mood,
      cadence: playlistMoodProfile(payload || {}).cadence,
      telemetry: [
        'SIGNAL ATTACHED // ' + playlistLabel.toUpperCase(),
        'CHANNEL LINKED // ' + mood + ' AUDIO CONTEXT',
        playlistMoodProfile(payload || {}).cadence,
        'MEDIA CONTEXT ACTIVE',
        'OPERATIONAL AUDIO AVAILABLE'
      ]
    };
  }

  function characterPresenceLabel(value, fallback) {
    const label = String(value || fallback || '')
      .replace(/\s+/g, ' ')
      .trim();
    return label || '';
  }

  function buildCharacterPresenceContext(payload) {
    const character = (payload || {}).character || null;
    const path = (payload || {}).path || {};
    const recruiter = (payload || {}).recruiter || {};
    const pathLabel = characterPresenceLabel(
      (character || {}).pathLabel || path.label || path.name || path.id,
      ''
    );
    const identityLabel = characterPresenceLabel(
      (character || {}).operativeName || (character || {}).name || (character || {}).label || (character || {}).callsign || (character || {}).codename,
      pathLabel ? pathLabel + ' Operative' : ''
    );
    const selectedAttributes = Array.isArray((character || {}).selectedAttributes) ?
      (character || {}).selectedAttributes :
      ((Array.isArray((payload || {}).selectedAttributes) ? (payload || {}).selectedAttributes : []));
    const hasPresenceMetadata = Boolean(
      pathLabel ||
      identityLabel ||
      recruiter.name ||
      (character || {}).recruiterName ||
      selectedAttributes.length
    );

    if (!hasPresenceMetadata) {
      return {
        attached: false,
        state: 'FIELD IDENTITY STANDBY',
        identityLabel: '',
        roleLabel: '',
        summary: 'No operative metadata attached.'
      };
    }

    const roleLabel = characterPresenceLabel(
      (character || {}).role || (character || {}).roleLabel || (character || {}).classLabel || (character || {}).archetype,
      pathLabel || 'ACTIVE ROLE'
    );
    const recruiterLabel = characterPresenceLabel(
      recruiter.name || (character || {}).recruiterName,
      ''
    );
    const recruiterTitle = characterPresenceLabel(
      recruiter.title || (character || {}).recruiterTitle,
      ''
    );
    const attributeLabel = selectedAttributes.length ?
      selectedAttributes.slice(0, 2).map(function (attribute) {
        return humanizeId(attribute).toUpperCase();
      }).join(' / ') :
      '';
    const summaryParts = [recruiterLabel, recruiterTitle, attributeLabel].filter(Boolean);

    return {
      attached: true,
      state: 'OPERATIVE PRESENT',
      identityLabel: identityLabel || 'FIELD IDENTITY ACTIVE',
      roleLabel: roleLabel.toUpperCase(),
      summary: summaryParts.length ? summaryParts.join(' // ') : 'Presence confirmed in active mission shell',
      telemetry: [
        'PRESENCE CONFIRMED // ' + (identityLabel || roleLabel || 'OPERATIVE').toUpperCase(),
        'FIELD IDENTITY ACTIVE',
        'ACTIVE ROLE // ' + roleLabel.toUpperCase(),
        'SIGNAL BODY ONLINE'
      ]
    };
  }

  function ensureCharacterPresenceLayer(hud) {
    if (!hud) {
      return null;
    }

    let layer = hud.querySelector('[data-ooh-character-presence]');
    if (layer) {
      return layer;
    }

    layer = document.createElement('div');
    layer.className = 'ooh-play__character-presence';
    layer.setAttribute('data-ooh-character-presence', '');
    layer.setAttribute('aria-label', 'Passive operative presence status');

    const kicker = document.createElement('span');
    kicker.className = 'ooh-play__character-kicker';
    kicker.textContent = 'FIELD IDENTITY';

    const title = document.createElement('span');
    title.className = 'ooh-play__character-title';
    title.setAttribute('data-ooh-character-field', 'title');

    const role = document.createElement('span');
    role.className = 'ooh-play__character-role';
    role.setAttribute('data-ooh-character-field', 'role');

    const summary = document.createElement('span');
    summary.className = 'ooh-play__character-summary';
    summary.setAttribute('data-ooh-character-field', 'summary');

    layer.appendChild(kicker);
    layer.appendChild(title);
    layer.appendChild(role);
    layer.appendChild(summary);

    const band = hud.querySelector('.ooh-play__hud-band');
    if (band && band.parentNode) {
      band.parentNode.insertBefore(layer, band);
      return layer;
    }

    hud.appendChild(layer);
    return layer;
  }

  function renderCharacterPresenceLayer(root, hud, context) {
    const characterContext = context || { attached: false };
    if (root) {
      root.oohCharacterPresence = characterContext;
      root.setAttribute('data-ooh-character-present', characterContext.attached ? 'true' : 'false');
    }

    const layer = ensureCharacterPresenceLayer(hud);
    if (!layer) {
      return;
    }

    layer.hidden = !characterContext.attached;
    layer.setAttribute('aria-hidden', characterContext.attached ? 'false' : 'true');
    if (!characterContext.attached) {
      return;
    }

    const title = layer.querySelector('[data-ooh-character-field="title"]');
    const role = layer.querySelector('[data-ooh-character-field="role"]');
    const summary = layer.querySelector('[data-ooh-character-field="summary"]');

    if (title) {
      title.textContent = characterContext.identityLabel;
    }
    if (role) {
      role.textContent = characterContext.state + ' // ' + characterContext.roleLabel;
    }
    if (summary) {
      summary.textContent = characterContext.summary;
    }
  }

  function objectivePresenceLabel(value, fallback) {
    const label = String(value || fallback || '')
      .replace(/\s+/g, ' ')
      .trim();
    return label || '';
  }

  function buildObjectivePresenceContext(assembly, missionLabel) {
    const primaryObjective = objectivePresenceLabel((assembly || {}).primaryObjective, '');
    const secondaryObjective = objectivePresenceLabel((assembly || {}).secondaryObjective, '');
    const mission = objectivePresenceLabel(missionLabel, '');
    if (!primaryObjective && !secondaryObjective && !mission) {
      return {
        attached: false,
        state: 'OBJECTIVE SIGNAL STANDBY',
        objectiveLabel: '',
        summary: 'No objective metadata attached.'
      };
    }

    const objectiveLabel = primaryObjective || secondaryObjective || mission;
    const summary = secondaryObjective ?
      secondaryObjective :
      (mission ? 'Mission objective linked to ' + mission : 'Primary task linked to active mission shell');

    return {
      attached: true,
      state: 'OBJECTIVE PRESENT',
      objectiveLabel: objectiveLabel,
      summary: summary,
      telemetry: [
        'OBJECTIVE PRESENT // ' + objectiveLabel.toUpperCase(),
        'STABILIZATION OBJECTIVE LINKED',
        'FIELD TASK ACTIVE',
        'OBJECTIVE SIGNAL ONLINE'
      ]
    };
  }

  function ensureObjectivePresenceLayer(hud) {
    if (!hud) {
      return null;
    }

    let layer = hud.querySelector('[data-ooh-objective-presence]');
    if (layer) {
      return layer;
    }

    layer = document.createElement('div');
    layer.className = 'ooh-play__objective-presence';
    layer.setAttribute('data-ooh-objective-presence', '');
    layer.setAttribute('aria-label', 'Passive objective presence status');

    const kicker = document.createElement('span');
    kicker.className = 'ooh-play__objective-kicker';
    kicker.textContent = 'STABILIZATION OBJECTIVE';

    const title = document.createElement('span');
    title.className = 'ooh-play__objective-title';
    title.setAttribute('data-ooh-objective-field', 'title');

    const state = document.createElement('span');
    state.className = 'ooh-play__objective-state';
    state.setAttribute('data-ooh-objective-field', 'state');

    const summary = document.createElement('span');
    summary.className = 'ooh-play__objective-summary';
    summary.setAttribute('data-ooh-objective-field', 'summary');

    layer.appendChild(kicker);
    layer.appendChild(title);
    layer.appendChild(state);
    layer.appendChild(summary);

    const band = hud.querySelector('.ooh-play__hud-band');
    if (band && band.parentNode) {
      band.parentNode.insertBefore(layer, band);
      return layer;
    }

    hud.appendChild(layer);
    return layer;
  }

  function renderObjectivePresenceLayer(root, hud, context) {
    const objectiveContext = context || { attached: false };
    if (root) {
      root.oohObjectivePresence = objectiveContext;
      root.setAttribute('data-ooh-objective-present', objectiveContext.attached ? 'true' : 'false');
    }

    const layer = ensureObjectivePresenceLayer(hud);
    if (!layer) {
      return;
    }

    layer.hidden = !objectiveContext.attached;
    layer.setAttribute('aria-hidden', objectiveContext.attached ? 'false' : 'true');
    if (!objectiveContext.attached) {
      return;
    }

    const title = layer.querySelector('[data-ooh-objective-field="title"]');
    const state = layer.querySelector('[data-ooh-objective-field="state"]');
    const summary = layer.querySelector('[data-ooh-objective-field="summary"]');

    if (title) {
      title.textContent = objectiveContext.objectiveLabel;
    }
    if (state) {
      state.textContent = objectiveContext.state + ' // FIELD TASK ACTIVE';
    }
    if (summary) {
      summary.textContent = objectiveContext.summary;
    }
  }

  function extractionPresenceLabel(value, fallback) {
    const label = String(value || fallback || '')
      .replace(/\s+/g, ' ')
      .trim();
    return label || '';
  }

  function buildExtractionPresenceContext(assembly) {
    const extractionCondition = extractionPresenceLabel((assembly || {}).extractionCondition, '');
    if (!extractionCondition) {
      return {
        attached: false,
        state: 'EXTRACTION LINK STANDBY',
        extractionLabel: '',
        summary: 'No extraction context attached.'
      };
    }

    return {
      attached: true,
      state: 'EXTRACTION WINDOW',
      extractionLabel: 'SIGNAL EXTRACTION AVAILABLE',
      summary: extractionCondition,
      telemetry: [
        'EXTRACTION LINK PRESENT',
        'EXTRACTION WINDOW MONITORED',
        'SYNCHRONIZATION ACTIVE',
        'SIGNAL EXTRACTION AVAILABLE'
      ]
    };
  }

  function ensureExtractionPresenceLayer(hud) {
    if (!hud) {
      return null;
    }

    let layer = hud.querySelector('[data-ooh-extraction-presence]');
    if (layer) {
      return layer;
    }

    layer = document.createElement('div');
    layer.className = 'ooh-play__extraction-presence';
    layer.setAttribute('data-ooh-extraction-presence', '');
    layer.setAttribute('aria-label', 'Passive extraction state status');

    const kicker = document.createElement('span');
    kicker.className = 'ooh-play__extraction-kicker';
    kicker.textContent = 'EXTRACTION WINDOW';

    const title = document.createElement('span');
    title.className = 'ooh-play__extraction-title';
    title.setAttribute('data-ooh-extraction-field', 'title');

    const state = document.createElement('span');
    state.className = 'ooh-play__extraction-state';
    state.setAttribute('data-ooh-extraction-field', 'state');

    const summary = document.createElement('span');
    summary.className = 'ooh-play__extraction-summary';
    summary.setAttribute('data-ooh-extraction-field', 'summary');

    layer.appendChild(kicker);
    layer.appendChild(title);
    layer.appendChild(state);
    layer.appendChild(summary);

    const band = hud.querySelector('.ooh-play__hud-band');
    if (band && band.parentNode) {
      band.parentNode.insertBefore(layer, band);
      return layer;
    }

    hud.appendChild(layer);
    return layer;
  }

  function renderExtractionPresenceLayer(root, hud, context) {
    const extractionContext = context || { attached: false };
    if (root) {
      root.oohExtractionPresence = extractionContext;
      root.setAttribute('data-ooh-extraction-present', extractionContext.attached ? 'true' : 'false');
    }

    const layer = ensureExtractionPresenceLayer(hud);
    if (!layer) {
      return;
    }

    layer.hidden = !extractionContext.attached;
    layer.setAttribute('aria-hidden', extractionContext.attached ? 'false' : 'true');
    if (!extractionContext.attached) {
      return;
    }

    const title = layer.querySelector('[data-ooh-extraction-field="title"]');
    const state = layer.querySelector('[data-ooh-extraction-field="state"]');
    const summary = layer.querySelector('[data-ooh-extraction-field="summary"]');

    if (title) {
      title.textContent = extractionContext.extractionLabel;
    }
    if (state) {
      state.textContent = extractionContext.state + ' // SYNCHRONIZATION ACTIVE';
    }
    if (summary) {
      summary.textContent = extractionContext.summary;
    }
  }

  function ensureMediaAttachmentLayer(hud) {
    if (!hud) {
      return null;
    }

    let layer = hud.querySelector('[data-ooh-media-attachment]');
    if (layer) {
      return layer;
    }

    layer = document.createElement('div');
    layer.className = 'ooh-play__media-attachment';
    layer.setAttribute('data-ooh-media-attachment', '');
    layer.setAttribute('aria-label', 'Passive media attachment status');

    const kicker = document.createElement('span');
    kicker.className = 'ooh-play__media-kicker';
    kicker.textContent = 'MEDIA ATTACHMENT';

    const title = document.createElement('span');
    title.className = 'ooh-play__media-title';
    title.setAttribute('data-ooh-media-field', 'title');

    const state = document.createElement('span');
    state.className = 'ooh-play__media-state';
    state.setAttribute('data-ooh-media-field', 'state');

    const summary = document.createElement('span');
    summary.className = 'ooh-play__media-summary';
    summary.setAttribute('data-ooh-media-field', 'summary');

    layer.appendChild(kicker);
    layer.appendChild(title);
    layer.appendChild(state);
    layer.appendChild(summary);

    const band = hud.querySelector('.ooh-play__hud-band');
    if (band && band.parentNode) {
      band.parentNode.insertBefore(layer, band);
      return layer;
    }

    hud.appendChild(layer);
    return layer;
  }

  function activeMediaState(mediaContext) {
    if (!mediaContext || !mediaContext.attached) {
      return '';
    }

    return mediaContext.activeState || ('PLAYLIST SIGNAL: ' + String(mediaContext.playlistLabel || 'AUDIO').toUpperCase());
  }

  function playlistCadenceText(root) {
    const mediaContext = root ? root.oohMediaAttachment : null;
    if (!mediaContext || !mediaContext.attached) {
      return '';
    }

    return mediaContext.cadence || 'AUDIO IDENTITY LOCKED';
  }

  function renderMediaAttachmentLayer(root, hud, context) {
    const mediaContext = context || { attached: false };
    if (root) {
      root.oohMediaAttachment = mediaContext;
      root.setAttribute('data-ooh-media-attached', mediaContext.attached ? 'true' : 'false');
    }

    const layer = ensureMediaAttachmentLayer(hud);
    if (!layer) {
      return;
    }

    layer.hidden = !mediaContext.attached;
    layer.setAttribute('aria-hidden', mediaContext.attached ? 'false' : 'true');
    if (!mediaContext.attached) {
      return;
    }

    const title = layer.querySelector('[data-ooh-media-field="title"]');
    const state = layer.querySelector('[data-ooh-media-field="state"]');
    const summary = layer.querySelector('[data-ooh-media-field="summary"]');

    if (title) {
      title.textContent = mediaContext.playlistLabel;
    }
    if (state) {
      state.textContent = root && root.classList.contains('is-mission-active') ? activeMediaState(mediaContext) : mediaContext.state;
    }
    if (summary) {
      summary.textContent = root && root.classList.contains('is-mission-active') ? (mediaContext.cadence || mediaContext.summary) : mediaContext.summary;
    }
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
      aer: 'FIELD ACTIVE. Sky corridor live. Scan, hold, or check signal.',
      mare: 'FIELD ACTIVE. Pressure zone live. Scan, hold, or check signal.',
      terra: 'FIELD ACTIVE. Ground route live. Scan, hold, or check signal.'
    };
    const pathTone = pathKey === 'DOOMED' ?
      ' DOOMED channel unstable.' :
      (pathKey === 'MERGED' ? ' MERGED channel synchronized.' : '');

    return (routeStates[routeId] || routeStates.terra) + pathTone + ' Objective: ' + missionLabel + '.';
  }

  function buildCombatShellSceneStatus(routeId, pathKey, missionLabel) {
    const routeStates = {
      aer: 'COMBAT SHELL PREVIEW ARMED. Sky corridor contact confirmed. Maintain altitude discipline.',
      mare: 'COMBAT SHELL PREVIEW ARMED. Pressure-zone contact confirmed. Maintain oxygen discipline.',
      terra: 'COMBAT SHELL PREVIEW ARMED. Ground-route contact confirmed. Maintain signal discipline.'
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
    const activeTarget = root.classList.contains('is-mission-active') && root.querySelector('[data-ooh-active-hud]');
    const target = activeTarget ||
      root.querySelector('[data-ooh-mission-briefing]') ||
      root.querySelector('[data-ooh-play-top]') ||
      root;

    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({
        behavior: activeTarget ? 'auto' : 'smooth',
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
    if (!missionEntryReady(root) || !root.classList.contains('is-mission-active')) {
      return;
    }

    const runtime = signalRuntime(root);
    const readoutText = passiveActionText(action, routeId, pathKey);
    if (action === 'hold') {
      applySignalHold(root);
    }
    else if (action === 'scan') {
      applyInterferenceScan(root);
    }
    else {
      syncSignalIntegrityHud(root, runtimeStateKeyFromAction(action), readoutText);
    }
    applyActionObjectiveProgress(root, runtime, action);
    applyOperationalPressure(root, runtime, action);
    const actionNudges = {
      scan: 'SCAN: SYNC IMPROVED // EXPOSURE RISING',
      hold: 'HOLD: SIGNAL CUSHIONED // PRESSURE RISING',
      signal: 'SIGNAL CHECK: CHANNEL VERIFIED // PRESSURE LOCAL'
    };
    nudgeLocalTelemetryPulse(root, actionNudges[action] || 'ACTION REGISTERED // CHANNEL PRESSURE LOCAL', 3, 3600);

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
  let generatedContactReadoutText = '';
  let generatedContactAuditText = '';
  let generatedContactLockText = '';
  let generatedContactPresenceText = '';
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

  function generatedContactArchetypeId(routeId, pathKey, missionLabel) {
    const source = [routeId, pathKey, missionLabel].join(' ').toLowerCase();
    if (source.indexOf('mare') !== -1 || source.indexOf('water') !== -1 || source.indexOf('extraction') !== -1 || source.indexOf('tunnel') !== -1) {
      return source.indexOf('tunnel') !== -1 ? 'leech_ronin' : 'hippo_ronin';
    }
    if (source.indexOf('aer') !== -1 || source.indexOf('air') !== -1 || source.indexOf('overwatch') !== -1) {
      return source.indexOf('overwatch') !== -1 ? 'owl_ronin' : 'bee_ronin';
    }
    if (source.indexOf('sabotage') !== -1) {
      return 'leech_ronin';
    }
    if (source.indexOf('assault') !== -1 || source.indexOf('terra') !== -1 || source.indexOf('ground') !== -1) {
      return source.indexOf('assault') !== -1 ? 'hippo_ronin' : 'bee_ronin';
    }
    return 'hippo_ronin';
  }

function applyGeneratedContact(routeId, pathKey, missionLabel) {
  setActiveEnemyContactArchetypeId(generatedContactArchetypeId(routeId, pathKey, missionLabel));
  const archetype = activeEnemyContactArchetype();

  generatedContactReadoutText = [
    'MISSION ORDER DOSSIER',
    'DESIGNATED CONTACT: ' + (archetype ? archetype.label : 'UNKNOWN CONTACT'),
    'SOURCE: ROUTE + MISSION PROFILE'
  ].join('\n');

  generatedContactAuditText =
    'CONTACT GENERATION AUDIT: ROUTE=' + routeLabel(routeId) +
    ' // PATH=' + pathKey +
    ' // MISSION=' + missionLabel +
    ' // SOURCE=LOCAL PROFILE ONLY';

  generatedContactLockText =
    'CONTACT PROFILE LOCKED: ' +
    (archetype ? archetype.label : 'UNKNOWN CONTACT') +
    ' // ENCOUNTER READOUT ONLY';

  generatedContactPresenceText =
    'CONTACT PRESENCE: ' +
    (archetype && archetype.profile ? archetype.profile.movementType : 'UNKNOWN') +
    ' // ' +
    (archetype && archetype.profile ? archetype.profile.threatRole : 'UNKNOWN') +
    ' // ' +
    (archetype && archetype.profile ? archetype.profile.behaviorState : 'UNKNOWN');
}

function setSelectedTriggerPreview(triggerType) {
  selectedTriggerPreview =
    triggerSelectorOptions.indexOf(triggerType) !== -1
      ? triggerType
      : 'none';
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
      'PHASE 10 AUDIT COMPLETE: BEHAVIOR DISPLAY PREVIEW APPLIED // ALLEGIANCE REVIEWED // COMBAT SYSTEMS LOCKED',
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

  function contactTensionLevel(archetype) {
    const profile = archetype ? archetype.profile : {};
    const state = String(profile.behaviorState || profile.dispositionState || '').toUpperCase();

    if (state === 'THREATENING' || state === 'WITHDRAWING') {
      return 'high';
    }
    if (state === 'FORMING' || state === 'CAUTIOUS' || state === 'SUPPORT-READY') {
      return 'medium';
    }
    return 'low';
  }

  function syncArchetypeReadouts(encounter) {
    if (!encounter) {
      return;
    }

    encounter.setAttribute('data-active-archetype', activeEnemyContactArchetypeId);
    encounter.setAttribute('data-contact-tension', contactTensionLevel(activeEnemyContactArchetype()));
    syncGeneratedContactReadout(encounter);
    syncEncounterSummary(encounter);
    syncEnemyContactProfile(encounter);
    syncEnemyMovementTags(encounter);
    syncEnemyMissionAffinity(encounter);
    syncEnemyBehaviorIntent(encounter);
    syncEnemyTriggerPreview(encounter);
    syncTriggerSelectionPreview(encounter);
    syncPassivePreviewLog(encounter);
  }

  function ensureGeneratedContactReadout(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-generated-contact-readout]');
    if (existing) {
      return existing;
    }

    const readout = document.createElement('span');
    readout.className = 'ooh-play-generated-contact-readout';
    readout.setAttribute('data-ooh-generated-contact-readout', '');

    const selector = encounter.querySelector('[data-ooh-archetype-selector]');
    const profile = encounter.querySelector('[data-ooh-contact-profile]');
    const telemetry = encounter.querySelector('[data-ooh-combat-telemetry]');
    const actions = encounter.querySelector('.ooh-play-encounter__actions');
    if (selector) {
      encounter.insertBefore(readout, selector.nextSibling);
      return readout;
    }
    if (profile) {
      encounter.insertBefore(readout, profile);
      return readout;
    }
    if (telemetry) {
      encounter.insertBefore(readout, telemetry);
      return readout;
    }
    if (actions) {
      encounter.insertBefore(readout, actions);
      return readout;
    }

    encounter.appendChild(readout);
    return readout;
  }

  function syncGeneratedContactReadout(encounter) {
    const readout = ensureGeneratedContactReadout(encounter);
    if (!readout) {
      return;
    }
    readout.textContent = generatedContactReadoutText;
    readout.hidden = !generatedContactReadoutText;
    syncGeneratedContactAuditReadout(encounter);
    syncGeneratedContactLockReadout(encounter);
  }

  function ensureGeneratedContactAuditReadout(encounter) {
    if (!encounter) {
      return null;
    }

    const existing = encounter.querySelector('[data-ooh-generated-contact-audit]');
    if (existing) {
      return existing;
    }

    const audit = document.createElement('span');
    audit.className = 'ooh-play-generated-contact-audit';
    audit.setAttribute('data-ooh-generated-contact-audit', '');
    const readout = encounter.querySelector('[data-ooh-generated-contact-readout]');
    if (readout) {
      encounter.insertBefore(audit, readout.nextSibling);
      return audit;
    }
    encounter.appendChild(audit);
    return audit;
  }

  function syncGeneratedContactAuditReadout(encounter) {
    const audit = ensureGeneratedContactAuditReadout(encounter);
    if (!audit) {
      return;
    }
    audit.textContent = generatedContactAuditText;
    audit.hidden = !generatedContactAuditText;
  }
  function ensureGeneratedContactLockReadout(encounter) {
  if (!encounter) {
    return null;
  }

  const existing = encounter.querySelector('[data-ooh-generated-contact-lock]');
  if (existing) {
    return existing;
  }

  const lock = document.createElement('span');
  lock.className = 'ooh-play-generated-contact-lock';
  lock.setAttribute('data-ooh-generated-contact-lock', '');

  const audit = encounter.querySelector('[data-ooh-generated-contact-audit]');
  if (audit) {
    encounter.insertBefore(lock, audit.nextSibling);
    return lock;
  }

  encounter.appendChild(lock);
  return lock;
 }

 function syncGeneratedContactLockReadout(encounter) {
   const lock = ensureGeneratedContactLockReadout(encounter);
   if (!lock) {
     return;
 }
  lock.textContent = generatedContactLockText;
  lock.hidden = !generatedContactLockText;
  syncMissionAuthorityStamp(encounter);
 }

 function ensureMissionAuthorityStamp(encounter) {
  if (!encounter) {
    return null;
  }

  const existing = encounter.querySelector('[data-ooh-mission-display-stamp]');
  if (existing) {
    return existing;
  }

  const stamp = document.createElement('span');
  stamp.className = 'ooh-play-mission-display-stamp';
  stamp.setAttribute('data-ooh-mission-display-stamp', '');
  stamp.textContent = 'CLASSIFIED // STAGED // LOCAL';

  const lock = encounter.querySelector('[data-ooh-generated-contact-lock]');
  if (lock) {
    encounter.insertBefore(stamp, lock.nextSibling);
    return stamp;
  }

  encounter.appendChild(stamp);
  return stamp;
 }

 function syncMissionAuthorityStamp(encounter) {
  const stamp = ensureMissionAuthorityStamp(encounter);
  if (!stamp) {
    return;
  }
  stamp.hidden = !generatedContactLockText;
  syncGeneratedContactPresenceReadout(encounter);
 }

 function ensureGeneratedContactPresenceReadout(encounter) {
  if (!encounter) {
    return null;
  }

  const existing = encounter.querySelector('[data-ooh-generated-contact-presence]');
  if (existing) {
    return existing;
  }

  const presence = document.createElement('span');
  presence.className = 'ooh-play-generated-contact-presence';
  presence.setAttribute('data-ooh-generated-contact-presence', '');

  const stamp = encounter.querySelector('[data-ooh-mission-display-stamp]');
  if (stamp) {
    encounter.insertBefore(presence, stamp.nextSibling);
    return presence;
  }

  encounter.appendChild(presence);
  return presence;
 }

 function syncGeneratedContactPresenceReadout(encounter) {
  const presence = ensureGeneratedContactPresenceReadout(encounter);
  if (!presence) {
    return;
  }
  presence.textContent = generatedContactPresenceText;
  presence.hidden = !generatedContactPresenceText;
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
    selectorWrap.className = 'ooh-play-archetype-selector ooh-play-archetype-selector--dev-only';
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
    label.textContent = 'ENGAGEMENT POSTURE';

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
    confirmButton.textContent = 'CONFIRM RESPONSE';

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
    armButton.textContent = 'LOCK RESPONSE';

    const applicationLock = document.createElement('span');
    applicationLock.className = 'ooh-play-trigger-selector__application-lock';
    applicationLock.setAttribute('data-ooh-transition-application-lock', '');
    applicationLock.textContent = 'TRANSITION APPLICATION LOCKED: MANUAL REVIEW REQUIRED // NO STATE APPLIED';

    const displayApplied = document.createElement('span');
    displayApplied.className = 'ooh-play-trigger-selector__display-applied';
    displayApplied.setAttribute('data-ooh-transition-display-applied', '');
    displayApplied.textContent = 'TRANSITION DISPLAY APPLIED: NOT RUN';

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
    allegianceReviewButton.textContent = 'CONFIRM CONTACT STATUS';

    const allegianceReviewLock = document.createElement('span');
    allegianceReviewLock.className = 'ooh-play-trigger-selector__allegiance-review-lock';
    allegianceReviewLock.setAttribute('data-ooh-allegiance-review-lock', '');
    allegianceReviewLock.hidden = true;
    allegianceReviewLock.textContent = 'ALLEGIANCE REVIEW LOCKED: MANUAL CONFIRMATION REQUIRED // NO ALLEGIANCE CHANGE APPLIED';

    const allegianceDisplayApplied = document.createElement('span');
    allegianceDisplayApplied.className = 'ooh-play-trigger-selector__allegiance-display-applied';
    allegianceDisplayApplied.setAttribute('data-ooh-allegiance-display-applied', '');
    allegianceDisplayApplied.hidden = true;

    const phase10FinalAudit = document.createElement('pre');
    phase10FinalAudit.className = 'ooh-play-trigger-selector__phase-10-final-audit';
    phase10FinalAudit.setAttribute('data-ooh-phase-10-final-audit', '');
    phase10FinalAudit.hidden = true;

    const engagementStatus = document.createElement('span');
    engagementStatus.className = 'ooh-play-trigger-selector__engagement-status';
    engagementStatus.setAttribute('data-ooh-engagement-status', '');
    engagementStatus.hidden = true;
    engagementStatus.textContent = 'LOCAL ENGAGEMENT PREVIEW: ' + engagementState + ' // COMBAT SYSTEMS NOT ACTIVE';

    const engageHostileButton = document.createElement('button');
    engageHostileButton.className = 'ooh-play-trigger-selector__engage-hostile';
    engageHostileButton.type = 'button';
    engageHostileButton.setAttribute('data-ooh-engage-hostile-contact', '');
    engageHostileButton.disabled = true;
    engageHostileButton.setAttribute('aria-disabled', 'true');
    engageHostileButton.hidden = true;
    engageHostileButton.textContent = 'ENGAGE CONTACT';

    const engagementConfirmed = document.createElement('span');
    engagementConfirmed.className = 'ooh-play-trigger-selector__engagement-confirmed';
    engagementConfirmed.setAttribute('data-ooh-engagement-confirmed', '');
    engagementConfirmed.hidden = true;
    engagementConfirmed.textContent = '';

    const contactLockConfirmation = document.createElement('span');
    contactLockConfirmation.className = 'ooh-play-trigger-selector__contact-lock-confirmation';
    contactLockConfirmation.setAttribute('data-ooh-contact-lock-confirmation', '');
    contactLockConfirmation.hidden = true;
    contactLockConfirmation.textContent = 'CONTACT LOCK CONFIRMED // VISUAL TRACKING ONLY';

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
    executeStrikeButton.textContent = 'SIMULATE STRIKE';

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
      allegianceDisplayApplied.hidden = true;
      allegianceDisplayApplied.textContent = '';
      phase10FinalAudit.hidden = true;
      phase10FinalAudit.textContent = '';
      engagementStatus.hidden = true;
      engagementStatus.textContent = 'LOCAL ENGAGEMENT PREVIEW: ' + engagementState + ' // COMBAT SYSTEMS NOT ACTIVE';
      engageHostileButton.hidden = true;
      engageHostileButton.disabled = true;
      engageHostileButton.setAttribute('aria-disabled', 'true');
      engagementConfirmed.hidden = true;
      engagementConfirmed.textContent = '';
      contactLockConfirmation.hidden = true;
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
      allegianceDisplayApplied.textContent = 'ALLEGIANCE DISPLAY APPLIED: ' + allegianceState + ' // NO COMBAT SYSTEMS ENGAGED';
      allegianceDisplayApplied.hidden = false;
      allegianceReviewChecklist.textContent = allegianceReviewChecklistText(true, allegianceState !== 'NEUTRAL');
      phase10FinalAudit.textContent = phase10FinalAuditText(archetype);
      phase10FinalAudit.hidden = false;
      engagementStatus.textContent = 'LOCAL ENGAGEMENT PREVIEW: ' + engagementState + ' // COMBAT SYSTEMS NOT ACTIVE';
      engagementStatus.hidden = false;
      engageHostileButton.hidden = false;
      engageHostileButton.disabled = allegianceState === 'NEUTRAL';
      engageHostileButton.setAttribute('aria-disabled', engageHostileButton.disabled ? 'true' : 'false');
      engagementConfirmed.hidden = true;
      engagementConfirmed.textContent = '';
      contactLockConfirmation.hidden = true;
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
      const focusedEncounter =
        engageHostileButton.closest('[data-ooh-combat-encounter]') ||
        engageHostileButton.closest('.ooh-play-encounter') ||
        document.querySelector('.ooh-play-encounter.is-encounter-visible') ||
        document.querySelector('[data-contact-tension]');
      if (focusedEncounter) {
        focusedEncounter.setAttribute('data-contact-focus', 'locked');
        focusedEncounter.classList.add('is-contact-focus-locked');
      }
      engagementStatus.textContent = 'LOCAL ENGAGEMENT PREVIEW: LOCKED';
      engagementConfirmed.textContent = 'ENGAGEMENT PREVIEW CONFIRMED: TARGET LOCKED // NO DAMAGE SYSTEM ACTIVE';
      engagementConfirmed.hidden = false;
      contactLockConfirmation.hidden = false;
      combatLoopStatus.hidden = false;
      executeStrikeButton.hidden = false;
      strikeOutcome.hidden = true;
      strikeOutcome.textContent = '';
    });

    executeStrikeButton.addEventListener('click', function () {
      if (engagementState !== 'ENGAGED') {
        return;
      }
      strikeOutcome.textContent = 'LOCAL STRIKE SIMULATION: DISPLAY ONLY // NO AUTHORITATIVE OUTCOME RECORDED';
      renderCombatFoundationAudits();
      strikeOutcome.hidden = false;
      const strikeRoot = executeStrikeButton.closest('[data-ooh-play]');
      const strikeShell = strikeRoot ? strikeRoot.querySelector('[data-ooh-scene-shell]') : null;
      const strikeRouteId = cleanId(strikeShell ? strikeShell.getAttribute('data-route') : '', 'terra');
      const strikePathKey = strikeShell ? (strikeShell.getAttribute('data-path') || 'UNASSIGNED') : 'UNASSIGNED';
      showSessionEvolutionFeedback(
        strikeRoot,
        sessionEvolutionFeedbackText(strikeRoot, strikePathKey, strikeRouteId) + ' // SIGNAL PATTERN RECORDED',
        'CONTACT RESPONSE SIMULATED // SESSION LOCAL DISPLAY ONLY',
        sessionContinuityText(strikePathKey)
      );
    });

    armButton.addEventListener('click', function () {
      const archetype = activeEnemyContactArchetype();
      const previewState = behaviorStateTransitionPreviewState();
      if (armButton.disabled || !transitionPreviewConfirmed || !archetype || !previewState) {
        return;
      }
      archetype.profile.behaviorState = previewState;
      applicationChecklist.textContent = transitionApplicationChecklistText(true, true);
      displayApplied.textContent = 'TRANSITION DISPLAY APPLIED: BEHAVIOR STATE ONLY // NO OTHER SYSTEMS ENGAGED';
      allegianceCompatibility.textContent = allegianceCompatibilityReviewText(archetype);
      allegianceCompatibility.hidden = false;
      allegianceReviewButton.hidden = false;
      allegianceReviewButton.disabled = false;
      allegianceReviewButton.setAttribute('aria-disabled', 'false');
      allegianceReviewLock.hidden = false;
      allegianceDisplayApplied.hidden = true;
      allegianceDisplayApplied.textContent = '';
      phase10FinalAudit.hidden = true;
      phase10FinalAudit.textContent = '';
      engagementStatus.hidden = true;
      engagementStatus.textContent = 'LOCAL ENGAGEMENT PREVIEW: ' + engagementState + ' // COMBAT SYSTEMS NOT ACTIVE';
      engageHostileButton.hidden = true;
      engageHostileButton.disabled = true;
      engageHostileButton.setAttribute('aria-disabled', 'true');
      engagementConfirmed.hidden = true;
      engagementConfirmed.textContent = '';
      contactLockConfirmation.hidden = true;
      combatLoopStatus.hidden = true;
      executeStrikeButton.hidden = true;
      strikeOutcome.hidden = true;
      strikeOutcome.textContent = '';
      allegianceReviewChecklist.textContent = allegianceReviewChecklistText(true, false);
      allegianceReviewChecklist.hidden = false;
      auditStamp.textContent = 'PHASE 10 APPLICATION: BEHAVIOR DISPLAY PREVIEW APPLIED // ' + previewState;
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
    selectorWrap.appendChild(displayApplied);
    selectorWrap.appendChild(allegianceCompatibility);
    selectorWrap.appendChild(allegianceReviewButton);
    selectorWrap.appendChild(allegianceReviewLock);
    selectorWrap.appendChild(allegianceDisplayApplied);
    selectorWrap.appendChild(phase10FinalAudit);
    selectorWrap.appendChild(engagementStatus);
    selectorWrap.appendChild(engageHostileButton);
    selectorWrap.appendChild(engagementConfirmed);
    selectorWrap.appendChild(contactLockConfirmation);
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

  // Phase 93: session-based evolution feedback loop.
  function showSessionEvolutionFeedback(root, message, settleText, continuityText) {
    const readout = root ? root.querySelector('[data-ooh-action-readout]') : null;
    if (!readout) {
      return;
    }

    if (readout.oohEvolutionFeedbackTimer) {
      window.clearTimeout(readout.oohEvolutionFeedbackTimer);
    }
    if (readout.oohEvolutionContinuityTimer) {
      window.clearTimeout(readout.oohEvolutionContinuityTimer);
    }

    readout.textContent = message;
    readout.oohEvolutionFeedbackTimer = window.setTimeout(function () {
      readout.textContent = settleText;
      readout.oohEvolutionFeedbackTimer = null;
      if (continuityText) {
        readout.oohEvolutionContinuityTimer = window.setTimeout(function () {
          readout.textContent = continuityText;
          readout.oohEvolutionContinuityTimer = null;
        }, 1600);
      }
    }, 1400);
  }

  function runtimeCadenceLines(root) {
    const mediaContext = root ? root.oohMediaAttachment : null;
    const mood = mediaContext && mediaContext.mood ? String(mediaContext.mood).toLowerCase() : 'neutral';
    const condition = activeRuntimeCondition(root);
    const conditionId = condition ? condition.id : 'neutral';
    const baseLines = ['SIGNAL ECHO DETECTED', 'CADENCE STABLE', 'FIELD DISTORTION MINOR'];
    const moodLines = {
      impact: ['IMPACT RHYTHM MAINTAINED', 'FORWARD CADENCE STABLE'],
      pulse: ['PULSE CADENCE MAINTAINED', 'LOW RHYTHM HOLDING'],
      void: ['VOID CHANNEL QUIET', 'DISTANT SIGNAL DRIFT'],
      dread: ['DREAD CADENCE LOW', 'COMMAND TEMPO HOLDING'],
      neutral: ['AUDIO CADENCE HOLDING']
    };
    const conditionLines = {
      fog_dawn: ['LOW VISIBILITY CADENCE', 'HORIZON SIGNAL SOFT'],
      sodium_night: ['SODIUM FIELD HOLDING', 'HARD SILHOUETTE STABLE'],
      storm_blackout: ['BLACKOUT CADENCE ACTIVE', 'STORM PRESSURE LOCAL'],
      signal_echo: ['ECHO CADENCE ACTIVE', 'SIGNAL REPEAT CONTROLLED'],
      signal_interference: ['SIGNAL INTERFERENCE ACTIVE', 'CHANNEL NOISE CONTAINED'],
      unstable_weather: ['UNSTABLE WEATHER ACTIVE', 'DRIFT WINDOW READABLE'],
      cold_start: ['COLD START ACTIVE', 'SYSTEM WARMUP LOCAL'],
      high_contact_risk: ['CONTACT RISK ACTIVE', 'FIELD PRESENCE WATCH'],
      unstable_cadence: ['CADENCE VARIANCE LOCAL', 'TEMPO SHIFT CONTAINED'],
      impact_pressure: ['IMPACT PRESSURE ACTIVE', 'FORWARD CADENCE UNDER LOAD'],
      neutral: []
    };

    return baseLines.concat(moodLines[mood] || moodLines.neutral).concat(conditionLines[conditionId] || conditionLines.neutral);
  }

  function contactPresenceTelemetryLines(root) {
    const state = root ? root.oohContactPresence : null;
    if (!state || !state.active) {
      return [];
    }

    return state.near ?
      ['CONTACT TRACE DETECTED', 'SIGNAL SHADOW OBSERVED', 'FIELD PRESENCE ESCALATING'] :
      ['DISTANT CONTACT TRACE', 'SIGNAL SHADOW LOW'];
  }

  function pressureCurveTelemetryLines(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.extractionComplete || runtime.lost) {
      return [];
    }

    return pressureCurveTelemetry(runtime.pressureCurveStage || pressureCurveStage(root, runtime));
  }

  function localTelemetryPulseLines(root, routeId, pathKey, mode) {
    const runtime = signalRuntime(root);
    const condition = root ? root.oohOperationCondition : null;
    const conditionId = condition ? condition.id : 'neutral';
    const routeLines = {
      aer: ['CLOUDLINE ECHO STABLE', 'LOCAL ECHO QUIET', 'ALTITUDE VARIANCE: LOCAL', 'HORIZON CHANNEL CLEAR', 'SKY CHANNEL HOLDING', 'THIN SIGNAL MARGIN', 'ALTITUDE CHANNEL HOLDING', 'EXPOSED ROUTE STABLE'],
      mare: ['CURRENT ECHO LOCAL', 'CURRENT HOLDING', 'PRESSURE RIPPLE: LOCAL', 'DEPTH CURRENT QUIET', 'OXYGEN CHANNEL HOLDING', 'PRESSURE HAZE INDEX', 'DEPTH CHANNEL HOLDING', 'SUBMERGED SIGNAL DRIFT'],
      terra: ['GROUND ECHO LOCAL', 'FIELD STABLE', 'DUST INDEX SHIFT', 'FIELD DUST HOLDING', 'RUIN VISIBILITY VARIANCE', 'SURFACE ROUTE TENSION', 'RUIN SIGNAL HOLDING', 'ASH STATIC LOCAL']
    };
    const pathLines = {
      DOOMED: ['PASSIVE SIGNAL HOLD', 'STATIC DRIFT LOCAL', 'CHANNEL DRIFT: ELEVATED', 'PRESSURE ECHO PASSING', 'VOLATILE CHANNEL DRIFT', 'VOLATILE ECHO PASSING'],
      MERGED: ['CHANNEL STABLE', 'SYNTHETIC FIELD STABLE', 'SYNTHETIC CHANNEL CLEAN', 'DISPLAY CHANNEL CLEAN', 'ECHO ALIGNMENT HOLDING', 'SYNTHETIC ECHO HOLDING']
    };
    const conditionLines = {
      fog_dawn: ['LOW VISIBILITY', 'HORIZON LOSS DETECTED', 'SIGNAL SATURATION RISING'],
      sodium_night: ['INDUSTRIAL FIELD ACTIVE', 'ROUTE EXPOSURE ELEVATED', 'VISUAL CHANNEL STABLE'],
      storm_blackout: ['STORM DISTORTION ACTIVE', 'CHANNEL INSTABILITY RISING', 'EXTRACTION WINDOW NARROWING'],
      signal_echo: ['SIGNAL ECHO ACTIVE', 'ECHO CADENCE LOCAL', 'TELEMETRY REPEAT CONTROLLED'],
      signal_interference: ['SIGNAL INTERFERENCE', 'INTERFERENCE CHANNEL ACTIVE', 'SIGNAL DECAY SLIGHT'],
      unstable_weather: ['UNSTABLE WEATHER', 'WEATHER CHANNEL UNSTEADY', 'DRIFT WINDOW ACTIVE'],
      cold_start: ['COLD START', 'SYSTEM WARMUP LOCAL', 'EXTRACTION SYNC DELAYED'],
      high_contact_risk: ['HIGH CONTACT RISK', 'CONTACT SHADOW LIKELY', 'FIELD PRESENCE WATCH'],
      unstable_cadence: ['UNSTABLE CADENCE', 'CADENCE VARIANCE LOCAL', 'RUNTIME TEMPO SHIFT'],
      impact_pressure: ['IMPACT PRESSURE', 'FORWARD CADENCE UNDER LOAD', 'PRESSURE LINE ACTIVE'],
      neutral: []
    };
    const pressureLines = {
      LOW: ['INTERFERENCE LOW', 'SIGNAL FIELD STABLE'],
      RISING: ['INTERFERENCE RISING', 'CHANNEL PRESSURE BUILDING'],
      ELEVATED: ['CHANNEL PRESSURE ELEVATED', 'SIGNAL FIELD TIGHTENING'],
      CRITICAL: ['CRITICAL INTERFERENCE', 'SIGNAL FIELD UNSTABLE']
    };
    const extractionLines = runtime && runtime.extractionComplete ?
      ['OPERATION COMPLETE', 'EXTRACTION SYNCHRONIZED'] :
      (runtime && runtime.objectiveReady ?
        ['EXFIL SYNCHRONIZING', 'EXTRACTION WINDOW ACTIVE', cadenceFlavor(root, 'extraction_sync', 'HOLD THE CHANNEL')] :
        ['RELAY ALIGNMENT IN PROGRESS', 'CHANNEL NOT READY']);
    const pressure = interferenceBand(runtime ? runtime.interferencePressure : 0);
    const lines = ['FIELD ACCESS STABLE', 'LOCAL CHANNEL ACTIVE', 'PASSIVE SCAN CYCLING', 'DISPLAY CHANNEL HOLDING']
      .concat(runtimeCadenceLines(root))
      .concat(contactPresenceTelemetryLines(root))
      .concat(pressureCurveTelemetryLines(root))
      .concat((condition && condition.telemetry) ? condition.telemetry : [])
      .concat(routeLines[routeId] || routeLines.terra)
      .concat(pathLines[pathKey] || ['SIGNAL VARIANCE: LOW'])
      .concat(conditionLines[conditionId] || conditionLines.neutral)
      .concat(pressureLines[pressure] || pressureLines.LOW)
      .concat((root && root.oohObjectivePresence && root.oohObjectivePresence.attached) ? root.oohObjectivePresence.telemetry : [])
      .concat((root && root.oohExtractionPresence && root.oohExtractionPresence.attached) ? root.oohExtractionPresence.telemetry : [])
      .concat((root && root.oohCharacterPresence && root.oohCharacterPresence.attached) ? root.oohCharacterPresence.telemetry : [])
      .concat((root && root.oohMediaAttachment && root.oohMediaAttachment.attached) ? root.oohMediaAttachment.telemetry : [])
      .concat(extractionLines);

    if (mode === 'combat') {
      return ['LOCAL PREVIEW PULSE', 'CONTACT ECHO OBSERVED', 'SHELL DISPLAY REFRESH'].concat(lines);
    }

    return lines;
  }

  function stopLocalTelemetryPulse(root) {
    if (!root) {
      return;
    }
    if (root.oohTelemetryPulseTimer) {
      window.clearTimeout(root.oohTelemetryPulseTimer);
      root.oohTelemetryPulseTimer = null;
    }
  }

  function readoutHoldActive(root, minimumPriority) {
    if (!root || !root.oohReadoutHoldUntil || Date.now() >= root.oohReadoutHoldUntil) {
      return false;
    }
    return (root.oohReadoutPriority || 0) >= (minimumPriority || 0);
  }

  function holdReadout(root, priority, holdMs) {
    if (!root) {
      return;
    }
    root.oohReadoutPriority = priority || 1;
    root.oohReadoutHoldUntil = Date.now() + (holdMs || 1600);
  }

  function clearReadoutHold(root) {
    if (!root) {
      return;
    }
    root.oohReadoutPriority = 0;
    root.oohReadoutHoldUntil = 0;
  }

  function startLocalTelemetryPulse(root, routeId, pathKey, mode) {
    const readout = root ? root.querySelector('[data-ooh-action-readout]') : null;
    if (!root || !readout) {
      return;
    }

    stopLocalTelemetryPulse(root);
    root.oohTelemetryPulseIndex = 0;

    const tick = function () {
      if (!missionEntryReady(root) || !root.classList.contains('is-mission-active')) {
        stopLocalTelemetryPulse(root);
        return;
      }

      if (!readoutHoldActive(root, 1) && !readout.oohEvolutionFeedbackTimer && !readout.oohEvolutionContinuityTimer) {
        const lines = localTelemetryPulseLines(root, routeId, pathKey, mode);
        if (!lines.length) {
          stopLocalTelemetryPulse(root);
          return;
        }
        readout.textContent = lines[root.oohTelemetryPulseIndex % lines.length];
        if (root.oohTelemetryPulseIndex % 3 === 0) {
          pulseRuntimeCadence(root, 'cadence', 1100);
        }
        root.oohTelemetryPulseIndex += 1;
      }

      root.oohTelemetryPulseTimer = window.setTimeout(
        tick,
        mode === 'combat' ? 5200 : (captureModeActive(root) ? signalIntegrityRuntime.captureTelemetryIntervalMs : 8200)
      );
    };

    root.oohTelemetryPulseTimer = window.setTimeout(
      tick,
      mode === 'combat' ? 1800 : (captureModeActive(root) ? signalIntegrityRuntime.captureTelemetryInitialMs : 4200)
    );
  }

  function nudgeLocalTelemetryPulse(root, message, priority, holdMs) {
    const readout = root ? root.querySelector('[data-ooh-action-readout]') : null;
    const messagePriority = priority || 1;
    if (!readout || readout.oohEvolutionFeedbackTimer || readout.oohEvolutionContinuityTimer) {
      return;
    }
    if (readoutHoldActive(root, messagePriority + 1)) {
      return;
    }
    if (root.oohLocalCadenceTimer && (root.oohReadoutPriority || 0) > messagePriority) {
      return;
    }
    if (root.oohLocalCadenceTimer) {
      clearLocalCadenceBeat(root);
    }
    readout.textContent = message;
    holdReadout(root, messagePriority, holdMs || (messagePriority >= 3 ? 3200 : 2100));
  }

  function clearLocalCadenceBeat(root) {
    if (root && root.oohLocalCadenceTimer) {
      window.clearTimeout(root.oohLocalCadenceTimer);
      root.oohLocalCadenceTimer = null;
    }
    if (root && root.oohLocalCadenceFollowupTimer) {
      window.clearTimeout(root.oohLocalCadenceFollowupTimer);
      root.oohLocalCadenceFollowupTimer = null;
    }
  }

  function showLocalCadenceBeat(root, message, settleText, delay, options) {
    const readout = root ? root.querySelector('[data-ooh-action-readout]') : null;
    if (!root || !readout) {
      return;
    }

    const cadenceOptions = options || {};
    const priority = cadenceOptions.priority || 2;
    if (readoutHoldActive(root, priority + 1)) {
      return;
    }

    clearLocalCadenceBeat(root);
    readout.textContent = message;
    const cadenceDelay = captureModeActive(root) ?
      Math.min(Math.round((delay || 180) * signalIntegrityRuntime.captureCadenceDelayMultiplier), signalIntegrityRuntime.captureCadenceMaxDelay) :
      Math.min(delay || 180, 450);
    holdReadout(root, priority, Math.max(cadenceDelay + 1900, cadenceOptions.holdMs || 2400));
    root.oohLocalCadenceTimer = window.setTimeout(function () {
      readout.textContent = settleText;
      holdReadout(root, priority, cadenceOptions.settleHoldMs || 2400);
      root.oohLocalCadenceTimer = null;
    }, cadenceDelay);
  }

  function sessionEvolutionFeedbackText(root, pathKey, routeId) {
    const observedSignals = root ? root.querySelector('[data-ooh-briefing-field="observedSignals"]') : null;
    const hasAttributeSignals = observedSignals &&
      String(observedSignals.textContent || '').toUpperCase().indexOf('BASELINE DISCIPLINE') === -1;

    if (hasAttributeSignals) {
      return 'CAPABILITY SIGNAL STRENGTHENED // ' + pathKey + ' CHANNEL RESPONSE // ' + routeLabel(routeId).toUpperCase();
    }

    return 'OPERATOR RESPONSE REGISTERED // CHANNEL STABILITY INCREASED // ' + routeLabel(routeId).toUpperCase();
  }

  // Phase 94: session return motivation signal.
  function sessionContinuityText(pathKey) {
    if (pathKey === 'DOOMED') {
      return 'VOLATILE CHANNEL REMAINS AVAILABLE // OPERATOR PROFILE AWAITING NEXT STAGING';
    }
    if (pathKey === 'MERGED') {
      return 'SYNCHRONIZED CHANNEL REMAINS AVAILABLE // OPERATOR PROFILE AWAITING NEXT STAGING';
    }

    return 'SIGNAL REMAINS AVAILABLE // OPERATOR PROFILE AWAITING NEXT STAGING';
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
    if (!missionEntryReady(root) || !root.classList.contains('is-combat-shell') || !button || button.disabled) {
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
    showLocalCadenceBeat(root, 'CONTACT ECHO OBSERVED', 'TELEMETRY REFRESH: LOCAL', 160);
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

  function renderCombatFoundationAudits() {
    const strikeOutput = document.querySelector('[data-ooh-strike-outcome]');
    const strikeButton = document.querySelector('[data-ooh-execute-strike]');

    if (!strikeOutput && !strikeButton) {
      return;
    }

    let auditOutput = document.querySelector('[data-ooh-combat-foundation-audit]');

    if (!auditOutput) {
      auditOutput = document.createElement('pre');
      auditOutput.setAttribute('data-ooh-combat-foundation-audit', 'true');
      auditOutput.className = 'ooh-play__combat-foundation-audit';

      const encounter = document.querySelector('[data-ooh-combat-encounter]');

      if (encounter) {
        encounter.appendChild(auditOutput);
      }
      else {
        const anchor = strikeOutput || strikeButton;
        anchor.insertAdjacentElement('afterend', auditOutput);
      }
    }

    auditOutput.textContent = [
      'PHASE 15 STRIKE AUDIT:',
      '- Engagement state: ENGAGED',
      '- Strike simulation active: YES',
      '- Outcome local only: YES',
      '- Damage system active: NO',
      '- Health system active: NO',
      '- AI system active: NO',
      '',
      'HOSTILE RESPONSE REVIEW:',
      'TARGET RESPONSE LOCKED // NO COUNTERACTION // AI NOT ACTIVE',
      '',
      'COMBAT ROUND STATUS:',
      '- Round initialized: YES',
      '- Player action available: YES',
      '- Enemy action available: NO',
      '- Damage resolution active: NO',
      '- Round progression active: NO',
      '',
      'DAMAGE PREVIEW LOCKED:',
      'POTENTIAL IMPACT: CLASSIFIED // DAMAGE NOT APPLIED // HEALTH SYSTEM INACTIVE',
      '',
      'PHASE 19 COMBAT FOUNDATION COMPLETE:',
      '- Engagement system active: YES',
      '- Strike system active: YES',
      '- Outcome local only: YES',
      '- Damage system active: NO',
      '- Health system active: NO',
      '- AI system active: NO',
      '- Backend combatState modified: NO',
      '- Persistence active: NO'
    ].join('\n');
  }

  function activateCombatShell(root, shell, sceneStatus, routeId, pathKey, missionLabel, combatState) {
    if (!missionEntryReady(root) || !root.classList.contains('is-mission-active')) {
      return;
    }

    const message = 'HOSTILE CONTACT CONFIRMED. COMBAT SHELL PREVIEW ARMED.';
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
    clearLocalCadenceBeat(root);
    showLocalCadenceBeat(root, 'LOCAL PREVIEW PULSE', message + ' Passive inputs remain online.', 280);
    root.oohLocalCadenceFollowupTimer = window.setTimeout(function () {
      showSessionEvolutionFeedback(root, sessionEvolutionFeedbackText(root, pathKey, routeId), message + ' Passive inputs remain online.', sessionContinuityText(pathKey));
      root.oohLocalCadenceFollowupTimer = null;
    }, 300);
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
      gateButton.textContent = 'COMBAT SHELL PREVIEW ARMED';
      gateButton.classList.add('is-combat-armed');
      gateButton.disabled = true;
      gateButton.setAttribute('aria-disabled', 'true');
    }
    if (encounter) {
      encounter.hidden = false;
      encounter.classList.add('is-encounter-visible');
      encounter.setAttribute('data-encounter-state', 'visible');
      applyGeneratedContact(routeId, pathKey, missionLabel);
      syncEncounterState(encounter, combatState);
      enableEncounterActions(encounter);
    }
    startLocalTelemetryPulse(root, routeId, pathKey, 'combat');
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
      status: 'OPERATION ACTIVE',
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
    renderObjectivePresenceLayer(root, hud, root.oohObjectivePresence);
    renderExtractionPresenceLayer(root, hud, root.oohExtractionPresence);
    renderCharacterPresenceLayer(root, hud, root.oohCharacterPresence);
    renderMediaAttachmentLayer(root, hud, root.oohMediaAttachment);
  }

  function activateMission(root, shell, sceneStatus, routeId, pathKey, missionLabel, assembly) {
    if (!missionEntryReady(root)) {
      return false;
    }

    root.classList.add('is-mission-active');
    clearActivationReadyState(root, shell);
    setRuntimeAliveState(root, 'active');
    const operationCondition = applyOperationCondition(root, shell, routeId);
    root.oohActivationSynthesisBias = buildActivateMissionSynthesisBias(root, routeId, pathKey, operationCondition);
    startSignalIntegrityLoop(root);
    if (shell) {
      shell.classList.add('is-mission-active');
      shell.setAttribute('data-mission-state', 'active');
    }
    if (sceneStatus) {
      sceneStatus.textContent = buildActiveSceneStatus(routeId, pathKey, missionLabel);
    }
    activatePlayerPresence(root);
    activateTraversalPressureZone(root);
    activateExtractionObjectiveZone(root);
    activateContactPresence(root);

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
        showLocalCadenceBeat(root, 'FIELD ENTRY CONFIRMED', 'Runtime unstable. Use SCAN, HOLD POSITION, or CHECK SIGNAL.', 120);
      }
      renderMediaAttachmentLayer(root, hud, root.oohMediaAttachment);
      if (root.oohMediaAttachment && root.oohMediaAttachment.attached) {
        showLocalCadenceBeat(root, 'AUDIO IDENTITY LOCKED', activeMediaState(root.oohMediaAttachment) + ' // ' + (root.oohMediaAttachment.cadence || 'AUDIO CADENCE AVAILABLE'), 260);
      }
      syncOperationConditionHud(root);
      if (operationCondition) {
        showLocalCadenceBeat(root, operationCondition.fieldLabel || operationCondition.label, operationCondition.cadenceFlavor, 320);
      }
      showLocalCadenceBeat(root, 'FIELD PRESSURE ACTIVE', (runtimeCadenceLines(root)[3] || 'FIELD DISTORTION MINOR'), 180, { holdMs: 1700, settleHoldMs: 1700 });
      scheduleMovementHint(root);
      startLocalTelemetryPulse(root, routeId, pathKey, 'mission');
      scheduleRuntimeCadenceNudge(root);
    }

    const combatGate = root.querySelector('[data-ooh-combat-gate]');
    if (combatGate) {
      combatGate.hidden = true;
    }

    const combatGateButton = root.querySelector('[data-ooh-combat-gate-button]');
    if (combatGateButton) {
      combatGateButton.disabled = true;
      combatGateButton.setAttribute('aria-disabled', 'true');
      if (combatGateButton.nextElementSibling) {
        combatGateButton.nextElementSibling.textContent = 'Combat systems standing by outside proof capture.';
      }
    }

    return true;
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
    const promptLabel = selectedPrompt ? (selectedPrompt.title || selectedPrompt.id || 'Sealed source') : 'Sealed source';

    return [
      'OPERATION ALPHA MODE // HOSTILE RUNTIME ACCESS',
      'Enter field: ' + routeLabel(routeId) + ' // ' + missionLabel + ' // ' + pathLabel + '.',
      'Active loop: SCAN / HOLD / SIGNAL under rising interference.',
      'Human trace: ' + recruiterName + ' remains intermittent. Playlist pressure: ' + playlistLabel + '.',
      'Full narrative source preserved: ' + promptLabel + '. Sealed from fast runtime display.'
    ].join('\n');
  }

  function renderMissionPayload(root, payload, missionUuid, payloadAudit, hydrationMeta) {
    root.setAttribute('data-ooh-payload-status', 'valid');
    suppressVisibleDebugOutput(root);
    if (missionUuid) {
      root.setAttribute('data-ooh-mission-uuid', missionUuid);
    }

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
    const mediaAttachment = buildMediaAttachmentContext(payload, assembly);
    const characterPresence = buildCharacterPresenceContext(payload);
    const pathKey = recruiterPathKey(payload);
    const evolutionPreview = buildOperatorEvolutionPreview(payload, routeId, pathKey);
    const missionLabel = payloadAudit.missingFields.indexOf('mission') === -1 ? itemLabel(payload.mission, payload.missionType || 'Unconfirmed') : 'MISSION // UNCONFIRMED';
    const objectivePresence = buildObjectivePresenceContext(assembly, missionLabel);
    const extractionPresence = buildExtractionPresenceContext(assembly);
    const combatState = createCombatState();
    root.oohRuntimeSynthesisPayload = payload;
    root.oohObjectivePresence = objectivePresence;
    root.setAttribute('data-ooh-objective-present', objectivePresence.attached ? 'true' : 'false');
    root.oohExtractionPresence = extractionPresence;
    root.setAttribute('data-ooh-extraction-present', extractionPresence.attached ? 'true' : 'false');
    root.oohCharacterPresence = characterPresence;
    root.setAttribute('data-ooh-character-present', characterPresence.attached ? 'true' : 'false');
    root.oohMediaAttachment = mediaAttachment;
    root.setAttribute('data-ooh-media-attached', mediaAttachment.attached ? 'true' : 'false');
    ensureCaptureModeToggle(root);

    if (shell) {
      shell.setAttribute('data-route', routeAttribute(routeId));
      shell.setAttribute('data-path', pathKey);
      shell.setAttribute('data-mission-type', missionTypeAttribute(payload));
      shell.setAttribute('data-playlist-mood', playlistMoodAttribute(payload));
      if (payload.playlist) {
        shell.setAttribute('data-playlist-id', cleanId(payload.playlist.id || payload.playlist.label, 'playlist'));
        shell.setAttribute('data-playlist-label', itemLabel(payload.playlist, 'Unselected'));
      }
      shell.setAttribute('data-prompt-block', selectedPrompt ? (selectedPrompt.id || 'prompt_block') : 'unavailable');
      if (missionUuid) {
        shell.setAttribute('data-ooh-mission-uuid', missionUuid);
      }
      bindSceneAssets(shell, routeId);
    }

    if (routeHeader) {
      routeHeader.textContent = scene.label + ' // ' + scene.location;
    }

    if (sceneMissionLabel) {
      sceneMissionLabel.textContent = 'MISSION TYPE // ' + missionLabel.toUpperCase();
    }

    if (sceneStatus) {
      sceneStatus.textContent = 'FIELD STAGED // ENTER FIELD // SCAN / HOLD / SIGNAL' + (payloadAudit.routeFallbackUsed ? ' // ROUTE FALLBACK: TERRA' : '');
    }

    if (activateButton) {
      setActivationReadyState(root, shell, activateButton);
      window.setTimeout(function () {
        focusActivationEntry(root);
      }, 160);
      activateButton.addEventListener('click', function () {
        if (activateMission(root, shell, sceneStatus, routeId, pathKey, missionLabel, assembly)) {
          window.setTimeout(function () {
            scrollToMissionBriefing(root);
            window.setTimeout(function () {
              alignPlayerPresenceToViewport(root);
            }, 80);
          }, 60);
        }
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
      const movement = playerMovementKeys[key];
      if (movement && movePlayerPresence(root, movement)) {
        event.preventDefault();
        return;
      }

      const action = key === 'h' ? 'hold' : (key === 'c' ? 'signal' : '');
      if (action) {
        triggerPassiveAction(root, shell, action, routeId, pathKey);
      }
    });

    const fields = {
      route: routeLabel(routeId),
      mission: missionLabel,
      path: payloadAudit.missingFields.indexOf('path') === -1 ? itemLabel(payload.path, 'Unconfirmed') : 'PATH // UNCONFIRMED',
      operatorEvolution: evolutionPreview.operatorEvolution,
      pathResonance: evolutionPreview.pathResonance,
      channelStability: evolutionPreview.channelStability,
      observedSignals: evolutionPreview.observedSignals,
      recruiter: [recruiter.name || ((payload.character || {}).recruiterName), recruiter.title || ((payload.character || {}).recruiterTitle)].filter(Boolean).join(' / ') || 'Unassigned',
      playlist: payloadAudit.missingFields.indexOf('playlist') === -1 ? itemLabel(payload.playlist, 'Unselected') : 'PLAYLIST // UNCONFIRMED',
      prompt: selectedPrompt ? 'Sealed mission source' : 'Sealed'
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
      debugEl.textContent = '';
      debugEl.hidden = true;
      debugEl.setAttribute('aria-hidden', 'true');
    }
  }

  Drupal.behaviors.oohPlayBriefing = {
    attach: function (context) {
      once('ooh-play-briefing', '[data-ooh-play]', context).forEach(function (root) {
        resetPlayerPresence(root);
        window.addEventListener('resize', function () {
          clampPlayerPresence(root);
        });

        // Hydrate the /play scene from the Dossier payload stored before routing.
        const storedState = readStoredState();
        const payload = normalizePayloadSnapshot(storedState.payload || {});
        const missionUuid = typeof storedState.serverMissionUuid === 'string' ? storedState.serverMissionUuid : '';
        const payloadAudit = auditPayload(payload);
        const playSettings = (((drupalSettings || {}).ooh_outskirts || {}).play) || {};
        const dossierTarget = (((playSettings.urls || {}).dossierTarget) || '').trim();
        if (payloadAudit.payloadStatus !== 'VALID') {
          if (!missionUuid) {
            recoverIncompletePayload(root, payloadAudit, dossierTarget);
            return;
          }

          lookupMissionPayload(missionUuid).then(function (missionData) {
            const hydratedPayload = normalizePayloadSnapshot(missionData.payload || {});
            const hydratedAudit = auditPayload(hydratedPayload);
            if (hydratedAudit.payloadStatus !== 'VALID') {
              recoverIncompletePayload(root, hydratedAudit, dossierTarget);
              return;
            }
            renderMissionPayload(root, hydratedPayload, missionData.missionUuid || missionUuid, hydratedAudit, {
              payloadUuid: missionData.payloadUuid || '',
              lifecycleState: missionData.lifecycleState || '',
              hydrationSource: 'mission_lookup'
            });
          }).catch(function () {
            recoverIncompletePayload(root, payloadAudit, dossierTarget);
          });
          return;
        }
        renderMissionPayload(root, payload, missionUuid, payloadAudit, null);
      });
    }
  };
})(Drupal, once, drupalSettings);
