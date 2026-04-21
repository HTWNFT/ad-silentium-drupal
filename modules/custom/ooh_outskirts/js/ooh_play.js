(function (Drupal, once) {
  'use strict';

  function parseOptions(raw) {
    return String(raw || '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split('|');
        return {
          value: (parts[0] || '').trim(),
          label: (parts[1] || parts[0] || '').trim(),
        };
      })
      .filter(item => item.value && item.label);
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    }
    catch (e) {
      return fallback;
    }
  }

  function renderChoices(container, options, selectedValue) {
    container.innerHTML = '';
    options.forEach((option) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ooh-btn ooh-stage2__choice';
      btn.dataset.value = option.value;
      btn.textContent = option.label;

      if (option.value === selectedValue) {
        btn.classList.add('is-active');
      }

      container.appendChild(btn);
    });
  }

  function findLabel(options, value) {
    const match = options.find(item => item.value === value);
    return match ? match.label : 'Unselected';
  }

  Drupal.behaviors.oohPlayStage2 = {
    attach(context) {
      once('ooh-play-stage2', '[data-ooh-play]', context).forEach((root) => {
        const storageKey = 'ooh_stage2_profile_v1';

        const seed = root.getAttribute('data-seed') || '';
        const playlistOptions = parseOptions(root.getAttribute('data-playlist-options'));
        const recruiterOptions = parseOptions(root.getAttribute('data-recruiter-options'));
        const missionOptions = parseOptions(root.getAttribute('data-mission-options'));

        const playlistWrap = root.querySelector('[data-ooh-choice-group="playlist"]');
        const recruiterWrap = root.querySelector('[data-ooh-choice-group="recruiter"]');
        const missionWrap = root.querySelector('[data-ooh-choice-group="mission"]');

        const summaryPlaylist = root.querySelector('[data-ooh-summary-playlist]');
        const summaryRecruiter = root.querySelector('[data-ooh-summary-recruiter]');
        const summaryMission = root.querySelector('[data-ooh-summary-mission]');

        const btnAssemble = root.querySelector('[data-ooh-assemble]');
        const btnReset = root.querySelector('[data-ooh-reset]');
        const assembledWrap = root.querySelector('[data-ooh-assembled]');
        const assembledOutput = root.querySelector('[data-ooh-assembled-output]');
        const overlay = root.querySelector('.ooh-generator__overlay');
        const closeBtn = root.querySelector('#close-modal');
        const saved = safeJsonParse(localStorage.getItem(storageKey), {});
        const state = {
          seed: seed || saved.seed || '',
          playlist: saved.playlist || '',
          recruiter: saved.recruiter || '',
          mission: saved.mission || '',
        };

        function persist() {
          localStorage.setItem(storageKey, JSON.stringify(state));
        }

        function refreshUI() {
          renderChoices(playlistWrap, playlistOptions, state.playlist);
          renderChoices(recruiterWrap, recruiterOptions, state.recruiter);
          renderChoices(missionWrap, missionOptions, state.mission);

          summaryPlaylist.textContent = findLabel(playlistOptions, state.playlist);
          summaryRecruiter.textContent = findLabel(recruiterOptions, state.recruiter);
          summaryMission.textContent = findLabel(missionOptions, state.mission);
        }

        function bindChoiceClicks(container, key) {
          container.addEventListener('click', (event) => {
            const btn = event.target.closest('.ooh-stage2__choice');
            if (!btn) {
              return;
            }
            state[key] = btn.dataset.value || '';
            persist();
            refreshUI();
          });
        }

        bindChoiceClicks(playlistWrap, 'playlist');
        bindChoiceClicks(recruiterWrap, 'recruiter');
        bindChoiceClicks(missionWrap, 'mission');
        
        if (closeBtn && overlay) {
          closeBtn.addEventListener('click', () => {
            overlay.style.opacity = '0';

            window.setTimeout(() => {
              overlay.hidden = true;
              overlay.style.opacity = '';
            }, 300);
          });
        } 
        
        btnAssemble.addEventListener('click', () => {
          if (!state.playlist || !state.recruiter || !state.mission) {
            assembledWrap.hidden = false;
            assembledOutput.textContent = 'INCOMPLETE PROFILE\n\nSelect a playlist, recruiter, and mission type before entering.';
            return;
          }

          const payload = {
            seed: state.seed || 'no-seed',
            playlist_type: state.playlist,
            recruiter: state.recruiter,
            mission_type: state.mission,
          };

          persist();
          assembledWrap.hidden = false;
          assembledOutput.textContent = [
            'OUTSKIRTS OF HELL // SESSION ASSEMBLED',
            '',
            `SEED: ${payload.seed}`,
            `PLAYLIST: ${findLabel(playlistOptions, payload.playlist_type)}`,
            `RECRUITER: ${findLabel(recruiterOptions, payload.recruiter)}`,
            `MISSION: ${findLabel(missionOptions, payload.mission_type)}`,
            '',
            'STATUS: READY FOR NEXT LAYER',
          ].join('\n');
        });

        btnReset.addEventListener('click', () => {
          state.playlist = '';
          state.recruiter = '';
          state.mission = '';
          persist();
          assembledWrap.hidden = true;
          assembledOutput.textContent = '';
          refreshUI();
        });

        refreshUI();
      });
    }
  };
})(Drupal, once);

document.addEventListener("DOMContentLoaded", function () {
  const closeBtn = document.getElementById("close-modal");
  const modal = document.querySelector(".your-modal-class"); // update this

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });
  }
});  }
});