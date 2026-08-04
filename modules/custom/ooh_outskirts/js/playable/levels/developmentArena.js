export const developmentArena = Object.freeze({
  id: 'development_arena',
  debugName: 'Development Arena',
  mission: Object.freeze({
    id: 'phase_6_baseline',
    type: 'combat_foundation',
    objectiveText: 'Destroy all hostiles before they drop your health to zero.'
  }),
  environment: Object.freeze({
    id: 'development',
    biomeId: 'technical_arena'
  }),
  player: Object.freeze({
    spawn: Object.freeze({ x: 0, y: 0, z: 6.8 }),
    facing: Object.freeze({ yaw: 0, pitch: 0 })
  }),
  objective: Object.freeze({
    id: 'phase-6-payload-marker',
    position: Object.freeze({ x: 3.25, y: 0.55, z: -2.4 }),
    required: true
  }),
  scene: Object.freeze({
    floorSize: 22,
    boundaryHalfSize: 10,
    wallHeight: 3.2,
    primitives: Object.freeze([
      Object.freeze({
        id: 'orientation-beacon',
        type: 'orientation_beacon',
        visible: true,
        position: Object.freeze({ x: 0, y: 0.9, z: -4.5 }),
        collision: true,
        blocksLineOfSight: true
      })
    ])
  }),
  obstacles: Object.freeze([
    Object.freeze({
      id: 'field-obstacle',
      position: Object.freeze({ x: -2.8, y: 0.45, z: -1.6 }),
      size: Object.freeze({ x: 1.8, y: 0.9, z: 1.8 }),
      visible: true,
      collision: true,
      blocksLineOfSight: true
    })
  ]),
  hostiles: Object.freeze([
    Object.freeze({
      id: 'phase-6-hostile-01',
      name: 'phase-six-hostile-01',
      position: Object.freeze({ x: 6, y: 0.675, z: -5.8 }),
      maxHealth: 1,
      detectionRadius: 8.5,
      attackRadius: 4.5,
      attackDamage: 10,
      attackInterval: 1.25,
      alertDelay: 0.45,
      required: true
    }),
    Object.freeze({
      id: 'phase-6-hostile-02',
      name: 'phase-six-hostile-02',
      position: Object.freeze({ x: 1.4, y: 0.675, z: -6.6 }),
      maxHealth: 1,
      detectionRadius: 8.5,
      attackRadius: 4.5,
      attackDamage: 10,
      attackInterval: 1.43,
      alertDelay: 0.53,
      required: true
    }),
    Object.freeze({
      id: 'phase-6-hostile-03',
      name: 'phase-six-hostile-03',
      position: Object.freeze({ x: -5.2, y: 0.675, z: -4.7 }),
      maxHealth: 1,
      detectionRadius: 8.5,
      attackRadius: 4.5,
      attackDamage: 10,
      attackInterval: 1.61,
      alertDelay: 0.61,
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
