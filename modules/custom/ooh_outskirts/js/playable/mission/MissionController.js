export const MISSION_STATES = Object.freeze({
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
  COMPLETE: 'COMPLETE'
});

export const TARGET_STATES = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  HIT: 'HIT',
  DESTROYED: 'DESTROYED',
  RESTORED: 'RESTORED'
});

const DEFAULT_TARGET_ID = 'phase-4-designated-target';
const DEFAULT_OBJECTIVE = 'Locate and destroy the designated target.';

export class MissionController {
  constructor({ targetId = DEFAULT_TARGET_ID, objectiveText = DEFAULT_OBJECTIVE } = {}) {
    this.targetId = String(targetId || DEFAULT_TARGET_ID);
    this.objectiveText = String(objectiveText || DEFAULT_OBJECTIVE);
    this.state = MISSION_STATES.IDLE;
    this.targetState = TARGET_STATES.AVAILABLE;
  }

  start() {
    this.state = MISSION_STATES.ACTIVE;
    this.targetState = TARGET_STATES.AVAILABLE;
    return this.snapshot();
  }

  handleShot(result = {}) {
    if (this.state !== MISSION_STATES.ACTIVE || !this.isDesignatedTargetHit(result)) {
      return this.snapshot();
    }

    this.targetState = TARGET_STATES.HIT;
    this.targetState = TARGET_STATES.DESTROYED;
    this.state = MISSION_STATES.COMPLETE;
    return this.snapshot({ completionTriggered: true });
  }

  restart() {
    this.state = MISSION_STATES.ACTIVE;
    this.targetState = TARGET_STATES.RESTORED;
    return this.snapshot({ restartTriggered: true });
  }

  getState() {
    return this.snapshot();
  }

  isDesignatedTargetHit(result) {
    return result?.hit === true && result.targetId === this.targetId;
  }

  snapshot({ completionTriggered = false, restartTriggered = false } = {}) {
    const completed = this.state === MISSION_STATES.COMPLETE;
    const targetState = this.targetState;

    if (this.targetState === TARGET_STATES.RESTORED) {
      this.targetState = TARGET_STATES.AVAILABLE;
    }

    return Object.freeze({
      state: this.state,
      targetState,
      objectiveText: this.objectiveText,
      statusText: completed ? 'MISSION COMPLETE' : this.state,
      successText: completed ? 'TARGET DESTROYED // EXTRACTION READY' : '',
      completed,
      completionTriggered,
      restartTriggered
    });
  }
}