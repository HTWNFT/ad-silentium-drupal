const ID_PATTERN = /^[a-z0-9_]+$/;
const SUPPORTED_ROUTES = Object.freeze(['aer', 'mare', 'terra']);
const MISSION_LEVEL_MAP = Object.freeze({
  missionId: Object.freeze({
    recon: 'development_arena',
    survival: 'alternate_arena'
  }),
  missionType: Object.freeze({
    recon: 'development_arena',
    survival: 'alternate_arena'
  })
});
const ROUTE_ATMOSPHERE_MAP = Object.freeze({
  terra: 'dead_riverbed',
  mare: 'industrial_marsh',
  aer: 'aerial_trench_gate'
});
const LEVEL_ENVIRONMENT_MAP = Object.freeze({
  development_arena: Object.freeze({ environmentId: 'development', biomeId: 'technical_arena' }),
  alternate_arena: Object.freeze({ environmentId: 'alternate_technical', biomeId: 'technical_arena' })
});

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.keys(value).forEach((key) => deepFreeze(value[key]));
  }
  return value;
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function readable(value, fallback = 'Unavailable') {
  if (value === null || value === undefined) {
    return fallback;
  }
  const text = String(value).trim();
  return text === '' ? fallback : text;
}

function identityValue(value) {
  const id = String(value || '').trim().toLowerCase();
  return ID_PATTERN.test(id) ? id : '';
}

function routeValue(value) {
  const id = identityValue(value);
  return SUPPORTED_ROUTES.includes(id) ? id : '';
}

function firstIdentity(candidates, validator = identityValue) {
  for (const candidate of candidates) {
    const value = validator(candidate.value);
    if (value) {
      return Object.freeze({ value, source: candidate.source });
    }
  }
  return Object.freeze({ value: '', source: '' });
}

function displayLabel(entity = {}, id = '', fallback = 'Unknown') {
  return readable(entity.label || entity.title || entity.name || id, fallback);
}

function missionTitle(mission = {}, missionId = '') {
  return readable(mission.label || mission.title || mission.name || missionId, 'Mission unavailable');
}

function selectedAttributes(payload = {}) {
  const source = payload.selectedAttributes && typeof payload.selectedAttributes === 'object' ? payload.selectedAttributes : {};
  return deepFreeze({ ...source });
}

function missionLevel(identity = {}) {
  if (identity.levelId) {
    return Object.freeze({ levelId: identity.levelId, source: 'payload_level_id', reason: 'explicit_level_id' });
  }
  if (identity.missionId && MISSION_LEVEL_MAP.missionId[identity.missionId]) {
    return Object.freeze({ levelId: MISSION_LEVEL_MAP.missionId[identity.missionId], source: 'mission_id', reason: 'mapped_mission_id' });
  }
  if (identity.missionType && MISSION_LEVEL_MAP.missionType[identity.missionType]) {
    return Object.freeze({ levelId: MISSION_LEVEL_MAP.missionType[identity.missionType], source: 'mission_type', reason: 'mapped_mission_type' });
  }
  return Object.freeze({ levelId: '', source: 'unresolved', reason: identity.missionId || identity.missionType ? 'unsupported_mission_selector' : 'missing_mission_selector' });
}

function missingFields(identity = {}) {
  const missing = [];
  if (!identity.missionId) {
    missing.push('mission');
  }
  if (!identity.routeId) {
    missing.push('route');
  }
  if (!identity.pathId) {
    missing.push('path');
  }
  if (!identity.playlistId) {
    missing.push('playlist');
  }
  return Object.freeze(missing);
}

