import * as THREE from '../../../assets/playable/vendor/three.module.min.js';
import { BOOT_STATES, logPlayable } from '../core/AssetManifest.js';
import { GameLoop } from '../core/GameLoop.js';
import { FireController } from '../combat/FireController.js';
import { HostileController } from '../hostile/HostileController.js';
import { InputController } from '../input/InputController.js';
import { LevelDefinitionRegistry } from '../levels/LevelDefinitionRegistry.js';
import { MissionController } from '../mission/MissionController.js';
import { PointerLockController } from '../input/PointerLockController.js';
import { PlayerController } from '../player/PlayerController.js';
import { buildTestScene } from './SceneBuilder.js';

const CAMERA_HEIGHT = 1.75;

export class RendererAdapter {
  constructor(root, viewport, bootstrap, statusCallbacks = {}) {
    this.root = root;
    this.viewport = viewport;
    this.bootstrap = bootstrap;
    this.statusCallbacks = statusCallbacks;
    this.requestedLevelId = bootstrap.requestedLevelId ||
      (bootstrap.level || {}).requestedLevelId ||
      bootstrap.rawRequestedLevelId ||
      (bootstrap.level || {}).rawRequestedLevelId ||
      '';
    this.levelResolution = LevelDefinitionRegistry.resolve(this.requestedLevelId);
    this.levelDefinition = this.levelResolution.definition;
    this.renderer = null;
    this.camera = null;
    this.scene = null;
    this.animatedObjects = [];
    this.gameLoop = null;
    this.input = null;
    this.pointerLock = null;
    this.player = null;
    this.fireController = null;
    this.missionController = null;
    this.hostileController = null;
    this.missionTargets = [];
    this.activeCombatTargets = [];
    this.objectiveMarker = null;
    this.active = false;
    this.destroyed = false;
    this.lastHudState = '';
    this.lastHudUpdate = 0;
    this.boundResize = this.resize.bind(this);
    this.boundVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  initialize() {
    if (!this.viewport) {
      throw new Error('Playable viewport is missing.');
    }
    if (this.renderer) {
      return;
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

    const builtScene = buildTestScene(THREE, this.levelDefinition, this.bootstrap);
    this.scene = builtScene.scene;
    this.animatedObjects = builtScene.animatedObjects;
    this.objectiveMarker = builtScene.objectiveMarker || null;
    this.missionTargets = Array.isArray(builtScene.combatTargets) ? builtScene.combatTargets.slice() : [];
    this.activeCombatTargets = this.missionTargets.slice();
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 80);

    this.player = new PlayerController(THREE, this.camera, builtScene.collisionWorld, {
      height: CAMERA_HEIGHT,
      spawn: this.levelDefinition.player.spawn
    });
    this.input = new InputController({
      target: document,
      isActive: () => this.active && this.pointerLock?.isLocked(),
      onEscape: () => this.pause(),
      onPrimaryFire: () => this.requestPrimaryFire()
    });
    this.pointerLock = new PointerLockController(this.renderer.domElement, {
      onLockChange: (locked) => this.handlePointerLockChange(locked),
      onMove: (look) => this.player.setLook(look)
    });
    this.applyPlayerFacing();
    this.fireController = new FireController(THREE, {
      camera: this.camera,
      scene: this.scene,
      targets: this.activeCombatTargets,
      onShot: (result) => this.handleShotResult(result)
    });
    const requiredTargetIds = this.levelDefinition.hostiles
      .filter((hostile) => hostile.required)
      .map((hostile) => hostile.id);
    this.missionController = new MissionController({
      targetIds: requiredTargetIds,
      objectiveText: this.levelDefinition.mission.objectiveText
    });
    this.hostileController = new HostileController({
      hostiles: this.levelDefinition.hostiles.map((hostile) => ({
        target: this.findMissionTarget(hostile.id),
        hostileId: hostile.id,
        maxHealth: hostile.maxHealth,
        attackInterval: hostile.attackInterval,
        attackDamage: hostile.attackDamage,
        attackRadius: hostile.attackRadius,
        detectionRadius: hostile.detectionRadius,
        alertDelay: hostile.alertDelay
      })),
      obstacles: builtScene.collisionWorld?.obstacles || []
    });
    this.gameLoop = new GameLoop({
      update: (delta) => this.update(delta),
      render: (time) => this.render(time)
    });

    window.addEventListener('resize', this.boundResize);
    document.addEventListener('visibilitychange', this.boundVisibilityChange);
    this.resize();
    this.render(0);
    this.updateHud(true);
    const missionSnapshot = this.missionController.start();
    const hostileSnapshot = this.hostileController.start();
    this.applyMissionState(missionSnapshot, hostileSnapshot);
    this.updateLevelDiagnostics();
    this.statusCallbacks.onRendererState?.(BOOT_STATES.RENDERER_READY);
    logPlayable('info', 'Renderer initialized.', {
      missionUuid: this.bootstrap.missionUuid || '',
      campaignRoute: this.bootstrap.campaignRoute || '',
      requestedLevelId: this.levelResolution.requestedId || '',
      activeLevelId: this.levelResolution.activeId,
      fallbackReason: this.levelResolution.fallbackReason || '',
      hostileCount: this.missionTargets.length
    });
  }

  enter() {
    if (!this.renderer || !this.camera || !this.scene || !this.gameLoop) {
      throw new Error('Renderer is not ready.');
    }

    this.active = true;
    this.statusCallbacks.onFieldState?.(BOOT_STATES.TEST_FIELD_ACTIVE);
    this.pointerLock?.requestLock();
    this.gameLoop.start();
    this.gameLoop.resume();
    this.updateHud(true);
  }

  pause({ releasePointer = true } = {}) {
    this.active = false;
    this.input?.clear();
    this.gameLoop?.pause();
    this.statusCallbacks.onFieldState?.(BOOT_STATES.TEST_FIELD_PAUSED);
    if (releasePointer) {
      this.pointerLock?.exitLock();
    }
    this.updateHud(true);
  }

  destroy() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.active = false;
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('visibilitychange', this.boundVisibilityChange);
    this.gameLoop?.destroy();
    this.input?.destroy();
    this.pointerLock?.destroy();
    this.fireController?.destroy();
    this.renderer?.domElement?.remove();
    this.renderer?.dispose();
    this.gameLoop = null;
    this.input = null;
    this.pointerLock = null;
    this.player = null;
    this.fireController = null;
    this.missionController = null;
    this.hostileController = null;
    this.missionTargets = [];
    this.activeCombatTargets = [];
    this.objectiveMarker = null;
    this.renderer = null;
    this.camera = null;
    this.scene = null;
    this.animatedObjects = [];
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

  update(delta) {
    if (!this.player || !this.input) {
      return;
    }
    this.player.update(delta, this.input);
    this.fireController?.update(delta);
    this.updateHostiles(delta);
    this.updateHud();
  }

  requestPrimaryFire() {
    if (!this.active || !this.pointerLock?.isLocked() || !this.isMissionActive()) {
      return;
    }
    this.setHudValue('fire', 'FIRE REQUEST');
    this.fireController?.fire();
  }

  handleShotResult(result) {
    const state = result.hit ? 'HIT ' + result.targetName : 'MISS';
    this.setHudValue('fire', state);
    const reticle = this.root.querySelector('.ooh-playable__reticle');
    if (reticle) {
      reticle.classList.remove('is-firing', 'is-hit', 'is-miss');
      void reticle.offsetWidth;
      reticle.classList.add(result.hit ? 'is-hit' : 'is-miss');
    }

    let missionSnapshot = this.missionController?.handleShot(result);
    let hostileSnapshot = this.hostileController?.getState();
    if (this.isMissionActive()) {
      hostileSnapshot = this.hostileController?.handleShot(result);
      if (hostileSnapshot?.defeatTriggered) {
        missionSnapshot = this.missionController?.handleHostileDefeated(hostileSnapshot.defeatedHostileId);
        this.completeMissionTarget(hostileSnapshot.defeatedHostileId);
      }
    }
    this.applyMissionState(missionSnapshot, hostileSnapshot);
  }

  updateHostiles(delta) {
    if (!this.hostileController || !this.missionController || !this.player) {
      return;
    }

    const hostileSnapshot = this.hostileController.update(delta, {
      playerPosition: this.player.position,
      canAttack: this.isMissionActive()
    });
    let missionSnapshot = this.missionController.getState();
    if (hostileSnapshot.damageTriggered) {
      missionSnapshot = this.missionController.handlePlayerDamage(hostileSnapshot.damageAmount);
    }
    this.applyMissionState(missionSnapshot, hostileSnapshot);
  }

  isMissionActive() {
    return this.missionController?.getState().state === 'ACTIVE';
  }

  restartMission() {
    if (!this.missionController || !this.hostileController) {
      return;
    }
    this.player?.respawn();
    this.applyPlayerFacing();
    const missionSnapshot = this.missionController.restart();
    const hostileSnapshot = this.hostileController.restart();
    this.restoreMissionTargets();
    this.restoreObjective();
    this.applyMissionState(missionSnapshot, hostileSnapshot);
    this.updateHud(true);
    this.updateLevelDiagnostics('Restarted active level: ' + this.levelResolution.activeId + '.');
    this.setHudValue('fire', 'READY');
  }

  applyPlayerFacing() {
    const facing = this.levelDefinition.player?.facing || {};
    this.player?.setLook({ yaw: facing.yaw || 0, pitch: facing.pitch || 0 });
    this.pointerLock?.setOrientation({ yaw: facing.yaw || 0, pitch: facing.pitch || 0 });
  }

  completeMissionTarget(hostileId) {
    const missionTarget = this.findMissionTarget(hostileId);
    if (!missionTarget) {
      return;
    }
    this.fireController?.clearTargetEffects?.(missionTarget);
    missionTarget.visible = false;
    missionTarget.userData.destroyed = true;
    this.activeCombatTargets = this.activeCombatTargets.filter((target) => target !== missionTarget);
    this.fireController?.setTargets(this.activeCombatTargets);
  }

  restoreMissionTargets() {
    this.missionTargets.forEach((missionTarget) => {
      this.fireController?.clearTargetEffects?.(missionTarget);
      missionTarget.visible = true;
      missionTarget.userData.destroyed = false;
      missionTarget.scale.setScalar(1);
      if (missionTarget.material && 'emissiveIntensity' in missionTarget.material) {
        missionTarget.material.emissiveIntensity = 0.5;
      }
    });
    this.activeCombatTargets = this.missionTargets.slice();
    this.fireController?.setTargets(this.activeCombatTargets);
  }

  restoreObjective() {
    if (this.objectiveMarker) {
      this.objectiveMarker.visible = true;
    }
  }

  findMissionTarget(hostileId) {
    const id = String(hostileId || '').trim();
    return this.missionTargets.find((target) => (
      target.userData?.missionTargetId === id ||
      target.userData?.hostileId === id ||
      target.name === id
    )) || null;
  }

  applyMissionState(snapshot, hostileSnapshot = null) {
    if (!snapshot) {
      return;
    }
    this.setHudValue('objective', snapshot.objectiveText);
    this.setHudValue('missionState', snapshot.statusText || snapshot.state);
    this.setHudValue('health', snapshot.healthText || String(snapshot.playerHealth));
    this.setHudValue('threat', this.formatThreatText(hostileSnapshot, snapshot));
    this.setHudValue('result', this.formatResultText(snapshot, hostileSnapshot));
    this.setMissionOutcomePresentation(snapshot);
  }

  formatThreatText(hostileSnapshot, missionSnapshot) {
    const remaining = missionSnapshot?.remainingText || '';
    const hostileStateText = hostileSnapshot?.hostiles?.map((hostile) => hostile.hostileId + ':' + hostile.state).join(' | ') || 'INACTIVE';
    return remaining ? 'REMAINING ' + remaining + ' // ' + hostileStateText : hostileStateText;
  }

  formatResultText(snapshot, hostileSnapshot) {
    if (snapshot.failureText || snapshot.successText) {
      return snapshot.failureText || snapshot.successText;
    }
    if (hostileSnapshot?.defeatTriggered) {
      return 'HOSTILE DEFEATED // ' + hostileSnapshot.defeatedHostileId;
    }
    if (hostileSnapshot?.damageTriggered) {
      return 'DAMAGE ' + hostileSnapshot.damageAmount + ' // ' + (hostileSnapshot.damageEvents || []).map((event) => event.hostileId).join(', ');
    }
    if (hostileSnapshot?.restartTriggered) {
      return 'RESTARTED // ' + this.levelResolution.activeId;
    }
    return 'HOSTILES ACTIVE';
  }

  setMissionOutcomePresentation(snapshot) {
    this.root.classList.toggle('is-mission-complete', Boolean(snapshot.completed));
    this.root.classList.toggle('is-mission-failed', Boolean(snapshot.failed));
  }

  updateLevelDiagnostics(prefix = '') {
    const requested = this.levelResolution.requestedId || '(default)';
    const fallback = this.levelResolution.didFallback ? ' // FALLBACK ' + this.levelResolution.fallbackReason + ' -> ' + this.levelResolution.activeId : ' // NO FALLBACK';
    const details = 'LEVEL REQUESTED: ' + requested + ' // ACTIVE: ' + this.levelResolution.activeId + fallback;
    const payloadDiagnostic = this.root.querySelector('[data-ooh-playable-diagnostic]');
    if (payloadDiagnostic) {
      const base = prefix ? prefix + ' ' : '';
      payloadDiagnostic.textContent = base + details + ' // MISSION: ' + (this.bootstrap.missionId || this.levelDefinition.mission.id || 'unavailable');
    }
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

  handlePointerLockChange(locked) {
    if (!locked) {
      this.input?.clear();
      if (this.active) {
        this.pause({ releasePointer: false });
      }
    }
    this.updateHud(true);
  }

  handleVisibilityChange() {
    if (document.hidden && this.active) {
      this.pause();
    }
  }

  updateHud(force = false) {
    if (!this.player) {
      return;
    }
    const now = performance.now();
    const state = this.player.getHudState(this.pointerLock?.isLocked());
    const encoded = JSON.stringify(state);
    if (!force && encoded === this.lastHudState && now - this.lastHudUpdate < 120) {
      return;
    }
    this.lastHudState = encoded;
    this.lastHudUpdate = now;
    this.setHudValue('lock', state.lock);
    this.setHudValue('grounded', state.grounded);
    this.setHudValue('speed', state.speed);
    this.setHudValue('coordinates', state.coordinates);
  }

  setHudValue(key, value) {
    const el = this.root.querySelector('[data-ooh-playable-state="' + key + '"]');
    if (el && el.textContent !== value) {
      el.textContent = value;
    }
  }
}
