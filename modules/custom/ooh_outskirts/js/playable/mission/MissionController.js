export const MISSION_STATES = Object.freeze({
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED'
});

const DEFAULT_OBJECTIVE = 'Destroy all hostiles before they drop your health to zero.';
const DEFAULT_MAX_PLAYER_HEALTH = 100;

export class MissionController {
  constructor({
    targetIds = [],
    objectiveText = DEFAULT_OBJECTIVE,
    maxPlayerHealth = DEFAULT_MAX_PLAYER_HEALTH
  } = {}) {
    this.targetIds = this.normalizeTargetIds(targetIds);
    this.objectiveText = String(objectiveText || DEFAULT_OBJECTIVE);
    this.maxPlayerHealth = Math.max(1, Number(maxPlayerHealth) || DEFAULT_MAX_PLAYER_HEALTH);
    this.playerHealth = this.maxPlayerHealth;
    this.state = MISSION_STATES.IDLE;
    this.defeatedTargetIds = new Set();
  }

  normalizeTargetIds(targetIds) {
    const ids = Array.isArray(targetIds) ? targetIds : [];
    return Object.freeze(ids.map((id) => String(id || '').trim()).filter(Boolean));
  }

  start() {
    this.state = MISSION_STATES.ACTIVE;
    this.playerHealth = this.maxPlayerHealth;
    this.defeatedTargetIds = new Set();
    return this.snapshot();
  }

  handleShot() {
    return this.snapshot();
  }

  handleHostileDefeated(hostileId = '') {
    if (this.state !== MISSION_STATES.ACTIVE) {
      return this.snapshot();
    }

    const id = String(hostileId || '').trim();
    if (!id || this.defeatedTargetIds.has(id)) {
      return this.snapshot();
    }

    this.defeatedTargetIds.add(id);
    if (this.defeatedTargetIds.size >= this.targetIds.length) {
      this.state = MISSION_STATES.COMPLETE;
      return this.snapshot({ completionTriggered: true, defeatedHostileId: id });
    }

    return this.snapshot({ defeatTriggered: true, defeatedHostileId: id });
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
    this.playerHealth = this.maxPlayerHealth;
    this.defeatedTargetIds = new Set();
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
    damageAmount = 0,
    defeatTriggered = false,
    defeatedHostileId = ''
  } = {}) {
    const completed = this.state === MISSION_STATES.COMPLETE;
    const failed = this.state === MISSION_STATES.FAILED;
    const requiredHostileCount = this.targetIds.length;
    const defeatedHostileCount = this.defeatedTargetIds.size;
    const remainingHostileCount = Math.max(0, requiredHostileCount - defeatedHostileCount);

    return Object.freeze({
      state: this.state,
      objectiveText: this.objectiveText,
      statusText: completed ? 'MISSION COMPLETE' : failed ? 'MISSION FAILED' : this.state,
      successText: completed ? 'ALL HOSTILES DEFEATED // EXTRACTION READY' : '',
      failureText: failed ? 'PLAYER DOWN // RESTART REQUIRED' : '',
      completed,
      failed,
      playerHealth: this.playerHealth,
      maxPlayerHealth: this.maxPlayerHealth,
      healthText: String(this.playerHealth) + ' / ' + String(this.maxPlayerHealth),
      requiredHostileCount,
      defeatedHostileCount,
      remainingHostileCount,
      remainingText: String(remainingHostileCount) + ' / ' + String(requiredHostileCount),
      defeatedTargetIds: Object.freeze(Array.from(this.defeatedTargetIds)),
      completionTriggered,
      failureTriggered,
      restartTriggered,
      damageTriggered,
      damageAmount,
      defeatTriggered,
      defeatedHostileId
    });
  }
}
