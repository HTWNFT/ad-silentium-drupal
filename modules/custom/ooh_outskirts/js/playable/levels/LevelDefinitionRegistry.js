import { alternateArena } from './alternateArena.js';
import { developmentArena } from './developmentArena.js';

const DEFAULT_LEVEL_ID = 'development_arena';
const SUPPORTED_SUCCESS_CONDITIONS = Object.freeze(['all_required_hostiles_defeated']);
const SUPPORTED_FAILURE_CONDITIONS = Object.freeze(['player_health_zero']);
const ID_PATTERN = /^[a-z0-9_]+$/;
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
const ENVIRONMENT_ATMOSPHERE_MAP = Object.freeze({
  development: 'technical_arena',
  alternate_technical: 'alternate_technical',
  dead_riverbed: 'dead_riverbed',
  industrial_marsh: 'industrial_marsh',
  aerial_trench_gate: 'aerial_trench_gate'
});
const BIOME_ATMOSPHERE_MAP = Object.freeze({
  technical_arena: 'technical_arena'
});

function deepClone(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item));
  }
  const clone = {};
  Object.keys(value).forEach((key) => {
    clone[key] = deepClone(value[key]);
  });
  return clone;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.keys(value).forEach((key) => deepFreeze(value[key]));
  }
  return value;
}

function cleanRequestedId(value) {
  const id = String(value || '').trim().toLowerCase();
  return ID_PATTERN.test(id) ? id : '';
}

function identityValue(value) {
  const id = String(value || '').trim().toLowerCase();
  return ID_PATTERN.test(id) ? id : '';
}

function canonicalIdentity(payload = {}) {
  const snapshot = payload.snapshot && typeof payload.snapshot === 'object' ? payload.snapshot : {};
  const mission = payload.mission || snapshot.mission || {};
  const route = payload.route || snapshot.route || {};
  const campaignRoute = payload.campaignRoute || snapshot.campaignRoute || {};
  const playlist = payload.playlist || snapshot.playlist || {};
  const path = payload.path || snapshot.path || {};
  const level = payload.level || snapshot.level || {};
  const environment = payload.environment || snapshot.environment || {};
  const biome = payload.biome || snapshot.biome || {};

  return Object.freeze({
    missionId: identityValue(payload.missionId || payload.missionType || mission.id),
    missionType: identityValue(payload.missionType || payload.missionId || mission.id),
    routeId: identityValue(payload.routeId || route.id || mission.campaignRoute || campaignRoute.id || payload.campaignRouteId),
    missionRouteId: identityValue(payload.missionRouteId || mission.campaignRoute),
    campaignRouteId: identityValue(payload.campaignRouteId || campaignRoute.id),
    playlistId: identityValue(payload.playlistId || playlist.id),
    pathId: identityValue(payload.pathId || path.id),
    levelId: identityValue(payload.levelId || level.id),
    environmentId: identityValue(payload.environmentId || environment.id),
    biomeId: identityValue(payload.biomeId || biome.id || environment.biomeId)
  });
}

function suppliedCanonicalIdentity(identity = null) {
  if (!identity || typeof identity !== 'object') {
    return null;
  }
  return Object.freeze({
    missionId: identityValue(identity.missionId),
    missionType: identityValue(identity.missionType),
    routeId: identityValue(identity.routeId),
    missionRouteId: identityValue(identity.missionRouteId),
    campaignRouteId: identityValue(identity.campaignRouteId),
    playlistId: identityValue(identity.playlistId),
    pathId: identityValue(identity.pathId),
    levelId: identityValue(identity.levelId),
    environmentId: identityValue(identity.environmentId),
    biomeId: identityValue(identity.biomeId)
  });
}

function selectorRecord(selector, value, reason) {
  return Object.freeze({ selector, value, reason });
}

