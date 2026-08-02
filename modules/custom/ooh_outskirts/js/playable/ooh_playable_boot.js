import { BOOT_STATES, logPlayable, normalizeMissionPayload, readable } from './core/AssetManifest.js';
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

function hydrateBootstrap(settings) {
  const stateKey = settings.stateKey || 'ooh_game_generator_state_v1';
  const storedState = readStoredState(stateKey);
  const storedMissionUuid = validMissionUuid(storedState.serverMissionUuid) ? storedState.serverMissionUuid : '';
  const queryMissionUuid = validMissionUuid(settings.queryMissionUuid) ? settings.queryMissionUuid : '';
  const missionUuid = queryMissionUuid || storedMissionUuid;
  const lookupPath = (((settings.urls || {}).missionLookup) || 'ooh/mission-lookup').trim();

  if (missionUuid) {
    return lookupMissionPayload(missionUuid, lookupPath).then((missionData) => normalizeMissionPayload(missionData.payload, {
      route: settings.route || '/play/mission',
      missionUuid: missionData.missionUuid || missionUuid,
      schemaVersion: settings.schemaVersion || '',
      source: queryMissionUuid ? 'query_mission_lookup' : 'local_storage_mission_lookup',
      lifecycleState: missionData.lifecycleState || ''
    }));
  }

  if (storedState.payload) {
    return Promise.resolve(normalizeMissionPayload(storedState.payload, {
      route: settings.route || '/play/mission',
      schemaVersion: settings.schemaVersion || '',
      source: 'local_storage_payload'
    }));
  }

  return Promise.resolve(normalizeMissionPayload(null, {
    route: settings.route || '/play/mission',
    schemaVersion: settings.schemaVersion || '',
    source: 'no_payload'
  }));
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
    'Payload unavailable. Missing: ' + (missing || 'mission payload') + '. Return to Dossier or /play staging.';
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
  let renderer = null;
  let destroyed = false;

  const runtime = {
    destroy() {
      destroyed = true;
      enterButton?.removeEventListener('click', enterHandler);
      pauseButton?.removeEventListener('click', pauseHandler);
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

  root.oohPlayableRuntime = runtime;

  setState(root, 'boot', BOOT_STATES.BOOTING);
  setPrimary(root, BOOT_STATES.BOOTING, 'Recovering Dossier mission payload.');

  hydrateBootstrap(settings).then((bootstrap) => {
    if (destroyed) {
      return;
    }
    renderBootstrap(root, bootstrap);
    if (!bootstrap.payloadAvailable) {
      setState(root, 'payload', BOOT_STATES.PAYLOAD_UNAVAILABLE);
      setPrimary(root, BOOT_STATES.PAYLOAD_UNAVAILABLE, 'No valid mission payload is available for the test field.');
      logPlayable('warn', 'Payload unavailable for playable route.', bootstrap.debug || {});
      return;
    }

    setState(root, 'payload', BOOT_STATES.PAYLOAD_READY);
    setPrimary(root, BOOT_STATES.PAYLOAD_READY, 'Mission payload recovered. Initializing WebGL renderer.');
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
