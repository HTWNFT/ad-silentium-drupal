(function () {
  'use strict';

  var stateKey = 'ooh_operation_alpha_chain_state_v1';

  function defaultState() {
    return { pressure: 0, trust: 0, enemyAwareness: 0, signalIntegrity: 100, chain: [], narrativeSelections: {}, narrativeTokens: {}, finalDecision: null };
  }

  function readOAState() {
    try {
      return Object.assign(defaultState(), JSON.parse(window.localStorage.getItem(stateKey) || '{}'));
    }
    catch (e) {
      return defaultState();
    }
  }

  function writeOAState(state) {
    calculatePressure(state);
    window.localStorage.setItem(stateKey, JSON.stringify(state));
  }

  function appendChainEvent(state, event) {
    state.chain = state.chain || [];
    state.chain.push(event);
    writeOAState(state);
  }

  function calculatePressure(state) {
    var chain = state.chain || [];
    state.pressure = chain.reduce(function (sum, item) { return sum + (item.pressure || 0); }, 0);
    state.trust = chain.reduce(function (sum, item) { return sum + (item.trust || 0); }, 0);
    state.enemyAwareness = chain.reduce(function (sum, item) { return sum + (item.awareness || 0); }, 0);
    state.signalIntegrity = Math.max(0, Math.min(100, 100 + chain.reduce(function (sum, item) { return sum + (item.signal || 0); }, 0)));
    return state;
  }

  function calculateOutcome(state) {
    if (!state.finalDecision) {
      return 'NO GO';
    }
    if (state.signalIntegrity <= 10 || state.missionTimerSeconds <= 0 || state.enemyAwareness > state.trust + 8) {
      return 'NO GO';
    }
    return 'GO';
  }

  function renderChainPanel(root, selector, items) {
    var panel = root.querySelector(selector);
    if (!panel) {
      return;
    }
    panel.innerHTML = '';
    if (!items.length) {
      panel.innerHTML = '<p>No decisions recorded.</p>';
      return;
    }
    items.forEach(function (item, index) {
      var line = document.createElement('p');
      line.textContent = String(index + 1).padStart(2, '0') + ' / ' + item.title + ' / ' + item.consequence + ' / ' + item.carry;
      panel.appendChild(line);
    });
  }

  function setOutcomeLabel(root, outcome) {
    root.querySelectorAll('[data-ooh-alpha-finale-outcome-label], [data-ooh-alpha-finale-popup-outcome]').forEach(function (node) {
      node.textContent = outcome;
      node.classList.toggle('is-go', outcome === 'GO');
      node.classList.toggle('is-no-go', outcome !== 'GO');
    });
  }

  function renderThreeLineSummary(target, state) {
    if (!target) {
      return;
    }
    target.textContent = calculateOutcome(state) + ' / ' + (state.missionCost || 'Cost unresolved') + ' / SIGNAL ' + state.signalIntegrity + '%';
  }

  function setText(root, selector, value) {
    var node = root.querySelector(selector);
    if (node) {
      node.textContent = value;
    }
  }

  function renderFinalePopupIdentity(root, state) {
    var block = root.querySelector('[data-ooh-alpha-finale-transmission-identity]');
    var image = root.querySelector('[data-ooh-alpha-finale-transmission-portrait]');
    var name = root.querySelector('[data-ooh-alpha-finale-transmission-name]');
    var faction = root.querySelector('[data-ooh-alpha-finale-transmission-faction]');
    var role = root.querySelector('[data-ooh-alpha-finale-transmission-role]');
    var hook = root.querySelector('[data-ooh-alpha-finale-transmission-hook]');
    var identity = Object.assign({}, state.activeIdentity || {});

    if (!identity.portrait && state.activePortrait) {
      identity.portrait = state.activePortrait;
    }
    if (!block || !image || !identity.portrait) {
      if (block) {
        block.hidden = true;
      }
      if (image) {
        image.hidden = true;
        image.removeAttribute('src');
      }
      return;
    }

    image.onerror = function () {
      image.hidden = true;
      block.hidden = true;
      image.removeAttribute('src');
    };
    image.onload = function () {
      image.hidden = false;
      block.hidden = false;
    };
    image.src = identity.portrait;
    image.hidden = false;
    block.hidden = false;
    if (name) {
      name.textContent = identity.name || 'UNKNOWN FIELD ASSET';
    }
    if (faction) {
      faction.textContent = identity.faction || 'UNRESOLVED';
    }
    if (role) {
      role.textContent = identity.role || 'Field Presence';
    }
    if (hook) {
      hook.textContent = identity.hook || 'The field records an operational presence.';
    }
  }

  function narrativeLibrarySection(sectionName) {
    var library = window.OA_NARRATIVE_LIBRARY || {};
    return Array.isArray(library[sectionName]) ? library[sectionName] : [];
  }

  function narrativeEntry(state, key, sectionName, offset) {
    var section = narrativeLibrarySection(sectionName);
    var storedId = state.narrativeSelections && state.narrativeSelections[key];
    var stored = section.filter(function (entry) { return entry.id === storedId; })[0];
    var selected;

    if (!section.length) {
      return null;
    }
    if (stored) {
      return stored;
    }
    state.narrativeSelections = state.narrativeSelections || {};
    selected = section[(offset || 0) % section.length];
    state.narrativeSelections[key] = selected.id;
    return selected;
  }

  function fillNarrativeText(text, tokens) {
    var safeTokens = tokens || {};
    var fallback = { ronin: 'the Ronin', genealord: 'the Genealord', mutant: 'mutant pressure', ally: 'the ally', enemy: 'the enemy', thirdForce: 'the third force', route: 'the route', signal: 'the signal', mission: 'the mission', cost: 'the cost', injury: 'field injury', loss: 'the loss', gain: 'the gain' };

    return (text || '').replace(/\{\{(\w+)\}\}/g, function (match, key) {
      return safeTokens[key] || fallback[key] || 'the field';
    });
  }

  function render(root) {
    var state = readOAState();
    var chain = state.chain || [];
    var missionSummary = narrativeEntry(state, 'finaleMissionSummary', 'aarSummaryTemplates', 2);
    var operationalCost = narrativeEntry(state, 'finaleOperationalCost', 'aarSummaryTemplates', 9);
    var signalStatus = narrativeEntry(state, 'finaleSignalStatus', 'aarSummaryTemplates', 14);
    var finalConsequence = narrativeEntry(state, 'finaleFinalConsequence', 'aarSummaryTemplates', 19);
    var outcome = calculateOutcome(state);

    document.body.classList.add('ooh-operation-alpha-level-runtime');
    calculatePressure(state);

    setOutcomeLabel(root, outcome);
    setText(root, '[data-ooh-alpha-finale-aar]', missionSummary ? fillNarrativeText(missionSummary.text, state.narrativeTokens) : 'Mission status: ' + calculateOutcome(state) + '. Key decision: ' + (state.finalDecision ? state.finalDecision.title : 'unresolved') + '.');
    setText(root, '[data-ooh-alpha-finale-bda]', finalConsequence ? fillNarrativeText(finalConsequence.text, state.narrativeTokens) : 'Pressure ' + state.pressure + ' / Trust ' + state.trust + ' / Enemy Awareness ' + state.enemyAwareness + '.');
    setText(root, '[data-ooh-alpha-finale-cost]', operationalCost ? fillNarrativeText(operationalCost.text, state.narrativeTokens) : (state.missionCost || 'No final cost recorded.'));
    setText(root, '[data-ooh-alpha-finale-personnel]', String(state.personnelLost || 0));
    setText(root, '[data-ooh-alpha-finale-enemy]', state.enemyImpact || 'Enemy impact unresolved.');
    setText(root, '[data-ooh-alpha-finale-signal]', signalStatus ? fillNarrativeText(signalStatus.text, state.narrativeTokens) : 'SIGNAL STABILITY: ' + state.signalIntegrity + '%');
    renderChainPanel(root, '[data-ooh-alpha-finale-timeline]', chain);
    renderChainPanel(root, '[data-ooh-alpha-finale-chain]', chain);
    renderThreeLineSummary(root.querySelector('[data-ooh-alpha-finale-outcome]'), state);
    setText(root, '[data-ooh-alpha-finale-popup-summary]', 'Mission summary: ' + outcome + '. ' + (state.missionCost || 'Cost unresolved.') + ' Signal stability ' + state.signalIntegrity + '%.');
    renderFinalePopupIdentity(root, state);
    var popup = root.querySelector('[data-ooh-alpha-finale-popup]');
    if (popup) {
      popup.hidden = false;
      popup.setAttribute('aria-hidden', 'false');
      window.setTimeout(function () { popup.classList.add('is-visible'); }, 60);
      if (window.oaScrollToNextPhase) {
        window.oaScrollToNextPhase(root, popup);
      }
    }

    root.querySelectorAll('[data-ooh-alpha-try-again]').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.resetOperationAlphaRun) {
          window.resetOperationAlphaRun(true);
        }
        else {
          window.localStorage.removeItem(stateKey);
        }
      });
    });
    writeOAState(state);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-ooh-alpha-finale]').forEach(render);
  }, { once: true });
})();