function unsupportedCanonicalSelectors(identity = {}) {
  const unsupported = [];

  if (identity.levelId && !registry.has(identity.levelId)) {
    unsupported.push(selectorRecord('levelId', identity.levelId, 'unsupported_level_id'));
  }
  if (identity.missionId && !MISSION_LEVEL_MAP.missionId[identity.missionId]) {
    unsupported.push(selectorRecord('missionId', identity.missionId, 'unsupported_mission_id'));
  }
  if (identity.missionType && !MISSION_LEVEL_MAP.missionType[identity.missionType]) {
    unsupported.push(selectorRecord('missionType', identity.missionType, 'unsupported_mission_type'));
  }
  if (identity.routeId && !ROUTE_ATMOSPHERE_MAP[identity.routeId]) {
    unsupported.push(selectorRecord('routeId', identity.routeId, 'unsupported_route_id'));
  }
  if (identity.environmentId && !ENVIRONMENT_ATMOSPHERE_MAP[identity.environmentId]) {
    unsupported.push(selectorRecord('environmentId', identity.environmentId, 'unsupported_environment_id'));
  }
  if (identity.biomeId && !BIOME_ATMOSPHERE_MAP[identity.biomeId]) {
    unsupported.push(selectorRecord('biomeId', identity.biomeId, 'unsupported_biome_id'));
  }

  return Object.freeze(unsupported);
}

function resolveCanonicalLevelId(identity = {}) {
  if (identity.levelId && registry.has(identity.levelId)) {
    return Object.freeze({ levelId: identity.levelId, matchedField: 'levelId', matchedValue: identity.levelId, source: 'canonical_level_id', reason: 'confirmed_canonical_level_id' });
  }
  if (identity.missionId && MISSION_LEVEL_MAP.missionId[identity.missionId]) {
    return Object.freeze({ levelId: MISSION_LEVEL_MAP.missionId[identity.missionId], matchedField: 'missionId', matchedValue: identity.missionId, source: 'canonical_mission_id', reason: 'confirmed_canonical_mission_id' });
  }
  if (identity.missionType && MISSION_LEVEL_MAP.missionType[identity.missionType]) {
    return Object.freeze({ levelId: MISSION_LEVEL_MAP.missionType[identity.missionType], matchedField: 'missionType', matchedValue: identity.missionType, source: 'canonical_mission_type', reason: 'confirmed_canonical_mission_type' });
  }
  if (identity.levelId) {
    return Object.freeze({ levelId: '', matchedField: 'levelId', matchedValue: identity.levelId, source: 'mission_payload', reason: 'unsupported_level_id' });
  }
  if (identity.missionId) {
    return Object.freeze({ levelId: '', matchedField: 'missionId', matchedValue: identity.missionId, source: 'mission_payload', reason: 'unsupported_mission_id' });
  }
  if (identity.missionType) {
    return Object.freeze({ levelId: '', matchedField: 'missionType', matchedValue: identity.missionType, source: 'mission_payload', reason: 'unsupported_mission_type' });
  }
  return Object.freeze({ levelId: '', matchedField: '', matchedValue: '', source: 'mission_payload', reason: 'missing_canonical_level_selector' });
}

function resolveAtmosphere(identity = {}, definition = null) {
  const levelEnvironment = (definition || {}).environment || {};
  const levelEnvironmentId = identityValue(levelEnvironment.id);
  const levelBiomeId = identityValue(levelEnvironment.biomeId);
  const canonicalEnvironmentId = identityValue(identity.environmentId);
  const canonicalBiomeId = identityValue(identity.biomeId);
  const routeAtmosphereId = ROUTE_ATMOSPHERE_MAP[identity.routeId] || '';
  const canonicalEnvironmentAtmosphereId = ENVIRONMENT_ATMOSPHERE_MAP[canonicalEnvironmentId] || '';
  const canonicalBiomeAtmosphereId = BIOME_ATMOSPHERE_MAP[canonicalBiomeId] || '';
  const levelEnvironmentAtmosphereId = ENVIRONMENT_ATMOSPHERE_MAP[levelEnvironmentId] || '';
  const levelBiomeAtmosphereId = BIOME_ATMOSPHERE_MAP[levelBiomeId] || '';
  const atmosphereId = routeAtmosphereId || canonicalEnvironmentAtmosphereId || canonicalBiomeAtmosphereId || levelEnvironmentAtmosphereId || levelBiomeAtmosphereId || 'technical_arena';
  let source = 'safe_default';
  let fallbackReason = '';

  if (routeAtmosphereId) {
    source = 'canonical_route_id';
  }
  else if (canonicalEnvironmentAtmosphereId) {
    source = 'canonical_environment_id';
    fallbackReason = identity.routeId ? 'unsupported_route_id' : 'missing_route_id';
  }
  else if (canonicalBiomeAtmosphereId) {
    source = 'canonical_biome_id';
    fallbackReason = canonicalEnvironmentId ? 'unsupported_environment_id' : 'missing_environment_id';
  }
  else if (levelEnvironmentAtmosphereId) {
    source = 'level_environment_id';
    fallbackReason = identity.routeId ? 'unsupported_route_id' : 'missing_route_id';
  }
  else if (levelBiomeAtmosphereId) {
    source = 'level_biome_id';
    fallbackReason = levelEnvironmentId ? 'unsupported_environment_id' : 'missing_environment_id';
  }
  else {
    fallbackReason = 'unsupported_atmosphere_identity';
  }

  return Object.freeze({
    atmosphereId,
    source,
    fallbackReason,
    routeId: identity.routeId || '',
    environmentId: canonicalEnvironmentId || levelEnvironmentId,
    biomeId: canonicalBiomeId || levelBiomeId
  });
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveNumber(value, fallback) {
  return Math.max(0.1, finiteNumber(value, fallback));
}

function requiredText(value, label) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error('Level definition missing required ' + label + '.');
  }
  return text;
}

