function boxCollider(center, size, category = 'obstacle') {
  const collider = {
    category,
    minX: center.x - size.x / 2,
    maxX: center.x + size.x / 2,
    minZ: center.z - size.z / 2,
    maxZ: center.z + size.z / 2
  };
  if (Number.isFinite(size.y) && size.y > 0) {
    collider.topY = size.y;
  }
  return collider;
}

function createHostileTarget(THREE, material, definition) {
  const target = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.35, 24), material.clone());
  target.position.set(definition.position.x, definition.position.y, definition.position.z);
  target.name = definition.name;
  target.userData.combatTarget = true;
  target.userData.missionTarget = true;
  target.userData.missionTargetId = definition.id;
  target.userData.hostile = true;
  target.userData.hostileId = definition.id;
  target.userData.destroyed = false;
  return target;
}

function createOrientationBeacon(THREE, material, definition) {
  const beacon = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.8, 5), material.clone());
  beacon.position.set(definition.position.x, definition.position.y, definition.position.z);
  beacon.name = definition.id;
  beacon.userData.scenePrimitiveId = definition.id;
  return beacon;
}

function createObjectiveMarker(THREE, material, definition) {
  const marker = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), material.clone());
  marker.position.set(definition.position.x, definition.position.y, definition.position.z);
  marker.name = definition.id;
  marker.userData.objective = true;
  marker.userData.objectiveId = definition.id;
  return marker;
}

function createObstacle(THREE, material, definition) {
  const obstacle = new THREE.Mesh(new THREE.BoxGeometry(definition.size.x, definition.size.y, definition.size.z), material.clone());
  obstacle.position.set(definition.position.x, definition.position.y, definition.position.z);
  obstacle.name = definition.id;
  obstacle.visible = definition.visible !== false;
  obstacle.userData.obstacle = true;
  obstacle.userData.obstacleId = definition.id;
  return obstacle;
}

function atmosphereConfig(runtimeConfig = {}) {
  const atmosphereId = String((runtimeConfig.atmosphere || {}).atmosphereId || '').trim();
  const presets = {
    technical_arena: {
      background: 0x06080c,
      fog: 0x06080c,
      fogNear: 12,
      fogFar: 34,
      floor: 0x111820,
      wall: 0x151d26,
      gridCenter: 0x00e5ff,
      gridLine: 0x1c3b44,
      hemisphereSky: 0x8ab7ff,
      hemisphereGround: 0x131015,
      hemisphereIntensity: 1.15,
      key: 0xffffff,
      keyIntensity: 2.2
    },
    alternate_technical: {
      background: 0x071016,
      fog: 0x071016,
      fogNear: 10,
      fogFar: 31,
      floor: 0x132022,
      wall: 0x1d272a,
      gridCenter: 0xffd166,
      gridLine: 0x31515a,
      hemisphereSky: 0xffd6a5,
      hemisphereGround: 0x171018,
      hemisphereIntensity: 1.08,
      key: 0xfff1c7,
      keyIntensity: 2.05
    },
    dead_riverbed: {
      background: 0x0a0908,
      fog: 0x17100d,
      fogNear: 9,
      fogFar: 29,
      floor: 0x211b16,
      wall: 0x2b2119,
      gridCenter: 0xff9f1c,
      gridLine: 0x4b3121,
      hemisphereSky: 0xd6b083,
      hemisphereGround: 0x1b120d,
      hemisphereIntensity: 1.1,
      key: 0xffcc88,
      keyIntensity: 2.1
    },
    industrial_marsh: {
      background: 0x071316,
      fog: 0x0b262c,
      fogNear: 8,
      fogFar: 27,
      floor: 0x0e2527,
      wall: 0x183033,
      gridCenter: 0x4de0d2,
      gridLine: 0x1d565a,
      hemisphereSky: 0x78fff0,
      hemisphereGround: 0x071515,
      hemisphereIntensity: 1.18,
      key: 0xb7fff6,
      keyIntensity: 1.95
    },
    aerial_trench_gate: {
      background: 0x070b18,
      fog: 0x101936,
      fogNear: 11,
      fogFar: 36,
      floor: 0x10172a,
      wall: 0x182343,
      gridCenter: 0x76e7ff,
      gridLine: 0x253e72,
      hemisphereSky: 0xa9c7ff,
      hemisphereGround: 0x090b16,
      hemisphereIntensity: 1.2,
      key: 0xd9e6ff,
      keyIntensity: 2.3
    }
  };
  return presets[atmosphereId] || presets.technical_arena;
}

