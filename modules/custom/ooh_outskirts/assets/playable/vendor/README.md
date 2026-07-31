# Playable Mission Vendor Assets

This directory contains the local browser runtime dependency used by the isolated Ad Silentium playable mission foundation.

## Three.js

- Three.js release: r184
- Package version: 0.184.0
- Source: official mrdoob/three.js GitHub release tag r184
- Runtime strategy: local ES modules only; no public CDN is used.

Required vendored files:

| File | Source path | Size | SHA-256 |
| --- | --- | ---: | --- |
| three.module.min.js | build/three.module.min.js | 364998 | 36A60B0120335F89A80A0DAB70292292B0EC414B3D05E83CD09A3EA428C6712A |
| three.core.min.js | build/three.core.min.js | 384222 | 6486AA0D719CFA87EC88DC47223B59B1FB8417A1A407FC0E52467C943E2F8CC9 |

three.module.min.js imports ./three.core.min.js by relative ES-module path. Both files must remain in this same directory so the browser can resolve the internal Three.js import naturally.

The Drupal library attaches only the scoped application entry module, js/playable/ooh_playable_boot.js. Three.js internals are loaded by the browser through ES-module imports and should not be attached separately as classic scripts.