function vector3(value, label, fallback = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.freeze({
    x: finiteNumber(source.x, finiteNumber(fallback.x, 0)),
    y: finiteNumber(source.y, finiteNumber(fallback.y, 0)),
    z: finiteNumber(source.z, finiteNumber(fallback.z, 0))
  });
}

function normalizePrimitive(definition = {}) {
  const type = requiredText(definition.type, 'scene primitive type');
  if (type !== 'orientation_beacon') {
    throw new Error('Unsupported scene primitive type: ' + type + '.');
  }

  return Object.freeze({
    id: requiredText(definition.id, 'scene primitive id'),
    type,
    visible: definition.visible !== false,
    position: vector3(definition.position, 'scene primitive position'),
    collision: definition.collision !== false,
    blocksLineOfSight: definition.blocksLineOfSight !== false
  });
}

function normalizeObstacle(definition = {}) {
  const size = vector3(definition.size, 'obstacle size', { x: 1, y: 1, z: 1 });
  return Object.freeze({
    id: requiredText(definition.id, 'obstacle id'),
    position: vector3(definition.position, 'obstacle position'),
    size: Object.freeze({
      x: positiveNumber(size.x, 1),
      y: positiveNumber(size.y, 1),
      z: positiveNumber(size.z, 1)
    }),
    visible: definition.visible !== false,
    collision: definition.collision !== false,
    blocksLineOfSight: definition.blocksLineOfSight !== false
  });
}

function normalizeHostile(definition = {}) {
  const id = requiredText(definition.id, 'hostile id');
  return Object.freeze({
    id,
    name: requiredText(definition.name || id, 'hostile name'),
    position: vector3(definition.position, 'hostile position'),
    maxHealth: Math.max(1, Math.round(finiteNumber(definition.maxHealth, 1))),
    detectionRadius: positiveNumber(definition.detectionRadius, 8.5),
    attackRadius: positiveNumber(definition.attackRadius, 4.5),
    attackDamage: Math.max(0, finiteNumber(definition.attackDamage, 10)),
    attackInterval: positiveNumber(definition.attackInterval, 1.25),
    alertDelay: Math.max(0, finiteNumber(definition.alertDelay, 0.45)),
    required: definition.required !== false
  });
}

function normalizeConditions(conditions = {}) {
  const successType = requiredText((conditions.success || {}).type, 'success condition type');
  const failureType = requiredText((conditions.failure || {}).type, 'failure condition type');
  if (!SUPPORTED_SUCCESS_CONDITIONS.includes(successType)) {
    throw new Error('Unsupported success condition: ' + successType + '.');
  }
  if (!SUPPORTED_FAILURE_CONDITIONS.includes(failureType)) {
    throw new Error('Unsupported failure condition: ' + failureType + '.');
  }
  return Object.freeze({
    success: Object.freeze({ type: successType }),
    failure: Object.freeze({ type: failureType })
  });
}

