(function () {
  'use strict';

  var stateKey = 'ooh_operation_alpha_chain_state_v1';
  var playlistKey = 'ooh_operation_alpha_playlist_selection_v1';
  var requiredChoices = 6;
  var beats = [
    {
      id: 'ally-introduced',
      title: 'ALLY INTRODUCED',
      situation: 'A Ronin relay answers from a half-buried station south of the corridor.',
      directive: 'Bring the ally into the active route or keep them clear of the signal.',
      risk: 'Trust improves, but the relay becomes easier to trace.',
      action: 'Brought the Ronin relay into the route.',
      reaction: 'The ally opened a side channel and asked for cover.',
      consequence: 'Route intelligence improved while the relay became visible.',
      carry: 'Trust increased; enemy awareness rose.',
      narrative: 'The relay answers with a real voice instead of static. The ally gives the Unseen Hand a cleaner map and becomes someone the enemy can hurt. The route is smarter now, and more human.',
      pressure: 1,
      trust: 2,
      awareness: 1,
      signal: -1
    },
    {
      id: 'enemy-movement',
      title: 'ENEMY MOVEMENT',
      situation: 'Genealord patrols split into two hunting lanes and begin checking abandoned markers.',
      directive: 'Shape the patrol path before it crosses the Ronin line.',
      risk: 'False movement protects the route but burns signal integrity.',
      action: 'Seeded false movement into the patrol lane.',
      reaction: 'Enemy scouts pursued a phantom trail.',
      consequence: 'The Ronin gained distance while the signal lost fidelity.',
      carry: 'Route safer; signal weaker.',
      narrative: 'The patrol takes the bait. For one clean interval, the Ronin moves without eyes on him. The cost is a dirtier channel, and every future command will arrive with more static in its teeth.',
      pressure: -1,
      trust: 1,
      awareness: 1,
      signal: -2
    },
    {
      id: 'signal-distortion',
      title: 'SIGNAL DISTORTION',
      situation: 'The selected channel fractures into duplicate pings across the relay grid.',
      directive: 'Stabilize the signal or exploit the distortion.',
      risk: 'Stability costs time; exploitation increases confusion.',
      action: 'Exploited the distortion to hide active movement.',
      reaction: 'The field flooded with unreadable traffic.',
      consequence: 'Enemy coordination stuttered and signal integrity degraded.',
      carry: 'Enemy awareness dipped; signal stability fell.',
      narrative: 'The field becomes a room full of voices. Enemy command loses the clean thread, but the Unseen Hand does too. This works because it is ugly, not because it is safe.',
      pressure: 0,
      trust: 0,
      awareness: -1,
      signal: -3
    },
    {
      id: 'civilian-contact',
      title: 'CIVILIAN CONTACT',
      situation: 'A civilian convoy enters the same corridor the Ronin needs for extraction.',
      directive: 'Protect the convoy, reroute it, or leave it outside the mission path.',
      risk: 'Protection slows the operation; abandonment damages trust.',
      action: 'Diverted the convoy through a shielded service road.',
      reaction: 'The convoy survived the first sweep but reported the channel active.',
      consequence: 'Civilian route remained viable and pressure rose.',
      carry: 'Trust increased; pressure rose.',
      narrative: 'The convoy survives because the Unseen Hand spends attention on people who were not in the original plan. That mercy buys trust. It also gives the field one more moving piece to endanger.',
      pressure: 1,
      trust: 2,
      awareness: 0,
      signal: -1
    },
    {
      id: 'mutant-activity',
      title: 'MUTANT ACTIVITY',
      situation: 'Mutant pressure scratches at the Genealord field and forces a violent correction.',
      directive: 'Bait the mutant activity away from the Ronin corridor.',
      risk: 'The bait may become a larger threat later.',
      action: 'Dragged mutant pressure toward an empty signal pocket.',
      reaction: 'The hunting pack relocated, then began learning the pattern.',
      consequence: 'Immediate route pressure dropped and future danger sharpened.',
      carry: 'Pressure dropped; enemy awareness increased.',
      narrative: 'The mutant pack leaves the Ronin line, but it does not vanish. It learns. The corridor breathes easier now, and the next movement will have teeth behind it.',
      pressure: -2,
      trust: 0,
      awareness: 2,
      signal: -1
    },
    {
      id: 'route-exposure',
      title: 'ROUTE EXPOSURE',
      situation: 'A clean extraction road appears, but the enemy can see part of its northern edge.',
      directive: 'Move quickly or conceal the road before committing.',
      risk: 'Speed preserves time; concealment preserves the route.',
      action: 'Traded speed for cover along the exposed edge.',
      reaction: 'The Ronin lost minutes but avoided a direct mark.',
      consequence: 'Route remained open under reduced visibility.',
      carry: 'Trust increased; enemy awareness reduced.',
      narrative: 'The road stays alive because speed is sacrificed. The Ronin hates the delay, but he remains unmarked. A slower route is still a route.',
      pressure: 0,
      trust: 1,
      awareness: -1,
      signal: -1
    },
    {
      id: 'opportunity',
      title: 'OPPORTUNITY',
      situation: 'A Genealord courier breaks from formation carrying command-authenticated traffic.',
      directive: 'Intercept the courier or keep the route concealed.',
      risk: 'Interception gives leverage but reveals the Unseen Hand.',
      action: 'Intercepted the courier signal.',
      reaction: 'Command traffic opened for seven seconds.',
      consequence: 'Enemy intent became readable and the listener became more exposed.',
      carry: 'Enemy awareness increased; intent clarified.',
      narrative: 'Seven seconds is enough to see the shape of the hunt. It is also enough for the enemy to feel fingers in the wire. The Unseen Hand knows more, and is less hidden.',
      pressure: 1,
      trust: 0,
      awareness: 2,
      signal: 0
    },
    {
      id: 'commitment',
      title: 'COMMITMENT',
      situation: 'The Ronin asks for a final field commitment before entering contested ground.',
      directive: 'Commit resources now or preserve them for the crisis.',
      risk: 'Commitment protects the Ronin but leaves fewer reserves.',
      action: 'Committed field resources to the Ronin line.',
      reaction: 'The Ronin advanced and the reserve pool thinned.',
      consequence: 'The operation gained momentum at a future cost.',
      carry: 'Trust increased; pressure increased.',
      narrative: 'The Ronin moves because the Unseen Hand finally spends resources. The field feels the commitment immediately. So does the enemy.',
      pressure: 2,
      trust: 2,
      awareness: 0,
      signal: -1
    }
  ];

  function defaultState() {
    return { phase: 'field-pressure', pressure: 0, trust: 0, enemyAwareness: 0, signalIntegrity: 100, chain: [], introChoices: [], level1Choices: [], level2Choices: [], level4Choices: [], narrativeSelections: {}, narrativeTokens: {}, finalDecision: null };
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
    return state;
  }

  function calculateOutcome(state) {
    return (state.level1Choices || []).length >= requiredChoices ? 'READY' : 'LOCKED';
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

  function levelOneBeats(state) {
    return beats.map(function (beat, index) {
      var sectionName = index % 2 === 0 ? 'allyIntroTemplates' : 'complicationTemplates';
      var entry = narrativeEntry(state, 'level1_' + beat.id, sectionName, index + 5);
      var hookEntry = narrativeEntry(state, 'level1_hook_' + beat.id, 'consequenceHookTemplates', index + 1);

      if (!entry) {
        return beat;
      }

      return Object.assign({}, beat, {
        situation: fillNarrativeText(entry.text, state.narrativeTokens),
        consequence: hookEntry ? fillNarrativeText(hookEntry.text, state.narrativeTokens) : beat.consequence,
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
    panel.innerHTML = latest ? '<p>ACTION: ' + latest.action + '</p><p>REACTION: ' + latest.reaction + '</p><p>CONSEQUENCE: ' + latest.consequence + '</p><p>CARRY-FORWARD EFFECT: ' + latest.carry + '</p>' : '<p>ACTION: Awaiting decision.</p><p>REACTION: Field quiet.</p><p>CONSEQUENCE: No change recorded.</p><p>CARRY-FORWARD EFFECT: Risk unresolved.</p>';
  }

  function renderThreeLineSummary(target, state) {
    var choices = state.level1Choices || [];
    var a = choices[0] ? choices[0].title : 'RONIN LINE FORMS';
    var b = choices[2] ? choices[2].title : 'ROUTE PRESSURE BUILDS';
    var c = choices[5] ? choices[5].title : 'ESCALATION WAITS';
    if (target) {
      target.textContent = a + ' / ' + b + ' / ' + c;
    }
  }

  function readPlaylistTitle() {
    try {
      var stored = JSON.parse(window.localStorage.getItem(playlistKey) || '{}');
      return stored.title || 'LOCAL SIGNAL';
    }
    catch (e) {
      return 'LOCAL SIGNAL';
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
    var latest = (state.level1Choices || [])[state.level1Choices.length - 1];
    var transmission = narrativeEntry(state, 'level1Transmission', 'unseenHandTransmissionTemplates', 41);
    var summaryText = transmission ? fillNarrativeText(transmission.text, state.narrativeTokens) : '';
    if (!popup) {
      window.location.href = href;
      return;
    }
    renderTransmissionIdentity(root, state, latest);
    root.querySelector('[data-ooh-alpha-transmission-title]').textContent = 'Field pressure complete.';
    root.querySelector('[data-ooh-alpha-transmission-summary]').textContent = (summaryText || (latest ? latest.narrative : 'The route remains open. The next phase will demand more.')) + ' The Ronin remains operational. The next decision will not be lighter.';
    root.querySelector('[data-ooh-alpha-transmission-gain]').textContent = 'GAIN: The first field chain is readable.';
    root.querySelector('[data-ooh-alpha-transmission-loss]').textContent = 'LOSS: Every clean route now carries a cost.';
    root.querySelector('[data-ooh-alpha-transmission-danger]').textContent = 'DANGER: Enemy adaptation is already forming.';
    writeOAState(state);
    if (next) {
      next.href = href;
    }
    popup.hidden = false;
    popup.setAttribute('aria-hidden', 'false');
  }

  function logLevelOneProgress(selectedCount, requiredCount, nextUnlocked, nextHref) {
    if (!window.console || !window.console.log) {
      return;
    }
    window.console.log('[OA level1] selected count:', selectedCount);
    window.console.log('[OA level1] required count:', requiredCount);
    window.console.log('[OA level1] next stage unlocked:', nextUnlocked);
    window.console.log('[OA level1] next stage href:', nextHref || 'missing');
  }

  function scrollToLevelOneActions(root) {
    var target = root.querySelector('[data-ooh-alpha-level-actions]') || root.querySelector('[data-ooh-alpha-level-next]');
    if (!window.oaScrollToNextPhase) {
      return;
    }

    window.oaScrollToNextPhase(root, target);
  }
  function bindTransmissionLink(root, link) {
    if (!link || link.oohAlphaTransmissionBound) {
      return;
    }
    link.oohAlphaTransmissionBound = true;
    link.addEventListener('click', function (event) {
      var currentState = readOAState();
      if (link.getAttribute('aria-disabled') === 'true' || (currentState.level1Choices || []).length < requiredChoices) {
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
    var selected = state.level1Choices || [];
    var activeBeats = levelOneBeats(state);
    var locked = selected.length >= requiredChoices;
    var choiceWrap = root.querySelector('[data-ooh-alpha-level-choices]');
    var count = root.querySelector('[data-ooh-alpha-level-count]');
    var fieldState = root.querySelector('[data-ooh-alpha-level-state]');
    var signal = root.querySelector('[data-ooh-alpha-level-signal]');
    var summary = root.querySelector('[data-ooh-alpha-level-summary]');
    var consequence = root.querySelector('[data-ooh-alpha-level-consequence]');
    var next = root.querySelector('[data-ooh-alpha-level-next]');
    var shell = root.querySelector('.ooh-operation-alpha-level__shell');
    var latestSelected = selected[selected.length - 1];

    document.body.classList.add('ooh-operation-alpha-level-runtime');
    state.phase = 'field-pressure';
    calculatePressure(state);

    if (choiceWrap) {
      choiceWrap.innerHTML = '';
      activeBeats.forEach(function (beat) {
        var selectedBeat = selected.some(function (item) { return item.id === beat.id; });
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ooh-operation-alpha-level__choice';
        button.classList.toggle('is-selected', selectedBeat);
        button.classList.toggle('is-disabled', locked && !selectedBeat);
        button.disabled = selectedBeat || locked;
        button.innerHTML = '<span>' + beat.title + '</span><strong>SITUATION</strong><p>' + beat.situation + '</p><strong>DIRECTIVE</strong><p>' + beat.directive + '</p><strong>RISK</strong><p>' + beat.risk + '</p><strong>CONSEQUENCE</strong><p>' + beat.consequence + '</p>';
        button.addEventListener('click', function () {
          if (button.disabled) {
            return;
          }
          state = readOAState();
          selected = state.level1Choices || [];
          if (selected.length >= requiredChoices || selected.some(function (item) { return item.id === beat.id; })) {
            return;
          }
          selected.push(beat);
          state.level1Choices = selected;
          appendChainEvent(state, beat);
          render(root);
          if (selected.length >= requiredChoices) {
            scrollToLevelOneActions(root);
          }
        });
        choiceWrap.appendChild(button);
      });
    }

    if (count) {
      count.textContent = 'SELECTED: ' + selected.length + ' / REQUIRED: ' + requiredChoices;
    }
    if (fieldState) {
      fieldState.textContent = calculateOutcome(state);
    }
    if (signal) {
      signal.textContent = readPlaylistTitle();
    }
    if (consequence) {
      consequence.textContent = latestSelected ? latestSelected.narrative : 'Awaiting Unseen Hand directive.';
    }
    renderChainPanel(root, state);
    renderThreeLineSummary(summary, state);
    setDisabled(next, !locked);
    logLevelOneProgress(selected.length, requiredChoices, locked, next ? next.getAttribute('href') || next.dataset.oaHref : '');
    bindLockedLink(next);
    bindTransmissionLink(root, next);
    if (shell) {
      shell.classList.toggle('is-stage-complete', locked);
    }
    writeOAState(state);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-ooh-alpha-level="1"]').forEach(render);
  }, { once: true });
})();

