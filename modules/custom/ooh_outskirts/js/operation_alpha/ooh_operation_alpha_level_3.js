(function () {
  'use strict';

  var stateKey = 'ooh_operation_alpha_chain_state_v1';
  var level23TimerKey = 'ooh_operation_alpha_level23_timer_remaining_seconds_v1';
  var retiredLevel23TimerKey = 'ooh_operation_alpha_timer_remaining_v1';
  var goNoGoHistoryKey = 'ooh_operation_alpha_go_nogo_recent_history_v1';
  var level23InitialSeconds = 180;
  var defaultChoicePenaltySeconds = 5;
  var juiceBonusSeconds = 5;

  function defaultState() {
    return { pressure: 0, trust: 0, enemyAwareness: 0, signalIntegrity: 100, chain: [], level1Choices: [], level2Choices: [], activeIdentity: null, activePortrait: '', castIdentities: null, enemyPressureIdentity: null, enemyPressureMode: '', narrativeSelections: {}, narrativeTokens: {}, midpointChoice: null, midpointOutcomeLast: null, midpointGoStreak: 0, midpointOutcomeHistory: [], level23TimerRemainingSeconds: level23InitialSeconds, level23TimerKey: level23TimerKey, level23TimerExpired: false };
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
    state.failed = !!state.level23TimerExpired || state.signalIntegrity <= 15 || state.pressure >= 12 || state.enemyAwareness >= 12;
    return state;
  }

  function clampTimerSeconds(value) {
    value = parseInt(value, 10);
    if (!Number.isFinite(value)) {
      return level23InitialSeconds;
    }
    return Math.max(0, value);
  }

  function readTimerRemaining(state) {
    var stored;
    try {
      stored = window.sessionStorage.getItem(level23TimerKey);
      if (stored === null || stored === '') {
        return 0;
      }
      return clampTimerSeconds(stored);
    }
    catch (e) {
      return clampTimerSeconds(state && state.level23TimerRemainingSeconds);
    }
  }

  function writeTimerRemaining(state, seconds) {
    var remaining = clampTimerSeconds(seconds);

    if (state) {
      state.level23TimerRemainingSeconds = remaining;
      state.level23TimerKey = level23TimerKey;
      state.level23TimerExpired = remaining <= 0 || !!state.level23TimerExpired;
    }
    try {
      window.sessionStorage.setItem(level23TimerKey, String(remaining));
    }
    catch (e) {}
    return remaining;
  }

  function formatTimer(seconds) {
    seconds = clampTimerSeconds(seconds);
    return 'CLOSURE ' + String(Math.floor(seconds / 60)) + ':' + String(seconds % 60).padStart(2, '0');
  }

  function updateTimerDisplay(root, state) {
    var time = root.querySelector('[data-ooh-alpha-level-time]');
    var remaining = readTimerRemaining(state);

    if (time) {
      time.textContent = formatTimer(remaining);
    }
    return remaining;
  }

  function markTimerExpired(root) {
    var state = readOAState();
    var stageState = root.querySelector('[data-ooh-alpha-level-state]');
    var wrap = root.querySelector('[data-ooh-alpha-level-choices]');

    state.level23TimerExpired = true;
    state.level23TimerRemainingSeconds = 0;
    writeTimerRemaining(state, 0);
    calculatePressure(state);
    writeOAState(state);
    if (stageState && !state.midpointChoice) {
      stageState.textContent = 'TIME EXPIRED';
    }
    if (wrap) {
      wrap.querySelectorAll('button:not(.is-selected)').forEach(function (button) {
        button.disabled = true;
        button.classList.add('is-disabled');
      });
    }
  }

  function startTimer(root) {
    if (!root || root.oohAlphaLevel23TimerInterval) {
      return;
    }
    root.oohAlphaLevel23TimerInterval = window.setInterval(function () {
      var state = readOAState();
      var remaining = readTimerRemaining(state);

      if (remaining <= 0) {
        window.clearInterval(root.oohAlphaLevel23TimerInterval);
        root.oohAlphaLevel23TimerInterval = null;
        markTimerExpired(root);
        updateTimerDisplay(root, state);
        return;
      }
      remaining = writeTimerRemaining(state, remaining - 1);
      calculatePressure(state);
      writeOAState(state);
      updateTimerDisplay(root, state);
      if (remaining <= 0) {
        markTimerExpired(root);
      }
    }, 1000);
  }

  function calculateOutcome(state) {
    return state.midpointChoice ? 'READY' : 'LOCKED';
  }

  function applyChoiceTimePenalty(state, card) {
    var penalty = Math.max(0, parseInt(card.timePenalty || defaultChoicePenaltySeconds, 10) || 0);

    return writeTimerRemaining(state, readTimerRemaining(state) - penalty);
  }

  function useJuice(root, state) {
    var remaining;

    state.level23JuiceUsed = state.level23JuiceUsed || {};
    if (state.level23JuiceUsed.level3 || readTimerRemaining(state) <= 0) {
      return false;
    }
    state.level23JuiceUsed.level3 = true;
    remaining = writeTimerRemaining(state, readTimerRemaining(state) + juiceBonusSeconds);
    state.level23TimerExpired = remaining <= 0;
    writeOAState(state);
    updateTimerDisplay(root, state);
    updateJuiceDisplay(root, state);
    return true;
  }

  function ensureJuiceControl(root) {
    var button = root.querySelector('[data-ooh-alpha-juice-factor]');
    var status = root.querySelector('[data-ooh-alpha-juice-status]');
    var time = root.querySelector('[data-ooh-alpha-level-time]');
    var host;

    if (button && status) {
      return;
    }
    host = document.createElement('div');
    host.innerHTML = '<span>JUICE</span><button class="ooh-operation-alpha-level__button" type="button" data-ooh-alpha-juice-factor>JUICE</button><strong data-ooh-alpha-juice-status>JUICE AVAILABLE: +5 SECONDS</strong>';
    if (time && time.parentNode && time.parentNode.parentNode) {
      time.parentNode.parentNode.insertBefore(host, time.parentNode.nextSibling);
    }
  }

  function updateJuiceDisplay(root, state) {
    ensureJuiceControl(root);

    var button = root.querySelector('[data-ooh-alpha-juice-factor]');
    var status = root.querySelector('[data-ooh-alpha-juice-status]');
    var used = !!(state.level23JuiceUsed && state.level23JuiceUsed.level3);
    var expired = readTimerRemaining(state) <= 0;

    if (button) {
      button.disabled = used || expired;
      button.classList.toggle('is-disabled', button.disabled);
      button.setAttribute('aria-disabled', button.disabled ? 'true' : 'false');
    }
    if (status) {
      status.textContent = expired && !used ? 'JUICE LOCKED: TIMER EXPIRED' : (used ? 'JUICE USED: +5 SECONDS APPLIED' : 'JUICE AVAILABLE: +5 SECONDS');
    }
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

  function midpointOutcome(card) {
    return card && card.id === 'midpoint-go' ? 'GO' : 'NO GO';
  }

  function readGoNoGoHistory(state) {
    var history = [];

    try {
      history = JSON.parse(window.sessionStorage.getItem(goNoGoHistoryKey) || '[]') || [];
    }
    catch (e) {
      history = [];
    }
    if (!history.length && Array.isArray(state.midpointOutcomeHistory)) {
      history = state.midpointOutcomeHistory;
    }
    return history.filter(function (item) {
      return item === 'GO' || item === 'NO GO';
    }).slice(-6);
  }

  function writeGoNoGoHistory(state, history) {
    history = (history || []).filter(function (item) {
      return item === 'GO' || item === 'NO GO';
    }).slice(-6);
    state.midpointOutcomeHistory = history;
    state.midpointGoStreak = consecutiveGoCount(history);
    try {
      window.sessionStorage.setItem(goNoGoHistoryKey, JSON.stringify(history));
    }
    catch (e) {}
  }

  function consecutiveGoCount(history) {
    var count = 0;
    var index;

    for (index = (history || []).length - 1; index >= 0; index -= 1) {
      if (history[index] !== 'GO') {
        break;
      }
      count += 1;
    }
    return count;
  }

  function goNoGoScore(state) {
    return (state.trust || 0) + Math.floor((state.signalIntegrity || 0) / 20) - (state.pressure || 0) - (state.enemyAwareness || 0);
  }

  function clampChance(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function midpointDisplayTitle(card) {
    if (!card) {
      return '';
    }
    return card.displayTitle || card.title || '';
  }

  function premonitionState(state) {
    if (!state.midpointChoice) {
      return 'SIGNAL UNREAD';
    }
    if (state.failed) {
      return 'LAST LIGHT COMPROMISED';
    }
    return midpointOutcome(state.midpointChoice) === 'GO' ? 'BREACH WINDOW OPEN' : 'FIELD COLLAPSE IMMINENT';
  }

  function renderPremonition(root, state) {
    var node = root.querySelector('[data-ooh-alpha-go-nogo]');
    var label = node && node.parentNode ? node.parentNode.querySelector('span') : null;

    if (label) {
      label.textContent = 'PREMONITION';
    }
    if (node) {
      node.textContent = premonitionState(state);
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
    var identity = Object.assign({}, state.enemyPressureIdentity || state.activeIdentity || {});

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

  function renderMentionedPortraits(root) {
    if (!window.oohOperationAlphaRenderSupportingPortraitsForSelectors) {
      if (root && !root.oohAlphaMentionedPortraitRetryQueued) {
        root.oohAlphaMentionedPortraitRetryQueued = true;
        window.setTimeout(function () {
          renderMentionedPortraits(root);
        }, 250);
      }
      return;
    }
    window.oohOperationAlphaRenderSupportingPortraitsForSelectors(root, [
      '[data-ooh-alpha-key-consequences]',
      '[data-ooh-alpha-level-consequence]',
      '[data-ooh-alpha-level-choices]',
      '[data-ooh-alpha-chain-panel]',
      '[data-ooh-alpha-transmission-popup]'
    ]);
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
    root.querySelector('[data-ooh-alpha-transmission-title]').textContent = selected && midpointOutcome(selected) === 'NO GO' ? 'Operation aborted.' : 'Last Light authorized.';
    root.querySelector('[data-ooh-alpha-transmission-summary]').textContent = (summaryText || (selected ? selected.narrative : 'One command has changed the shape of the ending.')) + ' Command is clean now. The field will charge for that clarity.';
    root.querySelector('[data-ooh-alpha-transmission-gain]').textContent = 'GAIN: Command ambiguity is gone.';
    root.querySelector('[data-ooh-alpha-transmission-loss]').textContent = 'LOSS: The alternate path is closed.';
    root.querySelector('[data-ooh-alpha-transmission-danger]').textContent = selected && midpointOutcome(selected) === 'NO GO' ? 'DANGER: The enemy keeps strategic space.' : 'DANGER: The final cost is approaching.';
    renderMentionedPortraits(root);
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
    var pressureName = state.enemyPressureIdentity && state.enemyPressureIdentity.name ? state.enemyPressureIdentity.name : 'the pressure contact';
    var pressureLine = state.enemyPressureMode === 'mutant-enforcer' ? pressureName + ' is helping Genealord pressure close around the route.' : pressureName + ' is opposing the protagonist from a rival Ronin line.';

    return [
      {
        id: 'midpoint-go',
        title: 'GO',
        displayTitle: 'AUTHORIZE LAST LIGHT',
        situation: pressureLine + ' The route remains viable, but the report shows pressure, trust, awareness, and signal damage all moving at once.',
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
        displayTitle: 'SEVER THE SIGNAL',
        situation: pressureLine + ' The operation can still be stopped before the final breach turns damage into losses.',
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

  function weightedMidpointCard(cards, state, requestedCard) {
    var goCard = cards.filter(function (card) { return card.id === 'midpoint-go'; })[0];
    var noGoCard = cards.filter(function (card) { return card.id === 'midpoint-no-go'; })[0];
    var history = readGoNoGoHistory(state);
    var goStreak = consecutiveGoCount(history);
    var score = goNoGoScore(state);
    var goChance = clampChance(0.55 + ((state.trust || 0) * 0.04) + ((state.signalIntegrity || 0) * 0.003) - ((state.pressure || 0) * 0.05) - ((state.enemyAwareness || 0) * 0.04) - (goStreak * 0.2), 0.12, 0.86);

    if (!goCard || !noGoCard) {
      return cards[0];
    }
    if (requestedCard && requestedCard.id === 'midpoint-no-go') {
      return noGoCard;
    }
    if (goStreak >= 2) {
      state.midpointAntiStreakApplied = true;
      return noGoCard;
    }
    if (state.failed || state.level23TimerExpired || state.signalIntegrity <= 20 || state.pressure >= 10 || state.enemyAwareness >= 10) {
      return noGoCard;
    }
    if (score >= 6 && state.signalIntegrity >= 70) {
      return goCard;
    }
    return Math.random() < goChance ? goCard : noGoCard;
  }

  function recordMidpointOutcome(state, card) {
    var outcome = card && card.id === 'midpoint-go' ? 'GO' : 'NO GO';
    var history = readGoNoGoHistory(state);

    history.push(outcome);
    writeGoNoGoHistory(state, history);
    if (!card || card.id !== 'midpoint-go') {
      state.midpointOutcomeLast = 'NO GO';
      state.midpointGoStreak = 0;
      return;
    }
    state.midpointOutcomeLast = 'GO';
    state.midpointGoStreak = consecutiveGoCount(history);
  }

  function render(root) {
    var state = readOAState();
    var wrap = root.querySelector('[data-ooh-alpha-level-choices]');
    var count = root.querySelector('[data-ooh-alpha-level-count]');
    var stageState = root.querySelector('[data-ooh-alpha-level-state]');
    var routeLabel = root.querySelector('[data-ooh-alpha-level-route]');
    var time = root.querySelector('[data-ooh-alpha-level-time]');
    var next = root.querySelector('[data-ooh-alpha-level-next]');
    var consequence = root.querySelector('[data-ooh-alpha-level-consequence]');
    var shell = root.querySelector('.ooh-operation-alpha-level__shell');
    var latest = (state.chain || []).slice(-3);
    var keyLines = latest.length ? latest.map(function (item) { return midpointDisplayTitle(item) + ': ' + item.consequence; }) : ['No field consequence recorded.'];
    var selected = state.midpointChoice;
    var locked = !!selected;
    var timerExpired;

    document.body.classList.add('ooh-operation-alpha-level-runtime');
    state.phase = 'situation-report';
    calculatePressure(state);
    writeTimerRemaining(state, readTimerRemaining(state));
    timerExpired = readTimerRemaining(state) <= 0;

    setText(root, '[data-ooh-alpha-pressure-status]', 'PRESSURE: ' + band(state.pressure, 4, 8) + ' (' + state.pressure + ')');
    setText(root, '[data-ooh-alpha-trust-status]', 'TRUST: ' + band(state.trust, 3, 7) + ' (' + state.trust + ')');
    setText(root, '[data-ooh-alpha-awareness-status]', 'ENEMY AWARENESS: ' + band(state.enemyAwareness, 4, 8) + ' (' + state.enemyAwareness + ')');
    setText(root, '[data-ooh-alpha-signal-status]', 'SIGNAL STABILITY: ' + state.signalIntegrity + '%');
    renderThreeLineSummary(root.querySelector('[data-ooh-alpha-key-consequences]'), keyLines);
    // Anti-drift: player-facing premonition copy is cosmetic and must not drive routing by itself.
    renderPremonition(root, state);

    if (wrap) {
      wrap.innerHTML = '';
      var cards = decisionCards(state);
      // Anti-drift: card labels may change, but the internal GO/NO GO ids and weighted outcome logic stay stable.
      cards.forEach(function (card) {
        var chosen = selected && selected.id === card.id;
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ooh-operation-alpha-level__choice';
        button.classList.toggle('is-selected', chosen);
        button.classList.toggle('is-disabled', (locked || timerExpired) && !chosen);
        button.disabled = locked || timerExpired;
        button.innerHTML = '<span>' + midpointDisplayTitle(card) + '</span><strong>SITUATION</strong><p>' + card.situation + '</p><strong>DIRECTIVE</strong><p>' + card.directive + '</p><strong>RISK</strong><p>' + card.risk + '</p><strong>CONSEQUENCE</strong><p>' + card.consequence + '</p>';
        button.addEventListener('click', function () {
          if (button.disabled) {
            return;
          }
          state = readOAState();
          if (state.midpointChoice || readTimerRemaining(state) <= 0) {
            return;
          }
          var outcomeCard = weightedMidpointCard(cards, state, card);
          // Anti-drift: this selected outcome controls existing GO/NO-GO routing; display copy above does not.
          state.midpointChoice = outcomeCard;
          state.midpointDecision = outcomeCard.title;
          state.failed = outcomeCard.id === 'midpoint-no-go' ? true : state.failed;
          applyChoiceTimePenalty(state, outcomeCard);
          recordMidpointOutcome(state, outcomeCard);
          appendChainEvent(state, outcomeCard);
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
    if (time) {
      updateTimerDisplay(root, state);
    }
    if (routeLabel) {
      routeLabel.textContent = selected ? (selected.route === 'finale' ? 'FINAL DEBRIEF' : 'LAST LIGHT') : 'UNRESOLVED';
    }
    if (consequence) {
      consequence.textContent = selected ? selected.narrative : 'Awaiting command decision.';
    }
    renderChainPanel(root, state);
    renderMentionedPortraits(root);
    if (next) {
      next.href = selected && selected.route === 'finale' ? next.href.replace(/\/oalevel4$/, '/oafinale') : next.href.replace(/\/oafinale$/, '/oalevel4');
    }
    setDisabled(next, !locked);
    bindLockedLink(next);
    bindTransmissionLink(root, next);
    if (shell) {
      shell.classList.toggle('is-stage-complete', locked);
    }
    updateJuiceDisplay(root, state);
    root.querySelectorAll('[data-ooh-alpha-juice-factor]').forEach(function (button) {
      if (button.oohAlphaJuiceBound) {
        return;
      }
      button.oohAlphaJuiceBound = true;
      button.addEventListener('click', function () {
        state = readOAState();
        useJuice(root, state);
      });
    });
    try {
      window.sessionStorage.removeItem(retiredLevel23TimerKey);
    }
    catch (e) {}
    writeOAState(state);
    startTimer(root);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-ooh-alpha-level="3"]').forEach(render);
  }, { once: true });
})();
