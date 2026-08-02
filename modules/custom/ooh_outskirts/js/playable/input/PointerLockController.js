export class PointerLockController {
  constructor(target, {
    sensitivity = 0.002,
    minPitch = -1.25,
    maxPitch = 1.1,
    onLockChange = null,
    onMove = null
  } = {}) {
    this.target = target;
    this.sensitivity = sensitivity;
    this.minPitch = minPitch;
    this.maxPitch = maxPitch;
    this.onLockChange = onLockChange;
    this.onMove = onMove;
    this.yaw = 0;
    this.pitch = 0;
    this.locked = false;
    this.boundPointerLockChange = this.handlePointerLockChange.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
    document.addEventListener('mousemove', this.boundMouseMove);
  }

  requestLock() {
    this.target?.requestPointerLock?.();
  }

  exitLock() {
    if (this.isLocked() && document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  isLocked() {
    return document.pointerLockElement === this.target;
  }

  handlePointerLockChange() {
    const locked = this.isLocked();
    if (locked === this.locked) {
      return;
    }
    this.locked = locked;
    this.onLockChange?.(locked);
  }

  handleMouseMove(event) {
    if (!this.locked) {
      return;
    }
    this.yaw -= event.movementX * this.sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch - event.movementY * this.sensitivity));
    this.onMove?.({ yaw: this.yaw, pitch: this.pitch });
  }

  setOrientation({ yaw = this.yaw, pitch = this.pitch } = {}) {
    this.yaw = yaw;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, pitch));
    this.onMove?.({ yaw: this.yaw, pitch: this.pitch });
  }

  destroy() {
    this.exitLock();
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
    document.removeEventListener('mousemove', this.boundMouseMove);
    this.locked = false;
  }
}
