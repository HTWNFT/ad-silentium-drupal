(function (Drupal, once) {
  'use strict';

  const escalationStages = [
    {
      id: 'insertion',
      label: 'INSERTION',
      pressure: 'ACTIVE',
      thresholdMs: 0,
      feed: [
        'MISSION FEED ONLINE',
        'YOU ARE INSIDE THE FIELD',
        'SECTOR CONDITIONS SHIFTING'
      ]
    },
    {
      id: 'contact',
      label: 'CONTACT',
      pressure: 'RISING',
      thresholdMs: 14000,
      feed: [
        'MOVEMENT DETECTED BEYOND FIELD LIMIT',
        'HOSTILE PRESSURE FORMING BEYOND THE FIELD',
        'SECTOR PRESSURE ESCALATING'
      ]
    },
    {
      id: 'instability',
      label: 'INSTABILITY',
      pressure: 'UNSTABLE',
      thresholdMs: 32000,
      feed: [
        'SIGNAL STABILITY FALLING',
        'HOSTILE INTERFERENCE INCREASING',
        'CHANNEL NOISE SPREADING'
      ]
    },
    {
      id: 'collapse-risk',
      label: 'COLLAPSE RISK',
      pressure: 'CRITICAL',
      thresholdMs: 54000,
      feed: [
        'SECTOR BOUNDARY LOSING SHAPE',
        'FIELD PRESSURE APPROACHING BREAKPOINT',
        'HOSTILE INTERFERENCE INCREASING'
      ]
    },
    {
      id: 'extraction-window',
      label: 'EXTRACTION WINDOW',
      pressure: 'EXTRACTION',
      thresholdMs: 76000,
      feed: [
        'EXTRACTION WINDOW NARROWING',
        'EXTRACTION CORRIDOR DESTABILIZING',
        'HOLD THE SIGNAL UNTIL THE ROUTE CLEARS'
      ]
    }
  ];

  const actionResponses = {
    scan: [
      'HOSTILE MOVEMENT DETECTED',
      'MOVEMENT DETECTED BEYOND FIELD LIMIT',
      'SIGNAL DISTORTION INCREASING'
    ],
    hold: [
      'SECTOR STABILIZATION HOLDING',
      'OPERATOR ANCHOR CONFIRMED',
      'PRESSURE LINE CONTAINED'
    ],
    signal: [
      'SIGNAL CHECK RETURNED',
      'SIGNAL STABILITY FALLING',
      'CHANNEL NOISE ISOLATED'
    ]
  };

  const runtimeStatePressure = {
    pressure: 'RISING',
    degraded: 'UNSTABLE',
    moving: 'UNSTABLE',
    extraction: 'EXTRACTION',
    lost: 'CRITICAL',
    complete: 'CLEARED'
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function nextFrom(list, index) {
    return list[index % list.length];
  }

  function stageById(id) {
    return escalationStages.filter(function (stage) {
      return stage.id === id;
    })[0] || escalationStages[0];
  }

  function activeElapsed(state) {
    return state.startedAt ? Date.now() - state.startedAt : 0;
  }

  function timedStageIndex(state) {
    const elapsed = activeElapsed(state);
    let index = 0;
    escalationStages.forEach(function (stage, stageIndex) {
      if (elapsed >= stage.thresholdMs) {
        index = stageIndex;
      }
    });
    return index;
  }

  function effectiveStageIndex(root, state) {
    if (!root.classList.contains('is-mission-active')) {
      return 0;
    }

    const actionPressure = Math.floor(state.actionCount / 3);
    const timedPressure = timedStageIndex(state);
    const runtimeState = root.getAttribute('data-ooh-runtime-alive') || '';
    const extractionPressure = runtimeState === 'extraction' || root.classList.contains('is-field-extraction-complete') ? 4 : 0;
    const degradedPressure = runtimeState === 'degraded' || runtimeState === 'lost' ? 3 : 0;

    return clamp(Math.max(actionPressure, timedPressure, extractionPressure, degradedPressure), 0, escalationStages.length - 1);
  }

  function createPanel() {
    const panel = document.createElement('section');
    panel.className = 'ooh-runtime-experience-panel';
    panel.setAttribute('data-ooh-runtime-experience-panel', '');
    panel.setAttribute('aria-label', 'First-person mission feed');

    panel.innerHTML = [
      '<div class="ooh-runtime-experience-panel__head">',
      '<span class="ooh-runtime-experience-panel__label">FIELD EXPERIENCE</span>',
      '<span class="ooh-runtime-experience-panel__stage" data-ooh-runtime-experience-stage>STANDBY</span>',
      '</div>',
      '<div class="ooh-runtime-experience-panel__grid">',
      '<div><span>PRESSURE</span><strong data-ooh-runtime-experience-pressure>QUIET</strong></div>',
      '<div><span>DISTINCTION</span><strong data-ooh-runtime-experience-distinction>0</strong></div>',
      '</div>',
      '<p class="ooh-runtime-experience-panel__feed" data-ooh-runtime-experience-feed>Awaiting mission activation.</p>'
    ].join('');

    return panel;
  }

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'ooh-runtime-experience-overlay';
    overlay.setAttribute('data-ooh-runtime-experience-overlay', '');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = [
      '<span class="ooh-runtime-experience-overlay__scanline"></span>',
      '<span class="ooh-runtime-experience-overlay__sweep"></span>',
      '<span class="ooh-runtime-experience-overlay__interference"></span>'
    ].join('');
    return overlay;
  }

  function ensureExperience(root) {
    const hud = root.querySelector('[data-ooh-active-hud]');
    const visual = root.querySelector('.ooh-play-scene__visual');
    if (!hud || !visual) {
      return null;
    }

    let panel = hud.querySelector('[data-ooh-runtime-experience-panel]');
    if (!panel) {
      panel = createPanel();
      hud.appendChild(panel);
    }

    let overlay = visual.querySelector('[data-ooh-runtime-experience-overlay]');
    if (!overlay) {
      overlay = createOverlay();
      visual.appendChild(overlay);
    }

    return {
      panel: panel,
      overlay: overlay,
      stage: panel.querySelector('[data-ooh-runtime-experience-stage]'),
      pressure: panel.querySelector('[data-ooh-runtime-experience-pressure]'),
      distinction: panel.querySelector('[data-ooh-runtime-experience-distinction]'),
      feed: panel.querySelector('[data-ooh-runtime-experience-feed]')
    };
  }

  function readPressure(root, state, stage) {
    const runtimeState = root.getAttribute('data-ooh-runtime-alive') || '';
    if (runtimeStatePressure[runtimeState]) {
      return runtimeStatePressure[runtimeState];
    }
    if (root.classList.contains('is-field-extraction-complete')) {
      return 'EXTRACTION';
    }
    if (!root.classList.contains('is-mission-active')) {
      return 'QUIET';
    }
    return stage.pressure;
  }

  function updateDistinction(state) {
    const elapsedScore = Math.floor(activeElapsed(state) / 30000);
    const actionScore = Math.floor(state.actionCount / 3);
    const stageScore = state.stageIndex >= 2 ? 1 : 0;
    state.distinction = clamp(Math.max(state.distinction, actionScore + stageScore + elapsedScore), 0, 9);
  }

  function render(root, state, message) {
    const experience = ensureExperience(root);
    if (!experience) {
      return;
    }

    const active = root.classList.contains('is-mission-active');
    state.stageIndex = active ? effectiveStageIndex(root, state) : 0;
    const stage = active ? escalationStages[state.stageIndex] : stageById('insertion');
    const pressure = readPressure(root, state, stage);
    updateDistinction(state);

    root.setAttribute('data-ooh-runtime-experience', active ? 'active' : 'standby');
    root.setAttribute('data-ooh-runtime-experience-stage', active ? stage.id : 'standby');
    root.setAttribute('data-ooh-runtime-experience-pressure', pressure.toLowerCase());
    root.setAttribute('data-ooh-runtime-experience-intensity', String(state.stageIndex));

    experience.overlay.setAttribute('data-ooh-runtime-experience-stage', active ? stage.id : 'standby');
    experience.overlay.setAttribute('data-ooh-runtime-experience-pressure', pressure.toLowerCase());
    experience.stage.textContent = active ? stage.label : 'STANDBY';
    experience.pressure.textContent = pressure;
    experience.distinction.textContent = String(state.distinction);
    experience.feed.textContent = message || (active ? nextFrom(stage.feed, state.feedIndex) : 'Awaiting mission activation.');
  }

  function pulse(root, action) {
    root.setAttribute('data-ooh-runtime-experience-pulse', action);
    window.clearTimeout(root.oohRuntimeExperiencePulseTimer);
    root.oohRuntimeExperiencePulseTimer = window.setTimeout(function () {
      root.removeAttribute('data-ooh-runtime-experience-pulse');
    }, 980);
  }

  function activateRuntime(root, state) {
    state.activated = true;
    state.startedAt = Date.now();
    state.feedIndex = 0;
    state.stageIndex = 0;
    render(root, state, 'YOU ARE INSIDE THE FIELD');
    pulse(root, 'activate');
  }

  function advanceFromAction(root, state, action) {
    if (!root.classList.contains('is-mission-active')) {
      return;
    }

    if (!state.startedAt) {
      state.startedAt = Date.now();
    }

    const responses = actionResponses[action] || escalationStages[state.stageIndex].feed;
    state.actionCount += 1;
    state.feedIndex += 1;
    state.lastAction = action;

    const message = nextFrom(responses, state.actionCount - 1);
    render(root, state, message);
    pulse(root, action);

    if (state.distinction > 0 && state.actionCount % 5 === 0) {
      window.setTimeout(function () {
        render(root, state, 'OPERATOR DISTINCTION UPDATED');
      }, 760);
    }
  }

  function bindActions(root, state) {
    root.querySelectorAll('[data-ooh-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        advanceFromAction(root, state, button.getAttribute('data-ooh-action') || '');
      });
    });
  }

  function observeActivation(root, state) {
    const observer = new MutationObserver(function () {
      const active = root.classList.contains('is-mission-active');
      if (active && !state.activated) {
        activateRuntime(root, state);
        return;
      }
      render(root, state);
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: [
        'class',
        'data-ooh-runtime-alive',
        'data-ooh-extraction-uncertainty'
      ]
    });
  }

  function startFeedLoop(root, state) {
    window.setInterval(function () {
      if (!root.classList.contains('is-mission-active')) {
        render(root, state);
        return;
      }
      if (!state.startedAt) {
        state.startedAt = Date.now();
      }
      state.feedIndex += 1;
      render(root, state);
    }, 5200);
  }

  Drupal.behaviors.oohRuntimeExperience = {
    attach: function (context) {
      once('ooh-runtime-experience', '[data-ooh-play]', context).forEach(function (root) {
        const state = {
          activated: root.classList.contains('is-mission-active'),
          actionCount: 0,
          distinction: 0,
          feedIndex: 0,
          lastAction: '',
          stageIndex: 0,
          startedAt: root.classList.contains('is-mission-active') ? Date.now() : 0
        };

        ensureExperience(root);
        bindActions(root, state);
        observeActivation(root, state);
        startFeedLoop(root, state);
        render(root, state);
      });
    }
  };
})(Drupal, once);
