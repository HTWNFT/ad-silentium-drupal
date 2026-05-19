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

  function auditPayload(payload) {
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
      debugEl.textContent = JSON.stringify({
        payloadStatus: payloadAudit.payloadStatus,
        missingFields: payloadAudit.missingFields,
        recoveryTarget: resolvedDossierTarget || '/dossier'
      }, null, 2);
    }
  }

  function missionEntryReady(root) {
    return Boolean(root && root.getAttribute('data-ooh-payload-status') === 'valid');
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
      readout: 'Extraction readiness visible. No extraction order has been issued.'
    },
    lost: {
      state: 'SIGNAL LOST',
      signalIntegrity: 'LOST',
      objectiveStatus: 'INTERRUPTED',
      interferencePressure: 'MAXIMUM',
      extractionReadiness: 'UNAVAILABLE',
      readout: 'Signal lost. Runtime shell holds presentation state only.'
    },
    complete: {
      state: 'OPERATION COMPLETE',
      signalIntegrity: 'ARCHIVED',
      objectiveStatus: 'COMPLETE',
      interferencePressure: 'CLEARED',
      extractionReadiness: 'CLOSED',
      readout: 'Operation complete. Result authority remains offline.'
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
    baseDecay: 1.4,
    cushionDecay: 0.35,
    holdRestore: 8,
    holdMs: 4500,
    objectiveInitial: 0,
    objectiveThreshold: 60,
    objectiveRate: 0.85,
    interferenceInitial: 0,
    interferenceRate: 1.15,
    interferenceDecayFactor: 0.55,
    scanAwarenessMs: 3500,
    extractionInitial: 0,
    extractionRate: 7.5,
    extractionCriticalRate: 4.25
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
        extractionProgress: signalIntegrityRuntime.extractionInitial,
        extractionComplete: false,
        extractionAnnounced: false,
        interferencePressure: signalIntegrityRuntime.interferenceInitial,
        scanAwarenessUntil: 0,
        cushionUntil: 0,
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
      LOW: 'SCAN RETURNED. Interference low. Signal field stable.',
      RISING: 'SCAN RETURNED. INTERFERENCE RISING. Channel pressure increasing.',
      ELEVATED: 'SCAN RETURNED. CHANNEL PRESSURE ELEVATED. Maintain signal hold discipline.',
      CRITICAL: 'SCAN RETURNED. CRITICAL INTERFERENCE. Signal field unstable.'
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

    runtime.interferencePressure = Math.min(100, runtime.interferencePressure + signalIntegrityRuntime.interferenceRate);
  }

  function signalDecayAmount(root, cushioned) {
    const runtime = signalRuntime(root);
    const pressure = runtime ? Math.max(0, Math.min(100, runtime.interferencePressure)) : 0;
    const scanAware = runtime && runtime.scanAwarenessUntil && Date.now() < runtime.scanAwarenessUntil;
    const baseDecay = cushioned ? signalIntegrityRuntime.cushionDecay : signalIntegrityRuntime.baseDecay;
    const pressureFactor = scanAware ? signalIntegrityRuntime.interferenceDecayFactor * 0.55 : signalIntegrityRuntime.interferenceDecayFactor;
    return baseDecay + ((pressure / 100) * pressureFactor);
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

  function advanceObjectiveProgress(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || runtime.objectiveReady) {
      return;
    }

    runtime.objectiveProgress = Math.min(signalIntegrityRuntime.objectiveThreshold, runtime.objectiveProgress + signalIntegrityRuntime.objectiveRate);
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

  function extractionSyncRate(root) {
    const runtime = signalRuntime(root);
    return interferenceBand(runtime ? runtime.interferencePressure : 0) === 'CRITICAL' ?
      signalIntegrityRuntime.extractionCriticalRate :
      signalIntegrityRuntime.extractionRate;
  }

  function completeExtractionSync(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || runtime.extractionComplete) {
      return;
    }

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
    showLocalCadenceBeat(root, 'EXTRACTION SYNCHRONIZED', cadenceFlavor(root, 'operation_complete', 'Operation complete. Runtime loop sealed.'), 240);
  }

  function advanceExtractionSync(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || runtime.extractionComplete || !runtime.objectiveReady) {
      return;
    }

    runtime.extractionProgress = Math.min(100, runtime.extractionProgress + extractionSyncRate(root));
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

    if (root) {
      root.oohSignalRuntime = null;
    }
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
  }

  function tickSignalIntegrity(root) {
    const runtime = signalRuntime(root);
    if (!runtime || runtime.lost || !root.classList.contains('is-mission-active')) {
      stopSignalIntegrityLoop(root);
      return;
    }

    advanceInterferencePressure(root);
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

  function startSignalIntegrityLoop(root) {
    clearSignalIntegrityRuntime(root);
    const runtime = signalRuntime(root);
    runtime.integrity = signalIntegrityRuntime.initial;
    runtime.objectiveProgress = signalIntegrityRuntime.objectiveInitial;
    runtime.objectiveReady = false;
    runtime.objectiveAnnounced = false;
    runtime.extractionProgress = signalIntegrityRuntime.extractionInitial;
    runtime.extractionComplete = false;
    runtime.extractionAnnounced = false;
    runtime.interferencePressure = signalIntegrityRuntime.interferenceInitial;
    runtime.scanAwarenessUntil = 0;
    runtime.cushionUntil = 0;
    runtime.degradedAnnounced = false;
    runtime.lost = false;
    syncSignalIntegrityHud(root, 'active', cadenceFlavor(root, 'initialization', 'Operation active. Signal integrity at 100%. Relay alignment in progress.'));
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
    if (runtime.integrity >= signalIntegrityRuntime.degradedThreshold) {
      runtime.degradedAnnounced = false;
    }
    syncSignalIntegrityHud(root, signalIntegrityStateKey(root) === 'degraded' ? 'degraded' : 'pressure', 'SIGNAL HOLD. Channel stabilized. Runtime cohesion cushioned.');
    showLocalCadenceBeat(root, 'CHANNEL STABILIZED', cadenceFlavor(root, 'stabilization', 'Signal hold active. Decay temporarily cushioned.'), 220);
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
    if (readout) {
      readout.textContent = readoutOverride || state.readout;
    }
  }

  function resetMissionRuntime(root) {
    const shell = root.querySelector('[data-ooh-scene-shell]');
    const hud = root.querySelector('[data-ooh-active-hud]');
    const combatGate = root.querySelector('[data-ooh-combat-gate]');
    const combatGateButton = root.querySelector('[data-ooh-combat-gate-button]');
    const encounter = root.querySelector('[data-ooh-combat-encounter]');

    stopLocalTelemetryPulse(root);
    clearLocalCadenceBeat(root);
    clearSignalIntegrityRuntime(root);
    setOperationalRuntimeState(root, 'standby');
    root.classList.remove('is-mission-active', 'is-combat-shell');
    if (shell) {
      shell.classList.remove('is-mission-active', 'is-combat-shell', 'is-combat-armed');
      shell.removeAttribute('data-mission-state');
      shell.removeAttribute('data-combat-state');
      shell.removeAttribute('data-ooh-operation-condition');
      shell.removeAttribute('data-ooh-condition-intensity');
    }
    root.removeAttribute('data-ooh-operation-condition');
    root.removeAttribute('data-ooh-condition-intensity');
    root.oohOperationCondition = null;
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
      routeAffinity: ['aer', 'mare'],
      paletteBias: 'pale cyan haze',
      cadenceFlavor: 'Fog saturation softens the route. Maintain clean telemetry.',
      launchPriority: 3
    },
    {
      id: 'sodium_night',
      label: 'SODIUM-VAPOR NIGHT',
      routeAffinity: ['terra'],
      paletteBias: 'amber black industrial field',
      cadenceFlavor: 'Sodium field active. Hard silhouettes on the route.',
      launchPriority: 3
    },
    {
      id: 'storm_blackout',
      label: 'STORM DISTORTION',
      routeAffinity: ['aer', 'terra'],
      paletteBias: 'cold blackout pressure',
      cadenceFlavor: 'Storm distortion present. Signal field must remain disciplined.',
      launchPriority: 2
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

  function resolveOperationCondition(routeId) {
    const routeKey = ['aer', 'mare', 'terra'].indexOf(routeId) !== -1 ? routeId : 'terra';
    const routeConditions = operationConditions.filter(function (condition) {
      return condition.routeAffinity.indexOf(routeKey) !== -1;
    });

    return weightedConditionPick(routeConditions.length ? routeConditions : operationConditions);
  }

  function applyOperationCondition(root, shell, routeId) {
    const condition = resolveOperationCondition(routeId);
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
      telemetry.textContent = condition.label;
    }
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
    if (!missionEntryReady(root) || !root.classList.contains('is-mission-active')) {
      return;
    }

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
    nudgeLocalTelemetryPulse(root, 'TELEMETRY REFRESH: LOCAL');

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
    const lines = ['PAYLOAD ECHO STABLE', 'LOCAL CHANNEL NORMAL', 'PASSIVE SCAN CYCLING', 'DISPLAY CHANNEL HOLDING']
      .concat(routeLines[routeId] || routeLines.terra)
      .concat(pathLines[pathKey] || ['SIGNAL VARIANCE: LOW'])
      .concat(conditionLines[conditionId] || conditionLines.neutral)
      .concat(pressureLines[pressure] || pressureLines.LOW)
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

      if (!readout.oohEvolutionFeedbackTimer && !readout.oohEvolutionContinuityTimer) {
        const lines = localTelemetryPulseLines(root, routeId, pathKey, mode);
        if (!lines.length) {
          stopLocalTelemetryPulse(root);
          return;
        }
        readout.textContent = lines[root.oohTelemetryPulseIndex % lines.length];
        root.oohTelemetryPulseIndex += 1;
      }

      root.oohTelemetryPulseTimer = window.setTimeout(tick, mode === 'combat' ? 5200 : 6800);
    };

    root.oohTelemetryPulseTimer = window.setTimeout(tick, mode === 'combat' ? 1800 : 3200);
  }

  function nudgeLocalTelemetryPulse(root, message) {
    const readout = root ? root.querySelector('[data-ooh-action-readout]') : null;
    if (!readout || readout.oohEvolutionFeedbackTimer || readout.oohEvolutionContinuityTimer) {
      return;
    }
    readout.textContent = message;
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

  function showLocalCadenceBeat(root, message, settleText, delay) {
    const readout = root ? root.querySelector('[data-ooh-action-readout]') : null;
    if (!root || !readout) {
      return;
    }

    clearLocalCadenceBeat(root);
    readout.textContent = message;
    root.oohLocalCadenceTimer = window.setTimeout(function () {
      readout.textContent = settleText;
      root.oohLocalCadenceTimer = null;
    }, Math.min(delay || 180, 450));
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
  }

  function activateMission(root, shell, sceneStatus, routeId, pathKey, missionLabel, assembly) {
    if (!missionEntryReady(root)) {
      return false;
    }

    root.classList.add('is-mission-active');
    const operationCondition = applyOperationCondition(root, shell, routeId);
    startSignalIntegrityLoop(root);
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
        showLocalCadenceBeat(root, 'PAYLOAD ECHO STABLE', 'Passive inputs online. Awaiting SCAN, HOLD POSITION, or CHECK SIGNAL.', 220);
      }
      syncOperationConditionHud(root);
      if (operationCondition) {
        showLocalCadenceBeat(root, operationCondition.label, operationCondition.cadenceFlavor, 320);
      }
      startLocalTelemetryPulse(root, routeId, pathKey, 'mission');
    }

    const combatGate = root.querySelector('[data-ooh-combat-gate]');
    if (combatGate) {
      combatGate.hidden = false;
    }

    const combatGateButton = root.querySelector('[data-ooh-combat-gate-button]');
    if (combatGateButton) {
      combatGateButton.disabled = false;
      combatGateButton.setAttribute('aria-disabled', 'false');
      if (combatGateButton.nextElementSibling) {
        combatGateButton.nextElementSibling.textContent = 'Combat systems standing by.';
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

  function renderMissionPayload(root, payload, missionUuid, payloadAudit, hydrationMeta) {
    root.setAttribute('data-ooh-payload-status', 'valid');
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
    const pathKey = recruiterPathKey(payload);
    const evolutionPreview = buildOperatorEvolutionPreview(payload, routeId, pathKey);
    const missionLabel = payloadAudit.missingFields.indexOf('mission') === -1 ? itemLabel(payload.mission, payload.missionType || 'Unconfirmed') : 'MISSION // UNCONFIRMED';
    const combatState = createCombatState();

    if (shell) {
      shell.setAttribute('data-route', routeAttribute(routeId));
      shell.setAttribute('data-path', pathKey);
      shell.setAttribute('data-mission-type', missionTypeAttribute(payload));
      shell.setAttribute('data-playlist-mood', playlistMoodAttribute(payload));
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
      sceneStatus.textContent = 'MISSION STAGED // PAYLOAD STAGED // AWAITING ACTIVATION' + (payloadAudit.routeFallbackUsed ? ' // ROUTE FALLBACK: TERRA' : '');
    }

    if (activateButton) {
      activateButton.addEventListener('click', function () {
        if (activateMission(root, shell, sceneStatus, routeId, pathKey, missionLabel, assembly)) {
          window.setTimeout(function () {
            scrollToMissionBriefing(root);
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
      const action = key === 's' ? 'scan' : (key === 'h' ? 'hold' : (key === 'c' ? 'signal' : ''));
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
      const debugPayload = {
        payloadStatus: payloadAudit.payloadStatus,
        missingFields: payloadAudit.missingFields,
        routeFallbackUsed: payloadAudit.routeFallbackUsed,
        missionUuid: missionUuid,
        payload: payload,
        selectedPrompt: selectedPrompt,
        missionAssembly: assembly
      };
      if (hydrationMeta && hydrationMeta.payloadUuid) {
        debugPayload.payloadUuid = hydrationMeta.payloadUuid;
      }
      if (hydrationMeta && hydrationMeta.lifecycleState) {
        debugPayload.lifecycleState = hydrationMeta.lifecycleState;
      }
      if (hydrationMeta && hydrationMeta.hydrationSource) {
        debugPayload.hydrationSource = hydrationMeta.hydrationSource;
      }
      debugEl.textContent = JSON.stringify(debugPayload, null, 2);
    }
  }

  Drupal.behaviors.oohPlayBriefing = {
    attach: function (context) {
      once('ooh-play-briefing', '[data-ooh-play]', context).forEach(function (root) {
        // Hydrate the /play scene from the Dossier payload stored before routing.
        const storedState = readStoredState();
        const payload = storedState.payload || {};
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
            const hydratedPayload = missionData.payload || {};
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
