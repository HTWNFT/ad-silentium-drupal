import { adaptExistingGeneratorContract } from './ExistingGeneratorContractAdapter.js';

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

export function normalizeMissionPayload(payload, meta = {}) {
  return adaptExistingGeneratorContract(payload, meta);
}