export function buildTestScene(THREE, levelDefinition, bootstrap = {}, runtimeConfig = {}) {
  const atmosphere = atmosphereConfig(runtimeConfig);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(atmosphere.background);
  scene.fog = new THREE.Fog(atmosphere.fog, atmosphere.fogNear, atmosphere.fogFar);

  const sceneConfig = levelDefinition.scene;
  const floorGeometry = new THREE.PlaneGeometry(sceneConfig.floorSize, sceneConfig.floorSize, 10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: atmosphere.floor, roughness: 0.82, metalness: 0.08 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(sceneConfig.floorSize, 22, atmosphere.gridCenter, atmosphere.gridLine);
  grid.position.y = 0.012;
  scene.add(grid);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: atmosphere.wall, roughness: 0.74, metalness: 0.15 });
  const wallLength = sceneConfig.floorSize;
  const wallDepth = 0.28;
  const wallHeight = sceneConfig.wallHeight;
  const boundary = sceneConfig.boundaryHalfSize;
  const wallGeometry = new THREE.BoxGeometry(wallLength, wallHeight, wallDepth);
  const sideWallGeometry = new THREE.BoxGeometry(wallDepth, wallHeight, wallLength);

  [
    { geometry: wallGeometry, position: [0, wallHeight / 2, -boundary] },
    { geometry: wallGeometry, position: [0, wallHeight / 2, boundary] },
    { geometry: sideWallGeometry, position: [-boundary, wallHeight / 2, 0] },
    { geometry: sideWallGeometry, position: [boundary, wallHeight / 2, 0] }
  ].forEach((definition) => {
    const wall = new THREE.Mesh(definition.geometry, wallMaterial);
    wall.position.set(...definition.position);
    scene.add(wall);
  });

  const beaconMaterial = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.65,
    roughness: 0.35
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xff375f,
    emissive: 0xff375f,
    emissiveIntensity: 0.28,
    roughness: 0.45
  });
  const targetMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff36a,
    emissive: 0xff8a00,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.08
  });

  const animatedObjects = [];
  const collisionObstacles = [];

  (sceneConfig.primitives || []).forEach((definition) => {
    if (definition.type !== 'orientation_beacon' || definition.visible === false) {
      return;
    }
    const beacon = createOrientationBeacon(THREE, beaconMaterial, definition);
    scene.add(beacon);
    animatedObjects.push(beacon);
    if (definition.collision) {
      collisionObstacles.push(boxCollider(definition.position, { x: 1.5, z: 1.5 }, definition.id));
    }
  });

  const objectiveMarker = createObjectiveMarker(THREE, accentMaterial, levelDefinition.objective);
  scene.add(objectiveMarker);
  animatedObjects.push(objectiveMarker);
  collisionObstacles.push(boxCollider(levelDefinition.objective.position, { x: 1.1, z: 1.1 }, levelDefinition.objective.id));

  (levelDefinition.obstacles || []).forEach((definition) => {
    const obstacle = createObstacle(THREE, wallMaterial, definition);
    scene.add(obstacle);
    if (definition.collision) {
      collisionObstacles.push(boxCollider(definition.position, definition.size, definition.id));
    }
  });

  const combatTargets = (levelDefinition.hostiles || []).map((definition) => {
    const target = createHostileTarget(THREE, targetMaterial, definition);
    scene.add(target);
    return target;
  });
  animatedObjects.push(...combatTargets);

  scene.add(new THREE.HemisphereLight(atmosphere.hemisphereSky, atmosphere.hemisphereGround, atmosphere.hemisphereIntensity));
  const keyLight = new THREE.DirectionalLight(atmosphere.key, atmosphere.keyIntensity);
  keyLight.position.set(3.5, 6, 4);
  scene.add(keyLight);
  scene.userData.phaseLabel = String(bootstrap.missionTitle || levelDefinition.debugName || 'Mission Payload').trim() || 'Mission Payload';
  scene.userData.levelId = levelDefinition.id;
  scene.userData.atmosphereId = String((runtimeConfig.atmosphere || {}).atmosphereId || 'technical_arena');

  return {
    scene,
    animatedObjects,
    combatTargets,
    objectiveMarker,
    collisionWorld: {
      bounds: {
        minX: -boundary,
        maxX: boundary,
        minZ: -boundary,
        maxZ: boundary
      },
      obstacles: collisionObstacles
    }
  };
}
