const KEY_MAP = Object.freeze({
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  Space: 'jump',
  Escape: 'escape'
});

const GAMEPLAY_KEYS = new Set(Object.keys(KEY_MAP));

function isTypingTarget(target) {
  const tagName = String(target?.tagName || '').toLowerCase();
  return Boolean(target?.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select');
}

export class InputController {
  constructor({ target = document, isActive = () => false, onEscape = null, onPrimaryFire = null } = {}) {
    this.target = target || document;
    this.isActive = isActive;
    this.onEscape = onEscape;
    this.onPrimaryFire = onPrimaryFire;
    this.keys = new Set();
    this.jumpQueued = false;
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundBlur = this.clear.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    this.target.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('blur', this.boundBlur);
  }

  handleKeyDown(event) {
    if (!GAMEPLAY_KEYS.has(event.code)) {
      return;
    }

    if (!this.isActive()) {
      if (event.code === 'Escape') {
        this.onEscape?.();
      }
      return;
    }

    if (isTypingTarget(event.target)) {
      return;
    }

    const key = KEY_MAP[event.code];
    if (key === 'escape') {
      this.onEscape?.();
      return;
    }

    event.preventDefault();
    if (key === 'jump' && !this.keys.has('jump')) {
      this.jumpQueued = true;
    }
    this.keys.add(key);
  }

  handleKeyUp(event) {
    if (!GAMEPLAY_KEYS.has(event.code)) {
      return;
    }
    const key = KEY_MAP[event.code];
    if (key !== 'escape') {
      this.keys.delete(key);
    }
  }

  handleMouseDown(event) {
    if (event.button !== 0 || !this.isActive()) {
      return;
    }

    event.preventDefault();
    this.onPrimaryFire?.(event);
  }

  getMovementAxes() {
    let x = 0;
    let z = 0;
    if (this.keys.has('left')) {
      x -= 1;
    }
    if (this.keys.has('right')) {
      x += 1;
    }
    if (this.keys.has('forward')) {
      z -= 1;
    }
    if (this.keys.has('backward')) {
      z += 1;
    }

    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }

    return { x, z };
  }

  consumeJumpPressed() {
    const pressed = this.jumpQueued;
    this.jumpQueued = false;
    return pressed;
  }

  isSprinting() {
    return this.keys.has('sprint');
  }

  clear() {
    this.keys.clear();
    this.jumpQueued = false;
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.target.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('blur', this.boundBlur);
    this.clear();
  }
}
