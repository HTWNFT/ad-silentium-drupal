(function () {
  'use strict';

  var stateKey = 'ooh_operation_alpha_chain_state_v1';
  var requiredChoices = 4;

  function defaultState() {
    return { pressure: 0, trust: 0, enemyAwareness: 0, signalIntegrity: 100, chain: [], introChoices: [], level1Choices: [], level2Choices: [], level4Choices: [], narrativeSelections: {}, narrativeTokens: {} };
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

    return responseBeats(state).map(function (beat, index) {
      var sectionName = sections[index % sections.length];
      var entry = narrativeEntry(state, 'level2_' + beat.id, sectionName, index + 9);
      var hookEntry = narrativeEntry(state, 'level2_hook_' + beat.id, 'consequenceHookTemplates', index + 8);

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

    document.body.classList.add('ooh-operation-alpha-level-runtime');
    state.phase = 'escalation-cascade';
    calculatePressure(state);

    if (wrap) {
      wrap.innerHTML = '';
      beats.forEach(function (beat) {
        var chosen = choices.some(function (item) { return item.id === beat.id; });
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ooh-operation-alpha-level__choice is-danger';
        button.classList.toggle('is-selected', chosen);
        button.classList.toggle('is-disabled', locked && !chosen);
        button.disabled = chosen || locked;
        button.innerHTML = '<span>' + beat.title + '</span><strong>SITUATION</strong><p>' + beat.situation + '</p><strong>DIRECTIVE</strong><p>' + beat.directive + '</p><strong>RISK</strong><p>' + beat.risk + '</p><strong>CONSEQUENCE</strong><p>' + beat.consequence + '</p>';
        button.addEventListener('click', function () {
          if (button.disabled) {
            return;
          }
          state = readOAState();
          choices = state.level2Choices || [];
          if (choices.length >= requiredChoices || choices.some(function (item) { return item.id === beat.id; })) {
            return;
          }
          choices.push(beat);
          state.level2Choices = choices;
          appendChainEvent(state, beat);
          render(root);
        });
        wrap.appendChild(button);
      });
    }

    if (count) {
      count.textContent = 'SELECTED: ' + choices.length + ' / REQUIRED: ' + requiredChoices;
    }
    if (time) {
      time.textContent = 'CLOSURE 04:' + String(Math.max(0, 59 - (choices.length * 11))).padStart(2, '0');
    }
    if (difficulty) {
      difficulty.textContent = calculateOutcome(state);
    }
    if (consequence) {
      consequence.textContent = latestChoice ? latestChoice.narrative : 'Awaiting escalation directive.';
    }
    renderChainPanel(root, state);
    renderThreeLineSummary(summary, state);
    setDisabled(next, !locked);
    bindLockedLink(next);
    bindTransmissionLink(root, next);
    if (shell) {
      shell.classList.toggle('is-stage-complete', locked);
    }
    writeOAState(state);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-ooh-alpha-level="2"]').forEach(render);
  }, { once: true });
})();
