export const HOSTILE_STATES = Object.freeze({
  INACTIVE: 'INACTIVE',
  ACTIVE: 'ACTIVE',
  DEFEATED: 'DEFEATED'
});

const DEFAULT_HOSTILE_ID = 'phase-4-designated-target';
const DEFAULT_MAX_HEALTH = 1;
const DEFAULT_ATTACK_DAMAGE = 10;
const DEFAULT_ATTACK_INTERVAL = 1.25;
const DEFAULT_ATTACK_RADIUS = 4.5;

function horizontalDistance(a, b) {
  if (!a || !b) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.hypot((a.x || 0) - (b.x || 0), (a.z || 0) - (b.z || 0));
}

export class HostileController {
  constructor({
    target = null,
    hostileId = DEFAULT_HOSTILE_ID,
    maxHealth = DEFAULT_MAX_HEALTH,
    attackDamage = DEFAULT_ATTACK_DAMAGE,
    attackInterval = DEFAULT_ATTACK_INTERVAL,
    attackRadius = DEFAULT_ATTACK_RADIUS
  } = {}) {
    this.target = target;
    this.hostileId = String(hostileId || DEFAULT_HOSTILE_ID);
    this.maxHealth = Math.max(1, Number(maxHealth) || DEFAULT_MAX_HEALTH);
    this.attackDamage = Math.max(0, Number(attackDamage) || DEFAULT_ATTACK_DAMAGE);
    this.attackInterval = Math.max(0.1, Number(attackInterval) || DEFAULT_ATTACK_INTERVAL);
    this.attackRadius = Math.max(0.1, Number(attackRadius) || DEFAULT_ATTACK_RADIUS);
    this.state = HOSTILE_STATES.INACTIVE;
    this.health = this.maxHealth;
    this.attackCooldown = this.attackInterval;
    this.playerInRange = false;
  }

  start() {
    this.state = HOSTILE_STATES.ACTIVE;
    this.health = this.maxHealth;
    this.attackCooldown = this.attackInterval;
    this.playerInRange = false;
    return this.snapshot();
  }

  update(delta, { playerPosition = null, canAttack = true } = {}) {
    if (this.state !== HOSTILE_STATES.ACTIVE || !canAttack) {
      this.playerInRange = false;
      return this.snapshot();
    }

    const distance = horizontalDistance(this.target?.position, playerPosition);
    this.playerInRange = distance <= this.attackRadius;

    if (!this.playerInRange) {
      this.attackCooldown = this.attackInterval;
      return this.snapshot({ distance });
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    if (this.attackCooldown > 0) {
      return this.snapshot({ distance });
    }

    this.attackCooldown = this.attackInterval;
    return this.snapshot({
      distance,
      damageTriggered: true,
      damageAmount: this.attackDamage
    });
  }

  handleShot(result = {}) {
    if (this.state !== HOSTILE_STATES.ACTIVE || !this.isHostileHit(result)) {
      return this.snapshot();
    }

    this.health = 0;
    this.state = HOSTILE_STATES.DEFEATED;
    this.playerInRange = false;
    return this.snapshot({ defeatTriggered: true });
  }

  restart() {
    this.state = HOSTILE_STATES.ACTIVE;
    this.health = this.maxHealth;
    this.attackCooldown = this.attackInterval;
    this.playerInRange = false;
    return this.snapshot({ restartTriggered: true });
  }

  getState() {
    return this.snapshot();
  }

  isHostileHit(result) {
    return result?.hit === true && result.targetId === this.hostileId;
  }

  snapshot({
    distance = Number.POSITIVE_INFINITY,
    damageTriggered = false,
    damageAmount = 0,
    defeatTriggered = false,
    restartTriggered = false
  } = {}) {
    return Object.freeze({
      state: this.state,
      hostileId: this.hostileId,
      health: this.health,
      maxHealth: this.maxHealth,
      attackDamage: this.attackDamage,
      attackInterval: this.attackInterval,
      attackRadius: this.attackRadius,
      attackCooldown: this.attackCooldown,
      playerInRange: this.playerInRange,
      distance,
      damageTriggered,
      damageAmount,
      defeatTriggered,
      restartTriggered,
      threatText: this.state === HOSTILE_STATES.ACTIVE ? (this.playerInRange ? 'ENGAGED' : 'ACTIVE') : this.state
    });
  }
}