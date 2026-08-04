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

export function buildTestScene(THREE, levelDefinition, bootstrap = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080c);
  scene.fog = new THREE.Fog(0x06080c, 12, 34);

  const sceneConfig = levelDefinition.scene;
  const floorGeometry = new THREE.PlaneGeometry(sceneConfig.floorSize, sceneConfig.floorSize, 10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.82, metalness: 0.08 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(sceneConfig.floorSize, 22, 0x00e5ff, 0x1c3b44);
  grid.position.y = 0.012;
  scene.add(grid);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x151d26, roughness: 0.74, metalness: 0.15 });
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

  scene.add(new THREE.HemisphereLight(0x8ab7ff, 0x131015, 1.15));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3.5, 6, 4);
  scene.add(keyLight);
  scene.userData.phaseLabel = String(bootstrap.missionTitle || levelDefinition.debugName || 'Mission Payload').trim() || 'Mission Payload';
  scene.userData.levelId = levelDefinition.id;

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
