(function (Drupal, drupalSettings) {
  const baseHref = (document.querySelector('base') && document.querySelector('base').href) ? document.querySelector('base').href : '';
  const baseRoot = baseHref || (window.location.origin + (drupalSettings.path && drupalSettings.path.basePath ? drupalSettings.path.basePath : '/'));
  const loopsBase = baseRoot.replace(/\/$/, '') + '/sites/default/files/outskirts/loops/';

const baseUrl =
  (drupalSettings && drupalSettings.path && drupalSettings.path.baseUrl)
    ? drupalSettings.path.baseUrl
    : '/';


  function safePlay(video) {
  

    const p = video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  Drupal.behaviors.oohHeroCarousel = {
    attach: function (context) {
      const root = context.querySelector(".ooh-hero[data-ooh-hero]");
      if (!root || root.dataset.oohInit === "1") return;
      root.dataset.oohInit = "1";

      const slides = (drupalSettings.ooh_outskirts && drupalSettings.ooh_outskirts.heroSlides) || [];
      const intervalMs = (drupalSettings.ooh_outskirts && drupalSettings.ooh_outskirts.heroIntervalMs) || 6500;
      if (!slides.length) return;

      const vA = root.querySelector("[data-ooh-video='A']");
      const vB = root.querySelector("[data-ooh-video='B']");
      const titleEl = root.querySelector("[data-ooh-title]");
      const tagEl = root.querySelector("[data-ooh-tagline]");
      const ctaEl = root.querySelector("[data-ooh-cta]");
      const pauseBtn = root.querySelector("[data-ooh-pause]");
      const dotsWrap = root.querySelector("[data-ooh-dots]");

      let active = vA;
      let standby = vB;
      let idx = 0;
      let timer = null;
      let paused = false;

      function renderDots() {
        dotsWrap.innerHTML = "";
        slides.forEach((s, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "ooh-dot" + (i === idx ? " is-active" : "");
          b.addEventListener("click", () => goTo(i, true));
          dotsWrap.appendChild(b);
        });
      }

      function setText(i) {
        const s = slides[i];
        titleEl.textContent = s.title || "";
        tagEl.textContent = s.tagline || "";
        if (s.href) {
          ctaEl.href = s.href;
          ctaEl.style.display = "";
        } else {
          ctaEl.style.display = "none";
        }
      }

      function loadInto(video, src) {
  let resolved = src || '';

  const marker = '/sites/default/files/outskirts/loops/';
  const at = resolved.indexOf(marker);

  // If src already contains /sites/default/files/outskirts/loops/, strip to filename and rebuild with base path.
  if (at !== -1) {
    const filename = resolved.substring(at + marker.length);
    resolved = loopsBase + filename;
  }
  // If it starts with /sites/... (root-relative), make it base-path aware.
  else if (resolved.startsWith('/sites/')) {
    else if (resolved.startsWith('/sites/')) {
  resolved = baseRoot.replace(/\/$/, '') + resolved;
}

  // If it’s just a filename, prepend loopsBase.
  else if (!resolved.includes('/') && resolved.endsWith('.mp4')) {
    resolved = loopsBase + resolved;
  }

  if (video.dataset.src === resolved) return;
  video.dataset.src = resolved;
  video.src = resolved;
  video.load();
}


})(Drupal, drupalSettings);
(function (Drupal, drupalSettings) {
  function initPrologue(root, ctaEl) {
    const settings = (drupalSettings.ooh_outskirts || {});
    const pro = settings.prologue || {};
    if (!pro.enabled) return;

    const KEY = pro.storageKey || "ooh_prologue_seen";
    const modal = document.querySelector("[data-ooh-prologue]");
    if (!modal) return;

    const openBtn = root.querySelector("[data-ooh-prologue-open]");
    const closeBackdrop = modal.querySelector("[data-ooh-prologue-close]");
    const closeBtn = modal.querySelector("[data-ooh-prologue-close-btn]");
    const skipBtn = modal.querySelector("[data-ooh-prologue-skip]");
    const enterBtn = modal.querySelector("[data-ooh-prologue-enter]");

    const kickerEl = modal.querySelector("[data-ooh-prologue-kicker]");
    const titleEl  = modal.querySelector("[data-ooh-prologue-title]");
    const bodyEl   = modal.querySelector("[data-ooh-prologue-body]");

    let pendingHref = null;
    let autoTimer = null;
    let autoCanceled = false;

    function hasSeen() {
      return localStorage.getItem(KEY) === "1";
    }

    function markSeen() {
      localStorage.setItem(KEY, "1");
    }

    function render() {
      kickerEl.textContent = pro.kicker || "OUTSKIRTS OF HELL";
      titleEl.textContent = pro.title || "AD SILENTIUM";
      const paras = pro.paragraphs || [];
      bodyEl.innerHTML = paras.map(t => `<p>${escapeHtml(t)}</p>`).join("");
    }

    function open(hrefOrNull) {
      pendingHref = hrefOrNull || null;
      render();
      modal.hidden = false;
      modal.classList.add("is-open");
      root.classList.add("is-dimmed");
    }

    function close() {
      modal.classList.remove("is-open");
      modal.hidden = true;
      root.classList.remove("is-dimmed");
      pendingHref = null;
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    // Intercept hero Enter
    if (ctaEl) {
      ctaEl.addEventListener("click", (e) => {
        if (!hasSeen()) {
          e.preventDefault();
          autoCanceled = true;
          open(ctaEl.getAttribute("href"));
        }
      });
    }

    // Manual open
    if (openBtn) openBtn.addEventListener("click", () => open(null));

    // Close actions
    [closeBackdrop, closeBtn].forEach(el => {
      if (el) el.addEventListener("click", () => close());
    });

    // Skip: mark seen, close, do NOT navigate
    if (skipBtn) skipBtn.addEventListener("click", () => {
      markSeen();
      close();
    });

    // Enter: mark seen, navigate if we came from CTA
    if (enterBtn) enterBtn.addEventListener("click", () => {
      markSeen();
      const go = pendingHref;
      close();
      if (go) window.location.href = go;
    });

    // Esc closes
    document.addEventListener("keydown", (e) => {
      if (!modal.hidden && e.key === "Escape") close();
    });

    // Optional auto-open after delay (dissolve into prologue)
    if (pro.autoOpen && !hasSeen()) {
      const delay = Number(pro.autoDelayMs || 2400);
      const cancel = () => { autoCanceled = true; if (autoTimer) clearTimeout(autoTimer); };

      // If user interacts, don't auto-popup
      window.addEventListener("pointerdown", cancel, { once: true });
      window.addEventListener("keydown", cancel, { once: true });

      autoTimer = setTimeout(() => {
        if (!autoCanceled && !hasSeen()) open(null);
      }, delay);
    }
  }

  // Call this from your existing behavior once hero elements exist:
  Drupal.behaviors.oohHeroCarouselPrologue = {
    attach: function (context) {
      const root = context.querySelector(".ooh-hero[data-ooh-hero]");
      if (!root || root.dataset.oohPrologueInit === "1") return;
      root.dataset.oohPrologueInit = "1";

      const ctaEl = root.querySelector("[data-ooh-cta]");
      initPrologue(root, ctaEl);
    }
  };
})(Drupal, drupalSettings);
