(function () {
  'use strict';

  var storageKey = 'ooh_operation_alpha_intro_seen_v1';
  var scenarioDelayMs = 1500;

  var scenarios = [
    {
      title: 'RONIN CELL DETECTED',
      situation: [
        'Civilian transport is stalled near a collapsing signal corridor.',
        'A Genetic Warlord patrol is moving through the outer fog.'
      ],
      pressure: 'WARLORD PATROL RISING',
      buttons: ['OPEN EXTRACTION WINDOW', 'SCRAMBLE WARLORD SIGNAL', 'REDIRECT RONIN CELL'],
      reactions: [
        'Extraction window opened. Civilian survival probability increased.',
        'Signal interference detected. Warlord pressure delayed.',
        'Ronin movement redirected. Secondary instability rising.'
      ]
    },
    {
      title: 'MUTANT CONVOY SPLIT',
      situation: [
        'A mutant convoy is crossing an unstable service bridge.',
        'Two civilian scouts are hidden below the broken span.'
      ],
      pressure: 'MUTANT ROUTE PRESSURE',
      buttons: ['DIM BRIDGE SIGNAL', 'MASK SCOUT HEAT', 'SHIFT CONVOY TIMING'],
      reactions: [
        'Bridge signal dimmed. Convoy speed reduced.',
        'Scout heat masked. Detection risk lowered.',
        'Convoy timing shifted. Reality shear increased nearby.'
      ]
    },
    {
      title: 'CIVILIAN CHANNEL FRACTURE',
      situation: [
        'A shelter channel is broadcasting across two overlapping realities.',
        'Warlord listeners are triangulating the repeated echo.'
      ],
      pressure: 'CIVILIAN SIGNAL EXPOSED',
      buttons: ['NARROW THE BROADCAST', 'SEED FALSE ECHO', 'ANCHOR SHELTER CHANNEL'],
      reactions: [
        'Broadcast narrowed. Shelter location partially concealed.',
        'False echo seeded. Warlord listeners diverted.',
        'Shelter channel anchored. Cross-reality noise reduced.'
      ]
    },
    {
      title: 'RONIN OATH CONFLICT',
      situation: [
        'A Ronin group refuses a Warlord summons at a ruined checkpoint.',
        'The checkpoint reality is bending under conflicting commands.'
      ],
      pressure: 'RONIN VOLTAGE UNSTABLE',
      buttons: ['HARDEN CHECKPOINT STATIC', 'WEAKEN WARLORD ORDER', 'OPEN NEUTRAL PATH'],
      reactions: [
        'Checkpoint static hardened. Direct pursuit slowed.',
        'Warlord order weakened. Ronin resistance holds longer.',
        'Neutral path opened. Unknown movement enters the gap.'
      ]
    },
    {
      title: 'FUTURE TRACE BLEED',
      situation: [
        'A future city trace is bleeding into a present-day drainage tunnel.',
        'Civilians nearby are following lights that should not exist yet.'
      ],
      pressure: 'REALITY BLEED ACTIVE',
      buttons: ['LOWER FUTURE LUMINANCE', 'MARK SAFE EXIT', 'SEAL TRACE EDGE'],
      reactions: [
        'Future luminance lowered. Civilian draw reduced.',
        'Safe exit marked. Group movement stabilizing.',
        'Trace edge sealed. Residual pressure remains inside the tunnel.'
      ]
    },
    {
      title: 'GENETIC WARLORD RELAY',
      situation: [
        'A Warlord relay tower is repeating clan commands through wet concrete.',
        'Mutant responders are changing direction with each pulse.'
      ],
      pressure: 'CLAN RELAY ACTIVE',
      buttons: ['DESYNC RELAY PULSE', 'FLOOD CONCRETE CHANNEL', 'SPLIT MUTANT RESPONSE'],
      reactions: [
        'Relay pulse desynced. Clan command cohesion reduced.',
        'Concrete channel flooded. Signal clarity degraded.',
        'Mutant response split. Pressure spreads but slows.'
      ]
    },
    {
      title: 'UNMARKED FAMILY CACHE',
      situation: [
        'A family cache is exposed between two abandoned road markers.',
        'Ronin scouts and mutant scavengers are both approaching.'
      ],
      pressure: 'CACHE DISCOVERY IMMINENT',
      buttons: ['COVER CACHE SIGNATURE', 'DRAW RONIN SCOUTS EAST', 'MISALIGN SCAVENGER PATH'],
      reactions: [
        'Cache signature covered. Discovery window narrowed.',
        'Ronin scouts drawn east. Civilian recovery chance improved.',
        'Scavenger path misaligned. Local terrain instability increased.'
      ]
    },
    {
      title: 'PATROL MEMORY LOOP',
      situation: [
        'A Warlord patrol is repeating the same street search every ninety seconds.',
        'A trapped civilian group is waiting for the loop to break.'
      ],
      pressure: 'PATROL LOOP LOCKED',
      buttons: ['STRETCH LOOP INTERVAL', 'BLIND THIRD PASS', 'OPEN SIDE STREET'],
      reactions: [
        'Loop interval stretched. Escape timing improved.',
        'Third pass blinded. Patrol confidence degraded.',
        'Side street opened. Civilian movement possible but exposed.'
      ]
    },
    {
      title: 'MUTANT TRUCE STATIC',
      situation: [
        'Two mutant groups are holding a fragile truce at a waterline.',
        'A Warlord clan signal is trying to turn the meeting violent.'
      ],
      pressure: 'TRUCE UNDER SIGNAL LOAD',
      buttons: ['FILTER CLAN SIGNAL', 'STABILIZE WATERLINE', 'REDIRECT AGITATOR TRACE'],
      reactions: [
        'Clan signal filtered. Truce duration extended.',
        'Waterline stabilized. Field noise reduced.',
        'Agitator trace redirected. Secondary group now suspicious.'
      ]
    },
    {
      title: 'CROSS-REALITY BLACKOUT',
      situation: [
        'A present-day block has gone dark under future-grid interference.',
        'Civilian radios are receiving instructions from incompatible timelines.'
      ],
      pressure: 'TIMELINE NOISE HIGH',
      buttons: ['GROUND FUTURE GRID', 'PRIORITIZE CIVILIAN RADIO', 'CUT FALSE INSTRUCTION'],
      reactions: [
        'Future grid grounded. Power flicker contained.',
        'Civilian radio prioritized. Local coordination restored.',
        'False instruction cut. Timeline noise recoils outward.'
      ]
    },
    {
      title: 'RONIN EXTRACTION DOUBT',
      situation: [
        'A Ronin courier is carrying a civilian route map through signal fog.',
        'The courier is hesitating as Warlord pressure closes behind them.'
      ],
      pressure: 'COURIER RESOLVE WAVERING',
      buttons: ['CLARIFY ROUTE MAP', 'OBSCURE PURSUIT LINE', 'STRENGTHEN COURIER SIGNAL'],
      reactions: [
        'Route map clarified. Courier movement resumes.',
        'Pursuit line obscured. Warlord pressure delayed.',
        'Courier signal strengthened. Fog responds unpredictably.'
      ]
    },
    {
      title: 'UNSTABLE SAFEHOUSE',
      situation: [
        'A safehouse is half-present and half-future after a corridor collision.',
        'Civilians inside can hear mutant movement on both sides.'
      ],
      pressure: 'SAFEHOUSE PHASE DRIFT',
      buttons: ['LOCK PRESENT WALLS', 'QUIET FUTURE ROOM', 'OPEN ROOF SIGNAL'],
      reactions: [
        'Present walls locked. Safehouse shape steadied.',
        'Future room quieted. Detection pressure reduced.',
        'Roof signal opened. Extraction attention rising.'
      ]
    }
  ];

  function storageFlagSeen() {
    try {
      return window.localStorage.getItem(storageKey) === '1';
    }
    catch (e) {
      return false;
    }
  }

  function storeSeenFlag() {
    try {
      window.localStorage.setItem(storageKey, '1');
    }
    catch (e) {}
  }

  function hideIntro(intro) {
    if (!intro) {
      return;
    }

    intro.hidden = true;
    intro.setAttribute('aria-hidden', 'true');
  }

  function renderScenario(root, index) {
    var scenario = scenarios[index % scenarios.length];
    var title = root.querySelector('[data-ooh-alpha-scenario-title]');
    var situation = root.querySelector('[data-ooh-alpha-situation]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var interventions = root.querySelector('[data-ooh-alpha-interventions]');
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');

    if (!scenario || !title || !situation || !pressure || !interventions || !reaction) {
      return;
    }

    root.oohAlphaScenarioIndex = index % scenarios.length;
    title.textContent = scenario.title;
    pressure.textContent = scenario.pressure;
    situation.innerHTML = scenario.situation.map(function (line) {
      return '<p>' + line + '</p>';
    }).join('');
    reaction.textContent = 'Awaiting unseen hand intervention.';
    interventions.innerHTML = '';

    scenario.buttons.forEach(function (label, buttonIndex) {
      var button = document.createElement('button');
      button.className = 'ooh-operation-alpha__intervention';
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', function () {
        triggerIntervention(root, scenario, buttonIndex);
      });
      interventions.appendChild(button);
    });
  }

  function setInterventionsDisabled(root, disabled) {
    root.querySelectorAll('.ooh-operation-alpha__intervention').forEach(function (button) {
      button.disabled = disabled;
    });
  }

  function triggerIntervention(root, scenario, buttonIndex) {
    var reaction = root.querySelector('[data-ooh-alpha-reaction]');
    var pressure = root.querySelector('[data-ooh-alpha-pressure]');
    var nextIndex = ((root.oohAlphaScenarioIndex || 0) + 1) % scenarios.length;

    setInterventionsDisabled(root, true);

    if (reaction) {
      reaction.textContent = scenario.reactions[buttonIndex] || scenario.reactions[0];
    }
    if (pressure) {
      pressure.textContent = 'FIELD RESPONSE RECORDED';
    }

    window.clearTimeout(root.oohAlphaScenarioTimer);
    root.oohAlphaScenarioTimer = window.setTimeout(function () {
      renderScenario(root, nextIndex);
    }, scenarioDelayMs);
  }

  function initOperationAlphaGate(root) {
    var intro = root.querySelector('[data-ooh-operation-alpha-intro]');
    var enter = root.querySelector('[data-ooh-operation-alpha-enter]');

    if (intro && enter) {
      if (storageFlagSeen()) {
        hideIntro(intro);
      }
      else {
        enter.addEventListener('click', function () {
          storeSeenFlag();
          hideIntro(intro);
        });
      }
    }

    renderScenario(root, 0);
  }

  function init() {
    document.querySelectorAll('[data-ooh-operation-alpha]').forEach(initOperationAlphaGate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
  else {
    init();
  }
})();
