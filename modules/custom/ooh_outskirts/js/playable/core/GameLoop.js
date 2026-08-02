export class GameLoop {
  constructor({ update, render, maxDelta = 0.05 } = {}) {
    this.update = typeof update === 'function' ? update : () => {};
    this.render = typeof render === 'function' ? render : () => {};
    this.maxDelta = maxDelta;
    this.animationId = null;
    this.running = false;
    this.paused = true;
    this.lastTime = 0;
    this.boundTick = this.tick.bind(this);
  }

  start() {
    if (this.animationId !== null) {
      return;
    }
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.animationId = window.requestAnimationFrame(this.boundTick);
  }

  pause() {
    this.paused = true;
  }

  resume() {
    if (!this.running) {
      this.start();
      return;
    }
    if (!this.paused) {
      return;
    }
    this.paused = false;
    this.lastTime = performance.now();
  }

  stop() {
    this.running = false;
    this.paused = true;
    if (this.animationId !== null) {
      window.cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stop();
    this.update = () => {};
    this.render = () => {};
  }

  tick(time) {
    this.animationId = null;
    if (!this.running) {
      return;
    }

    if (!this.paused) {
      const delta = Math.min(Math.max((time - this.lastTime) / 1000, 0), this.maxDelta);
      this.lastTime = time;
      this.update(delta, time);
      this.render(time);
    }
    else {
      this.lastTime = time;
    }

    if (this.running && this.animationId === null) {
      this.animationId = window.requestAnimationFrame(this.boundTick);
    }
  }
}
