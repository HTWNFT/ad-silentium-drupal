(function (Drupal, once, drupalSettings) {
  'use strict';

  Drupal.behaviors.oohGameGenerator = {
    attach: function (context) {
      once('ooh-game-generator', '[data-ooh-generator]', context).forEach(function (root) {
        const settings = (((drupalSettings || {}).ooh_outskirts || {}).gameGenerator) || {};
        if (!settings || !settings.playlists || !settings.paths || !settings.missions) {
          return;
        }

        const storage = settings.storage || {};
        const stateKey = storage.stateKey || 'ooh_game_generator_state_v1';
        const accessKey = storage.accessKey || 'ooh_founders_access_v1';

        const summaryPlaylist = root.querySelector('[data-ooh-summary="playlist"]');
        const summaryPath = root.querySelector('[data-ooh-summary="path"]');
        const summaryMission = root.querySelector('[data-ooh-summary="mission"]');
        const summaryTier = root.querySelector('[data-ooh-summary="tier"]');
        const messageEl = root.querySelector('[data-ooh-message]');
        const enterBtn = root.querySelector('[data-ooh-enter]');
        const foundersLink = root.querySelector('[data-ooh-founders-link]');
        const overlay = root.querySelector('[data-ooh-locked-overlay]');
        const overlayClose = root.querySelector('[data-ooh-overlay-close]');

        const groupContainers = {
          playlist: root.querySelector('[data-ooh-group="playlist"]'),
          path: root.querySelector('[data-ooh-group="path"]'),
          mission: root.querySelector('[data-ooh-group="mission"]')
        };

        const accessSettings = settings.access || {};
        let foundersUnlocked = Boolean(accessSettings.foundersUnlocked);

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
          mission: null
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
          mission: settings.missions || []
        };

        function getTierLabel() {
          return foundersUnlocked ? 'Founder' : 'Visitor';
        }

        function saveState() {
          try {
            window.localStorage.setItem(stateKey, JSON.stringify(state));
          }
          catch (e) {}
        }

        function isItemLocked(item) {
          return item && item.tier === 'founder' && !foundersUnlocked;
        }

        function findItem(group, id) {
          const items = catalogs[group] || [];
          return items.find(function (item) {
            return item.id === id;
          }) || null;
        }

        function renderGroup(groupName, items) {
          const container = groupContainers[groupName];
          if (!container) {
            return;
          }

          container.innerHTML = '';

          items.forEach(function (item) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ooh-generator__option';
            button.setAttribute('data-ooh-option', groupName);
            button.setAttribute('data-id', item.id);
            button.setAttribute('data-tier', item.tier || 'free');

            if (isItemLocked(item)) {
              button.classList.add('is-locked');
              button.setAttribute('aria-label', item.label + ' locked');
            }

            if (state[groupName] === item.id) {
              button.classList.add('is-selected');
            }

            button.innerHTML =
              '<span class="ooh-generator__option-title">' + escapeHtml(item.label) + '</span>' +
              '<span class="ooh-generator__option-copy">' + escapeHtml(item.description || '') + '</span>' +
              '<span class="ooh-generator__option-tier">' + escapeHtml(item.tier || 'free') + '</span>';

            button.addEventListener('click', function () {
              if (isItemLocked(item)) {
                openOverlay();
                return;
              }

              state[groupName] = item.id;
              saveState();
              refresh();
            });

            container.appendChild(button);
          });
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
          return Boolean(state.playlist && state.path && state.mission);
        }

        function selectedIncludesLockedTier() {
          const selectedPlaylist = findItem('playlist', state.playlist);
          const selectedPath = findItem('path', state.path);
          const selectedMission = findItem('mission', state.mission);

          return [selectedPlaylist, selectedPath, selectedMission].some(function (item) {
            return item && item.tier === 'founder' && !foundersUnlocked;
          });
        }

        function updateSummary() {
          const selectedPlaylist = findItem('playlist', state.playlist);
          const selectedPath = findItem('path', state.path);
          const selectedMission = findItem('mission', state.mission);

          if (summaryPlaylist) {
            summaryPlaylist.textContent = selectedPlaylist ? selectedPlaylist.label : 'Unselected';
          }

          if (summaryPath) {
            summaryPath.textContent = selectedPath ? selectedPath.label : 'Unselected';
          }

          if (summaryMission) {
            summaryMission.textContent = selectedMission ? selectedMission.label : 'Unselected';
          }

          if (summaryTier) {
            summaryTier.textContent = getTierLabel();
          }
        }

        function updateEnterState() {
          const incompleteText = ((settings.labels || {}).enterIncomplete) || 'Select playlist, path, and mission.';
          const lockedText = ((settings.labels || {}).enterLocked) || 'Upgrade required for selected package.';
          const readyText = foundersUnlocked
            ? 'Full clearance confirmed. Ready to deploy.'
            : 'Visitor package ready. Restricted systems remain locked.';

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

          if (selectedIncludesLockedTier()) {
            enterBtn.disabled = true;
            enterBtn.setAttribute('aria-disabled', 'true');
            enterBtn.classList.add('is-disabled');
            if (messageEl) {
              messageEl.textContent = lockedText;
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
          root.querySelectorAll('[data-ooh-option]').forEach(function (button) {
            const groupName = button.getAttribute('data-ooh-option');
            const id = button.getAttribute('data-id');

            if (state[groupName] === id) {
              button.classList.add('is-selected');
            }
            else {
              button.classList.remove('is-selected');
            }
          });
        }

        function refresh() {
          renderGroup('playlist', catalogs.playlist);
          renderGroup('path', catalogs.path);
          renderGroup('mission', catalogs.mission);
          updateSummary();
          updateEnterState();
          updateSelectedClasses();
        }

        function buildPayload() {
          return {
            playlist: findItem('playlist', state.playlist),
            path: findItem('path', state.path),
            mission: findItem('mission', state.mission),
            accessTier: foundersUnlocked ? 'founder' : 'free',
            generatedAt: new Date().toISOString()
          };
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

            const payload = buildPayload();

            try {
              window.localStorage.setItem(stateKey, JSON.stringify({
                playlist: state.playlist,
                path: state.path,
                mission: state.mission,
                payload: payload
              }));
            }
            catch (e) {}

            if (window.console && typeof window.console.log === 'function') {
              console.log('OOH Game Generator payload:', payload);
            }

            const enterTarget = (((settings.urls || {}).enterTarget) || '').trim();
            if (enterTarget) {
              window.location.href = enterTarget;
            }
          });
        }

        refresh();
      });
    }
  };

})(Drupal, once, drupalSettings);