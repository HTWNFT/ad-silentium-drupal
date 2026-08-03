const FIRE_COOLDOWN = 0.16;
const SHOT_MARKER_LIFETIME = 0.55;
const HIT_MARKER_LIFETIME = 0.85;
const HIT_FLASH_LIFETIME = 0.65;
const RAYCAST_DISTANCE = 36;

export class FireController {
  constructor(THREE, {
    camera = null,
    scene = null,
    targets = [],
    onShot = null
  } = {}) {
    this.THREE = THREE;
    this.camera = camera;
    this.scene = scene;
    this.targets = [];
    this.onShot = onShot;
    this.raycaster = new THREE.Raycaster();
    this.origin = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.cooldown = 0;
    this.effects = [];
    this.setTargets(targets);
  }

  setTargets(targets = []) {
    const uniqueTargets = [];
    (Array.isArray(targets) ? targets : []).forEach((target) => {
      if (target && !uniqueTargets.includes(target)) {
        uniqueTargets.push(target);
      }
    });
    this.targets = uniqueTargets;
  }

  fire() {
    if (this.cooldown > 0 || !this.camera || !this.scene) {
      return null;
    }

    this.cooldown = FIRE_COOLDOWN;
    this.scene.updateMatrixWorld(true);
    this.camera.getWorldPosition(this.origin);
    this.camera.getWorldDirection(this.direction);
    this.raycaster.set(this.origin, this.direction);
    this.raycaster.far = RAYCAST_DISTANCE;

    const raycastTargets = this.targets.filter((target) => target?.visible !== false && target?.userData?.destroyed !== true);
    const hits = this.raycaster.intersectObjects(raycastTargets, false);
    const hit = hits.find((entry) => entry.object?.userData?.combatTarget === true) || null;
    this.addShotMarker(hit);

    if (hit) {
      this.flashTarget(hit.object);
    }

    const result = {
      hit: Boolean(hit),
      targetName: hit?.object?.name || '',
      targetId: hit?.object?.userData?.missionTargetId || '',
      targetObject: hit?.object || null,
      distance: hit ? hit.distance : RAYCAST_DISTANCE
    };
    this.onShot?.(result);
    return result;
  }

  update(delta) {
    this.cooldown = Math.max(0, this.cooldown - delta);
    this.effects = this.effects.filter((effect) => {
      effect.remaining -= delta;
      const progress = Math.max(0, effect.remaining / effect.lifetime);

      if (effect.type === 'marker') {
        effect.object.material.opacity = progress;
        effect.object.scale.setScalar(1 + (1 - progress) * 1.8);
      }
      else if (effect.type === 'targetFlash') {
        effect.object.material.emissiveIntensity = effect.baseIntensity + progress * 4.5;
        effect.object.scale.setScalar(1 + progress * 0.38);
      }

      if (effect.remaining > 0) {
        return true;
      }

      if (effect.type === 'marker') {
        this.scene?.remove(effect.object);
        effect.object.geometry.dispose();
        effect.object.material.dispose();
      }
      else if (effect.type === 'targetFlash') {
        effect.object.material.emissiveIntensity = effect.baseIntensity;
        effect.object.scale.setScalar(effect.baseScale);
      }

      return false;
    });
  }

  addShotMarker(hit) {
    const point = hit ? hit.point : this.origin.clone().addScaledVector(this.direction, 12);
    const marker = new this.THREE.Mesh(
      new this.THREE.SphereGeometry(hit ? 0.42 : 0.22, 18, 18),
      new this.THREE.MeshBasicMaterial({
        color: hit ? 0xfff36a : 0x76e7ff,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      })
    );
    marker.position.copy(point);
    marker.name = hit ? 'combat-hit-marker' : 'combat-shot-marker';
    this.scene.add(marker);
    this.effects.push({
      type: 'marker',
      object: marker,
      lifetime: hit ? HIT_MARKER_LIFETIME : SHOT_MARKER_LIFETIME,
      remaining: hit ? HIT_MARKER_LIFETIME : SHOT_MARKER_LIFETIME
    });
  }

  flashTarget(target) {
    if (!target?.material || !('emissiveIntensity' in target.material)) {
      return;
    }

    this.effects = this.effects.filter((effect) => {
      if (effect.type !== 'targetFlash' || effect.object !== target) {
        return true;
      }
      effect.object.material.emissiveIntensity = effect.baseIntensity;
      effect.object.scale.setScalar(effect.baseScale);
      return false;
    });

    this.effects.push({
      type: 'targetFlash',
      object: target,
      baseIntensity: target.material.emissiveIntensity,
      baseScale: target.scale.x,
      lifetime: HIT_FLASH_LIFETIME,
      remaining: HIT_FLASH_LIFETIME
    });
  }

  clearTargetEffects(target) {
    this.effects = this.effects.filter((effect) => {
      if (effect.type !== 'targetFlash' || effect.object !== target) {
        return true;
      }
      effect.object.material.emissiveIntensity = effect.baseIntensity;
      effect.object.scale.setScalar(effect.baseScale);
      return false;
    });
  }

  destroy() {
    this.effects.forEach((effect) => {
      if (effect.type === 'marker') {
        this.scene?.remove(effect.object);
        effect.object.geometry.dispose();
        effect.object.material.dispose();
      }
      else if (effect.type === 'targetFlash') {
        effect.object.material.emissiveIntensity = effect.baseIntensity;
        effect.object.scale.setScalar(effect.baseScale);
      }
    });
    this.effects = [];
    this.targets = [];
    this.camera = null;
    this.scene = null;
  }
}