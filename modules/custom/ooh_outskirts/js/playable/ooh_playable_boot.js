import { BOOT_STATES, logPlayable, normalizeMissionPayload, readable } from './core/AssetManifest.js';
import { LevelDefinitionRegistry } from './levels/LevelDefinitionRegistry.js';
import { RendererAdapter } from './render/RendererAdapter.js';

const Drupal = window.Drupal;
const once = window.once;
const drupalSettings = window.drupalSettings || {};

function drupalPath(path) {
  if (Drupal && typeof Drupal.url === 'function') {
    return Drupal.url(path);
  }
  const baseUrl = ((((drupalSettings || {}).path || {}).baseUrl) || '/');
  return baseUrl.replace(/\/$/, '') + '/' + String(path || '').replace(/^\//, '');
}

function csrfToken() {
  return fetch(drupalPath('session/token'), { credentials: 'same-origin' }).then((response) => {
    if (!response.ok) {
      throw new Error('CSRF token request failed.');
    }
    return response.text();
  });
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  }
  catch (error) {
    return fallback;
  }
}

function readStoredState(stateKey) {
  try {
    return safeJsonParse(window.localStorage.getItem(stateKey), {}) || {};
  }
  catch (error) {
    logPlayable('warn', 'Unable to read Dossier continuity state.', error.message);
    return {};
  }
}

function lookupMissionPayload(missionUuid, lookupPath) {
  return csrfToken().then((token) => fetch(drupalPath(lookupPath), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    body: JSON.stringify({ missionUuid })
  })).then((response) => response.json().then((data) => {
    if (!response.ok || !data || data.success !== true || !data.payload) {
      throw new Error((data && data.error) || 'Mission lookup failed.');
    }
    return data;
  }));
}

function validMissionUuid(value) {
  return /^[a-f0-9-]{36}$/i.test(String(value || '').trim());
}

function safeLevelId(value) {
  const levelId = String(value || '').trim().toLowerCase();
  return /^[a-z0-9_]+$/.test(levelId) ? levelId : '';
}

function buildLevelMeta(rawQueryLevelId, payload = null, payloadAvailable = false, lookupSucceeded = false, mappingUnavailableReason = '') {
  const rawRequestedLevelId = String(rawQueryLevelId || '').trim();
  const queryLevelId = safeLevelId(rawRequestedLevelId);
  const payloadResolution = payloadAvailable ? LevelDefinitionRegistry.resolvePayload(payload || {}) : null;
  const missionDerivedLevelId = payloadResolution && payloadResolution.mapped ? payloadResolution.missionDerivedLevelId : '';
  let requestedLevelId = '';
  let resolutionSource = 'safe_default';
  let fallbackStatus = 'safe_default';

  if (missionDerivedLevelId) {
    requestedLevelId = missionDerivedLevelId;
    resolutionSource = 'mission_payload';
    fallbackStatus = queryLevelId && queryLevelId !== missionDerivedLevelId ? 'query_level_ignored' : 'no_fallback';
  }
  else if (queryLevelId) {
    requestedLevelId = queryLevelId;
    resolutionSource = 'development_query_fallback';
    fallbackStatus = payloadAvailable ? 'mission_mapping_unresolved' : (mappingUnavailableReason || (lookupSucceeded ? 'payload_unavailable' : 'mission_lookup_unavailable'));
  }

  return Object.freeze({
    requestedLevelId,
    rawRequestedLevelId,
    queryLevelId,
    missionDerivedLevelId,
    resolutionSource,
    fallbackStatus,
    mapping: payloadResolution || Object.freeze({
      mapped: false,
      missionDerivedLevelId: '',
      matchedField: '',
      matchedValue: '',
      reason: mappingUnavailableReason || (lookupSucceeded ? 'payload_unavailable' : 'mission_lookup_unavailable'),
      identity: Object.freeze({})
    })
  });
}

function bootstrapWithLevel(normalizedPayload, levelMeta) {
  const mapping = levelMeta.mapping || {};
  const runtimeMissionContext = Object.freeze({
    identity: Object.freeze({
      ...((normalizedPayload.identity || {})),
      ...((mapping.identity || {})),
      missionUuid: normalizedPayload.missionUuid || (normalizedPayload.identity || {}).missionUuid || ''
    }),
    presentation: Object.freeze({
      missionTitle: normalizedPayload.missionTitle || (normalizedPayload.presentation || {}).missionTitle || 'Mission unavailable',
      recruiter: normalizedPayload.recruiter || (normalizedPayload.presentation || {}).recruiter || 'Unassigned',
      playlist: normalizedPayload.playlist || (normalizedPayload.presentation || {}).playlist || 'Unlinked'
    }),
    level: levelMeta,
    resolution: Object.freeze({
      source: levelMeta.resolutionSource,
      fallbackStatus: levelMeta.fallbackStatus,
      requestedLevelId: levelMeta.requestedLevelId,
      missionDerivedLevelId: levelMeta.missionDerivedLevelId
    }),
    debug: normalizedPayload.debug || Object.freeze({})
  });

  return {
    ...normalizedPayload,
    requestedLevelId: levelMeta.requestedLevelId,
    rawRequestedLevelId: levelMeta.rawRequestedLevelId,
    runtimeMissionContext,
    level: levelMeta
  };
}

