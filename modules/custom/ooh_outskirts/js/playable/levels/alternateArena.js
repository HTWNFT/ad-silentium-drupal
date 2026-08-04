export const alternateArena = Object.freeze({
  id: 'alternate_arena',
  debugName: 'Alternate Arena',
  mission: Object.freeze({
    id: 'alternate_arena_test',
    type: 'combat_foundation',
    objectiveText: 'Destroy both required hostiles in the alternate arena.'
  }),
  environment: Object.freeze({
    id: 'alternate_technical',
    biomeId: 'technical_arena'
  }),
  player: Object.freeze({
    spawn: Object.freeze({ x: -6.4, y: 0, z: -6.2 }),
    facing: Object.freeze({ yaw: -2.35, pitch: 0 })
  }),
  objective: Object.freeze({
    id: 'alternate-payload-marker',
    position: Object.freeze({ x: -4.4, y: 0.55, z: 4.8 }),
    required: true
  }),
  scene: Object.freeze({
    floorSize: 22,
    boundaryHalfSize: 10,
    wallHeight: 3.2,
    primitives: Object.freeze([
      Object.freeze({
        id: 'alternate-orientation-beacon',
        type: 'orientation_beacon',
        visible: true,
        position: Object.freeze({ x: 4.8, y: 0.9, z: 4.2 }),
        collision: true,
        blocksLineOfSight: true
      })
    ])
  }),
  obstacles: Object.freeze([
    Object.freeze({
      id: 'alternate-center-slab',
      position: Object.freeze({ x: -0.4, y: 0.65, z: -0.3 }),
      size: Object.freeze({ x: 2.4, y: 1.3, z: 2.0 }),
      visible: true,
      collision: true,
      blocksLineOfSight: true
    }),
    Object.freeze({
      id: 'alternate-east-cover',
      position: Object.freeze({ x: 4.2, y: 0.45, z: -2.8 }),
      size: Object.freeze({ x: 1.6, y: 0.9, z: 3.2 }),
      visible: true,
      collision: true,
      blocksLineOfSight: true
    })
  ]),
  hostiles: Object.freeze([
    Object.freeze({
      id: 'alternate-hostile-01',
      name: 'alternate-hostile-01',
      position: Object.freeze({ x: 5.8, y: 0.675, z: 5.4 }),
      maxHealth: 1,
      detectionRadius: 7.25,
      attackRadius: 4.2,
      attackDamage: 10,
      attackInterval: 1.55,
      alertDelay: 0.5,
      required: true
    }),
    Object.freeze({
      id: 'alternate-hostile-02',
      name: 'alternate-hostile-02',
      position: Object.freeze({ x: -2.4, y: 0.675, z: 6.1 }),
      maxHealth: 2,
      detectionRadius: 9.25,
      attackRadius: 4.8,
      attackDamage: 8,
      attackInterval: 1.05,
      alertDelay: 0.35,
      required: true
    })
  ]),
  conditions: Object.freeze({
    success: Object.freeze({ type: 'all_required_hostiles_defeated' }),
    failure: Object.freeze({ type: 'player_health_zero' })
  }),
  timer: null,
  metadata: Object.freeze({
    routeId: '',
    playlistId: '',
    payloadId: ''
  })
});