function unavailableContract(meta = {}) {
  return deepFreeze({
    route: readable(meta.route || '/play/mission', '/play/mission'),
    missionId: '',
    missionUuid: readable(meta.missionUuid || '', ''),
    missionTitle: 'Mission unavailable',
    campaignRoute: 'Unknown',
    recruiter: 'Unassigned',
    playlist: 'Unlinked',
    payloadAvailable: false,
    identity: {
      missionUuid: readable(meta.missionUuid || '', ''),
      missionId: '',
      missionType: '',
      routeId: '',
      missionRouteId: '',
      campaignRouteId: '',
      playlistId: '',
      pathId: '',
      levelId: '',
      environmentId: '',
      biomeId: '',
      atmosphereId: ''
    },
    runtime: {
      routeId: '',
      missionId: '',
      missionType: '',
      missionUuid: readable(meta.missionUuid || '', ''),
      payloadUuid: readable(meta.payloadUuid || '', ''),
      playlistId: '',
      pathId: '',
      canonicalLevelId: '',
      environmentId: '',
      biomeId: '',
      atmosphereId: '',
      selectedAttributes: {}
    },
    character: {
      pathId: '',
      playlistId: '',
      selectedAttributes: {}
    },
    presentation: {
      missionTitle: 'Mission unavailable',
      recruiter: 'Unassigned',
      playlist: 'Unlinked'
    },
    provenance: {
      adapter: 'existing_generator_contract_adapter_v1',
      source: meta.source || 'unavailable',
      routeSource: '',
      missionSource: '',
      levelSource: 'unresolved',
      atmosphereSource: 'safe_default',
      fallbackReason: 'missing_payload'
    },
    debug: {
      source: meta.source || 'unavailable',
      schemaVersion: meta.schemaVersion || '',
      payloadVersion: '',
      payloadUuid: readable(meta.payloadUuid || '', ''),
      lifecycleState: readable(meta.lifecycleState || '', ''),
      missingFields: ['mission payload'],
      adapter: 'existing_generator_contract_adapter_v1'
    }
  });
}

