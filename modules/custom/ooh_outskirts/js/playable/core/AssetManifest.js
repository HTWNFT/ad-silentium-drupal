export const LOG_PREFIX = '[OOH PLAYABLE]';

export const BOOT_STATES = Object.freeze({
  BOOTING: 'BOOTING',
  PAYLOAD_READY: 'PAYLOAD READY',
  PAYLOAD_UNAVAILABLE: 'PAYLOAD UNAVAILABLE',
  RENDERER_READY: 'RENDERER READY',
  RENDERER_FAILED: 'RENDERER FAILED',
  TEST_FIELD_ACTIVE: 'TEST FIELD ACTIVE',
  TEST_FIELD_PAUSED: 'TEST FIELD PAUSED'
});

export const TEST_SCENE = Object.freeze({
  floorSize: 22,
  wallHeight: 3.2,
  boundaryHalfSize: 10,
  cameraHeight: 1.75,
  obstacle: {
    size: 1.8,
    height: 0.9,
    position: { x: -2.8, z: -1.6 }
  },
  orientationObjectColor: 0x00e5ff,
  accentObjectColor: 0xff375f
});

export function logPlayable(level, message, detail) {
  const logger = console[level] || console.log;
  if (detail !== undefined) {
    logger.call(console, LOG_PREFIX, message, detail);
    return;
  }
  logger.call(console, LOG_PREFIX, message);
}

export function readable(value, fallback = 'Unavailable') {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text === '' ? fallback : text;
}

function identityValue(value) {
  const id = String(value || '').trim().toLowerCase();
  return /^[a-z0-9_]+$/.test(id) ? id : '';
}

export function normalizeMissionPayload(payload, meta = {}) {
  if (!payload || typeof payload !== 'object') {
    return {
      payloadAvailable: false,
      identity: Object.freeze({
        missionUuid: readable(meta.missionUuid || '', ''),
        missionId: '',
        missionType: '',
        routeId: '',
        missionRouteId: '',
        campaignRouteId: '',
        playlistId: '',
        pathId: ''
      }),
      presentation: Object.freeze({
        missionTitle: 'Mission unavailable',
        recruiter: 'Unassigned',
        playlist: 'Unlinked'
      }),
      debug: {
        source: meta.source || 'unavailable',
        schemaVersion: meta.schemaVersion || ''
      }
    };
  }

  const snapshot = payload.snapshot && typeof payload.snapshot === 'object' ? payload.snapshot : {};
  const mission = payload.mission || snapshot.mission || {};
  const route = payload.route || snapshot.route || {};
  const campaignRoute = payload.campaignRoute || snapshot.campaignRoute || {};
  const path = payload.path || snapshot.path || {};
  const recruiter = payload.recruiter || snapshot.recruiter || {};
  const playlist = payload.playlist || snapshot.playlist || {};
  const routeId = payload.routeId || route.id || mission.campaignRoute || campaignRoute.id || payload.campaignRouteId || '';
  const missionId = payload.missionId || payload.missionType || mission.id || '';
  const missionType = payload.missionType || payload.missionId || mission.id || '';
  const missionRouteId = payload.missionRouteId || mission.campaignRoute || '';
  const campaignRouteId = payload.campaignRouteId || campaignRoute.id || '';
  const playlistId = payload.playlistId || playlist.id || '';
  const pathId = payload.pathId || path.id || '';
  const missionTitle = readable(mission.label || mission.title || missionId, 'Mission unavailable');
  const recruiterLabel = readable(recruiter.name || recruiter.label, 'Unassigned');
  const playlistLabel = readable(playlist.label || playlist.title, 'Unlinked');
  const missing = [];

  if (!missionId) {
    missing.push('mission');
  }
  if (!routeId) {
    missing.push('route');
  }
  if (!payload.pathId && !path.id) {
    missing.push('path');
  }
  if (!payload.playlistId && !playlist.id) {
    missing.push('playlist');
  }

  return {
    route: meta.route || '/play/mission',
    missionId: readable(missionId, ''),
    missionUuid: readable(meta.missionUuid || payload.missionUuid || '', ''),
    missionTitle,
    campaignRoute: readable(routeId || campaignRoute.label, 'Unknown'),
    recruiter: recruiterLabel,
    playlist: playlistLabel,
    identity: Object.freeze({
      missionUuid: readable(meta.missionUuid || payload.missionUuid || '', ''),
      missionId: identityValue(missionId),
      missionType: identityValue(missionType),
      routeId: identityValue(routeId),
      missionRouteId: identityValue(missionRouteId),
      campaignRouteId: identityValue(campaignRouteId),
      playlistId: identityValue(playlistId),
      pathId: identityValue(pathId)
    }),
    presentation: Object.freeze({
      missionTitle,
      recruiter: recruiterLabel,
      playlist: playlistLabel
    }),
    payloadAvailable: missing.length === 0,
    debug: {
      source: meta.source || 'unknown',
      schemaVersion: meta.schemaVersion || '',
      payloadVersion: readable(payload.payloadVersion, ''),
      payloadUuid: readable(meta.payloadUuid || payload.payloadUuid || '', ''),
      lifecycleState: readable(meta.lifecycleState, ''),
      missingFields: missing
    }
  };
}
