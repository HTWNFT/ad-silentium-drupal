(function (Drupal, once, drupalSettings) {
  'use strict';

  Drupal.behaviors.oohHeroCarousel = {
    attach(context) {
      const heroRoots = once('ooh-hero-carousel', '[data-ooh-hero]', context);
      if (!heroRoots.length) {
        return;
      }

      const settings = drupalSettings?.ooh_outskirts || {};
      const slides = Array.isArray(settings.heroSlides) ? settings.heroSlides.filter(Boolean) : [];
      const intervalMs = Math.max(1800, Number(settings.heroIntervalMs) || 6500);
      const prologueSettings = settings.prologue || {};

      heroRoots.forEach((hero) => {
        initHero(hero, slides, intervalMs, prologueSettings);
      });
    }
  };

  function initHero(hero, slides, intervalMs, prologueSettings) {
    if (!slides.length) {
      return;
    }

    document.body.classList.add('ooh-landing-active', 'ooh-neon-mode');
    hero.classList.add('ooh-overlay-root');

    const videoA = hero.querySelector('[data-ooh-video="A"]');
    const videoB = hero.querySelector('[data-ooh-video="B"]');
    const titleEl = hero.querySelector('[data-ooh-title]');
    const taglineEl = hero.querySelector('[data-ooh-tagline]');
    const ctaEl = hero.querySelector('[data-ooh-cta]');
    const prologueOpenBtn = hero.querySelector('[data-ooh-prologue-open]');
    const dotsEl = hero.querySelector('[data-ooh-dots]');
    const ambientAudio = hero.querySelector('#ooh-ambient-wind');

    if (!videoA || !videoB || !titleEl || !taglineEl || !ctaEl) {
      return;
    }

    injectMatrixRail(hero);
    injectSigilVeil(hero);

    ctaEl.setAttribute('data-ooh-action', 'enter');
    ctaEl.setAttribute('href', '#');
    ctaEl.setAttribute('aria-disabled', 'true');

    if (prologueOpenBtn) {
      prologueOpenBtn.setAttribute('data-ooh-action', 'prologue');
    }

    let currentIndex = 0;
    let activeVideo = videoA;
    let inactiveVideo = videoB;
    let timerId = null;
    let isPaused = false;

    renderSlide(currentIndex, activeVideo, true);
    buildDots();
    startTimer();
    setupAmbientAudio(ambientAudio);

    hero.addEventListener('mouseenter', pauseTimer);
    hero.addEventListener('mouseleave', startTimer);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseTimer();
      }
      else {
        startTimer();
        if (ambientAudio && ambientAudio.dataset.oohPrimed === '1') {
          safePlayAudio(ambientAudio);
        }
      }
    });

    setupPrologue(hero, prologueSettings, {
      pauseTimer,
      startTimer
    });

    ctaEl.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      safePlayAudio(ambientAudio);

      if (prologueOpenBtn) {
        prologueOpenBtn.click();
      }
    });

    function normalizeSlide(slide) {
      return {
        src: typeof slide.src === 'string' ? slide.src : '',
        href: typeof slide.href === 'string' && slide.href.length ? slide.href : '#',
        title: typeof slide.title === 'string' && slide.title.length ? slide.title : 'AD SILENTIUM',
        tagline: typeof slide.tagline === 'string' ? slide.tagline : ''
      };
    }

    function renderText(slide) {
      titleEl.textContent = slide.title;
      taglineEl.textContent = slide.tagline || '';
      ctaEl.setAttribute('href', '#');
      ctaEl.setAttribute('data-ooh-future-href', slide.href);
    }

    function setVideoSource(video, src) {
      if (!src) {
        return;
      }

      const currentSrc = video.getAttribute('src') || '';
      if (currentSrc !== src) {
        video.pause();
        video.setAttribute('src', src);
        video.load();
      }

      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Ignore autoplay failures on muted background video.
        });
      }
    }

    function renderSlide(index, targetVideo, immediate) {
      const slide = normalizeSlide(slides[index]);
      renderText(slide);
      setVideoSource(targetVideo, slide.src);
      syncDots(index);

      if (immediate) {
        videoA.classList.toggle('is-active', targetVideo === videoA);
        videoB.classList.toggle('is-active', targetVideo === videoB);
      }
    }

    function crossfadeTo(index) {
      if (index === currentIndex || index < 0 || index >= slides.length) {
        return;
      }

      currentIndex = index;
      const nextSlide = normalizeSlide(slides[currentIndex]);

      renderText(nextSlide);
      setVideoSource(inactiveVideo, nextSlide.src);
      syncDots(currentIndex);

      inactiveVideo.classList.add('is-active');
      activeVideo.classList.remove('is-active');

      const previousActive = activeVideo;
      activeVideo = inactiveVideo;
      inactiveVideo = previousActive;
    }

    function nextSlide() {
      const nextIndex = (currentIndex + 1) % slides.length;
      crossfadeTo(nextIndex);
    }

    function pauseTimer() {
      isPaused = true;
      if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
    }

    function startTimer() {
      if (slides.length <= 1) {
        return;
      }
      if (!isPaused && timerId) {
        return;
      }

      isPaused = false;

      if (timerId) {
        window.clearInterval(timerId);
      }

      timerId = window.setInterval(nextSlide, intervalMs);
    }

    function buildDots() {
      if (!dotsEl) {
        return;
      }

      dotsEl.innerHTML = '';
      slides.forEach((slide, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'ooh-dot' + (index === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', `Slide ${index + 1}`);
        dot.addEventListener('click', () => {
          pauseTimer();
          crossfadeTo(index);
          startTimer();
        });
        dotsEl.appendChild(dot);
      });
    }

    function syncDots(activeIndex) {
      if (!dotsEl) {
        return;
      }

      const dots = dotsEl.querySelectorAll('.ooh-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === activeIndex);
      });
    }
  }

  function setupAmbientAudio(ambientAudio) {
    if (!ambientAudio) {
      return;
    }

    ambientAudio.volume = 0.18;
    ambientAudio.loop = true;
    ambientAudio.preload = 'auto';
    ambientAudio.setAttribute('playsinline', 'playsinline');

    const primeAmbient = () => {
      if (ambientAudio.dataset.oohPrimed === '1') {
        safePlayAudio(ambientAudio);
        return;
      }

      ambientAudio.dataset.oohPrimed = '1';
      safePlayAudio(ambientAudio);
    };

    const primeOnceOptions = { passive: true, once: true };

    document.addEventListener('pointerdown', primeAmbient, primeOnceOptions);
    document.addEventListener('touchstart', primeAmbient, primeOnceOptions);
    document.addEventListener('keydown', primeAmbient, { once: true });

    ambientAudio.addEventListener('ended', () => {
      safePlayAudio(ambientAudio);
    });
  }

  function safePlayAudio(ambientAudio) {
    if (!ambientAudio) {
      return;
    }

    const playPromise = ambientAudio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Wait for the next user gesture.
      });
    }
  }

  function injectMatrixRail(hero) {
    const copy = hero.querySelector('.ooh-hero__copy');
    const kicker = hero.querySelector('.ooh-hero__kicker');

    if (!copy || !kicker || copy.querySelector('.ooh-matrix-rail')) {
      return;
    }

    const rail = document.createElement('div');
    rail.className = 'ooh-matrix-rail';
    rail.setAttribute('aria-hidden', 'true');
    copy.insertBefore(rail, kicker);

    const glyphs = '01<>[]{}#/\\=+-*ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const width = 44;

    const tick = () => {
      let row = '';
      for (let i = 0; i < width; i += 1) {
        row += glyphs.charAt(Math.floor(Math.random() * glyphs.length));
      }
      rail.textContent = row;
    };

    tick();
    window.setInterval(tick, 120);
  }

  function injectSigilVeil(hero) {
    const copy = hero.querySelector('.ooh-hero__copy');
    if (!copy || copy.querySelector('.ooh-sigil-veil')) {
      return;
    }

    const veil = document.createElement('div');
    veil.className = 'ooh-sigil-veil';
    veil.setAttribute('aria-hidden', 'true');
    copy.insertBefore(veil, copy.firstChild);
  }

  function setupPrologue(hero, prologueSettings, controls) {
    const prologue = document.querySelector('[data-ooh-prologue]');
    if (!prologue) {
      return;
    }

    const openBtn = hero.querySelector('[data-ooh-prologue-open]');
    const panel = prologue.querySelector('[data-ooh-prologue-panel]');
    const viewportEl = prologue.querySelector('[data-ooh-prologue-viewport]');
    const kickerEl = prologue.querySelector('[data-ooh-prologue-kicker]');
    const titleEl = prologue.querySelector('[data-ooh-prologue-title]');
    const bodyEl = prologue.querySelector('[data-ooh-prologue-body]');
    const enterBtn = prologue.querySelector('[data-ooh-prologue-enter]');
    const skipBtn = prologue.querySelector('[data-ooh-prologue-skip]');
    const replayBtn = prologue.querySelector('[data-ooh-prologue-replay]');
    const closeTargets = prologue.querySelectorAll('[data-ooh-prologue-close], [data-ooh-prologue-close-btn]');

    const enabled = Boolean(prologueSettings.enabled);
    const autoOpen = Boolean(prologueSettings.autoOpen);
    const autoDelayMs = Math.max(0, Number(prologueSettings.autoDelayMs) || 0);
    const storageKey = typeof prologueSettings.storageKey === 'string' && prologueSettings.storageKey.length
      ? prologueSettings.storageKey
      : 'ooh_prologue_seen_v3';

    const paragraphs = Array.isArray(prologueSettings.paragraphs)
      ? prologueSettings.paragraphs.filter((item) => typeof item === 'string' && item.trim().length)
      : [];

    if (!enabled) {
      prologue.hidden = true;
      return;
    }

    if (kickerEl) {
      kickerEl.textContent = typeof prologueSettings.kicker === 'string'
        ? prologueSettings.kicker
        : 'Outskirts of Hell';
    }

    if (titleEl) {
      titleEl.textContent = typeof prologueSettings.title === 'string'
        ? prologueSettings.title
        : 'Ad Silentium';
    }

    if (bodyEl) {
      bodyEl.innerHTML = paragraphs
        .map((paragraph) => `<p class="ooh-prologue__text">${escapeHtml(paragraph)}</p>`)
        .join('');
    }

    if (openBtn) {
      openBtn.addEventListener('click', () => openPrologue(false, false));
    }

    closeTargets.forEach((node) => {
      node.addEventListener('click', () => closePrologue(true));
    });

    if (enterBtn) {
      enterBtn.addEventListener('click', (event) => {
        event.preventDefault();
        closePrologue(true);
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => closePrologue(true));
    }

    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        restartCrawl();
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !prologue.hidden) {
        closePrologue(true);
      }
    });

    const hasSeen = safeStorageGet(storageKey) === '1';
    if (autoOpen && !hasSeen) {
      window.setTimeout(() => {
        openPrologue(true, false);
      }, autoDelayMs);
    }

    function openPrologue(fromAutoOpen, forceReplay) {
      prologue.hidden = false;
      document.body.classList.add('ooh-prologue-open');
      controls.pauseTimer();

      if (fromAutoOpen) {
        safeStorageSet(storageKey, '1');
      }

      if (forceReplay) {
        restartCrawl();
      }
      else {
        prologue.classList.add('is-open');
        restartCrawl();
      }

      if (panel) {
        window.setTimeout(() => {
          panel.focus();
        }, 20);
      }
    }

    function closePrologue(markSeen) {
      prologue.hidden = true;
      prologue.classList.remove('is-open', 'is-crawl');
      document.body.classList.remove('ooh-prologue-open');
      controls.startTimer();

      if (markSeen) {
        safeStorageSet(storageKey, '1');
      }
    }

    function restartCrawl() {
      if (!bodyEl) {
        return;
      }

      const viewportHeight = viewportEl ? viewportEl.clientHeight : 520;
      const bodyHeight = bodyEl.scrollHeight || bodyEl.offsetHeight || 800;
      const travelDistance = Math.max(bodyHeight + viewportHeight + 120, 1200);
      const durationSeconds = Math.max(18, Math.round(travelDistance / 38));

      bodyEl.scrollTop = 0;
      prologue.classList.remove('is-crawl');
      void prologue.offsetWidth;

      prologue.style.setProperty('--ooh-crawl-duration', `${durationSeconds}s`);
      bodyEl.style.setProperty('--ooh-crawl-from', '0px');
      bodyEl.style.setProperty('--ooh-crawl-to', `${-(bodyHeight + viewportHeight)}px`);

      prologue.classList.add('is-open', 'is-crawl');
    }
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    }
    catch (error) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    }
    catch (error) {
      // Ignore storage failures.
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

})(Drupal, once, drupalSettings);