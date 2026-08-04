export const MISSION_STATES = Object.freeze({
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED'
});

export const TARGET_STATES = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  HIT: 'HIT',
  DESTROYED: 'DESTROYED',
  RESTORED: 'RESTORED'
});

const DEFAULT_TARGET_ID = 'phase-4-designated-target';
const DEFAULT_OBJECTIVE = 'Destroy the hostile before it drops your health to zero.';
const DEFAULT_MAX_PLAYER_HEALTH = 100;

export class MissionController {
  constructor({
    targetId = DEFAULT_TARGET_ID,
    objectiveText = DEFAULT_OBJECTIVE,
    maxPlayerHealth = DEFAULT_MAX_PLAYER_HEALTH
  } = {}) {
    this.targetId = String(targetId || DEFAULT_TARGET_ID);
    this.objectiveText = String(objectiveText || DEFAULT_OBJECTIVE);
    this.maxPlayerHealth = Math.max(1, Number(maxPlayerHealth) || DEFAULT_MAX_PLAYER_HEALTH);
    this.playerHealth = this.maxPlayerHealth;
    this.state = MISSION_STATES.IDLE;
    this.targetState = TARGET_STATES.AVAILABLE;
  }

  start() {
    this.state = MISSION_STATES.ACTIVE;
    this.targetState = TARGET_STATES.AVAILABLE;
    this.playerHealth = this.maxPlayerHealth;
    return this.snapshot();
  }

  handleShot() {
    return this.snapshot();
  }

  handleHostileDefeated() {
    if (this.state !== MISSION_STATES.ACTIVE) {
      return this.snapshot();
    }

    this.targetState = TARGET_STATES.HIT;
    this.targetState = TARGET_STATES.DESTROYED;
    this.state = MISSION_STATES.COMPLETE;
    return this.snapshot({ completionTriggered: true });
  }

  handlePlayerDamage(amount = 0) {
    if (this.state !== MISSION_STATES.ACTIVE) {
      return this.snapshot();
    }

    const damage = Math.max(0, Number(amount) || 0);
    if (damage <= 0) {
      return this.snapshot();
    }

    this.playerHealth = Math.max(0, this.playerHealth - damage);
    if (this.playerHealth > 0) {
      return this.snapshot({ damageTriggered: true, damageAmount: damage });
    }

    this.state = MISSION_STATES.FAILED;
    return this.snapshot({ damageTriggered: true, damageAmount: damage, failureTriggered: true });
  }

  restart() {
    this.state = MISSION_STATES.ACTIVE;
    this.targetState = TARGET_STATES.RESTORED;
    this.playerHealth = this.maxPlayerHealth;
    return this.snapshot({ restartTriggered: true });
  }

  getState() {
    return this.snapshot();
  }

  snapshot({
    completionTriggered = false,
    failureTriggered = false,
    restartTriggered = false,
    damageTriggered = false,
    damageAmount = 0
  } = {}) {
    const completed = this.state === MISSION_STATES.COMPLETE;
    const failed = this.state === MISSION_STATES.FAILED;
    const targetState = this.targetState;

    if (this.targetState === TARGET_STATES.RESTORED) {
      this.targetState = TARGET_STATES.AVAILABLE;
    }

    return Object.freeze({
      state: this.state,
      targetState,
      objectiveText: this.objectiveText,
      statusText: completed ? 'MISSION COMPLETE' : failed ? 'MISSION FAILED' : this.state,
      successText: completed ? 'HOSTILE DEFEATED // EXTRACTION READY' : '',
      failureText: failed ? 'PLAYER DOWN // RESTART REQUIRED' : '',
      completed,
      failed,
      playerHealth: this.playerHealth,
      maxPlayerHealth: this.maxPlayerHealth,
      healthText: String(this.playerHealth),
      completionTriggered,
      failureTriggered,
      restartTriggered,
      damageTriggered,
      damageAmount
    });
  }
}