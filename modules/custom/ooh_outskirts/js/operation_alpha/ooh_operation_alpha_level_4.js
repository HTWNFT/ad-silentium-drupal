(function () {
  'use strict';

  var stateKey = 'ooh_operation_alpha_chain_state_v1';
  var missionTimerStartSeconds = 210;
  var juiceFactorPenaltySeconds = 10;
  var juiceFactorCooldownMs = 1200;
  var requiredChoices = 3;
  var finalChoices = [
    {
      id: 'save-ronin',
      title: 'SAVE THE RONIN',
      situation: 'Final contact reports the Ronin pinned inside the relay station while the Genealord line opens an escape lane.',
      directive: 'Preserve the Ronin even if the enemy slips the net.',
      risk: 'The mission can succeed, but the Genealord may escape.',
      action: 'Saved the Ronin.',
      reaction: 'The Ronin survived and Kharos withdrew behind a sealed command door.',
      consequence: 'The mission route stayed open and the antagonist escaped.',
      carry: 'Personnel preserved; enemy impact weakened.',
      narrative: 'The Ronin lives because the Unseen Hand chooses a person over the clean kill. Kharos escapes with damaged assets, and that means the victory will have a shadow.',
      outcome: 'PYRRHIC SUCCESS',
      cost: 'Genealord escaped.',
      personnelLost: 0,
      enemyImpact: 'Kharos escaped with damaged assets.',
      pressure: 1,
      trust: 3,
      awareness: 1,
      signal: -8
    },
    {
      id: 'destroy-relay',
      title: 'DESTROY THE RELAY',
      situation: 'The relay keeps feeding enemy pursuit logic into every open channel.',
      directive: 'Burn the relay before it makes the extraction route predictable.',
      risk: 'The operation succeeds, but the ally channel may not survive the blast.',
      action: 'Destroyed the relay.',
      reaction: 'The enemy net collapsed and the allied channel went silent.',
      consequence: 'Extraction opened at a severe relationship cost.',
      carry: 'Enemy command broken; ally lost.',
      narrative: 'The relay dies in a clean burst of light. Enemy pursuit falls apart, but the ally who held that channel disappears with it. The mission survives by burning one of its own bridges.',
      outcome: 'PYRRHIC SUCCESS',
      cost: 'Allied relay lost.',
      personnelLost: 1,
      enemyImpact: 'Enemy command net broken.',
      pressure: -3,
      trust: -2,
      awareness: -2,
      signal: -18
    },
    {
      id: 'extract-asset',
      title: 'EXTRACT THE ASSET',
      situation: 'A civilian route collapses toward the same bridge the asset must cross.',
      directive: 'Extract the asset now and abandon the wider route.',
      risk: 'Saving the asset may abandon future civilian movement.',
      action: 'Extracted the asset.',
      reaction: 'The asset cleared the bridge as the civilian road dropped from the field map.',
      consequence: 'Primary mission succeeded and a future route collapsed.',
      carry: 'Mission preserved; civilian route lost.',
      narrative: 'The asset gets out. That is the clean sentence. The dirty sentence is that the civilian road dies behind them, and everyone left on that route becomes a future consequence.',
      outcome: 'SUCCESS',
      cost: 'Civilian route collapsed.',
      personnelLost: 0,
      enemyImpact: 'Enemy denied the primary asset.',
      pressure: -1,
      trust: -1,
      awareness: 1,
      signal: -10
    },
    {
      id: 'hold-line',
      title: 'HOLD THE LINE',
      situation: 'The clock reaches final closure and every channel asks for authority at once.',
      directive: 'Hold the breach long enough for all surviving assets to move.',
      risk: 'No clean ending remains.',
      action: 'Held the line through final closure.',
      reaction: 'The field held for one impossible interval, then tore.',
      consequence: 'Some survived and the signal nearly died.',
      carry: 'Personnel lost; signal critical.',
      narrative: 'The line holds because someone pays for the seconds. The field does not forgive the debt. Survivors make it through, and the signal comes out sounding like a wound.',
      outcome: 'SIGNAL LOST',
      cost: 'Signal collapsed after extraction window.',
      personnelLost: 2,
      enemyImpact: 'Enemy advance delayed, not defeated.',
      pressure: -2,
      trust: 1,
      awareness: 0,
      signal: -35
    },
    {
      id: 'burn-channel',
      title: 'BURN THE CHANNEL',
      situation: 'The enemy has learned enough of the channel to follow the operation into the next field.',
      directive: 'Destroy the channel and preserve the mission record.',
      risk: 'The mission survives, but future contact with this network may be impossible.',
      action: 'Burned the channel.',
      reaction: 'The enemy lost the trace and every friendly voice vanished into static.',
      consequence: 'The mission record survived while the network went dark.',
      carry: 'Mission preserved; signal future sacrificed.',
      narrative: 'The channel burns clean. The enemy loses the handhold, and the Ronin network loses its voice. The Unseen Hand preserves the mission by accepting silence afterward.',
      outcome: 'SUCCESS',
      cost: 'Friendly channel burned.',
      personnelLost: 0,
      enemyImpact: 'Enemy trace severed.',
      pressure: -1,
      trust: -2,
      awareness: -3,
      signal: -22
    }
  ];

  function defaultState() {
    return { pressure: 0, trust: 0, enemyAwareness: 0, signalIntegrity: 100, chain: [], level4Choices: [], narrativeSelections: {}, narrativeTokens: {}, finalDecision: null, finalMissionLocked: false, missionTimerSeconds: missionTimerStartSeconds, juiceFactorUses: 0, lastJuiceFactorAt: 0 };
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
    normalizeMissionTimer(state);
    return state;
  }

  function calculateOutcome(state) {
    var choices = state.level4Choices || [];
    if (!state.finalMissionLocked) {
      return choices.length >= requiredChoices ? 'READY' : 'LOCKED';
    }
    if (state.signalIntegrity <= 10) {
      return 'NO GO';
    }
    if (state.missionTimerSeconds <= 0 || state.enemyAwareness > state.trust + 8) {
      return 'NO GO';
    }
    return state.finalDecision ? 'GO' : 'NO GO';
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

  function finalLibraryChoices(state) {
    return finalChoices.map(function (choice, index) {
      var entry = narrativeEntry(state, 'level4_' + choice.id, 'finalSacrificeTemplates', index + 13);
      var hookEntry = narrativeEntry(state, 'level4_hook_' + choice.id, 'consequenceHookTemplates', index + 14);

      if (!entry) {
        return choice;
      }

      return Object.assign({}, choice, {
        situation: fillNarrativeText(entry.text, state.narrativeTokens),
        consequence: hookEntry ? fillNarrativeText(hookEntry.text, state.narrativeTokens) : choice.consequence,
        narrative: fillNarrativeText(entry.text, state.narrativeTokens)
      });
    });
  }

  function renderChainPanel(root, state) {
    var panel = root.querySelector('[data-ooh-alpha-chain-panel]');
    var latest = (state.chain || [])[state.chain.length - 1];
    if (!panel) {
      return;
    }
    panel.innerHTML = latest ? '<p>ACTION: ' + latest.action + '</p><p>REACTION: ' + latest.reaction + '</p><p>CONSEQUENCE: ' + latest.consequence + '</p><p>CARRY-FORWARD EFFECT: ' + latest.carry + '</p>' : '<p>ACTION: Awaiting final directive.</p><p>REACTION: Last Light holding.</p><p>CONSEQUENCE: Final cost unresolved.</p><p>CARRY-FORWARD EFFECT: Mission not finalized.</p>';
  }

  function renderThreeLineSummary(target, state) {
    var choices = state.level4Choices || [];
    if (!target) {
      return;
    }
    if (!choices.length) {
      target.textContent = 'FINAL CONTACT / EXTRACTION WINDOW / LAST DIRECTIVE';
      return;
    }
    target.textContent = choices.map(function (choice) { return choice.title; }).slice(0, 3).join(' / ');
  }

  function setText(root, selector, value) {
    var node = root.querySelector(selector);
    if (node) {
      node.textContent = value;
    }
  }

  function setDisabled(button, disabled) {
    if (!button) {
      return;
    }
    button.disabled = disabled;
    button.classList.toggle('is-disabled', disabled);
    button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    button.setAttribute('tabindex', disabled ? '-1' : '0');
  }

  function normalizeMissionTimer(state) {
    if (typeof state.missionTimerSeconds !== 'number' || !isFinite(state.missionTimerSeconds)) {
      state.missionTimerSeconds = missionTimerStartSeconds;
    }
    state.missionTimerSeconds = Math.max(0, Math.min(missionTimerStartSeconds, Math.floor(state.missionTimerSeconds)));
    state.juiceFactorUses = Math.max(0, parseInt(state.juiceFactorUses || 0, 10));
    return state;
  }

  function formatMissionTime(seconds) {
    var safeSeconds = Math.max(0, Math.floor(seconds || 0));
    var minutes = Math.floor(safeSeconds / 60);
    var remainder = String(safeSeconds % 60).padStart(2, '0');

    return minutes + ':' + remainder;
  }

  function useJuiceFactor(state) {
    var now = Date.now();

    normalizeMissionTimer(state);
    if (state.finalMissionLocked || now - (state.lastJuiceFactorAt || 0) < juiceFactorCooldownMs) {
      return false;
    }
    state.lastJuiceFactorAt = now;
    state.juiceFactorUses += 1;
    state.missionTimerSeconds = Math.max(0, state.missionTimerSeconds - juiceFactorPenaltySeconds);
    writeOAState(state);
    return true;
  }

  function renderMissionFramework(root, state) {
    var timer = root.querySelector('[data-ooh-alpha-mission-timer]');
    var juiceButton = root.querySelector('[data-ooh-alpha-juice-factor]');
    var juiceStatus = root.querySelector('[data-ooh-alpha-juice-status]');

    normalizeMissionTimer(state);
    if (timer) {
      timer.textContent = formatMissionTime(state.missionTimerSeconds);
    }
    if (juiceButton) {
      juiceButton.disabled = !!state.finalMissionLocked || state.missionTimerSeconds <= 0;
      juiceButton.setAttribute('aria-disabled', juiceButton.disabled ? 'true' : 'false');
    }
    if (juiceStatus) {
      juiceStatus.textContent = 'JUICE FACTOR USES: ' + state.juiceFactorUses + ' / COST: -' + juiceFactorPenaltySeconds + ' SECONDS EACH';
    }
  }
  function renderTransmissionIdentity(root, state, latest) {
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

  function summarizeFinalDecision(choices) {
    var personnelLost = choices.reduce(function (sum, item) { return sum + (item.personnelLost || 0); }, 0);
    var signalCost = choices.reduce(function (sum, item) { return sum + Math.abs(Math.min(0, item.signal || 0)); }, 0);
    var harshest = choices.reduce(function (current, item) {
      return !current || (item.personnelLost || 0) > (current.personnelLost || 0) ? item : current;
    }, choices[0]);
    var outcome = personnelLost >= 2 || signalCost >= 45 ? 'SIGNAL LOST' : (personnelLost > 0 || signalCost >= 25 ? 'PYRRHIC SUCCESS' : 'SUCCESS');

    return {
      id: 'final-mission-lock',
      title: 'FINALIZE MISSION',
      action: 'Locked the final mission sequence.',
      reaction: 'Command sealed the operation and produced the AAR.',
      consequence: outcome + ' recorded after ' + choices.map(function (choice) { return choice.title; }).join(', ') + '.',
      carry: 'Final cost locked.',
      narrative: 'The final decision sequence is no longer theoretical. The Unseen Hand has chosen what to save and what to lose.',
      outcome: outcome,
      cost: choices.map(function (choice) { return choice.cost; }).join(' / '),
      personnelLost: personnelLost,
      enemyImpact: harshest ? harshest.enemyImpact : 'Enemy impact unresolved.',
      pressure: 0,
      trust: 0,
      awareness: 0,
      signal: 0
    };
  }

  function renderAar(root, state) {
    var popup = root.querySelector('[data-ooh-alpha-final-aar]');
    var decisions = (state.level4Choices || []).map(function (item) { return item.title; }).join(' / ');
    var bonus = root.querySelector('[data-ooh-alpha-final-bonus]');
    var choices = state.level4Choices || [];
    var latest = choices[choices.length - 1];

    if (!popup) {
      return;
    }
    renderTransmissionIdentity(root, state, latest);
    if (bonus) {
      bonus.hidden = false;
    }
    popup.hidden = !state.finalMissionLocked;
    if (!state.finalMissionLocked) {
      return;
    }
    setText(root, '[data-ooh-alpha-final-aar-status]', 'MISSION STATUS: ' + calculateOutcome(state));
    setText(root, '[data-ooh-alpha-final-aar-decisions]', 'KEY DECISIONS: ' + decisions);
    setText(root, '[data-ooh-alpha-final-aar-cost]', 'FINAL COST: ' + state.missionCost + ' / PERSONNEL LOST: ' + state.personnelLost + ' / SIGNAL STABILITY: ' + state.signalIntegrity + '%');
    setText(root, '[data-ooh-alpha-final-aar-impact]', 'IMPACT: The operation is complete. The cost will keep moving through every surviving route.');
  }

  function bindTryAgain(root) {
    root.querySelectorAll('[data-ooh-alpha-try-again]').forEach(function (link) {
      if (link.oohAlphaTryAgainBound) {
        return;
      }
      link.oohAlphaTryAgainBound = true;
      link.addEventListener('click', function () {
        if (window.resetOperationAlphaRun) {
          window.resetOperationAlphaRun(true);
        }
        else {
          window.localStorage.removeItem(stateKey);
        }
      });
    });
  }

  function render(root) {
    var state = readOAState();
    var choices = state.level4Choices || [];
    var activeChoices = finalLibraryChoices(state);
    var locked = choices.length >= requiredChoices;
    var wrap = root.querySelector('[data-ooh-alpha-level-choices]');
    var pressure = root.querySelector('[data-ooh-alpha-final-pressure]');
    var time = root.querySelector('[data-ooh-alpha-final-time]');
    var juiceButton = root.querySelector('[data-ooh-alpha-juice-factor]');
    var finalState = root.querySelector('[data-ooh-alpha-final-state]');
    var count = root.querySelector('[data-ooh-alpha-level-count]');
    var summary = root.querySelector('[data-ooh-alpha-final-summary]');
    var consequence = root.querySelector('[data-ooh-alpha-level-consequence]');
    var finalize = root.querySelector('[data-ooh-alpha-finalize]');
    var shell = root.querySelector('.ooh-operation-alpha-level__shell');
    var latestChoice = choices[choices.length - 1];

    document.body.classList.add('ooh-operation-alpha-level-runtime');
    state.phase = 'last-light';
    calculatePressure(state);

    if (wrap) {
      wrap.innerHTML = '';
      activeChoices.forEach(function (choice) {
        var chosen = choices.some(function (item) { return item.id === choice.id; });
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ooh-operation-alpha-level__choice is-danger';
        button.classList.toggle('is-selected', chosen);
        button.classList.toggle('is-disabled', locked && !chosen);
        button.disabled = chosen || locked || state.finalMissionLocked;
        button.innerHTML = '<span>' + choice.title + '</span><strong>SITUATION</strong><p>' + choice.situation + '</p><strong>DIRECTIVE</strong><p>' + choice.directive + '</p><strong>RISK</strong><p>' + choice.risk + '</p><strong>CONSEQUENCE</strong><p>' + choice.consequence + '</p>';
        button.addEventListener('click', function () {
          if (button.disabled) {
            return;
          }
          state = readOAState();
          choices = state.level4Choices || [];
          if (choices.length >= requiredChoices || choices.some(function (item) { return item.id === choice.id; })) {
            return;
          }
          choices.push(choice);
          state.level4Choices = choices;
          appendChainEvent(state, choice);
          render(root);
          if (choices.length >= requiredChoices && window.oaScrollToNextPhase) {
            window.oaScrollToNextPhase(root, root.querySelector('[data-ooh-alpha-finalize]'));
          }
        });
        wrap.appendChild(button);
      });
    }

    if (pressure) {
      pressure.textContent = String(Math.max(0, state.pressure + state.enemyAwareness)).padStart(2, '0');
    }
    if (time) {
      time.textContent = state.finalMissionLocked ? 'CLOSED' : 'COUNTDOWN ' + formatMissionTime(state.missionTimerSeconds);
    }
    if (finalState) {
      finalState.textContent = calculateOutcome(state);
    }
    if (count) {
      count.textContent = 'SELECTED: ' + choices.length + ' / REQUIRED: ' + requiredChoices;
    }
    if (consequence) {
      consequence.textContent = latestChoice ? latestChoice.narrative : 'Awaiting final directive.';
    }
    renderChainPanel(root, state);
    renderThreeLineSummary(summary, state);
    renderMissionFramework(root, state);
    setDisabled(finalize, !locked || state.finalMissionLocked);
    if (juiceButton && !juiceButton.oohAlphaJuiceBound) {
      juiceButton.oohAlphaJuiceBound = true;
      juiceButton.addEventListener('click', function () {
        state = readOAState();
        if (useJuiceFactor(state)) {
          render(root);
          if (window.oaScrollToNextPhase) {
            window.oaScrollToNextPhase(root, root.querySelector('[data-ooh-alpha-mission-timer]'));
          }
        }
      });
    }
    if (finalize && !finalize.oohAlphaFinalizeBound) {
      finalize.oohAlphaFinalizeBound = true;
      finalize.addEventListener('click', function () {
        state = readOAState();
        choices = state.level4Choices || [];
        if (choices.length < requiredChoices || state.finalMissionLocked) {
          return;
        }
        state.finalMissionLocked = true;
        state.finalDecision = summarizeFinalDecision(choices);
        state.personnelLost = state.finalDecision.personnelLost;
        state.enemyImpact = state.finalDecision.enemyImpact;
        state.missionCost = state.finalDecision.cost;
        appendChainEvent(state, state.finalDecision);
        render(root);
        if (window.oaScrollToNextPhase) {
          window.oaScrollToNextPhase(root, root.querySelector('[data-ooh-alpha-final-aar]'));
        }
        window.setTimeout(function () {
          window.location.href = finalize.getAttribute('data-ooh-alpha-finale-url') || '/operation-alpha/oafinale';
        }, 650);
      });
    }
    if (shell) {
      shell.classList.toggle('is-stage-complete', locked);
    }
    renderAar(root, state);
    bindTryAgain(root);
    writeOAState(state);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-ooh-alpha-level="4"]').forEach(render);
  }, { once: true });
})();


