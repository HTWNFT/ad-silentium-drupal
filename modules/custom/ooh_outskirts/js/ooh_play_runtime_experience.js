(function (Drupal, once) {
  'use strict';

  const actionResponses = {
    scan: [
      'HOSTILE MOVEMENT DETECTED',
      'SECTOR EDGE REVEALED',
      'SIGNAL DISTORTION INCREASING'
    ],
    hold: [
      'SECTOR STABILIZATION HOLDING',
      'OPERATOR ANCHOR CONFIRMED',
      'PRESSURE LINE CONTAINED'
    ],
    signal: [
      'SIGNAL CHECK RETURNED',
      'EXTRACTION WINDOW NARROWING',
      'CHANNEL NOISE ISOLATED'
    ]
  };

  const idleFeed = [
    'MISSION FEED ONLINE',
    'HOSTILE PRESSURE FORMING BEYOND THE FIELD',
    'KEEP THE SIGNAL CLEAN',
    'SECTOR CONDITIONS SHIFTING',
    'OPERATOR DISTINCTION TRACKING LOCAL'
  ];

  const stageLabels = [
    'INSERTION',
    'CONTACT PRESSURE',
    'SECTOR CLEARING',
    'EXTRACTION PRESSURE'
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function nextFrom(list, index) {
    return list[index % list.length];
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

  function readPressure(root, state) {
    const runtimeState = root.getAttribute('data-ooh-runtime-alive') || '';
    if (runtimeState === 'pressure') {
      return 'RISING';
    }
    if (runtimeState === 'degraded' || runtimeState === 'moving') {
      return 'UNSTABLE';
    }
    if (runtimeState === 'extraction' || root.classList.contains('is-field-extraction-complete')) {
      return 'EXTRACTION';
    }
    if (state.stageIndex >= 2) {
      return 'CONTESTED';
    }
    return root.classList.contains('is-mission-active') ? 'ACTIVE' : 'QUIET';
  }

  function render(root, state, message) {
    const experience = ensureExperience(root);
    if (!experience) {
      return;
    }

    const active = root.classList.contains('is-mission-active');
    const pressure = readPressure(root, state);
    const stage = active ? stageLabels[state.stageIndex] : 'STANDBY';

    root.setAttribute('data-ooh-runtime-experience', active ? 'active' : 'standby');
    root.setAttribute('data-ooh-runtime-experience-pressure', pressure.toLowerCase());

    experience.overlay.setAttribute('data-ooh-runtime-experience-pressure', pressure.toLowerCase());
    experience.stage.textContent = stage;
    experience.pressure.textContent = pressure;
    experience.distinction.textContent = String(state.distinction);
    experience.feed.textContent = message || (active ? nextFrom(idleFeed, state.feedIndex) : 'Awaiting mission activation.');
  }

  function pulse(root, action) {
    root.setAttribute('data-ooh-runtime-experience-pulse', action);
    window.clearTimeout(root.oohRuntimeExperiencePulseTimer);
    root.oohRuntimeExperiencePulseTimer = window.setTimeout(function () {
      root.removeAttribute('data-ooh-runtime-experience-pulse');
    }, 900);
  }

  function advanceFromAction(root, state, action) {
    if (!root.classList.contains('is-mission-active')) {
      return;
    }

    const responses = actionResponses[action] || idleFeed;
    state.actionCount += 1;
    state.feedIndex += 1;
    state.stageIndex = clamp(Math.floor(state.actionCount / 2), 0, stageLabels.length - 1);

    if (action === 'scan' || action === 'hold' || state.actionCount % 3 === 0) {
      state.distinction += 1;
    }

    const message = nextFrom(responses, state.actionCount - 1);
    render(root, state, message);
    pulse(root, action);

    if (state.distinction > 0 && state.actionCount % 4 === 0) {
      window.setTimeout(function () {
        render(root, state, 'OPERATOR DISTINCTION UPDATED');
      }, 720);
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
        state.activated = true;
        state.feedIndex = 0;
        render(root, state, 'YOU ARE INSIDE THE FIELD');
        pulse(root, 'activate');
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
      state.feedIndex += 1;
      render(root, state);
    }, 6200);
  }

  Drupal.behaviors.oohRuntimeExperience = {
    attach: function (context) {
      once('ooh-runtime-experience', '[data-ooh-play]', context).forEach(function (root) {
        const state = {
          activated: root.classList.contains('is-mission-active'),
          actionCount: 0,
          distinction: 0,
          feedIndex: 0,
          stageIndex: 0
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
