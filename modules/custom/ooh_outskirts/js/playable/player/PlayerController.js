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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function circleIntersectsBox(position, radius, box) {
  const closestX = clamp(position.x, box.minX, box.maxX);
  const closestZ = clamp(position.z, box.minZ, box.maxZ);
  return Math.hypot(position.x - closestX, position.z - closestZ) < radius;
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
    }

    this.position.x = this.resolveAxis('x', this.position.x + moveX * speed * delta);
    this.position.z = this.resolveAxis('z', this.position.z + moveZ * speed * delta);

    this.velocityY -= this.config.gravity * delta;
    this.position.y += this.velocityY * delta;
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocityY = 0;
      this.grounded = true;
    }
    else {
      this.grounded = false;
    }

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

    if (this.obstacles.some((box) => circleIntersectsBox(next, this.config.radius, box))) {
      return this.position[axis];
    }

    return next[axis];
  }

  respawn() {
    this.position.set(this.spawn.x, this.spawn.y, this.spawn.z);
    this.velocityY = 0;
    this.grounded = true;
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
    this.camera.position.set(this.position.x, this.position.y + this.config.height, this.position.z);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;
  }
}
