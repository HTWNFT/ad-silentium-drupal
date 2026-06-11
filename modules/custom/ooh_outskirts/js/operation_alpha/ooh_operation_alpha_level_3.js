(function () {
  'use strict';

  var stateKey = 'ooh_operation_alpha_chain_state_v1';

  function defaultState() {
    return { pressure: 0, trust: 0, enemyAwareness: 0, signalIntegrity: 100, chain: [], level1Choices: [], level2Choices: [], narrativeSelections: {}, narrativeTokens: {}, midpointChoice: null };
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
    state.chain = (state.chain || []).filter(function (item) { return item.id !== event.id; });
    state.chain.push(event);
    writeOAState(state);
  }

  function calculatePressure(state) {
    var chain = state.chain || [];
    state.pressure = chain.reduce(function (sum, item) { return sum + (item.pressure || 0); }, 0);
    state.trust = chain.reduce(function (sum, item) { return sum + (item.trust || 0); }, 0);
    state.enemyAwareness = chain.reduce(function (sum, item) { return sum + (item.awareness || 0); }, 0);
    state.signalIntegrity = Math.max(0, Math.min(100, 100 + chain.reduce(function (sum, item) { return sum + (item.signal || 0); }, 0)));
    state.failed = state.signalIntegrity <= 15 || state.pressure >= 12 || state.enemyAwareness >= 12;
    return state;
  }

  function calculateOutcome(state) {
    return state.midpointChoice ? 'READY' : 'LOCKED';
  }

  function renderChainPanel(root, state) {
    var panel = root.querySelector('[data-ooh-alpha-chain-panel]');
    var latest = (state.chain || [])[state.chain.length - 1];
    if (!panel) {
      return;
    }
    panel.innerHTML = latest ? '<p>ACTION: ' + latest.action + '</p><p>REACTION: ' + latest.reaction + '</p><p>CONSEQUENCE: ' + latest.consequence + '</p><p>CARRY-FORWARD EFFECT: ' + latest.carry + '</p>' : '<p>ACTION: Awaiting command decision.</p><p>REACTION: Command holding.</p><p>CONSEQUENCE: Route unresolved.</p><p>CARRY-FORWARD EFFECT: Final route pending.</p>';
  }

  function renderThreeLineSummary(target, lines) {
    if (target) {
      target.textContent = lines.join(' ');
    }
  }

  function band(value, low, high) {
    if (value >= high) {
      return 'HIGH';
    }
    if (value >= low) {
      return 'MODERATE';
    }
    return 'LOW';
  }

  function setText(root, selector, value) {
    var node = root.querySelector(selector);
    if (node) {
      node.textContent = value;
    }
  }

  function setDisabled(link, disabled) {
    if (!link) {
      return;
    }
    if (!link.dataset.oaHref && link.getAttribute('href')) {
      link.dataset.oaHref = link.getAttribute('href');
    }
    link.disabled = disabled;
    link.classList.toggle('is-disabled', disabled);
    link.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    link.setAttribute('tabindex', disabled ? '-1' : '0');
    if (disabled) {
      link.removeAttribute('href');
    }
    else if (link.dataset.oaHref) {
      link.setAttribute('href', link.dataset.oaHref);
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

  function renderTransmissionIdentity(root, state, selected) {
    var block = root.querySelector('[data-ooh-alpha-transmission-identity]');
    var image = root.querySelector('[data-ooh-alpha-transmission-portrait]');
    var name = root.querySelector('[data-ooh-alpha-transmission-name]');
    var faction = root.querySelector('[data-ooh-alpha-transmission-faction]');
    var role = root.querySelector('[data-ooh-alpha-transmission-role]');
    var hook = root.querySelector('[data-ooh-alpha-transmission-hook]');
    var identity = Object.assign({}, state.activeIdentity || {});

    if (!identity.portrait && state.activePortrait) {
      identity.portrait = state.activePortrait;
    }
    if (selected && selected.consequence) {
      identity.hook = selected.consequence;
    }
    if (!block || !image || !identity.portrait || !identity.name) {
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
      name.textContent = identity.name;
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

  function bindLockedLink(link) {
    if (!link || link.oohAlphaLockedBound) {
      return;
    }
    link.oohAlphaLockedBound = true;
    link.addEventListener('click', function (event) {
      if (link.getAttribute('aria-disabled') === 'true') {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    });
  }

  function showTransmission(root, state, href) {
    var popup = root.querySelector('[data-ooh-alpha-transmission-popup]');
    var next = root.querySelector('[data-ooh-alpha-transmission-next]');
    var selected = state.midpointChoice;
    var transmission = narrativeEntry(state, 'level3Transmission', 'unseenHandTransmissionTemplates', 61);
    var summaryText = transmission ? fillNarrativeText(transmission.text, state.narrativeTokens) : '';
    if (!popup) {
      window.location.href = href;
      return;
    }
    renderTransmissionIdentity(root, state, selected);
    root.querySelector('[data-ooh-alpha-transmission-title]').textContent = selected && selected.title === 'NO GO' ? 'Operation aborted.' : 'Last Light authorized.';
    root.querySelector('[data-ooh-alpha-transmission-summary]').textContent = (summaryText || (selected ? selected.narrative : 'One command has changed the shape of the ending.')) + ' Command is clean now. The field will charge for that clarity.';
    root.querySelector('[data-ooh-alpha-transmission-gain]').textContent = 'GAIN: Command ambiguity is gone.';
    root.querySelector('[data-ooh-alpha-transmission-loss]').textContent = 'LOSS: The alternate path is closed.';
    root.querySelector('[data-ooh-alpha-transmission-danger]').textContent = selected && selected.title === 'NO GO' ? 'DANGER: The enemy keeps strategic space.' : 'DANGER: The final cost is approaching.';
    writeOAState(state);
    if (next) {
      next.href = href;
    }
    popup.hidden = false;
    popup.setAttribute('aria-hidden', 'false');
  }

  function bindTransmissionLink(root, link) {
    if (!link || link.oohAlphaTransmissionBound) {
      return;
    }
    link.oohAlphaTransmissionBound = true;
    link.addEventListener('click', function (event) {
      var currentState = readOAState();
      if (link.getAttribute('aria-disabled') === 'true' || !currentState.midpointChoice) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setDisabled(link, true);
        return;
      }
      event.preventDefault();
      showTransmission(root, currentState, link.href);
      if (window.oaScrollToNextPhase) {
        window.oaScrollToNextPhase(root);
      }
    });
  }

  function decisionCards(state) {
    return [
      {
        id: 'midpoint-go',
        title: 'GO',
        situation: 'The route remains viable, but the report shows pressure, trust, awareness, and signal damage all moving at once.',
        directive: 'Commit to Last Light and accept the cost of continuing.',
        risk: 'The final breach may succeed and still leave losses behind.',
        action: 'Committed to Last Light.',
        reaction: 'Command releases the final route and surviving assets prepare to move.',
        consequence: 'The operation continues toward the final breach.',
        carry: 'Final route opened.',
        narrative: 'The report is not clean, and that is the point. The Unseen Hand accepts an imperfect field because waiting will not make it safer. Last Light opens.',
        pressure: 0,
        trust: 0,
        awareness: 0,
        signal: 0,
        route: 'level4'
      },
      {
        id: 'midpoint-no-go',
        title: 'NO GO',
        situation: 'The operation can still be stopped before the final breach turns damage into losses.',
        directive: 'Abort and preserve what remains.',
        risk: 'The mission ends without climax; the enemy keeps strategic space.',
        action: 'Aborted before Last Light.',
        reaction: 'Command freezes the route and pulls exposed assets back.',
        consequence: 'The mission stops before final breach and moves to debrief.',
        carry: 'Mission aborted; trust reduced.',
        narrative: 'The Unseen Hand chooses restraint. Some assets survive because the final breach never opens, but the enemy keeps ground that might have been taken.',
        pressure: 0,
        trust: -2,
        awareness: 0,
        signal: 0,
        route: 'finale'
      }
    ];
  }

  function render(root) {
    var state = readOAState();
    var wrap = root.querySelector('[data-ooh-alpha-level-choices]');
    var count = root.querySelector('[data-ooh-alpha-level-count]');
    var stageState = root.querySelector('[data-ooh-alpha-level-state]');
    var routeLabel = root.querySelector('[data-ooh-alpha-level-route]');
    var next = root.querySelector('[data-ooh-alpha-level-next]');
    var consequence = root.querySelector('[data-ooh-alpha-level-consequence]');
    var shell = root.querySelector('.ooh-operation-alpha-level__shell');
    var latest = (state.chain || []).slice(-3);
    var keyLines = latest.length ? latest.map(function (item) { return item.title + ': ' + item.consequence; }) : ['No field consequence recorded.'];
    var selected = state.midpointChoice;
    var locked = !!selected;

    document.body.classList.add('ooh-operation-alpha-level-runtime');
    state.phase = 'situation-report';
    calculatePressure(state);

    setText(root, '[data-ooh-alpha-pressure-status]', 'PRESSURE: ' + band(state.pressure, 4, 8) + ' (' + state.pressure + ')');
    setText(root, '[data-ooh-alpha-trust-status]', 'TRUST: ' + band(state.trust, 3, 7) + ' (' + state.trust + ')');
    setText(root, '[data-ooh-alpha-awareness-status]', 'ENEMY AWARENESS: ' + band(state.enemyAwareness, 4, 8) + ' (' + state.enemyAwareness + ')');
    setText(root, '[data-ooh-alpha-signal-status]', 'SIGNAL STABILITY: ' + state.signalIntegrity + '%');
    renderThreeLineSummary(root.querySelector('[data-ooh-alpha-key-consequences]'), keyLines);
    setText(root, '[data-ooh-alpha-go-nogo]', selected ? selected.title : 'UNRESOLVED');

    if (wrap) {
      wrap.innerHTML = '';
      decisionCards(state).forEach(function (card) {
        var chosen = selected && selected.id === card.id;
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ooh-operation-alpha-level__choice';
        button.classList.toggle('is-selected', chosen);
        button.classList.toggle('is-disabled', locked && !chosen);
        button.disabled = locked;
        button.innerHTML = '<span>' + card.title + '</span><strong>SITUATION</strong><p>' + card.situation + '</p><strong>DIRECTIVE</strong><p>' + card.directive + '</p><strong>RISK</strong><p>' + card.risk + '</p><strong>CONSEQUENCE</strong><p>' + card.consequence + '</p>';
        button.addEventListener('click', function () {
          if (button.disabled) {
            return;
          }
          state = readOAState();
          if (state.midpointChoice) {
            return;
          }
          state.midpointChoice = card;
          state.midpointDecision = card.title;
          state.failed = card.id === 'midpoint-no-go' ? true : state.failed;
          appendChainEvent(state, card);
          render(root);
          if (window.oaScrollToNextPhase) {
            window.oaScrollToNextPhase(root, root.querySelector('[data-ooh-alpha-level-next]'));
          }
        });
        wrap.appendChild(button);
      });
    }

    if (count) {
      count.textContent = 'SELECTED: ' + (locked ? 1 : 0) + ' / REQUIRED: 1';
    }
    if (stageState) {
      stageState.textContent = calculateOutcome(state);
    }
    if (routeLabel) {
      routeLabel.textContent = selected ? (selected.route === 'finale' ? 'FINAL DEBRIEF' : 'LAST LIGHT') : 'UNRESOLVED';
    }
    if (consequence) {
      consequence.textContent = selected ? selected.narrative : 'Awaiting command decision.';
    }
    renderChainPanel(root, state);
    if (next) {
      next.href = selected && selected.route === 'finale' ? next.href.replace(/\/oalevel4$/, '/oafinale') : next.href.replace(/\/oafinale$/, '/oalevel4');
    }
    setDisabled(next, !locked);
    bindLockedLink(next);
    bindTransmissionLink(root, next);
    if (shell) {
      shell.classList.toggle('is-stage-complete', locked);
    }
    writeOAState(state);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-ooh-alpha-level="3"]').forEach(render);
  }, { once: true });
})();
