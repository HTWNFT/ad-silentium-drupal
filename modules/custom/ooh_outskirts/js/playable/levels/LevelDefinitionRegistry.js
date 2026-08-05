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
  })
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

  return Object.freeze({
    missionId: identityValue(payload.missionId || payload.missionType || mission.id),
    missionType: identityValue(payload.missionType || payload.missionId || mission.id),
    routeId: identityValue(payload.routeId || route.id || mission.campaignRoute || campaignRoute.id || payload.campaignRouteId),
    missionRouteId: identityValue(payload.missionRouteId || mission.campaignRoute),
    campaignRouteId: identityValue(payload.campaignRouteId || campaignRoute.id),
    playlistId: identityValue(payload.playlistId || playlist.id)
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

export class LevelDefinitionRegistry {
  static defaultLevelId() {
    return DEFAULT_LEVEL_ID;
  }

  static resolve(requestedId = '') {
    const cleanedId = cleanRequestedId(requestedId);
    const requestedText = String(requestedId || '').trim();
    let activeId = cleanedId || DEFAULT_LEVEL_ID;
    let didFallback = false;
    let fallbackReason = '';

    if (!requestedText) {
      activeId = DEFAULT_LEVEL_ID;
    }
    else if (!cleanedId) {
      activeId = DEFAULT_LEVEL_ID;
      didFallback = true;
      fallbackReason = 'malformed_level_id';
    }
    else if (!registry.has(cleanedId)) {
      activeId = DEFAULT_LEVEL_ID;
      didFallback = true;
      fallbackReason = 'unknown_level_id';
    }

    return Object.freeze({
      requestedId: requestedText,
      activeId,
      didFallback,
      fallbackReason,
      definition: deepFreeze(deepClone(registry.get(activeId)))
    });
  }

  static resolvePayload(payload = {}) {
    const identity = canonicalIdentity(payload);
    const missionLevelId = MISSION_LEVEL_MAP.missionId[identity.missionId] || '';

    if (missionLevelId && registry.has(missionLevelId)) {
      return Object.freeze({
        mapped: true,
        missionDerivedLevelId: missionLevelId,
        matchedField: 'missionId',
        matchedValue: identity.missionId,
        reason: 'confirmed_canonical_mission_id',
        identity
      });
    }

    return Object.freeze({
      mapped: false,
      missionDerivedLevelId: '',
      matchedField: identity.missionId ? 'missionId' : '',
      matchedValue: identity.missionId,
      reason: identity.missionId ? 'unsupported_mission_id' : 'missing_mission_id',
      identity
    });
  }

  static normalizeForTest(definition) {
    return normalizeLevelDefinition(definition);
  }

  static buildRegistryForTest(definitions) {
    return buildRegistry(definitions);
  }
}