function normalizeLevelDefinition(definition = {}) {
  const id = requiredText(definition.id, 'level id');
  if (!ID_PATTERN.test(id)) {
    throw new Error('Level ID must use lowercase letters, numbers, and underscores: ' + id + '.');
  }

  const scene = definition.scene || {};
  const hostiles = (Array.isArray(definition.hostiles) ? definition.hostiles : []).map(normalizeHostile);
  if (!hostiles.some((hostile) => hostile.required)) {
    throw new Error('Level definition must include at least one required hostile.');
  }

  return deepFreeze({
    id,
    debugName: requiredText(definition.debugName || id, 'debug name'),
    mission: Object.freeze({
      id: requiredText((definition.mission || {}).id, 'mission id'),
      type: requiredText((definition.mission || {}).type, 'mission type'),
      objectiveText: requiredText((definition.mission || {}).objectiveText, 'mission objective text')
    }),
    environment: Object.freeze({
      id: String((definition.environment || {}).id || '').trim(),
      biomeId: String((definition.environment || {}).biomeId || '').trim()
    }),
    player: Object.freeze({
      spawn: vector3((definition.player || {}).spawn, 'player spawn'),
      facing: Object.freeze({
        yaw: finiteNumber(((definition.player || {}).facing || {}).yaw, 0),
        pitch: finiteNumber(((definition.player || {}).facing || {}).pitch, 0)
      })
    }),
    objective: Object.freeze({
      id: requiredText((definition.objective || {}).id, 'objective id'),
      position: vector3((definition.objective || {}).position, 'objective position'),
      required: (definition.objective || {}).required !== false
    }),
    scene: Object.freeze({
      floorSize: positiveNumber(scene.floorSize, 22),
      boundaryHalfSize: positiveNumber(scene.boundaryHalfSize, 10),
      wallHeight: positiveNumber(scene.wallHeight, 3.2),
      primitives: Object.freeze((Array.isArray(scene.primitives) ? scene.primitives : []).map(normalizePrimitive))
    }),
    obstacles: Object.freeze((Array.isArray(definition.obstacles) ? definition.obstacles : []).map(normalizeObstacle)),
    hostiles: Object.freeze(hostiles),
    conditions: normalizeConditions(definition.conditions),
    timer: definition.timer || null,
    metadata: Object.freeze({
      routeId: String((definition.metadata || {}).routeId || '').trim(),
      playlistId: String((definition.metadata || {}).playlistId || '').trim(),
      payloadId: String((definition.metadata || {}).payloadId || '').trim()
    })
  });
}

function buildRegistry(definitions) {
  const registry = new Map();
  definitions.forEach((definition) => {
    const normalized = normalizeLevelDefinition(definition);
    if (registry.has(normalized.id)) {
      throw new Error('Duplicate level definition ID: ' + normalized.id + '.');
    }
    registry.set(normalized.id, normalized);
  });
  if (!registry.has(DEFAULT_LEVEL_ID)) {
    throw new Error('Default level definition is missing: ' + DEFAULT_LEVEL_ID + '.');
  }
  return registry;
}

const registry = buildRegistry([developmentArena, alternateArena]);

function frozenDefinition(levelId) {
  return deepFreeze(deepClone(registry.get(levelId)));
}

function buildMapping(canonicalMatch, identity, unsupportedSelectors) {
  return Object.freeze({
    mapped: Boolean(canonicalMatch.levelId && unsupportedSelectors.length === 0),
    missionDerivedLevelId: canonicalMatch.levelId || '',
    matchedField: canonicalMatch.matchedField || '',
    matchedValue: canonicalMatch.matchedValue || '',
    reason: canonicalMatch.reason || '',
    unsupportedSelectors,
    atmosphere: null,
    identity
  });
}

export class LevelDefinitionRegistry {
  static defaultLevelId() {
    return DEFAULT_LEVEL_ID;
  }

  static resolve(requestedId = '') {
    return this.resolveSelection({ queryLevelId: requestedId, canonicalContextAvailable: false });
  }

