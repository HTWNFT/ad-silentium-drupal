(function (Drupal, once) {
  'use strict';

  function hashStringToUint32(str) {
    // FNV-1a-ish small hash
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function getUrlSeed() {
    const url = new URL(window.location.href);
    return url.searchParams.get('seed') || '';
  }

  function setUrlSeed(seed) {
    const url = new URL(window.location.href);
    url.searchParams.set('seed', seed);
    window.history.replaceState({}, '', url.toString());
  }

  function safeCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  Drupal.behaviors.oohDossier = {
    attach(context) {
      once('ooh-dossier', '[data-ooh-dossier]', context).forEach((root) => {
        const seedInput = root.querySelector('.ooh-seed-input');
        const btnGen = root.querySelector('.ooh-generate');
        const btnCopy = root.querySelector('.ooh-copy');
        const out = root.querySelector('.ooh-output');
        const permalink = root.querySelector('.ooh-permalink');

        const playPath = root.getAttribute('data-play-path') || '/';
        const defaultSeed = root.getAttribute('data-default-seed') || '';

        const names = ['Kowalski', 'Varrik', 'Nyx', 'Sable', 'Rook', 'Cipher', 'Mara', 'Vesper', 'Iris', 'Riven'];
        const callsigns = ['Ad Silentium', 'Warden-13', 'Signal Veil', 'Neon Ash', 'Cold Relay', 'Black Thread', 'Vault Whisper'];
        const affinities = ['AER (Air)', 'MARE (Ocean)', 'TERRA (Land)'];
        const roles = ['Recruiter', 'Scout', 'Handler', 'Salvager', 'Courier', 'Observer'];
        const traits = ['Calm under pressure', 'Hyper-aware', 'Silent mover', 'Systems intuition', 'Uncanny luck', 'No wasted motion'];
        const gear = ['Decoy Beacon', 'Signal Map', 'Rope launcher', 'Shock baton', 'Thin-veil cloak', 'EM pulse tag'];
        const missionTwists = [
          'INTERCEPT: objectives tick faster, bonus intel on clean run.',
          'DEBT: skip payment locks one upgrade slot until repaid.',
          'JAM: comms degrade; visuals stay clean but guidance is delayed.',
          'ECHO: enemy patrol order shifts mid-run.'
        ];

        function buildDossier(seedStr) {
          const seedU32 = hashStringToUint32(seedStr);
          const rng = mulberry32(seedU32);

          const dossier = {
            seed: seedStr,
            id: `OOH-${seedU32.toString(16).toUpperCase().padStart(8, '0')}`,
            name: pick(rng, names),
            callsign: pick(rng, callsigns),
            affinity: pick(rng, affinities),
            role: pick(rng, roles),
            trait: pick(rng, traits),
            starter: pick(rng, gear),
            twist: pick(rng, missionTwists),
          };

          return [
            `OUTSKIRTS OF HELL // RECRUITER DOSSIER`,
            `ID: ${dossier.id}`,
            `SEED: ${dossier.seed}`,
            ``,
            `NAME: ${dossier.name}`,
            `CALLSIGN: ${dossier.callsign}`,
            `PATH AFFINITY: ${dossier.affinity}`,
            `ROLE: ${dossier.role}`,
            ``,
            `TONE: ${dossier.trait}`,
            `STARTER ITEM: ${dossier.starter}`,
            ``,
            `SIGNATURE MISSION TWIST:`,
            `- ${dossier.twist}`,
          ].join('\n');
        }

        function ensureSeed() {
          const urlSeed = getUrlSeed();
          if (urlSeed) return urlSeed;
          if (defaultSeed) return defaultSeed;
          // stable-ish default
          return `seed-${Date.now()}`;
        }

        function render(seedStr) {
          seedInput.value = seedStr;
          setUrlSeed(seedStr);
          const text = buildDossier(seedStr);
          out.textContent = text;
          permalink.textContent = window.location.href;

          // push seed into play link
          const playUrl = new URL(playPath, window.location.origin);
          playUrl.searchParams.set('seed', seedStr);
          const playLink = root.querySelector('.ooh-play-link');
          if (playLink) playLink.href = playUrl.toString();
        }

        // init
        render(ensureSeed());

        btnGen.addEventListener('click', () => {
          const seedStr = (seedInput.value || '').trim() || `seed-${Date.now()}`;
          render(seedStr);
        });

        btnCopy.addEventListener('click', async () => {
          try {
            await safeCopy(out.textContent || '');
            btnCopy.textContent = 'Copied';
            setTimeout(() => (btnCopy.textContent = 'Copy'), 900);
          } catch (e) {
            btnCopy.textContent = 'Copy failed';
            setTimeout(() => (btnCopy.textContent = 'Copy'), 1200);
          }
        });
      });
    }
  };
})(Drupal, once);