function hydrateBootstrap(settings) {
  const queryMissionUuid = validMissionUuid(settings.queryMissionUuid) ? settings.queryMissionUuid : '';
  const missionUuid = queryMissionUuid;
  const lookupPath = (((settings.urls || {}).missionLookup) || 'ooh/mission-lookup').trim();
  if (missionUuid) {
    return lookupMissionPayload(missionUuid, lookupPath).then((missionData) => {
      const normalized = normalizeMissionPayload(missionData.payload, {
        route: settings.route || '/play/mission',
        missionUuid: missionData.missionUuid || missionUuid,
        schemaVersion: settings.schemaVersion || '',
        source: queryMissionUuid ? 'query_mission_lookup' : 'local_storage_mission_lookup',
        payloadUuid: missionData.payloadUuid || '',
        lifecycleState: missionData.lifecycleState || ''
      });
      return bootstrapWithLevel(normalized, buildLevelMeta(settings.queryLevelId, missionData.payload, normalized.payloadAvailable, true));
    }).catch((error) => {
      logPlayable('warn', 'Mission lookup unavailable; falling back to development level selection.', error.message);
      const normalized = normalizeMissionPayload(null, {
        route: settings.route || '/play/mission',
        missionUuid,
        schemaVersion: settings.schemaVersion || '',
        source: 'mission_lookup_failed'
      });
      return bootstrapWithLevel(normalized, buildLevelMeta(settings.queryLevelId, null, false, false));
    });
  }

  if (settings.queryLevelId) {
    const normalized = normalizeMissionPayload(null, {
      route: settings.route || '/play/mission',
      schemaVersion: settings.schemaVersion || '',
      source: 'no_mission_context'
    });
    return Promise.resolve(bootstrapWithLevel(normalized, buildLevelMeta(settings.queryLevelId, null, false, false, 'mission_mapping_unresolved')));
  }

  const normalized = normalizeMissionPayload(null, {
    route: settings.route || '/play/mission',
    schemaVersion: settings.schemaVersion || '',
    source: 'no_payload'
  });
  return Promise.resolve(bootstrapWithLevel(normalized, buildLevelMeta(settings.queryLevelId, null, false, false)));
}

function setText(root, selector, value) {
  const el = root.querySelector(selector);
  if (el && el.textContent !== value) {
    el.textContent = value;
  }
}

function setState(root, key, value) {
  setText(root, '[data-ooh-playable-state="' + key + '"]', value);
}

function setPrimary(root, state, message) {
  setText(root, '[data-ooh-playable-primary-state]', state);
  setText(root, '[data-ooh-playable-message]', message);
}

function renderBootstrap(root, bootstrap) {
  setText(root, '[data-ooh-playable-field="missionTitle"]', readable(bootstrap.missionTitle, 'Mission unavailable'));
  setText(root, '[data-ooh-playable-field="campaignRoute"]', readable(bootstrap.campaignRoute, 'Unknown'));
  setText(root, '[data-ooh-playable-field="recruiter"]', readable(bootstrap.recruiter, 'Unassigned'));
  setText(root, '[data-ooh-playable-field="playlist"]', readable(bootstrap.playlist, 'Unlinked'));
  const source = readable((bootstrap.debug || {}).source, 'unknown');
  const version = readable((bootstrap.debug || {}).payloadVersion, 'unversioned');
  const missing = ((bootstrap.debug || {}).missingFields || []).join(', ');
  const diagnostic = bootstrap.payloadAvailable ?
    'Payload source: ' + source + ' // version: ' + version :
    'Payload unavailable. Missing: ' + (missing || 'mission payload') + '. Loading development-safe level metadata only.';
  setText(root, '[data-ooh-playable-diagnostic]', diagnostic);
}

