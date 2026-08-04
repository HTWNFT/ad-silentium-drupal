export const HOSTILE_STATES = Object.freeze({
  IDLE: 'IDLE',
  ALERT: 'ALERT',
  ATTACK: 'ATTACK',
  DEFEATED: 'DEFEATED'
});

const DEFAULT_MAX_HEALTH = 1;
const DEFAULT_ATTACK_DAMAGE = 10;
const DEFAULT_ATTACK_INTERVAL = 1.25;
const DEFAULT_ATTACK_RADIUS = 4.5;
const DEFAULT_DETECTION_RADIUS = 8.5;
const DEFAULT_ALERT_DELAY = 0.45;
const HOSTILE_HEIGHT = 0.9;

function horizontalDistance(a, b) {
  if (!a || !b) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.hypot((a.x || 0) - (b.x || 0), (a.z || 0) - (b.z || 0));
}

function pointInsideBox(point, box) {
  return point.x >= box.minX && point.x <= box.maxX && point.z >= box.minZ && point.z <= box.maxZ;
}

function lineIntersectsBox(start, end, box) {
  if (!start || !end || !box) {
    return false;
  }
  if (pointInsideBox(start, box) || pointInsideBox(end, box)) {
    return false;
  }

  const dx = end.x - start.x;
  const dz = end.z - start.z;
  let near = 0;
  let far = 1;

  const axes = [
    { origin: start.x, delta: dx, min: box.minX, max: box.maxX },
    { origin: start.z, delta: dz, min: box.minZ, max: box.maxZ }
  ];

  for (const axis of axes) {
    if (Math.abs(axis.delta) < 0.000001) {
      if (axis.origin < axis.min || axis.origin > axis.max) {
        return false;
      }
      continue;
    }

    const t1 = (axis.min - axis.origin) / axis.delta;
    const t2 = (axis.max - axis.origin) / axis.delta;
    near = Math.max(near, Math.min(t1, t2));
    far = Math.min(far, Math.max(t1, t2));
    if (near > far) {
      return false;
    }
  }

  return far > 0 && near < 1;
}

function hasLineOfSight(hostilePosition, playerPosition, obstacles = []) {
  if (!hostilePosition || !playerPosition) {
    return false;
  }

  const start = { x: hostilePosition.x || 0, z: hostilePosition.z || 0 };
  const end = { x: playerPosition.x || 0, z: playerPosition.z || 0 };
  return !(Array.isArray(obstacles) ? obstacles : []).some((box) => {
    if (Number.isFinite(box?.topY) && box.topY < HOSTILE_HEIGHT) {
      return false;
    }
    return lineIntersectsBox(start, end, box);
  });
}

function createHostile(definition = {}) {
  const target = definition.target || null;
  const fallbackId = target?.userData?.missionTargetId || target?.userData?.hostileId || target?.name || 'phase-6-hostile';
  return {
    target,
    hostileId: String(definition.hostileId || fallbackId),
    maxHealth: Math.max(1, Number(definition.maxHealth) || DEFAULT_MAX_HEALTH),
    health: Math.max(1, Number(definition.maxHealth) || DEFAULT_MAX_HEALTH),
    attackDamage: Math.max(0, Number(definition.attackDamage) || DEFAULT_ATTACK_DAMAGE),
    attackInterval: Math.max(0.1, Number(definition.attackInterval) || DEFAULT_ATTACK_INTERVAL),
    attackRadius: Math.max(0.1, Number(definition.attackRadius) || DEFAULT_ATTACK_RADIUS),
    detectionRadius: Math.max(0.1, Number(definition.detectionRadius) || DEFAULT_DETECTION_RADIUS),
    alertDelay: Math.max(0, Number(definition.alertDelay) || DEFAULT_ALERT_DELAY),
    state: HOSTILE_STATES.IDLE,
    attackCooldown: Math.max(0.1, Number(definition.attackInterval) || DEFAULT_ATTACK_INTERVAL),
    alertTimer: 0,
    playerDetected: false,
    playerInRange: false,
    lineOfSight: false,
    distance: Number.POSITIVE_INFINITY
  };
}

export class HostileController {
  constructor({ hostiles = [], obstacles = [] } = {}) {
    this.hostiles = [];
    this.obstacles = Array.isArray(obstacles) ? obstacles : [];
    this.setHostiles(hostiles);
  }

  setHostiles(hostiles = []) {
    this.hostiles = (Array.isArray(hostiles) ? hostiles : [])
      .filter((definition) => definition?.target)
      .map((definition) => createHostile(definition));
  }

  start() {
    this.hostiles.forEach((hostile) => this.resetHostile(hostile));
    return this.snapshot({ restartTriggered: false });
  }

