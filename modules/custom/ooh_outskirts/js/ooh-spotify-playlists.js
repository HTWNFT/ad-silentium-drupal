(function () {
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

  document.addEventListener('click', function (e) {

    const btn = e.target.closest('[data-ooh-playlist]');
    if (!btn) return;

    const spotifyUrl = btn.getAttribute('data-ooh-spotify');
    const shell = btn.closest('[data-ooh-generator]') || document;
    const playerWrap = shell.querySelector('[data-ooh-spotify-preview]');
    const player = shell.querySelector('[data-ooh-spotify-player]');
    const playerName = shell.querySelector('[data-ooh-spotify-name]');
    const embedUrl = spotifyEmbedUrl(spotifyUrl);

    if (!playerWrap || !player) {
      return;
    }

    if (player && embedUrl) {
      player.setAttribute('src', embedUrl);
    }

    if (playerName) {
      const title = btn.querySelector('.ooh-generator__option-title');
      playerName.textContent = title ? title.textContent : 'Playlist uplink active';
    }

    if (playerWrap) {
      playerWrap.hidden = !embedUrl;
    }

    console.log('Spotify loaded:', embedUrl || spotifyUrl);

  });
})();
