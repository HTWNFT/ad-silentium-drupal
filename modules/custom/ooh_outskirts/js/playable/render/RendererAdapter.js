import * as THREE from '../../../assets/playable/vendor/three.module.min.js';
import { BOOT_STATES, TEST_SCENE, logPlayable } from '../core/AssetManifest.js';
import { buildTestScene } from './SceneBuilder.js';

export class RendererAdapter {
  constructor(root, viewport, bootstrap, statusCallbacks = {}) {
    this.root = root;
    this.viewport = viewport;
    this.bootstrap = bootstrap;
    this.statusCallbacks = statusCallbacks;
    this.renderer = null;
    this.camera = null;
    this.scene = null;
    this.animatedObjects = [];
    this.animationId = null;
    this.active = false;
    this.yaw = 0;
    this.pitch = 0;
    this.boundResize = this.resize.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundPointerLockChange = this.handlePointerLockChange.bind(this);
  }

  initialize() {
    if (!this.viewport) {
      throw new Error('Playable viewport is missing.');
    }
    if (!this.webglAvailable()) {
      throw new Error('WebGL is unavailable in this browser.');
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'ooh-playable__canvas';
    this.renderer.domElement.setAttribute('aria-label', 'Ad Silentium playable mission WebGL test scene');
    this.viewport.appendChild(this.renderer.domElement);

    const builtScene = buildTestScene(THREE, this.bootstrap);
    this.scene = builtScene.scene;
    this.animatedObjects = builtScene.animatedObjects;
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 80);
    this.camera.position.set(0, TEST_SCENE.cameraHeight, 6.8);
    this.camera.lookAt(0, 1, -4.5);

    window.addEventListener('resize', this.boundResize);
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
    this.resize();
    this.render(0);
    this.statusCallbacks.onRendererState?.(BOOT_STATES.RENDERER_READY);
    logPlayable('info', 'Renderer initialized.', {
      missionUuid: this.bootstrap.missionUuid || '',
      campaignRoute: this.bootstrap.campaignRoute || ''
    });
  }

  enter() {
    if (!this.renderer || !this.camera || !this.scene) {
      throw new Error('Renderer is not ready.');
    }

    this.active = true;
    this.statusCallbacks.onFieldState?.(BOOT_STATES.TEST_FIELD_ACTIVE);
    document.addEventListener('mousemove', this.boundMouseMove);
    if (this.renderer.domElement.requestPointerLock) {
      this.renderer.domElement.requestPointerLock();
    }
    this.start();
  }

  pause() {
    this.active = false;
    this.statusCallbacks.onFieldState?.(BOOT_STATES.TEST_FIELD_PAUSED);
    document.removeEventListener('mousemove', this.boundMouseMove);
    if (document.pointerLockElement === this.renderer?.domElement && document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  webglAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
    }
    catch (error) {
      return false;
    }
  }

  start() {
    if (this.animationId) {
      return;
    }
    const animate = (time) => {
      this.animationId = window.requestAnimationFrame(animate);
      this.render(time);
    };
    this.animationId = window.requestAnimationFrame(animate);
  }

  render(time) {
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }
    const seconds = time * 0.001;
    this.animatedObjects.forEach((object, index) => {
      object.rotation.y = seconds * (0.55 + index * 0.22);
      object.rotation.x = index === 0 ? 0 : Math.sin(seconds * 0.65) * 0.12;
    });
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    if (!this.renderer || !this.camera || !this.viewport) {
      return;
    }
    const width = Math.max(1, this.viewport.clientWidth);
    const height = Math.max(1, this.viewport.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.render(performance.now());
  }

  handleMouseMove(event) {
    if (!this.active || document.pointerLockElement !== this.renderer?.domElement) {
      return;
    }
    this.yaw -= event.movementX * 0.002;
    this.pitch = Math.max(-0.45, Math.min(0.35, this.pitch - event.movementY * 0.002));
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  handlePointerLockChange() {
    if (this.active && document.pointerLockElement !== this.renderer?.domElement) {
      this.active = false;
      document.removeEventListener('mousemove', this.boundMouseMove);
      this.statusCallbacks.onFieldState?.(BOOT_STATES.TEST_FIELD_PAUSED);
    }
  }
}
