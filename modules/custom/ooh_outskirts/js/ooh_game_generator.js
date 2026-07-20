(function (Drupal, once, drupalSettings) {
  'use strict';

  Drupal.behaviors.oohGameGenerator = {
    attach: function (context) {
      once('ooh-game-generator', '[data-ooh-generator]', context).forEach(function (root) {
        const settings = (((drupalSettings || {}).ooh_outskirts || {}).gameGenerator) || {};
        if (!settings || !settings.playlists || !settings.paths || !settings.missions || !settings.campaignRoutes) {
          return;
        }

        const storage = settings.storage || {};
        const stateKey = storage.stateKey || 'ooh_game_generator_state_v1';
        const accessKey = storage.accessKey || 'ooh_founders_access_v1';
        const creditsKey = 'ooh_credits';

        const summaryPlaylist = root.querySelector('[data-ooh-summary="playlist"]');
        const summaryPath = root.querySelector('[data-ooh-summary="path"]');
        const summaryMission = root.querySelector('[data-ooh-summary="mission"]');
        const summaryCampaignRoute = root.querySelector('[data-ooh-summary="campaignRoute"]');
        const summaryTier = root.querySelector('[data-ooh-summary="tier"]');
        const summaryCredits = root.querySelector('[data-ooh-summary="credits"]');
        const messageEl = root.querySelector('[data-ooh-message]');
        const enterBtn = root.querySelector('[data-ooh-enter]');
        const creditsLink = root.querySelector('[data-ooh-credits-link]');
        const foundersLink = root.querySelector('[data-ooh-founders-link]');
        const overlay = root.querySelector('[data-ooh-locked-overlay]');
        const overlayClose = root.querySelector('[data-ooh-overlay-close]');
        const recruiterPanel = root.querySelector('[data-ooh-recruiter-panel]');
        const spotifyPreview = root.querySelector('[data-ooh-spotify-preview]');
        const spotifyPlayer = root.querySelector('[data-ooh-spotify-player]');
        const spotifyName = root.querySelector('[data-ooh-spotify-name]');

        const groupContainers = {
          playlist: root.querySelector('[data-ooh-group="playlist"]'),
          path: root.querySelector('[data-ooh-group="path"]'),
          campaignRoute: root.querySelector('[data-ooh-group="campaignRoute"]'),
          mission: root.querySelector('[data-ooh-group="mission"]')
        };

        const accessSettings = settings.access || {};
        let foundersUnlocked = Boolean(accessSettings.foundersUnlocked);
        const allowPreviewSelections = accessSettings.allowPreviewSelections !== false;
        const minimumAttributes = 3;
        const playlistDiagnostics = {};
        let payloadReadoutTimer = null;

        function logPlaylistDiagnostic(key, message) {
          if (playlistDiagnostics[key]) {
            return;
          }
          playlistDiagnostics[key] = true;
        }

        function getCredits() {
          const fallbackCredits = parseInt(((settings.credits || {}).initial || 60), 10);
          const parsed = parseInt(window.localStorage.getItem(creditsKey) || String(fallbackCredits), 10);
          return Number.isFinite(parsed) ? parsed : fallbackCredits;
        }

        function setCredits(value) {
          window.localStorage.setItem(creditsKey, String(value));
        }

        function initializeCredits() {
          if (window.localStorage.getItem(creditsKey) === null) {
            setCredits(((settings.credits || {}).initial || 60));
          }
        }

        try {
          initializeCredits();
        }
        catch (e) {}

        try {
          const storedAccess = window.localStorage.getItem(accessKey);
          if (storedAccess === '1') {
            foundersUnlocked = true;
          }
        }
        catch (e) {}

        let state = {
          playlist: null,
          path: null,
          campaignRoute: null,
          mission: null,
          selectedAttributes: []
        };

        try {
          const rawState = window.localStorage.getItem(stateKey);
          if (rawState) {
            const parsed = JSON.parse(rawState);
            state = Object.assign(state, parsed || {});
          }
        }
        catch (e) {}

        const catalogs = {
          playlist: settings.playlists || [],
          path: settings.paths || [],
          campaignRoute: settings.campaignRoutes || [],
          mission: settings.missions || []
        };
        const missionPrompts = settings.missionPrompts || {
          aer: [],
          mare: [],
          terra: []
        };

        function getTierLabel() {
          const selectedItems = [
            findItem('playlist', state.playlist),
            findItem('path', state.path),
            findItem('campaignRoute', state.campaignRoute),
            findItem('mission', state.mission)
          ].filter(Boolean);

          if (selectedItems.some(function (item) { return item.tier === 'founder'; })) {
            return 'FOUNDER';
          }

          if (selectedItems.some(function (item) { return item.tier === 'paid'; })) {
            return 'PAID';
          }

          return foundersUnlocked ? 'FOUNDER' : 'FREE';
        }

        function saveState() {
          try {
            window.localStorage.setItem(stateKey, JSON.stringify(state));
          }
          catch (e) {}
        }

        function isItemLocked(item) {
          if (allowPreviewSelections) {
            return false;
          }
          return item && item.tier === 'founder' && !foundersUnlocked;
        }

        function findItem(group, id) {
          const items = catalogs[group] || [];
          return items.find(function (item) {
            return item.id === id;
          }) || null;
        }

        function resolveCampaignRoute(missionItem) {
          if (missionItem && ['aer', 'mare', 'terra'].indexOf(missionItem.campaignRoute) !== -1) {
            return missionItem.campaignRoute;
          }

          const haystack = [
            missionItem ? missionItem.id : '',
            missionItem ? missionItem.label : '',
            missionItem ? missionItem.description : ''
          ].join(' ').toLowerCase();

          const routeKeywords = {
            aer: ['air', 'sky', 'flight', 'cloud', 'aerial'],
            mare: ['ocean', 'aquatic', 'underwater', 'naval'],
            terra: ['land', 'urban', 'forest', 'ground', 'bunker']
          };

          for (const routeId of ['aer', 'mare', 'terra']) {
            if (routeKeywords[routeId].some(function (keyword) { return haystack.indexOf(keyword) !== -1; })) {
              return routeId;
            }
          }

          return 'terra';
        }

        function optionSelectorForGroup(groupName) {
          const selectors = {
            playlist: '[data-ooh-playlist-option]',
            path: '[data-ooh-recruiter-option]',
            campaignRoute: '[data-ooh-route-option]',
            mission: '[data-ooh-mission-option]'
          };

          return selectors[groupName] || '[data-ooh-option="' + groupName + '"]';
        }

        function setActiveWithinSection(option, selector) {
          const section = option.closest('[data-ooh-section]');
          if (!section) {
            return;
          }

          section.querySelectorAll(selector).forEach(function (item) {
            item.classList.remove('is-active', 'is-selected');
            item.setAttribute('aria-pressed', 'false');
          });

          option.classList.add('is-active', 'is-selected');
          option.setAttribute('aria-pressed', 'true');
        }

        function isSectionUnlocked(groupName) {
          if (groupName === 'playlist') {
            return true;
          }
          if (groupName === 'path') {
            return Boolean(state.playlist);
          }
          if (groupName === 'campaignRoute') {
            return Boolean(state.playlist && state.path);
          }
          if (groupName === 'mission') {
            return Boolean(state.playlist && state.path && state.campaignRoute);
          }
          if (groupName === 'enter') {
            return selectionsComplete();
          }

          return false;
        }

        function resetDownstreamSelections(groupName) {
          if (groupName === 'playlist') {
            state.path = null;
            state.campaignRoute = null;
            state.mission = null;
            state.selectedAttributes = [];
          }
          if (groupName === 'path') {
            state.campaignRoute = null;
            state.mission = null;
          }
          if (groupName === 'campaignRoute') {
            state.mission = null;
          }
        }

        function normalizeStepperState() {
          if (!state.playlist) {
            state.path = null;
            state.campaignRoute = null;
            state.mission = null;
            state.selectedAttributes = [];
            return;
          }

          if (!state.path) {
            state.campaignRoute = null;
            state.mission = null;
            return;
          }

          if (!state.campaignRoute) {
            state.mission = null;
          }
        }

        function updateStepperLocks() {
          ['playlist', 'recruiter', 'campaignRoute', 'mission', 'enter'].forEach(function (sectionName) {
            const section = root.querySelector('[data-ooh-section="' + sectionName + '"]');
            if (!section) {
              return;
            }

            const groupName = sectionName === 'recruiter' ? 'path' : sectionName;
            const unlocked = isSectionUnlocked(groupName);
            section.classList.toggle('is-locked', !unlocked);
            section.classList.toggle('is-step-locked', !unlocked);
            section.classList.toggle('is-step-unlocked', unlocked);
            section.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
            section.querySelectorAll('button').forEach(function (button) {
              if (button === enterBtn) {
                return;
              }
              button.disabled = !unlocked;
              button.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
            });
          });
        }

        function spotifyEmbedUrl(spotifyUrl) {
          let parsed;
          const rawUrl = String(spotifyUrl || '').trim();

          if (!rawUrl) {
            return '';
          }

          try {
            parsed = new URL(rawUrl);
          }
          catch (e) {
            return '';
          }

          if (parsed.protocol !== 'https:' || parsed.hostname !== 'open.spotify.com') {
            return '';
          }

          const parts = parsed.pathname.split('/').filter(Boolean);
          const playlistId = parts[0] === 'embed' && parts[1] === 'playlist' ? parts[2] : parts[1];

          if (
            !playlistId ||
            !((parts[0] === 'playlist') || (parts[0] === 'embed' && parts[1] === 'playlist')) ||
            !/^[A-Za-z0-9]+$/.test(playlistId)
          ) {
            return '';
          }

          return 'https://open.spotify.com/embed/playlist/' + encodeURIComponent(playlistId);
        }

        function updateSpotifyPreview(playlistItem) {
          if (!spotifyPreview || !spotifyPlayer) {
            logPlaylistDiagnostic('preview-unavailable', 'OOH playlist preview unavailable — continuing without crash');
            return;
          }

          const embedUrl = playlistItem ? spotifyEmbedUrl(playlistItem.spotifyUrl) : '';
          if (!embedUrl) {
            spotifyPreview.hidden = true;
            spotifyPlayer.removeAttribute('src');
            if (spotifyName) {
              spotifyName.textContent = 'Playlist pending.';
            }
            return;
          }

          spotifyPlayer.setAttribute('src', embedUrl);
          spotifyPreview.hidden = false;
          if (spotifyName) {
            spotifyName.textContent = playlistItem.label || 'Playlist uplink active';
          }
        }

        function renderGroup(groupName, items) {
          const container = groupContainers[groupName];
          if (!container) {
            return;
          }

          container.innerHTML = '';

          items.forEach(function (item) {
            if (!item || !item.id) {
              if (groupName === 'playlist') {
                logPlaylistDiagnostic('invalid-option', 'OOH playlist option missing stable identifier — skipping option');
              }
              return;
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ooh-generator__option';
            button.setAttribute('data-ooh-option', groupName);
            button.setAttribute('data-id', item.id);
            button.setAttribute('data-tier', item.tier || 'free');
            button.setAttribute('aria-pressed', state[groupName] === item.id ? 'true' : 'false');

            if (groupName === 'playlist') {
              button.setAttribute('data-ooh-playlist-option', item.id);
              button.setAttribute('data-ooh-playlist', item.id);
              button.setAttribute('data-ooh-spotify', item.spotifyUrl || '');
            }
            if (groupName === 'path') {
              button.setAttribute('data-ooh-recruiter-option', item.id);
            }
            if (groupName === 'campaignRoute') {
              button.setAttribute('data-ooh-route-option', item.id);
            }
            if (groupName === 'mission') {
              button.setAttribute('data-ooh-mission-option', item.id);
            }
            if (isItemLocked(item)) {
              button.classList.add('is-locked');
              button.setAttribute('aria-label', item.label + ' locked');
            }

            if (state[groupName] === item.id) {
              button.classList.add('is-active', 'is-selected');
            }

            button.innerHTML =
              '<span class="ooh-generator__option-title">' + escapeHtml(item.label) + '</span>' +
              '<span class="ooh-generator__option-copy">' + escapeHtml(item.description || '') + '</span>' +
              '<span class="ooh-generator__option-tier">' + escapeHtml(item.tier || 'free') + '</span>';

            button.addEventListener('click', function () {
              if (!isSectionUnlocked(groupName)) {
                return;
              }

              if (isItemLocked(item)) {
                openOverlay();
                return;
              }

              if (state[groupName] !== item.id) {
                resetDownstreamSelections(groupName);
              }
              state[groupName] = item.id;
              setActiveWithinSection(button, optionSelectorForGroup(groupName));
              if (groupName === 'path') {
                state.selectedAttributes = getDefaultAttributes(item);
              }
              if (groupName === 'playlist') {
                updateSpotifyPreview(item);
              }
              saveState();
              refresh();
            });

            container.appendChild(button);
          });
        }

        function renderCampaignRouteReadout() {
          const container = groupContainers.campaignRoute;
          if (!container) {
            return;
          }

          container.innerHTML = '';

          const selectedMission = findItem('mission', state.mission);
          const resolvedRoute = selectedMission ? resolveCampaignRoute(selectedMission) : null;

          catalogs.campaignRoute.forEach(function (item) {
            const card = document.createElement('div');
            card.className = 'ooh-generator__option ooh-generator__option--route-readout';
            card.setAttribute('data-ooh-route-readout', item.id);
            card.setAttribute('data-id', item.id);
            card.setAttribute('data-tier', item.tier || 'free');

            if (resolvedRoute === item.id) {
              card.classList.add('is-derived');
            }

            card.innerHTML =
              '<span class="ooh-generator__option-title">' + escapeHtml(item.label) + '</span>' +
              '<span class="ooh-generator__option-copy">' + escapeHtml(item.description || '') + '</span>' +
              '<span class="ooh-generator__option-tier">' + (resolvedRoute === item.id ? 'mission route' : escapeHtml(item.tier || 'free')) + '</span>';

            container.appendChild(card);
          });
        }

        let recruiterTypingTimer = null;
        let recruiterTypingToken = 0;

        function getDefaultAttributes(pathItem) {
          if (!pathItem) {
            return [];
          }

          const recruiter = pathItem.recruiter || {};
          const attributes = recruiter.attributes || pathItem.attributes || [];
          return attributes.slice();
        }

        function attributeSignalRuleText() {
          const count = Array.isArray(state.selectedAttributes) ? state.selectedAttributes.length : 0;
          return count ?
            'ATTRIBUTE SIGNALS DETECTED // REFLECTED IN STAGING' :
            'ATTRIBUTE SIGNALS // BASELINE DISCIPLINE';
        }

        function renderRecruiterPanel() {
          if (!recruiterPanel) {
            return;
          }

          if (recruiterTypingTimer) {
            window.clearTimeout(recruiterTypingTimer);
            recruiterTypingTimer = null;
          }

          const selectedPath = findItem('path', state.path);
          const recruiter = selectedPath ? (selectedPath.recruiter || {}) : null;

          if (!selectedPath || !recruiter) {
            recruiterPanel.hidden = true;
            recruiterPanel.innerHTML = '';
            return;
          }

          recruiterPanel.hidden = false;
          const attributes = getDefaultAttributes(selectedPath);
          if (!Array.isArray(state.selectedAttributes) || !state.selectedAttributes.length) {
            state.selectedAttributes = attributes.slice();
            saveState();
          }
          else {
            state.selectedAttributes = state.selectedAttributes.filter(function (attribute) {
              return attributes.indexOf(attribute) !== -1;
            });
            if (!state.selectedAttributes.length) {
              state.selectedAttributes = attributes.slice();
            }
            saveState();
          }

          const scriptLines = Array.isArray(recruiter.script) ? recruiter.script : [];
          const scriptText = scriptLines.join('\n');
          const portraitMarkup = recruiter.portraitUrl ?
            '<img class="ooh-generator__recruiter-portrait-img" src="' + escapeHtml(recruiter.portraitUrl) + '" alt="' + escapeHtml(recruiter.name || selectedPath.label) + ' portrait">' :
            '<span class="ooh-generator__recruiter-portrait-empty">NO SIGNAL</span>';
          const sigilMarkup = recruiter.sigilUrl ?
            '<img class="ooh-generator__recruiter-sigil" src="' + escapeHtml(recruiter.sigilUrl) + '" alt="" aria-hidden="true">' :
            '';

          recruiterPanel.innerHTML =
            '<div class="ooh-generator__recruiter-media">' +
              '<div class="ooh-generator__recruiter-portrait">' + portraitMarkup + '</div>' +
              sigilMarkup +
            '</div>' +
            '<div class="ooh-generator__recruiter-brief">' +
              '<div class="ooh-generator__recruiter-kicker">' + escapeHtml(selectedPath.label) + ' RECRUITER</div>' +
              '<h4 class="ooh-generator__recruiter-name">' + escapeHtml(recruiter.name || selectedPath.label) + '</h4>' +
              '<div class="ooh-generator__recruiter-title">' + escapeHtml(recruiter.title || selectedPath.description || '') + '</div>' +
              '<pre class="ooh-generator__recruiter-script" data-ooh-recruiter-script aria-live="polite"></pre>' +
              '<div class="ooh-generator__recruiter-meta">' +
                '<div>' +
                  '<div class="ooh-generator__recruiter-label">Attribute Signals</div>' +
                  '<div class="ooh-generator__attribute-chips" data-ooh-attribute-chips>' + attributes.map(function (attribute) {
                    const isSelected = state.selectedAttributes.indexOf(attribute) !== -1;
                    return '<button type="button" class="ooh-generator__attribute-chip' + (isSelected ? ' is-selected' : '') + '" data-ooh-attribute="' + escapeHtml(attribute) + '" aria-pressed="' + (isSelected ? 'true' : 'false') + '">' + escapeHtml(attribute) + '</button>';
                  }).join('') + '</div>' +
                  '<div class="ooh-generator__attribute-rule" data-ooh-attribute-rule>' + attributeSignalRuleText() + '</div>' +
                '</div>' +
                '<div>' +
                  '<div class="ooh-generator__recruiter-label">Recommended For</div>' +
                  '<p class="ooh-generator__recommended">' + escapeHtml(recruiter.recommendedFor || selectedPath.description || '') + '</p>' +
                '</div>' +
              '</div>' +
              '<button type="button" class="ooh-generator__recruiter-confirm" data-ooh-recruiter-confirm>' +
                escapeHtml(selectedPath.label) + ' CONFIRMED' +
              '</button>' +
            '</div>';

          const confirmButton = recruiterPanel.querySelector('[data-ooh-recruiter-confirm]');
          if (confirmButton) {
            confirmButton.classList.add('is-confirmed');
            confirmButton.addEventListener('click', function () {
              state.path = selectedPath.id;
              if (!state.selectedAttributes || state.selectedAttributes.length < minimumAttributes) {
                state.selectedAttributes = getDefaultAttributes(selectedPath);
              }
              saveState();
              refresh();
              confirmButton.textContent = selectedPath.label + ' CONFIRMED';
              confirmButton.classList.add('is-confirmed');
            });
          }

          recruiterPanel.querySelectorAll('[data-ooh-attribute]').forEach(function (chip) {
            chip.addEventListener('click', function () {
              const attribute = chip.getAttribute('data-ooh-attribute');
              const selected = state.selectedAttributes.slice();
              const index = selected.indexOf(attribute);

              if (index !== -1) {
                if (selected.length <= minimumAttributes) {
                  showAttributeRule('ATTRIBUTE SIGNALS // MINIMUM ' + minimumAttributes + ' REQUIRED FOR STAGING');
                  return;
                }
                selected.splice(index, 1);
              }
              else {
                selected.push(attribute);
              }

              state.selectedAttributes = selected;
              saveState();
              updateAttributeChips();
              updateSummary();
              updateEnterState();
            });
          });

          typeRecruiterScript(scriptText);
        }

        function updateAttributeChips() {
          if (!recruiterPanel) {
            return;
          }

          recruiterPanel.querySelectorAll('[data-ooh-attribute]').forEach(function (chip) {
            const attribute = chip.getAttribute('data-ooh-attribute');
            const isSelected = state.selectedAttributes.indexOf(attribute) !== -1;
            chip.classList.toggle('is-selected', isSelected);
            chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
          });

          const rule = recruiterPanel.querySelector('[data-ooh-attribute-rule]');
          if (rule && !rule.classList.contains('is-warning')) {
            rule.textContent = attributeSignalRuleText();
          }
        }

        function showAttributeRule(message) {
          const rule = recruiterPanel ? recruiterPanel.querySelector('[data-ooh-attribute-rule]') : null;
          if (!rule) {
            return;
          }

          rule.textContent = message;
          rule.classList.add('is-warning');
          window.setTimeout(function () {
            rule.textContent = attributeSignalRuleText();
            rule.classList.remove('is-warning');
          }, 1800);
        }

        function typeRecruiterScript(scriptText) {
          const scriptEl = recruiterPanel ? recruiterPanel.querySelector('[data-ooh-recruiter-script]') : null;
          if (!scriptEl) {
            return;
          }

          const token = ++recruiterTypingToken;
          let index = 0;
          scriptEl.textContent = '';

          function tick() {
            if (token !== recruiterTypingToken) {
              return;
            }

            scriptEl.textContent = scriptText.slice(0, index);
            scriptEl.scrollTop = scriptEl.scrollHeight;

            if (index <= scriptText.length) {
              index += 1;
              recruiterTypingTimer = window.setTimeout(tick, scriptText.charAt(index - 2) === '\n' ? 120 : 18);
            }
          }

          tick();
        }

        function openOverlay() {
          if (!overlay) {
            return;
          }
          overlay.hidden = false;
          document.documentElement.classList.add('ooh-generator-overlay-open');
        }

        function closeOverlay() {
          if (!overlay) {
            return;
          }
          overlay.hidden = true;
          document.documentElement.classList.remove('ooh-generator-overlay-open');
        }

        function selectionsComplete() {
          const selectedPath = findItem('path', state.path);
          const selectedAttributes = (state.selectedAttributes && state.selectedAttributes.length) ?
            state.selectedAttributes :
            getDefaultAttributes(selectedPath);
          return Boolean(
            state.playlist &&
            state.path &&
            state.campaignRoute &&
            selectedAttributes.length >= minimumAttributes &&
            state.mission
          );
        }

        function selectedIncludesLockedTier() {
          if (allowPreviewSelections) {
            return false;
          }

          const selectedPlaylist = findItem('playlist', state.playlist);
          const selectedPath = findItem('path', state.path);
          const selectedCampaignRoute = findItem('campaignRoute', state.campaignRoute);
          const selectedMission = findItem('mission', state.mission);

          return [selectedPlaylist, selectedPath, selectedCampaignRoute, selectedMission].some(function (item) {
            return item && item.tier === 'founder' && !foundersUnlocked;
          });
        }

        function updateSummary() {
          const selectedPlaylist = findItem('playlist', state.playlist);
          const selectedPath = findItem('path', state.path);
          const selectedCampaignRoute = findItem('campaignRoute', state.campaignRoute);
          const selectedMission = findItem('mission', state.mission);

          if (summaryPlaylist) {
            summaryPlaylist.textContent = selectedPlaylist ? selectedPlaylist.label : 'Unselected';
          }

          if (summaryPath) {
            summaryPath.textContent = selectedPath ? selectedPath.label + ' / ' + ((selectedPath.recruiter || {}).name || 'Recruiter') + ' / ' + ((state.selectedAttributes || []).length || getDefaultAttributes(selectedPath).length) + ' ATTR' : 'Unselected';
          }

          if (summaryMission) {
            summaryMission.textContent = selectedMission ? selectedMission.label : 'Unselected';
          }

          if (summaryCampaignRoute) {
            summaryCampaignRoute.textContent = selectedCampaignRoute ? selectedCampaignRoute.label : 'Unselected';
          }

          if (summaryTier) {
            summaryTier.textContent = getTierLabel();
          }

          if (summaryCredits) {
            summaryCredits.textContent = getCredits();
          }

          if (creditsLink && creditsLink.tagName === 'A') {
            creditsLink.textContent = 'CREDITS: ' + getCredits();
          }
        }

        function updateEnterState() {
          const incompleteText = ((settings.labels || {}).enterIncomplete) || 'ASSEMBLY INCOMPLETE // COMPLETE PRIOR DOSSIER STEPS';
          const readyText = ((settings.labels || {}).enterReady) || 'OPERATION STAGED // FIELD ENTRY READY';

          enterBtn.classList.remove('is-disabled', 'is-premium-ready');

          if (!selectionsComplete()) {
            enterBtn.disabled = true;
            enterBtn.setAttribute('aria-disabled', 'true');
            enterBtn.classList.add('is-disabled');
            if (messageEl) {
              messageEl.textContent = incompleteText;
            }
            return;
          }

          enterBtn.disabled = false;
          enterBtn.setAttribute('aria-disabled', 'false');
          enterBtn.classList.add('is-premium-ready');

          if (messageEl) {
            messageEl.textContent = readyText;
          }
        }

        function updateSelectedClasses() {
          ['playlist', 'path', 'campaignRoute', 'mission'].forEach(function (groupName) {
            const container = groupContainers[groupName];
            if (!container) {
              return;
            }

            container.querySelectorAll(optionSelectorForGroup(groupName)).forEach(function (button) {
              const id = button.getAttribute('data-id');
              const isActive = state[groupName] === id;
              button.classList.toggle('is-active', isActive);
              button.classList.toggle('is-selected', isActive);
              button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
          });
        }

        function refresh() {
          normalizeStepperState();
          renderGroup('playlist', catalogs.playlist);
          renderGroup('path', catalogs.path);
          renderGroup('campaignRoute', catalogs.campaignRoute);
          renderGroup('mission', catalogs.mission);
          renderRecruiterPanel();
          updateSpotifyPreview(findItem('playlist', state.playlist));
          updateSummary();
          updateEnterState();
          updateSelectedClasses();
          updateStepperLocks();
        }

        function buildPayload() {
          // Assemble the player dossier: playlist + recruiter/path + campaignRoute + missionType.
          const selectedPath = findItem('path', state.path);
          const selectedMission = findItem('mission', state.mission);
          const selectedCampaignRoute = findItem('campaignRoute', state.campaignRoute);
          const missionResolvedRouteId = resolveCampaignRoute(selectedMission);
          const fallbackCampaignRoute = findItem('campaignRoute', missionResolvedRouteId) || findItem('campaignRoute', 'terra');
          const selectedRoute = selectedCampaignRoute && selectedCampaignRoute.id !== 'mixed' ? selectedCampaignRoute : fallbackCampaignRoute;
          const finalRoute = selectedCampaignRoute || fallbackCampaignRoute;
          const resolvedRouteId = selectedRoute ? selectedRoute.id : missionResolvedRouteId;
          const recruiter = selectedPath ? (selectedPath.recruiter || null) : null;
          const selectedAttributes = (state.selectedAttributes && state.selectedAttributes.length) ?
            state.selectedAttributes.slice() :
            getDefaultAttributes(selectedPath);
          const character = selectedPath ? {
            pathId: selectedPath.id,
            pathLabel: selectedPath.label,
            recruiterId: recruiter ? recruiter.id : null,
            recruiterName: recruiter ? recruiter.name : null,
            recruiterTitle: recruiter ? recruiter.title : null,
            selectedAttributes: selectedAttributes,
            recommendedFor: recruiter ? (recruiter.recommendedFor || '') : '',
            characterSoundboard: (selectedPath.characterSoundboard || []).slice(),
            recruiterVoiceLines: recruiter && Array.isArray(recruiter.recruiterVoiceLines) ? recruiter.recruiterVoiceLines.slice() : [],
            attributeModifiers: recruiter && recruiter.attributeModifiers ? Object.assign({}, recruiter.attributeModifiers) : {}
          } : null;
          const campaignRoute = finalRoute ? {
            id: finalRoute.id,
            label: finalRoute.label,
            environments: (finalRoute.environments || []).slice(),
            routeCreditTypes: (finalRoute.routeCreditTypes || []).slice(),
            description: finalRoute.description || ''
          } : null;
          const route = selectedRoute ? {
            id: selectedRoute.id,
            label: selectedRoute.label,
            environments: (selectedRoute.environments || []).slice(),
            routeCreditTypes: (selectedRoute.routeCreditTypes || []).slice(),
            description: selectedRoute.description || ''
          } : null;

          return {
            playlist: findItem('playlist', state.playlist),
            path: selectedPath,
            recruiter: recruiter,
            selectedAttributes: selectedAttributes,
            character: character,
            campaignRoute: campaignRoute,
            campaignRouteId: selectedCampaignRoute ? selectedCampaignRoute.id : resolvedRouteId,
            route: route,
            routeId: resolvedRouteId,
            missionRouteId: missionResolvedRouteId,
            missionType: selectedMission ? selectedMission.id : null,
            mission: selectedMission,
            missionPrompts: missionPrompts,
            trialCredits: [],
            accessTier: getTierLabel(),
            credits: getCredits(),
            generatedAt: new Date().toISOString()
          };
        }

        function drupalPath(path) {
          if (Drupal && typeof Drupal.url === 'function') {
            return Drupal.url(path);
          }

          const baseUrl = ((((drupalSettings || {}).path || {}).baseUrl) || '/');
          return baseUrl.replace(/\/$/, '') + '/' + String(path || '').replace(/^\//, '');
        }

        function csrfToken() {
          return fetch(drupalPath('session/token'), {
            credentials: 'same-origin'
          }).then(function (response) {
            if (!response.ok) {
              throw new Error('CSRF token request failed');
            }
            return response.text();
          });
        }

        function saveEnterPayload(payload) {
          return csrfToken().then(function (token) {
            return fetch(drupalPath('ooh/enter-payload/save'), {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': token
              },
              body: JSON.stringify(payload)
            });
          }).then(function (response) {
            return response.json().then(function (data) {
              if (!response.ok || !data || data.success !== true) {
                throw new Error((data && data.error) || 'ENTER payload save failed');
              }
              return data;
            });
          });
        }
        function validatePayload(payload) {
          const missingFields = [];

          if (!payload.playlist || !payload.playlist.id || !payload.playlist.label) {
            missingFields.push('playlist');
          }
          if (!payload.path || !payload.path.id || !payload.path.label) {
            missingFields.push('path');
          }
          if (!payload.mission || !payload.mission.id || !payload.mission.label) {
            missingFields.push('mission');
          }
          if (!payload.routeId && !(payload.route && payload.route.id) && !(payload.campaignRoute && payload.campaignRoute.id)) {
            missingFields.push('route');
          }

          return {
            valid: missingFields.length === 0,
            missingFields: missingFields
          };
        }

        function showPayloadIncomplete() {
          const message = 'PAYLOAD INCOMPLETE // COMPLETE DOSSIER SELECTIONS';
          if (messageEl) {
            messageEl.textContent = message;
            return;
          }

          if (!enterBtn) {
            return;
          }

          enterBtn.textContent = message;
          if (payloadReadoutTimer) {
            window.clearTimeout(payloadReadoutTimer);
          }
          payloadReadoutTimer = window.setTimeout(function () {
            enterBtn.textContent = 'BEGIN';
            payloadReadoutTimer = null;
          }, 1800);
        }

        function escapeHtml(value) {
          return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        }

        if (overlayClose) {
          overlayClose.addEventListener('click', closeOverlay);
        }

        if (overlay) {
          overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
              closeOverlay();
            }
          });
        }

        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && overlay && !overlay.hidden) {
            closeOverlay();
          }
        });

        if (foundersLink) {
          foundersLink.addEventListener('click', function () {
            // Future extension point for logging or access workflows.
          });
        }

        if (enterBtn) {
          enterBtn.addEventListener('click', function () {
            if (!selectionsComplete()) {
              return;
            }

            if (selectedIncludesLockedTier()) {
              openOverlay();
              return;
            }
 
            const creditsTarget = (((settings.urls || {}).creditsTarget) || '').trim();
            if (getCredits() <= 0) {
              if (creditsTarget) {
                window.location.href = creditsTarget;
              }
              return;
            }

            const payload = buildPayload();
            const payloadValidation = validatePayload(payload);
            if (!payloadValidation.valid) {
              showPayloadIncomplete();
              return;
            }

            enterBtn.disabled = true;
            enterBtn.setAttribute('aria-disabled', 'true');

            saveEnterPayload(payload).then(function (savedPayload) {
              try {
                // Temporary continuity only: server save is the authority for this ENTER payload.
                window.localStorage.setItem(stateKey, JSON.stringify({
                  playlist: state.playlist,
                  path: state.path,
                  campaignRoute: payload.campaignRoute ? payload.campaignRoute.id : state.campaignRoute,
                  mission: state.mission,
                  selectedAttributes: payload.selectedAttributes,
                  payload: payload,
                  serverPayloadId: savedPayload.id,
                  serverPayloadUuid: savedPayload.uuid,
                  serverMissionUuid: savedPayload.missionUuid
                }));
              }
              catch (e) {}

              const enterTarget = (((settings.urls || {}).enterTarget) || '').trim();
              if (enterTarget) {
                window.location.href = enterTarget;
              }
            }).catch(function () {
              enterBtn.disabled = false;
              enterBtn.setAttribute('aria-disabled', 'false');
              if (messageEl) {
                messageEl.textContent = 'PAYLOAD SAVE FAILED // SERVER AUTHORITY UNAVAILABLE';
              }
            });
          });
        }

        refresh();
        logPlaylistDiagnostic('initialized', 'OOH playlist selection initialized');
      });
    }
  };

})(Drupal, once, drupalSettings);

