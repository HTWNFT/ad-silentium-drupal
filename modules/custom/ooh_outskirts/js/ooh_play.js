(function (Drupal, once, drupalSettings) {
  'use strict';

  const stateKey = 'ooh_game_generator_state_v1';

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    }
    catch (e) {
      return fallback;
    }
  }

  function itemLabel(item, fallback) {
    return item && item.label ? item.label : fallback;
  }

  function routeIdFromPayload(payload) {
    const route = payload.campaignRoute || {};
    const routeId = route.id || payload.campaignRouteId || '';
    return ['aer', 'mare', 'terra'].indexOf(routeId) !== -1 ? routeId : 'terra';
  }

  function routeLabel(routeId) {
    const labels = {
      aer: 'AER',
      mare: 'MARE',
      terra: 'TERRA'
    };
    return labels[routeId] || 'TERRA';
  }

  function routeAttribute(routeId) {
    return routeLabel(routeId);
  }

  function missionTypeAttribute(payload) {
    return cleanId(payload.missionType || ((payload.mission || {}).id), 'unconfirmed');
  }

  function cleanId(value, fallback) {
    const cleaned = String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return cleaned || fallback;
  }

  function getRouteLanguage(routeId) {
    const routes = {
      aer: {
        theater: 'High-altitude sky corridor. Unstable cloud cover. Thin margin for error.',
        insertion: 'Aerial insertion. Crosswind entry. Precision timing required.',
        hazards: 'Wind shear. Altitude loss. Cloudblind telemetry.',
        extraction: 'Hold the corridor until the extraction craft breaks cloudline.',
        creditType: 'AIR Route Credit',
        threatNoun: 'aerial interdiction',
        routeWord: 'SKY'
      },
      mare: {
        theater: 'Submerged ruin field. Pressure rising. Isolation absolute.',
        insertion: 'Below-waterline entry. Oxygen discipline. No surface noise.',
        hazards: 'Crushing pressure. Oxygen bleed. Black currents. Ruin collapse.',
        extraction: 'Reach the waterline before pressure locks the route.',
        creditType: 'OCEAN Route Credit',
        threatNoun: 'pressure-zone contact',
        routeWord: 'DEPTH'
      },
      terra: {
        theater: 'Ash front. Broken bunkers. Collapsed structures across the ground line.',
        insertion: 'Ground traversal through ruin cover and bunker thresholds.',
        hazards: 'Ash fall. Dead zones. Structural collapse. Hostile surface lanes.',
        extraction: 'Clear the last surface marker. Hold for wasteland extraction.',
        creditType: 'LAND Route Credit',
        threatNoun: 'ground-route contact',
        routeWord: 'RUIN'
      }
    };

    return routes[routeId] || routes.terra;
  }

  function selectedAttributeText(payload) {
    const attributes = Array.isArray(payload.selectedAttributes) ? payload.selectedAttributes : [];
    if (!attributes.length) {
      return 'baseline discipline';
    }
    if (attributes.length === 1) {
      return attributes[0];
    }
    return attributes.slice(0, 3).join(' / ');
  }

  function getMissionObjective(missionType, routeId) {
    const route = getRouteLanguage(routeId);
    const missionKey = cleanId(missionType, 'mission');
    const objectiveMap = [
      {
        match: ['scout', 'recon', 'survey'],
        code: 'RECON',
        primary: 'Map the forward route. Mark the signal break.',
        secondary: 'Tag three observation points. Avoid escalation.',
        threat: 'Low-signature ' + route.threatNoun + '. Watching the survey line.'
      },
      {
        match: ['assault', 'strike', 'breach'],
        code: 'BREACH',
        primary: 'Break the active node. Collapse command signal.',
        secondary: 'Confirm the route survives the strike window.',
        threat: 'Concentrated ' + route.threatNoun + '. Holding the breach vector.'
      },
      {
        match: ['infiltrate', 'infiltration', 'stealth'],
        code: 'GHOST',
        primary: 'Enter silent. Extract the classified marker.',
        secondary: 'Plant false telemetry behind the line.',
        threat: 'Passive ' + route.threatNoun + '. Tuned to heat and movement.'
      },
      {
        match: ['survive', 'hold', 'endure'],
        code: 'HOLD',
        primary: 'Hold the marker. Keep the route alive.',
        secondary: 'Maintain signal through every surge.',
        threat: 'Escalating ' + route.threatNoun + '. Closing on the hold zone.'
      }
    ];

    const matched = objectiveMap.find(function (entry) {
      return entry.match.some(function (keyword) {
        return missionKey.indexOf(keyword) !== -1;
      });
    });

    return matched || {
      code: 'VERIFY',
      primary: 'Advance on route. Verify the mission signal.',
      secondary: 'Recover proof of passage. Keep the channel clean.',
      threat: 'Unclassified ' + route.threatNoun + '. Responding to the channel.'
    };
  }

  function recruiterPathKey(payload) {
    const values = [
      (payload.path || {}).id,
      (payload.path || {}).label,
      (payload.character || {}).pathId,
      (payload.character || {}).pathLabel
    ].join(' ').toLowerCase();

    if (values.indexOf('doomed') !== -1) {
      return 'DOOMED';
    }
    if (values.indexOf('merged') !== -1) {
      return 'MERGED';
    }
    return itemLabel(payload.path, 'UNASSIGNED').toUpperCase();
  }

  function getRecruiterDirective(payload) {
    const recruiter = payload.recruiter || {};
    const character = payload.character || {};
    const recruiterName = recruiter.name || character.recruiterName || 'Unassigned recruiter';
    const attributes = selectedAttributeText(payload);
    const pathKey = recruiterPathKey(payload);

    if (pathKey === 'DOOMED') {
      return recruiterName + ': hit hard. Burn fear down. Survive on ' + attributes + '.';
    }
    if (pathKey === 'MERGED') {
      return recruiterName + ': execute clean. Suppress noise. Calculate with ' + attributes + '.';
    }
    return recruiterName + ': proceed under ' + pathKey + ' protocol. Carry ' + attributes + '.';
  }

  function getPlaylistMoodEffect(payload) {
    const playlistLabel = itemLabel(payload.playlist, 'No playlist selected');
    const playlistKey = cleanId((payload.playlist || {}).id || playlistLabel, 'playlist');
    const moodMap = [
      {
        match: ['black', 'banner', 'orchestra', 'war', 'bangaz'],
        text: 'reinforces command-scale tension and operational dread'
      },
      {
        match: ['rock', 'riot', 'metal'],
        text: 'pushes impact, grit, and forward pressure'
      },
      {
        match: ['rap', 'drill', 'trap'],
        text: 'adds pulse, aggression, and close-range focus'
      },
      {
        match: ['ambient', 'drone', 'void'],
        text: 'lowers the room into static, distance, and threat awareness'
      }
    ];
    const matched = moodMap.find(function (entry) {
      return entry.match.some(function (keyword) {
        return playlistKey.indexOf(keyword) !== -1 || playlistLabel.toLowerCase().indexOf(keyword) !== -1;
      });
    });
    const mood = matched ? matched.text : 'sets tension, tempo, and operational focus';

    return playlistLabel.toUpperCase() + ' ' + mood + '.';
  }

  function playlistMoodAttribute(payload) {
    const playlistLabel = itemLabel(payload.playlist, '');
    const playlistKey = cleanId((payload.playlist || {}).id || playlistLabel, 'neutral');

    if (/(black|banner|orchestra|war)/.test(playlistKey)) {
      return 'dread';
    }
    if (/(rock|riot|metal)/.test(playlistKey)) {
      return 'impact';
    }
    if (/(rap|drill|trap)/.test(playlistKey)) {
      return 'pulse';
    }
    if (/(ambient|drone|void)/.test(playlistKey)) {
      return 'void';
    }
    return 'neutral';
  }

  function buildSceneStatus(routeId, pathKey, missionLabel) {
    const routeStates = {
      aer: 'Sky corridor staged. Wind shear simulated. No flight order issued.',
      mare: 'Pressure zone staged. Waterline distortion active. No dive order issued.',
      terra: 'Ash field staged. Bunker silhouettes indexed. No ground order issued.'
    };
    const pathTone = pathKey === 'DOOMED' ?
      ' DOOMED overlay unstable.' :
      (pathKey === 'MERGED' ? ' MERGED overlay synchronized.' : '');

    return (routeStates[routeId] || routeStates.terra) + pathTone + ' Mission type: ' + missionLabel + '.';
  }

  function buildMissionCodename(payload, routeId, objective) {
    const route = routeLabel(routeId);
    const missionPart = (objective && objective.code) || cleanId(payload.missionType || ((payload.mission || {}).id), 'mission').toUpperCase();
    const pathPart = recruiterPathKey(payload);

    return 'OPERATION ' + route + '-' + missionPart + ' // ' + pathPart;
  }

  function buildMissionAssembly(payload) {
    const routeId = routeIdFromPayload(payload);
    const route = getRouteLanguage(routeId);
    const selectedPrompt = payload.selectedPrompt || {};
    const mission = payload.mission || {};
    const missionType = payload.missionType || mission.id || 'mission';
    const objectives = getMissionObjective(missionType, routeId);
    const missionLabel = itemLabel(mission, missionType);
    const routeCreditType = ((payload.campaignRoute || {}).routeCreditTypes || [])[0] ||
      selectedPrompt.routeCreditType ||
      route.creditType;

    return {
      missionCodename: buildMissionCodename(payload, routeId, objectives),
      routeTheater: route.theater,
      primaryObjective: objectives.primary,
      secondaryObjective: objectives.secondary,
      insertionStyle: route.insertion,
      environmentHazards: route.hazards,
      threatProfile: missionLabel + ' profile: ' + objectives.threat,
      recruiterDirective: getRecruiterDirective(payload),
      playlistMoodEffect: getPlaylistMoodEffect(payload),
      extractionCondition: route.extraction,
      routeCreditType: routeCreditType
    };
  }

  function assemblyLabels() {
    return {
      missionCodename: 'OPERATION CODENAME',
      routeTheater: 'THEATER',
      primaryObjective: 'PRIMARY OBJECTIVE',
      secondaryObjective: 'SECONDARY OBJECTIVE',
      insertionStyle: 'INSERTION',
      environmentHazards: 'HAZARDS',
      threatProfile: 'THREAT PROFILE',
      recruiterDirective: 'COMMAND DIRECTIVE',
      playlistMoodEffect: 'MOOD PROFILE',
      extractionCondition: 'EXTRACTION',
      routeCreditType: 'ROUTE CREDIT'
    };
  }

  function sceneCopy(routeId, payload, selectedPrompt) {
    const routeNames = {
      aer: 'Upper atmosphere approach corridor',
      mare: 'Submerged pressure-zone approach',
      terra: 'Ground ingress through broken surface terrain'
    };
    const missionLabel = itemLabel(payload.mission, payload.missionType || 'Unconfirmed Mission');
    const promptTitle = selectedPrompt ? (selectedPrompt.title || selectedPrompt.id || 'Prompt Block') : 'Prompt unavailable';

    return {
      label: 'MISSION SCENE // ' + routeLabel(routeId),
      location: routeNames[routeId] || routeNames.terra,
      promptTitle: promptTitle,
      missionLabel: missionLabel
    };
  }

  function promptExcerpt(rawText) {
    const text = String(rawText || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      return 'No prompt text is available for this campaign route yet. The dossier is still valid; the briefing channel is awaiting prompt source text.';
    }
    return text.length > 620 ? text.slice(0, 620).trim() + '...' : text;
  }

  function selectPromptBlock(payload, promptLibrary) {
    const routeId = routeIdFromPayload(payload);
    const routeBlocks = Array.isArray(promptLibrary[routeId]) ? promptLibrary[routeId] : [];

    if (routeBlocks.length) {
      return routeBlocks[0];
    }

    const payloadPrompts = payload.missionPrompts || {};
    const payloadRouteBlocks = Array.isArray(payloadPrompts[routeId]) ? payloadPrompts[routeId] : [];
    return payloadRouteBlocks.length ? payloadRouteBlocks[0] : null;
  }

  function buildBriefing(payload, selectedPrompt) {
    const routeId = routeIdFromPayload(payload);
    const missionLabel = itemLabel(payload.mission, payload.missionType || 'Unconfirmed Mission');
    const pathLabel = itemLabel(payload.path, 'Unconfirmed Path');
    const recruiter = payload.recruiter || {};
    const recruiterName = recruiter.name || ((payload.character || {}).recruiterName) || 'Unassigned recruiter';
    const playlistLabel = itemLabel(payload.playlist, 'No playlist selected');
    const promptText = selectedPrompt ? promptExcerpt(selectedPrompt.rawText) : promptExcerpt('');

    return [
      'Route ' + routeLabel(routeId) + ' accepts the dossier.',
      missionLabel + ' is assigned under ' + pathLabel + ' supervision.',
      recruiterName + ' confirms the selected evolution path and locks the mission channel.',
      'Playlist theme: ' + playlistLabel + '.',
      '',
      promptText
    ].join('\n');
  }

  Drupal.behaviors.oohPlayBriefing = {
    attach: function (context) {
      once('ooh-play-briefing', '[data-ooh-play]', context).forEach(function (root) {
        // Hydrate the /play scene from the Dossier payload stored before routing.
        const storedState = safeJsonParse(window.localStorage.getItem(stateKey), {}) || {};
        const payload = storedState.payload || {};
        const promptLibrary = (((drupalSettings || {}).ooh_outskirts || {}).missionPrompts) || {};
        const selectedPrompt = selectPromptBlock(payload, promptLibrary);
        payload.selectedPrompt = selectedPrompt;
        const routeId = routeIdFromPayload(payload);
        const recruiter = payload.recruiter || {};
        const shell = root.querySelector('[data-ooh-scene-shell]');
        const routeHeader = root.querySelector('[data-ooh-scene-route-label]');
        const sceneMissionLabel = root.querySelector('[data-ooh-scene-mission-label]');
        const sceneStatus = root.querySelector('[data-ooh-scene-status]');
        const scene = sceneCopy(routeId, payload, selectedPrompt);
        const assembly = buildMissionAssembly(payload);
        const pathKey = recruiterPathKey(payload);
        const missionLabel = itemLabel(payload.mission, payload.missionType || 'Unconfirmed');

        if (shell) {
          shell.setAttribute('data-route', routeAttribute(routeId));
          shell.setAttribute('data-path', pathKey);
          shell.setAttribute('data-mission-type', missionTypeAttribute(payload));
          shell.setAttribute('data-playlist-mood', playlistMoodAttribute(payload));
          shell.setAttribute('data-prompt-block', selectedPrompt ? (selectedPrompt.id || 'prompt_block') : 'unavailable');
        }

        if (routeHeader) {
          routeHeader.textContent = scene.label + ' // ' + scene.location;
        }

        if (sceneMissionLabel) {
          sceneMissionLabel.textContent = 'MISSION TYPE // ' + missionLabel.toUpperCase();
        }

        if (sceneStatus) {
          sceneStatus.textContent = buildSceneStatus(routeId, pathKey, missionLabel);
        }

        const fields = {
          route: routeLabel(routeId),
          mission: missionLabel,
          path: itemLabel(payload.path, 'Unconfirmed'),
          recruiter: [recruiter.name || ((payload.character || {}).recruiterName), recruiter.title || ((payload.character || {}).recruiterTitle)].filter(Boolean).join(' / ') || 'Unassigned',
          playlist: itemLabel(payload.playlist, 'Unselected'),
          prompt: selectedPrompt ? (selectedPrompt.title || selectedPrompt.id || 'Prompt Block') : 'Unavailable'
        };

        Object.keys(fields).forEach(function (field) {
          const el = root.querySelector('[data-ooh-briefing-field="' + field + '"]');
          if (el) {
            el.textContent = fields[field];
          }
        });

        const briefingEl = root.querySelector('[data-ooh-generated-briefing]');
        if (briefingEl) {
          briefingEl.textContent = buildBriefing(payload, selectedPrompt);
        }

        Object.keys(assembly).forEach(function (field) {
          const el = root.querySelector('[data-ooh-assembly-field="' + field + '"]');
          if (el) {
            const labelEl = el.parentElement ? el.parentElement.querySelector('.ooh-generator__status-label') : null;
            const labels = assemblyLabels();
            if (labelEl && labels[field]) {
              labelEl.textContent = labels[field];
            }
            el.textContent = assembly[field];
          }
        });

        const debugEl = root.querySelector('[data-ooh-briefing-debug]');
        if (debugEl) {
          debugEl.textContent = JSON.stringify({
            payload: payload,
            selectedPrompt: selectedPrompt,
            missionAssembly: assembly
          }, null, 2);
        }
      });
    }
  };
})(Drupal, once, drupalSettings);
