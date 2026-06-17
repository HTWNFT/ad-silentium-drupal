(function () {
  'use strict';

  var stateKey = 'ooh_operation_alpha_chain_state_v1';
  var level23TimerKey = 'ooh_operation_alpha_level23_timer_remaining_seconds_v1';
  var retiredLevel23TimerKey = 'ooh_operation_alpha_timer_remaining_v1';
  var level23InitialSeconds = 180;
  var requiredChoices = 4;
  var defaultChoicePenaltySeconds = 5;
  var juiceBonusSeconds = 5;

  function defaultState() {
    return { pressure: 0, trust: 0, enemyAwareness: 0, signalIntegrity: 100, chain: [], introChoices: [], level1Choices: [], level2Choices: [], level4Choices: [], activeIdentity: null, activePortrait: '', castIdentities: null, enemyPressureIdentity: null, enemyPressureMode: '', narrativeSelections: {}, narrativeTokens: {} };
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
        stored = level23InitialSeconds;
        window.sessionStorage.setItem(level23TimerKey, String(clampTimerSeconds(stored)));
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
    var difficulty = root.querySelector('[data-ooh-alpha-level-difficulty]');
    var wrap = root.querySelector('[data-ooh-alpha-level-choices]');

    state.failed = true;
    state.level23TimerExpired = true;
    state.level23TimerRemainingSeconds = 0;
    writeTimerRemaining(state, 0);
    writeOAState(state);
    if (difficulty) {
      difficulty.textContent = 'TIME EXPIRED / FAILURE RISK';
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
      writeOAState(state);
      updateTimerDisplay(root, state);
      if (remaining <= 0) {
        markTimerExpired(root);
      }
    }, 1000);
  }

  function applyChoiceTimePenalty(state, beat) {
    var penalty = Math.max(0, parseInt(beat.timePenalty || defaultChoicePenaltySeconds, 10) || 0);
    var remaining = readTimerRemaining(state);

    return writeTimerRemaining(state, remaining - penalty);
  }

  function useJuice(root, state) {
    var remaining;

    state.level23JuiceUsed = state.level23JuiceUsed || {};
    if (state.level23JuiceUsed.level2 || readTimerRemaining(state) <= 0) {
      return false;
    }
    state.level23JuiceUsed.level2 = true;
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
    var used = !!(state.level23JuiceUsed && state.level23JuiceUsed.level2);
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

  function calculateOutcome(state) {
    if ((state.level2Choices || []).length >= requiredChoices) {
      return state.failed ? 'READY / FAILURE RISK' : 'READY';
    }
    return 'LOCKED';
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

  function levelTwoBeats(state) {
    var sections = ['enemyIntroTemplates', 'mutantEncounterTemplates', 'betrayalTemplates'];
    var pressureIdentity = ensureEnemyPressureIdentity(state);
    var pressureName = pressureIdentity && pressureIdentity.name ? pressureIdentity.name : 'the pressure contact';
    var pressureMode = state.enemyPressureMode === 'mutant-enforcer' ? 'mutant enforcer' : 'rival Ronin';

    return responseBeats(state).map(function (beat, index) {
      var sectionName = sections[index % sections.length];
      var entry = narrativeEntry(state, 'level2_' + beat.id, sectionName, index + 9);
      var hookEntry = narrativeEntry(state, 'level2_hook_' + beat.id, 'consequenceHookTemplates', index + 8);

      if (!entry) {
        return index === 0 ? Object.assign({}, beat, {
          situation: pressureName + ' enters as a ' + pressureMode + ' and changes the pressure pattern. ' + beat.situation
        }) : beat;
      }

      return Object.assign({}, beat, {
        situation: (index === 0 ? pressureName + ' enters as a ' + pressureMode + ' and changes the pressure pattern. ' : '') + fillNarrativeText(entry.text, state.narrativeTokens),
        consequence: hookEntry ? fillNarrativeText(hookEntry.text, state.narrativeTokens) : beat.consequence,
        narrative: fillNarrativeText(entry.text, state.narrativeTokens)
      });
    });
  }

  function wantsMutantPressure(state) {
    var choices = state.level1Choices || [];

    return state.enemyAwareness >= state.trust || choices.some(function (choice) {
      return choice && (choice.id === 'mutant-activity' || choice.id === 'enemy-movement' || choice.id === 'signal-distortion');
    });
  }

  function ensureEnemyPressureIdentity(state) {
    var identities = state.castIdentities || {};
    var identity;

    if (state.enemyPressureIdentity && state.enemyPressureIdentity.name) {
      return state.enemyPressureIdentity;
    }
    if (wantsMutantPressure(state)) {
      identity = identities.thirdForce || identities.opposition || null;
      state.enemyPressureMode = 'mutant-enforcer';
    }
    else {
      identity = identities.rival || identities.opposition || null;
      state.enemyPressureMode = 'rival-ronin';
    }
    if (identity) {
      state.enemyPressureIdentity = Object.assign({}, identity, {
        hook: state.enemyPressureMode === 'mutant-enforcer' ? identity.name + ' reinforces Genealord pressure from the corridor edge.' : identity.name + ' contests the protagonist from a rival Ronin line.'
      });
    }
    return state.enemyPressureIdentity || null;
  }

  function renderChainPanel(root, state) {
    var panel = root.querySelector('[data-ooh-alpha-chain-panel]');
    var latest = (state.chain || [])[state.chain.length - 1];
    if (!panel) {
      return;
    }
    panel.innerHTML = latest ? '<p>ACTION: ' + latest.action + '</p><p>REACTION: ' + latest.reaction + '</p><p>CONSEQUENCE: ' + latest.consequence + '</p><p>CARRY-FORWARD EFFECT: ' + latest.carry + '</p>' : '<p>ACTION: Waiting for field pressure.</p><p>REACTION: Enemy listening.</p><p>CONSEQUENCE: Unknown.</p><p>CARRY-FORWARD EFFECT: Time pressure rising.</p>';
  }

  function renderThreeLineSummary(target, state) {
    var choices = state.level2Choices || [];
    var a = choices[0] ? choices[0].title : 'UNIDENTIFIED TRANSMISSION';
    var b = choices[1] ? choices[1].title : 'ROUTE WARNING';
    var c = choices[3] ? choices[3].title : 'FINAL ROUTE PENDING';
    if (target) {
      target.textContent = a + ' / ' + b + ' / ' + c;
    }
  }

  function responseBeats(state) {
    var first = (state.level1Choices || [])[0];
    var route = first ? first.title : 'earlier route exposure';
    return [
      {
        id: 'enemy-countermove',
        title: 'ENEMY COUNTERMOVE',
        situation: 'WARNING: Kharos commits additional assets because ' + route.toLowerCase() + ' changed the field.',
        directive: 'Break the countermove before it reaches the corridor.',
        risk: 'Direct disruption protects the route but confirms Unseen Hand presence.',
        action: 'Broke the enemy countermove.',
        reaction: 'Genealord command shifted from patrol logic to pursuit logic.',
        consequence: 'The corridor survived, but the enemy learned faster.',
        carry: 'Pressure increased; enemy awareness increased.',
        narrative: 'The countermove breaks, but not quietly. Kharos now understands that someone is shaping the field against him. The route survives this contact, and the next enemy response will arrive less confused.',
        pressure: 2, trust: 0, awareness: 2, signal: -1
      },
      {
        id: 'ally-compromised',
        title: 'ALLY COMPROMISED',
        situation: 'A Ronin ally reports clipped breathing and a hostile voice repeating their route code.',
        directive: 'Save the ally or keep the mission concealed.',
        risk: 'Saving them costs time and exposes the relay.',
        action: 'Pulled the ally through a dirty channel.',
        reaction: 'The ally survived, but the channel degraded.',
        consequence: 'Trust held under stress and signal stability dropped.',
        carry: 'Trust increased; signal integrity fell.',
        narrative: 'The ally lives because the Unseen Hand spends the channel recklessly. Trust hardens into loyalty, but the rescue tears holes in the signal. Future orders will have less room for elegance.',
        pressure: 1, trust: 2, awareness: 1, signal: -4
      },
      {
        id: 'signal-failure',
        title: 'SIGNAL FAILURE',
        situation: 'UNIDENTIFIED TRANSMISSION: They found the convoy. The road is gone. Do not use the northern route.',
        directive: 'Reroute through unstable signal or risk the original road.',
        risk: 'Reroute preserves lives but destroys signal clarity.',
        action: 'Rerouted through unstable signal.',
        reaction: 'The convoy vanished from hostile sweep for one interval.',
        consequence: 'The road remained possible, not safe.',
        carry: 'Signal integrity fell; pressure dropped briefly.',
        narrative: 'The warning arrives too late to feel clean and early enough to matter. The convoy disappears into poorer terrain. Lives are preserved, but the map no longer trusts itself.',
        pressure: -1, trust: 1, awareness: 0, signal: -6
      },
      {
        id: 'third-force-appears',
        title: 'THIRD FORCE APPEARS',
        situation: 'A hostile third-force cell enters the operation and offers to sell the Ronin route back to both sides.',
        directive: 'Neutralize the cell, bargain, or let the enemy waste time chasing them.',
        risk: 'Every option creates a future liability.',
        action: 'Let the third force draw enemy attention.',
        reaction: 'Mutants and Genealord scouts collided near the old relay.',
        consequence: 'Pressure dropped now and will return harder later.',
        carry: 'Pressure dropped; enemy awareness increased.',
        narrative: 'The third force becomes useful because they are dangerous to everyone. Their chaos buys the Ronin time, but it also teaches every faction where the operation bends.',
        pressure: -2, trust: -1, awareness: 3, signal: -1
      },
      {
        id: 'critical-loss',
        title: 'CRITICAL LOSS',
        situation: 'A support cell goes silent after reporting movement beneath the drainage road.',
        directive: 'Recover the cell or accept the loss and preserve the primary route.',
        risk: 'Recovery may save people and collapse the mission clock.',
        action: 'Accepted the support-cell loss.',
        reaction: 'The primary route stayed open while the support channel went dark.',
        consequence: 'Mission continuity held at a personnel cost.',
        carry: 'Trust reduced; pressure reduced.',
        narrative: 'The Unseen Hand chooses the mission over the missing cell. The route remains viable, and everyone still listening understands what that choice cost. Obedience may hold; trust may not.',
        pressure: -1, trust: -2, awareness: 0, signal: -2
      },
      {
        id: 'pressure-surge',
        title: 'PRESSURE SURGE',
        situation: 'The corridor clock drops without warning as weather and enemy movement fold into the same lane.',
        directive: 'Hold the surge or spend signal integrity to punch through it.',
        risk: 'Punching through preserves tempo and damages the channel.',
        action: 'Spent signal integrity to punch through the surge.',
        reaction: 'The field opened for one hard movement and then screamed with static.',
        consequence: 'Tempo survived and signal stability degraded.',
        carry: 'Pressure reduced; signal integrity fell sharply.',
        narrative: 'The surge does not yield to patience. The Unseen Hand burns signal strength like fuel, forcing one narrow passage through the pressure. It works, and it leaves the channel limping.',
        pressure: -2, trust: 0, awareness: 1, signal: -8
      }
    ];
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

  function renderTransmissionIdentity(root, state, latest) {
    var block = root.querySelector('[data-ooh-alpha-transmission-identity]');
    var image = root.querySelector('[data-ooh-alpha-transmission-portrait]');
    var name = root.querySelector('[data-ooh-alpha-transmission-name]');
    var faction = root.querySelector('[data-ooh-alpha-transmission-faction]');
    var role = root.querySelector('[data-ooh-alpha-transmission-role]');
    var hook = root.querySelector('[data-ooh-alpha-transmission-hook]');
    var identity = Object.assign({}, ensureEnemyPressureIdentity(state) || state.activeIdentity || {});

    if (!identity.portrait && state.activePortrait) {
      identity.portrait = state.activePortrait;
    }
    if (latest && latest.narrative) {
      identity.hook = latest.narrative;
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
      '[data-ooh-alpha-level-summary]',
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
    var latest = (state.level2Choices || [])[state.level2Choices.length - 1];
    var transmission = narrativeEntry(state, 'level2Transmission', 'unseenHandTransmissionTemplates', 51);
    var summaryText = transmission ? fillNarrativeText(transmission.text, state.narrativeTokens) : '';
    if (!popup) {
      window.location.href = href;
      return;
    }
    renderTransmissionIdentity(root, state, latest);
    root.querySelector('[data-ooh-alpha-transmission-title]').textContent = 'Escalation cascade complete.';
    root.querySelector('[data-ooh-alpha-transmission-summary]').textContent = (summaryText || (latest ? latest.narrative : 'The field is deteriorating, but the route still answers.')) + ' Enemy pressure has learned the shape of the hand moving against it.';
    root.querySelector('[data-ooh-alpha-transmission-gain]').textContent = 'GAIN: Enemy pressure has revealed its pattern.';
    root.querySelector('[data-ooh-alpha-transmission-loss]').textContent = 'LOSS: Signal stability and trust have been tested.';
    root.querySelector('[data-ooh-alpha-transmission-danger]').textContent = 'DANGER: Command must decide whether Last Light is worth the cost.';
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
      if (link.getAttribute('aria-disabled') === 'true' || (currentState.level2Choices || []).length < requiredChoices) {
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

  function render(root) {
    var state = readOAState();
    var choices = state.level2Choices || [];
    var beats = levelTwoBeats(state);
    var locked = choices.length >= requiredChoices;
    var wrap = root.querySelector('[data-ooh-alpha-level-choices]');
    var count = root.querySelector('[data-ooh-alpha-level-count]');
    var time = root.querySelector('[data-ooh-alpha-level-time]');
    var difficulty = root.querySelector('[data-ooh-alpha-level-difficulty]');
    var summary = root.querySelector('[data-ooh-alpha-level-summary]');
    var consequence = root.querySelector('[data-ooh-alpha-level-consequence]');
    var next = root.querySelector('[data-ooh-alpha-level-next]');
    var shell = root.querySelector('.ooh-operation-alpha-level__shell');
    var latestChoice = choices[choices.length - 1];
    var timerExpired;

    document.body.classList.add('ooh-operation-alpha-level-runtime');
    state.phase = 'escalation-cascade';
    calculatePressure(state);
    writeTimerRemaining(state, readTimerRemaining(state));
    timerExpired = readTimerRemaining(state) <= 0;

    if (wrap) {
      wrap.innerHTML = '';
      beats.forEach(function (beat) {
        var chosen = choices.some(function (item) { return item.id === beat.id; });
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ooh-operation-alpha-level__choice is-danger';
        button.classList.toggle('is-selected', chosen);
        button.classList.toggle('is-disabled', (locked || timerExpired) && !chosen);
        button.disabled = chosen || locked || timerExpired;
        button.innerHTML = '<span>' + beat.title + '</span><strong>SITUATION</strong><p>' + beat.situation + '</p><strong>DIRECTIVE</strong><p>' + beat.directive + '</p><strong>RISK</strong><p>' + beat.risk + '</p><strong>CONSEQUENCE</strong><p>' + beat.consequence + '</p>';
        button.addEventListener('click', function () {
          if (button.disabled) {
            return;
          }
          state = readOAState();
          choices = state.level2Choices || [];
          if (readTimerRemaining(state) <= 0 || choices.length >= requiredChoices || choices.some(function (item) { return item.id === beat.id; })) {
            return;
          }
          choices.push(beat);
          state.level2Choices = choices;
          applyChoiceTimePenalty(state, beat);
          appendChainEvent(state, beat);
          render(root);
          if (choices.length >= requiredChoices && window.oaScrollToNextPhase) {
            window.oaScrollToNextPhase(root, root.querySelector('[data-ooh-alpha-level-next]'));
          }
        });
        wrap.appendChild(button);
      });
    }

    if (count) {
      count.textContent = 'SELECTED: ' + choices.length + ' / REQUIRED: ' + requiredChoices;
    }
    if (time) {
      updateTimerDisplay(root, state);
    }
    if (difficulty) {
      difficulty.textContent = calculateOutcome(state);
    }
    if (consequence) {
      consequence.textContent = latestChoice ? latestChoice.narrative : 'Awaiting escalation directive.';
    }
    renderChainPanel(root, state);
    renderThreeLineSummary(summary, state);
    renderMentionedPortraits(root);
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
    document.querySelectorAll('[data-ooh-alpha-level="2"]').forEach(render);
  }, { once: true });
})();
