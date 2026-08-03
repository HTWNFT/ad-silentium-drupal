export const PLAYER_DEFAULTS = Object.freeze({
  spawn: { x: 0, y: 0, z: 6.8 },
  walkSpeed: 4.2,
  sprintMultiplier: 1.65,
  jumpVelocity: 5.8,
  gravity: 15.5,
  radius: 0.38,
  height: 1.75,
  fallLimit: -8
});

const LANDING_TOLERANCE = 0.08;
const TOP_LANDING_RADIUS_BONUS = 0.14;
const MAX_LANDING_COMPRESSION = 0.12;
const LANDING_COMPRESSION_PER_SPEED = 0.018;
const LANDING_RECOVERY_SPEED = 0.85;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function circleIntersectsBox(position, radius, box) {
  const closestX = clamp(position.x, box.minX, box.maxX);
  const closestZ = clamp(position.z, box.minZ, box.maxZ);
  return Math.hypot(position.x - closestX, position.z - closestZ) < radius;
}

function hasTopSupport(box) {
  return Number.isFinite(box?.topY) && box.topY > 0;
}

function circleCanLandOnTop(position, radius, box) {
  return circleIntersectsBox(position, radius + TOP_LANDING_RADIUS_BONUS, box);
}

export class PlayerController {
  constructor(THREE, camera, world = {}, config = {}) {
    this.THREE = THREE;
    this.camera = camera;
    this.config = { ...PLAYER_DEFAULTS, ...config };
    this.spawn = { ...PLAYER_DEFAULTS.spawn, ...(config.spawn || {}) };
    this.bounds = world.bounds || { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
    this.obstacles = Array.isArray(world.obstacles) ? world.obstacles : [];
    this.position = new THREE.Vector3(this.spawn.x, this.spawn.y, this.spawn.z);
    this.velocityY = 0;
    this.grounded = true;
    this.supportedSurfaceY = 0;
    this.landingCompression = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.applyCamera();
  }

  setLook({ yaw = this.yaw, pitch = this.pitch } = {}) {
    this.yaw = yaw;
    this.pitch = pitch;
    this.applyCamera();
  }

  update(delta, input) {
    const axes = input.getMovementAxes();
    this.lastSprinting = input.isSprinting();
    const speed = this.config.walkSpeed * (this.lastSprinting ? this.config.sprintMultiplier : 1);
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const moveX = (axes.x * cos) + (axes.z * sin);
    const moveZ = (-axes.x * sin) + (axes.z * cos);

    if (input.consumeJumpPressed() && this.grounded) {
      this.velocityY = this.config.jumpVelocity;
      this.grounded = false;
      this.supportedSurfaceY = null;
    }

    this.position.x = this.resolveAxis('x', this.position.x + moveX * speed * delta);
    this.position.z = this.resolveAxis('z', this.position.z + moveZ * speed * delta);

    const previousY = this.position.y;
    this.velocityY -= this.config.gravity * delta;
    this.position.y += this.velocityY * delta;
    const supportY = this.findLandingSupport(previousY, this.position.y);
    if (supportY !== null && this.velocityY <= 0) {
      const landingSpeed = Math.max(0, -this.velocityY);
      const wasGrounded = this.grounded && this.supportedSurfaceY === supportY;
      this.position.y = supportY;
      this.velocityY = 0;
      this.grounded = true;
      this.supportedSurfaceY = supportY;
      if (!wasGrounded && landingSpeed > 0.5) {
        this.applyLandingResponse(landingSpeed);
      }
    }
    else {
      this.grounded = false;
      this.supportedSurfaceY = null;
    }

    this.landingCompression = Math.max(0, this.landingCompression - LANDING_RECOVERY_SPEED * delta);

    if (this.position.y < this.config.fallLimit) {
      this.respawn();
    }

    this.applyCamera();
  }

  resolveAxis(axis, nextValue) {
    const next = { x: this.position.x, z: this.position.z };
    next[axis] = nextValue;
    next.x = clamp(next.x, this.bounds.minX + this.config.radius, this.bounds.maxX - this.config.radius);
    next.z = clamp(next.z, this.bounds.minZ + this.config.radius, this.bounds.maxZ - this.config.radius);

    if (this.obstacles.some((box) => this.blocksSideCollision(next, box))) {
      return this.position[axis];
    }

    return next[axis];
  }

  blocksSideCollision(position, box) {
    if (!circleIntersectsBox(position, this.config.radius, box)) {
      return false;
    }
    return !hasTopSupport(box) || this.position.y < box.topY;
  }

  findLandingSupport(previousY, nextY) {
    let supportY = previousY >= 0 && nextY <= 0 ? 0 : null;
    this.obstacles.forEach((box) => {
      if (!hasTopSupport(box) || !circleCanLandOnTop(this.position, this.config.radius, box)) {
        return;
      }
      const reachedTop = previousY + LANDING_TOLERANCE >= box.topY;
      const crossedTop = nextY <= box.topY + LANDING_TOLERANCE;
      if (reachedTop && crossedTop && (supportY === null || box.topY > supportY)) {
        supportY = box.topY;
      }
    });
    return supportY;
  }

  applyLandingResponse(landingSpeed) {
    this.landingCompression = Math.min(
      MAX_LANDING_COMPRESSION,
      landingSpeed * LANDING_COMPRESSION_PER_SPEED
    );
  }

  respawn() {
    this.position.set(this.spawn.x, this.spawn.y, this.spawn.z);
    this.velocityY = 0;
    this.grounded = true;
    this.supportedSurfaceY = 0;
    this.landingCompression = 0;
  }

  getHudState(isLocked) {
    return {
      lock: isLocked ? 'LOCKED' : 'UNLOCKED',
      grounded: this.grounded ? 'GROUNDED' : 'AIRBORNE',
      speed: this.lastSprinting ? 'SPRINT' : 'WALK',
      coordinates: [
        this.position.x.toFixed(1),
        this.position.y.toFixed(1),
        this.position.z.toFixed(1)
      ].join(', ')
    };
  }


  applyCamera() {
    if (!this.camera) {
      return;
    }
    this.camera.rotation.order = 'YXZ';
    const visualEyeHeight = Math.max(0, this.config.height - this.landingCompression);
    this.camera.position.set(this.position.x, this.position.y + visualEyeHeight, this.position.z);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;
  }
}