export function adaptExistingGeneratorContract(payload, meta = {}) {
  if (!payload || typeof payload !== 'object') {
    return unavailableContract(meta);
  }

  const snapshot = objectValue(payload.snapshot);
  const mission = objectValue(payload.mission || snapshot.mission);
  const route = objectValue(payload.route || snapshot.route);
  const campaignRoute = objectValue(payload.campaignRoute || snapshot.campaignRoute);
  const path = objectValue(payload.path || snapshot.path);
  const playlist = objectValue(payload.playlist || snapshot.playlist);
  const recruiter = objectValue(payload.recruiter || snapshot.recruiter);
  const level = objectValue(payload.level || snapshot.level);
  const environment = objectValue(payload.environment || snapshot.environment);
  const biome = objectValue(payload.biome || snapshot.biome);
  const routeRecord = firstIdentity([
    { value: payload.missionRouteId, source: 'payload.missionRouteId' },
    { value: payload.routeId, source: 'payload.routeId' },
    { value: mission.campaignRoute, source: 'payload.mission.campaignRoute' },
    { value: route.id, source: 'payload.route.id' },
    { value: payload.campaignRouteId, source: 'payload.campaignRouteId' },
    { value: campaignRoute.id, source: 'payload.campaignRoute.id' }
  ], routeValue);
  const missionRecord = firstIdentity([
    { value: payload.missionId, source: 'payload.missionId' },
    { value: payload.missionType, source: 'payload.missionType' },
    { value: mission.id, source: 'payload.mission.id' }
  ]);
  const missionTypeRecord = firstIdentity([
    { value: payload.missionType, source: 'payload.missionType' },
    { value: payload.missionId, source: 'payload.missionId' },
    { value: mission.id, source: 'payload.mission.id' }
  ]);
  const missionRouteRecord = firstIdentity([
    { value: payload.missionRouteId, source: 'payload.missionRouteId' },
    { value: mission.campaignRoute, source: 'payload.mission.campaignRoute' },
    { value: routeRecord.value, source: routeRecord.source }
  ], routeValue);
  const campaignRouteRecord = firstIdentity([
    { value: payload.campaignRouteId, source: 'payload.campaignRouteId' },
    { value: campaignRoute.id, source: 'payload.campaignRoute.id' },
    { value: routeRecord.value, source: routeRecord.source }
  ], routeValue);
  const playlistRecord = firstIdentity([
    { value: payload.playlistId, source: 'payload.playlistId' },
    { value: playlist.id, source: 'payload.playlist.id' }
  ]);
  const pathRecord = firstIdentity([
    { value: payload.pathId, source: 'payload.pathId' },
    { value: path.id, source: 'payload.path.id' }
  ]);
  const levelRecord = firstIdentity([
    { value: payload.levelId, source: 'payload.levelId' },
    { value: level.id, source: 'payload.level.id' }
  ]);
  const environmentRecord = firstIdentity([
    { value: payload.environmentId, source: 'payload.environmentId' },
    { value: environment.id, source: 'payload.environment.id' }
  ]);
  const biomeRecord = firstIdentity([
    { value: payload.biomeId, source: 'payload.biomeId' },
    { value: biome.id, source: 'payload.biome.id' },
    { value: environment.biomeId, source: 'payload.environment.biomeId' }
  ]);

  const payloadUuid = readable(meta.payloadUuid || payload.payloadUuid || objectValue(payload.server).uuid || '', '');
  const missionUuid = readable(meta.missionUuid || payload.missionUuid || objectValue(payload.server).missionUuid || '', '');
  const identity = {
    missionUuid,
    missionId: missionRecord.value,
    missionType: missionTypeRecord.value,
    routeId: routeRecord.value,
    missionRouteId: missionRouteRecord.value,
    campaignRouteId: campaignRouteRecord.value,
    playlistId: playlistRecord.value,
    pathId: pathRecord.value,
    levelId: levelRecord.value,
    environmentId: environmentRecord.value,
    biomeId: biomeRecord.value,
    atmosphereId: ROUTE_ATMOSPHERE_MAP[routeRecord.value] || ''
  };
  const mappedLevel = missionLevel(identity);
  const levelEnvironment = LEVEL_ENVIRONMENT_MAP[mappedLevel.levelId] || {};
  const environmentId = identity.environmentId || ROUTE_ATMOSPHERE_MAP[identity.routeId] || levelEnvironment.environmentId || '';
  const biomeId = identity.biomeId || levelEnvironment.biomeId || '';
  const atmosphereId = ROUTE_ATMOSPHERE_MAP[identity.routeId] || environmentId || biomeId || 'technical_arena';
  identity.atmosphereId = atmosphereId;
  const missing = missingFields(identity);
  const attributes = selectedAttributes(payload);
  const title = missionTitle(mission, identity.missionId);
  const recruiterLabel = displayLabel(recruiter, '', 'Unassigned');
  const playlistLabel = displayLabel(playlist, identity.playlistId, 'Unlinked');

  return deepFreeze({
    route: readable(meta.route || '/play/mission', '/play/mission'),
    missionId: identity.missionId,
    missionUuid,
    missionTitle: title,
    campaignRoute: displayLabel(route, identity.routeId || campaignRoute.label, 'Unknown'),
    recruiter: recruiterLabel,
    playlist: playlistLabel,
    payloadAvailable: missing.length === 0,
    identity,
    runtime: {
      routeId: identity.routeId,
      missionId: identity.missionId,
      missionType: identity.missionType,
      missionUuid,
      payloadUuid,
      playlistId: identity.playlistId,
      pathId: identity.pathId,
      canonicalLevelId: mappedLevel.levelId,
      environmentId,
      biomeId,
      atmosphereId,
      selectedAttributes: attributes
    },
    character: {
      pathId: identity.pathId,
      playlistId: identity.playlistId,
      selectedAttributes: attributes
    },
    presentation: {
      missionTitle: title,
      recruiter: recruiterLabel,
      playlist: playlistLabel
    },
    provenance: {
      adapter: 'existing_generator_contract_adapter_v1',
      source: meta.source || 'unknown',
      routeSource: routeRecord.source,
      missionSource: missionRecord.source,
      missionTypeSource: missionTypeRecord.source,
      missionRouteSource: missionRouteRecord.source,
      campaignRouteSource: campaignRouteRecord.source,
      playlistSource: playlistRecord.source,
      pathSource: pathRecord.source,
      levelSource: mappedLevel.source,
      atmosphereSource: ROUTE_ATMOSPHERE_MAP[identity.routeId] ? 'route_id' : (environmentId ? 'environment_id' : 'safe_default'),
      fallbackReason: missing.length ? 'missing_required_payload_fields' : mappedLevel.reason
    },
    debug: {
      source: meta.source || 'unknown',
      schemaVersion: meta.schemaVersion || '',
      payloadVersion: readable(payload.payloadVersion, ''),
      payloadUuid,
      lifecycleState: readable(meta.lifecycleState || '', ''),
      missingFields: missing,
      adapter: 'existing_generator_contract_adapter_v1'
    }
  });
}