  static resolvePayload(payload = {}) {
    const resolution = this.resolveSelection({ payload, canonicalContextAvailable: true });
    const mapping = resolution.mapping || {};
    return Object.freeze({
      mapped: mapping.mapped,
      missionDerivedLevelId: mapping.missionDerivedLevelId,
      matchedField: mapping.matchedField,
      matchedValue: mapping.matchedValue,
      reason: mapping.reason,
      unsupportedSelectors: mapping.unsupportedSelectors || Object.freeze([]),
      atmosphere: resolution.atmosphere,
      identity: mapping.identity || Object.freeze({})
    });
  }

  static resolveSelection(selection = {}) {
    const rawRequestedLevelId = String(selection.queryLevelId || '').trim();
    const queryLevelId = cleanRequestedId(rawRequestedLevelId);
    const hasValidQueryLevel = Boolean(queryLevelId && registry.has(queryLevelId));
    const suppliedIdentity = suppliedCanonicalIdentity(selection.canonicalIdentity);
    const canonicalContextAvailable = Boolean(selection.canonicalContextAvailable && (suppliedIdentity || (selection.payload && typeof selection.payload === 'object')));
    const identity = canonicalContextAvailable ? (suppliedIdentity || canonicalIdentity(selection.payload)) : Object.freeze({});
    const unsupportedSelectors = canonicalContextAvailable ? unsupportedCanonicalSelectors(identity) : Object.freeze([]);
    const canonicalMatch = canonicalContextAvailable ? resolveCanonicalLevelId(identity) : Object.freeze({ levelId: '', matchedField: '', matchedValue: '', source: '', reason: '' });
    const developmentQueryIgnored = Boolean(canonicalContextAvailable && queryLevelId && (!canonicalMatch.levelId || queryLevelId !== canonicalMatch.levelId));
    let activeId = DEFAULT_LEVEL_ID;
    let requestedLevelId = '';
    let resolutionSource = 'safe_default';
    let fallbackUsed = false;
    let fallbackReason = '';
    let fallbackStatus = 'safe_default';

    if (canonicalContextAvailable) {
      requestedLevelId = canonicalMatch.levelId || identity.levelId || '';
      resolutionSource = canonicalMatch.source || 'mission_payload';
      if (canonicalMatch.levelId && unsupportedSelectors.length === 0) {
        activeId = canonicalMatch.levelId;
        fallbackStatus = developmentQueryIgnored ? 'query_level_ignored' : 'no_fallback';
      }
      else {
        fallbackUsed = true;
        fallbackReason = unsupportedSelectors.length ? 'unsupported_canonical_metadata' : (canonicalMatch.reason || 'missing_canonical_level_selector');
        fallbackStatus = fallbackReason;
      }
    }
    else if (hasValidQueryLevel) {
      activeId = queryLevelId;
      requestedLevelId = queryLevelId;
      resolutionSource = 'development_query_fallback';
      fallbackStatus = selection.mappingUnavailableReason || 'canonical_context_absent';
    }
    else {
      requestedLevelId = queryLevelId;
      fallbackUsed = true;
      fallbackReason = rawRequestedLevelId ? (queryLevelId ? 'unknown_level_id' : 'malformed_level_id') : (selection.mappingUnavailableReason || 'missing_canonical_context_and_query_level');
      fallbackStatus = fallbackReason;
    }

    const definition = frozenDefinition(activeId);
    const atmosphere = resolveAtmosphere(identity, definition);
    const mapping = buildMapping(canonicalMatch, identity, unsupportedSelectors);

    return deepFreeze({
      requestedId: requestedLevelId || rawRequestedLevelId,
      requestedLevelId,
      rawRequestedLevelId,
      queryLevelId,
      activeId,
      resolvedLevelId: activeId,
      missionDerivedLevelId: canonicalMatch.levelId || '',
      resolutionSource,
      fallbackUsed,
      didFallback: fallbackUsed,
      fallbackReason,
      fallbackStatus,
      unsupportedSelectors,
      developmentQueryIgnored,
      canonicalContextAvailable,
      lookupSucceeded: Boolean(selection.lookupSucceeded),
      mapping: Object.freeze({
        ...mapping,
        atmosphere
      }),
      atmosphere,
      definition
    });
  }

  static normalizeForTest(definition) {
    return normalizeLevelDefinition(definition);
  }

  static buildRegistryForTest(definitions) {
    return buildRegistry(definitions);
  }
}
