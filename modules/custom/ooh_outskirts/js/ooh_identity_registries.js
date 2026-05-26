(function (window) {
  'use strict';

  const soundtrackRegistry = Object.freeze({
    STEEL_WRECKONING: Object.freeze({
      id: 'STEEL_WRECKONING',
      displayName: 'Steel Wreckoning',
      playlistPlaceholder: 'spotify:playlist:STEEL_WRECKONING_PLACEHOLDER',
      transitionCategory: 'mission-pressure',
      pressureProfile: 'rising-industrial-conflict',
      fallbackIdentity: 'SILENT_APPROACH',
      continuityBehavior: 'continue-until-authored-boundary'
    }),
    SIGNAL_COLLAPSE: Object.freeze({
      id: 'SIGNAL_COLLAPSE',
      displayName: 'Signal Collapse',
      playlistPlaceholder: 'spotify:playlist:SIGNAL_COLLAPSE_PLACEHOLDER',
      transitionCategory: 'instability-collapse',
      pressureProfile: 'signal-decay-critical',
      fallbackIdentity: 'SILENT_APPROACH',
      continuityBehavior: 'preserve-current-track-unless-collapse-boundary'
    }),
    ASHEN_FRONTIER: Object.freeze({
      id: 'ASHEN_FRONTIER',
      displayName: 'Ashen Frontier',
      playlistPlaceholder: 'spotify:playlist:ASHEN_FRONTIER_PLACEHOLDER',
      transitionCategory: 'mission-start',
      pressureProfile: 'wide-field-low-burn',
      fallbackIdentity: 'SILENT_APPROACH',
      continuityBehavior: 'establish-on-mission-start'
    }),
    SILENT_APPROACH: Object.freeze({
      id: 'SILENT_APPROACH',
      displayName: 'Silent Approach',
      playlistPlaceholder: 'spotify:playlist:SILENT_APPROACH_PLACEHOLDER',
      transitionCategory: 'fallback',
      pressureProfile: 'minimal-covert-tension',
      fallbackIdentity: 'SILENT_APPROACH',
      continuityBehavior: 'hold-until-explicit-replacement'
    })
  });

  const sectorLightRegistry = Object.freeze({
    ORANGE_DUSK: Object.freeze({
      id: 'ORANGE_DUSK',
      label: 'Orange Dusk',
      atmosphereNotes: 'Warm horizon pressure, long operational shadows, exposed approach tension.',
      contrastProfile: 'warm-high-shadow',
      visibilityProfile: 'clear-midrange-with-shadow-risk',
      reflectiveBehaviorNotes: 'Low glints on metal, dust, and glass edges.',
      pressureCompatibility: ['insertion', 'contact', 'extraction']
    }),
    PALE_CYAN_SIGNAL: Object.freeze({
      id: 'PALE_CYAN_SIGNAL',
      label: 'Pale Cyan Signal',
      atmosphereNotes: 'Cold relay light, scanner presence, unstable communications.',
      contrastProfile: 'cool-electronic-medium',
      visibilityProfile: 'sharp-nearfield-with-signal-haze',
      reflectiveBehaviorNotes: 'Thin highlights on terminals, cables, and wet surfaces.',
      pressureCompatibility: ['scan', 'instability', 'collapse-risk']
    }),
    WASHED_GRAY_DAYLIGHT: Object.freeze({
      id: 'WASHED_GRAY_DAYLIGHT',
      label: 'Washed Gray Daylight',
      atmosphereNotes: 'Flat depleted daylight, aftermath visibility, drained terrain.',
      contrastProfile: 'low-desaturated',
      visibilityProfile: 'broad-readable-muted-depth',
      reflectiveBehaviorNotes: 'Reduced glare, matte surfaces, exhausted ambient bounce.',
      pressureCompatibility: ['insertion', 'hold', 'debrief']
    }),
    FLUORESCENT_INDUSTRIAL: Object.freeze({
      id: 'FLUORESCENT_INDUSTRIAL',
      label: 'Fluorescent Industrial',
      atmosphereNotes: 'Hard utility light, institutional fatigue, controlled interior pressure.',
      contrastProfile: 'hard-overhead-green-white',
      visibilityProfile: 'sharp-local-with-deep-corners',
      reflectiveBehaviorNotes: 'Harsh specular hits on tile, enamel, conduit, and glass.',
      pressureCompatibility: ['contact', 'hold', 'critical']
    }),
    MOONLIT_TRENCH: Object.freeze({
      id: 'MOONLIT_TRENCH',
      label: 'Moonlit Trench',
      atmosphereNotes: 'Blue-black field, narrow paths, silhouettes, wet cover.',
      contrastProfile: 'dark-cool-high-silhouette',
      visibilityProfile: 'limited-distance-clear-contours',
      reflectiveBehaviorNotes: 'Wet-edge highlights and narrow sky reflections.',
      pressureCompatibility: ['silent-approach', 'contact', 'extraction']
    }),
    REFLECTIVE_MARSH: Object.freeze({
      id: 'REFLECTIVE_MARSH',
      label: 'Reflective Marsh',
      atmosphereNotes: 'Soft bounced light, broken water reflections, uncertain depth.',
      contrastProfile: 'soft-mixed-reflective',
      visibilityProfile: 'uneven-depth-with-surface-confusion',
      reflectiveBehaviorNotes: 'Water glare, reed shimmer, and fractured sky bounce.',
      pressureCompatibility: ['insertion', 'scan', 'instability']
    }),
    SPECTRAL_OVEREXPOSED: Object.freeze({
      id: 'SPECTRAL_OVEREXPOSED',
      label: 'Spectral Overexposed',
      atmosphereNotes: 'Bleached highlights, bloom pressure, unreal visibility, detail loss.',
      contrastProfile: 'high-key-low-detail',
      visibilityProfile: 'bright-nearfield-with-washed-distance',
      reflectiveBehaviorNotes: 'Bloomed edges, white glare, and unstable reflective wash.',
      pressureCompatibility: ['collapse-risk', 'failure', 'liminal']
    })
  });

  const environmentRegistry = Object.freeze({
    DEAD_RIVERBED: Object.freeze({
      id: 'dead-riverbed',
      label: 'Dead Riverbed',
      sectorLightIdentity: 'WASHED_GRAY_DAYLIGHT',
      soundtrackIdentity: 'STEEL_WRECKONING',
      cadenceVocabulary: 'ash-haze-operational',
      routePressureVocabulary: 'funnelled-field-channel',
      manifestationVocabulary: 'distant-shape-trace'
    }),
    UTILITY_CORRIDOR: Object.freeze({
      id: 'utility-corridor',
      label: 'Utility Corridor',
      sectorLightIdentity: 'FLUORESCENT_INDUSTRIAL',
      soundtrackIdentity: 'STEEL_WRECKONING',
      cadenceVocabulary: 'service-line-static',
      routePressureVocabulary: 'flooded-concrete-return',
      manifestationVocabulary: 'fence-line-contact'
    }),
    INDUSTRIAL_MARSH: Object.freeze({
      id: 'industrial-marsh',
      label: 'Industrial Marsh',
      sectorLightIdentity: 'REFLECTIVE_MARSH',
      soundtrackIdentity: 'SIGNAL_COLLAPSE',
      cadenceVocabulary: 'waterline-interference',
      routePressureVocabulary: 'submerged-signal-bed',
      manifestationVocabulary: 'ripple-pattern-contact'
    }),
    SIGNAL_GROVE: Object.freeze({
      id: 'signal-grove',
      label: 'Signal Grove',
      sectorLightIdentity: 'PALE_CYAN_SIGNAL',
      soundtrackIdentity: 'SIGNAL_COLLAPSE',
      cadenceVocabulary: 'root-static-beacon',
      routePressureVocabulary: 'narrow-signal-passage',
      manifestationVocabulary: 'split-trace-presence'
    }),
    AERIAL_TRENCH_GATE: Object.freeze({
      id: 'aerial-trench-gate',
      label: 'Trench Gate',
      sectorLightIdentity: 'MOONLIT_TRENCH',
      soundtrackIdentity: 'ASHEN_FRONTIER',
      cadenceVocabulary: 'stormfront-corridor',
      routePressureVocabulary: 'gate-arch-extraction',
      manifestationVocabulary: 'trench-wall-pressure'
    }),
    BUNKER_APPROACH: Object.freeze({
      id: 'bunker-approach',
      label: 'Bunker Approach',
      sectorLightIdentity: 'SPECTRAL_OVEREXPOSED',
      soundtrackIdentity: 'SILENT_APPROACH',
      cadenceVocabulary: 'buried-signal-pulse',
      routePressureVocabulary: 'thin-signal-path',
      manifestationVocabulary: 'subsurface-pressure'
    })
  });

  window.OOHIdentityRegistries = Object.freeze({
    soundtrack: soundtrackRegistry,
    sectorLight: sectorLightRegistry,
    environment: environmentRegistry
  });
})(window);