function initializePlayable(root) {
  if (root.oohPlayableRuntime) {
    return;
  }

  const settings = (((drupalSettings || {}).ooh_outskirts || {}).playableMission) || {};
  const viewport = root.querySelector('[data-ooh-playable-viewport]');
  const enterButton = root.querySelector('[data-ooh-playable-enter]');
  const pauseButton = root.querySelector('[data-ooh-playable-pause]');
  const restartButton = root.querySelector('[data-ooh-playable-restart]');
  let renderer = null;
  let destroyed = false;

  const runtime = {
    destroy() {
      destroyed = true;
      enterButton?.removeEventListener('click', enterHandler);
      pauseButton?.removeEventListener('click', pauseHandler);
      restartButton?.removeEventListener('click', restartHandler);
      renderer?.destroy();
      renderer = null;
      delete root.oohPlayableRuntime;
    }
  };

  const enterHandler = () => {
    try {
      if (renderer) {
        renderer.enter();
      }
    }
    catch (error) {
      setState(root, 'renderer', BOOT_STATES.RENDERER_FAILED);
      setPrimary(root, BOOT_STATES.RENDERER_FAILED, error.message || 'Unable to enter test field.');
      logPlayable('error', 'Unable to enter test field.', error);
    }
  };

  const pauseHandler = () => {
    if (renderer) {
      renderer.pause();
    }
  };

  const restartHandler = () => {
    if (renderer) {
      renderer.restartMission();
    }
  };

  root.oohPlayableRuntime = runtime;

  setState(root, 'boot', BOOT_STATES.BOOTING);
  setPrimary(root, BOOT_STATES.BOOTING, 'Recovering Dossier mission payload.');

  hydrateBootstrap(settings).then((bootstrap) => {
    if (destroyed) {
      return;
    }
    renderBootstrap(root, bootstrap);

    setState(root, 'payload', bootstrap.payloadAvailable ? BOOT_STATES.PAYLOAD_READY : BOOT_STATES.PAYLOAD_UNAVAILABLE);
    setPrimary(root, bootstrap.payloadAvailable ? BOOT_STATES.PAYLOAD_READY : BOOT_STATES.PAYLOAD_UNAVAILABLE, bootstrap.payloadAvailable ? 'Mission payload recovered. Initializing WebGL renderer.' : 'No valid mission payload is available. Initializing selected test level.');
    if (!bootstrap.payloadAvailable) {
      logPlayable('warn', 'Payload unavailable for playable route; loading selected test level.', bootstrap.debug || {});
    }

    renderer = new RendererAdapter(root, viewport, bootstrap, {
      onRendererState: (state) => {
        setState(root, 'renderer', state);
        setPrimary(root, state, 'WebGL test scene is ready.');
        if (enterButton) {
          enterButton.disabled = false;
          enterButton.setAttribute('aria-disabled', 'false');
        }
      },
      onFieldState: (state) => {
        setState(root, 'field', state);
        setPrimary(root, state, state === BOOT_STATES.TEST_FIELD_ACTIVE ? 'Pointer field active. Press Escape to pause.' : 'Test field paused. Click Enter Test Field to resume.');
        if (pauseButton) {
          const active = state === BOOT_STATES.TEST_FIELD_ACTIVE;
          pauseButton.disabled = !active;
          pauseButton.setAttribute('aria-disabled', active ? 'false' : 'true');
        }
        if (restartButton) {
          restartButton.disabled = false;
          restartButton.setAttribute('aria-disabled', 'false');
        }
      }
    });
    renderer.initialize();
  }).catch((error) => {
    if (destroyed) {
      return;
    }
    setState(root, 'payload', BOOT_STATES.PAYLOAD_UNAVAILABLE);
    setPrimary(root, BOOT_STATES.PAYLOAD_UNAVAILABLE, 'Mission payload hydration failed.');
    setText(root, '[data-ooh-playable-diagnostic]', error.message || 'Mission payload hydration failed.');
    logPlayable('error', 'Playable mission boot failed.', error);
  });

  enterButton?.addEventListener('click', enterHandler);
  pauseButton?.addEventListener('click', pauseHandler);
  restartButton?.addEventListener('click', restartHandler);
}

if (Drupal && once) {
  Drupal.behaviors.oohPlayableMission = {
    attach(context) {
      once('ooh-playable-mission', '[data-ooh-playable-mission]', context).forEach(initializePlayable);
    },
    detach(context, settings, trigger) {
      if (trigger !== 'unload') {
        return;
      }
      const roots = [];
      if (context.matches?.('[data-ooh-playable-mission]')) {
        roots.push(context);
      }
      context.querySelectorAll?.('[data-ooh-playable-mission]').forEach((root) => roots.push(root));
      roots.forEach((root) => {
        root.oohPlayableRuntime?.destroy();
      });
    }
  };
}
else {
  logPlayable('error', 'Drupal behavior dependencies are unavailable.');
}
