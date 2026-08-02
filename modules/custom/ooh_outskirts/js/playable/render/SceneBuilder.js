import { TEST_SCENE } from '../core/AssetManifest.js';

function boxCollider(center, size, category = 'obstacle') {
  return {
    category,
    minX: center.x - size.x / 2,
    maxX: center.x + size.x / 2,
    minZ: center.z - size.z / 2,
    maxZ: center.z + size.z / 2
  };
}

export function buildTestScene(THREE, bootstrap) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080c);
  scene.fog = new THREE.Fog(0x06080c, 12, 34);

  const floorGeometry = new THREE.PlaneGeometry(TEST_SCENE.floorSize, TEST_SCENE.floorSize, 10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.82, metalness: 0.08 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(TEST_SCENE.floorSize, 22, 0x00e5ff, 0x1c3b44);
  grid.position.y = 0.012;
  scene.add(grid);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x151d26, roughness: 0.74, metalness: 0.15 });
  const wallLength = TEST_SCENE.floorSize;
  const wallDepth = 0.28;
  const wallHeight = TEST_SCENE.wallHeight;
  const boundary = TEST_SCENE.boundaryHalfSize;
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
    color: TEST_SCENE.orientationObjectColor,
    emissive: TEST_SCENE.orientationObjectColor,
    emissiveIntensity: 0.65,
    roughness: 0.35
  });
  const beacon = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.8, 5), beaconMaterial);
  beacon.position.set(0, 0.9, -4.5);
  beacon.name = 'orientation-beacon';
  scene.add(beacon);

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: TEST_SCENE.accentObjectColor,
    emissive: TEST_SCENE.accentObjectColor,
    emissiveIntensity: 0.28,
    roughness: 0.45
  });
  const payloadMarker = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), accentMaterial);
  payloadMarker.position.set(3.25, 0.55, -2.4);
  payloadMarker.name = 'payload-marker';
  scene.add(payloadMarker);

  const obstacleSize = TEST_SCENE.obstacle.size;
  const obstacleHeight = TEST_SCENE.obstacle.height;
  const obstaclePosition = TEST_SCENE.obstacle.position;
  const obstacle = new THREE.Mesh(new THREE.BoxGeometry(obstacleSize, obstacleHeight, obstacleSize), wallMaterial);
  obstacle.position.set(obstaclePosition.x, obstacleHeight / 2, obstaclePosition.z);
  obstacle.name = 'field-obstacle';
  scene.add(obstacle);

  scene.add(new THREE.HemisphereLight(0x8ab7ff, 0x131015, 1.15));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3.5, 6, 4);
  scene.add(keyLight);
  scene.userData.phaseLabel = String(bootstrap.missionTitle || 'Mission Payload').trim() || 'Mission Payload';

  return {
    scene,
    animatedObjects: [beacon, payloadMarker],
    collisionWorld: {
      bounds: {
        minX: -boundary,
        maxX: boundary,
        minZ: -boundary,
        maxZ: boundary
      },
      obstacles: [
        boxCollider({ x: beacon.position.x, z: beacon.position.z }, { x: 1.5, z: 1.5 }, 'beacon'),
        boxCollider({ x: payloadMarker.position.x, z: payloadMarker.position.z }, { x: 1.1, z: 1.1 }, 'payload-marker'),
        boxCollider(obstaclePosition, { x: obstacleSize, z: obstacleSize }, 'field-obstacle')
      ]
    }
  };
}
