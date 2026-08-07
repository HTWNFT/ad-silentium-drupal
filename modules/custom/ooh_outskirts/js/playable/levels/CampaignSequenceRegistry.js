import { LevelDefinitionRegistry } from './LevelDefinitionRegistry.js';

const VERSION = 1;
const SEQUENCE_SOURCE = 'existing_generator_contract_adapter_sequence_v1';
const SUPPORTED_MISSIONS = Object.freeze([
  Object.freeze({ missionType: 'recon', canonicalLevelId: 'development_arena', objectiveProfile: 'recon_playable_foundation' }),
  Object.freeze({ missionType: 'survival', canonicalLevelId: 'alternate_arena', objectiveProfile: 'survival_playable_foundation' })
]);
const ROUTE_ENVIRONMENT_MAP = Object.freeze({
  aer: 'aerial_trench_gate',
  mare: 'industrial_marsh',
  terra: 'dead_riverbed'
});
const LEVEL_ENVIRONMENT_MAP = Object.freeze({
  development_arena: 'development',
  alternate_arena: 'alternate_technical'
});
const ID_PATTERN = /^[a-z0-9_]+$/;

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

function cleanId(value) {
  const id = String(value || '').trim().toLowerCase();
  return ID_PATTERN.test(id) ? id : '';
}

function supportedMission(missionType) {
  const id = cleanId(missionType);
  return SUPPORTED_MISSIONS.find((mission) => mission.missionType === id) || null;
}

function routeId(identity = {}) {
  const id = cleanId(identity.routeId || identity.missionRouteId || identity.campaignRouteId);
  return ROUTE_ENVIRONMENT_MAP[id] ? id : '';
}

function orderedMissions(identity = {}) {
  const first = supportedMission(identity.missionType || identity.missionId) || SUPPORTED_MISSIONS[0];
  return Object.freeze([
    first,
    ...SUPPORTED_MISSIONS.filter((mission) => mission.missionType !== first.missionType)
  ]);
}

function buildEntry(definition, index, route) {
  const levelResolution = LevelDefinitionRegistry.resolveSelection({
    canonicalIdentity: {
      missionId: definition.missionType,
      missionType: definition.missionType,
      routeId: route,
      environmentId: LEVEL_ENVIRONMENT_MAP[definition.canonicalLevelId] || '',
      levelId: definition.canonicalLevelId
    },
    canonicalContextAvailable: true
  });

  return deepFreeze({
    sequence: index + 1,
    missionType: definition.missionType,
    routeId: route,
    canonicalLevelId: levelResolution.activeId,
    environmentId: (levelResolution.atmosphere || {}).environmentId || LEVEL_ENVIRONMENT_MAP[definition.canonicalLevelId] || ROUTE_ENVIRONMENT_MAP[route] || '',
    atmosphereId: (levelResolution.atmosphere || {}).atmosphereId || ROUTE_ENVIRONMENT_MAP[route] || 'technical_arena',
    objectiveProfile: definition.objectiveProfile,
    resolution: {
      source: levelResolution.resolutionSource,
      fallbackStatus: levelResolution.fallbackStatus,
      fallbackReason: levelResolution.fallbackReason || '',
      mapped: Boolean((levelResolution.mapping || {}).mapped)
    }
  });
}

export function buildCampaignSequence(contract = {}) {
  const identity = deepClone(contract.identity || contract.runtime || {});
  const route = routeId(identity) || 'terra';
  const entries = orderedMissions(identity).map((definition, index) => buildEntry(definition, index, route));

  return deepFreeze({
    version: VERSION,
    sequenceSource: SEQUENCE_SOURCE,
    sourceMissionUuid: String(contract.missionUuid || identity.missionUuid || '').trim(),
    entries,
    diagnostics: {
      sourceMissionType: cleanId(identity.missionType || identity.missionId),
      sourceRouteId: cleanId(identity.routeId || identity.missionRouteId || identity.campaignRouteId),
      fallbackRouteUsed: !routeId(identity),
      supportedMissionCount: SUPPORTED_MISSIONS.length
    },
    adaptiveDirectorHook: {
      phase: 'future_phase_6',
      interventionPoint: 'after_base_eligible_sequence_before_current_entry_selection'
    }
  });
}

export function selectCampaignSequenceEntry(sequenceDefinition = {}, requestedSequence = '') {
  const entries = Array.isArray(sequenceDefinition.entries) ? sequenceDefinition.entries : [];
  const requested = Number.parseInt(String(requestedSequence || '').trim(), 10);
  const hasExplicitRequest = String(requestedSequence || '').trim() !== '';
  const selected = entries.find((entry) => entry.sequence === requested) || entries[0] || null;

  return deepFreeze({
    selectedEntry: selected,
    selectedSequence: selected ? selected.sequence : 0,
    selectionSource: hasExplicitRequest && selected && selected.sequence === requested ? 'development_query_sequence_entry' : 'default_first_entry',
    developmentOverrideRequested: hasExplicitRequest,
    developmentOverrideAccepted: Boolean(hasExplicitRequest && selected && selected.sequence === requested),
    developmentOverrideReason: hasExplicitRequest && (!selected || selected.sequence !== requested) ? 'invalid_sequence_entry' : ''
  });
}