  update(delta, { playerPosition = null, canAttack = true } = {}) {
    const damageEvents = [];

    this.hostiles.forEach((hostile) => {
      if (hostile.state === HOSTILE_STATES.DEFEATED) {
        hostile.playerDetected = false;
        hostile.playerInRange = false;
        hostile.lineOfSight = false;
        return;
      }

      hostile.distance = horizontalDistance(hostile.target?.position, playerPosition);
      hostile.lineOfSight = hostile.distance <= hostile.detectionRadius && hasLineOfSight(hostile.target?.position, playerPosition, this.obstacles);
      hostile.playerDetected = hostile.lineOfSight;
      hostile.playerInRange = hostile.playerDetected && hostile.distance <= hostile.attackRadius;

      if (!canAttack || !hostile.playerDetected) {
        hostile.state = HOSTILE_STATES.IDLE;
        hostile.alertTimer = 0;
        hostile.attackCooldown = hostile.attackInterval;
        return;
      }

      if (hostile.state === HOSTILE_STATES.IDLE) {
        hostile.state = HOSTILE_STATES.ALERT;
        hostile.alertTimer = 0;
      }

      if (hostile.state === HOSTILE_STATES.ALERT) {
        hostile.alertTimer += Math.max(0, delta);
        hostile.attackCooldown = hostile.attackInterval;
        if (hostile.alertTimer >= hostile.alertDelay && hostile.playerInRange) {
          hostile.state = HOSTILE_STATES.ATTACK;
        }
      }

      if (hostile.state !== HOSTILE_STATES.ATTACK) {
        return;
      }

      if (!hostile.playerInRange) {
        hostile.state = HOSTILE_STATES.ALERT;
        hostile.attackCooldown = hostile.attackInterval;
        return;
      }

      hostile.attackCooldown = Math.max(0, hostile.attackCooldown - delta);
      if (hostile.attackCooldown > 0) {
        return;
      }

      hostile.attackCooldown = hostile.attackInterval;
      if (hostile.attackDamage > 0) {
        damageEvents.push({ hostileId: hostile.hostileId, amount: hostile.attackDamage });
      }
    });

    return this.snapshot({ damageEvents });
  }

  handleShot(result = {}) {
    const hostile = this.hostiles.find((candidate) => this.isHostileHit(candidate, result));
    if (!hostile || hostile.state === HOSTILE_STATES.DEFEATED) {
      return this.snapshot();
    }

    hostile.health = Math.max(0, hostile.health - 1);
    if (hostile.health > 0) {
      return this.snapshot();
    }

    hostile.state = HOSTILE_STATES.DEFEATED;
    hostile.playerDetected = false;
    hostile.playerInRange = false;
    hostile.lineOfSight = false;
    hostile.attackCooldown = hostile.attackInterval;
    return this.snapshot({ defeatTriggered: true, defeatedHostileId: hostile.hostileId });
  }

  restart() {
    this.hostiles.forEach((hostile) => this.resetHostile(hostile));
    return this.snapshot({ restartTriggered: true });
  }

  getState() {
    return this.snapshot();
  }

  resetHostile(hostile) {
    hostile.state = HOSTILE_STATES.IDLE;
    hostile.health = hostile.maxHealth;
    hostile.attackCooldown = hostile.attackInterval;
    hostile.alertTimer = 0;
    hostile.playerDetected = false;
    hostile.playerInRange = false;
    hostile.lineOfSight = false;
    hostile.distance = Number.POSITIVE_INFINITY;
  }

  isHostileHit(hostile, result) {
    return result?.hit === true && result.targetId === hostile.hostileId;
  }

  hostileSnapshot(hostile) {
    return Object.freeze({
      state: hostile.state,
      hostileId: hostile.hostileId,
      health: hostile.health,
      maxHealth: hostile.maxHealth,
      attackDamage: hostile.attackDamage,
      attackInterval: hostile.attackInterval,
      attackRadius: hostile.attackRadius,
      detectionRadius: hostile.detectionRadius,
      attackCooldown: hostile.attackCooldown,
      playerDetected: hostile.playerDetected,
      playerInRange: hostile.playerInRange,
      lineOfSight: hostile.lineOfSight,
      distance: hostile.distance
    });
  }

  snapshot({
    damageEvents = [],
    defeatTriggered = false,
    defeatedHostileId = '',
    restartTriggered = false
  } = {}) {
    const hostiles = this.hostiles.map((hostile) => this.hostileSnapshot(hostile));
    const activeHostiles = hostiles.filter((hostile) => hostile.state !== HOSTILE_STATES.DEFEATED);
    const engagedHostiles = hostiles.filter((hostile) => hostile.state === HOSTILE_STATES.ATTACK).length;
    const alertHostiles = hostiles.filter((hostile) => hostile.state === HOSTILE_STATES.ALERT).length;
    const defeatedHostiles = hostiles.filter((hostile) => hostile.state === HOSTILE_STATES.DEFEATED).length;
    const threatText = activeHostiles.length === 0 ?
      'DEFEATED' :
      'ACTIVE ' + activeHostiles.length + ' // ALERT ' + alertHostiles + ' // ATTACK ' + engagedHostiles;

    return Object.freeze({
      hostiles: Object.freeze(hostiles),
      activeHostileCount: activeHostiles.length,
      defeatedHostileCount: defeatedHostiles,
      damageEvents: Object.freeze(damageEvents.map((event) => Object.freeze({ ...event }))),
      damageTriggered: damageEvents.length > 0,
      damageAmount: damageEvents.reduce((total, event) => total + event.amount, 0),
      defeatTriggered,
      defeatedHostileId,
      restartTriggered,
      threatText
    });
  }
}
